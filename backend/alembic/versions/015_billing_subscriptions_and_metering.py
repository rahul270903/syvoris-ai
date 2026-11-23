"""015_billing_and_metering

Revision ID: 015_billing_and_metering
Revises: 014_integrations_and_radium
Create Date: 2026-11-17 03:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '015_billing_and_metering'
down_revision: Union[str, None] = '014_integrations_and_radium'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Tenant Subscriptions table
    op.create_table(
        'tenant_subscriptions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('stripe_customer_id', sa.String(length=100), nullable=False),
        sa.Column('stripe_subscription_id', sa.String(length=100), nullable=True),
        sa.Column('plan_tier', sa.String(length=32), server_default='Starter', nullable=False),
        sa.Column('billing_cycle', sa.String(length=20), server_default='monthly', nullable=False),
        sa.Column('status', sa.String(length=32), server_default='active', nullable=False),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('canceled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id')
    )
    op.create_index(op.f('ix_tenant_subscriptions_tenant_id'), 'tenant_subscriptions', ['tenant_id'], unique=True)
    op.create_index(op.f('ix_tenant_subscriptions_stripe_customer_id'), 'tenant_subscriptions', ['stripe_customer_id'], unique=False)
    op.create_index(op.f('ix_tenant_subscriptions_stripe_subscription_id'), 'tenant_subscriptions', ['stripe_subscription_id'], unique=False)
    op.create_index(op.f('ix_tenant_subscriptions_plan_tier'), 'tenant_subscriptions', ['plan_tier'], unique=False)
    op.create_index(op.f('ix_tenant_subscriptions_status'), 'tenant_subscriptions', ['status'], unique=False)

    # 2. Tenant Usage Meters table
    op.create_table(
        'tenant_usage_meters',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('billing_period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('billing_period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('seats_limit', sa.Integer(), server_default='5', nullable=False),
        sa.Column('seats_used', sa.Integer(), server_default='1', nullable=False),
        sa.Column('storage_bytes_limit', sa.BigInteger(), server_default='10737418240', nullable=False),
        sa.Column('storage_bytes_used', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('ai_tokens_limit', sa.BigInteger(), server_default='50000', nullable=False),
        sa.Column('ai_tokens_used', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('api_calls_limit', sa.BigInteger(), server_default='10000', nullable=False),
        sa.Column('api_calls_used', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tenant_usage_meters_tenant_id'), 'tenant_usage_meters', ['tenant_id'], unique=False)

    # 3. Usage Events table
    op.create_table(
        'usage_events',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('meter_type', sa.String(length=50), nullable=False),
        sa.Column('quantity', sa.BigInteger(), nullable=False),
        sa.Column('idempotency_key', sa.String(length=128), nullable=True),
        sa.Column('actor_id', sa.Uuid(), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('event_metadata', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_usage_events_tenant_id'), 'usage_events', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_usage_events_meter_type'), 'usage_events', ['meter_type'], unique=False)
    op.create_index(op.f('ix_usage_events_idempotency_key'), 'usage_events', ['idempotency_key'], unique=False)

    # 4. Stripe Event Logs table (System-level for replay protection)
    op.create_table(
        'stripe_event_logs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('stripe_event_id', sa.String(length=100), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=32), server_default='processed', nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stripe_event_id')
    )
    op.create_index(op.f('ix_stripe_event_logs_stripe_event_id'), 'stripe_event_logs', ['stripe_event_id'], unique=True)
    op.create_index(op.f('ix_stripe_event_logs_event_type'), 'stripe_event_logs', ['event_type'], unique=False)

    # 5. Enable and force RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        tables = [
            'tenant_subscriptions', 'tenant_usage_meters', 'usage_events'
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
        'stripe_event_logs', 'usage_events',
        'tenant_usage_meters', 'tenant_subscriptions'
    ]
    for table in tables:
        op.drop_table(table)
