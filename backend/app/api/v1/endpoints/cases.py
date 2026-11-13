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
    CaseCreate,
    CaseUpdate,
    CaseResponse,
    CaseTransitionRequest,
    CaseCommentCreate,
    CaseCommentResponse,
    PaginatedList
)
from app.services.case_service import CaseService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[CaseResponse])
async def list_cases(
    q: Optional[str] = Query(None, description="Search term for subject, ref or description"),
    status: Optional[str] = Query(None, description="Case status filter"),
    priority: Optional[str] = Query(None, description="Priority filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    account_id: Optional[uuid.UUID] = Query(None, description="Account filter"),
    contact_id: Optional[uuid.UUID] = Query(None, description="Contact filter"),
    assigned_user_id: Optional[uuid.UUID] = Query(None, description="Assigned agent filter"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve paginated customer service cases."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await CaseService.list_cases(
        db=db,
        tenant_id=tenant_id,
        q=q,
        status=status,
        priority=priority,
        category=category,
        account_id=account_id,
        contact_id=contact_id,
        assigned_user_id=assigned_user_id,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )
    return PaginatedList(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    case_in: CaseCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new service case with automated SLA targets."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CaseService.create_case(
        db=db,
        case_in=case_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}", response_model=CaseResponse)
async def get_case(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve a customer case by ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CaseService.get_case(db, case_id=id, tenant_id=tenant_id)

@router.patch("/{id}", response_model=CaseResponse)
async def update_case(
    id: uuid.UUID,
    case_in: CaseUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update case attributes."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CaseService.update_case(
        db=db,
        case_id=id,
        case_in=case_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/{id}/transition", response_model=CaseResponse)
async def transition_case(
    id: uuid.UUID,
    transition_in: CaseTransitionRequest,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Transition case lifecycle (New, Assigned, In Progress, Awaiting Customer, Resolved, Closed)."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CaseService.transition_case(
        db=db,
        case_id=id,
        transition_in=transition_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a service case."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await CaseService.delete_case(
        db=db,
        case_id=id,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}/comments", response_model=List[CaseCommentResponse])
async def list_case_comments(
    id: uuid.UUID,
    include_internal: bool = Query(True, description="Whether to include internal staff notes"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List comments and timeline updates on a case."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CaseService.list_comments(
        db=db,
        case_id=id,
        tenant_id=tenant_id,
        include_internal=include_internal
    )

@router.post("/{id}/comments", response_model=CaseCommentResponse, status_code=status.HTTP_201_CREATED)
async def add_case_comment(
    id: uuid.UUID,
    comment_in: CaseCommentCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Add a customer or internal comment to a case."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CaseService.add_comment(
        db=db,
        case_id=id,
        comment_in=comment_in,
        tenant_id=tenant_id,
        author_id=current_user.id,
        author_name=current_user.full_name
    )
