#!/usr/bin/env python3
"""
SYVORIS Ai™ — Secure Staging Account Provisioning Script
Provisions a tenant-scoped, role-controlled staging account for manager review.

Usage:
    python provision_staging_account.py --email manager@example.com --generate-password
    python provision_staging_account.py --email manager@example.com --password "SecretPass2026!" --role "Tenant Owner"
    python provision_staging_account.py  (Interactive prompt)
"""

import sys
import os
import argparse
import getpass
import secrets
import string
import asyncio
from typing import Optional

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.core.config import settings, normalize_database_url
from app.core.security import get_password_hash, validate_password_strength
from app.models.tenant import Tenant, OrganizationSettings
from app.models.user import User, TenantMembership
from app.models.rbac import Role, UserRole
from app.models.audit import AuditEvent
from app.services.rbac_service import rbac_service


def generate_secure_password(length: int = 20) -> str:
    """Generates a high-entropy, policy-compliant temporary password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    while True:
        pwd = ''.join(secrets.choice(alphabet) for _ in range(length))
        valid, _ = validate_password_strength(pwd)
        if valid:
            return pwd


async def provision_account(
    tenant_name: str,
    tenant_slug: str,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    role_name: str,
    database_url: Optional[str] = None
) -> dict:
    target_url = normalize_database_url(database_url or settings.DATABASE_URL)
    connect_args = {}
    if "sqlite" in target_url:
        connect_args["check_same_thread"] = False

    engine = create_async_engine(target_url, echo=False, future=True, connect_args=connect_args)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        # 1. Ensure permissions and system platform roles exist
        await rbac_service.seed_permissions_and_platform_roles(session)

        # 2. Find or create Tenant
        tenant_slug_clean = tenant_slug.lower().strip()
        t_stmt = select(Tenant).where(Tenant.slug == tenant_slug_clean)
        res = await session.execute(t_stmt)
        tenant = res.scalar_one_or_none()

        if not tenant:
            tenant = Tenant(
                name=tenant_name.strip(),
                slug=tenant_slug_clean,
                plan_tier="Enterprise",
                status="Active",
                settings={}
            )
            session.add(tenant)
            await session.flush()

            org_settings = OrganizationSettings(
                tenant_id=tenant.id,
                currency="USD",
                timezone="America/New_York",
                date_format="YYYY-MM-DD",
                primary_color="#2563eb",
                support_email=email.strip().lower(),
                address={}
            )
            session.add(org_settings)
            await session.flush()

        # 3. Ensure standard roles exist for this tenant
        roles = await rbac_service.ensure_tenant_roles(session, tenant.id)
        if role_name not in roles:
            available = list(roles.keys())
            raise ValueError(f"Role '{role_name}' is not recognized. Available roles: {available}")
        target_role = roles[role_name]

        # 4. Find or create User
        email_clean = email.strip().lower()
        u_stmt = select(User).where(User.email == email_clean)
        u_res = await session.execute(u_stmt)
        user = u_res.scalar_one_or_none()

        pwd_hash = get_password_hash(password)
        is_new_user = False

        if not user:
            is_new_user = True
            user = User(
                email=email_clean,
                password_hash=pwd_hash,
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                is_platform_admin=False,
                is_verified=True,
                preferences={}
            )
            session.add(user)
            await session.flush()
        else:
            # Update password and ensure verified
            user.password_hash = pwd_hash
            user.is_verified = True
            user.first_name = first_name.strip()
            user.last_name = last_name.strip()
            await session.flush()

        # 5. Ensure TenantMembership
        m_stmt = select(TenantMembership).where(
            TenantMembership.tenant_id == tenant.id,
            TenantMembership.user_id == user.id
        )
        m_res = await session.execute(m_stmt)
        membership = m_res.scalar_one_or_none()
        if not membership:
            membership = TenantMembership(
                tenant_id=tenant.id,
                user_id=user.id,
                status="Active"
            )
            session.add(membership)
            await session.flush()
        else:
            membership.status = "Active"

        # 6. Ensure UserRole assignment
        ur_stmt = select(UserRole).where(
            UserRole.tenant_id == tenant.id,
            UserRole.user_id == user.id,
            UserRole.role_id == target_role.id
        )
        ur_res = await session.execute(ur_stmt)
        if not ur_res.scalar_one_or_none():
            session.add(UserRole(
                tenant_id=tenant.id,
                user_id=user.id,
                role_id=target_role.id
            ))

        # 7. Record Audit Event
        audit = AuditEvent(
            tenant_id=tenant.id,
            actor_id=user.id,
            actor_name=f"{first_name} {last_name}",
            action="provision_staging_account",
            resource_type="user",
            resource_id=str(user.id),
            metadata_json={
                "role": role_name,
                "tenant_slug": tenant_slug_clean,
                "is_new_user": is_new_user
            }
        )
        session.add(audit)

        await session.commit()

    await engine.dispose()

    return {
        "tenant_name": tenant_name,
        "tenant_slug": tenant_slug_clean,
        "email": email_clean,
        "role": role_name,
        "is_new_user": is_new_user
    }


def main():
    parser = argparse.ArgumentParser(description="Secure Staging Account Provisioner for SYVORIS Ai")
    parser.add_argument("--tenant-name", default=os.getenv("STAGING_TENANT_NAME", "BluePeak Innovations"), help="Organization name")
    parser.add_argument("--tenant-slug", default=os.getenv("STAGING_TENANT_SLUG", "bluepeak-innovations"), help="Organization URL slug")
    parser.add_argument("--email", default=os.getenv("STAGING_USER_EMAIL"), help="User email address")
    parser.add_argument("--password", default=os.getenv("STAGING_USER_PASSWORD"), help="User password (omit to prompt or generate)")
    parser.add_argument("--generate-password", action="store_true", help="Generate a cryptographically secure password")
    parser.add_argument("--first-name", default="Staging", help="User first name")
    parser.add_argument("--last-name", default="Reviewer", help="User last name")
    parser.add_argument("--role", default="Tenant Owner", help="Role name to assign")
    parser.add_argument("--database-url", default=None, help="Explicit target database URL")

    args = parser.parse_args()

    email = args.email
    if not email:
        email = input("Enter reviewer email address: ").strip()
        if not email:
            print("Error: Email address is required.", file=sys.stderr)
            sys.exit(1)

    password = args.password
    if args.generate_password:
        password = generate_secure_password(20)
    elif not password:
        password = getpass.getpass("Enter secure password (min 8 chars, 1 uppercase, 1 digit, 1 special): ")

    valid, err_msg = validate_password_strength(password)
    if not valid:
        print(f"Error: Password does not meet security criteria: {err_msg}", file=sys.stderr)
        sys.exit(1)

    print(f"\n[+] Provisioning staging account in target database...")
    print(f"    Tenant:   {args.tenant_name} ({args.tenant_slug})")
    print(f"    Email:    {email}")
    print(f"    Role:     {args.role}")

    try:
        result = asyncio.run(provision_account(
            tenant_name=args.tenant_name,
            tenant_slug=args.tenant_slug,
            email=email,
            password=password,
            first_name=args.first_name,
            last_name=args.last_name,
            role_name=args.role,
            database_url=args.database_url
        ))

        print("\n=================================================================")
        print("  STAGING ACCOUNT PROVISIONED SUCCESSFULLY")
        print("=================================================================")
        print(f"  Organization: {result['tenant_name']} ({result['tenant_slug']})")
        print(f"  Login Email:  {result['email']}")
        print(f"  Password:     {password}")
        print(f"  Role:         {result['role']}")
        print("=================================================================")
        print("  NOTICE: Provide these credentials securely to the reviewer.")
        print("  Do not commit or paste these credentials in public channels.\n")

    except Exception as e:
        print(f"\n[-] Provisioning failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
