import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, ForeignKey, Uuid, UniqueConstraint, DateTime, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, BaseModel

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Uuid(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Uuid(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)

class Permission(BaseModel):
    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True) # e.g. users:read, roles:manage
    module: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    roles: Mapped[List["Role"]] = relationship(
        "Role", secondary=role_permissions, back_populates="permissions"
    )

class Role(BaseModel):
    __tablename__ = "roles"

    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_system_role: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_platform_role: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    tenant: Mapped[Optional["Tenant"]] = relationship("Tenant", back_populates="roles")
    permissions: Mapped[List["Permission"]] = relationship(
        "Permission", secondary=role_permissions, back_populates="roles"
    )

    __table_args__ = (
        UniqueConstraint("tenant_id", "name", name="uq_tenant_role_name"),
    )

class UserRole(BaseModel):
    __tablename__ = "user_roles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True
    )
    assigned_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    role: Mapped["Role"] = relationship("Role")

    __table_args__ = (
        UniqueConstraint("user_id", "role_id", "tenant_id", name="uq_user_role_tenant"),
    )
