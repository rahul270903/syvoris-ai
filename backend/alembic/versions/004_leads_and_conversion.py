"""004_leads_and_conversion

Revision ID: 004_leads_and_conversion
Revises: 003_accounts_and_contacts
Create Date: 2026-11-12 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_leads_and_conversion'
down_revision: Union[str, None] = '003_accounts_and_contacts'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. opportunities (Foundational opportunity table for lead conversion target)
    op.create_table(
        'opportunities',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('account_id', sa.Uuid(), nullable=False),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('pipeline_id', sa.String(length=64), server_default='default', nullable=False),
        sa.Column('stage', sa.String(length=100), server_default='Qualification', nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('currency', sa.String(length=3), server_default='USD', nullable=False),
        sa.Column('probability', sa.Integer(), server_default='25', nullable=False),
        sa.Column('expected_close_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('forecast_category', sa.String(length=50), server_default='Pipeline', nullable=False),
        sa.Column('risk_level', sa.String(length=32), server_default='Low', nullable=False),
        sa.Column('lead_source', sa.String(length=100), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=True),
        sa.Column('updated_by', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_opportunities_tenant_id'), 'opportunities', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_opportunities_account_id'), 'opportunities', ['account_id'], unique=False)
    op.create_index(op.f('ix_opportunities_contact_id'), 'opportunities', ['contact_id'], unique=False)
    op.create_index(op.f('ix_opportunities_ref'), 'opportunities', ['ref'], unique=False)
    op.create_index(op.f('ix_opportunities_stage'), 'opportunities', ['stage'], unique=False)
    op.create_index(op.f('ix_opportunities_owner_id'), 'opportunities', ['owner_id'], unique=False)

    # 2. leads
    op.create_table(
        'leads',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('company_name', sa.String(length=255), nullable=False),
        sa.Column('job_title', sa.String(length=100), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('source', sa.String(length=100), server_default='Website', nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('territory', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='New', nullable=False),
        sa.Column('score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('priority', sa.String(length=32), server_default='Normal', nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('consent_status', sa.String(length=50), server_default='Pending', nullable=False),
        sa.Column('converted_account_id', sa.Uuid(), nullable=True),
        sa.Column('converted_contact_id', sa.Uuid(), nullable=True),
        sa.Column('converted_opportunity_id', sa.Uuid(), nullable=True),
        sa.Column('converted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=True),
        sa.Column('updated_by', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['converted_account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['converted_contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['converted_opportunity_id'], ['opportunities.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_leads_tenant_id'), 'leads', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_leads_ref'), 'leads', ['ref'], unique=False)
    op.create_index(op.f('ix_leads_company_name'), 'leads', ['company_name'], unique=False)
    op.create_index(op.f('ix_leads_email'), 'leads', ['email'], unique=False)
    op.create_index(op.f('ix_leads_status'), 'leads', ['status'], unique=False)
    op.create_index(op.f('ix_leads_score'), 'leads', ['score'], unique=False)
    op.create_index(op.f('ix_leads_owner_id'), 'leads', ['owner_id'], unique=False)

    # Dialect-specific RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        for table in ['opportunities', 'leads']:
            op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
            op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
            op.execute(f"""
                CREATE POLICY tenant_isolation_{table} ON {table}
                    FOR ALL
                    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
                    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
            """)
            op.execute(f"GRANT ALL PRIVILEGES ON TABLE {table} TO PUBLIC;")

def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        for table in ['leads', 'opportunities']:
            op.execute(f"DROP POLICY IF EXISTS tenant_isolation_{table} ON {table};")
    op.drop_table('leads')
    op.drop_table('opportunities')
