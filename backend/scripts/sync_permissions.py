import asyncio
import os
import sys

# Ensure backend directory is in path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.services.rbac_service import rbac_service
from app.models.tenant import Tenant
from app.models.user import User
from app.models.rbac import Role, Permission
from sqlalchemy import select

async def sync_db(db_path: str):
    print(f"\n--- Syncing DB: {db_path} ---")
    if not os.path.exists(db_path):
        print(f"File not found: {db_path}, skipping.")
        return

    url = f"sqlite+aiosqlite:///{os.path.abspath(db_path)}"
    engine = create_async_engine(url, connect_args={"check_same_thread": False})
    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_maker() as session:
        # 1. Run standard seed & sync
        await rbac_service.seed_permissions_and_platform_roles(session)
        print("Permissions and platform roles seeded successfully.")

        # 2. Verify all tenants
        tenants_res = await session.execute(select(Tenant))
        tenants = tenants_res.scalars().all()
        print(f"Found {len(tenants)} tenants:")
        for t in tenants:
            roles = await rbac_service.ensure_tenant_roles(session, t.id)
            owner_role = roles.get("Tenant Owner")
            owner_perm_count = len(owner_role.permissions) if owner_role else 0
            print(f"  - Tenant: {t.name} ({t.slug}) -> Tenant Owner has {owner_perm_count} permissions")

        await session.commit()

        # 3. Check Arjun Mehta permissions
        users_res = await session.execute(select(User).where(User.first_name == "Arjun", User.last_name == "Mehta"))
        arjun = users_res.scalar_one_or_none()
        if arjun:
            print(f"Checking user: {arjun.full_name} ({arjun.email})")
            for t in tenants:
                role_name, perms = await rbac_service.get_user_tenant_role_and_permissions(session, arjun.id, t.id)
                if role_name:
                    print(f"  - Role in {t.slug}: {role_name}")
                    print(f"  - Permissions count: {len(perms)}")
                    print(f"  - Has opportunities:read? {'opportunities:read' in perms}")
                    print(f"  - Has quotes:read? {'quotes:read' in perms}")
                    print(f"  - Has campaigns:read? {'campaigns:read' in perms}")
                    print(f"  - Has cases:read? {'cases:read' in perms}")

    await engine.dispose()

async def main():
    root_db = os.path.join(os.path.dirname(backend_dir), "syvoris_dev.db")
    backend_db = os.path.join(backend_dir, "syvoris_dev.db")
    await sync_db(root_db)
    await sync_db(backend_db)
    print("\nAll database permission synchronizations completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
