import uuid
from datetime import datetime, date, timezone
from typing import Optional, Dict, Any, List
from decimal import Decimal
from sqlalchemy import (
    String, Text, JSON, ForeignKey, Uuid, Boolean,
    Numeric, DateTime, Integer, Date
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TenantScopedModel

# ---------------------------------------------------------------------------
# 1. CATALOG CATEGORIES (Hierarchical Tree)
# ---------------------------------------------------------------------------
class CatalogCategory(TenantScopedModel):
    __tablename__ = "catalog_categories"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_type: Mapped[str] = mapped_column(String(30), default="Product", nullable=False)  # Product, Service, Hybrid
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("catalog_categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Hierarchy relationships
    parent: Mapped[Optional["CatalogCategory"]] = relationship(
        "CatalogCategory", remote_side="CatalogCategory.id", back_populates="children", lazy="joined"
    )
    children: Mapped[List["CatalogCategory"]] = relationship(
        "CatalogCategory", back_populates="parent", cascade="all, delete-orphan", lazy="selectin"
    )


# ---------------------------------------------------------------------------
# 2. SERVICE CATALOG
# ---------------------------------------------------------------------------
class ServiceItem(TenantScopedModel):
    __tablename__ = "services"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("catalog_categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    category_name: Mapped[str] = mapped_column(String(100), default="Services", nullable=False)
    service_type: Mapped[str] = mapped_column(String(50), default="Professional Services", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    billing_method: Mapped[str] = mapped_column(String(50), default="Hourly", nullable=False)  # Hourly, Daily, Project, Subscription, Flat Fee, Usage-Based
    billing_frequency: Mapped[str] = mapped_column(String(50), default="One-Time", nullable=False)  # One-Time, Monthly, Quarterly, Annual, Milestone
    duration_unit: Mapped[str] = mapped_column(String(32), default="Hour", nullable=False)  # Hour, Day, Month, Project
    standard_rate: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    cost_rate: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    tax_category: Mapped[str] = mapped_column(String(50), default="Standard", nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    terms_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False, index=True)  # Draft, Active, Inactive, Archived
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    category: Mapped[Optional["CatalogCategory"]] = relationship("CatalogCategory", lazy="joined")


# ---------------------------------------------------------------------------
# 3. PRODUCT & SERVICE BUNDLES
# ---------------------------------------------------------------------------
class ProductBundle(TenantScopedModel):
    __tablename__ = "product_bundles"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    bundle_code: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pricing_model: Mapped[str] = mapped_column(String(50), default="Fixed", nullable=False)  # Fixed, Component-based
    bundle_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    discount_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    valid_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    valid_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False, index=True)  # Draft, Active, Inactive, Archived
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    components: Mapped[List["BundleComponent"]] = relationship(
        "BundleComponent", back_populates="bundle", cascade="all, delete-orphan", lazy="selectin"
    )


class BundleComponent(TenantScopedModel):
    __tablename__ = "bundle_components"

    bundle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("product_bundles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    component_type: Mapped[str] = mapped_column(String(20), default="Product", nullable=False)  # Product, Service
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    service_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("services.id", ondelete="SET NULL"), nullable=True, index=True
    )
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku_or_code: Mapped[str] = mapped_column(String(100), default="", nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("1.00"), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    discount_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    is_optional: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    bundle: Mapped["ProductBundle"] = relationship("ProductBundle", back_populates="components")


# ---------------------------------------------------------------------------
# 4. PRODUCT & SERVICE AVAILABILITY
# ---------------------------------------------------------------------------
class ProductAvailability(TenantScopedModel):
    __tablename__ = "product_availabilities"

    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True
    )
    service_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=True, index=True
    )
    item_name: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Available", nullable=False, index=True)  # Available, Limited, Pre-Order, Backorder, Discontinued, Unavailable
    effective_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    effective_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    channel: Mapped[str] = mapped_column(String(100), default="All Channels", nullable=False)
    region: Mapped[str] = mapped_column(String(100), default="Global", nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)


# ---------------------------------------------------------------------------
# 5. TAX MANAGEMENT
# ---------------------------------------------------------------------------
class TaxRule(TenantScopedModel):
    __tablename__ = "tax_rules"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    region: Mapped[str] = mapped_column(String(100), default="Standard Jurisdiction", nullable=False)
    tax_type: Mapped[str] = mapped_column(String(50), default="Standard", nullable=False)  # Standard, Reduced, Zero-rated, Exempt
    is_inclusive: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    effective_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    effective_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)


# ---------------------------------------------------------------------------
# 6. COMMERCIAL TERMS & CONDITIONS
# ---------------------------------------------------------------------------
class CommercialTerms(TenantScopedModel):
    __tablename__ = "commercial_terms"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(32), default="1.0", nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="Commercial", nullable=False)  # Commercial, Service Level, Government, Procurement, Master Service Agreement
    content: Mapped[str] = mapped_column(Text, nullable=False)
    effective_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiration_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Draft", nullable=False, index=True)  # Draft, Published, Archived
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published_by: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)


# ---------------------------------------------------------------------------
# 7. STOCK & INVENTORY MANAGEMENT
# ---------------------------------------------------------------------------
class WarehouseLocation(TenantScopedModel):
    __tablename__ = "warehouse_locations"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), default="Jamaica", nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    manager_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    inventory_items: Mapped[List["InventoryItem"]] = relationship(
        "InventoryItem", back_populates="location", cascade="all, delete-orphan", lazy="selectin"
    )


class InventoryItem(TenantScopedModel):
    __tablename__ = "inventory_items"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("warehouse_locations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    quantity_on_hand: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    quantity_reserved: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    reorder_threshold: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("10.00"), nullable=False)
    reorder_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("50.00"), nullable=False)
    unit_of_measure: Mapped[str] = mapped_column(String(32), default="Unit", nullable=False)
    last_counted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="In Stock", nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    location: Mapped["WarehouseLocation"] = relationship("WarehouseLocation", back_populates="inventory_items")
    movements: Mapped[List["StockMovement"]] = relationship(
        "StockMovement", back_populates="inventory_item", cascade="all, delete-orphan", lazy="select"
    )

    @property
    def quantity_available(self) -> Decimal:
        return max(Decimal("0.00"), self.quantity_on_hand - self.quantity_reserved)


class StockMovement(TenantScopedModel):
    __tablename__ = "stock_movements"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    inventory_item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    movement_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Receipt, Issue, Transfer, Adjustment, Reservation, Release
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    balance_before: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    balance_after: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    from_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True
    )
    to_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True
    )
    reference_doc_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # PurchaseOrder, SalesOrder, ManualAdjustment, PhysicalCount
    reference_doc_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    performed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True)
    performed_by_name: Mapped[str] = mapped_column(String(150), default="System", nullable=False)

    # Relationships
    inventory_item: Mapped["InventoryItem"] = relationship("InventoryItem", back_populates="movements")


# ---------------------------------------------------------------------------
# 8. VENDOR EXTENSIONS (Linking CRM Accounts to Supply Catalog)
# ---------------------------------------------------------------------------
class VendorProfile(TenantScopedModel):
    __tablename__ = "vendor_profiles"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vendor_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    vendor_category: Mapped[str] = mapped_column(String(100), default="Network Equipment", nullable=False)
    payment_terms: Mapped[str] = mapped_column(String(50), default="Net 30", nullable=False)
    tax_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 1), default=Decimal("4.5"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False, index=True)  # Active, Under Review, Inactive, Suspended
    compliance_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    supplied_products: Mapped[List["VendorProduct"]] = relationship(
        "VendorProduct", back_populates="vendor", cascade="all, delete-orphan", lazy="selectin"
    )


class VendorProduct(TenantScopedModel):
    __tablename__ = "vendor_products"

    vendor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("vendor_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    service_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("services.id", ondelete="SET NULL"), nullable=True, index=True
    )
    vendor_sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    min_order_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("1.00"), nullable=False)
    is_preferred_vendor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    vendor: Mapped["VendorProfile"] = relationship("VendorProfile", back_populates="supplied_products")
