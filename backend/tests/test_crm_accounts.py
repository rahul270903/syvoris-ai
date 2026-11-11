import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_account_lifecycle_and_customer360(client: AsyncClient):
    # 1. Register a tenant organization
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Apex Innovations",
        "tenant_slug": "apex-innovations",
        "first_name": "Alice",
        "last_name": "Architect",
        "email": "alice@apex.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create an Account
    acc_payload = {
        "name": "Global Telecom Systems",
        "account_type": "Enterprise Customer",
        "industry": "Telecommunications",
        "website": "https://globaltelecom.example",
        "phone": "+1-800-555-0199",
        "email": "contact@globaltelecom.example",
        "address": "100 Tech Blvd, Silicon Valley, CA",
        "billing_address": {"street": "100 Tech Blvd", "city": "San Jose", "state": "CA", "zip": "95110"},
        "shipping_address": {"street": "100 Tech Blvd", "city": "San Jose", "state": "CA", "zip": "95110"},
        "ownership": "Public",
        "status": "Active",
        "description": "Tier-1 optical networking client.",
        "credit_limit": 250000.00
    }
    create_resp = await client.post("/api/v1/accounts", json=acc_payload, headers=headers)
    assert create_resp.status_code == 201
    acc_data = create_resp.json()
    acc_id = acc_data["id"]
    assert acc_data["name"] == "Global Telecom Systems"
    assert acc_data["ref"].startswith("ACC-")
    assert float(acc_data["credit_limit"]) == 250000.00

    # 3. List Accounts with search & pagination
    list_resp = await client.get("/api/v1/accounts?q=Global&limit=10", headers=headers)
    assert list_resp.status_code == 200
    page_data = list_resp.json()
    assert page_data["total"] >= 1
    assert any(a["id"] == acc_id for a in page_data["items"])

    # 4. Get Account Details by ID
    get_resp = await client.get(f"/api/v1/accounts/{acc_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == acc_id

    # 5. Update Account
    update_resp = await client.put(f"/api/v1/accounts/{acc_id}", json={
        "status": "Onboarding",
        "credit_limit": 300000.00,
        "description": "Updated credit terms."
    }, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "Onboarding"
    assert float(update_resp.json()["credit_limit"]) == 300000.00

    # 6. Log an Activity / Note
    act_resp = await client.post(f"/api/v1/accounts/{acc_id}/activities", json={
        "activity_type": "Call",
        "subject": "Executive QBR Discussion",
        "description": "Reviewed Q4 bandwidth requirements and SLA performance."
    }, headers=headers)
    assert act_resp.status_code == 201
    act_data = act_resp.json()
    assert act_data["subject"] == "Executive QBR Discussion"
    assert act_data["activity_type"] == "Call"

    # 7. Customer 360 Aggregation
    c360_resp = await client.get(f"/api/v1/accounts/{acc_id}/360", headers=headers)
    assert c360_resp.status_code == 200
    c360_data = c360_resp.json()
    assert c360_data["account"]["id"] == acc_id
    assert len(c360_data["activities"]) >= 1
    assert c360_data["metrics"]["account_status"] == "Onboarding"

    # 8. Archive (soft-delete) Account
    del_resp = await client.delete(f"/api/v1/accounts/{acc_id}", headers=headers)
    assert del_resp.status_code == 200
    assert "archived" in del_resp.json()["message"].lower()

    # Archived account should no longer appear in active list
    list_after = await client.get(f"/api/v1/accounts?q=Global", headers=headers)
    assert list_after.status_code == 200
    assert not any(a["id"] == acc_id for a in list_after.json()["items"])
