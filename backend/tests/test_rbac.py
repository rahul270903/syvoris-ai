import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_rbac_permissions_and_boundaries(client: AsyncClient):
    # 1. Register organization with Owner
    owner_reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Delta Technologies",
        "tenant_slug": "delta-tech",
        "first_name": "Daniel",
        "last_name": "Torres",
        "email": "daniel@delta.example",
        "password": "Password123!"
    })
    assert owner_reg.status_code == 201
    owner_data = owner_reg.json()
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}

    # 2. Owner invites a Sales Representative
    invite_resp = await client.post("/api/v1/admin/users/invite", json={
        "email": "rep@delta.example",
        "first_name": "Rachel",
        "last_name": "Adams",
        "role_name": "Sales Representative",
        "job_title": "Account Executive"
    }, headers=owner_headers)
    assert invite_resp.status_code == 201

    # Login as Sales Representative
    # (Since invited user's temp password is in dev_emails, let's update password directly or login via password reset)
    # Alternatively, register a user and invite them, or use a known password:
    # Let's request password reset for rep to set a known password
    reset_req = await client.post("/api/v1/auth/password-reset/request", json={"email": "rep@delta.example"})
    assert reset_req.status_code == 200

    # Read the reset token from test_emails.log
    import re
    with open("storage/test_emails.log", "r", encoding="utf-8") as f:
        log_content = f.read()
    tokens = re.findall(r"Reset Token:\s*([A-Za-z0-9_-]+)", log_content)
    latest_reset_token = tokens[-1]

    # Confirm password reset
    confirm_resp = await client.post("/api/v1/auth/password-reset/confirm", json={
        "token": latest_reset_token,
        "new_password": "RepPassword123!"
    })
    assert confirm_resp.status_code == 200

    # 3. Login as Sales Representative
    rep_login = await client.post("/api/v1/auth/login", json={
        "email": "rep@delta.example",
        "password": "RepPassword123!",
        "tenant_slug": "delta-tech"
    })
    assert rep_login.status_code == 200
    rep_token = rep_login.json()["access_token"]
    rep_headers = {"Authorization": f"Bearer {rep_token}"}

    # 4. Sales Rep can view tenant profile (has tenant:read)
    profile_resp = await client.get("/api/v1/tenant/profile", headers=rep_headers)
    assert profile_resp.status_code == 200
    assert profile_resp.json()["name"] == "Delta Technologies"

    # 5. RBAC ENFORCEMENT: Sales Rep CANNOT invite users (lacks users:invite) -> HTTP 403
    unauth_invite = await client.post("/api/v1/admin/users/invite", json={
        "email": "intruder@delta.example",
        "first_name": "Eve",
        "last_name": "Hacker",
        "role_name": "Tenant Owner"
    }, headers=rep_headers)
    assert unauth_invite.status_code == 403
    assert "users:invite" in unauth_invite.json()["detail"]

    # 6. RBAC ENFORCEMENT: Sales Rep CANNOT update organization settings (lacks tenant:update) -> HTTP 403
    unauth_settings = await client.put("/api/v1/tenant/settings", json={
        "currency": "EUR"
    }, headers=rep_headers)
    assert unauth_settings.status_code == 403
    assert "tenant:update" in unauth_settings.json()["detail"]

    # 7. Owner creates custom role "Compliance Officer"
    custom_role_resp = await client.post("/api/v1/admin/roles/", json={
        "name": "Compliance Officer",
        "description": "Reviews security and tenant audit logs",
        "permissions": ["audit:read", "tenant:read"]
    }, headers=owner_headers)
    assert custom_role_resp.status_code == 201
    custom_role = custom_role_resp.json()
    assert custom_role["name"] == "Compliance Officer"
    assert "audit:read" in custom_role["permissions"]

    # 8. PLATFORM BOUNDARY: Ordinary Tenant Owner CANNOT access Platform Admin endpoints -> HTTP 403
    platform_admin_leak = await client.get("/api/v1/tenant/all", headers=owner_headers)
    assert platform_admin_leak.status_code == 403
    assert "Platform Administrator privileges" in platform_admin_leak.json()["detail"]
