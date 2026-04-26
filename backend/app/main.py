from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import documents, health, query
from app.core.config import settings
from app.core.qdrant_client import ensure_collection, get_qdrant
from app.core.redis_client import close_redis, get_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    qdrant = get_qdrant()
    ensure_collection(qdrant, settings.qdrant_collection)
    await get_redis()
    print(f"Starting {settings.app_name} [{settings.environment}]")
    yield
    await close_redis()
    print("Shutting down...")


app = FastAPI(
    title="AI Knowledge Assistant API",
    description="Production-grade RAG system — upload documents, ask questions, get cited answers.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(query.router, prefix="/query", tags=["query"])
