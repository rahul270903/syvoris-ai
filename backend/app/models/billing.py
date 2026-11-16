import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Text, JSON, ForeignKey, Uuid, Boolean, Integer, BigInteger, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel, TenantScopedModel

class TenantSubscription(TenantScopedModel):
    __tablename__ = "tenant_subscriptions"

    stripe_customer_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    plan_tier: Mapped[str] = mapped_column(String(32), default="Starter", nullable=False, index=True)
    # Starter, Professional, Enterprise, Ultimate
    billing_cycle: Mapped[str] = mapped_column(String(20), default="monthly", nullable=False)
    # monthly, annual
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False, index=True)
    # trialing, active, past_due, canceled, incomplete
    current_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    canceled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)


class TenantUsageMeter(TenantScopedModel):
    __tablename__ = "tenant_usage_meters"

    billing_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    billing_period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    seats_limit: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    seats_used: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    storage_bytes_limit: Mapped[int] = mapped_column(BigInteger, default=10737418240, nullable=False)  # 10 GB
    storage_bytes_used: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    
    ai_tokens_limit: Mapped[int] = mapped_column(BigInteger, default=50000, nullable=False)
    ai_tokens_used: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    
    api_calls_limit: Mapped[int] = mapped_column(BigInteger, default=10000, nullable=False)
    api_calls_used: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)


class UsageEvent(TenantScopedModel):
    __tablename__ = "usage_events"

    meter_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # ai_tokens, storage_bytes, seat, api_call
    quantity: Mapped[int] = mapped_column(BigInteger, nullable=False)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    event_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)


class StripeEventLog(BaseModel):
    __tablename__ = "stripe_event_logs"

    stripe_event_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="processed", nullable=False)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
