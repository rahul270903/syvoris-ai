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
    AccountCreate, AccountUpdate, AccountResponse, PaginatedList,
    Customer360Response, CRMActivityCreate, CRMActivityResponse,
    AccountHierarchyResponse
)
from app.services.account_service import AccountService
from app.services.hierarchy_service import HierarchyService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[AccountResponse])
async def list_accounts(
    q: Optional[str] = Query(None, description="Search term for name, ref, industry, email"),
    industry: Optional[str] = Query(None, description="Industry filter"),
    status: Optional[str] = Query(None, description="Account status filter"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("accounts:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve paginated accounts for the active tenant organization."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await AccountService.list_accounts(
        db=db,
        tenant_id=tenant_id,
        q=q,
        industry=industry,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )

    return PaginatedList[AccountResponse](
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    req: AccountCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("accounts:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new corporate account under the active organization."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AccountService.create_account(
        db=db,
        tenant_id=tenant_id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}", response_model=AccountResponse)
async def get_account(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("accounts:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve account details by unique account ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AccountService.get_account(db, tenant_id=tenant_id, account_id=id)

@router.put("/{id}", response_model=AccountResponse)
@router.patch("/{id}", response_model=AccountResponse)
async def update_account(
    id: uuid.UUID,
    req: AccountUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("accounts:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update company details, status, or addresses for an existing account."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AccountService.update_account(
        db=db,
        tenant_id=tenant_id,
        account_id=id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def archive_account(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("accounts:write")),
    db: AsyncSession = Depends(get_db)
):
    """Archive (soft-delete) an account from active organization views."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await AccountService.archive_account(
        db=db,
        tenant_id=tenant_id,
        account_id=id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
    return {"message": "Account successfully archived."}

@router.get("/{id}/360", response_model=Customer360Response)
async def get_account_customer_360(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("accounts:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full Customer 360 overview including contacts, activity timeline, and key metrics."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AccountService.get_account_360(db, tenant_id=tenant_id, account_id=id)

@router.post("/{id}/activities", response_model=CRMActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_account_activity(
    id: uuid.UUID,
    req: CRMActivityCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("accounts:write")),
    db: AsyncSession = Depends(get_db)
):
    """Log an interaction, note, or relationship event against an account."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AccountService.create_activity(
        db=db,
        tenant_id=tenant_id,
        account_id=id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}/hierarchy", response_model=AccountHierarchyResponse)
async def get_account_hierarchy_tree(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("accounts:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full recursive account parent-child hierarchy tree and rollup business metrics (CR-02)."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await HierarchyService.get_account_hierarchy(
        db=db,
        tenant_id=tenant_id,
        account_id=id
    )
