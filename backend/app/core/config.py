import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

_root_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "syvoris_dev.db")).replace(os.sep, "/")
_default_db_url = f"sqlite+aiosqlite:///{_root_db}"

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
    DATABASE_URL: str = os.getenv("DATABASE_URL", _default_db_url)
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
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
