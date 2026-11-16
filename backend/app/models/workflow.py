import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from decimal import Decimal
from sqlalchemy import String, Text, JSON, ForeignKey, Uuid, Boolean, Numeric, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TenantScopedModel

class Workflow(TenantScopedModel):
    __tablename__ = "workflows"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="Sales", nullable=False, index=True)
    
    # Trigger specification
    trigger_type: Mapped[str] = mapped_column(String(50), default="event", nullable=False)  # event, schedule, webhook
    trigger_event: Mapped[str] = mapped_column(String(100), default="lead.created", nullable=False, index=True)
    trigger_config: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    # Conditions
    condition_expression: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    conditions: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    # Actions
    action_summary: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    actions: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    
    # Lifecycle
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False, index=True)  # Active, Paused, Draft
    executions_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_executed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    owner_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    executions: Mapped[List["WorkflowExecution"]] = relationship(
        "WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan", lazy="select"
    )

class WorkflowExecution(TenantScopedModel):
    __tablename__ = "workflow_executions"

    workflow_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    trigger_event: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True, index=True)
    
    status: Mapped[str] = mapped_column(String(32), default="Success", nullable=False, index=True)  # Success, Failed, Running, Pending
    input_payload: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    execution_log: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="executions")

class ApprovalRule(TenantScopedModel):
    __tablename__ = "approval_rules"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), default="Quote", nullable=False, index=True)
    condition_type: Mapped[str] = mapped_column(String(50), default="discount_threshold", nullable=False)  # discount_threshold, amount_threshold, margin_floor, risk_level
    threshold_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    required_role: Mapped[str] = mapped_column(String(100), default="VP Sales", nullable=False)
    escalation_timeout_hours: Mapped[int] = mapped_column(Integer, default=24, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
