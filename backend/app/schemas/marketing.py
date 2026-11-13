import uuid
from datetime import datetime, date
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

# --- Campaign Schemas ---

class CampaignBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    type: str = Field("Email", max_length=50)
    channel: str = Field("Email", max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_audience: Optional[str] = None
    objective: Optional[str] = None
    budget: Decimal = Field(default=Decimal("0.00"), ge=0)
    actual_cost: Decimal = Field(default=Decimal("0.00"), ge=0)
    expected_revenue: Decimal = Field(default=Decimal("0.00"), ge=0)
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    type: Optional[str] = None
    status: Optional[str] = None
    channel: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_audience: Optional[str] = None
    objective: Optional[str] = None
    budget: Optional[Decimal] = Field(None, ge=0)
    actual_cost: Optional[Decimal] = Field(None, ge=0)
    expected_revenue: Optional[Decimal] = Field(None, ge=0)
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class CampaignResponse(CampaignBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    status: str
    created_at: datetime
    updated_at: datetime
    member_count: int = 0
    leads_generated_count: int = 0
    opportunities_influenced_count: int = 0
    revenue_generated: Decimal = Decimal("0.00")
    roi_percentage: Decimal = Decimal("0.00")

    model_config = ConfigDict(from_attributes=True)

# --- Campaign Member Schemas ---

class CampaignMemberCreate(BaseModel):
    contact_id: Optional[uuid.UUID] = None
    lead_id: Optional[uuid.UUID] = None
    status: str = Field("Added", max_length=50)
    engagement_score: int = Field(0, ge=0)
    unsubscribed: bool = False
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class CampaignMemberResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    campaign_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    lead_id: Optional[uuid.UUID] = None
    status: str
    engagement_score: int
    unsubscribed: bool
    custom_fields: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    name: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Audience Segment Schemas ---

class AudienceSegmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    segment_type: str = Field("Dynamic", max_length=50)
    target_entity: str = Field("contacts", max_length=50)
    filter_criteria: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class AudienceSegmentCreate(AudienceSegmentBase):
    pass

class AudienceSegmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    segment_type: Optional[str] = None
    target_entity: Optional[str] = None
    filter_criteria: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class AudienceSegmentResponse(AudienceSegmentBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Email Template Schemas ---

class EmailTemplateBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    subject: str = Field(..., min_length=1, max_length=255)
    category: str = Field("Promotional", max_length=50)
    body_html: str = Field(..., min_length=1)
    body_text: Optional[str] = None
    merge_tags: List[str] = Field(default_factory=list)
    is_active: bool = True
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    merge_tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class EmailTemplateResponse(EmailTemplateBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Marketing Workflow Schemas ---

class MarketingWorkflowBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    trigger_type: str = Field("lead.created", max_length=50)
    trigger_config: Dict[str, Any] = Field(default_factory=dict)
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = Field("Active", max_length=50)

class MarketingWorkflowCreate(MarketingWorkflowBase):
    pass

class MarketingWorkflowResponse(MarketingWorkflowBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    execution_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Attribution & Analytics Schemas ---

class CampaignAttributionResponse(BaseModel):
    campaign_id: uuid.UUID
    campaign_name: str
    ref: str
    budget: Decimal
    actual_cost: Decimal
    leads_count: int
    converted_leads_count: int
    opportunities_count: int
    closed_won_revenue: Decimal
    pipeline_influenced: Decimal
    roi_percentage: Decimal
    cost_per_lead: Decimal
