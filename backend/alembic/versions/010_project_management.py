"""010_project_management

Revision ID: 010_project_management
Revises: 009_customer_service_helpdesk
Create Date: 2026-11-14 01:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '010_project_management'
down_revision: Union[str, None] = '009_customer_service_helpdesk'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('account_id', sa.Uuid(), nullable=True),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('opportunity_id', sa.Uuid(), nullable=True),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('objectives', sa.Text(), nullable=True),
        sa.Column('project_type', sa.String(length=64), server_default='Implementation', nullable=False),
        sa.Column('category', sa.String(length=64), server_default='Enterprise', nullable=False),
        sa.Column('status', sa.String(length=32), server_default='Planning', nullable=False),
        sa.Column('priority', sa.String(length=32), server_default='Medium', nullable=False),
        sa.Column('health', sa.String(length=32), server_default='On Track', nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('manager_id', sa.Uuid(), nullable=True),
        sa.Column('manager_name', sa.String(length=255), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.Column('actual_completion_date', sa.Date(), nullable=True),
        sa.Column('budget', sa.Numeric(precision=14, scale=2), server_default='0.00', nullable=False),
        sa.Column('approved_cost_baseline', sa.Numeric(precision=14, scale=2), server_default='0.00', nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('progress_pct', sa.Integer(), server_default='0', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['manager_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_tenant_id'), 'projects', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_projects_ref'), 'projects', ['ref'], unique=False)
    op.create_index(op.f('ix_projects_name'), 'projects', ['name'], unique=False)
    op.create_index(op.f('ix_projects_status'), 'projects', ['status'], unique=False)
    op.create_index(op.f('ix_projects_health'), 'projects', ['health'], unique=False)

    # 2. Project Milestones table
    op.create_table(
        'project_milestones',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('deliverable', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=32), server_default='Pending', nullable=False),
        sa.Column('priority', sa.String(length=32), server_default='Medium', nullable=False),
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.Column('completion_date', sa.Date(), nullable=True),
        sa.Column('completion_criteria', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), server_default='0', nullable=False),
        sa.Column('progress_pct', sa.Integer(), server_default='0', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_milestones_tenant_id'), 'project_milestones', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_project_milestones_project_id'), 'project_milestones', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_milestones_ref'), 'project_milestones', ['ref'], unique=False)

    # 3. Project Tasks table
    op.create_table(
        'project_tasks',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('milestone_id', sa.Uuid(), nullable=True),
        sa.Column('parent_task_id', sa.Uuid(), nullable=True),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('assigned_user_id', sa.Uuid(), nullable=True),
        sa.Column('assigned_user_name', sa.String(length=255), nullable=True),
        sa.Column('priority', sa.String(length=32), server_default='Medium', nullable=False),
        sa.Column('status', sa.String(length=32), server_default='Not Started', nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('estimated_hours', sa.Numeric(precision=8, scale=2), server_default='0.00', nullable=False),
        sa.Column('actual_hours', sa.Numeric(precision=8, scale=2), server_default='0.00', nullable=False),
        sa.Column('progress_pct', sa.Integer(), server_default='0', nullable=False),
        sa.Column('blocked_reason', sa.Text(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assigned_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['milestone_id'], ['project_milestones.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['parent_task_id'], ['project_tasks.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_tasks_tenant_id'), 'project_tasks', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_project_tasks_project_id'), 'project_tasks', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_tasks_milestone_id'), 'project_tasks', ['milestone_id'], unique=False)
    op.create_index(op.f('ix_project_tasks_assigned_user_id'), 'project_tasks', ['assigned_user_id'], unique=False)
    op.create_index(op.f('ix_project_tasks_ref'), 'project_tasks', ['ref'], unique=False)
    op.create_index(op.f('ix_project_tasks_status'), 'project_tasks', ['status'], unique=False)

    # 4. Task Dependencies table
    op.create_table(
        'task_dependencies',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('task_id', sa.Uuid(), nullable=False),
        sa.Column('depends_on_task_id', sa.Uuid(), nullable=False),
        sa.Column('dependency_type', sa.String(length=32), server_default='Finish-to-Start', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['depends_on_task_id'], ['project_tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['project_tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_task_dependencies_tenant_id'), 'task_dependencies', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_task_dependencies_task_id'), 'task_dependencies', ['task_id'], unique=False)
    op.create_index(op.f('ix_task_dependencies_depends_on_task_id'), 'task_dependencies', ['depends_on_task_id'], unique=False)

    # 5. Project Resources table
    op.create_table(
        'project_resources',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('role_title', sa.String(length=128), nullable=False),
        sa.Column('allocation_pct', sa.Integer(), server_default='100', nullable=False),
        sa.Column('planned_hours', sa.Numeric(precision=8, scale=2), server_default='0.00', nullable=False),
        sa.Column('actual_hours', sa.Numeric(precision=8, scale=2), server_default='0.00', nullable=False),
        sa.Column('hourly_rate', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=32), server_default='Active', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_resources_tenant_id'), 'project_resources', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_project_resources_project_id'), 'project_resources', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_resources_user_id'), 'project_resources', ['user_id'], unique=False)
    op.create_index(op.f('ix_project_resources_ref'), 'project_resources', ['ref'], unique=False)

    # 6. Project Costs table
    op.create_table(
        'project_costs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('task_id', sa.Uuid(), nullable=True),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=64), server_default='Labor', nullable=False),
        sa.Column('cost_type', sa.String(length=32), server_default='Actual', nullable=False),
        sa.Column('amount', sa.Numeric(precision=14, scale=2), server_default='0.00', nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('date_incurred', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=32), server_default='Approved', nullable=False),
        sa.Column('approved_by_id', sa.Uuid(), nullable=True),
        sa.Column('approved_by_name', sa.String(length=255), nullable=True),
        sa.Column('vendor_name', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['project_tasks.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_costs_tenant_id'), 'project_costs', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_project_costs_project_id'), 'project_costs', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_costs_category'), 'project_costs', ['category'], unique=False)
    op.create_index(op.f('ix_project_costs_ref'), 'project_costs', ['ref'], unique=False)

    # 7. Project Activities table
    op.create_table(
        'project_activities',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('activity_type', sa.String(length=64), nullable=False),
        sa.Column('action', sa.String(length=128), nullable=False),
        sa.Column('actor_id', sa.Uuid(), nullable=True),
        sa.Column('actor_name', sa.String(length=255), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_activities_tenant_id'), 'project_activities', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_project_activities_project_id'), 'project_activities', ['project_id'], unique=False)

    # 8. Enable and force RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        tables = [
            'projects', 'project_milestones', 'project_tasks',
            'task_dependencies', 'project_resources', 'project_costs',
            'project_activities'
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
        'project_activities', 'project_costs', 'project_resources',
        'task_dependencies', 'project_tasks', 'project_milestones',
        'projects'
    ]
    for table in tables:
        op.drop_table(table)
