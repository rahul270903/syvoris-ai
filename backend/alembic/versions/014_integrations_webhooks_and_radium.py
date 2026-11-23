"""014_integrations_and_radium

Revision ID: 014_integrations_and_radium
Revises: 013_ai_intel_and_governance
Create Date: 2026-11-17 02:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '014_integrations_and_radium'
down_revision: Union[str, None] = '013_ai_intel_and_governance'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Integration Connectors table
    op.create_table(
        'integration_connectors',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('connector_type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner', sa.String(length=100), nullable=True),
        sa.Column('boundary_notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=32), server_default='Planned', nullable=False),
        sa.Column('endpoint_url', sa.String(length=500), nullable=True),
        sa.Column('auth_type', sa.String(length=50), server_default='api_key', nullable=False),
        sa.Column('credentials', sa.JSON(), nullable=False),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('health_status', sa.String(length=32), server_default='Healthy', nullable=False),
        sa.Column('health_latency_ms', sa.Integer(), server_default='35', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_integration_connectors_tenant_id'), 'integration_connectors', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_integration_connectors_ref'), 'integration_connectors', ['ref'], unique=False)
    op.create_index(op.f('ix_integration_connectors_name'), 'integration_connectors', ['name'], unique=False)
    op.create_index(op.f('ix_integration_connectors_connector_type'), 'integration_connectors', ['connector_type'], unique=False)
    op.create_index(op.f('ix_integration_connectors_status'), 'integration_connectors', ['status'], unique=False)

    # 2. Webhook Subscriptions table
    op.create_table(
        'webhook_subscriptions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('target_url', sa.String(length=500), nullable=False),
        sa.Column('secret_key', sa.String(length=128), nullable=False),
        sa.Column('events', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('max_retries', sa.Integer(), server_default='5', nullable=False),
        sa.Column('retry_backoff_seconds', sa.Integer(), server_default='30', nullable=False),
        sa.Column('custom_headers', sa.JSON(), nullable=False),
        sa.Column('deliveries_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_webhook_subscriptions_tenant_id'), 'webhook_subscriptions', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_webhook_subscriptions_ref'), 'webhook_subscriptions', ['ref'], unique=False)
    op.create_index(op.f('ix_webhook_subscriptions_name'), 'webhook_subscriptions', ['name'], unique=False)
    op.create_index(op.f('ix_webhook_subscriptions_is_active'), 'webhook_subscriptions', ['is_active'], unique=False)

    # 3. Webhook Deliveries table
    op.create_table(
        'webhook_deliveries',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('subscription_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('event_name', sa.String(length=100), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('signature', sa.String(length=128), nullable=False),
        sa.Column('status', sa.String(length=32), server_default='Success', nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('response_body', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('next_retry_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_ms', sa.Integer(), server_default='0', nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['subscription_id'], ['webhook_subscriptions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_webhook_deliveries_tenant_id'), 'webhook_deliveries', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_webhook_deliveries_subscription_id'), 'webhook_deliveries', ['subscription_id'], unique=False)
    op.create_index(op.f('ix_webhook_deliveries_ref'), 'webhook_deliveries', ['ref'], unique=False)
    op.create_index(op.f('ix_webhook_deliveries_event_name'), 'webhook_deliveries', ['event_name'], unique=False)
    op.create_index(op.f('ix_webhook_deliveries_status'), 'webhook_deliveries', ['status'], unique=False)

    # 4. Radium Sync Logs table
    op.create_table(
        'radium_sync_logs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('direction', sa.String(length=32), server_default='Bidirectional', nullable=False),
        sa.Column('status', sa.String(length=32), server_default='Success', nullable=False),
        sa.Column('records_synced', sa.Integer(), server_default='0', nullable=False),
        sa.Column('records_failed', sa.Integer(), server_default='0', nullable=False),
        sa.Column('details', sa.Text(), nullable=False),
        sa.Column('payload_summary', sa.JSON(), nullable=False),
        sa.Column('latency_ms', sa.Integer(), server_default='42', nullable=False),
        sa.Column('initiated_by', sa.String(length=100), server_default='User', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_radium_sync_logs_tenant_id'), 'radium_sync_logs', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_radium_sync_logs_ref'), 'radium_sync_logs', ['ref'], unique=False)
    op.create_index(op.f('ix_radium_sync_logs_entity_type'), 'radium_sync_logs', ['entity_type'], unique=False)
    op.create_index(op.f('ix_radium_sync_logs_status'), 'radium_sync_logs', ['status'], unique=False)

    # 5. Enable and force RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        tables = [
            'integration_connectors', 'webhook_subscriptions',
            'webhook_deliveries', 'radium_sync_logs'
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
        'radium_sync_logs', 'webhook_deliveries',
        'webhook_subscriptions', 'integration_connectors'
    ]
    for table in tables:
        op.drop_table(table)
