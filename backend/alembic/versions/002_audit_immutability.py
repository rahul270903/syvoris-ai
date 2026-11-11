"""002_audit_immutability

Revision ID: 002_audit_immutability
Revises: 001_foundation
Create Date: 2026-11-12 00:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_audit_immutability'
down_revision: Union[str, None] = '001_foundation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == 'postgresql':
        # 1. Create plpgsql trigger function to block updates and deletes
        op.execute("""
            CREATE OR REPLACE FUNCTION prevent_audit_events_mutation()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'Audit records are append-only. Modification and deletion of audit_events is strictly prohibited by database policy.';
            END;
            $$ LANGUAGE plpgsql;
        """)

        # 2. Attach before-trigger on audit_events
        op.execute("""
            CREATE TRIGGER enforce_audit_events_immutable
            BEFORE UPDATE OR DELETE ON audit_events
            FOR EACH ROW
            EXECUTE FUNCTION prevent_audit_events_mutation();
        """)

        # 3. Explicitly revoke UPDATE and DELETE privileges from public/app roles
        op.execute("REVOKE UPDATE, DELETE ON audit_events FROM PUBLIC;")

    elif dialect == 'sqlite':
        # SQLite trigger-based immutability protection
        op.execute("""
            CREATE TRIGGER IF NOT EXISTS prevent_audit_update
            BEFORE UPDATE ON audit_events
            BEGIN
                SELECT RAISE(FAIL, 'Audit records are append-only. UPDATE is prohibited.');
            END;
        """)
        op.execute("""
            CREATE TRIGGER IF NOT EXISTS prevent_audit_delete
            BEFORE DELETE ON audit_events
            BEGIN
                SELECT RAISE(FAIL, 'Audit records are append-only. DELETE is prohibited.');
            END;
        """)

def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == 'postgresql':
        op.execute("DROP TRIGGER IF EXISTS enforce_audit_events_immutable ON audit_events;")
        op.execute("DROP FUNCTION IF EXISTS prevent_audit_events_mutation();")
    elif dialect == 'sqlite':
        op.execute("DROP TRIGGER IF EXISTS prevent_audit_update;")
        op.execute("DROP TRIGGER IF EXISTS prevent_audit_delete;")
