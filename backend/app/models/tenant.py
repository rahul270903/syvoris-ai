import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy import String, JSON, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel, TenantScopedModel

class Tenant(BaseModel):
    __tablename__ = "tenants"

    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    plan_tier: Mapped[str] = mapped_column(String(32), default="Starter", nullable=False) # Starter, Professional, Enterprise, Ultimate
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False)     # Provisioning, Active, Suspended, Churned
    custom_domain: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    settings: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    organization_settings: Mapped[Optional["OrganizationSettings"]] = relationship(
        "OrganizationSettings", back_populates="tenant", uselist=False, cascade="all, delete-orphan"
    )
    memberships: Mapped[List["TenantMembership"]] = relationship(
        "TenantMembership", back_populates="tenant", cascade="all, delete-orphan"
    )
    roles: Mapped[List["Role"]] = relationship(
        "Role", back_populates="tenant", cascade="all, delete-orphan"
    )

class OrganizationSettings(TenantScopedModel):
    __tablename__ = "organization_settings"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="America/New_York", nullable=False)
    date_format: Mapped[str] = mapped_column(String(32), default="YYYY-MM-DD", nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    primary_color: Mapped[str] = mapped_column(String(16), default="#2563eb", nullable=False)
    support_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="organization_settings")
