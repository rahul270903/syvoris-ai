"""011_product_and_service_catalogue

Revision ID: 011_product_and_service_catalogue
Revises: 010_project_management
Create Date: 2026-11-14 03:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '011_product_and_service_catalogue'
down_revision: Union[str, None] = '010_project_management'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Catalog Categories
    op.create_table(
        'catalog_categories',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('slug', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category_type', sa.String(length=30), server_default='Product', nullable=False),
        sa.Column('parent_id', sa.Uuid(), nullable=True),
        sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('custom_fields', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['catalog_categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_catalog_categories_tenant_id'), 'catalog_categories', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_catalog_categories_ref'), 'catalog_categories', ['ref'], unique=False)
    op.create_index(op.f('ix_catalog_categories_name'), 'catalog_categories', ['name'], unique=False)
    op.create_index(op.f('ix_catalog_categories_slug'), 'catalog_categories', ['slug'], unique=False)
    op.create_index(op.f('ix_catalog_categories_parent_id'), 'catalog_categories', ['parent_id'], unique=False)
    op.create_index(op.f('ix_catalog_categories_is_active'), 'catalog_categories', ['is_active'], unique=False)

    # 2. Services
    op.create_table(
        'services',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('category_id', sa.Uuid(), nullable=True),
        sa.Column('category_name', sa.String(length=100), server_default='Services', nullable=False),
        sa.Column('service_type', sa.String(length=50), server_default='Professional Services', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('billing_method', sa.String(length=50), server_default='Hourly', nullable=False),
        sa.Column('billing_frequency', sa.String(length=50), server_default='One-Time', nullable=False),
        sa.Column('duration_unit', sa.String(length=32), server_default='Hour', nullable=False),
        sa.Column('standard_rate', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('cost_rate', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('tax_category', sa.String(length=50), server_default='Standard', nullable=False),
        sa.Column('tax_rate', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('terms_reference', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('custom_fields', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['catalog_categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_services_tenant_id'), 'services', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_services_ref'), 'services', ['ref'], unique=False)
    op.create_index(op.f('ix_services_name'), 'services', ['name'], unique=False)
    op.create_index(op.f('ix_services_code'), 'services', ['code'], unique=False)
    op.create_index(op.f('ix_services_category_id'), 'services', ['category_id'], unique=False)
    op.create_index(op.f('ix_services_status'), 'services', ['status'], unique=False)
    op.create_index(op.f('ix_services_is_active'), 'services', ['is_active'], unique=False)

    # 3. Product Bundles
    op.create_table(
        'product_bundles',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('bundle_code', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('pricing_model', sa.String(length=50), server_default='Fixed', nullable=False),
        sa.Column('bundle_price', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('discount_pct', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('valid_from', sa.Date(), nullable=True),
        sa.Column('valid_until', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('custom_fields', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_product_bundles_tenant_id'), 'product_bundles', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_product_bundles_ref'), 'product_bundles', ['ref'], unique=False)
    op.create_index(op.f('ix_product_bundles_name'), 'product_bundles', ['name'], unique=False)
    op.create_index(op.f('ix_product_bundles_bundle_code'), 'product_bundles', ['bundle_code'], unique=False)
    op.create_index(op.f('ix_product_bundles_status'), 'product_bundles', ['status'], unique=False)
    op.create_index(op.f('ix_product_bundles_is_active'), 'product_bundles', ['is_active'], unique=False)

    # 4. Bundle Components
    op.create_table(
        'bundle_components',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('bundle_id', sa.Uuid(), nullable=False),
        sa.Column('component_type', sa.String(length=20), server_default='Product', nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=True),
        sa.Column('service_id', sa.Uuid(), nullable=True),
        sa.Column('item_name', sa.String(length=255), nullable=False),
        sa.Column('sku_or_code', sa.String(length=100), server_default='', nullable=False),
        sa.Column('quantity', sa.Numeric(precision=10, scale=2), server_default='1.00', nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('discount_pct', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('is_optional', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['bundle_id'], ['product_bundles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bundle_components_tenant_id'), 'bundle_components', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_bundle_components_bundle_id'), 'bundle_components', ['bundle_id'], unique=False)
    op.create_index(op.f('ix_bundle_components_product_id'), 'bundle_components', ['product_id'], unique=False)
    op.create_index(op.f('ix_bundle_components_service_id'), 'bundle_components', ['service_id'], unique=False)

    # 5. Product Availabilities
    op.create_table(
        'product_availabilities',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=True),
        sa.Column('service_id', sa.Uuid(), nullable=True),
        sa.Column('item_name', sa.String(length=255), server_default='', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Available', nullable=False),
        sa.Column('effective_start_date', sa.Date(), nullable=True),
        sa.Column('effective_end_date', sa.Date(), nullable=True),
        sa.Column('channel', sa.String(length=100), server_default='All Channels', nullable=False),
        sa.Column('region', sa.String(length=100), server_default='Global', nullable=False),
        sa.Column('lead_time_days', sa.Integer(), server_default='0', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('custom_fields', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_product_availabilities_tenant_id'), 'product_availabilities', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_product_availabilities_product_id'), 'product_availabilities', ['product_id'], unique=False)
    op.create_index(op.f('ix_product_availabilities_service_id'), 'product_availabilities', ['service_id'], unique=False)
    op.create_index(op.f('ix_product_availabilities_status'), 'product_availabilities', ['status'], unique=False)
    op.create_index(op.f('ix_product_availabilities_is_active'), 'product_availabilities', ['is_active'], unique=False)

    # 6. Tax Rules
    op.create_table(
        'tax_rules',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('rate', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('region', sa.String(length=100), server_default='Standard Jurisdiction', nullable=False),
        sa.Column('tax_type', sa.String(length=50), server_default='Standard', nullable=False),
        sa.Column('is_inclusive', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('effective_start_date', sa.Date(), nullable=True),
        sa.Column('effective_end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tax_rules_tenant_id'), 'tax_rules', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_tax_rules_ref'), 'tax_rules', ['ref'], unique=False)
    op.create_index(op.f('ix_tax_rules_name'), 'tax_rules', ['name'], unique=False)
    op.create_index(op.f('ix_tax_rules_code'), 'tax_rules', ['code'], unique=False)
    op.create_index(op.f('ix_tax_rules_status'), 'tax_rules', ['status'], unique=False)

    # 7. Commercial Terms
    op.create_table(
        'commercial_terms',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('version', sa.String(length=32), server_default='1.0', nullable=False),
        sa.Column('category', sa.String(length=50), server_default='Commercial', nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('effective_date', sa.Date(), nullable=True),
        sa.Column('expiration_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Draft', nullable=False),
        sa.Column('is_default', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('published_by', sa.String(length=150), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('custom_fields', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_commercial_terms_tenant_id'), 'commercial_terms', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_commercial_terms_ref'), 'commercial_terms', ['ref'], unique=False)
    op.create_index(op.f('ix_commercial_terms_title'), 'commercial_terms', ['title'], unique=False)
    op.create_index(op.f('ix_commercial_terms_status'), 'commercial_terms', ['status'], unique=False)

    # 8. Warehouse Locations
    op.create_table(
        'warehouse_locations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), server_default='Jamaica', nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('is_default', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('manager_name', sa.String(length=150), nullable=True),
        sa.Column('custom_fields', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_warehouse_locations_tenant_id'), 'warehouse_locations', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_warehouse_locations_ref'), 'warehouse_locations', ['ref'], unique=False)
    op.create_index(op.f('ix_warehouse_locations_name'), 'warehouse_locations', ['name'], unique=False)
    op.create_index(op.f('ix_warehouse_locations_code'), 'warehouse_locations', ['code'], unique=False)
    op.create_index(op.f('ix_warehouse_locations_is_active'), 'warehouse_locations', ['is_active'], unique=False)

    # 9. Inventory Items
    op.create_table(
        'inventory_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=False),
        sa.Column('location_id', sa.Uuid(), nullable=False),
        sa.Column('quantity_on_hand', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('quantity_reserved', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('reorder_threshold', sa.Numeric(precision=12, scale=2), server_default='10.00', nullable=False),
        sa.Column('reorder_quantity', sa.Numeric(precision=12, scale=2), server_default='50.00', nullable=False),
        sa.Column('unit_of_measure', sa.String(length=32), server_default='Unit', nullable=False),
        sa.Column('last_counted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='In Stock', nullable=False),
        sa.Column('custom_fields', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['location_id'], ['warehouse_locations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_items_tenant_id'), 'inventory_items', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_inventory_items_ref'), 'inventory_items', ['ref'], unique=False)
    op.create_index(op.f('ix_inventory_items_product_id'), 'inventory_items', ['product_id'], unique=False)
    op.create_index(op.f('ix_inventory_items_location_id'), 'inventory_items', ['location_id'], unique=False)
    op.create_index(op.f('ix_inventory_items_status'), 'inventory_items', ['status'], unique=False)

    # 10. Stock Movements
    op.create_table(
        'stock_movements',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('inventory_item_id', sa.Uuid(), nullable=False),
        sa.Column('movement_type', sa.String(length=50), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('balance_before', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('balance_after', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('from_location_id', sa.Uuid(), nullable=True),
        sa.Column('to_location_id', sa.Uuid(), nullable=True),
        sa.Column('reference_doc_type', sa.String(length=50), nullable=True),
        sa.Column('reference_doc_id', sa.String(length=100), nullable=True),
        sa.Column('reason', sa.String(length=255), nullable=True),
        sa.Column('performed_by_id', sa.Uuid(), nullable=True),
        sa.Column('performed_by_name', sa.String(length=150), server_default='System', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['from_location_id'], ['warehouse_locations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['to_location_id'], ['warehouse_locations.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stock_movements_tenant_id'), 'stock_movements', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_stock_movements_ref'), 'stock_movements', ['ref'], unique=False)
    op.create_index(op.f('ix_stock_movements_inventory_item_id'), 'stock_movements', ['inventory_item_id'], unique=False)

    # 11. Vendor Profiles
    op.create_table(
        'vendor_profiles',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('account_id', sa.Uuid(), nullable=False),
        sa.Column('vendor_code', sa.String(length=50), nullable=False),
        sa.Column('vendor_category', sa.String(length=100), server_default='Network Equipment', nullable=False),
        sa.Column('payment_terms', sa.String(length=50), server_default='Net 30', nullable=False),
        sa.Column('tax_id', sa.String(length=50), nullable=True),
        sa.Column('rating', sa.Numeric(precision=3, scale=1), server_default='4.5', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
        sa.Column('compliance_notes', sa.Text(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendor_profiles_tenant_id'), 'vendor_profiles', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_vendor_profiles_ref'), 'vendor_profiles', ['ref'], unique=False)
    op.create_index(op.f('ix_vendor_profiles_account_id'), 'vendor_profiles', ['account_id'], unique=False)
    op.create_index(op.f('ix_vendor_profiles_vendor_code'), 'vendor_profiles', ['vendor_code'], unique=False)
    op.create_index(op.f('ix_vendor_profiles_status'), 'vendor_profiles', ['status'], unique=False)

    # 12. Vendor Products
    op.create_table(
        'vendor_products',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('vendor_id', sa.Uuid(), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=True),
        sa.Column('service_id', sa.Uuid(), nullable=True),
        sa.Column('vendor_sku', sa.String(length=100), nullable=True),
        sa.Column('unit_cost', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('lead_time_days', sa.Integer(), server_default='7', nullable=False),
        sa.Column('min_order_quantity', sa.Numeric(precision=10, scale=2), server_default='1.00', nullable=False),
        sa.Column('is_preferred_vendor', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('custom_fields', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendor_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendor_products_tenant_id'), 'vendor_products', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_vendor_products_vendor_id'), 'vendor_products', ['vendor_id'], unique=False)
    op.create_index(op.f('ix_vendor_products_product_id'), 'vendor_products', ['product_id'], unique=False)
    op.create_index(op.f('ix_vendor_products_service_id'), 'vendor_products', ['service_id'], unique=False)

    # 13. Enable and force RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        tables = [
            'catalog_categories', 'services', 'product_bundles', 'bundle_components',
            'product_availabilities', 'tax_rules', 'commercial_terms', 'warehouse_locations',
            'inventory_items', 'stock_movements', 'vendor_profiles', 'vendor_products'
        ]
        for table in tables:
            op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
            op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
            op.execute(f"""
                CREATE POLICY {table}_tenant_isolation ON {table}
                AS RESTRICTIVE
                USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
            """)

def downgrade() -> None:
    tables = [
        'vendor_products', 'vendor_profiles', 'stock_movements', 'inventory_items',
        'warehouse_locations', 'commercial_terms', 'tax_rules', 'product_availabilities',
        'bundle_components', 'product_bundles', 'services', 'catalog_categories'
    ]
    for table in tables:
        op.drop_table(table)
