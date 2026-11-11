import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_tenant_switching_and_refresh_rotation(client: AsyncClient):
    # 1. Register Tenant One
    reg_one = await client.post("/api/v1/auth/register", json={
        "organization_name": "Apex Innovations",
        "tenant_slug": "apex-inno",
        "first_name": "Alex",
        "last_name": "Rivers",
        "email": "alex@apex.example",
        "password": "Password123!"
    })
    assert reg_one.status_code == 201
    apex_token = reg_one.json()["access_token"]
    apex_tenant_id = reg_one.json()["tenant_id"]
    apex_refresh = reg_one.json()["refresh_token"]

    # 2. Register Tenant Two with a different owner
    reg_two = await client.post("/api/v1/auth/register", json={
        "organization_name": "Beacon Dynamics",
        "tenant_slug": "beacon-dyn",
        "first_name": "Bianca",
        "last_name": "Vance",
        "email": "bianca@beacon.example",
        "password": "Password123!"
    })
    assert reg_two.status_code == 201
    beacon_headers = {"Authorization": f"Bearer {reg_two.json()['access_token']}"}
    beacon_tenant_id = reg_two.json()["tenant_id"]

    # 3. Beacon invites Alex into Beacon Dynamics as an Analyst
    invite_resp = await client.post("/api/v1/admin/users/invite", json={
        "email": "alex@apex.example",
        "first_name": "Alex",
        "last_name": "Rivers",
        "role_name": "Analyst",
        "job_title": "Senior Consultant"
    }, headers=beacon_headers)
    assert invite_resp.status_code == 201

    # 4. Alex checks his profile while in Apex
    alex_headers = {"Authorization": f"Bearer {apex_token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=alex_headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert len(me_data["memberships"]) == 2
    assert me_data["active_tenant"]["tenant_name"] == "Apex Innovations"
    assert me_data["active_tenant"]["role"] == "Tenant Owner"

    # 5. Alex switches active tenant context to Beacon Dynamics
    switch_resp = await client.post("/api/v1/auth/switch-tenant", json={
        "tenant_id": beacon_tenant_id
    }, headers=alex_headers)
    assert switch_resp.status_code == 200
    switched_data = switch_resp.json()
    assert switched_data["tenant_slug"] == "beacon-dyn"
    assert switched_data["role"] == "Analyst"

    # 6. With new token, Alex is in Beacon Dynamics context
    beacon_alex_token = switched_data["access_token"]
    beacon_alex_headers = {"Authorization": f"Bearer {beacon_alex_token}"}
    switched_me = await client.get("/api/v1/auth/me", headers=beacon_alex_headers)
    assert switched_me.status_code == 200
    assert switched_me.json()["active_tenant"]["tenant_name"] == "Beacon Dynamics"
    assert switched_me.json()["active_tenant"]["role"] == "Analyst"

    # 7. As Analyst in Beacon, Alex cannot invite users
    blocked_invite = await client.post("/api/v1/admin/users/invite", json={
        "email": "infiltrator@beacon.example",
        "first_name": "Inf",
        "last_name": "User",
        "role_name": "Tenant Admin"
    }, headers=beacon_alex_headers)
    assert blocked_invite.status_code == 403

    # 8. Refresh token rotation test
    refresh_resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": apex_refresh
    })
    assert refresh_resp.status_code == 200
    new_refresh = refresh_resp.json()["refresh_token"]
    assert new_refresh != apex_refresh

    # 9. Reuse of old refresh token must fail
    replay_resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": apex_refresh
    })
    assert replay_resp.status_code == 401

    # 10. Logout revokes token
    logout_resp = await client.post("/api/v1/auth/logout", json={"refresh_token": new_refresh})
    assert logout_resp.status_code == 200

    # 11. Trying to refresh with revoked token fails
    revoked_refresh = await client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert revoked_refresh.status_code == 401
