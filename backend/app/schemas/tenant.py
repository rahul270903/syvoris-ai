import uuid
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class OrgSettingsUpdate(BaseModel):
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    support_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[Dict[str, Any]] = None

class OrgSettingsResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    currency: str
    timezone: str
    date_format: str
    logo_url: Optional[str] = None
    primary_color: str
    support_email: Optional[str] = None
    phone: Optional[str] = None
    address: Dict[str, Any] = {}

class TenantResponse(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    plan_tier: str
    status: str
    custom_domain: Optional[str] = None
    settings: Dict[str, Any] = {}
    organization_settings: Optional[OrgSettingsResponse] = None

class TenantStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(Active|Suspended|Churned)$")
