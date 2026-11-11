import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
import jwt
from passlib.hash import argon2
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Hash password using Argon2id with memory-hard parameters."""
    return argon2.using(rounds=3, memory_cost=65536, parallelism=4).hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2id hash."""
    try:
        return argon2.verify(plain_password, hashed_password)
    except Exception:
        return False

def validate_password_strength(password: str) -> Tuple[bool, str]:
    """Enforce enterprise password complexity requirements."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters in length."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one numerical digit."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character."
    return True, ""

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"iat": now, "exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    """Decode and cryptographically verify JWT token."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

def create_random_token(bytes_len: int = 32) -> Tuple[str, str]:
    """Generate a high-entropy random token and its SHA-256 storage hash."""
    raw_token = secrets.token_urlsafe(bytes_len)
    token_hash = hash_token(raw_token)
    return raw_token, token_hash

def hash_token(raw_token: str) -> str:
    """Compute SHA-256 digest of a raw token."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
