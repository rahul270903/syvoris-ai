"""007_sales_and_revenue_cpq

Revision ID: 007_sales_and_revenue_cpq
Revises: 006_opportunity_pipelines_and_stages
Create Date: 2026-11-13 01:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '007_sales_and_revenue_cpq'
down_revision: Union[str, None] = '006_opportunity_pipelines_and_stages'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Products table
    op.create_table(
        'products',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), server_default='Software', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('unit_of_measure', sa.String(length=32), server_default='Unit', nullable=False),
        sa.Column('standard_price', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('cost_price', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('tax_category', sa.String(length=50), server_default='Standard', nullable=False),
        sa.Column('tax_rate', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_tenant_id'), 'products', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=False)
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
    op.create_index(op.f('ix_products_category'), 'products', ['category'], unique=False)

    # 2. Price Books table
    op.create_table(
        'price_books',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('valid_from', sa.Date(), nullable=True),
        sa.Column('valid_to', sa.Date(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_price_books_tenant_id'), 'price_books', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_price_books_name'), 'price_books', ['name'], unique=False)

    # 3. Price Book Entries table
    op.create_table(
        'price_book_entries',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('price_book_id', sa.Uuid(), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=False),
        sa.Column('list_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['price_book_id'], ['price_books.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pbe_tenant_id'), 'price_book_entries', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_pbe_pb_id'), 'price_book_entries', ['price_book_id'], unique=False)
    op.create_index(op.f('ix_pbe_product_id'), 'price_book_entries', ['product_id'], unique=False)

    # 4. Quotes table
    op.create_table(
        'quotes',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('version', sa.Integer(), server_default='1', nullable=False),
        sa.Column('parent_quote_id', sa.Uuid(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('opportunity_id', sa.Uuid(), nullable=True),
        sa.Column('account_id', sa.Uuid(), nullable=False),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('price_book_id', sa.Uuid(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Draft', nullable=False),
        sa.Column('valid_until', sa.Date(), nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('header_discount_pct', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('total_discount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('total_tax', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('grand_total', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('total_cost', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('margin_amount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('margin_pct', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('payment_terms', sa.String(length=50), server_default='Net 30', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_quote_id'], ['quotes.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['price_book_id'], ['price_books.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quotes_tenant_id'), 'quotes', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_quotes_ref'), 'quotes', ['ref'], unique=False)
    op.create_index(op.f('ix_quotes_status'), 'quotes', ['status'], unique=False)
    op.create_index(op.f('ix_quotes_account_id'), 'quotes', ['account_id'], unique=False)
    op.create_index(op.f('ix_quotes_opportunity_id'), 'quotes', ['opportunity_id'], unique=False)

    # 5. Quote Line Items table
    op.create_table(
        'quote_line_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('quote_id', sa.Uuid(), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=True),
        sa.Column('item_name', sa.String(length=255), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=True),
        sa.Column('quantity', sa.Numeric(precision=12, scale=4), server_default='1.0000', nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('cost_price', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('discount_pct', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('tax_rate', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('discount_amount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('net_amount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('tax_amount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('line_total', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['quote_id'], ['quotes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quote_lines_quote_id'), 'quote_line_items', ['quote_id'], unique=False)
    op.create_index(op.f('ix_quote_lines_tenant_id'), 'quote_line_items', ['tenant_id'], unique=False)

    # 6. Sales Orders table
    op.create_table(
        'sales_orders',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('quote_id', sa.Uuid(), nullable=True),
        sa.Column('opportunity_id', sa.Uuid(), nullable=True),
        sa.Column('account_id', sa.Uuid(), nullable=False),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Confirmed', nullable=False),
        sa.Column('fulfilment_stage', sa.String(length=50), server_default='Placed', nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('warehouse_location', sa.String(length=100), nullable=True),
        sa.Column('requested_delivery_date', sa.Date(), nullable=True),
        sa.Column('carrier', sa.String(length=100), nullable=True),
        sa.Column('tracking_number', sa.String(length=100), nullable=True),
        sa.Column('payment_terms', sa.String(length=50), server_default='Net 30', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['quote_id'], ['quotes.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_orders_tenant_id'), 'sales_orders', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_orders_ref'), 'sales_orders', ['ref'], unique=False)
    op.create_index(op.f('ix_orders_status'), 'sales_orders', ['status'], unique=False)
    op.create_index(op.f('ix_orders_account_id'), 'sales_orders', ['account_id'], unique=False)

    # 7. Order Line Items table
    op.create_table(
        'order_line_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('order_id', sa.Uuid(), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=True),
        sa.Column('item_name', sa.String(length=255), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=True),
        sa.Column('quantity', sa.Numeric(precision=12, scale=4), server_default='1.0000', nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('discount_pct', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('tax_rate', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('line_total', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['sales_orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_lines_order_id'), 'order_line_items', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_lines_tenant_id'), 'order_line_items', ['tenant_id'], unique=False)

    # 8. Invoices table
    op.create_table(
        'invoices',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('sales_order_id', sa.Uuid(), nullable=True),
        sa.Column('account_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Issued', nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('paid_amount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('balance_due', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('payment_terms', sa.String(length=50), server_default='Net 30', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sales_order_id'], ['sales_orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invoices_tenant_id'), 'invoices', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_invoices_ref'), 'invoices', ['ref'], unique=False)
    op.create_index(op.f('ix_invoices_status'), 'invoices', ['status'], unique=False)
    op.create_index(op.f('ix_invoices_account_id'), 'invoices', ['account_id'], unique=False)

    # 9. Approval Requests table
    op.create_table(
        'approval_requests',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('entity_type', sa.String(length=50), server_default='Quote', nullable=False),
        sa.Column('entity_id', sa.Uuid(), nullable=False),
        sa.Column('entity_ref', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=50), server_default='Discount Override', nullable=False),
        sa.Column('requester_id', sa.Uuid(), nullable=True),
        sa.Column('requester_name', sa.String(length=255), server_default='System', nullable=False),
        sa.Column('approver_id', sa.Uuid(), nullable=True),
        sa.Column('approver_name', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Pending', nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('discount_pct', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('risk', sa.String(length=20), server_default='Medium', nullable=False),
        sa.Column('policy', sa.Text(), nullable=False),
        sa.Column('justification', sa.Text(), nullable=False),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['approver_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_approvals_tenant_id'), 'approval_requests', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_approvals_ref'), 'approval_requests', ['ref'], unique=False)
    op.create_index(op.f('ix_approvals_status'), 'approval_requests', ['status'], unique=False)
    op.create_index(op.f('ix_approvals_entity_id'), 'approval_requests', ['entity_id'], unique=False)

    # 10. Enable and force RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        tables = [
            'products', 'price_books', 'price_book_entries',
            'quotes', 'quote_line_items', 'sales_orders',
            'order_line_items', 'invoices', 'approval_requests'
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
        'approval_requests', 'invoices', 'order_line_items',
        'sales_orders', 'quote_line_items', 'quotes',
        'price_book_entries', 'price_books', 'products'
    ]
    for table in tables:
        op.drop_table(table)
