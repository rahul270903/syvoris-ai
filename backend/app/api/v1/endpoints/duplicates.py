import uuid
from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, get_current_active_tenant_id, require_permission
from app.models.user import User
from app.schemas.crm import (
    DuplicateScanRequest,
    DuplicateScanResponse,
    RecordMergeRequest,
    RecordMergeResponse
)
from app.services.duplicate_service import DuplicateService
from app.core.errors import ValidationException

router = APIRouter()

@router.post("/scan", response_model=DuplicateScanResponse)
async def scan_for_duplicates(
    req: DuplicateScanRequest,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("accounts:read")),
    db: AsyncSession = Depends(get_db)
):
    """Scan candidate accounts, contacts, or leads for potential duplicate records using rule-based and fuzzy similarity matching."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await DuplicateService.scan_duplicates(
        db=db,
        tenant_id=tenant_id,
        entity_type=req.entity_type,
        limit=req.limit
    )

@router.post("/merge", response_model=RecordMergeResponse, status_code=status.HTTP_200_OK)
async def merge_duplicate_records(
    req: RecordMergeRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("accounts:write")),
    db: AsyncSession = Depends(get_db)
):
    """Atomically merge duplicate records into a surviving master record with relationship re-pointing and audit trail (CR-04)."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await DuplicateService.merge_records(
        db=db,
        tenant_id=tenant_id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
