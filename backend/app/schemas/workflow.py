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

# --- Workflow Schemas ---

class WorkflowBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: str = Field("Sales", max_length=50)
    trigger_type: str = Field("event", max_length=50)
    trigger_event: str = Field("lead.created", max_length=100)
    trigger_config: Dict[str, Any] = Field(default_factory=dict)
    condition_expression: Optional[str] = Field(None, max_length=255)
    conditions: Dict[str, Any] = Field(default_factory=dict)
    action_summary: Optional[str] = Field(None, max_length=255)
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = Field("Active", max_length=32)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    trigger_type: Optional[str] = None
    trigger_event: Optional[str] = None
    trigger_config: Optional[Dict[str, Any]] = None
    condition_expression: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    action_summary: Optional[str] = None
    actions: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class WorkflowResponse(WorkflowBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    executions_count: int = 0
    last_executed_at: Optional[datetime] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Workflow Execution Schemas ---

class WorkflowExecutionResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    workflow_id: uuid.UUID
    ref: str
    trigger_event: str
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    status: str
    input_payload: Dict[str, Any]
    execution_log: List[Dict[str, Any]]
    error_message: Optional[str] = None
    duration_ms: int = 0
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WorkflowExecutionRequest(BaseModel):
    payload: Dict[str, Any] = Field(default_factory=dict)
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None

class WorkflowSimulationResult(BaseModel):
    matched: bool
    reasons: List[str]
    actions_to_execute: List[Dict[str, Any]]

# --- Approval Rule Schemas ---

class ApprovalRuleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    entity_type: str = Field("Quote", max_length=50)
    condition_type: str = Field("discount_threshold", max_length=50)
    threshold_value: Decimal = Field(default=Decimal("0.00"), ge=0)
    required_role: str = Field("VP Sales", max_length=100)
    escalation_timeout_hours: int = Field(24, ge=1)
    is_active: bool = True
    description: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ApprovalRuleCreate(ApprovalRuleBase):
    pass

class ApprovalRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    entity_type: Optional[str] = None
    condition_type: Optional[str] = None
    threshold_value: Optional[Decimal] = Field(None, ge=0)
    required_role: Optional[str] = None
    escalation_timeout_hours: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None
    description: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ApprovalRuleResponse(ApprovalRuleBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
