import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission,
)
from app.models.user import User
from app.schemas.catalog import (
    VendorProfileCreate,
    VendorProfileUpdate,
    VendorProfileResponse,
    VendorProductCreate,
    VendorProductResponse,
)
from app.services.vendor_service import vendor_service
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=List[VendorProfileResponse])
async def list_vendors(
    vendor_category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("vendors:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await vendor_service.list_vendors(db, tenant_id, vendor_category=vendor_category, status=status_filter, search=q)

@router.get("/{vendor_id}", response_model=VendorProfileResponse)
async def get_vendor(
    vendor_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("vendors:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await vendor_service.get_vendor(db, tenant_id, vendor_id)

@router.post("", response_model=VendorProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    data: VendorProfileCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("vendors:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await vendor_service.create_vendor(db, tenant_id, data)

@router.put("/{vendor_id}", response_model=VendorProfileResponse)
async def update_vendor(
    vendor_id: uuid.UUID,
    data: VendorProfileUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("vendors:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await vendor_service.update_vendor(db, tenant_id, vendor_id, data)

@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(
    vendor_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("vendors:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    await vendor_service.delete_vendor(db, tenant_id, vendor_id)

# ---------------------------------------------------------------------------
# Vendor Supply Products
# ---------------------------------------------------------------------------

@router.post("/{vendor_id}/products", response_model=VendorProductResponse, status_code=status.HTTP_201_CREATED)
async def add_vendor_product(
    vendor_id: uuid.UUID,
    data: VendorProductCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("vendors:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await vendor_service.add_vendor_product(db, tenant_id, vendor_id, data)

@router.delete("/{vendor_id}/products/{vendor_product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_vendor_product(
    vendor_id: uuid.UUID,
    vendor_product_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("vendors:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    await vendor_service.remove_vendor_product(db, tenant_id, vendor_product_id)
