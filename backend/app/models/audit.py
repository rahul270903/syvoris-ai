import uuid
from typing import Optional, Dict, Any
from sqlalchemy import String, JSON, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import BaseModel

class AuditEvent(BaseModel):
    __tablename__ = "audit_events"

    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True
    )
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    actor_name: Mapped[str] = mapped_column(String(255), default="System", nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    correlation_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    meta: Mapped[Dict[str, Any]] = mapped_column("metadata", JSON, default=dict, nullable=False)
