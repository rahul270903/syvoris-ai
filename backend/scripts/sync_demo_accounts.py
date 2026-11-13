import sys
import os
import uuid
import shutil
from datetime import datetime, timezone, timedelta

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from app.models.user import User, TenantMembership
from app.models.tenant import Tenant
from app.models.rbac import Role, UserRole
from app.core.security import get_password_hash

ROOT_DB = os.path.abspath(os.path.join(backend_dir, "..", "syvoris_dev.db"))

async def sync():
    print(f"Syncing demo accounts on {ROOT_DB}...")
    engine = create_async_engine(f"sqlite+aiosqlite:///{ROOT_DB.replace(os.sep, '/')}")
    async_session = async_sessionmaker(engine, class_=AsyncSession)

    async with async_session() as db:
        # 1. Find BluePeak Innovations tenant
        t_res = await db.execute(select(Tenant).where(Tenant.slug == "bluepeak-innovations"))
        tenant = t_res.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(
                name="BluePeak Innovations",
                slug="bluepeak-innovations",
                status="Active"
            )
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)
        tenant_id = tenant.id

        # Find Tenant Owner role for this tenant
        r_res = await db.execute(
            select(Role).where(Role.tenant_id == tenant_id, Role.name == "Tenant Owner")
        )
        owner_role = r_res.scalar_one_or_none()
        if not owner_role:
            r_res2 = await db.execute(select(Role).where(Role.name == "Tenant Owner"))
            owner_role = r_res2.scalars().first()
        owner_role_id = owner_role.id if owner_role else None

        # 2. Update Arjun Mehta
        arjun_res = await db.execute(select(User).where(User.email == "arjun.mehta@example.com"))
        arjun = arjun_res.scalar_one_or_none()
        if arjun:
            arjun.password_hash = get_password_hash("Password123!")
            arjun.is_verified = True
            arjun_id = arjun.id
            print(f"Updated Arjun Mehta ({arjun_id}) password to 'Password123!'")
        else:
            arjun = User(
                email="arjun.mehta@example.com",
                password_hash=get_password_hash("Password123!"),
                first_name="Arjun",
                last_name="Mehta",
                is_verified=True
            )
            db.add(arjun)
            await db.flush()
            arjun_id = arjun.id
            print(f"Created Arjun Mehta ({arjun_id})")

        # Ensure membership for Arjun
        m_res = await db.execute(
            select(TenantMembership).where(
                TenantMembership.tenant_id == tenant_id,
                TenantMembership.user_id == arjun_id
            )
        )
        if not m_res.scalar_one_or_none():
            db.add(TenantMembership(tenant_id=tenant_id, user_id=arjun_id, status="Active"))

        # Ensure UserRole for Arjun
        if owner_role_id:
            ur_res = await db.execute(
                select(UserRole).where(
                    UserRole.user_id == arjun_id,
                    UserRole.tenant_id == tenant_id
                )
            )
            if not ur_res.scalar_one_or_none():
                db.add(UserRole(user_id=arjun_id, role_id=owner_role_id, tenant_id=tenant_id))

        # 3. Ensure demo@syvoris.example exists with SYVORIS-DEMO
        demo_res = await db.execute(select(User).where(User.email == "demo@syvoris.example"))
        demo_user = demo_res.scalar_one_or_none()
        if demo_user:
            demo_user.password_hash = get_password_hash("SYVORIS-DEMO")
            demo_user.is_verified = True
            demo_id = demo_user.id
            print(f"Updated demo@syvoris.example password to 'SYVORIS-DEMO'")
        else:
            demo_user = User(
                email="demo@syvoris.example",
                password_hash=get_password_hash("SYVORIS-DEMO"),
                first_name="Demo",
                last_name="Operator",
                is_verified=True
            )
            db.add(demo_user)
            await db.flush()
            demo_id = demo_user.id
            print(f"Created demo@syvoris.example ({demo_id})")

        # Membership for demo_user
        m_demo = await db.execute(
            select(TenantMembership).where(
                TenantMembership.tenant_id == tenant_id,
                TenantMembership.user_id == demo_id
            )
        )
        if not m_demo.scalar_one_or_none():
            db.add(TenantMembership(tenant_id=tenant_id, user_id=demo_id, status="Active"))

        if owner_role_id:
            ur_demo = await db.execute(
                select(UserRole).where(
                    UserRole.user_id == demo_id,
                    UserRole.tenant_id == tenant_id
                )
            )
            if not ur_demo.scalar_one_or_none():
                db.add(UserRole(user_id=demo_id, role_id=owner_role_id, tenant_id=tenant_id))

        await db.commit()
        print("Demo accounts and permissions successfully synchronized!")

    await engine.dispose()

    # Also copy to backend/syvoris_dev.db so both locations are identical
    backend_db = os.path.join(backend_dir, "syvoris_dev.db")
    shutil.copy2(ROOT_DB, backend_db)
    print(f"Synchronized database copy to {backend_db}")

if __name__ == "__main__":
    asyncio.run(sync())
