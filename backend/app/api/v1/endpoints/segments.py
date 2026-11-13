import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.models.user import User
from app.schemas.marketing import (
    AudienceSegmentCreate,
    AudienceSegmentUpdate,
    AudienceSegmentResponse,
    PaginatedList
)
from app.services.segment_service import SegmentService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[AudienceSegmentResponse])
async def list_segments(
    q: Optional[str] = Query(None, description="Search term for name or ref"),
    segment_type: Optional[str] = Query(None, description="Dynamic or Static"),
    is_active: Optional[bool] = Query(None, description="Active status filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("segments:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve paginated audience segments."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await SegmentService.list_segments(
        db=db,
        tenant_id=tenant_id,
        q=q,
        segment_type=segment_type,
        is_active=is_active,
        page=page,
        limit=limit
    )
    return PaginatedList(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("", response_model=AudienceSegmentResponse, status_code=status.HTTP_201_CREATED)
async def create_segment(
    segment_in: AudienceSegmentCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("segments:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create an audience segment."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await SegmentService.create_segment(
        db=db,
        segment_in=segment_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}", response_model=AudienceSegmentResponse)
async def get_segment(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("segments:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve an audience segment by ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await SegmentService.get_segment(db, segment_id=id, tenant_id=tenant_id)

@router.patch("/{id}", response_model=AudienceSegmentResponse)
async def update_segment(
    id: uuid.UUID,
    segment_in: AudienceSegmentUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("segments:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update an audience segment."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await SegmentService.update_segment(
        db=db,
        segment_id=id,
        segment_in=segment_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_segment(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("segments:write")),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete an audience segment."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await SegmentService.delete_segment(
        db=db,
        segment_id=id,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/{id}/evaluate", response_model=Dict[str, Any])
async def evaluate_segment(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("segments:read")),
    db: AsyncSession = Depends(get_db)
):
    """Evaluate segment criteria against contacts and leads and update member count."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await SegmentService.evaluate_segment(db, segment_id=id, tenant_id=tenant_id)
