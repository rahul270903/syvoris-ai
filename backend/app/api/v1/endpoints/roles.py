import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.models.user import User
from app.models.rbac import Role, Permission
from app.schemas.rbac import (
    RoleResponse,
    PermissionResponse,
    RoleCreateRequest
)
from app.services.rbac_service import rbac_service
from app.services.audit_service import audit_service
from app.core.errors import ValidationException, ConflictException

router = APIRouter()

@router.get("/", response_model=List[RoleResponse])
async def list_roles(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("roles:read")),
    db: AsyncSession = Depends(get_db)
):
    """List standard and custom roles configured for the active organization."""
    if not tenant_id:
        raise ValidationException("No active tenant context.")
    await rbac_service.ensure_tenant_roles(db, tenant_id)

    res = await db.execute(
        select(Role)
        .where(Role.tenant_id == tenant_id, Role.is_platform_role == False)
        .options(selectinload(Role.permissions))
    )
    roles = res.scalars().all()

    return [
        RoleResponse(
            id=r.id,
            tenant_id=r.tenant_id,
            name=r.name,
            description=r.description,
            is_system_role=r.is_system_role,
            is_platform_role=r.is_platform_role,
            permissions=[p.code for p in r.permissions]
        )
        for r in roles
    ]

@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    _: None = Depends(require_permission("roles:read")),
    db: AsyncSession = Depends(get_db)
):
    """List all available system permission capabilities."""
    res = await db.execute(select(Permission).order_by(Permission.module, Permission.code))
    perms = res.scalars().all()
    return [
        PermissionResponse(
            id=p.id,
            code=p.code,
            module=p.module,
            description=p.description
        )
        for p in perms
    ]

@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_role(
    req: RoleCreateRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("roles:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Define a custom organization role with a tailored set of permissions."""
    if not tenant_id:
        raise ValidationException("No active tenant context.")

    # Check for duplicate role name in tenant
    dup_res = await db.execute(
        select(Role).where(Role.tenant_id == tenant_id, Role.name == req.name.strip())
    )
    if dup_res.scalar_one_or_none():
        raise ConflictException(f"A role named '{req.name}' already exists in your organization.")

    # Find permissions
    perms_res = await db.execute(select(Permission).where(Permission.code.in_(req.permissions)))
    matched_perms = perms_res.scalars().all()

    role = Role(
        tenant_id=tenant_id,
        name=req.name.strip(),
        description=req.description,
        is_system_role=False,
        is_platform_role=False
    )
    role.permissions = list(matched_perms)
    db.add(role)
    await db.commit()
    await db.refresh(role)

    await audit_service.log_event(
        db, action="role.created", resource_type="role",
        tenant_id=tenant_id, actor_id=current_user.id, actor_name=current_user.full_name,
        resource_id=str(role.id), metadata={"name": role.name, "permissions": req.permissions}
    )

    return RoleResponse(
        id=role.id,
        tenant_id=role.tenant_id,
        name=role.name,
        description=role.description,
        is_system_role=role.is_system_role,
        is_platform_role=role.is_platform_role,
        permissions=[p.code for p in matched_perms]
    )
