import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Text, JSON, ForeignKey, Uuid, Boolean, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TenantScopedModel

class IntegrationConnector(TenantScopedModel):
    __tablename__ = "integration_connectors"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    connector_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # erp, email, calendar, voice, sms, web_sdk, webhook
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    boundary_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    status: Mapped[str] = mapped_column(String(32), default="Planned", nullable=False, index=True)
    # Planned, Active, Paused, Error, Configured
    endpoint_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    auth_type: Mapped[str] = mapped_column(String(50), default="api_key", nullable=False)
    # api_key, oauth2, mtls, hmac, bearer_token
    credentials: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    config: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    health_status: Mapped[str] = mapped_column(String(32), default="Healthy", nullable=False)
    health_latency_ms: Mapped[int] = mapped_column(Integer, default=35, nullable=False)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

class WebhookSubscription(TenantScopedModel):
    __tablename__ = "webhook_subscriptions"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_url: Mapped[str] = mapped_column(String(500), nullable=False)
    secret_key: Mapped[str] = mapped_column(String(128), nullable=False)
    events: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    # e.g. ["lead.created", "deal.won", "case.escalated", "order.created"]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    max_retries: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    retry_backoff_seconds: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    custom_headers: Mapped[Dict[str, str]] = mapped_column(JSON, default=dict, nullable=False)
    
    deliveries_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    deliveries: Mapped[List["WebhookDelivery"]] = relationship(
        "WebhookDelivery", back_populates="subscription", cascade="all, delete-orphan", lazy="select"
    )

class WebhookDelivery(TenantScopedModel):
    __tablename__ = "webhook_deliveries"

    subscription_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("webhook_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    event_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    signature: Mapped[str] = mapped_column(String(128), nullable=False)
    # HMAC SHA-256 signature string
    status: Mapped[str] = mapped_column(String(32), default="Success", nullable=False, index=True)
    # Success, Retrying, Failed, Dead-Letter
    status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_retry_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    subscription: Mapped["WebhookSubscription"] = relationship("WebhookSubscription", back_populates="deliveries")

class RadiumSyncLog(TenantScopedModel):
    __tablename__ = "radium_sync_logs"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # Sales Orders, Inventory Stock, Invoice Status, Customer Master, All Core Entities
    direction: Mapped[str] = mapped_column(String(32), default="Bidirectional", nullable=False)
    # Inbound, Outbound, Bidirectional
    status: Mapped[str] = mapped_column(String(32), default="Success", nullable=False, index=True)
    # Success, Warning, Failed, Running
    records_synced: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    records_failed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    payload_summary: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, default=42, nullable=False)
    initiated_by: Mapped[str] = mapped_column(String(100), default="User", nullable=False)
