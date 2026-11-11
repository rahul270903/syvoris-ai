import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_active_tenant_id
from app.models.user import User
from app.schemas.auth import (
    RegisterTenantRequest,
    LoginRequest,
    RefreshTokenRequest,
    SwitchTenantRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    VerifyEmailRequest,
    TokenResponse,
    CurrentUserResponse
)
from app.services.auth_service import auth_service

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_tenant(
    req: RegisterTenantRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Self-service tenant onboarding & organization owner creation."""
    ip_addr = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await auth_service.register_tenant(db, req, ip_address=ip_addr, user_agent=user_agent)

@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate with email and password, returning JWT access & refresh tokens."""
    ip_addr = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await auth_service.authenticate_user(
        db,
        email=req.email,
        password=req.password,
        tenant_slug=req.tenant_slug,
        ip_address=ip_addr,
        user_agent=user_agent
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    req: RefreshTokenRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Rotate refresh token and issue a fresh 15-minute access token."""
    ip_addr = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await auth_service.refresh_access_token(
        db,
        raw_refresh_token=req.refresh_token,
        ip_address=ip_addr,
        user_agent=user_agent
    )

@router.post("/switch-tenant", response_model=TokenResponse)
async def switch_tenant(
    req: SwitchTenantRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Switch active tenant context for a multi-tenant user account."""
    ip_addr = request.client.host if request.client else None
    return await auth_service.switch_tenant(
        db,
        user_id=current_user.id,
        new_tenant_id=req.tenant_id,
        ip_address=ip_addr
    )

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    req: Optional[RefreshTokenRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """Revoke active refresh token session."""
    if req and req.refresh_token:
        await auth_service.logout(db, req.refresh_token)
    return {"message": "Successfully logged out."}

@router.post("/password-reset/request", status_code=status.HTTP_200_OK)
async def request_password_reset(
    req: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset link for user email."""
    await auth_service.request_password_reset(db, req.email)
    return {"message": "If this email is registered, a password reset link has been dispatched."}

@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
async def confirm_password_reset(
    req: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """Reset password using verified reset token."""
    await auth_service.confirm_password_reset(db, req.token, req.new_password)
    return {"message": "Password has been successfully updated. You may now sign in."}

@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(
    req: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verify user corporate email address using security token."""
    await auth_service.verify_email(db, req.token)
    return {"message": "Email address has been successfully verified."}

@router.get("/me", response_model=CurrentUserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    active_tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve authenticated user profile, active tenant membership, and all associated tenants."""
    return await auth_service.get_current_user_profile(db, current_user.id, active_tenant_id)
