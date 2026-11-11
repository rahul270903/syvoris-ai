import uuid
from typing import Optional, List
from pydantic import BaseModel, Field

class PermissionResponse(BaseModel):
    id: uuid.UUID
    code: str
    module: str
    description: str

class RoleResponse(BaseModel):
    id: uuid.UUID
    tenant_id: Optional[uuid.UUID] = None
    name: str
    description: Optional[str] = None
    is_system_role: bool
    is_platform_role: bool
    permissions: List[str] = []

class RoleCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    permissions: List[str] = []
