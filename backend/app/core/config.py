import os
import json
from typing import List, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_root_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "syvoris_dev.db")).replace(os.sep, "/")
_default_db_url = f"sqlite+aiosqlite:///{_root_db}"

def normalize_database_url(url: str) -> str:
    """
    Normalizes database connection URLs for SQLAlchemy async engines.
    Converts legacy/cloud provider 'postgres://' or 'postgresql://' to 'postgresql+asyncpg://'.
    Preserves credentials, host, port, path, and query parameters.
    """
    if not url:
        return url
    trimmed = url.strip()
    if trimmed.startswith("postgres://"):
        return "postgresql+asyncpg://" + trimmed[len("postgres://"):]
    elif trimmed.startswith("postgresql://"):
        return "postgresql+asyncpg://" + trimmed[len("postgresql://"):]
    elif trimmed.startswith("postgresql+psycopg2://"):
        return "postgresql+asyncpg://" + trimmed[len("postgresql+psycopg2://"):]
    elif trimmed.startswith("sqlite:///") and not trimmed.startswith("sqlite+aiosqlite:///"):
        return "sqlite+aiosqlite:///" + trimmed[len("sqlite:///"): ]
    return trimmed

class Settings(BaseSettings):
    PROJECT_NAME: str = "SYVORIS Ai™ Enterprise CRM"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Cryptographic Secrets
    SECRET_KEY: str = "syvoris-enterprise-secret-key-phase1-dev-2026-minimum-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours for continuous development
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_EXPIRE_MINUTES: int = 60
    EMAIL_VERIFY_EXPIRE_HOURS: int = 24
    
    # Database Configuration (PostgreSQL in prod/staging, anchored root SQLite for dev)
    DATABASE_URL: str = _default_db_url
    POSTGRES_RLS_ENABLED: bool = False
    
    # Dev / Local Storage
    DEV_EMAIL_LOG_PATH: str = "storage/dev_emails.log"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: Any) -> str:
        if isinstance(v, str) and v.strip():
            return normalize_database_url(v.strip())
        return _default_db_url

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        default_dev_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]
        if v is None:
            return default_dev_origins
        if isinstance(v, str):
            v_str = v.strip()
            if not v_str:
                return default_dev_origins
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        v = parsed
                except Exception:
                    pass
            if isinstance(v, str):
                v = [item.strip() for item in v_str.split(",") if item.strip()]

        if isinstance(v, list):
            cleaned = []
            for item in v:
                if not isinstance(item, str):
                    continue
                origin = item.strip().rstrip("/")
                if origin == "*":
                    # Disallow wildcard when credentialed auth is enabled
                    continue
                if origin and origin not in cleaned:
                    cleaned.append(origin)

            for dev_origin in default_dev_origins:
                if dev_origin not in cleaned:
                    cleaned.append(dev_origin)
            return cleaned
        return default_dev_origins

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
