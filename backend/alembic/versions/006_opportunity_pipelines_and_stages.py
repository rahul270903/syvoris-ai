"""006_opportunity_pipelines_and_stages

Revision ID: 006_opportunity_pipelines_and_stages
Revises: 005_merge_and_hierarchy
Create Date: 2026-11-13 01:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '006_opportunity_pipelines_and_stages'
down_revision: Union[str, None] = '005_merge_and_hierarchy'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Extend opportunities table
    op.add_column('opportunities', sa.Column('stage_entered_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('opportunities', sa.Column('loss_reason', sa.Text(), nullable=True))
    op.add_column('opportunities', sa.Column('win_description', sa.Text(), nullable=True))
    op.add_column('opportunities', sa.Column('competitor_name', sa.String(length=100), nullable=True))
    op.add_column('opportunities', sa.Column('budget_confirmed', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('opportunities', sa.Column('decision_maker_bought_in', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('opportunities', sa.Column('next_step', sa.String(length=255), nullable=True))

    # 2. Create opportunity_stage_history table
    op.create_table(
        'opportunity_stage_history',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('opportunity_id', sa.Uuid(), nullable=False),
        sa.Column('from_stage', sa.String(length=100), nullable=True),
        sa.Column('to_stage', sa.String(length=100), nullable=False),
        sa.Column('transition_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('days_in_previous_stage', sa.Numeric(precision=8, scale=2), server_default='0.00', nullable=False),
        sa.Column('actor_id', sa.Uuid(), nullable=True),
        sa.Column('actor_name', sa.String(length=255), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_opp_history_tenant_id'), 'opportunity_stage_history', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_opp_history_opp_id'), 'opportunity_stage_history', ['opportunity_id'], unique=False)
    op.create_index(op.f('ix_opp_history_transition_at'), 'opportunity_stage_history', ['transition_at'], unique=False)

    # 3. Create pipelines table
    op.create_table(
        'pipelines',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('stages_config', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pipelines_tenant_id'), 'pipelines', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_pipelines_code'), 'pipelines', ['code'], unique=False)

    # 4. RLS for new tables
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for table in ['opportunity_stage_history', 'pipelines']:
            op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
            op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
            op.execute(f"""
                CREATE POLICY {table}_tenant_isolation ON {table}
                AS RESTRICTIVE
                USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
            """)

def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for table in ['pipelines', 'opportunity_stage_history']:
            op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table};")
            op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")

    op.drop_table('pipelines')
    op.drop_table('opportunity_stage_history')

    op.drop_column('opportunities', 'next_step')
    op.drop_column('opportunities', 'decision_maker_bought_in')
    op.drop_column('opportunities', 'budget_confirmed')
    op.drop_column('opportunities', 'competitor_name')
    op.drop_column('opportunities', 'win_description')
    op.drop_column('opportunities', 'loss_reason')
    op.drop_column('opportunities', 'stage_entered_at')
