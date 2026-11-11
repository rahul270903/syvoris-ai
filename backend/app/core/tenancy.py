from contextvars import ContextVar
from contextlib import contextmanager, asynccontextmanager
from typing import Generator, AsyncGenerator, Optional, Any
from uuid import UUID

current_tenant_id: ContextVar[Optional[UUID]] = ContextVar("current_tenant_id", default=None)
current_user_id: ContextVar[Optional[UUID]] = ContextVar("current_user_id", default=None)

def get_current_tenant_id() -> Optional[UUID]:
    """Retrieve tenant ID bound to the current execution context."""
    return current_tenant_id.get()

def set_current_tenant_id(tenant_id: Optional[UUID]):
    """Bind tenant ID to the current execution context."""
    return current_tenant_id.set(tenant_id)

def get_current_user_id() -> Optional[UUID]:
    """Retrieve user ID bound to the current execution context."""
    return current_user_id.get()

def set_current_user_id(user_id: Optional[UUID]):
    """Bind user ID to the current execution context."""
    return current_user_id.set(user_id)

@contextmanager
def tenant_context(tenant_id: Optional[UUID]) -> Generator[None, None, None]:
    """Context manager for asynchronous tasks and background jobs enforcing tenant scope in contextvars."""
    token = current_tenant_id.set(tenant_id)
    try:
        yield
    finally:
        current_tenant_id.reset(token)

@asynccontextmanager
async def async_tenant_context(session: Any, tenant_id: Optional[UUID]) -> AsyncGenerator[None, None]:
    """Async context manager for background jobs binding Python context and PostgreSQL transaction-local RLS."""
    token = current_tenant_id.set(tenant_id)
    try:
        from sqlalchemy import text
        val = str(tenant_id) if tenant_id else ""
        try:
            await session.execute(
                text("SELECT set_config('app.current_tenant_id', :val, true)"),
                {"val": val}
            )
        except Exception:
            pass
        yield
    finally:
        current_tenant_id.reset(token)
