import uuid
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, TenantMembership
from app.models.tenant import Tenant
from app.models.rbac import Role, UserRole
from app.schemas.user import UserInviteRequest, UserMemberResponse, UserUpdateRequest
from app.core.security import get_password_hash, create_random_token
from app.core.errors import ConflictException, NotFoundException, ValidationException, AuthorizationException
from app.services.rbac_service import rbac_service
from app.services.audit_service import audit_service
from app.services.email_adapter import email_service

class UserService:
    @staticmethod
    async def list_tenant_users(db: AsyncSession, tenant_id: uuid.UUID) -> List[UserMemberResponse]:
        query = (
            select(TenantMembership)
            .where(TenantMembership.tenant_id == tenant_id)
            .options(selectinload(TenantMembership.user))
            .order_by(TenantMembership.joined_at.desc())
        )
        res = await db.execute(query)
        memberships = res.scalars().all()

        results = []
        for m in memberships:
            role_name, perms = await rbac_service.get_user_tenant_role_and_permissions(db, m.user_id, tenant_id)
            results.append(
                UserMemberResponse(
                    id=m.user.id,
                    email=m.user.email,
                    first_name=m.user.first_name,
                    last_name=m.user.last_name,
                    full_name=m.user.full_name,
                    job_title=m.user.job_title,
                    role=role_name or "Member",
                    permissions=perms,
                    status=m.status,
                    joined_at=m.joined_at
                )
            )
        return results

    @staticmethod
    async def invite_user(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        req: UserInviteRequest,
        inviter_id: Optional[uuid.UUID] = None,
        inviter_name: str = "Admin"
    ) -> UserMemberResponse:
        email_clean = req.email.lower().strip()

        # Check tenant exists
        tenant = await db.get(Tenant, tenant_id)
        if not tenant:
            raise NotFoundException("Tenant not found.")

        # Check if user already exists
        user_res = await db.execute(select(User).where(User.email == email_clean))
        user = user_res.scalar_one_or_none()

        if not user:
            # Create user with temporary high-entropy password
            temp_pass, _ = create_random_token(16)
            user = User(
                email=email_clean,
                password_hash=get_password_hash(temp_pass),
                first_name=req.first_name.strip(),
                last_name=req.last_name.strip(),
                job_title=req.job_title,
                is_platform_admin=False,
                is_verified=False
            )
            db.add(user)
            await db.flush()

        # Check if already a member in this tenant
        mem_res = await db.execute(
            select(TenantMembership).where(
                TenantMembership.tenant_id == tenant_id,
                TenantMembership.user_id == user.id
            )
        )
        existing_mem = mem_res.scalar_one_or_none()
        if existing_mem:
            raise ConflictException(f"User '{email_clean}' is already a member of this organization.")

        # Check role exists in tenant (platform roles strictly prohibited)
        role_res = await db.execute(
            select(Role).where(
                Role.name == req.role_name.strip(),
                Role.is_platform_role == False,
                (Role.tenant_id == tenant_id) | (Role.tenant_id.is_(None))
            )
        )
        role = role_res.scalar_one_or_none()
        if not role:
            # Check if this was an attempt to assign a platform role
            platform_check = await db.execute(
                select(Role).where(Role.name == req.role_name.strip(), Role.is_platform_role == True)
            )
            if platform_check.scalar_one_or_none():
                raise AuthorizationException("Tenant administrators cannot invite users with platform administrator roles.")

            # Fallback or ensure tenant roles
            roles = await rbac_service.ensure_tenant_roles(db, tenant_id)
            role = roles.get(req.role_name.strip())
            if not role or role.is_platform_role:
                raise NotFoundException(f"Role '{req.role_name}' is not configured.")

        # Create TenantMembership
        membership = TenantMembership(
            tenant_id=tenant_id,
            user_id=user.id,
            status="Invited",
            invited_by=inviter_id
        )
        db.add(membership)
        await db.flush()

        # Assign Role
        user_role = UserRole(
            user_id=user.id,
            role_id=role.id,
            tenant_id=tenant_id,
            assigned_by=inviter_id
        )
        db.add(user_role)
        await db.commit()

        # Audit and dispatch invitation email
        raw_invite_token, _ = create_random_token()
        await audit_service.log_event(
            db, action="user.invited", resource_type="user",
            tenant_id=tenant_id, actor_id=inviter_id, actor_name=inviter_name,
            resource_id=str(user.id), metadata={"invited_email": email_clean, "role": role.name}
        )
        await email_service.send_user_invitation(user.email, tenant.name, inviter_name, raw_invite_token)

        _, perms = await rbac_service.get_user_tenant_role_and_permissions(db, user.id, tenant_id)

        return UserMemberResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name,
            job_title=user.job_title,
            role=role.name,
            permissions=perms,
            status=membership.status,
            joined_at=membership.joined_at
        )

    @staticmethod
    async def update_member_status(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        new_status: str,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "Admin"
    ) -> bool:
        res = await db.execute(
            select(TenantMembership).where(
                TenantMembership.tenant_id == tenant_id,
                TenantMembership.user_id == user_id
            )
        )
        m = res.scalar_one_or_none()
        if not m:
            raise NotFoundException("User membership not found.")

        m.status = new_status
        await db.commit()

        await audit_service.log_event(
            db, action=f"user.{new_status.lower()}", resource_type="user",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(user_id), metadata={"new_status": new_status}
        )
        return True

    @staticmethod
    async def assign_member_role(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        role_name: str,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "Admin"
    ) -> bool:
        # Check membership exists in tenant
        mem_res = await db.execute(
            select(TenantMembership).where(
                TenantMembership.tenant_id == tenant_id,
                TenantMembership.user_id == user_id
            )
        )
        membership = mem_res.scalar_one_or_none()
        if not membership:
            raise NotFoundException("User is not a member of this organization.")

        # Check role exists (platform roles strictly prohibited)
        role_res = await db.execute(
            select(Role).where(
                Role.name == role_name.strip(),
                Role.is_platform_role == False,
                (Role.tenant_id == tenant_id) | (Role.tenant_id.is_(None))
            )
        )
        role = role_res.scalar_one_or_none()
        if not role:
            # Check if this was an attempt to assign a platform role
            platform_check = await db.execute(
                select(Role).where(Role.name == role_name.strip(), Role.is_platform_role == True)
            )
            if platform_check.scalar_one_or_none():
                raise AuthorizationException("Tenant administrators cannot assign platform administrator roles.")
            raise NotFoundException(f"Role '{role_name}' does not exist.")

        # Update or create UserRole
        ur_res = await db.execute(
            select(UserRole).where(
                UserRole.user_id == user_id,
                UserRole.tenant_id == tenant_id
            )
        )
        ur = ur_res.scalar_one_or_none()
        if ur:
            ur.role_id = role.id
            ur.assigned_by = actor_id
        else:
            ur = UserRole(
                user_id=user_id,
                role_id=role.id,
                tenant_id=tenant_id,
                assigned_by=actor_id
            )
            db.add(ur)

        await db.commit()

        await audit_service.log_event(
            db, action="role.reassigned", resource_type="user_role",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(user_id), metadata={"new_role": role_name}
        )
        return True

user_service = UserService()
