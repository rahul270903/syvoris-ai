import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Override settings for testing with isolated test database
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_syvoris.db"
os.environ["DEV_EMAIL_LOG_PATH"] = "storage/test_emails.log"

from app.core.config import settings
from app.db.base import Base
from app.services.rbac_service import rbac_service
from app.main import app
from app.db.session import get_db

test_engine = create_async_engine(
    "sqlite+aiosqlite:///./test_syvoris.db",
    connect_args={"check_same_thread": False}
)
test_session_factory = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def override_get_db():
    async with test_session_factory() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_database():
    """Create all tables and seed default permissions and platform roles."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with test_session_factory() as session:
        await rbac_service.seed_permissions_and_platform_roles(session)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

@pytest_asyncio.fixture
async def db_session():
    async with test_session_factory() as session:
        yield session
