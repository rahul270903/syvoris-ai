import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, ForeignKey, Uuid, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

def _is_unexpired(expires_at: datetime) -> bool:
    now = datetime.now(timezone.utc)
    exp = expires_at if expires_at.tzinfo is not None else expires_at.replace(tzinfo=timezone.utc)
    return now < exp

class RefreshToken(BaseModel):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")

    @property
    def is_valid(self) -> bool:
        return self.revoked_at is None and _is_unexpired(self.expires_at)

class PasswordResetToken(BaseModel):
    __tablename__ = "password_reset_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User")

    @property
    def is_valid(self) -> bool:
        return self.used_at is None and _is_unexpired(self.expires_at)

class EmailVerificationToken(BaseModel):
    __tablename__ = "email_verification_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User")

    @property
    def is_valid(self) -> bool:
        return self.verified_at is None and _is_unexpired(self.expires_at)
