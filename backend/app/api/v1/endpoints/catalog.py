import uuid
from datetime import date
from typing import Optional, List
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
    CatalogCategoryCreate,
    CatalogCategoryUpdate,
    CatalogCategoryResponse,
    ServiceItemCreate,
    ServiceItemUpdate,
    ServiceItemResponse,
    ProductBundleCreate,
    ProductBundleUpdate,
    ProductBundleResponse,
    ProductAvailabilityCreate,
    ProductAvailabilityUpdate,
    ProductAvailabilityResponse,
)
from app.services.catalog_service import catalog_service
from app.core.errors import ValidationException

router = APIRouter()

# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

@router.get("/categories", response_model=List[CatalogCategoryResponse])
async def list_categories(
    category_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    parent_id: Optional[uuid.UUID] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("categories:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    categories = await catalog_service.list_categories(
        db, tenant_id, category_type=category_type, is_active=is_active, parent_id=parent_id
    )
    # Build response with parent_name and child count
    res = []
    for c in categories:
        res.append(
            CatalogCategoryResponse(
                id=c.id,
                tenant_id=c.tenant_id,
                ref=c.ref,
                name=c.name,
                slug=c.slug,
                description=c.description,
                category_type=c.category_type,
                parent_id=c.parent_id,
                parent_name=c.parent.name if c.parent else None,
                sort_order=c.sort_order,
                is_active=c.is_active,
                image_url=c.image_url,
                custom_fields=c.custom_fields,
                subcategories_count=len(c.children) if c.children else 0,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
        )
    return res

@router.get("/categories/{category_id}", response_model=CatalogCategoryResponse)
async def get_category(
    category_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("categories:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    c = await catalog_service.get_category(db, tenant_id, category_id)
    return CatalogCategoryResponse(
        id=c.id,
        tenant_id=c.tenant_id,
        ref=c.ref,
        name=c.name,
        slug=c.slug,
        description=c.description,
        category_type=c.category_type,
        parent_id=c.parent_id,
        parent_name=c.parent.name if c.parent else None,
        sort_order=c.sort_order,
        is_active=c.is_active,
        image_url=c.image_url,
        custom_fields=c.custom_fields,
        subcategories_count=len(c.children) if c.children else 0,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )

@router.post("/categories", response_model=CatalogCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CatalogCategoryCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("categories:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    c = await catalog_service.create_category(db, tenant_id, data)
    return CatalogCategoryResponse(
        id=c.id,
        tenant_id=c.tenant_id,
        ref=c.ref,
        name=c.name,
        slug=c.slug,
        description=c.description,
        category_type=c.category_type,
        parent_id=c.parent_id,
        parent_name=c.parent.name if c.parent else None,
        sort_order=c.sort_order,
        is_active=c.is_active,
        image_url=c.image_url,
        custom_fields=c.custom_fields,
        subcategories_count=len(c.children) if c.children else 0,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )

@router.put("/categories/{category_id}", response_model=CatalogCategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    data: CatalogCategoryUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("categories:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    c = await catalog_service.update_category(db, tenant_id, category_id, data)
    return CatalogCategoryResponse(
        id=c.id,
        tenant_id=c.tenant_id,
        ref=c.ref,
        name=c.name,
        slug=c.slug,
        description=c.description,
        category_type=c.category_type,
        parent_id=c.parent_id,
        parent_name=c.parent.name if c.parent else None,
        sort_order=c.sort_order,
        is_active=c.is_active,
        image_url=c.image_url,
        custom_fields=c.custom_fields,
        subcategories_count=len(c.children) if c.children else 0,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("categories:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    await catalog_service.delete_category(db, tenant_id, category_id)

# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------

@router.get("/services", response_model=List[ServiceItemResponse])
async def list_services(
    category_id: Optional[uuid.UUID] = Query(None),
    service_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("services:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    services = await catalog_service.list_services(
        db, tenant_id, category_id=category_id, service_type=service_type, status=status_filter, search=q
    )
    return services

@router.get("/services/{service_id}", response_model=ServiceItemResponse)
async def get_service(
    service_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("services:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await catalog_service.get_service(db, tenant_id, service_id)

@router.post("/services", response_model=ServiceItemResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    data: ServiceItemCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("services:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await catalog_service.create_service(db, tenant_id, data)

@router.put("/services/{service_id}", response_model=ServiceItemResponse)
async def update_service(
    service_id: uuid.UUID,
    data: ServiceItemUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("services:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await catalog_service.update_service(db, tenant_id, service_id, data)

@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("services:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    await catalog_service.delete_service(db, tenant_id, service_id)

# ---------------------------------------------------------------------------
# Bundles
# ---------------------------------------------------------------------------

@router.get("/bundles", response_model=List[ProductBundleResponse])
async def list_bundles(
    status_filter: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("bundles:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    bundles = await catalog_service.list_bundles(db, tenant_id, status=status_filter, search=q)
    res = []
    for b in bundles:
        calculated = catalog_service.calculate_bundle_price(b)
        res.append(
            ProductBundleResponse(
                id=b.id,
                tenant_id=b.tenant_id,
                ref=b.ref,
                name=b.name,
                bundle_code=b.bundle_code,
                description=b.description,
                pricing_model=b.pricing_model,
                bundle_price=b.bundle_price,
                discount_pct=b.discount_pct,
                currency=b.currency,
                valid_from=b.valid_from,
                valid_until=b.valid_until,
                status=b.status,
                is_active=b.is_active,
                custom_fields=b.custom_fields,
                created_at=b.created_at,
                updated_at=b.updated_at,
                components=b.components,
                calculated_total=calculated,
            )
        )
    return res

@router.get("/bundles/{bundle_id}", response_model=ProductBundleResponse)
async def get_bundle(
    bundle_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("bundles:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    b = await catalog_service.get_bundle(db, tenant_id, bundle_id)
    calculated = catalog_service.calculate_bundle_price(b)
    return ProductBundleResponse(
        id=b.id,
        tenant_id=b.tenant_id,
        ref=b.ref,
        name=b.name,
        bundle_code=b.bundle_code,
        description=b.description,
        pricing_model=b.pricing_model,
        bundle_price=b.bundle_price,
        discount_pct=b.discount_pct,
        currency=b.currency,
        valid_from=b.valid_from,
        valid_until=b.valid_until,
        status=b.status,
        is_active=b.is_active,
        custom_fields=b.custom_fields,
        created_at=b.created_at,
        updated_at=b.updated_at,
        components=b.components,
        calculated_total=calculated,
    )

@router.post("/bundles", response_model=ProductBundleResponse, status_code=status.HTTP_201_CREATED)
async def create_bundle(
    data: ProductBundleCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("bundles:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    b = await catalog_service.create_bundle(db, tenant_id, data)
    calculated = catalog_service.calculate_bundle_price(b)
    return ProductBundleResponse(
        id=b.id,
        tenant_id=b.tenant_id,
        ref=b.ref,
        name=b.name,
        bundle_code=b.bundle_code,
        description=b.description,
        pricing_model=b.pricing_model,
        bundle_price=b.bundle_price,
        discount_pct=b.discount_pct,
        currency=b.currency,
        valid_from=b.valid_from,
        valid_until=b.valid_until,
        status=b.status,
        is_active=b.is_active,
        custom_fields=b.custom_fields,
        created_at=b.created_at,
        updated_at=b.updated_at,
        components=b.components,
        calculated_total=calculated,
    )

@router.put("/bundles/{bundle_id}", response_model=ProductBundleResponse)
async def update_bundle(
    bundle_id: uuid.UUID,
    data: ProductBundleUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("bundles:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    b = await catalog_service.update_bundle(db, tenant_id, bundle_id, data)
    calculated = catalog_service.calculate_bundle_price(b)
    return ProductBundleResponse(
        id=b.id,
        tenant_id=b.tenant_id,
        ref=b.ref,
        name=b.name,
        bundle_code=b.bundle_code,
        description=b.description,
        pricing_model=b.pricing_model,
        bundle_price=b.bundle_price,
        discount_pct=b.discount_pct,
        currency=b.currency,
        valid_from=b.valid_from,
        valid_until=b.valid_until,
        status=b.status,
        is_active=b.is_active,
        custom_fields=b.custom_fields,
        created_at=b.created_at,
        updated_at=b.updated_at,
        components=b.components,
        calculated_total=calculated,
    )

@router.delete("/bundles/{bundle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bundle(
    bundle_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("bundles:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    await catalog_service.delete_bundle(db, tenant_id, bundle_id)

# ---------------------------------------------------------------------------
# Availability
# ---------------------------------------------------------------------------

@router.get("/availability", response_model=List[ProductAvailabilityResponse])
async def list_availability(
    status_filter: Optional[str] = Query(None, alias="status"),
    channel: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("availability:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    items = await catalog_service.list_availability(db, tenant_id, status=status_filter, channel=channel, search=q)
    today = date.today()
    res = []
    for item in items:
        effective = True
        if item.effective_start_date and item.effective_start_date > today:
            effective = False
        if item.effective_end_date and item.effective_end_date < today:
            effective = False
        res.append(
            ProductAvailabilityResponse(
                id=item.id,
                tenant_id=item.tenant_id,
                product_id=item.product_id,
                service_id=item.service_id,
                item_name=item.item_name,
                status=item.status,
                effective_start_date=item.effective_start_date,
                effective_end_date=item.effective_end_date,
                channel=item.channel,
                region=item.region,
                lead_time_days=item.lead_time_days,
                notes=item.notes,
                is_active=item.is_active,
                custom_fields=item.custom_fields,
                created_at=item.created_at,
                updated_at=item.updated_at,
                is_currently_effective=effective,
            )
        )
    return res

@router.get("/availability/{availability_id}", response_model=ProductAvailabilityResponse)
async def get_availability(
    availability_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("availability:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    item = await catalog_service.get_availability(db, tenant_id, availability_id)
    today = date.today()
    effective = True
    if item.effective_start_date and item.effective_start_date > today:
        effective = False
    if item.effective_end_date and item.effective_end_date < today:
        effective = False
    return ProductAvailabilityResponse(
        id=item.id,
        tenant_id=item.tenant_id,
        product_id=item.product_id,
        service_id=item.service_id,
        item_name=item.item_name,
        status=item.status,
        effective_start_date=item.effective_start_date,
        effective_end_date=item.effective_end_date,
        channel=item.channel,
        region=item.region,
        lead_time_days=item.lead_time_days,
        notes=item.notes,
        is_active=item.is_active,
        custom_fields=item.custom_fields,
        created_at=item.created_at,
        updated_at=item.updated_at,
        is_currently_effective=effective,
    )

@router.post("/availability", response_model=ProductAvailabilityResponse, status_code=status.HTTP_201_CREATED)
async def create_availability(
    data: ProductAvailabilityCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("availability:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    item = await catalog_service.create_availability(db, tenant_id, data)
    return ProductAvailabilityResponse(
        id=item.id,
        tenant_id=item.tenant_id,
        product_id=item.product_id,
        service_id=item.service_id,
        item_name=item.item_name,
        status=item.status,
        effective_start_date=item.effective_start_date,
        effective_end_date=item.effective_end_date,
        channel=item.channel,
        region=item.region,
        lead_time_days=item.lead_time_days,
        notes=item.notes,
        is_active=item.is_active,
        custom_fields=item.custom_fields,
        created_at=item.created_at,
        updated_at=item.updated_at,
        is_currently_effective=True,
    )

@router.put("/availability/{availability_id}", response_model=ProductAvailabilityResponse)
async def update_availability(
    availability_id: uuid.UUID,
    data: ProductAvailabilityUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("availability:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    item = await catalog_service.update_availability(db, tenant_id, availability_id, data)
    today = date.today()
    effective = True
    if item.effective_start_date and item.effective_start_date > today:
        effective = False
    if item.effective_end_date and item.effective_end_date < today:
        effective = False
    return ProductAvailabilityResponse(
        id=item.id,
        tenant_id=item.tenant_id,
        product_id=item.product_id,
        service_id=item.service_id,
        item_name=item.item_name,
        status=item.status,
        effective_start_date=item.effective_start_date,
        effective_end_date=item.effective_end_date,
        channel=item.channel,
        region=item.region,
        lead_time_days=item.lead_time_days,
        notes=item.notes,
        is_active=item.is_active,
        custom_fields=item.custom_fields,
        created_at=item.created_at,
        updated_at=item.updated_at,
        is_currently_effective=effective,
    )

@router.delete("/availability/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_availability(
    availability_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("availability:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("No active organization context.")
    await catalog_service.delete_availability(db, tenant_id, availability_id)
