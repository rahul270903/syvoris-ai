import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from decimal import Decimal
from sqlalchemy import String, Text, JSON, ForeignKey, Uuid, Boolean, Numeric, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TenantScopedModel

class AIAgent(TenantScopedModel):
    __tablename__ = "ai_agents"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    persona: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # SDR, Deal, Quote, Service, Save-Play, Compliance, Negotiation, Pricing, Forecast, Inventory, Data Steward, Meeting, Knowledge, CRM Administrator
    module: Mapped[str] = mapped_column(String(50), nullable=False)
    role_description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    autonomy_level: Mapped[str] = mapped_column(String(50), default="Suggest Only", nullable=False, index=True)
    # Suggest Only, Act with Approval, Act Autonomously
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False, index=True)
    # Active, Paused, Disabled
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tool_permissions: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    primary_kpi: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    owner_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    # { "proposals_count": 0, "approved_count": 0, "accuracy_score": 0.95 }
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    proposals: Mapped[List["AIProposal"]] = relationship(
        "AIProposal", back_populates="agent", cascade="all, delete-orphan", lazy="select"
    )

class AIProposal(TenantScopedModel):
    __tablename__ = "ai_proposals"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    agent_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("ai_agents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    reasoning: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 2), default=Decimal("0.90"), nullable=True)
    policy_check: Mapped[str] = mapped_column(String(100), default="Compliant", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Pending Approval", nullable=False, index=True)
    # Pending Approval, Approved, Rejected, Executed
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    decided_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decided_by_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    agent: Mapped["AIAgent"] = relationship("AIAgent", back_populates="proposals")

class AIChatSession(TenantScopedModel):
    __tablename__ = "ai_chat_sessions"

    title: Mapped[str] = mapped_column(String(255), default="New Copilot Session", nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    messages: Mapped[List["AIChatMessage"]] = relationship(
        "AIChatMessage", back_populates="session", cascade="all, delete-orphan", lazy="select",
        order_by="AIChatMessage.created_at"
    )

class AIChatMessage(TenantScopedModel):
    __tablename__ = "ai_chat_messages"

    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user, assistant, system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    grounding_sources: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    # [ { "type": "opportunity", "id": "...", "ref": "OPP-001", "title": "..." } ]
    suggested_links: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    # [ { "label": "Open Pipeline Board", "path": "/sales/pipeline" } ]
    token_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    session: Mapped["AIChatSession"] = relationship("AIChatSession", back_populates="messages")

class RevenueScenario(TenantScopedModel):
    __tablename__ = "revenue_scenarios"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    probability_uplift: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("5.00"), nullable=False)
    launch_delay_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    discount_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    baseline_pipeline_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    projected_pipeline_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    delta_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    assumptions: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Simulated", nullable=False)
    created_by_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

class CustomReport(TenantScopedModel):
    __tablename__ = "custom_reports"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    entity_type: Mapped[str] = mapped_column(String(50), default="opportunities", nullable=False, index=True)
    # opportunities, accounts, leads, cases, quotes, sales_orders, invoices
    report_type: Mapped[str] = mapped_column(String(32), default="summary", nullable=False)
    # tabular, summary, matrix
    filters: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    groupings: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    aggregates: Mapped[Dict[str, str]] = mapped_column(JSON, default=dict, nullable=False)
    columns: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    chart_config: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_by_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
