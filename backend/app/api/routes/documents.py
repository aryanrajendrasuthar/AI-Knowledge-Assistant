# Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.
# Proprietary and confidential. Unauthorized use prohibited.
import json
import time

from fastapi import APIRouter, File, HTTPException, UploadFile
from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.core.config import settings
from app.core.qdrant_client import get_qdrant
from app.core.redis_client import get_redis
from app.models.document import DocumentListResponse, DocumentMeta, UploadResponse
from app.services.ingestion_service import ingest

router = APIRouter()

DOCS_KEY = "docs:registry"
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type. Allowed: PDF, TXT, DOCX.")

    data = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(413, f"File exceeds {settings.max_upload_size_mb} MB limit.")

    qdrant = get_qdrant()
    redis = await get_redis()

    try:
        result = await ingest(qdrant, settings.qdrant_collection, file.filename, data)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        raise HTTPException(500, f"Ingestion failed: {e}")

    meta = {
        "doc_id": result["doc_id"],
        "name": result["name"],
        "size": len(data),
        "chunks": result["chunks"],
        "uploaded_at": str(int(time.time())),
    }
    await redis.hset(DOCS_KEY, result["doc_id"], json.dumps(meta))

    return UploadResponse(
        doc_id=result["doc_id"],
        name=result["name"],
        chunks=result["chunks"],
        message="Document ingested successfully.",
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents():
    redis = await get_redis()
    raw = await redis.hgetall(DOCS_KEY)
    docs = [DocumentMeta(**json.loads(v)) for v in raw.values()]
    docs.sort(key=lambda d: d.uploaded_at, reverse=True)
    return DocumentListResponse(documents=docs, total=len(docs))


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    redis = await get_redis()
    if not await redis.hexists(DOCS_KEY, doc_id):
        raise HTTPException(404, "Document not found.")

    await redis.hdel(DOCS_KEY, doc_id)

    # Remove matching vectors from Qdrant
    qdrant = get_qdrant()
    try:
        qdrant.delete(
            collection_name=settings.qdrant_collection,
            points_selector=Filter(
                must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
            ),
        )
    except Exception:
        pass  # Collection may not exist yet

    return {"message": "Document deleted."}
