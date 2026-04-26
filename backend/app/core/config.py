# Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.
# Proprietary and confidential. Unauthorized use prohibited.
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "AI Knowledge Assistant"
    environment: str = "development"

    groq_api_key: str = ""

    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_collection: str = "documents"

    redis_url: str = "redis://localhost:6379"
    redis_ttl: int = 3600

    allowed_origins: list[str] = ["http://localhost:3000"]
    max_upload_size_mb: int = 50


settings = Settings()
