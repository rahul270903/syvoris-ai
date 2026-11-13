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
from app.schemas.sales import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.crm import PaginatedList
from app.services.product_service import product_service
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[ProductResponse])
async def list_products(
    category: Optional[str] = Query(None, description="Category filter"),
    is_active: Optional[bool] = Query(None, description="Active status filter"),
    q: Optional[str] = Query(None, description="Search term for name or SKU"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    skip = (page - 1) * limit
    items, total = await product_service.list_products(
        session=db,
        tenant_id=tenant_id,
        category=category,
        is_active=is_active,
        q=q,
        skip=skip,
        limit=limit
    )
    pages = (total + limit - 1) // limit if limit > 0 else 1
    return PaginatedList(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await product_service.create_product(
        session=db,
        tenant_id=tenant_id,
        data=data,
        actor_id=current_user.id
    )

@router.get("/{id}", response_model=ProductResponse)
async def get_product(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await product_service.get_product(
        session=db,
        tenant_id=tenant_id,
        product_id=id
    )

@router.patch("/{id}", response_model=ProductResponse)
async def update_product(
    id: uuid.UUID,
    data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await product_service.update_product(
        session=db,
        tenant_id=tenant_id,
        product_id=id,
        data=data,
        actor_id=current_user.id
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await product_service.delete_product(
        session=db,
        tenant_id=tenant_id,
        product_id=id,
        actor_id=current_user.id
    )
