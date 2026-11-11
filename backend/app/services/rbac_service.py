import uuid
from typing import List, Dict, Tuple, Optional, Any
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.rbac import Role, Permission, UserRole, role_permissions

STANDARD_PERMISSIONS: List[Dict[str, str]] = [
    {"code": "users:read", "module": "users", "description": "View team members and profiles"},
    {"code": "users:invite", "module": "users", "description": "Invite new users to organization"},
    {"code": "users:manage", "module": "users", "description": "Activate, suspend or edit users"},
    {"code": "roles:read", "module": "roles", "description": "View roles and granted permissions"},
    {"code": "roles:manage", "module": "roles", "description": "Create, edit and assign custom roles"},
    {"code": "tenant:read", "module": "tenant", "description": "View organization profile and settings"},
    {"code": "tenant:update", "module": "tenant", "description": "Update organization profile and settings"},
    {"code": "audit:read", "module": "audit", "description": "View security audit trail"},
    # CRM foundational permissions (for subsequent phases)
    {"code": "accounts:read", "module": "crm", "description": "View customer accounts"},
    {"code": "accounts:write", "module": "crm", "description": "Create and edit accounts"},
    {"code": "contacts:read", "module": "crm", "description": "View customer contacts"},
    {"code": "contacts:write", "module": "crm", "description": "Create and edit contacts"},
    {"code": "leads:read", "module": "crm", "description": "View leads"},
    {"code": "leads:write", "module": "crm", "description": "Create and edit leads"},
    {"code": "deals:read", "module": "crm", "description": "View sales opportunities"},
    {"code": "deals:write", "module": "crm", "description": "Create and edit opportunities"},
    {"code": "quotes:read", "module": "cpq", "description": "View quotes"},
    {"code": "quotes:write", "module": "cpq", "description": "Create and edit quotes"},
    {"code": "quotes:approve", "module": "cpq", "description": "Approve commercial quotes exceeding threshold"},
    {"code": "cases:read", "module": "service", "description": "View customer service cases"},
    {"code": "cases:write", "module": "service", "description": "Create and edit cases"},
    {"code": "platform:admin", "module": "platform", "description": "SaaS SuperAdmin global control"},
]

ROLE_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "Tenant Owner": {
        "description": "Full administrative ownership over the tenant organization",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "users:read", "users:invite", "users:manage",
            "roles:read", "roles:manage",
            "tenant:read", "tenant:update",
            "audit:read",
            "accounts:read", "accounts:write",
            "contacts:read", "contacts:write",
            "leads:read", "leads:write",
            "deals:read", "deals:write",
            "quotes:read", "quotes:write", "quotes:approve",
            "cases:read", "cases:write"
        ]
    },
    "Organization Administrator": {
        "description": "Administrative control over users, roles and workspace configuration",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "users:read", "users:invite", "users:manage",
            "roles:read", "roles:manage",
            "tenant:read", "tenant:update",
            "audit:read",
            "accounts:read", "accounts:write",
            "contacts:read", "contacts:write",
            "leads:read", "leads:write",
            "deals:read", "deals:write",
            "quotes:read", "quotes:write",
            "cases:read", "cases:write"
        ]
    },
    "Sales Manager": {
        "description": "Sales management: pipeline oversight, team quotas, discount approval",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "users:read", "tenant:read",
            "accounts:read", "accounts:write",
            "contacts:read", "contacts:write",
            "leads:read", "leads:write",
            "deals:read", "deals:write",
            "quotes:read", "quotes:write", "quotes:approve"
        ]
    },
    "Sales Representative": {
        "description": "Direct sales: lead management, deals and quote drafting",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "tenant:read",
            "accounts:read", "accounts:write",
            "contacts:read", "contacts:write",
            "leads:read", "leads:write",
            "deals:read", "deals:write",
            "quotes:read", "quotes:write"
        ]
    },
    "Customer Support Manager": {
        "description": "Customer service management: queue oversight, SLA policy, escalations",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "users:read", "tenant:read",
            "accounts:read", "contacts:read",
            "cases:read", "cases:write"
        ]
    },
    "Customer Support Agent": {
        "description": "Frontline customer support: manage assigned cases and solutions",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "tenant:read",
            "accounts:read", "contacts:read",
            "cases:read", "cases:write"
        ]
    },
    "Analyst": {
        "description": "Read-only analytics and reporting access",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "tenant:read", "accounts:read", "contacts:read", "leads:read", "deals:read", "cases:read"
        ]
    },
    "SaaS Super Administrator": {
        "description": "Global SaaS Platform Super Administrator with unrestricted infrastructure rights",
        "is_system_role": True,
        "is_platform_role": True,
        "permissions": [p["code"] for p in STANDARD_PERMISSIONS]
    }
}

class RBACService:
    @staticmethod
    async def seed_permissions_and_platform_roles(db: AsyncSession):
        """Seed all standard permissions and global platform roles."""
        # 1. Seed permissions
        existing_perms_res = await db.execute(select(Permission))
        existing_perms = {p.code: p for p in existing_perms_res.scalars().all()}

        for p_def in STANDARD_PERMISSIONS:
            if p_def["code"] not in existing_perms:
                perm = Permission(
                    code=p_def["code"],
                    module=p_def["module"],
                    description=p_def["description"]
                )
                db.add(perm)
                existing_perms[p_def["code"]] = perm

        await db.flush()

        # 2. Seed platform superadmin role
        super_role_res = await db.execute(
            select(Role).where(Role.is_platform_role == True, Role.name == "SaaS Super Administrator")
        )
        super_role = super_role_res.scalar_one_or_none()
        if not super_role:
            super_role = Role(
                tenant_id=None,
                name="SaaS Super Administrator",
                description="Global platform super administrator",
                is_system_role=True,
                is_platform_role=True
            )
            super_role.permissions = list(existing_perms.values())
            db.add(super_role)

        await db.commit()

    @staticmethod
    async def ensure_tenant_roles(db: AsyncSession, tenant_id: uuid.UUID) -> Dict[str, Role]:
        """Seed standard tenant roles for a newly provisioned tenant."""
        perms_res = await db.execute(select(Permission))
        all_perms = {p.code: p for p in perms_res.scalars().all()}

        roles_res = await db.execute(select(Role).where(Role.tenant_id == tenant_id))
        existing_roles = {r.name: r for r in roles_res.scalars().all()}

        created_roles = {}
        for role_name, tpl in ROLE_TEMPLATES.items():
            if tpl["is_platform_role"]:
                continue
            if role_name not in existing_roles:
                role = Role(
                    tenant_id=tenant_id,
                    name=role_name,
                    description=tpl["description"],
                    is_system_role=tpl["is_system_role"],
                    is_platform_role=False
                )
                role.permissions = [all_perms[c] for c in tpl["permissions"] if c in all_perms]
                db.add(role)
                created_roles[role_name] = role
            else:
                created_roles[role_name] = existing_roles[role_name]

        await db.flush()
        return created_roles

    @staticmethod
    async def get_user_tenant_role_and_permissions(
        db: AsyncSession, user_id: uuid.UUID, tenant_id: Optional[uuid.UUID]
    ) -> Tuple[Optional[str], List[str]]:
        """Return the primary role name and distinct permission codes for a user in a tenant."""
        query = (
            select(UserRole)
            .where(UserRole.user_id == user_id)
            .options(selectinload(UserRole.role).selectinload(Role.permissions))
        )
        if tenant_id:
            query = query.where(UserRole.tenant_id == tenant_id)
        else:
            query = query.where(UserRole.tenant_id.is_(None))

        res = await db.execute(query)
        user_roles = res.scalars().all()
        if not user_roles:
            return None, []

        primary_role = user_roles[0].role.name
        permissions = set()
        for ur in user_roles:
            for p in ur.role.permissions:
                permissions.add(p.code)

        return primary_role, sorted(list(permissions))

rbac_service = RBACService()
