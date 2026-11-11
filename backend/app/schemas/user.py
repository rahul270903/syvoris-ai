import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

class UserInviteRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role_name: str = Field(..., min_length=1)
    job_title: Optional[str] = None

class UserUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_title: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(Active|Suspended|Removed)$")

class UserRoleAssignRequest(BaseModel):
    role_name: str

class UserMemberResponse(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    full_name: str
    job_title: Optional[str] = None
    role: str
    permissions: List[str] = []
    status: str
    joined_at: datetime
