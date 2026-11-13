import uuid
from typing import List, Dict, Tuple, Optional, Any
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.rbac import Role, Permission, UserRole, role_permissions

STANDARD_PERMISSIONS: List[Dict[str, str]] = [
    # Core User & Identity
    {"code": "users:read", "module": "users", "description": "View team members and profiles"},
    {"code": "users:invite", "module": "users", "description": "Invite new users to organization"},
    {"code": "users:manage", "module": "users", "description": "Activate, suspend or edit users"},
    {"code": "roles:read", "module": "roles", "description": "View roles and granted permissions"},
    {"code": "roles:manage", "module": "roles", "description": "Create, edit and assign custom roles"},
    {"code": "tenant:read", "module": "tenant", "description": "View organization profile and settings"},
    {"code": "tenant:update", "module": "tenant", "description": "Update organization profile and settings"},
    {"code": "audit:read", "module": "audit", "description": "View security audit trail"},

    # CRM Essentials & Customer 360
    {"code": "accounts:read", "module": "crm", "description": "View customer accounts"},
    {"code": "accounts:write", "module": "crm", "description": "Create and edit accounts"},
    {"code": "contacts:read", "module": "crm", "description": "View customer contacts"},
    {"code": "contacts:write", "module": "crm", "description": "Create and edit contacts"},
    {"code": "leads:read", "module": "crm", "description": "View leads"},
    {"code": "leads:write", "module": "crm", "description": "Create and edit leads"},
    {"code": "deals:read", "module": "crm", "description": "View sales opportunities"},
    {"code": "deals:write", "module": "crm", "description": "Create and edit opportunities"},
    {"code": "opportunities:read", "module": "crm", "description": "View sales opportunities"},
    {"code": "opportunities:write", "module": "crm", "description": "Create and edit opportunities"},

    # Sales & Revenue (CPQ, Products, Pricing, Orders, Billing)
    {"code": "quotes:read", "module": "cpq", "description": "View quotes"},
    {"code": "quotes:write", "module": "cpq", "description": "Create, edit and revise quotes"},
    {"code": "quotes:approve", "module": "cpq", "description": "Approve commercial quotes exceeding threshold"},
    {"code": "products:read", "module": "catalog", "description": "View product catalog and price entries"},
    {"code": "products:write", "module": "catalog", "description": "Create and edit catalog products"},
    {"code": "price_books:read", "module": "pricing", "description": "View commercial price books"},
    {"code": "price_books:write", "module": "pricing", "description": "Manage price books and price tier entries"},
    {"code": "orders:read", "module": "orders", "description": "View sales orders and fulfilment status"},
    {"code": "orders:write", "module": "orders", "description": "Manage sales orders and lifecycle transitions"},
    {"code": "sales_orders:read", "module": "orders", "description": "View sales orders and fulfilment status"},
    {"code": "sales_orders:write", "module": "orders", "description": "Manage sales orders and lifecycle transitions"},
    {"code": "invoices:read", "module": "billing", "description": "View customer invoices and payment balances"},
    {"code": "invoices:write", "module": "billing", "description": "Generate invoices and record customer payments"},
    {"code": "cpq:read", "module": "cpq", "description": "Access CPQ calculation models"},
    {"code": "cpq:calculate", "module": "cpq", "description": "Execute server-authoritative CPQ calculations"},
    {"code": "approvals:read", "module": "governance", "description": "View commercial and workflow approvals queue"},
    {"code": "approvals:write", "module": "governance", "description": "Decide approvals and sign off governance actions"},

    # Marketing & Customer Experience
    {"code": "marketing:read", "module": "marketing", "description": "View marketing analytics and campaigns"},
    {"code": "marketing:write", "module": "marketing", "description": "Configure marketing campaigns and audience channels"},
    {"code": "campaigns:read", "module": "marketing", "description": "View campaigns and attribution performance"},
    {"code": "campaigns:write", "module": "marketing", "description": "Create and launch marketing campaigns"},
    {"code": "segments:read", "module": "marketing", "description": "View audience segments"},
    {"code": "segments:write", "module": "marketing", "description": "Create and maintain audience segmentation rules"},
    {"code": "trackers:read", "module": "marketing", "description": "View website digital tracking and analytics"},
    {"code": "trackers:write", "module": "marketing", "description": "Configure tracking scripts and web triggers"},
    {"code": "loyalty:read", "module": "marketing", "description": "View customer loyalty tiers and rewards"},
    {"code": "loyalty:write", "module": "marketing", "description": "Manage loyalty programs and tier allocations"},
    {"code": "surveys:read", "module": "marketing", "description": "View customer surveys, NPS and CSAT feedback"},
    {"code": "surveys:write", "module": "marketing", "description": "Create and distribute customer surveys"},
    {"code": "engagement:read", "module": "marketing", "description": "View customer engagement interactions"},
    {"code": "engagement:write", "module": "marketing", "description": "Manage engagement cadences and campaigns"},

    # Customer Service & Help Desk (Customer Experience)
    {"code": "cases:read", "module": "service", "description": "View customer service cases"},
    {"code": "cases:write", "module": "service", "description": "Create, assign and resolve customer cases"},
    {"code": "service:read", "module": "service", "description": "View customer service dashboard and queues"},
    {"code": "service:write", "module": "service", "description": "Manage service operations and queues"},
    {"code": "interactions:read", "module": "service", "description": "View customer communications and interactions"},
    {"code": "interactions:write", "module": "service", "description": "Log customer calls, emails and messages"},
    {"code": "mailroom:read", "module": "service", "description": "View support mailroom incoming ingestion"},
    {"code": "mailroom:write", "module": "service", "description": "Manage email ingestion and routing rules"},
    {"code": "knowledge:read", "module": "service", "description": "View service knowledge base articles"},
    {"code": "knowledge:write", "module": "service", "description": "Publish and update knowledge base content"},
    {"code": "sla:read", "module": "service", "description": "View SLA definitions and compliance"},
    {"code": "sla:write", "module": "service", "description": "Configure SLA targets, pause windows and policies"},
    {"code": "portal:read", "module": "service", "description": "View customer self-service portal workspace"},
    {"code": "portal:write", "module": "service", "description": "Configure customer self-service portal access"},
    {"code": "feedback:read", "module": "service", "description": "View customer experience feedback and CSAT"},
    {"code": "feedback:write", "module": "service", "description": "Process and respond to customer feedback"},
    {"code": "appointments:read", "module": "service", "description": "View service appointments and booking schedule"},
    {"code": "appointments:write", "module": "service", "description": "Configure appointment availability and bookings"},

    # Project Management
    {"code": "projects:read", "module": "projects", "description": "View projects, overview, details and analytics"},
    {"code": "projects:write", "module": "projects", "description": "Create, update, and manage projects and status"},
    {"code": "projects:delete", "module": "projects", "description": "Archive and delete projects"},
    {"code": "tasks:read", "module": "projects", "description": "View project tasks and dependencies"},
    {"code": "tasks:write", "module": "projects", "description": "Create, assign, update, and resolve project tasks"},
    {"code": "milestones:read", "module": "projects", "description": "View project milestones and deliverables"},
    {"code": "milestones:write", "module": "projects", "description": "Manage project milestones, deliverables, and sign-offs"},
    {"code": "resources:read", "module": "projects", "description": "View resource allocation and capacity workload"},
    {"code": "resources:write", "module": "projects", "description": "Allocate resources, update capacity and hours"},
    {"code": "costs:read", "module": "projects", "description": "View project costs, financial baseline, and budget variance"},
    {"code": "costs:write", "module": "projects", "description": "Record, approve, and adjust project costs and expenses"},

    # Global SuperAdmin
    {"code": "platform:admin", "module": "platform", "description": "SaaS SuperAdmin global control"},
]

ALL_TENANT_PERMISSIONS: List[str] = [
    p["code"] for p in STANDARD_PERMISSIONS if p["code"] != "platform:admin"
]

ROLE_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "Tenant Owner": {
        "description": "Full administrative ownership over the tenant organization across CRM, Sales, Marketing and Service",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": ALL_TENANT_PERMISSIONS
    },
    "Organization Administrator": {
        "description": "Administrative control over users, roles, workspace configuration and operational modules",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": ALL_TENANT_PERMISSIONS
    },
    "Sales Manager": {
        "description": "Sales management: pipeline oversight, team quotas, discount approval, CPQ and billing oversight",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "users:read", "tenant:read", "audit:read",
            "accounts:read", "accounts:write",
            "contacts:read", "contacts:write",
            "leads:read", "leads:write",
            "deals:read", "deals:write",
            "opportunities:read", "opportunities:write",
            "quotes:read", "quotes:write", "quotes:approve",
            "products:read", "products:write",
            "price_books:read", "price_books:write",
            "orders:read", "orders:write",
            "sales_orders:read", "sales_orders:write",
            "invoices:read", "invoices:write",
            "cpq:read", "cpq:calculate",
            "approvals:read", "approvals:write",
            "campaigns:read", "segments:read", "marketing:read"
        ]
    },
    "Sales Representative": {
        "description": "Direct sales: lead management, deals, quoting, CPQ calculation and order drafting",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "tenant:read",
            "accounts:read", "accounts:write",
            "contacts:read", "contacts:write",
            "leads:read", "leads:write",
            "deals:read", "deals:write",
            "opportunities:read", "opportunities:write",
            "quotes:read", "quotes:write",
            "products:read",
            "price_books:read",
            "orders:read", "orders:write",
            "sales_orders:read", "sales_orders:write",
            "invoices:read",
            "cpq:read", "cpq:calculate",
            "approvals:read"
        ]
    },
    "Marketing Manager": {
        "description": "Marketing leadership: campaigns, segmentation, trackers, loyalty, surveys and engagement",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "users:read", "tenant:read", "audit:read",
            "accounts:read", "contacts:read",
            "leads:read", "leads:write",
            "marketing:read", "marketing:write",
            "campaigns:read", "campaigns:write",
            "segments:read", "segments:write",
            "trackers:read", "trackers:write",
            "surveys:read", "surveys:write",
            "loyalty:read", "loyalty:write",
            "engagement:read", "engagement:write"
        ]
    },
    "Marketing Specialist": {
        "description": "Campaign operations: audience execution, email drafting, trackers and survey monitoring",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "tenant:read",
            "accounts:read", "contacts:read", "leads:read",
            "marketing:read", "campaigns:read", "campaigns:write",
            "segments:read", "trackers:read", "surveys:read",
            "engagement:read"
        ]
    },
    "Customer Support Manager": {
        "description": "Customer service management: queue oversight, SLA policy, escalations and customer portal",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "users:read", "tenant:read", "audit:read",
            "accounts:read", "contacts:read",
            "cases:read", "cases:write",
            "service:read", "service:write",
            "interactions:read", "interactions:write",
            "mailroom:read", "mailroom:write",
            "knowledge:read", "knowledge:write",
            "sla:read", "sla:write",
            "portal:read", "portal:write",
            "feedback:read", "feedback:write",
            "appointments:read", "appointments:write"
        ]
    },
    "Customer Support Agent": {
        "description": "Frontline customer support: manage assigned cases, interactions and customer portal",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "tenant:read",
            "accounts:read", "contacts:read",
            "cases:read", "cases:write",
            "service:read",
            "interactions:read", "interactions:write",
            "knowledge:read",
            "portal:read",
            "feedback:read"
        ]
    },
    "Analyst": {
        "description": "Cross-module read-only analytics and reporting access across CRM, Sales, Marketing and CX",
        "is_system_role": True,
        "is_platform_role": False,
        "permissions": [
            "tenant:read", "accounts:read", "contacts:read", "leads:read", "deals:read", "opportunities:read",
            "quotes:read", "products:read", "price_books:read", "orders:read", "sales_orders:read", "invoices:read",
            "campaigns:read", "segments:read", "marketing:read", "trackers:read",
            "cases:read", "service:read", "interactions:read", "feedback:read",
            "projects:read", "tasks:read", "milestones:read", "resources:read", "costs:read"
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
        """Seed all standard permissions, global platform roles, and sync standard roles across all existing tenants."""
        # 1. Seed or update standard permissions
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
            else:
                perm = existing_perms[p_def["code"]]
                perm.module = p_def["module"]
                perm.description = p_def["description"]

        await db.flush()

        # 2. Seed or update platform superadmin role
        super_role_res = await db.execute(
            select(Role).where(Role.is_platform_role == True, Role.name == "SaaS Super Administrator")
            .options(selectinload(Role.permissions))
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
        else:
            super_role.permissions = list(existing_perms.values())

        await db.flush()

        # 3. Synchronize all system roles for all existing tenants
        await RBACService.sync_all_tenant_system_roles(db, existing_perms)

        await db.commit()

    @staticmethod
    async def sync_all_tenant_system_roles(db: AsyncSession, all_perms: Optional[Dict[str, Permission]] = None):
        """Synchronize permissions for system roles across all tenants in the system."""
        if not all_perms:
            perms_res = await db.execute(select(Permission))
            all_perms = {p.code: p for p in perms_res.scalars().all()}

        roles_res = await db.execute(
            select(Role)
            .where(Role.is_system_role == True, Role.is_platform_role == False)
            .options(selectinload(Role.permissions))
        )
        existing_roles = roles_res.scalars().all()

        for role in existing_roles:
            template = ROLE_TEMPLATES.get(role.name)
            if not template:
                continue

            target_perm_codes = set(template["permissions"])
            current_perm_codes = {p.code for p in role.permissions}
            missing_codes = target_perm_codes - current_perm_codes

            if missing_codes:
                for code in missing_codes:
                    if code in all_perms:
                        role.permissions.append(all_perms[code])

        await db.flush()

    @staticmethod
    async def ensure_tenant_roles(db: AsyncSession, tenant_id: uuid.UUID) -> Dict[str, Role]:
        """Seed or sync standard tenant roles for a newly provisioned or existing tenant."""
        perms_res = await db.execute(select(Permission))
        all_perms = {p.code: p for p in perms_res.scalars().all()}

        roles_res = await db.execute(
            select(Role)
            .where(Role.tenant_id == tenant_id)
            .options(selectinload(Role.permissions))
        )
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
                role = existing_roles[role_name]
                # Synchronize missing permissions into existing role
                target_codes = set(tpl["permissions"])
                current_codes = {p.code for p in role.permissions}
                missing = target_codes - current_codes
                for code in missing:
                    if code in all_perms:
                        role.permissions.append(all_perms[code])
                created_roles[role_name] = role

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

        # If primary role is a system role, synchronize missing template permissions
        if user_roles[0].role.is_system_role and primary_role in ROLE_TEMPLATES:
            tpl_perms = set(ROLE_TEMPLATES[primary_role]["permissions"])
            current_perms = {p.code for p in user_roles[0].role.permissions}
            missing = tpl_perms - current_perms
            if missing:
                perms_res = await db.execute(select(Permission).where(Permission.code.in_(missing)))
                for p in perms_res.scalars().all():
                    user_roles[0].role.permissions.append(p)
                await db.flush()

        permissions = set()
        for ur in user_roles:
            for p in ur.role.permissions:
                permissions.add(p.code)

        # For Tenant Owner and Organization Administrator, guarantee full template permissions
        if primary_role in ("Tenant Owner", "Organization Administrator"):
            permissions.update(ROLE_TEMPLATES[primary_role]["permissions"])

        return primary_role, sorted(list(permissions))

rbac_service = RBACService()
