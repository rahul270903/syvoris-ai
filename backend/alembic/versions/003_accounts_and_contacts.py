"""003_accounts_and_contacts

Revision ID: 003_accounts_and_contacts
Revises: 002_audit_immutability
Create Date: 2026-11-12 01:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_accounts_and_contacts'
down_revision: Union[str, None] = '002_audit_immutability'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. accounts
    op.create_table(
        'accounts',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('account_type', sa.String(length=50), server_default='Customer', nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('billing_address', sa.JSON(), nullable=False),
        sa.Column('shipping_address', sa.JSON(), nullable=False),
        sa.Column('ownership', sa.String(length=50), server_default='Private', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('credit_limit', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('parent_id', sa.Uuid(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=True),
        sa.Column('updated_by', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['parent_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounts_tenant_id'), 'accounts', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_accounts_ref'), 'accounts', ['ref'], unique=False)
    op.create_index(op.f('ix_accounts_name'), 'accounts', ['name'], unique=False)
    op.create_index(op.f('ix_accounts_status'), 'accounts', ['status'], unique=False)

    # 2. contacts
    op.create_table(
        'contacts',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('account_id', sa.Uuid(), nullable=True),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('job_title', sa.String(length=100), nullable=True),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
        sa.Column('is_primary', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_decision_maker', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=True),
        sa.Column('updated_by', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contacts_tenant_id'), 'contacts', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_contacts_account_id'), 'contacts', ['account_id'], unique=False)
    op.create_index(op.f('ix_contacts_ref'), 'contacts', ['ref'], unique=False)
    op.create_index(op.f('ix_contacts_email'), 'contacts', ['email'], unique=False)
    op.create_index(op.f('ix_contacts_status'), 'contacts', ['status'], unique=False)

    # 3. crm_activities
    op.create_table(
        'crm_activities',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('account_id', sa.Uuid(), nullable=False),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('activity_type', sa.String(length=50), server_default='Note', nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('actor_id', sa.Uuid(), nullable=True),
        sa.Column('actor_name', sa.String(length=255), server_default='User', nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_crm_activities_tenant_id'), 'crm_activities', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_crm_activities_account_id'), 'crm_activities', ['account_id'], unique=False)
    op.create_index(op.f('ix_crm_activities_contact_id'), 'crm_activities', ['contact_id'], unique=False)

    # Dialect-specific RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        for table in ['accounts', 'contacts', 'crm_activities']:
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
        for table in ['crm_activities', 'contacts', 'accounts']:
            op.execute(f"DROP POLICY IF EXISTS tenant_isolation_{table} ON {table};")
    op.drop_table('crm_activities')
    op.drop_table('contacts')
    op.drop_table('accounts')
