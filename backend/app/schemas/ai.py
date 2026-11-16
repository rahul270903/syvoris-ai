import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any, Generic, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")

class PaginatedList(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int

# --- AI Agent Schemas ---

class AIAgentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    persona: str = Field(..., max_length=50)
    module: str = Field("General", max_length=50)
    role_description: Optional[str] = None
    autonomy_level: str = Field("Suggest Only", max_length=50)
    status: str = Field("Active", max_length=32)
    system_prompt: Optional[str] = None
    tool_permissions: List[str] = Field(default_factory=list)
    primary_kpi: Optional[str] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class AIAgentCreate(AIAgentBase):
    pass

class AIAgentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    persona: Optional[str] = None
    module: Optional[str] = None
    role_description: Optional[str] = None
    autonomy_level: Optional[str] = None
    status: Optional[str] = None
    system_prompt: Optional[str] = None
    tool_permissions: Optional[List[str]] = None
    primary_kpi: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class AIAgentResponse(AIAgentBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- AI Proposal Schemas ---

class AIProposalBase(BaseModel):
    agent_name: str = Field(..., max_length=100)
    action: str = Field(..., max_length=255)
    reasoning: str
    evidence: Optional[str] = None
    confidence: Optional[Decimal] = Field(default=Decimal("0.90"), ge=0, le=1)
    policy_check: str = Field("Compliant", max_length=100)
    status: str = Field("Pending Approval", max_length=50)
    payload: Dict[str, Any] = Field(default_factory=dict)

class AIProposalCreate(AIProposalBase):
    agent_id: uuid.UUID

class AIProposalDecisionRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None

class AIProposalResponse(AIProposalBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    agent_id: uuid.UUID
    decided_by_id: Optional[uuid.UUID] = None
    decided_by_name: Optional[str] = None
    decided_at: Optional[datetime] = None
    decision_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Copilot & Chat Schemas ---

class AIChatQueryRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[uuid.UUID] = None
    provider: Optional[str] = Field("Claude 3.5 Sonnet", max_length=50)  # Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro

class AIChatMessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    grounding_sources: List[Dict[str, Any]] = Field(default_factory=list)
    suggested_links: List[Dict[str, Any]] = Field(default_factory=list)
    token_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AIChatQueryResponse(BaseModel):
    session_id: uuid.UUID
    reply: AIChatMessageResponse
    provider_used: str

class AIChatSessionResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    user_id: Optional[uuid.UUID] = None
    user_name: Optional[str] = None
    created_at: datetime
    messages: List[AIChatMessageResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

# --- Revenue Digital Twin & Scenario Schemas ---

class RevenueTwinSimulateRequest(BaseModel):
    probability_uplift: Decimal = Field(default=Decimal("5.00"), ge=-50, le=50)
    launch_delay_days: int = Field(default=0, ge=0, le=365)
    discount_pct: Decimal = Field(default=Decimal("0.00"), ge=0, le=50)

class RevenueTwinSimulateResponse(BaseModel):
    baseline_weighted_value: Decimal
    simulated_weighted_value: Decimal
    delta_value: Decimal
    open_pipeline_total: Decimal
    open_deals_count: int
    probability_uplift: Decimal
    launch_delay_days: int
    discount_pct: Decimal
    summary_commentary: str

class RevenueScenarioCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    probability_uplift: Decimal = Field(default=Decimal("5.00"))
    launch_delay_days: int = Field(default=0)
    discount_pct: Decimal = Field(default=Decimal("0.00"))
    assumptions: Dict[str, Any] = Field(default_factory=dict)

class RevenueScenarioResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    name: str
    description: Optional[str] = None
    probability_uplift: Decimal
    launch_delay_days: int
    discount_pct: Decimal
    baseline_pipeline_value: Decimal
    projected_pipeline_value: Decimal
    delta_value: Decimal
    assumptions: Dict[str, Any]
    status: str
    created_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Analytics & Reporting Schemas ---

class CustomReportCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    entity_type: str = Field("opportunities", max_length=50)
    report_type: str = Field("summary", max_length=32)
    filters: List[Dict[str, Any]] = Field(default_factory=list)
    groupings: List[str] = Field(default_factory=list)
    aggregates: Dict[str, str] = Field(default_factory=dict)
    columns: List[str] = Field(default_factory=list)
    chart_config: Dict[str, Any] = Field(default_factory=dict)

class CustomReportResponse(CustomReportCreate):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ForecastSummaryResponse(BaseModel):
    total_pipeline: Decimal
    weighted_pipeline: Decimal
    commit_value: Decimal
    best_case_value: Decimal
    closed_won_value: Decimal
    closed_lost_value: Decimal
    quota_attainment_pct: Decimal
    by_category: Dict[str, Decimal]
    by_stage: Dict[str, Decimal]
