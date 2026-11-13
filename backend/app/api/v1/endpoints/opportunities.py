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
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityResponse,
    OpportunityStageTransitionRequest,
    PipelineResponse,
    PaginatedList
)
from app.services.opportunity_service import OpportunityService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("/pipelines", response_model=List[PipelineResponse])
async def list_pipelines(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("opportunities:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve active sales pipelines and stage configurations for the organization."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await OpportunityService.list_pipelines(db, tenant_id=tenant_id)

@router.get("", response_model=PaginatedList[OpportunityResponse])
async def list_opportunities(
    q: Optional[str] = Query(None, description="Search term for name or ref"),
    stage: Optional[str] = Query(None, description="Pipeline stage filter"),
    pipeline_id: Optional[str] = Query(None, description="Pipeline ID filter"),
    forecast_category: Optional[str] = Query(None, description="Forecast category filter"),
    owner_id: Optional[uuid.UUID] = Query(None, description="Owner ID filter"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("opportunities:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve paginated opportunities for the active organization."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await OpportunityService.list_opportunities(
        db=db,
        tenant_id=tenant_id,
        q=q,
        stage=stage,
        pipeline_id=pipeline_id,
        forecast_category=forecast_category,
        owner_id=owner_id,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )
    return PaginatedList(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.post("", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    req: OpportunityCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("opportunities:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new commercial deal / opportunity in the pipeline."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await OpportunityService.create_opportunity(
        db=db,
        tenant_id=tenant_id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}", response_model=OpportunityResponse)
async def get_opportunity(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("opportunities:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve a single opportunity by ID, including stage history and linked contacts."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await OpportunityService.get_opportunity(db, tenant_id=tenant_id, opportunity_id=id)

@router.put("/{id}", response_model=OpportunityResponse)
@router.patch("/{id}", response_model=OpportunityResponse)
async def update_opportunity(
    id: uuid.UUID,
    req: OpportunityUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("opportunities:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update opportunity attributes, value, close date, or stage."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await OpportunityService.update_opportunity(
        db=db,
        tenant_id=tenant_id,
        opportunity_id=id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/{id}/stage", response_model=OpportunityResponse)
async def transition_opportunity_stage(
    id: uuid.UUID,
    req: OpportunityStageTransitionRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("opportunities:write")),
    db: AsyncSession = Depends(get_db)
):
    """Progress an opportunity across stages with strict stage-gate validation and velocity logging (OP-01, OP-02)."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await OpportunityService.transition_stage(
        db=db,
        tenant_id=tenant_id,
        opportunity_id=id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_opportunity(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("opportunities:write")),
    db: AsyncSession = Depends(get_db)
):
    """Archive an opportunity from active sales views."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await OpportunityService.delete_opportunity(
        db=db,
        tenant_id=tenant_id,
        opportunity_id=id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
    return {"message": "Opportunity successfully archived."}
