import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Boolean, JSON, ForeignKey, Uuid, UniqueConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_platform_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    preferences: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    memberships: Mapped[List["TenantMembership"]] = relationship(
        "TenantMembership", back_populates="user", cascade="all, delete-orphan", foreign_keys="TenantMembership.user_id"
    )
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

class TenantMembership(BaseModel):
    __tablename__ = "tenant_memberships"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False) # Active, Invited, Suspended, Removed
    invited_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    invited_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="memberships")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("tenant_id", "user_id", name="uq_tenant_user_membership"),
    )
