from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.app_name} API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": "1.0.0",
        "environment": settings.environment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
