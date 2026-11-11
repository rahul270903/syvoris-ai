import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_checks(client: AsyncClient):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

    ready_resp = await client.get("/api/v1/health/ready")
    assert ready_resp.status_code == 200
    assert ready_resp.json()["status"] == "ready"

@pytest.mark.asyncio
async def test_register_tenant_and_login_flow(client: AsyncClient):
    # 1. Register Tenant Alpha
    reg_payload = {
        "organization_name": "Alpha Telecom Ltd",
        "tenant_slug": "alpha-telecom",
        "first_name": "Marcus",
        "last_name": "Vance",
        "email": "marcus.vance@alpha.example",
        "password": "SecurePassword123!"
    }
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["tenant_slug"] == "alpha-telecom"
    assert data["role"] == "Tenant Owner"
    assert "users:manage" in data["permissions"]

    access_token = data["access_token"]
    refresh_token = data["refresh_token"]

    # 2. Duplicate registration rejected
    dup_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == 409

    # 3. Login with correct credentials
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "marcus.vance@alpha.example",
        "password": "SecurePassword123!"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["tenant_slug"] == "alpha-telecom"

    # 4. Login with invalid password rejected
    bad_login = await client.post("/api/v1/auth/login", json={
        "email": "marcus.vance@alpha.example",
        "password": "WrongPassword999!"
    })
    assert bad_login.status_code == 401

    # 5. Fetch /me profile
    headers = {"Authorization": f"Bearer {access_token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["user"]["email"] == "marcus.vance@alpha.example"
    assert me_data["active_tenant"]["tenant_slug"] == "alpha-telecom"
    assert len(me_data["memberships"]) >= 1

    # 6. Rotate refresh token
    rotate_resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert rotate_resp.status_code == 200
    new_tokens = rotate_resp.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    assert new_tokens["refresh_token"] != refresh_token

    # 7. Old refresh token cannot be reused (rotation security)
    stale_resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert stale_resp.status_code == 401

    # 8. Logout revokes active refresh token
    logout_resp = await client.post("/api/v1/auth/logout", json={"refresh_token": new_tokens["refresh_token"]})
    assert logout_resp.status_code == 200

    revoked_resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": new_tokens["refresh_token"]})
    assert revoked_resp.status_code == 401
