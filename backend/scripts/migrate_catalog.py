import sys
import os
import asyncio

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy.ext.asyncio import create_async_engine
from app.db.base import Base
import app.models
from app.db.session import _sync_sqlite_columns
from sqlalchemy import text

async def init_dbs():
    root_dir = os.path.dirname(backend_dir)
    dbs = [
        os.path.join(root_dir, 'syvoris_dev.db'),
        os.path.join(backend_dir, 'syvoris_dev.db')
    ]
    for db_path in dbs:
        abs_p = os.path.abspath(db_path).replace(os.sep, '/')
        print(f"Initializing {abs_p}...")
        eng = create_async_engine(f"sqlite+aiosqlite:///{abs_p}")
        async with eng.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.run_sync(_sync_sqlite_columns)
            await conn.execute(text("CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"))
            await conn.execute(text("DELETE FROM alembic_version"))
            await conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('011_product_and_service_catalogue')"))
        await eng.dispose()
        print(f"Successfully initialized and stamped: {abs_p}")

if __name__ == "__main__":
    asyncio.run(init_dbs())
