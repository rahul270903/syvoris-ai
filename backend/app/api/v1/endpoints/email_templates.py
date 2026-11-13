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
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplateResponse,
    PaginatedList
)
from app.services.email_template_service import EmailTemplateService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[EmailTemplateResponse])
async def list_templates(
    q: Optional[str] = Query(None, description="Search term"),
    category: Optional[str] = Query(None, description="Category filter"),
    is_active: Optional[bool] = Query(None, description="Active status filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("marketing:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve paginated email templates."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await EmailTemplateService.list_templates(
        db=db,
        tenant_id=tenant_id,
        q=q,
        category=category,
        is_active=is_active,
        page=page,
        limit=limit
    )
    return PaginatedList(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_in: EmailTemplateCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("marketing:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new reusable email template."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await EmailTemplateService.create_template(
        db=db,
        tpl_in=template_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}", response_model=EmailTemplateResponse)
async def get_template(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("marketing:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve an email template by ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await EmailTemplateService.get_template(db, template_id=id, tenant_id=tenant_id)

@router.patch("/{id}", response_model=EmailTemplateResponse)
async def update_template(
    id: uuid.UUID,
    template_in: EmailTemplateUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("marketing:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update an email template."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await EmailTemplateService.update_template(
        db=db,
        template_id=id,
        tpl_in=template_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("marketing:write")),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete an email template."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await EmailTemplateService.delete_template(
        db=db,
        template_id=id,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
