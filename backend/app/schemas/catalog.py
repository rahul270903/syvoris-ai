import uuid
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

# ----------------- 1. Catalog Categories -----------------

class CatalogCategoryBase(BaseModel):
    name: str = Field(..., max_length=150)
    slug: str = Field(..., max_length=150)
    description: Optional[str] = None
    category_type: str = Field(default="Product", max_length=30)  # Product, Service, Hybrid
    parent_id: Optional[uuid.UUID] = None
    sort_order: int = Field(default=0, ge=0)
    is_active: bool = True
    image_url: Optional[str] = Field(None, max_length=500)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class CatalogCategoryCreate(CatalogCategoryBase):
    pass

class CatalogCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    slug: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    category_type: Optional[str] = Field(None, max_length=30)
    parent_id: Optional[uuid.UUID] = None
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    image_url: Optional[str] = Field(None, max_length=500)
    custom_fields: Optional[Dict[str, Any]] = None

class CatalogCategoryResponse(CatalogCategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_at: datetime
    updated_at: datetime
    parent_name: Optional[str] = None
    subcategories_count: int = 0
    items_count: int = 0

# ----------------- 2. Services -----------------

class ServiceItemBase(BaseModel):
    name: str = Field(..., max_length=255)
    code: str = Field(..., max_length=100)
    category_id: Optional[uuid.UUID] = None
    category_name: str = Field(default="Services", max_length=100)
    service_type: str = Field(default="Professional Services", max_length=50)
    description: Optional[str] = None
    billing_method: str = Field(default="Hourly", max_length=50)  # Hourly, Daily, Project, Subscription, Flat Fee, Usage-Based
    billing_frequency: str = Field(default="One-Time", max_length=50)  # One-Time, Monthly, Quarterly, Annual, Milestone
    duration_unit: str = Field(default="Hour", max_length=32)
    standard_rate: Decimal = Field(default=Decimal("0.00"), ge=0)
    cost_rate: Decimal = Field(default=Decimal("0.00"), ge=0)
    currency: str = Field(default="USD", max_length=3)
    tax_category: str = Field(default="Standard", max_length=50)
    tax_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    terms_reference: Optional[str] = Field(None, max_length=255)
    status: str = Field(default="Active", max_length=50)
    is_active: bool = True
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ServiceItemCreate(ServiceItemBase):
    pass

class ServiceItemUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = Field(None, max_length=100)
    service_type: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    billing_method: Optional[str] = Field(None, max_length=50)
    billing_frequency: Optional[str] = Field(None, max_length=50)
    duration_unit: Optional[str] = Field(None, max_length=32)
    standard_rate: Optional[Decimal] = Field(None, ge=0)
    cost_rate: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    tax_category: Optional[str] = Field(None, max_length=50)
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    terms_reference: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ServiceItemResponse(ServiceItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_at: datetime
    updated_at: datetime

# ----------------- 3. Product Bundles -----------------

class BundleComponentBase(BaseModel):
    component_type: str = Field(default="Product", max_length=20)  # Product, Service
    product_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    item_name: str = Field(..., max_length=255)
    sku_or_code: str = Field(default="", max_length=100)
    quantity: Decimal = Field(default=Decimal("1.00"), gt=0)
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    discount_pct: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    is_optional: bool = False
    sort_order: int = Field(default=0, ge=0)

class BundleComponentCreate(BundleComponentBase):
    pass

class BundleComponentResponse(BundleComponentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    bundle_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

class ProductBundleBase(BaseModel):
    name: str = Field(..., max_length=255)
    bundle_code: str = Field(..., max_length=100)
    description: Optional[str] = None
    pricing_model: str = Field(default="Fixed", max_length=50)  # Fixed, Component-based
    bundle_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    discount_pct: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    currency: str = Field(default="USD", max_length=3)
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    status: str = Field(default="Active", max_length=50)
    is_active: bool = True
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ProductBundleCreate(ProductBundleBase):
    components: List[BundleComponentCreate] = Field(default_factory=list)

class ProductBundleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    bundle_code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    pricing_model: Optional[str] = Field(None, max_length=50)
    bundle_price: Optional[Decimal] = Field(None, ge=0)
    discount_pct: Optional[Decimal] = Field(None, ge=0, le=100)
    currency: Optional[str] = Field(None, max_length=3)
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    status: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None
    components: Optional[List[BundleComponentCreate]] = None

class ProductBundleResponse(ProductBundleBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_at: datetime
    updated_at: datetime
    components: List[BundleComponentResponse] = Field(default_factory=list)
    calculated_total: Optional[Decimal] = None

# ----------------- 4. Product Availability -----------------

class ProductAvailabilityBase(BaseModel):
    product_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    item_name: str = Field(default="", max_length=255)
    status: str = Field(default="Available", max_length=50)  # Available, Limited, Pre-Order, Backorder, Discontinued, Unavailable
    effective_start_date: Optional[date] = None
    effective_end_date: Optional[date] = None
    channel: str = Field(default="All Channels", max_length=100)
    region: str = Field(default="Global", max_length=100)
    lead_time_days: int = Field(default=0, ge=0)
    notes: Optional[str] = None
    is_active: bool = True
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ProductAvailabilityCreate(ProductAvailabilityBase):
    pass

class ProductAvailabilityUpdate(BaseModel):
    product_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    item_name: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=50)
    effective_start_date: Optional[date] = None
    effective_end_date: Optional[date] = None
    channel: Optional[str] = Field(None, max_length=100)
    region: Optional[str] = Field(None, max_length=100)
    lead_time_days: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ProductAvailabilityResponse(ProductAvailabilityBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    is_currently_effective: bool = True

# ----------------- 5. Tax Rules -----------------

class TaxRuleBase(BaseModel):
    name: str = Field(..., max_length=150)
    code: str = Field(..., max_length=50)
    rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    region: str = Field(default="Standard Jurisdiction", max_length=100)
    tax_type: str = Field(default="Standard", max_length=50)  # Standard, Reduced, Zero-rated, Exempt
    is_inclusive: bool = False
    effective_start_date: Optional[date] = None
    effective_end_date: Optional[date] = None
    status: str = Field(default="Active", max_length=50)
    description: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class TaxRuleCreate(TaxRuleBase):
    pass

class TaxRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    code: Optional[str] = Field(None, max_length=50)
    rate: Optional[Decimal] = Field(None, ge=0, le=100)
    region: Optional[str] = Field(None, max_length=100)
    tax_type: Optional[str] = Field(None, max_length=50)
    is_inclusive: Optional[bool] = None
    effective_start_date: Optional[date] = None
    effective_end_date: Optional[date] = None
    status: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class TaxRuleResponse(TaxRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_at: datetime
    updated_at: datetime

# ----------------- 6. Commercial Terms -----------------

class CommercialTermsBase(BaseModel):
    title: str = Field(..., max_length=255)
    version: str = Field(default="1.0", max_length=32)
    category: str = Field(default="Commercial", max_length=50)
    content: str
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    status: str = Field(default="Draft", max_length=50)  # Draft, Published, Archived
    is_default: bool = False
    published_by: Optional[str] = Field(None, max_length=150)
    published_at: Optional[datetime] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class CommercialTermsCreate(CommercialTermsBase):
    pass

class CommercialTermsUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    version: Optional[str] = Field(None, max_length=32)
    category: Optional[str] = Field(None, max_length=50)
    content: Optional[str] = None
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    status: Optional[str] = Field(None, max_length=50)
    is_default: Optional[bool] = None
    published_by: Optional[str] = Field(None, max_length=150)
    published_at: Optional[datetime] = None
    custom_fields: Optional[Dict[str, Any]] = None

class CommercialTermsResponse(CommercialTermsBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_at: datetime
    updated_at: datetime

# ----------------- 7. Stock & Inventory Management -----------------

class WarehouseLocationBase(BaseModel):
    name: str = Field(..., max_length=150)
    code: str = Field(..., max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(default="Jamaica", max_length=100)
    is_active: bool = True
    is_default: bool = False
    manager_name: Optional[str] = Field(None, max_length=150)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class WarehouseLocationCreate(WarehouseLocationBase):
    pass

class WarehouseLocationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    code: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    manager_name: Optional[str] = Field(None, max_length=150)
    custom_fields: Optional[Dict[str, Any]] = None

class WarehouseLocationResponse(WarehouseLocationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_at: datetime
    updated_at: datetime
    items_count: int = 0

class InventoryItemBase(BaseModel):
    product_id: uuid.UUID
    location_id: uuid.UUID
    quantity_on_hand: Decimal = Field(default=Decimal("0.00"), ge=0)
    quantity_reserved: Decimal = Field(default=Decimal("0.00"), ge=0)
    reorder_threshold: Decimal = Field(default=Decimal("10.00"), ge=0)
    reorder_quantity: Decimal = Field(default=Decimal("50.00"), ge=0)
    unit_of_measure: str = Field(default="Unit", max_length=32)
    last_counted_at: Optional[datetime] = None
    status: str = Field(default="In Stock", max_length=50)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    quantity_reserved: Optional[Decimal] = Field(None, ge=0)
    reorder_threshold: Optional[Decimal] = Field(None, ge=0)
    reorder_quantity: Optional[Decimal] = Field(None, ge=0)
    unit_of_measure: Optional[str] = Field(None, max_length=32)
    last_counted_at: Optional[datetime] = None
    status: Optional[str] = Field(None, max_length=50)
    custom_fields: Optional[Dict[str, Any]] = None

class InventoryItemResponse(InventoryItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    product_sku: Optional[str] = None
    product_name: Optional[str] = None
    location_name: Optional[str] = None
    location_code: Optional[str] = None
    quantity_available: Decimal = Decimal("0.00")
    created_at: datetime
    updated_at: datetime

class StockMovementCreate(BaseModel):
    inventory_item_id: uuid.UUID
    movement_type: str = Field(..., max_length=50)  # Receipt, Issue, Transfer, Adjustment, Reservation, Release
    quantity: Decimal = Field(..., gt=0)
    from_location_id: Optional[uuid.UUID] = None
    to_location_id: Optional[uuid.UUID] = None
    reference_doc_type: Optional[str] = Field(None, max_length=50)
    reference_doc_id: Optional[str] = Field(None, max_length=100)
    reason: Optional[str] = Field(None, max_length=255)

class StockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    inventory_item_id: uuid.UUID
    movement_type: str
    quantity: Decimal
    balance_before: Decimal
    balance_after: Decimal
    from_location_id: Optional[uuid.UUID] = None
    to_location_id: Optional[uuid.UUID] = None
    reference_doc_type: Optional[str] = None
    reference_doc_id: Optional[str] = None
    reason: Optional[str] = None
    performed_by_name: str
    created_at: datetime

# ----------------- 8. Vendor Extensions -----------------

class VendorProductBase(BaseModel):
    product_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    vendor_sku: Optional[str] = Field(None, max_length=100)
    unit_cost: Decimal = Field(default=Decimal("0.00"), ge=0)
    currency: str = Field(default="USD", max_length=3)
    lead_time_days: int = Field(default=7, ge=0)
    min_order_quantity: Decimal = Field(default=Decimal("1.00"), gt=0)
    is_preferred_vendor: bool = False
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class VendorProductCreate(VendorProductBase):
    pass

class VendorProductResponse(VendorProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    vendor_id: uuid.UUID
    item_name: Optional[str] = None
    item_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class VendorProfileBase(BaseModel):
    account_id: uuid.UUID
    vendor_code: str = Field(..., max_length=50)
    vendor_category: str = Field(default="Network Equipment", max_length=100)
    payment_terms: str = Field(default="Net 30", max_length=50)
    tax_id: Optional[str] = Field(None, max_length=50)
    rating: Decimal = Field(default=Decimal("4.5"), ge=0, le=5)
    status: str = Field(default="Active", max_length=50)
    compliance_notes: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class VendorProfileCreate(VendorProfileBase):
    pass

class VendorProfileUpdate(BaseModel):
    vendor_category: Optional[str] = Field(None, max_length=100)
    payment_terms: Optional[str] = Field(None, max_length=50)
    tax_id: Optional[str] = Field(None, max_length=50)
    rating: Optional[Decimal] = Field(None, ge=0, le=5)
    status: Optional[str] = Field(None, max_length=50)
    compliance_notes: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class VendorProfileResponse(VendorProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    account_name: Optional[str] = None
    account_email: Optional[str] = None
    account_phone: Optional[str] = None
    account_city: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    supplied_products_count: int = 0
    supplied_products: List[VendorProductResponse] = Field(default_factory=list)
