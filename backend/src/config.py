import json
import os
import json
from pathlib import Path
from typing import Any, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

class Settings(BaseSettings):
    env: str = Field(default="development")
    app_name: str = Field(default="movie-madders-api")
    log_level: str = Field(default="INFO")
    # Example: postgresql+asyncpg://user:pass@localhost:5432/moviemadders
    database_url: Union[str, None] = Field(default=None)
    export_openapi_on_startup: bool = Field(default=False)

    # CORS Origins - Configured via CORS_ORIGINS environment variable
    # Default: "http://localhost:3000" (safe fallback for local development)
    # See .env.example for configuration examples
    # Stored as string, parsed to list in model_post_init
    cors_origins_str: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")

    # JWT/Auth settings
    jwt_secret_key: str = Field(default=os.getenv("JWT_SECRET_KEY", "dev-secret-change-me"))
    jwt_algorithm: str = Field(default=os.getenv("JWT_ALGORITHM", "HS256"))
    access_token_exp_minutes: int = Field(default=int(os.getenv("ACCESS_TOKEN_EXP_MINUTES", "30")))
    refresh_token_exp_days: int = Field(default=int(os.getenv("REFRESH_TOKEN_EXP_DAYS", "7")))

    # External API keys
    tmdb_api_key: Union[str, None] = Field(default=None)
    gemini_api_key: Union[str, None] = Field(default=None)
    gemini_model: str = Field(default="gemini-2.5-flash")

    # AWS S3
    aws_access_key_id: Union[str, None] = Field(default=None)
    aws_secret_access_key: Union[str, None] = Field(default=None)
    aws_region: str = Field(default="us-east-1")
    s3_bucket_name: Union[str, None] = Field(default=None)

    # Pydantic v2: load .env from backend app folder regardless of cwd
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        extra="ignore",
        # Disable JSON parsing for CORS_ORIGINS to allow our custom validator to handle it
        env_parse_none_str="null",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def _convert_database_url_to_async(cls, v):
        """
        Convert Render's postgresql:// URL to postgresql+asyncpg:// format.
        Render provides DATABASE_URL in the format: postgresql://user:pass@host:port/db
        But we need: postgresql+asyncpg://user:pass@host:port/db for async SQLAlchemy
        """
        if v and isinstance(v, str):
            # Convert postgres:// to postgresql+asyncpg://
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            # Convert postgresql:// to postgresql+asyncpg://
            elif v.startswith("postgresql://") and "+asyncpg" not in v:
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @property
    def cors_origins(self) -> list[str]:
        """
        Parse CORS origins from the cors_origins_str field.

        Supports multiple formats:
        1. Comma-separated string: "http://localhost:3000,http://localhost:5173"
        2. JSON array string: '["http://localhost:3000","http://localhost:5173"]'

        Returns a list of unique, trimmed origin URLs.
        Falls back to ["http://localhost:3000"] if empty or invalid.
        """
        raw = self.cors_origins_str.strip()

        if not raw:
            return ["http://localhost:3000"]

        # Try parsing as JSON array first
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    # Remove duplicates and strip whitespace
                    return list(dict.fromkeys([item.strip() for item in parsed if item and item.strip()]))
            except Exception:
                pass

        # Parse as comma-separated string
        origins = [item.strip() for item in raw.split(",") if item.strip()]

        # Remove duplicates while preserving order
        final_origins = list(dict.fromkeys(origins)) if origins else []
        
        # In development, ensure localhost:3000 is allowed
        if self.env == "development" and "http://localhost:3000" not in final_origins:
            final_origins.append("http://localhost:3000")
            
        # Fallback for safety if list is empty
        if not final_origins:
             final_origins = ["http://localhost:3000"]
            
        return final_origins

settings = Settings()

