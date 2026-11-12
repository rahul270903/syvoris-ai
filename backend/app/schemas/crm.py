import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List, Generic, TypeVar
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr

T = TypeVar("T")

class PaginatedList(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int

# ==============================================================================
# Account Schemas
# ==============================================================================

class AccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    account_type: str = Field("Customer", max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = Field(None, max_length=255)
    billing_address: Optional[Dict[str, Any]] = None
    shipping_address: Optional[Dict[str, Any]] = None
    ownership: str = Field("Private", max_length=50)
    status: str = Field("Active", max_length=50)
    description: Optional[str] = None
    credit_limit: Optional[Decimal] = Decimal("0.00")
    parent_id: Optional[uuid.UUID] = None
    custom_fields: Optional[Dict[str, Any]] = None

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    account_type: Optional[str] = Field(None, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = Field(None, max_length=255)
    billing_address: Optional[Dict[str, Any]] = None
    shipping_address: Optional[Dict[str, Any]] = None
    ownership: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    parent_id: Optional[uuid.UUID] = None
    custom_fields: Optional[Dict[str, Any]] = None

class AccountResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    name: str
    account_type: str
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    billing_address: Dict[str, Any] = {}
    shipping_address: Dict[str, Any] = {}
    ownership: str
    status: str
    description: Optional[str] = None
    credit_limit: Decimal
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    custom_fields: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    contacts_count: int = 0
    merged_into_id: Optional[uuid.UUID] = None
    merged_into_id: Optional[uuid.UUID] = None

# ==============================================================================
# Contact Schemas
# ==============================================================================

class ContactCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., max_length=255)
    account_id: Optional[uuid.UUID] = None
    phone: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    status: str = Field("Active", max_length=50)
    is_primary: bool = False
    is_decision_maker: bool = False
    description: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ContactUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    account_id: Optional[uuid.UUID] = None
    phone: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    is_primary: Optional[bool] = None
    is_decision_maker: Optional[bool] = None
    description: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ContactResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    account_id: Optional[uuid.UUID] = None
    account_name: Optional[str] = None
    ref: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    status: str
    is_primary: bool
    is_decision_maker: bool
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    description: Optional[str] = None
    custom_fields: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    merged_into_id: Optional[uuid.UUID] = None

# ==============================================================================
# Opportunity Schemas (Foundational for Lead Conversion)
# ==============================================================================

class OpportunityCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    account_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    pipeline_id: str = "default"
    stage: str = "Qualification"
    amount: Decimal = Decimal("0.00")
    currency: str = "USD"
    probability: int = 25
    expected_close_date: Optional[datetime] = None
    forecast_category: str = "Pipeline"
    risk_level: str = "Low"
    lead_source: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    custom_fields: Optional[Dict[str, Any]] = None

class OpportunityResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    account_id: uuid.UUID
    account_name: Optional[str] = None
    contact_id: Optional[uuid.UUID] = None
    contact_name: Optional[str] = None
    ref: str
    name: str
    pipeline_id: str
    stage: str
    amount: Decimal
    currency: str
    probability: int
    expected_close_date: Optional[datetime] = None
    forecast_category: str
    risk_level: str
    lead_source: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    custom_fields: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

# ==============================================================================
# Activity & Customer 360 Schemas
# ==============================================================================

class CRMActivityCreate(BaseModel):
    activity_type: str = Field("Note", max_length=50)
    subject: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    contact_id: Optional[uuid.UUID] = None
    metadata: Optional[Dict[str, Any]] = None

class CRMActivityResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    account_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    activity_type: str
    subject: str
    description: Optional[str] = None
    occurred_at: datetime
    actor_id: Optional[uuid.UUID] = None
    actor_name: str
    metadata: Dict[str, Any] = {}

class Customer360Response(BaseModel):
    account: AccountResponse
    contacts: List[ContactResponse] = []
    activities: List[CRMActivityResponse] = []
    opportunities: List[OpportunityResponse] = []
    metrics: Dict[str, Any] = {}

# ==============================================================================
# Lead Schemas
# ==============================================================================

class LeadCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    company_name: str = Field(..., min_length=1, max_length=255)
    job_title: Optional[str] = Field(None, max_length=100)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    source: str = Field("Website", max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    territory: Optional[str] = Field(None, max_length=100)
    status: str = Field("New", max_length=50)
    score: Optional[int] = None
    priority: str = Field("Normal", max_length=32)
    consent_status: str = Field("Pending", max_length=50)
    owner_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class LeadUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    job_title: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    source: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    territory: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    score: Optional[int] = None
    priority: Optional[str] = Field(None, max_length=32)
    consent_status: Optional[str] = Field(None, max_length=50)
    owner_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class LeadResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    first_name: str
    last_name: str
    full_name: str
    company_name: str
    job_title: Optional[str] = None
    email: str
    phone: Optional[str] = None
    source: str
    industry: Optional[str] = None
    territory: Optional[str] = None
    status: str
    score: int
    score_factors: List[Dict[str, Any]] = []
    priority: str
    consent_status: str
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    converted_account_id: Optional[uuid.UUID] = None
    converted_account_name: Optional[str] = None
    converted_contact_id: Optional[uuid.UUID] = None
    converted_contact_name: Optional[str] = None
    converted_opportunity_id: Optional[uuid.UUID] = None
    converted_opportunity_name: Optional[str] = None
    converted_at: Optional[datetime] = None
    description: Optional[str] = None
    custom_fields: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    merged_into_id: Optional[uuid.UUID] = None

# ==============================================================================
# Lead Conversion Schemas
# ==============================================================================

class LeadConvertRequest(BaseModel):
    account_mode: str = Field("create", pattern="^(create|link)$")
    existing_account_id: Optional[uuid.UUID] = None
    new_account: Optional[Dict[str, Any]] = None
    contact: Optional[Dict[str, Any]] = None
    create_opportunity: bool = True
    opportunity: Optional[Dict[str, Any]] = None

class LeadConvertResponse(BaseModel):
    lead: LeadResponse
    account: AccountResponse
    contact: ContactResponse
    opportunity: Optional[OpportunityResponse] = None
    message: str = "Lead successfully converted into customer records."

# ==============================================================================
# Hierarchy Schemas (CR-02)
# ==============================================================================

class AccountHierarchyNode(BaseModel):
    id: uuid.UUID
    ref: str
    name: str
    account_type: str
    status: str
    owner_name: Optional[str] = None
    industry: Optional[str] = None
    credit_limit: Decimal = Decimal("0.00")
    depth: int = 0
    direct_contacts_count: int = 0
    direct_opportunities_count: int = 0
    direct_pipeline_value: Decimal = Decimal("0.00")
    children: List["AccountHierarchyNode"] = []

class AccountHierarchyResponse(BaseModel):
    root: AccountHierarchyNode
    current_account_id: uuid.UUID
    total_hierarchy_accounts: int = 0
    total_hierarchy_contacts: int = 0
    total_hierarchy_opportunities: int = 0
    total_hierarchy_pipeline_value: Decimal = Decimal("0.00")
    max_depth: int = 0

# ==============================================================================
# Deduplication & Merge Schemas (CR-04)
# ==============================================================================

class DuplicateMatchRule(BaseModel):
    rule_name: str
    field_name: str
    confidence_score: int
    matched_value: str
    explanation: str

class DuplicateRecordItem(BaseModel):
    id: uuid.UUID
    ref: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    secondary_info: Optional[str] = None
    status: str
    created_at: datetime
    owner_name: Optional[str] = None
    fields: Dict[str, Any] = {}

class DuplicateCluster(BaseModel):
    cluster_id: str
    entity_type: str
    primary_rule: str
    confidence_score: int
    records: List[DuplicateRecordItem]
    rules_triggered: List[DuplicateMatchRule]

class DuplicateScanRequest(BaseModel):
    entity_type: str = Field(..., pattern="^(account|contact|lead)$")
    limit: int = Field(50, ge=1, le=200)

class DuplicateScanResponse(BaseModel):
    entity_type: str
    total_candidates_scanned: int
    clusters_found: int
    clusters: List[DuplicateCluster]

class RecordMergeRequest(BaseModel):
    entity_type: str = Field(..., pattern="^(account|contact|lead)$")
    master_id: uuid.UUID
    duplicate_ids: List[uuid.UUID] = Field(..., min_length=1)
    field_overrides: Optional[Dict[str, Any]] = None

class RecordMergeResponse(BaseModel):
    entity_type: str
    master_id: uuid.UUID
    master_ref: str
    merged_ids: List[uuid.UUID]
    reassigned_counts: Dict[str, int]
    message: str
