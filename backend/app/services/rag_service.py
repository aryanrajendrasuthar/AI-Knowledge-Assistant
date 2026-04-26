import hashlib
import json
from typing import AsyncGenerator

import redis.asyncio as aioredis
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.core.config import settings
from app.core.qdrant_client import get_qdrant

SYSTEM_PROMPT = (
    "You are a knowledgeable AI assistant. Answer questions based strictly on the "
    "provided context documents. Be accurate and concise. Cite which source documents "
    "you used. If the context lacks enough information to answer, say so clearly."
)


def _cache_key(query: str) -> str:
    return f"rag:q:{hashlib.sha256(query.lower().strip().encode()).hexdigest()}"


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def stream_rag_response(
    query: str,
    session_id: str,
    top_k: int,
    redis: aioredis.Redis,
) -> AsyncGenerator[str, None]:
    key = _cache_key(query)

    # Cache hit — stream cached answer instantly
    cached = await redis.get(key)
    if cached:
        data = json.loads(cached)
        yield _sse({"type": "token", "content": data["answer"]})
        yield _sse({"type": "sources", "sources": data["sources"]})
        yield _sse({"type": "done", "cached": True})
        return

    # Retrieve relevant chunks from Qdrant
    qdrant = get_qdrant()
    try:
        results = qdrant.query(
            collection_name=settings.qdrant_collection,
            query_text=query,
            limit=top_k,
        )
    except Exception:
        yield _sse({"type": "error", "message": "No documents indexed yet. Upload documents first."})
        return

    if not results:
        yield _sse({"type": "error", "message": "No relevant content found for your query."})
        return

    sources = [
        {
            "document": r.metadata.get("document", "unknown"),
            "chunk_index": r.metadata.get("chunk_index", 0),
        }
        for r in results
    ]
    context = "\n\n---\n\n".join(
        f"[Source: {r.metadata.get('document', 'unknown')}]\n{r.document}"
        for r in results
    )

    # Build and stream LLM response
    llm = ChatGroq(
        model="llama-3.1-70b-versatile",
        api_key=settings.groq_api_key,
        temperature=0.1,
        streaming=True,
    )
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {query}"),
    ]

    full_answer = ""
    try:
        async for chunk in llm.astream(messages):
            token = chunk.content
            if token:
                full_answer += token
                yield _sse({"type": "token", "content": token})
    except Exception as e:
        yield _sse({"type": "error", "message": f"LLM error: {str(e)}"})
        return

    yield _sse({"type": "sources", "sources": sources})
    yield _sse({"type": "done", "cached": False})

    # Cache the response
    if full_answer:
        await redis.setex(
            key,
            settings.redis_ttl,
            json.dumps({"answer": full_answer, "sources": sources}),
        )
