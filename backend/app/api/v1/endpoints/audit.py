import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.models.user import User
from app.schemas.audit import AuditEventResponse
from app.services.audit_service import audit_service
from app.core.errors import ValidationException

router = APIRouter()

@router.get("/", response_model=List[AuditEventResponse])
async def list_audit_events(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    target_tenant_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    active_tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("audit:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve immutable audit ledger events for security and compliance review."""
    # Tenant users can strictly query their own active tenant
    effective_tenant_id = active_tenant_id
    if current_user.is_platform_admin and target_tenant_id:
        effective_tenant_id = target_tenant_id

    if not effective_tenant_id and not current_user.is_platform_admin:
        raise ValidationException("No active tenant context.")

    events = await audit_service.list_events(
        db,
        tenant_id=effective_tenant_id,
        limit=limit,
        offset=offset
    )

    return [
        AuditEventResponse(
            id=e.id,
            tenant_id=e.tenant_id,
            actor_id=e.actor_id,
            actor_name=e.actor_name,
            action=e.action,
            resource_type=e.resource_type,
            resource_id=e.resource_id,
            ip_address=e.ip_address,
            user_agent=e.user_agent,
            correlation_id=e.correlation_id,
            metadata=e.meta or {},
            created_at=e.created_at
        )
        for e in events
    ]
