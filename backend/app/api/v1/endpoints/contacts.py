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
    ContactCreate, ContactUpdate, ContactResponse, PaginatedList
)
from app.services.contact_service import ContactService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[ContactResponse])
async def list_contacts(
    q: Optional[str] = Query(None, description="Search term for name, email, phone, title"),
    account_id: Optional[uuid.UUID] = Query(None, description="Filter by parent account"),
    status: Optional[str] = Query(None, description="Contact status filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("contacts:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve paginated contacts for the active tenant organization."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await ContactService.list_contacts(
        db=db,
        tenant_id=tenant_id,
        q=q,
        account_id=account_id,
        status=status,
        page=page,
        limit=limit
    )

    return PaginatedList[ContactResponse](
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    req: ContactCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("contacts:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new contact stakeholder linked to an account."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await ContactService.create_contact(
        db=db,
        tenant_id=tenant_id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}", response_model=ContactResponse)
async def get_contact(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("contacts:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve contact details by unique contact ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await ContactService.get_contact(db, tenant_id=tenant_id, contact_id=id)

@router.put("/{id}", response_model=ContactResponse)
async def update_contact(
    id: uuid.UUID,
    req: ContactUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("contacts:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update contact attributes, phone, title, or primary status."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await ContactService.update_contact(
        db=db,
        tenant_id=tenant_id,
        contact_id=id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def archive_contact(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("contacts:write")),
    db: AsyncSession = Depends(get_db)
):
    """Archive (soft-delete) a contact record."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await ContactService.archive_contact(
        db=db,
        tenant_id=tenant_id,
        contact_id=id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
    return {"message": "Contact successfully archived."}
