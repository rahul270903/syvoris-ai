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
from app.schemas.crm import (
    LeadCreate, LeadUpdate, LeadResponse, PaginatedList,
    LeadConvertRequest, LeadConvertResponse
)
from app.services.lead_service import LeadService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[LeadResponse])
async def list_leads(
    q: Optional[str] = Query(None, description="Search term for name, company, email, phone, ref"),
    status: Optional[str] = Query(None, description="Lead status filter"),
    source: Optional[str] = Query(None, description="Lead source channel filter"),
    min_score: Optional[int] = Query(None, ge=0, le=100, description="Minimum lead score filter"),
    owner_id: Optional[uuid.UUID] = Query(None, description="Owner user filter"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("leads:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve paginated leads for the active tenant organization."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await LeadService.list_leads(
        db=db,
        tenant_id=tenant_id,
        q=q,
        status=status,
        source=source,
        min_score=min_score,
        owner_id=owner_id,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )

    return PaginatedList[LeadResponse](
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    req: LeadCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("leads:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new prospect lead with automated scoring and ref generation."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await LeadService.create_lead(
        db=db,
        tenant_id=tenant_id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}", response_model=LeadResponse)
async def get_lead(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("leads:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve detailed lead record by ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await LeadService.get_lead(db, tenant_id=tenant_id, lead_id=id)

@router.patch("/{id}", response_model=LeadResponse)
async def patch_lead(
    id: uuid.UUID,
    req: LeadUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("leads:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update lead attributes, progress qualification status, or recalculate score."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await LeadService.update_lead(
        db=db,
        tenant_id=tenant_id,
        lead_id=id,
        patch=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.put("/{id}", response_model=LeadResponse)
async def put_lead(
    id: uuid.UUID,
    req: LeadUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("leads:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update lead record attributes."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await LeadService.update_lead(
        db=db,
        tenant_id=tenant_id,
        lead_id=id,
        patch=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def archive_lead(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("leads:write")),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete (archive) a lead record."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await LeadService.delete_lead(
        db=db,
        tenant_id=tenant_id,
        lead_id=id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
    return {"message": "Lead record archived successfully."}

@router.post("/{id}/convert", response_model=LeadConvertResponse, status_code=status.HTTP_200_OK)
async def convert_lead(
    id: uuid.UUID,
    req: LeadConvertRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("leads:write")),
    db: AsyncSession = Depends(get_db)
):
    """
    Execute atomic lead conversion:
    Atomically creates/links Account, creates Contact, creates Opportunity,
    and logs activity timeline entry in a single ACID transaction.
    """
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await LeadService.convert_lead(
        db=db,
        tenant_id=tenant_id,
        lead_id=id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
