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
from app.schemas.sales import (
    PriceBookCreate, PriceBookUpdate, PriceBookResponse, PriceBookEntryResponse
)
from app.schemas.crm import PaginatedList
from app.services.product_service import product_service
from app.core.errors import ValidationException

router = APIRouter()

def _serialize_price_book(pb) -> PriceBookResponse:
    entries = []
    for e in getattr(pb, "entries", []):
        entries.append(PriceBookEntryResponse(
            id=e.id,
            price_book_id=e.price_book_id,
            product_id=e.product_id,
            product_name=e.product.name if e.product else None,
            product_sku=e.product.sku if e.product else None,
            list_price=e.list_price,
            currency=e.currency,
            is_active=e.is_active
        ))
    return PriceBookResponse(
        id=pb.id,
        tenant_id=pb.tenant_id,
        name=pb.name,
        description=pb.description,
        currency=pb.currency,
        is_default=pb.is_default,
        is_active=pb.is_active,
        valid_from=pb.valid_from,
        valid_to=pb.valid_to,
        custom_fields=pb.custom_fields,
        entries=entries,
        created_at=pb.created_at,
        updated_at=pb.updated_at
    )

@router.get("", response_model=PaginatedList[PriceBookResponse])
async def list_price_books(
    is_active: Optional[bool] = Query(None, description="Active filter"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    skip = (page - 1) * limit
    items, total = await product_service.list_price_books(
        session=db,
        tenant_id=tenant_id,
        is_active=is_active,
        skip=skip,
        limit=limit
    )
    pages = (total + limit - 1) // limit if limit > 0 else 1
    serialized = [_serialize_price_book(pb) for pb in items]
    return PaginatedList(
        items=serialized,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.post("", response_model=PriceBookResponse, status_code=status.HTTP_201_CREATED)
async def create_price_book(
    data: PriceBookCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    pb = await product_service.create_price_book(
        session=db,
        tenant_id=tenant_id,
        data=data,
        actor_id=current_user.id
    )
    return _serialize_price_book(pb)

@router.get("/{id}", response_model=PriceBookResponse)
async def get_price_book(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    pb = await product_service.get_price_book(
        session=db,
        tenant_id=tenant_id,
        price_book_id=id
    )
    return _serialize_price_book(pb)

@router.patch("/{id}", response_model=PriceBookResponse)
async def update_price_book(
    id: uuid.UUID,
    data: PriceBookUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    pb = await product_service.update_price_book(
        session=db,
        tenant_id=tenant_id,
        price_book_id=id,
        data=data,
        actor_id=current_user.id
    )
    return _serialize_price_book(pb)
