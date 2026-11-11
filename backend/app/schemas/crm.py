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
    metrics: Dict[str, Any] = {}
