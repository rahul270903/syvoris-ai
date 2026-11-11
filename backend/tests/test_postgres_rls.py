import uuid
import pytest
import pytest_asyncio
from datetime import datetime, timezone
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.exc import DBAPIError

POSTGRES_TEST_URL = "postgresql+asyncpg://syvoris_app@127.0.0.1:5433/syvoris_test_rls"

@pytest_asyncio.fixture
async def pg_engine():
    engine = create_async_engine(POSTGRES_TEST_URL, pool_size=5, max_overflow=0)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture
async def pg_session_factory(pg_engine):
    return async_sessionmaker(bind=pg_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)

@pytest.mark.asyncio
async def test_native_postgresql_rls_isolation_and_policies(pg_session_factory):
    """
    PROPRIETARY POSTGRESQL KERNEL ROW-LEVEL SECURITY TEST:
    Verifies that PostgreSQL 18.1 engine enforces RLS policies directly
    at the SQL database engine level, rejecting cross-tenant read/write attempts.
    """
    tenant_alpha_id = uuid.uuid4()
    tenant_beta_id = uuid.uuid4()
    user_alpha_id = uuid.uuid4()
    user_beta_id = uuid.uuid4()
    user_shared_id = uuid.uuid4()

    unique_suffix = uuid.uuid4().hex[:6]
    slug_alpha = f"alpha-{unique_suffix}"
    slug_beta = f"beta-{unique_suffix}"
    email_alpha = f"alpha-{unique_suffix}@rls.example"
    email_beta = f"beta-{unique_suffix}@rls.example"
    email_shared = f"shared-{unique_suffix}@rls.example"

    async with pg_session_factory() as session:
        # Create non-RLS parent entities (Tenants and Users)
        await session.execute(text("""
            INSERT INTO tenants (id, slug, name, plan_tier, status, settings, created_at, updated_at)
            VALUES 
                (:t_alpha, :s_alpha, 'Alpha Org', 'enterprise', 'Active', '{}', NOW(), NOW()),
                (:t_beta, :s_beta, 'Beta Org', 'enterprise', 'Active', '{}', NOW(), NOW())
        """), {"t_alpha": tenant_alpha_id, "t_beta": tenant_beta_id, "s_alpha": slug_alpha, "s_beta": slug_beta})

        await session.execute(text("""
            INSERT INTO users (id, email, password_hash, first_name, last_name, preferences, is_platform_admin, is_verified, created_at, updated_at)
            VALUES
                (:u_alpha, :e_alpha, 'hash1', 'Alpha', 'User', '{}', FALSE, TRUE, NOW(), NOW()),
                (:u_beta, :e_beta, 'hash2', 'Beta', 'User', '{}', FALSE, TRUE, NOW(), NOW()),
                (:u_shared, :e_shared, 'hash3', 'Shared', 'User', '{}', FALSE, TRUE, NOW(), NOW())
        """), {
            "u_alpha": user_alpha_id, "u_beta": user_beta_id, "u_shared": user_shared_id,
            "e_alpha": email_alpha, "e_beta": email_beta, "e_shared": email_shared
        })
        await session.commit()

    # 1. Insert memberships under specific tenant contexts
    async with pg_session_factory() as session:
        async with session.begin():
            # Set context to Alpha
            await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(tenant_alpha_id)})
            await session.execute(text("""
                INSERT INTO tenant_memberships (id, tenant_id, user_id, status, joined_at, created_at, updated_at)
                VALUES 
                    (:m1, :t_alpha, :u_alpha, 'Active', NOW(), NOW(), NOW()),
                    (:m2, :t_alpha, :u_shared, 'Active', NOW(), NOW(), NOW())
            """), {"m1": uuid.uuid4(), "m2": uuid.uuid4(), "t_alpha": tenant_alpha_id, "u_alpha": user_alpha_id, "u_shared": user_shared_id})

    async with pg_session_factory() as session:
        async with session.begin():
            # Set context to Beta
            await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(tenant_beta_id)})
            await session.execute(text("""
                INSERT INTO tenant_memberships (id, tenant_id, user_id, status, joined_at, created_at, updated_at)
                VALUES 
                    (:m3, :t_beta, :u_beta, 'Active', NOW(), NOW(), NOW()),
                    (:m4, :t_beta, :u_shared, 'Active', NOW(), NOW(), NOW())
            """), {"m3": uuid.uuid4(), "m4": uuid.uuid4(), "t_beta": tenant_beta_id, "u_beta": user_beta_id, "u_shared": user_shared_id})

    # 2. VERIFY READ ISOLATION UNDER TENANT ALPHA CONTEXT
    async with pg_session_factory() as session:
        async with session.begin():
            await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(tenant_alpha_id)})
            # Query all memberships without WHERE clause
            res = await session.execute(text("SELECT tenant_id, user_id FROM tenant_memberships;"))
            rows = res.fetchall()
            # Kernel RLS must return strictly Tenant Alpha records
            assert len(rows) == 2
            assert all(r[0] == tenant_alpha_id for r in rows)
            assert any(r[1] == user_alpha_id for r in rows)
            assert any(r[1] == user_shared_id for r in rows)
            assert not any(r[1] == user_beta_id for r in rows)

    # 3. VERIFY READ ISOLATION UNDER TENANT BETA CONTEXT
    async with pg_session_factory() as session:
        async with session.begin():
            await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(tenant_beta_id)})
            res = await session.execute(text("SELECT tenant_id, user_id FROM tenant_memberships;"))
            rows = res.fetchall()
            assert len(rows) == 2
            assert all(r[0] == tenant_beta_id for r in rows)
            assert any(r[1] == user_beta_id for r in rows)
            assert any(r[1] == user_shared_id for r in rows)
            assert not any(r[1] == user_alpha_id for r in rows)

    # 4. VERIFY MISSING TENANT CONTEXT FAILS-CLOSED (0 ROWS)
    async with pg_session_factory() as session:
        async with session.begin():
            # Do NOT set app.current_tenant_id
            res = await session.execute(text("SELECT * FROM tenant_memberships;"))
            rows = res.fetchall()
            assert len(rows) == 0, "Security failure: rows returned when tenant context was unconfigured!"

    # 5. VERIFY WRITE ISOLATION: TENANT ALPHA CANNOT INSERT INTO TENANT BETA
    async with pg_session_factory() as session:
        async with session.begin():
            await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(tenant_alpha_id)})
            with pytest.raises(DBAPIError) as exc_info:
                await session.execute(text("""
                    INSERT INTO tenant_memberships (id, tenant_id, user_id, status, joined_at, created_at, updated_at)
                    VALUES (:m_malicious, :t_beta, :u_alpha, 'Active', NOW(), NOW(), NOW())
                """), {"m_malicious": uuid.uuid4(), "t_beta": tenant_beta_id, "u_alpha": user_alpha_id})
            assert "violates row-level security policy" in str(exc_info.value).lower()

@pytest.mark.asyncio
async def test_postgresql_connection_pooling_leak_prevention(pg_session_factory, pg_engine):
    """
    VERIFY CONNECTION REUSE DOES NOT LEAK TENANT CONTEXT ACROSS POOLED SESSIONS:
    With pool_size=1, force the exact same connection to be reused in two back-to-back transactions.
    """
    single_engine = create_async_engine(POSTGRES_TEST_URL, pool_size=1, max_overflow=0)
    single_session_factory = async_sessionmaker(bind=single_engine, class_=AsyncSession, expire_on_commit=False)

    tenant_secret_id = uuid.uuid4()

    try:
        # Transaction 1: Sets context to secret tenant
        async with single_session_factory() as s1:
            async with s1.begin():
                await s1.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(tenant_secret_id)})
                check1 = await s1.execute(text("SELECT current_setting('app.current_tenant_id', true);"))
                val1 = check1.scalar()
                assert val1 == str(tenant_secret_id)
            # Transaction 1 committed and closed

        # Transaction 2: Reuses the same pooled physical connection
        async with single_session_factory() as s2:
            async with s2.begin():
                check2 = await s2.execute(text("SELECT current_setting('app.current_tenant_id', true);"))
                val2 = check2.scalar()
                # Must be reset (empty/None) because is_local=true was passed to set_config
                assert val2 in ("", None), f"LEAK DETECTED: Pooled connection retained tenant context: {val2}"
    finally:
        await single_engine.dispose()

@pytest.mark.asyncio
async def test_database_level_audit_immutability(pg_session_factory):
    """
    VERIFY DATABASE-LEVEL AUDIT RECORD IMMUTABILITY:
    The PostgreSQL trigger 'enforce_audit_events_immutable' must reject
    any UPDATE or DELETE on 'audit_events' even via raw SQL.
    """
    audit_id = uuid.uuid4()
    tenant_id = uuid.uuid4()

    # 1. Create tenant and audit record under tenant context
    async with pg_session_factory() as session:
        await session.execute(text("""
            INSERT INTO tenants (id, slug, name, plan_tier, status, settings, created_at, updated_at)
            VALUES (:t_id, :slug, 'Audit Tenant', 'enterprise', 'Active', '{}', NOW(), NOW())
        """), {"t_id": tenant_id, "slug": f"audit-{uuid.uuid4().hex[:6]}"})

        await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(tenant_id)})
        await session.execute(text("""
            INSERT INTO audit_events (id, tenant_id, actor_name, action, resource_type, metadata, created_at, updated_at)
            VALUES (:id, :tid, 'Security Auditor', 'auth.login', 'auth', '{}', NOW(), NOW())
        """), {"id": audit_id, "tid": tenant_id})
        await session.commit()

    # 2. Attempt raw database UPDATE on audit_events -> Must fail via trigger
    async with pg_session_factory() as session:
        await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(tenant_id)})
        with pytest.raises(DBAPIError) as update_err:
            await session.execute(text("""
                UPDATE audit_events SET actor_name = 'Malicious Actor' WHERE id = :id
            """), {"id": audit_id})
        assert "audit records are append-only" in str(update_err.value).lower()

    # 3. Attempt raw database DELETE on audit_events -> Must fail via trigger
    async with pg_session_factory() as session:
        await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(tenant_id)})
        with pytest.raises(DBAPIError) as delete_err:
            await session.execute(text("""
                DELETE FROM audit_events WHERE id = :id
            """), {"id": audit_id})
        assert "audit records are append-only" in str(delete_err.value).lower()

@pytest.mark.asyncio
async def test_native_postgresql_accounts_and_contacts_rls(pg_session_factory):
    """
    VERIFY POSTGRESQL 18.1 NATIVE RLS ON ACCOUNTS AND CONTACTS:
    Executed directly under non-superuser application role 'syvoris_app'.
    Verifies that:
    1. Read under Tenant Alpha returns only Alpha accounts and contacts.
    2. Read without tenant context fails closed (0 rows).
    3. Write attempt with mismatched tenant_id is rejected by PostgreSQL kernel RLS.
    """
    t_alpha = uuid.uuid4()
    t_beta = uuid.uuid4()
    acc_alpha = uuid.uuid4()
    con_alpha = uuid.uuid4()
    acc_beta = uuid.uuid4()

    suffix = uuid.uuid4().hex[:6]

    # Create tenants
    async with pg_session_factory() as session:
        await session.execute(text("""
            INSERT INTO tenants (id, slug, name, plan_tier, status, settings, created_at, updated_at)
            VALUES 
                (:ta, :sa, 'Alpha Corp', 'enterprise', 'Active', '{}', NOW(), NOW()),
                (:tb, :sb, 'Beta Corp', 'enterprise', 'Active', '{}', NOW(), NOW())
        """), {"ta": t_alpha, "tb": t_beta, "sa": f"alpha-{suffix}", "sb": f"beta-{suffix}"})
        await session.commit()

    # 1. Insert Account & Contact under Tenant Alpha context
    async with pg_session_factory() as session:
        async with session.begin():
            await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(t_alpha)})
            await session.execute(text("""
                INSERT INTO accounts (id, tenant_id, ref, name, account_type, billing_address, shipping_address, ownership, status, credit_limit, custom_fields, created_at, updated_at)
                VALUES (:id, :tid, 'ACC-ALPHA', 'Alpha Accounts Ltd', 'Customer', '{}', '{}', 'Private', 'Active', 10000.00, '{}', NOW(), NOW())
            """), {"id": acc_alpha, "tid": t_alpha})
            await session.execute(text("""
                INSERT INTO contacts (id, tenant_id, account_id, ref, first_name, last_name, email, status, is_primary, is_decision_maker, custom_fields, created_at, updated_at)
                VALUES (:id, :tid, :aid, 'CON-ALPHA', 'Alice', 'Smith', :email, 'Active', true, true, '{}', NOW(), NOW())
            """), {"id": con_alpha, "tid": t_alpha, "aid": acc_alpha, "email": f"alice-{suffix}@alpha.example"})

    # 2. Insert Account under Tenant Beta context
    async with pg_session_factory() as session:
        async with session.begin():
            await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(t_beta)})
            await session.execute(text("""
                INSERT INTO accounts (id, tenant_id, ref, name, account_type, billing_address, shipping_address, ownership, status, credit_limit, custom_fields, created_at, updated_at)
                VALUES (:id, :tid, 'ACC-BETA', 'Beta Holdings Inc', 'Customer', '{}', '{}', 'Private', 'Active', 50000.00, '{}', NOW(), NOW())
            """), {"id": acc_beta, "tid": t_beta})

    # 3. Read under Tenant Alpha context -> MUST only return Alpha account and contact
    async with pg_session_factory() as session:
        async with session.begin():
            await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(t_alpha)})
            res_acc = await session.execute(text("SELECT id, name FROM accounts;"))
            acc_rows = res_acc.fetchall()
            assert len(acc_rows) == 1
            assert acc_rows[0][0] == acc_alpha

            res_con = await session.execute(text("SELECT id, first_name FROM contacts;"))
            con_rows = res_con.fetchall()
            assert len(con_rows) == 1
            assert con_rows[0][0] == con_alpha

    # 4. Read with unconfigured context -> MUST fail closed (0 rows)
    async with pg_session_factory() as session:
        async with session.begin():
            res_none = await session.execute(text("SELECT * FROM accounts;"))
            assert len(res_none.fetchall()) == 0

    # 5. Write attempt under Tenant Alpha targeting Tenant Beta -> MUST trigger RLS violation
    async with pg_session_factory() as session:
        async with session.begin():
            await session.execute(text("SELECT set_config('app.current_tenant_id', :tid, true)"), {"tid": str(t_alpha)})
            with pytest.raises(DBAPIError) as exc_info:
                await session.execute(text("""
                    INSERT INTO accounts (id, tenant_id, ref, name, account_type, billing_address, shipping_address, ownership, status, credit_limit, custom_fields, created_at, updated_at)
                    VALUES (:id, :tid, 'ACC-MALICIOUS', 'Malicious Write', 'Customer', '{}', '{}', 'Private', 'Active', 0.00, '{}', NOW(), NOW())
                """), {"id": uuid.uuid4(), "tid": t_beta})
            assert "violates row-level security policy" in str(exc_info.value).lower()

