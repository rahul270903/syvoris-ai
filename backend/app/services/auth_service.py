import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    validate_password_strength,
    create_access_token,
    create_random_token,
    hash_token
)
from app.core.errors import (
    AuthenticationException,
    ConflictException,
    NotFoundException,
    ValidationException,
    AuthorizationException
)
from app.models.tenant import Tenant, OrganizationSettings
from app.models.user import User, TenantMembership
from app.models.rbac import UserRole, Role
from app.models.token import RefreshToken, PasswordResetToken, EmailVerificationToken
from app.services.rbac_service import rbac_service
from app.services.audit_service import audit_service
from app.services.email_adapter import email_service
from app.schemas.auth import (
    RegisterTenantRequest,
    TokenResponse,
    UserSummary,
    TenantMembershipSummary,
    CurrentUserResponse
)

class AuthService:
    @staticmethod
    async def register_tenant(
        db: AsyncSession,
        req: RegisterTenantRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TokenResponse:
        """Register a new tenant organization and its primary owner account."""
        # 1. Validate password strength
        valid_pwd, pwd_err = validate_password_strength(req.password)
        if not valid_pwd:
            raise ValidationException(pwd_err)

        # 2. Check slug uniqueness
        existing_slug_res = await db.execute(select(Tenant).where(Tenant.slug == req.tenant_slug.lower().strip()))
        if existing_slug_res.scalar_one_or_none():
            raise ConflictException(f"The organization slug '{req.tenant_slug}' is already taken.")

        # 3. Check user email uniqueness
        existing_user_res = await db.execute(select(User).where(User.email == req.email.lower().strip()))
        if existing_user_res.scalar_one_or_none():
            raise ConflictException(f"A user account with email '{req.email}' already exists.")

        # 4. Create Tenant
        tenant = Tenant(
            slug=req.tenant_slug.lower().strip(),
            name=req.organization_name.strip(),
            plan_tier="Starter",
            status="Active",
            settings={}
        )
        db.add(tenant)
        await db.flush()

        # 5. Create OrganizationSettings
        org_settings = OrganizationSettings(
            tenant_id=tenant.id,
            currency="USD",
            timezone="America/New_York",
            date_format="YYYY-MM-DD",
            primary_color="#2563eb",
            support_email=req.email.lower().strip(),
            address={}
        )
        db.add(org_settings)
        await db.flush()

        # 6. Ensure default roles exist for this tenant
        roles = await rbac_service.ensure_tenant_roles(db, tenant.id)
        owner_role = roles["Tenant Owner"]

        # 7. Create User
        user = User(
            email=req.email.lower().strip(),
            password_hash=get_password_hash(req.password),
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            is_platform_admin=False,
            is_verified=False,
            preferences={}
        )
        db.add(user)
        await db.flush()

        # 8. Create TenantMembership
        membership = TenantMembership(
            tenant_id=tenant.id,
            user_id=user.id,
            status="Active"
        )
        db.add(membership)
        await db.flush()

        # 9. Assign Owner Role
        user_role = UserRole(
            user_id=user.id,
            role_id=owner_role.id,
            tenant_id=tenant.id
        )
        db.add(user_role)
        await db.flush()

        # 10. Generate verification token
        raw_verify, verify_hash = create_random_token()
        verify_token = EmailVerificationToken(
            user_id=user.id,
            token_hash=verify_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=settings.EMAIL_VERIFY_EXPIRE_HOURS)
        )
        db.add(verify_token)

        # 11. Create Refresh Token
        raw_refresh, refresh_hash = create_random_token(48)
        refresh_token = RefreshToken(
            user_id=user.id,
            tenant_id=tenant.id,
            token_hash=refresh_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            user_agent=user_agent,
            ip_address=ip_address
        )
        db.add(refresh_token)

        # 12. Commit transaction
        await db.commit()

        # 13. Audit events & dispatch dev email
        await audit_service.log_event(
            db, action="tenant.registered", resource_type="tenant",
            tenant_id=tenant.id, actor_id=user.id, actor_name=user.full_name,
            resource_id=str(tenant.id), ip_address=ip_address, user_agent=user_agent,
            metadata={"org_name": tenant.name, "slug": tenant.slug}
        )
        await email_service.send_welcome_email(user.email, tenant.name, raw_verify)

        # 14. Issue Access Token
        primary_role, permissions = await rbac_service.get_user_tenant_role_and_permissions(db, user.id, tenant.id)
        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "tenant_id": str(tenant.id),
            "tenant_slug": tenant.slug,
            "role": primary_role,
            "permissions": permissions,
            "is_platform_admin": user.is_platform_admin
        }
        access_token = create_access_token(token_payload)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            refresh_token=raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            tenant_id=tenant.id,
            tenant_slug=tenant.slug,
            role=primary_role,
            permissions=permissions
        )

    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        email: str,
        password: str,
        tenant_slug: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TokenResponse:
        """Authenticate user credentials and resolve the active tenant context."""
        email_clean = email.lower().strip()
        query = select(User).where(User.email == email_clean)
        user_res = await db.execute(query)
        user = user_res.scalar_one_or_none()

        if not user or not verify_password(password, user.password_hash):
            await audit_service.log_event(
                db, action="auth.login.failed", resource_type="auth",
                actor_name=email_clean, ip_address=ip_address, user_agent=user_agent,
                metadata={"reason": "Invalid credentials", "email": email_clean}
            )
            raise AuthenticationException("Invalid email address or password.")

        if user.deleted_at is not None:
            raise AuthenticationException("This account has been deactivated.")

        # Resolve tenant membership
        membership_query = (
            select(TenantMembership)
            .where(
                TenantMembership.user_id == user.id,
                TenantMembership.status.in_(["Active", "Invited"])
            )
            .options(selectinload(TenantMembership.tenant))
        )
        memberships_res = await db.execute(membership_query)
        memberships = memberships_res.scalars().all()

        active_membership: Optional[TenantMembership] = None
        if tenant_slug:
            active_membership = next((m for m in memberships if m.tenant.slug == tenant_slug.lower().strip()), None)
            if not active_membership and not user.is_platform_admin:
                raise AuthorizationException(f"You do not have an active membership in organization '{tenant_slug}'.")
        elif memberships:
            active_membership = memberships[0]

        if active_membership and active_membership.status == "Invited":
            active_membership.status = "Active"
            await db.flush()

        active_tenant = active_membership.tenant if active_membership else None
        active_tenant_id = active_tenant.id if active_tenant else None
        active_tenant_slug = active_tenant.slug if active_tenant else None

        # Check tenant status
        if active_tenant and active_tenant.status == "Suspended":
            raise AuthorizationException("This organization account is currently suspended. Contact support.")

        # Get role and permissions for this tenant
        role_name, permissions = await rbac_service.get_user_tenant_role_and_permissions(db, user.id, active_tenant_id)

        # Issue refresh token
        raw_refresh, refresh_hash = create_random_token(48)
        refresh_token = RefreshToken(
            user_id=user.id,
            tenant_id=active_tenant_id,
            token_hash=refresh_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            user_agent=user_agent,
            ip_address=ip_address
        )
        db.add(refresh_token)
        await db.commit()

        # Audit success
        await audit_service.log_event(
            db, action="auth.login.success", resource_type="user",
            tenant_id=active_tenant_id, actor_id=user.id, actor_name=user.full_name,
            resource_id=str(user.id), ip_address=ip_address, user_agent=user_agent,
            metadata={"tenant_slug": active_tenant_slug}
        )

        # Issue access token
        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "tenant_id": str(active_tenant_id) if active_tenant_id else None,
            "tenant_slug": active_tenant_slug,
            "role": role_name,
            "permissions": permissions,
            "is_platform_admin": user.is_platform_admin
        }
        access_token = create_access_token(token_payload)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            refresh_token=raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            tenant_id=active_tenant_id,
            tenant_slug=active_tenant_slug,
            role=role_name,
            permissions=permissions
        )

    @staticmethod
    async def switch_tenant(
        db: AsyncSession,
        user_id: uuid.UUID,
        new_tenant_id: uuid.UUID,
        ip_address: Optional[str] = None
    ) -> TokenResponse:
        """Switch active tenant context for a multi-tenant user."""
        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        if not user:
            raise NotFoundException("User not found.")

        # Verify membership
        m_res = await db.execute(
            select(TenantMembership)
            .where(
                TenantMembership.user_id == user_id,
                TenantMembership.tenant_id == new_tenant_id,
                TenantMembership.status.in_(["Active", "Invited"])
            )
            .options(selectinload(TenantMembership.tenant))
        )
        membership = m_res.scalar_one_or_none()
        if not membership and not user.is_platform_admin:
            raise AuthorizationException("You do not hold an active membership in the target tenant.")

        if membership and membership.status == "Invited":
            membership.status = "Active"
            await db.flush()

        tenant = membership.tenant if membership else (await db.get(Tenant, new_tenant_id))
        if not tenant or tenant.status != "Active":
            raise AuthorizationException("The target tenant is not active.")

        role_name, permissions = await rbac_service.get_user_tenant_role_and_permissions(db, user.id, tenant.id)

        # Issue new refresh token
        raw_refresh, refresh_hash = create_random_token(48)
        refresh_token = RefreshToken(
            user_id=user.id,
            tenant_id=tenant.id,
            token_hash=refresh_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            ip_address=ip_address
        )
        db.add(refresh_token)
        await db.commit()

        # Audit
        await audit_service.log_event(
            db, action="auth.tenant_switched", resource_type="tenant",
            tenant_id=tenant.id, actor_id=user.id, actor_name=user.full_name,
            resource_id=str(tenant.id), ip_address=ip_address,
            metadata={"target_tenant": tenant.name}
        )

        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "tenant_id": str(tenant.id),
            "tenant_slug": tenant.slug,
            "role": role_name,
            "permissions": permissions,
            "is_platform_admin": user.is_platform_admin
        }
        access_token = create_access_token(token_payload)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            refresh_token=raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            tenant_id=tenant.id,
            tenant_slug=tenant.slug,
            role=role_name,
            permissions=permissions
        )

    @staticmethod
    async def refresh_access_token(
        db: AsyncSession,
        raw_refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> TokenResponse:
        """Rotate refresh token and issue a fresh access token."""
        h = hash_token(raw_refresh_token)
        token_res = await db.execute(
            select(RefreshToken)
            .where(RefreshToken.token_hash == h)
            .options(selectinload(RefreshToken.user))
        )
        rt = token_res.scalar_one_or_none()

        if not rt or not rt.is_valid:
            raise AuthenticationException("Invalid or expired refresh token.")

        user = rt.user
        tenant_id = rt.tenant_id

        # Revoke old refresh token (rotation)
        rt.revoked_at = datetime.now(timezone.utc)

        # Issue new refresh token
        new_raw_refresh, new_refresh_hash = create_random_token(48)
        new_rt = RefreshToken(
            user_id=user.id,
            tenant_id=tenant_id,
            token_hash=new_refresh_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            user_agent=user_agent,
            ip_address=ip_address
        )
        db.add(new_rt)
        await db.commit()

        # Load role and permissions
        role_name, permissions = await rbac_service.get_user_tenant_role_and_permissions(db, user.id, tenant_id)
        tenant_slug = None
        if tenant_id:
            t = await db.get(Tenant, tenant_id)
            tenant_slug = t.slug if t else None

        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "tenant_id": str(tenant_id) if tenant_id else None,
            "tenant_slug": tenant_slug,
            "role": role_name,
            "permissions": permissions,
            "is_platform_admin": user.is_platform_admin
        }
        access_token = create_access_token(token_payload)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            refresh_token=new_raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            tenant_id=tenant_id,
            tenant_slug=tenant_slug,
            role=role_name,
            permissions=permissions
        )

    @staticmethod
    async def logout(db: AsyncSession, raw_refresh_token: str) -> bool:
        """Revoke active refresh token session."""
        h = hash_token(raw_refresh_token)
        res = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == h))
        rt = res.scalar_one_or_none()
        if rt and rt.revoked_at is None:
            rt.revoked_at = datetime.now(timezone.utc)
            await db.commit()
            return True
        return False

    @staticmethod
    async def request_password_reset(db: AsyncSession, email: str) -> bool:
        """Generate and dispatch password reset token."""
        user_res = await db.execute(select(User).where(User.email == email.lower().strip()))
        user = user_res.scalar_one_or_none()
        if not user:
            # Prevent email enumeration: return True silently
            return True

        raw_token, token_hash = create_random_token()
        prt = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)
        )
        db.add(prt)
        await db.commit()

        await email_service.send_password_reset_email(user.email, raw_token)
        return True

    @staticmethod
    async def confirm_password_reset(db: AsyncSession, raw_token: str, new_password: str) -> bool:
        """Reset password using verified reset token."""
        valid_pwd, pwd_err = validate_password_strength(new_password)
        if not valid_pwd:
            raise ValidationException(pwd_err)

        h = hash_token(raw_token)
        res = await db.execute(
            select(PasswordResetToken)
            .where(PasswordResetToken.token_hash == h)
            .options(selectinload(PasswordResetToken.user))
        )
        prt = res.scalar_one_or_none()

        if not prt or not prt.is_valid:
            raise ValidationException("Invalid or expired password reset token.")

        # Update password
        user = await db.get(User, prt.user_id)
        user.password_hash = get_password_hash(new_password)
        prt.used_at = datetime.now(timezone.utc)

        # Activate any invited memberships for this user
        inv_res = await db.execute(
            select(TenantMembership).where(
                TenantMembership.user_id == user.id,
                TenantMembership.status == "Invited"
            )
        )
        for m in inv_res.scalars().all():
            m.status = "Active"

        # Invalidate all active refresh tokens for security
        tokens_res = await db.execute(select(RefreshToken).where(RefreshToken.user_id == user.id))
        for t in tokens_res.scalars().all():
            t.revoked_at = datetime.now(timezone.utc)

        await db.commit()
        await audit_service.log_event(
            db, action="auth.password_reset", resource_type="user",
            actor_id=user.id, actor_name=user.full_name, resource_id=str(user.id)
        )
        return True

    @staticmethod
    async def verify_email(db: AsyncSession, raw_token: str) -> bool:
        """Verify email address using secure verification token."""
        h = hash_token(raw_token)
        res = await db.execute(
            select(EmailVerificationToken)
            .where(EmailVerificationToken.token_hash == h)
            .options(selectinload(EmailVerificationToken.user))
        )
        evt = res.scalar_one_or_none()

        if not evt or not evt.is_valid:
            raise ValidationException("Invalid or expired email verification token.")

        # Mark token as verified
        evt.verified_at = datetime.now(timezone.utc)

        # Update user status
        user = await db.get(User, evt.user_id)
        if user:
            user.is_verified = True

        await db.commit()
        await audit_service.log_event(
            db, action="auth.email_verified", resource_type="user",
            actor_id=user.id if user else None, actor_name=user.full_name if user else "User",
            resource_id=str(user.id) if user else None
        )
        return True

    @staticmethod
    async def get_current_user_profile(
        db: AsyncSession, user_id: uuid.UUID, active_tenant_id: Optional[uuid.UUID]
    ) -> CurrentUserResponse:
        """Fetch user profile and all tenant memberships."""
        user = await db.get(User, user_id)
        if not user:
            raise NotFoundException("User not found.")

        # Fetch memberships
        m_res = await db.execute(
            select(TenantMembership)
            .where(TenantMembership.user_id == user_id, TenantMembership.status.in_(["Active", "Invited"]))
            .options(selectinload(TenantMembership.tenant))
        )
        memberships = m_res.scalars().all()

        membership_summaries: List[TenantMembershipSummary] = []
        active_summary: Optional[TenantMembershipSummary] = None

        for m in memberships:
            role_name, perms = await rbac_service.get_user_tenant_role_and_permissions(db, user.id, m.tenant_id)
            summary = TenantMembershipSummary(
                tenant_id=m.tenant.id,
                tenant_name=m.tenant.name,
                tenant_slug=m.tenant.slug,
                role=role_name or "Member",
                permissions=perms,
                status=m.status
            )
            membership_summaries.append(summary)
            if active_tenant_id and m.tenant_id == active_tenant_id:
                active_summary = summary

        # If user has no active tenant selected, default to first membership
        if not active_summary and membership_summaries:
            active_summary = membership_summaries[0]

        return CurrentUserResponse(
            user=UserSummary(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                full_name=user.full_name,
                job_title=user.job_title,
                is_platform_admin=user.is_platform_admin,
                is_verified=user.is_verified,
                avatar_url=user.avatar_url
            ),
            active_tenant=active_summary,
            memberships=membership_summaries
        )

auth_service = AuthService()
