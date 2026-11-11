import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class AuditEventResponse(BaseModel):
    id: uuid.UUID
    tenant_id: Optional[uuid.UUID] = None
    actor_id: Optional[uuid.UUID] = None
    actor_name: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    correlation_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime
