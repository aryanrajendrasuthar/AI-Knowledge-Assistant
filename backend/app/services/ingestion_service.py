import io
import uuid

import fitz  # PyMuPDF
from docx import Document as DocxDocument
from qdrant_client import QdrantClient

from app.core.qdrant_client import ensure_collection

CHUNK_SIZE = 500
OVERLAP = 50


def _parse(filename: str, data: bytes) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        doc = fitz.open(stream=data, filetype="pdf")
        return "\n".join(page.get_text() for page in doc)
    if name.endswith(".docx"):
        doc = DocxDocument(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return data.decode("utf-8", errors="ignore")


def _chunk(text: str) -> list[str]:
    text = text.strip()
    chunks, start = [], 0
    while start < len(text):
        chunk = text[start : start + CHUNK_SIZE].strip()
        if chunk:
            chunks.append(chunk)
        start += CHUNK_SIZE - OVERLAP
    return chunks


async def ingest(
    client: QdrantClient,
    collection: str,
    filename: str,
    data: bytes,
) -> dict:
    text = _parse(filename, data)
    chunks = _chunk(text)
    if not chunks:
        raise ValueError("No text could be extracted from the document.")

    ensure_collection(client, collection)

    doc_id = str(uuid.uuid4())
    metadata = [
        {"document": filename, "doc_id": doc_id, "chunk_index": i}
        for i in range(len(chunks))
    ]

    client.add(
        collection_name=collection,
        documents=chunks,
        metadata=metadata,
    )

    return {"doc_id": doc_id, "name": filename, "chunks": len(chunks)}
