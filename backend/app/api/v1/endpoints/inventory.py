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
    TaxRuleCreate,
    TaxRuleUpdate,
    TaxRuleResponse,
    CommercialTermsCreate,
    CommercialTermsUpdate,
    CommercialTermsResponse,
    WarehouseLocationCreate,
    WarehouseLocationUpdate,
    WarehouseLocationResponse,
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    StockMovementCreate,
    StockMovementResponse,
)
from app.services.catalog_service import catalog_service
from app.services.inventory_service import inventory_service
from app.core.errors import ValidationException

router = APIRouter()

# ---------------------------------------------------------------------------
# Taxes
# ---------------------------------------------------------------------------

@router.get("/taxes", response_model=List[TaxRuleResponse])
async def list_taxes(
    status_filter: Optional[str] = Query(None, alias="status"),
    region: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("taxes:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await catalog_service.list_tax_rules(db, tenant_id, status=status_filter, region=region, search=q)

@router.get("/taxes/{tax_id}", response_model=TaxRuleResponse)
async def get_tax(
    tax_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("taxes:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await catalog_service.get_tax_rule(db, tenant_id, tax_id)

@router.post("/taxes", response_model=TaxRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_tax(
    data: TaxRuleCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("taxes:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await catalog_service.create_tax_rule(db, tenant_id, data)

@router.put("/taxes/{tax_id}", response_model=TaxRuleResponse)
async def update_tax(
    tax_id: uuid.UUID,
    data: TaxRuleUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("taxes:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await catalog_service.update_tax_rule(db, tenant_id, tax_id, data)

@router.delete("/taxes/{tax_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tax(
    tax_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("taxes:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    await catalog_service.delete_tax_rule(db, tenant_id, tax_id)

# ---------------------------------------------------------------------------
# Commercial Terms
# ---------------------------------------------------------------------------

@router.get("/terms", response_model=List[CommercialTermsResponse])
async def list_terms(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("terms:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await catalog_service.list_commercial_terms(db, tenant_id, category=category, status=status_filter, search=q)

@router.get("/terms/{term_id}", response_model=CommercialTermsResponse)
async def get_term(
    term_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("terms:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await catalog_service.get_commercial_term(db, tenant_id, term_id)

@router.post("/terms", response_model=CommercialTermsResponse, status_code=status.HTTP_201_CREATED)
async def create_term(
    data: CommercialTermsCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("terms:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    author = current_user.full_name or current_user.email or "Admin"
    return await catalog_service.create_commercial_term(db, tenant_id, data, author_name=author)

@router.put("/terms/{term_id}", response_model=CommercialTermsResponse)
async def update_term(
    term_id: uuid.UUID,
    data: CommercialTermsUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("terms:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    author = current_user.full_name or current_user.email or "Admin"
    return await catalog_service.update_commercial_term(db, tenant_id, term_id, data, actor_name=author)

@router.delete("/terms/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_term(
    term_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("terms:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    await catalog_service.delete_commercial_term(db, tenant_id, term_id)

# ---------------------------------------------------------------------------
# Warehouse Locations
# ---------------------------------------------------------------------------

@router.get("/locations", response_model=List[WarehouseLocationResponse])
async def list_locations(
    is_active: Optional[bool] = Query(None),
    q: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    locs = await inventory_service.list_locations(db, tenant_id, is_active=is_active, search=q)
    return [
        WarehouseLocationResponse(
            id=loc.id,
            tenant_id=loc.tenant_id,
            ref=loc.ref,
            name=loc.name,
            code=loc.code,
            address=loc.address,
            city=loc.city,
            country=loc.country,
            is_active=loc.is_active,
            is_default=loc.is_default,
            manager_name=loc.manager_name,
            custom_fields=loc.custom_fields,
            created_at=loc.created_at,
            updated_at=loc.updated_at,
            items_count=len(loc.inventory_items) if loc.inventory_items else 0,
        )
        for loc in locs
    ]

@router.get("/locations/{location_id}", response_model=WarehouseLocationResponse)
async def get_location(
    location_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    loc = await inventory_service.get_location(db, tenant_id, location_id)
    return WarehouseLocationResponse(
        id=loc.id,
        tenant_id=loc.tenant_id,
        ref=loc.ref,
        name=loc.name,
        code=loc.code,
        address=loc.address,
        city=loc.city,
        country=loc.country,
        is_active=loc.is_active,
        is_default=loc.is_default,
        manager_name=loc.manager_name,
        custom_fields=loc.custom_fields,
        created_at=loc.created_at,
        updated_at=loc.updated_at,
        items_count=len(loc.inventory_items) if loc.inventory_items else 0,
    )

@router.post("/locations", response_model=WarehouseLocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    data: WarehouseLocationCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    loc = await inventory_service.create_location(db, tenant_id, data)
    return WarehouseLocationResponse(
        id=loc.id,
        tenant_id=loc.tenant_id,
        ref=loc.ref,
        name=loc.name,
        code=loc.code,
        address=loc.address,
        city=loc.city,
        country=loc.country,
        is_active=loc.is_active,
        is_default=loc.is_default,
        manager_name=loc.manager_name,
        custom_fields=loc.custom_fields,
        created_at=loc.created_at,
        updated_at=loc.updated_at,
        items_count=0,
    )

@router.put("/locations/{location_id}", response_model=WarehouseLocationResponse)
async def update_location(
    location_id: uuid.UUID,
    data: WarehouseLocationUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    loc = await inventory_service.update_location(db, tenant_id, location_id, data)
    return WarehouseLocationResponse(
        id=loc.id,
        tenant_id=loc.tenant_id,
        ref=loc.ref,
        name=loc.name,
        code=loc.code,
        address=loc.address,
        city=loc.city,
        country=loc.country,
        is_active=loc.is_active,
        is_default=loc.is_default,
        manager_name=loc.manager_name,
        custom_fields=loc.custom_fields,
        created_at=loc.created_at,
        updated_at=loc.updated_at,
        items_count=len(loc.inventory_items) if loc.inventory_items else 0,
    )

@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    await inventory_service.delete_location(db, tenant_id, location_id)

# ---------------------------------------------------------------------------
# Stock Management & Inventory Items
# ---------------------------------------------------------------------------

@router.get("/stock", response_model=List[InventoryItemResponse])
@router.get("/items", response_model=List[InventoryItemResponse])
async def list_stock_items(
    location_id: Optional[uuid.UUID] = Query(None),
    product_id: Optional[uuid.UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await inventory_service.list_inventory_items(
        db, tenant_id, location_id=location_id, product_id=product_id, status=status_filter, search=q
    )

@router.post("/stock", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
async def initialize_inventory_item(
    data: InventoryItemCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    item = await inventory_service.get_or_create_inventory_item(
        db,
        tenant_id,
        product_id=data.product_id,
        location_id=data.location_id,
        reorder_threshold=data.reorder_threshold,
        reorder_quantity=data.reorder_quantity,
        unit_of_measure=data.unit_of_measure,
    )
    items = await inventory_service.list_inventory_items(db, tenant_id, product_id=data.product_id, location_id=data.location_id)
    return items[0]

@router.get("/stock/{item_id}", response_model=InventoryItemResponse)
@router.get("/items/{item_id}", response_model=InventoryItemResponse)
async def get_inventory_item(
    item_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    items = await inventory_service.list_inventory_items(db, tenant_id)
    match = [i for i in items if i["id"] == item_id]
    if not match:
        raise ValidationException("Inventory item not found.")
    return match[0]

@router.put("/stock/{item_id}", response_model=InventoryItemResponse)
@router.put("/items/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(
    item_id: uuid.UUID,
    data: InventoryItemUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    await inventory_service.update_inventory_item(db, tenant_id, item_id, data)
    items = await inventory_service.list_inventory_items(db, tenant_id)
    match = [i for i in items if i["id"] == item_id]
    if not match:
        raise ValidationException("Item updated but could not be retrieved.")
    return match[0]

# ---------------------------------------------------------------------------
# Stock Movements
# ---------------------------------------------------------------------------

@router.get("/movements", response_model=List[StockMovementResponse])
async def list_movements(
    inventory_item_id: Optional[uuid.UUID] = Query(None),
    movement_type: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await inventory_service.list_stock_movements(
        db, tenant_id, inventory_item_id=inventory_item_id, movement_type=movement_type
    )

@router.post("/movements", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
async def record_movement(
    data: StockMovementCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("inventory:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    user_name = current_user.full_name or current_user.email or "System"
    return await inventory_service.record_stock_movement(
        db, tenant_id, data, user_id=current_user.id, user_name=user_name
    )
