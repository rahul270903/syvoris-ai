import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.models.user import User
from app.schemas.service import (
    SLAPolicyCreate,
    SLAPolicyUpdate,
    SLAPolicyResponse
)
from app.services.sla_service import SLAService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=List[SLAPolicyResponse])
async def list_sla_policies(
    is_active: Optional[bool] = Query(None, description="Active status filter"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("sla:read")),
    db: AsyncSession = Depends(get_db)
):
    """List SLA policies for tenant, auto-seeding standard priority policies if empty."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await SLAService.list_policies(db, tenant_id=tenant_id, is_active=is_active)

@router.post("", response_model=SLAPolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_sla_policy(
    policy_in: SLAPolicyCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("sla:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new SLA policy."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await SLAService.create_policy(
        db=db,
        policy_in=policy_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}", response_model=SLAPolicyResponse)
async def get_sla_policy(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("sla:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve an SLA policy by ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await SLAService.get_policy(db, policy_id=id, tenant_id=tenant_id)

@router.patch("/{id}", response_model=SLAPolicyResponse)
async def update_sla_policy(
    id: uuid.UUID,
    policy_in: SLAPolicyUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("sla:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update an SLA policy."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await SLAService.update_policy(
        db=db,
        policy_id=id,
        policy_in=policy_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
