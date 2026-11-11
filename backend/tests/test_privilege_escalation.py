import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_tenant_admin_cannot_escalate_to_platform_superadmin(client: AsyncClient):
    """
    SECURITY TEST:
    A Tenant Owner/Administrator must NOT be allowed to assign the global
    'SaaS Super Administrator' role or any platform-level role to a user.
    """
    # 1. Register a tenant
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Target Org",
        "tenant_slug": "target-org",
        "first_name": "Tenant",
        "last_name": "Admin",
        "email": "owner@target.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Invite a member
    inv = await client.post("/api/v1/admin/users/invite", json={
        "email": "member@target.example",
        "first_name": "Regular",
        "last_name": "Member",
        "role_name": "Sales Representative"
    }, headers=headers)
    assert inv.status_code == 201
    member_id = inv.json()["id"]

    # 3. Attempt to assign global platform role 'SaaS Super Administrator'
    escalation_resp = await client.put(f"/api/v1/admin/users/{member_id}/role", json={
        "role_name": "SaaS Super Administrator"
    }, headers=headers)
    assert escalation_resp.status_code == 403

    # 4. Attempt to invite a user directly with global platform role
    escalation_invite = await client.post("/api/v1/admin/users/invite", json={
        "email": "hacker@target.example",
        "first_name": "Hack",
        "last_name": "Er",
        "role_name": "SaaS Super Administrator"
    }, headers=headers)
    assert escalation_invite.status_code == 403
