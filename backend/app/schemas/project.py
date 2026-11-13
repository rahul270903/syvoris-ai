import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

# -------------------------------------------------------------
# Base Schemas
# -------------------------------------------------------------

class ProjectBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    objectives: Optional[str] = None
    project_type: str = Field(default="Implementation", max_length=64)
    category: str = Field(default="Enterprise", max_length=64)
    status: str = Field(default="Planning", max_length=32)
    priority: str = Field(default="Medium", max_length=32)
    health: str = Field(default="On Track", max_length=32)
    account_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    opportunity_id: Optional[uuid.UUID] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    manager_name: Optional[str] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    actual_completion_date: Optional[date] = None
    budget: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    approved_cost_baseline: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    currency: str = Field(default="USD", max_length=3)
    progress_pct: int = Field(default=0, ge=0, le=100)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    objectives: Optional[str] = None
    project_type: Optional[str] = Field(None, max_length=64)
    category: Optional[str] = Field(None, max_length=64)
    status: Optional[str] = Field(None, max_length=32)
    priority: Optional[str] = Field(None, max_length=32)
    health: Optional[str] = Field(None, max_length=32)
    account_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    opportunity_id: Optional[uuid.UUID] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    manager_name: Optional[str] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    actual_completion_date: Optional[date] = None
    budget: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    approved_cost_baseline: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    currency: Optional[str] = Field(None, max_length=3)
    progress_pct: Optional[int] = Field(None, ge=0, le=100)
    custom_fields: Optional[Dict[str, Any]] = None

class ProjectResponse(ProjectBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    account_name: Optional[str] = None
    actual_cost: Decimal = Decimal("0.00")
    cost_variance: Decimal = Decimal("0.00")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# Milestone Schemas
# -------------------------------------------------------------

class ProjectMilestoneBase(BaseModel):
    project_id: uuid.UUID
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    deliverable: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    status: str = Field(default="Pending", max_length=32)
    priority: str = Field(default="Medium", max_length=32)
    target_date: Optional[date] = None
    completion_date: Optional[date] = None
    completion_criteria: Optional[str] = None
    order_index: int = 0
    progress_pct: int = Field(default=0, ge=0, le=100)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ProjectMilestoneCreate(ProjectMilestoneBase):
    pass

class ProjectMilestoneUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    deliverable: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    status: Optional[str] = Field(None, max_length=32)
    priority: Optional[str] = Field(None, max_length=32)
    target_date: Optional[date] = None
    completion_date: Optional[date] = None
    completion_criteria: Optional[str] = None
    order_index: Optional[int] = None
    progress_pct: Optional[int] = Field(None, ge=0, le=100)
    custom_fields: Optional[Dict[str, Any]] = None

class ProjectMilestoneResponse(ProjectMilestoneBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    project_ref: Optional[str] = None
    project_name: Optional[str] = None
    task_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# Task & Dependency Schemas
# -------------------------------------------------------------

class ProjectTaskBase(BaseModel):
    project_id: uuid.UUID
    milestone_id: Optional[uuid.UUID] = None
    parent_task_id: Optional[uuid.UUID] = None
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    priority: str = Field(default="Medium", max_length=32)
    status: str = Field(default="Not Started", max_length=32)
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    estimated_hours: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    actual_hours: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    progress_pct: int = Field(default=0, ge=0, le=100)
    blocked_reason: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ProjectTaskCreate(ProjectTaskBase):
    depends_on_task_ids: Optional[List[uuid.UUID]] = None

class ProjectTaskUpdate(BaseModel):
    milestone_id: Optional[uuid.UUID] = None
    parent_task_id: Optional[uuid.UUID] = None
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    priority: Optional[str] = Field(None, max_length=32)
    status: Optional[str] = Field(None, max_length=32)
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    estimated_hours: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    actual_hours: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    progress_pct: Optional[int] = Field(None, ge=0, le=100)
    blocked_reason: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class TaskDependencyResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    depends_on_task_id: uuid.UUID
    dependency_type: str
    depends_on_title: Optional[str] = None
    depends_on_ref: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class TaskDependencyCreate(BaseModel):
    depends_on_task_id: uuid.UUID
    dependency_type: str = "Finish-to-Start"

class ProjectTaskResponse(ProjectTaskBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    project_ref: Optional[str] = None
    project_name: Optional[str] = None
    milestone_name: Optional[str] = None
    dependencies: List[TaskDependencyResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# Resource Schemas
# -------------------------------------------------------------

class ProjectResourceBase(BaseModel):
    project_id: uuid.UUID
    user_id: uuid.UUID
    role_title: str = Field(..., max_length=128)
    allocation_pct: int = Field(default=100, ge=0, le=200)
    planned_hours: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    actual_hours: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    hourly_rate: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = Field(default="Active", max_length=32)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ProjectResourceCreate(ProjectResourceBase):
    pass

class ProjectResourceUpdate(BaseModel):
    role_title: Optional[str] = Field(None, max_length=128)
    allocation_pct: Optional[int] = Field(None, ge=0, le=200)
    planned_hours: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    actual_hours: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    hourly_rate: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = Field(None, max_length=32)
    custom_fields: Optional[Dict[str, Any]] = None

class ProjectResourceResponse(ProjectResourceBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    project_ref: Optional[str] = None
    project_name: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    total_cost: Decimal = Decimal("0.00")
    is_overallocated: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# Cost Schemas
# -------------------------------------------------------------

class ProjectCostBase(BaseModel):
    project_id: uuid.UUID
    task_id: Optional[uuid.UUID] = None
    title: str = Field(..., max_length=255)
    category: str = Field(default="Labor", max_length=64)
    cost_type: str = Field(default="Actual", max_length=32)
    amount: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    currency: str = Field(default="USD", max_length=3)
    date_incurred: date
    status: str = Field(default="Approved", max_length=32)
    approved_by_id: Optional[uuid.UUID] = None
    approved_by_name: Optional[str] = None
    vendor_name: Optional[str] = None
    notes: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ProjectCostCreate(ProjectCostBase):
    pass

class ProjectCostUpdate(BaseModel):
    task_id: Optional[uuid.UUID] = None
    title: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=64)
    cost_type: Optional[str] = Field(None, max_length=32)
    amount: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    currency: Optional[str] = Field(None, max_length=3)
    date_incurred: Optional[date] = None
    status: Optional[str] = Field(None, max_length=32)
    approved_by_id: Optional[uuid.UUID] = None
    approved_by_name: Optional[str] = None
    vendor_name: Optional[str] = None
    notes: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ProjectCostResponse(ProjectCostBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    project_ref: Optional[str] = None
    project_name: Optional[str] = None
    task_title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# Activity Schemas
# -------------------------------------------------------------

class ProjectActivityResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    activity_type: str
    action: str
    actor_id: Optional[uuid.UUID] = None
    actor_name: str
    details: Optional[str] = None
    occurred_at: datetime

    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# Composite & Views Schemas
# -------------------------------------------------------------

class ProjectDetailResponse(ProjectResponse):
    milestones: List[ProjectMilestoneResponse] = Field(default_factory=list)
    tasks: List[ProjectTaskResponse] = Field(default_factory=list)
    resources: List[ProjectResourceResponse] = Field(default_factory=list)
    costs: List[ProjectCostResponse] = Field(default_factory=list)
    activities: List[ProjectActivityResponse] = Field(default_factory=list)

class ProjectCalendarEvent(BaseModel):
    id: str
    title: str
    date: date
    time: str
    type: str # 'Milestone' | 'Task' | 'Deadline' | 'Review'
    project_id: uuid.UUID
    project_ref: str
    project_name: str
    account_name: Optional[str] = None
    owner: str
    status: str
    description: Optional[str] = None

class ProjectAnalyticsSummary(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    on_track_count: int
    at_risk_count: int
    critical_count: int
    total_budget: Decimal
    total_baseline: Decimal
    total_actual_cost: Decimal
    cost_variance: Decimal
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    task_completion_rate: Decimal
    total_milestones: int
    completed_milestones: int
    resource_count: int
    overallocated_resources: int
