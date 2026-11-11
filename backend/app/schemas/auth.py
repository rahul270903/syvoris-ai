import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

class LoginRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN)
    password: str
    tenant_slug: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str
    expires_in: int
    tenant_id: Optional[uuid.UUID] = None
    tenant_slug: Optional[str] = None
    role: Optional[str] = None
    permissions: List[str] = []

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RegisterTenantRequest(BaseModel):
    organization_name: str = Field(..., min_length=2, max_length=255)
    tenant_slug: str = Field(..., min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=EMAIL_PATTERN)
    password: str = Field(..., min_length=8)

class SwitchTenantRequest(BaseModel):
    tenant_id: uuid.UUID

class PasswordResetRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN)

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class VerifyEmailRequest(BaseModel):
    token: str

class UserSummary(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    full_name: str
    job_title: Optional[str] = None
    is_platform_admin: bool = False
    is_verified: bool = False
    avatar_url: Optional[str] = None

class TenantMembershipSummary(BaseModel):
    tenant_id: uuid.UUID
    tenant_name: str
    tenant_slug: str
    role: str
    permissions: List[str] = []
    status: str

class CurrentUserResponse(BaseModel):
    user: UserSummary
    active_tenant: Optional[TenantMembershipSummary] = None
    memberships: List[TenantMembershipSummary] = []
