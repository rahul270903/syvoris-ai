"""013_ai_intel_and_governance

Revision ID: 013_ai_intel_and_governance
Revises: 012_workflow_and_approvals
Create Date: 2026-11-17 01:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '013_ai_intel_and_governance'
down_revision: Union[str, None] = '012_workflow_and_approvals'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. AI Agents table
    op.create_table(
        'ai_agents',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('persona', sa.String(length=50), nullable=False),
        sa.Column('module', sa.String(length=50), nullable=False),
        sa.Column('role_description', sa.String(length=255), nullable=True),
        sa.Column('autonomy_level', sa.String(length=50), server_default='Suggest Only', nullable=False),
        sa.Column('status', sa.String(length=32), server_default='Active', nullable=False),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        sa.Column('tool_permissions', sa.JSON(), nullable=False),
        sa.Column('primary_kpi', sa.String(length=100), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('metrics', sa.JSON(), nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_agents_tenant_id'), 'ai_agents', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_ai_agents_ref'), 'ai_agents', ['ref'], unique=False)
    op.create_index(op.f('ix_ai_agents_name'), 'ai_agents', ['name'], unique=False)
    op.create_index(op.f('ix_ai_agents_persona'), 'ai_agents', ['persona'], unique=False)
    op.create_index(op.f('ix_ai_agents_autonomy_level'), 'ai_agents', ['autonomy_level'], unique=False)
    op.create_index(op.f('ix_ai_agents_status'), 'ai_agents', ['status'], unique=False)

    # 2. AI Proposals table
    op.create_table(
        'ai_proposals',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('agent_id', sa.Uuid(), nullable=False),
        sa.Column('agent_name', sa.String(length=100), nullable=False),
        sa.Column('action', sa.String(length=255), nullable=False),
        sa.Column('reasoning', sa.Text(), nullable=False),
        sa.Column('evidence', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('policy_check', sa.String(length=100), server_default='Compliant', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Pending Approval', nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('decided_by_id', sa.Uuid(), nullable=True),
        sa.Column('decided_by_name', sa.String(length=255), nullable=True),
        sa.Column('decided_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('decision_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['agent_id'], ['ai_agents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['decided_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_proposals_tenant_id'), 'ai_proposals', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_ai_proposals_ref'), 'ai_proposals', ['ref'], unique=False)
    op.create_index(op.f('ix_ai_proposals_agent_id'), 'ai_proposals', ['agent_id'], unique=False)
    op.create_index(op.f('ix_ai_proposals_status'), 'ai_proposals', ['status'], unique=False)

    # 3. AI Chat Sessions table
    op.create_table(
        'ai_chat_sessions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), server_default='New Copilot Session', nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('user_name', sa.String(length=255), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('is_archived', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_chat_sessions_tenant_id'), 'ai_chat_sessions', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_ai_chat_sessions_user_id'), 'ai_chat_sessions', ['user_id'], unique=False)

    # 4. AI Chat Messages table
    op.create_table(
        'ai_chat_messages',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('session_id', sa.Uuid(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('grounding_sources', sa.JSON(), nullable=False),
        sa.Column('suggested_links', sa.JSON(), nullable=False),
        sa.Column('token_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['ai_chat_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_chat_messages_tenant_id'), 'ai_chat_messages', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_ai_chat_messages_session_id'), 'ai_chat_messages', ['session_id'], unique=False)

    # 5. Revenue Scenarios table
    op.create_table(
        'revenue_scenarios',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('probability_uplift', sa.Numeric(precision=5, scale=2), server_default='5.00', nullable=False),
        sa.Column('launch_delay_days', sa.Integer(), server_default='0', nullable=False),
        sa.Column('discount_pct', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('baseline_pipeline_value', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('projected_pipeline_value', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('delta_value', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('assumptions', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=32), server_default='Simulated', nullable=False),
        sa.Column('created_by_name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_revenue_scenarios_tenant_id'), 'revenue_scenarios', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_revenue_scenarios_ref'), 'revenue_scenarios', ['ref'], unique=False)
    op.create_index(op.f('ix_revenue_scenarios_name'), 'revenue_scenarios', ['name'], unique=False)

    # 6. Custom Reports table
    op.create_table(
        'custom_reports',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('entity_type', sa.String(length=50), server_default='opportunities', nullable=False),
        sa.Column('report_type', sa.String(length=32), server_default='summary', nullable=False),
        sa.Column('filters', sa.JSON(), nullable=False),
        sa.Column('groupings', sa.JSON(), nullable=False),
        sa.Column('aggregates', sa.JSON(), nullable=False),
        sa.Column('columns', sa.JSON(), nullable=False),
        sa.Column('chart_config', sa.JSON(), nullable=False),
        sa.Column('created_by_name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_custom_reports_tenant_id'), 'custom_reports', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_custom_reports_ref'), 'custom_reports', ['ref'], unique=False)
    op.create_index(op.f('ix_custom_reports_name'), 'custom_reports', ['name'], unique=False)
    op.create_index(op.f('ix_custom_reports_entity_type'), 'custom_reports', ['entity_type'], unique=False)

    # 7. Enable and force RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        tables = [
            'ai_agents', 'ai_proposals', 'ai_chat_sessions',
            'ai_chat_messages', 'revenue_scenarios', 'custom_reports'
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
        'custom_reports', 'revenue_scenarios', 'ai_chat_messages',
        'ai_chat_sessions', 'ai_proposals', 'ai_agents'
    ]
    for table in tables:
        op.drop_table(table)
