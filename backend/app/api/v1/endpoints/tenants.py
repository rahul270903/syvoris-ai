import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission,
    require_platform_admin
)
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.tenant import (
    TenantResponse,
    OrgSettingsResponse,
    OrgSettingsUpdate,
    TenantStatusUpdate
)
from app.services.tenant_service import tenant_service
from app.core.errors import ValidationException, NotFoundException

router = APIRouter()

@router.get("/profile", response_model=TenantResponse)
async def get_tenant_profile(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("tenant:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve active organization profile and settings."""
    if not tenant_id:
        raise ValidationException("No active tenant context.")
    return await tenant_service.get_tenant_profile(db, tenant_id)

@router.put("/settings", response_model=OrgSettingsResponse)
async def update_tenant_settings(
    req: OrgSettingsUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("tenant:update")),
    db: AsyncSession = Depends(get_db)
):
    """Update organization settings (branding, timezone, currency)."""
    if not tenant_id:
        raise ValidationException("No active tenant context.")
    return await tenant_service.update_organization_settings(
        db,
        tenant_id=tenant_id,
        data=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/all", response_model=List[TenantResponse], dependencies=[Depends(require_platform_admin())])
async def list_all_tenants(
    db: AsyncSession = Depends(get_db)
):
    """Platform SuperAdmin endpoint to view all tenants across platform."""
    res = await db.execute(select(Tenant).where(Tenant.deleted_at.is_(None)))
    tenants = res.scalars().all()
    results = []
    for t in tenants:
        results.append(await tenant_service.get_tenant_profile(db, t.id))
    return results

@router.put("/{target_tenant_id}/status", response_model=TenantResponse, dependencies=[Depends(require_platform_admin())])
async def set_tenant_status(
    target_tenant_id: uuid.UUID,
    req: TenantStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Platform SuperAdmin endpoint to suspend or activate a tenant."""
    tenant = await db.get(Tenant, target_tenant_id)
    if not tenant:
        raise NotFoundException("Target tenant not found.")
    tenant.status = req.status
    await db.commit()
    return await tenant_service.get_tenant_profile(db, target_tenant_id)
