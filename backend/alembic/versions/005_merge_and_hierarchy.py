"""005_merge_and_hierarchy

Revision ID: 005_merge_and_hierarchy
Revises: 004_leads_and_conversion
Create Date: 2026-11-13 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_merge_and_hierarchy'
down_revision: Union[str, None] = '004_leads_and_conversion'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Add merged_into_id to accounts
    op.add_column('accounts', sa.Column('merged_into_id', sa.Uuid(), nullable=True))
    op.create_foreign_key('fk_accounts_merged_into', 'accounts', 'accounts', ['merged_into_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_accounts_merged_into_id'), 'accounts', ['merged_into_id'], unique=False)

    # 2. Add merged_into_id to contacts
    op.add_column('contacts', sa.Column('merged_into_id', sa.Uuid(), nullable=True))
    op.create_foreign_key('fk_contacts_merged_into', 'contacts', 'contacts', ['merged_into_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_contacts_merged_into_id'), 'contacts', ['merged_into_id'], unique=False)

    # 3. Add merged_into_id to leads
    op.add_column('leads', sa.Column('merged_into_id', sa.Uuid(), nullable=True))
    op.create_foreign_key('fk_leads_merged_into', 'leads', 'leads', ['merged_into_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_leads_merged_into_id'), 'leads', ['merged_into_id'], unique=False)

def downgrade() -> None:
    op.drop_constraint('fk_leads_merged_into', 'leads', type_='foreignkey')
    op.drop_index(op.f('ix_leads_merged_into_id'), table_name='leads')
    op.drop_column('leads', 'merged_into_id')

    op.drop_constraint('fk_contacts_merged_into', 'contacts', type_='foreignkey')
    op.drop_index(op.f('ix_contacts_merged_into_id'), table_name='contacts')
    op.drop_column('contacts', 'merged_into_id')

    op.drop_constraint('fk_accounts_merged_into', 'accounts', type_='foreignkey')
    op.drop_index(op.f('ix_accounts_merged_into_id'), table_name='accounts')
    op.drop_column('accounts', 'merged_into_id')
