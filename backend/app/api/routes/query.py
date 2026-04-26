from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.redis_client import get_redis
from app.models.query import QueryRequest
from app.services.rag_service import stream_rag_response

router = APIRouter()


@router.post("")
async def query(request: QueryRequest):
    redis = await get_redis()
    return StreamingResponse(
        stream_rag_response(
            query=request.query,
            session_id=request.session_id,
            top_k=request.top_k,
            redis=redis,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
