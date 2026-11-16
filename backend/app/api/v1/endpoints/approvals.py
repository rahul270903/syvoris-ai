import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.schemas.sales import ApprovalRequestResponse, ApprovalDecisionRequest
from app.schemas.crm import PaginatedList
from app.services.approval_service import approval_service
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[ApprovalRequestResponse])
async def list_approvals(
    status: Optional[str] = Query(None, description="Approval status filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    entity_type: Optional[str] = Query(None, description="Entity type filter"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    skip = (page - 1) * limit
    items, total = await approval_service.list_approvals(
        session=db,
        tenant_id=tenant_id,
        status=status,
        category=category,
        entity_type=entity_type,
        skip=skip,
        limit=limit
    )
    pages = (total + limit - 1) // limit if limit > 0 else 1
    return PaginatedList(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/{id}", response_model=ApprovalRequestResponse)
async def get_approval(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await approval_service.get_approval(
        session=db,
        tenant_id=tenant_id,
        approval_id=id
    )

@router.post("/{id}/decision", response_model=ApprovalRequestResponse)
async def decide_approval(
    id: uuid.UUID,
    data: ApprovalDecisionRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:approve")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    approver_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    return await approval_service.decide_approval(
        session=db,
        tenant_id=tenant_id,
        approval_id=id,
        decision=data.decision,
        comments=data.notes or data.comments,
        approver_id=current_user.id,
        approver_name=approver_name
    )
