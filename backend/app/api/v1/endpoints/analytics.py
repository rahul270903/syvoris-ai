import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.models.user import User
from app.schemas.ai import (
    ForecastSummaryResponse,
    CustomReportCreate,
    CustomReportResponse,
)
from app.services.analytics_service import AnalyticsService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("/forecast", response_model=ForecastSummaryResponse)
async def get_forecast_summary(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("analytics:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve revenue forecasting rollups aggregated by forecast category and opportunity stage."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AnalyticsService.get_forecast_summary(db, tenant_id=tenant_id)

@router.get("/reports", response_model=List[CustomReportResponse])
async def list_reports(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("analytics:read")),
    db: AsyncSession = Depends(get_db)
):
    """List custom business reports."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AnalyticsService.list_reports(db, tenant_id=tenant_id)

@router.post("/reports", response_model=CustomReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_in: CustomReportCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("reports:write")),
    db: AsyncSession = Depends(get_db)
):
    """Save a custom report specification."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AnalyticsService.create_report(
        db=db,
        tenant_id=tenant_id,
        report_in=report_in,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
