import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_tenant_isolation_and_cross_tenant_boundaries(client: AsyncClient):
    # 1. Register Tenant Beta
    beta_reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Beta Corporation",
        "tenant_slug": "beta-corp",
        "first_name": "Beth",
        "last_name": "Davis",
        "email": "beth@beta.example",
        "password": "Password123!"
    })
    assert beta_reg.status_code == 201
    beta_tokens = beta_reg.json()
    beta_token = beta_tokens["access_token"]
    beta_tenant_id = beta_tokens["tenant_id"]
    beta_headers = {"Authorization": f"Bearer {beta_token}"}

    # 2. Register Tenant Gamma
    gamma_reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Gamma Logistics",
        "tenant_slug": "gamma-logistics",
        "first_name": "Gary",
        "last_name": "Miller",
        "email": "gary@gamma.example",
        "password": "Password123!"
    })
    assert gamma_reg.status_code == 201
    gamma_tokens = gamma_reg.json()
    gamma_token = gamma_tokens["access_token"]
    gamma_tenant_id = gamma_tokens["tenant_id"]
    gamma_headers = {"Authorization": f"Bearer {gamma_token}"}

    assert beta_tenant_id != gamma_tenant_id

    # 3. Tenant Beta invites an employee
    invite_resp = await client.post("/api/v1/admin/users/invite", json={
        "email": "employee@beta.example",
        "first_name": "Edward",
        "last_name": "Cole",
        "role_name": "Sales Representative",
        "job_title": "Field Account Executive"
    }, headers=beta_headers)
    assert invite_resp.status_code == 201
    beta_employee_id = invite_resp.json()["id"]

    # 4. Tenant Beta queries its user roster -> employee is present
    beta_users_resp = await client.get("/api/v1/admin/users/", headers=beta_headers)
    assert beta_users_resp.status_code == 200
    beta_users = beta_users_resp.json()
    assert any(u["email"] == "employee@beta.example" for u in beta_users)
    assert len(beta_users) >= 2

    # 5. ISOLATION CHECK: Tenant Gamma queries its user roster -> BETA EMPLOYEE IS STRICTLY ABSENT
    gamma_users_resp = await client.get("/api/v1/admin/users/", headers=gamma_headers)
    assert gamma_users_resp.status_code == 200
    gamma_users = gamma_users_resp.json()
    assert not any(u["email"] == "employee@beta.example" for u in gamma_users)
    assert not any(u["id"] == beta_employee_id for u in gamma_users)

    # 6. ATTACK VECTOR: Tenant Gamma attempts direct update on Tenant Beta's employee via UUID
    malicious_update = await client.put(f"/api/v1/admin/users/{beta_employee_id}/status", json={
        "status": "Suspended"
    }, headers=gamma_headers)
    assert malicious_update.status_code in [404, 403]

    # 7. ATTACK VECTOR: Tenant Gamma attempts to reassign role on Tenant Beta's employee
    malicious_role = await client.put(f"/api/v1/admin/users/{beta_employee_id}/role", json={
        "role_name": "Tenant Owner"
    }, headers=gamma_headers)
    assert malicious_role.status_code in [404, 403]

    # 8. MULTI-TENANT IDENTITY CHECK: Same user can be invited to Tenant Gamma with a different role
    cross_invite = await client.post("/api/v1/admin/users/invite", json={
        "email": "employee@beta.example", # same global user
        "first_name": "Edward",
        "last_name": "Cole",
        "role_name": "Customer Support Agent",
        "job_title": "Support Specialist"
    }, headers=gamma_headers)
    assert cross_invite.status_code == 201
    assert cross_invite.json()["role"] == "Customer Support Agent"

    # In Beta, the user is Sales Representative
    beta_check = await client.get("/api/v1/admin/users/", headers=beta_headers)
    beta_emp = next(u for u in beta_check.json() if u["email"] == "employee@beta.example")
    assert beta_emp["role"] == "Sales Representative"

    # In Gamma, the user is Customer Support Agent
    gamma_check = await client.get("/api/v1/admin/users/", headers=gamma_headers)
    gamma_emp = next(u for u in gamma_check.json() if u["email"] == "employee@beta.example")
    assert gamma_emp["role"] == "Customer Support Agent"
