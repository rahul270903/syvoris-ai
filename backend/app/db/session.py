from typing import AsyncGenerator
from sqlalchemy import text, event
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings
from app.core.tenancy import get_current_tenant_id
from app.db.base import Base

# Engine configuration
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency yielding a tenant-isolated database session."""
    async with async_session_factory() as session:
        tenant_id = get_current_tenant_id()
        if "postgresql" in settings.DATABASE_URL:
            # Set transaction-local tenant context for PostgreSQL kernel RLS using parameterized set_config
            val = str(tenant_id) if tenant_id else ""
            await session.execute(
                text("SELECT set_config('app.current_tenant_id', :val, true)"),
                {"val": val}
            )
        try:
            yield session
        finally:
            await session.close()

def _sync_sqlite_columns(sync_conn):
    """Synchronize any newly added model columns to existing SQLite tables."""
    from sqlalchemy.dialects import sqlite
    sqlite_dialect = sqlite.dialect()
    cursor = sync_conn.connection.cursor()
    for table_name, table in Base.metadata.tables.items():
        cursor.execute(f"PRAGMA table_info({table_name})")
        existing_cols = {row[1] for row in cursor.fetchall()}
        if not existing_cols:
            continue
        for col in table.columns:
            if col.name not in existing_cols:
                type_str = col.type.compile(sqlite_dialect)
                default_clause = ""
                if "BOOL" in type_str.upper():
                    default_clause = " DEFAULT 0"
                alter_stmt = f"ALTER TABLE {table_name} ADD COLUMN {col.name} {type_str}{default_clause}"
                cursor.execute(alter_stmt)
    cursor.close()

async def init_db():
    """Create all tables in database (used for local setup and testing)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if "sqlite" in settings.DATABASE_URL:
            await conn.run_sync(_sync_sqlite_columns)
