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
from app.schemas.marketing import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignMemberCreate,
    CampaignMemberResponse,
    CampaignAttributionResponse,
    PaginatedList
)
from app.services.campaign_service import CampaignService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[CampaignResponse])
async def list_campaigns(
    q: Optional[str] = Query(None, description="Search term for name or ref"),
    type: Optional[str] = Query(None, description="Campaign type"),
    status: Optional[str] = Query(None, description="Campaign status"),
    owner_id: Optional[uuid.UUID] = Query(None, description="Campaign owner ID"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("campaigns:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve paginated marketing campaigns."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await CampaignService.list_campaigns(
        db=db,
        tenant_id=tenant_id,
        q=q,
        type=type,
        status=status,
        owner_id=owner_id,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )
    return PaginatedList(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign_in: CampaignCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("campaigns:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new marketing campaign."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CampaignService.create_campaign(
        db=db,
        campaign_in=campaign_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}", response_model=CampaignResponse)
async def get_campaign(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("campaigns:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve a campaign by ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CampaignService.get_campaign(db, campaign_id=id, tenant_id=tenant_id)

@router.patch("/{id}", response_model=CampaignResponse)
async def update_campaign(
    id: uuid.UUID,
    campaign_in: CampaignUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("campaigns:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update a campaign's attributes."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CampaignService.update_campaign(
        db=db,
        campaign_id=id,
        campaign_in=campaign_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/{id}/status", response_model=CampaignResponse)
async def transition_campaign_status(
    id: uuid.UUID,
    new_status: str = Query(..., description="Target status: Planning, Active, Paused, Completed, Cancelled"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("campaigns:write")),
    db: AsyncSession = Depends(get_db)
):
    """Transition campaign status lifecycle."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CampaignService.transition_status(
        db=db,
        campaign_id=id,
        new_status=new_status,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("campaigns:write")),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a campaign."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await CampaignService.delete_campaign(
        db=db,
        campaign_id=id,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}/attribution", response_model=CampaignAttributionResponse)
async def get_campaign_attribution(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("campaigns:read")),
    db: AsyncSession = Depends(get_db)
):
    """Get calculated ROI, leads generated, and pipeline attribution for a campaign."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CampaignService.get_attribution(db, campaign_id=id, tenant_id=tenant_id)

@router.get("/{id}/members", response_model=PaginatedList[CampaignMemberResponse])
async def list_campaign_members(
    id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("campaigns:read")),
    db: AsyncSession = Depends(get_db)
):
    """List members belonging to a campaign."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await CampaignService.list_members(
        db=db,
        campaign_id=id,
        tenant_id=tenant_id,
        page=page,
        limit=limit
    )
    return PaginatedList(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("/{id}/members", response_model=CampaignMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_campaign_member(
    id: uuid.UUID,
    member_in: CampaignMemberCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("campaigns:write")),
    db: AsyncSession = Depends(get_db)
):
    """Add a lead or contact to a campaign."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await CampaignService.add_member(
        db=db,
        campaign_id=id,
        member_in=member_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
