import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from decimal import Decimal
from sqlalchemy import String, Text, JSON, ForeignKey, Uuid, Boolean, Numeric, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TenantScopedModel

class Account(TenantScopedModel):
    __tablename__ = "accounts"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    account_type: Mapped[str] = mapped_column(String(50), default="Customer", nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    billing_address: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    shipping_address: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    ownership: Mapped[str] = mapped_column(String(50), default="Private", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    owner_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True
    )
    merged_into_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    contacts: Mapped[List["Contact"]] = relationship(
        "Contact", back_populates="account", cascade="all, delete-orphan", lazy="selectin"
    )
    opportunities: Mapped[List["Opportunity"]] = relationship(
        "Opportunity", back_populates="account", cascade="all, delete-orphan", lazy="selectin"
    )
    activities: Mapped[List["CRMActivity"]] = relationship(
        "CRMActivity", back_populates="account", cascade="all, delete-orphan", lazy="selectin"
    )

class Contact(TenantScopedModel):
    __tablename__ = "contacts"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False, index=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_decision_maker: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    owner_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    merged_into_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    account: Mapped[Optional["Account"]] = relationship("Account", back_populates="contacts", lazy="joined")
    opportunities: Mapped[List["Opportunity"]] = relationship(
        "Opportunity", back_populates="contact", cascade="all, delete-orphan", lazy="selectin"
    )
    activities: Mapped[List["CRMActivity"]] = relationship(
        "CRMActivity", back_populates="contact", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

class Opportunity(TenantScopedModel):
    __tablename__ = "opportunities"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    pipeline_id: Mapped[str] = mapped_column(String(64), default="default", nullable=False)
    stage: Mapped[str] = mapped_column(String(100), default="Qualification", nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    probability: Mapped[int] = mapped_column(Integer, default=25, nullable=False)
    expected_close_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    forecast_category: Mapped[str] = mapped_column(String(50), default="Pipeline", nullable=False)
    risk_level: Mapped[str] = mapped_column(String(32), default="Low", nullable=False)
    lead_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    owner_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    account: Mapped["Account"] = relationship("Account", back_populates="opportunities", lazy="joined")
    contact: Mapped[Optional["Contact"]] = relationship("Contact", back_populates="opportunities", lazy="joined")

class Lead(TenantScopedModel):
    __tablename__ = "leads"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source: Mapped[str] = mapped_column(String(100), default="Website", nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    territory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="New", nullable=False, index=True)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(32), default="Normal", nullable=False)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    owner_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    consent_status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)
    converted_account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True
    )
    converted_contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True
    )
    converted_opportunity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True
    )
    converted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    merged_into_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True
    )
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    converted_account: Mapped[Optional["Account"]] = relationship("Account", foreign_keys=[converted_account_id], lazy="joined")
    converted_contact: Mapped[Optional["Contact"]] = relationship("Contact", foreign_keys=[converted_contact_id], lazy="joined")
    converted_opportunity: Mapped[Optional["Opportunity"]] = relationship("Opportunity", foreign_keys=[converted_opportunity_id], lazy="joined")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

class CRMActivity(TenantScopedModel):
    __tablename__ = "crm_activities"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    activity_type: Mapped[str] = mapped_column(String(50), default="Note", nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    actor_name: Mapped[str] = mapped_column(String(255), default="User", nullable=False)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column("metadata", JSON, default=dict, nullable=False)

    # Relationships
    account: Mapped["Account"] = relationship("Account", back_populates="activities")
    contact: Mapped[Optional["Contact"]] = relationship("Contact", back_populates="activities")
