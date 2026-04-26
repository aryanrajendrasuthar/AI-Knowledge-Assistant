from functools import lru_cache

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from app.core.config import settings

EMBED_MODEL = "BAAI/bge-small-en-v1.5"
EMBED_DIM = 384


@lru_cache(maxsize=1)
def get_qdrant() -> QdrantClient:
    client = QdrantClient(
        url=settings.qdrant_url,
        api_key=settings.qdrant_api_key or None,
    )
    client.set_model(EMBED_MODEL)
    return client


def ensure_collection(client: QdrantClient, collection: str) -> None:
    existing = {c.name for c in client.get_collections().collections}
    if collection not in existing:
        try:
            vector_params = client.get_fastembed_vector_params()
        except AttributeError:
            vector_params = {"fast-dense": VectorParams(size=EMBED_DIM, distance=Distance.COSINE)}
        client.create_collection(collection_name=collection, vectors_config=vector_params)
