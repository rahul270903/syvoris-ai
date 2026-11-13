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
    CustomerSurveyCreate,
    CustomerSurveyUpdate,
    CustomerSurveyResponse,
    SurveyResponseCreate,
    SurveyResponseItem,
    CSATSummaryResponse,
    PaginatedList
)
from app.services.feedback_service import FeedbackService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=List[CustomerSurveyResponse])
async def list_surveys(
    is_active: Optional[bool] = Query(None, description="Active status filter"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("surveys:read")),
    db: AsyncSession = Depends(get_db)
):
    """List customer surveys."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await FeedbackService.list_surveys(db, tenant_id=tenant_id, is_active=is_active)

@router.post("", response_model=CustomerSurveyResponse, status_code=status.HTTP_201_CREATED)
async def create_survey(
    survey_in: CustomerSurveyCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("surveys:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new survey."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await FeedbackService.create_survey(
        db=db,
        survey_in=survey_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/csat-summary", response_model=CSATSummaryResponse)
async def get_csat_summary(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("surveys:read")),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated CSAT %, average score, and NPS breakdown."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await FeedbackService.get_csat_summary(db, tenant_id=tenant_id)

@router.get("/responses", response_model=PaginatedList[SurveyResponseItem])
async def list_survey_responses(
    survey_id: Optional[uuid.UUID] = Query(None, description="Survey ID filter"),
    case_id: Optional[uuid.UUID] = Query(None, description="Case ID filter"),
    account_id: Optional[uuid.UUID] = Query(None, description="Account ID filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("surveys:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve responses collected from customer surveys."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await FeedbackService.list_responses(
        db=db,
        tenant_id=tenant_id,
        survey_id=survey_id,
        case_id=case_id,
        account_id=account_id,
        page=page,
        limit=limit
    )
    return PaginatedList(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("/responses", response_model=SurveyResponseItem, status_code=status.HTTP_201_CREATED)
async def submit_survey_response(
    response_in: SurveyResponseCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("surveys:write")),
    db: AsyncSession = Depends(get_db)
):
    """Submit a response to a survey (e.g. after case resolution or quarterly NPS)."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await FeedbackService.submit_response(
        db=db,
        resp_in=response_in,
        tenant_id=tenant_id
    )

@router.get("/{id}", response_model=CustomerSurveyResponse)
async def get_survey(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("surveys:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve survey details by ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await FeedbackService.get_survey(db, survey_id=id, tenant_id=tenant_id)
