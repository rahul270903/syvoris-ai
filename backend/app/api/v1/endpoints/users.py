import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.models.user import User
from app.schemas.user import (
    UserInviteRequest,
    UserMemberResponse,
    UserUpdateRequest,
    UserRoleAssignRequest
)
from app.services.user_service import user_service
from app.core.errors import ValidationException

router = APIRouter()

@router.get("/", response_model=List[UserMemberResponse])
async def list_organization_users(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("users:read")),
    db: AsyncSession = Depends(get_db)
):
    """List team members and user memberships for the active tenant."""
    if not tenant_id:
        raise ValidationException("No active tenant context.")
    return await user_service.list_tenant_users(db, tenant_id)

@router.post("/invite", response_model=UserMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_user_to_tenant(
    req: UserInviteRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("users:invite")),
    db: AsyncSession = Depends(get_db)
):
    """Invite an employee to join the organization with a designated role."""
    if not tenant_id:
        raise ValidationException("No active tenant context.")
    return await user_service.invite_user(
        db,
        tenant_id=tenant_id,
        req=req,
        inviter_id=current_user.id,
        inviter_name=current_user.full_name
    )

@router.put("/{member_id}/status", status_code=status.HTTP_200_OK)
async def update_member_status(
    member_id: uuid.UUID,
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Activate, suspend, or remove a team member's access."""
    if not tenant_id:
        raise ValidationException("No active tenant context.")
    if not req.status:
        raise ValidationException("Status update value is required.")
    await user_service.update_member_status(
        db,
        tenant_id=tenant_id,
        user_id=member_id,
        new_status=req.status,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
    return {"message": f"User status successfully updated to '{req.status}'."}

@router.put("/{member_id}/role", status_code=status.HTTP_200_OK)
async def assign_member_role(
    member_id: uuid.UUID,
    req: UserRoleAssignRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("roles:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Assign or change a team member's role within the organization."""
    if not tenant_id:
        raise ValidationException("No active tenant context.")
    await user_service.assign_member_role(
        db,
        tenant_id=tenant_id,
        user_id=member_id,
        role_name=req.role_name,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
    return {"message": f"Role '{req.role_name}' successfully assigned to user."}
