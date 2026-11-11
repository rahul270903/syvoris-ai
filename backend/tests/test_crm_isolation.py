import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_cross_tenant_accounts_and_contacts_isolation(client: AsyncClient):
    # 1. Register Tenant A
    reg_a = await client.post("/api/v1/auth/register", json={
        "organization_name": "Tenant Alpha Enterprises",
        "tenant_slug": "tenant-alpha-crm",
        "first_name": "Alice",
        "last_name": "Alpha",
        "email": "alice@alpha-crm.example",
        "password": "Password123!"
    })
    assert reg_a.status_code == 201
    headers_a = {"Authorization": f"Bearer {reg_a.json()['access_token']}"}

    # 2. Register Tenant B
    reg_b = await client.post("/api/v1/auth/register", json={
        "organization_name": "Tenant Beta Systems",
        "tenant_slug": "tenant-beta-crm",
        "first_name": "Bob",
        "last_name": "Beta",
        "email": "bob@beta-crm.example",
        "password": "Password123!"
    })
    assert reg_b.status_code == 201
    headers_b = {"Authorization": f"Bearer {reg_b.json()['access_token']}"}

    # 3. Create Account and Contact in Tenant A
    acc_a = await client.post("/api/v1/accounts", json={
        "name": "Alpha Classified Systems",
        "industry": "Defense",
        "credit_limit": 500000.00
    }, headers=headers_a)
    assert acc_a.status_code == 201
    acc_a_id = acc_a.json()["id"]

    con_a = await client.post("/api/v1/contacts", json={
        "first_name": "Secret",
        "last_name": "Agent",
        "email": "agent@alpha-crm.example",
        "account_id": acc_a_id
    }, headers=headers_a)
    assert con_a.status_code == 201
    con_a_id = con_a.json()["id"]

    # 4. TENANT B ATTEMPTS CROSS-TENANT ACCESS

    # Read Tenant A account by ID -> MUST return 404
    cross_acc = await client.get(f"/api/v1/accounts/{acc_a_id}", headers=headers_b)
    assert cross_acc.status_code == 404

    # Read Tenant A Customer 360 -> MUST return 404
    cross_360 = await client.get(f"/api/v1/accounts/{acc_a_id}/360", headers=headers_b)
    assert cross_360.status_code == 404

    # Update Tenant A account -> MUST return 404
    cross_put = await client.put(f"/api/v1/accounts/{acc_a_id}", json={"name": "Hacked Org"}, headers=headers_b)
    assert cross_put.status_code == 404

    # Delete Tenant A account -> MUST return 404
    cross_del = await client.delete(f"/api/v1/accounts/{acc_a_id}", headers=headers_b)
    assert cross_del.status_code == 404

    # Read Tenant A contact by ID -> MUST return 404
    cross_con = await client.get(f"/api/v1/contacts/{con_a_id}", headers=headers_b)
    assert cross_con.status_code == 404

    # Tenant B tries to create a contact linked to Tenant A's account -> MUST return 422
    cross_con_create = await client.post("/api/v1/contacts", json={
        "first_name": "Intruder",
        "last_name": "Spy",
        "email": "spy@beta-crm.example",
        "account_id": acc_a_id
    }, headers=headers_b)
    assert cross_con_create.status_code == 422

    # Tenant B lists accounts -> MUST NOT include Tenant A's account
    list_b = await client.get("/api/v1/accounts", headers=headers_b)
    assert list_b.status_code == 200
    assert not any(a["id"] == acc_a_id for a in list_b.json()["items"])
