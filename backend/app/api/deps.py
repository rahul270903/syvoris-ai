import uuid
from typing import Optional, List, Callable
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.core.config import settings
from app.core.security import decode_token
from app.core.errors import AuthenticationException, AuthorizationException
from app.core.tenancy import set_current_tenant_id, set_current_user_id
from app.db.session import get_db
from app.models.user import User
from app.services.rbac_service import rbac_service

security_bearer = HTTPBearer(auto_error=False)

async def get_current_user_and_token_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> tuple[User, dict]:
    """Validate JWT bearer token and return user model along with token payload."""
    if not credentials:
        raise AuthenticationException("Authorization header missing.")

    try:
        payload = decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise AuthenticationException("Session token has expired. Please refresh your session.")
    except jwt.InvalidTokenError:
        raise AuthenticationException("Invalid authentication token.")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise AuthenticationException("Invalid token payload: missing subject.")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthenticationException("Invalid user ID in token.")

    user = await db.get(User, user_id)
    if not user or user.deleted_at is not None:
        raise AuthenticationException("User account does not exist or has been deactivated.")

    # Bind execution context
    set_current_user_id(user.id)
    raw_tenant_id = payload.get("tenant_id")
    tenant_uuid: Optional[uuid.UUID] = None
    if raw_tenant_id:
        try:
            tenant_uuid = uuid.UUID(raw_tenant_id)
            set_current_tenant_id(tenant_uuid)
        except ValueError:
            pass

    # Ensure transaction-local PostgreSQL RLS context is set immediately upon token validation
    if "postgresql" in settings.DATABASE_URL:
        from sqlalchemy import text
        val = str(tenant_uuid) if tenant_uuid else ""
        await db.execute(
            text("SELECT set_config('app.current_tenant_id', :val, true)"),
            {"val": val}
        )

    return user, payload

async def get_current_user(
    user_payload: tuple[User, dict] = Depends(get_current_user_and_token_payload)
) -> User:
    return user_payload[0]

async def get_current_active_tenant_id(
    user_payload: tuple[User, dict] = Depends(get_current_user_and_token_payload)
) -> Optional[uuid.UUID]:
    payload = user_payload[1]
    raw_tenant_id = payload.get("tenant_id")
    if raw_tenant_id:
        try:
            return uuid.UUID(raw_tenant_id)
        except ValueError:
            return None
    return None

def require_permission(permission_code: str) -> Callable:
    """Dependency factory checking that the user possesses a specific permission in their active tenant."""
    async def permission_checker(
        user_payload: tuple[User, dict] = Depends(get_current_user_and_token_payload)
    ):
        user, payload = user_payload
        if user.is_platform_admin:
            return

        permissions: List[str] = payload.get("permissions", [])
        if permission_code not in permissions:
            raise AuthorizationException(f"Missing required permission: '{permission_code}'.")

    return permission_checker

def require_platform_admin():
    """Dependency verifying that the user is an authorized SaaS platform administrator."""
    async def admin_checker(
        user: User = Depends(get_current_user)
    ):
        if not user.is_platform_admin:
            raise AuthorizationException("Platform Administrator privileges are strictly required.")
    return admin_checker
