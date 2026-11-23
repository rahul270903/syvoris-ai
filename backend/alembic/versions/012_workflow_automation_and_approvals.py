"""012_workflow_and_approvals

Revision ID: 012_workflow_and_approvals
Revises: 011_product_service_catalog
Create Date: 2026-11-17 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '012_workflow_and_approvals'
down_revision: Union[str, None] = '011_product_service_catalog'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Workflows table
    op.create_table(
        'workflows',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), server_default='Sales', nullable=False),
        sa.Column('trigger_type', sa.String(length=50), server_default='event', nullable=False),
        sa.Column('trigger_event', sa.String(length=100), server_default='lead.created', nullable=False),
        sa.Column('trigger_config', sa.JSON(), nullable=False),
        sa.Column('condition_expression', sa.String(length=255), nullable=True),
        sa.Column('conditions', sa.JSON(), nullable=False),
        sa.Column('action_summary', sa.String(length=255), nullable=True),
        sa.Column('actions', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=32), server_default='Active', nullable=False),
        sa.Column('executions_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workflows_tenant_id'), 'workflows', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_workflows_ref'), 'workflows', ['ref'], unique=False)
    op.create_index(op.f('ix_workflows_name'), 'workflows', ['name'], unique=False)
    op.create_index(op.f('ix_workflows_category'), 'workflows', ['category'], unique=False)
    op.create_index(op.f('ix_workflows_trigger_event'), 'workflows', ['trigger_event'], unique=False)
    op.create_index(op.f('ix_workflows_status'), 'workflows', ['status'], unique=False)

    # 2. Workflow Executions table
    op.create_table(
        'workflow_executions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('workflow_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('trigger_event', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', sa.Uuid(), nullable=True),
        sa.Column('status', sa.String(length=32), server_default='Success', nullable=False),
        sa.Column('input_payload', sa.JSON(), nullable=False),
        sa.Column('execution_log', sa.JSON(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), server_default='0', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['workflow_id'], ['workflows.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workflow_executions_tenant_id'), 'workflow_executions', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_workflow_executions_workflow_id'), 'workflow_executions', ['workflow_id'], unique=False)
    op.create_index(op.f('ix_workflow_executions_ref'), 'workflow_executions', ['ref'], unique=False)
    op.create_index(op.f('ix_workflow_executions_trigger_event'), 'workflow_executions', ['trigger_event'], unique=False)
    op.create_index(op.f('ix_workflow_executions_entity_id'), 'workflow_executions', ['entity_id'], unique=False)
    op.create_index(op.f('ix_workflow_executions_status'), 'workflow_executions', ['status'], unique=False)

    # 3. Approval Rules table
    op.create_table(
        'approval_rules',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('entity_type', sa.String(length=50), server_default='Quote', nullable=False),
        sa.Column('condition_type', sa.String(length=50), server_default='discount_threshold', nullable=False),
        sa.Column('threshold_value', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('required_role', sa.String(length=100), server_default='VP Sales', nullable=False),
        sa.Column('escalation_timeout_hours', sa.Integer(), server_default='24', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_approval_rules_tenant_id'), 'approval_rules', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_approval_rules_ref'), 'approval_rules', ['ref'], unique=False)
    op.create_index(op.f('ix_approval_rules_name'), 'approval_rules', ['name'], unique=False)
    op.create_index(op.f('ix_approval_rules_entity_type'), 'approval_rules', ['entity_type'], unique=False)
    op.create_index(op.f('ix_approval_rules_is_active'), 'approval_rules', ['is_active'], unique=False)

    # 4. Enable and force RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        tables = ['workflows', 'workflow_executions', 'approval_rules']
        for table in tables:
            op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
            op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
            op.execute(f"""
                CREATE POLICY {table}_tenant_isolation ON {table}
                AS RESTRICTIVE
                USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
            """)

def downgrade() -> None:
    tables = ['approval_rules', 'workflow_executions', 'workflows']
    for table in tables:
        op.drop_table(table)
