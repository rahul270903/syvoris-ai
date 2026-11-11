import uuid
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_contacts_lifecycle_and_account_association(client: AsyncClient):
    # 1. Register organization
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Nexus Dynamics",
        "tenant_slug": "nexus-dynamics",
        "first_name": "Nathan",
        "last_name": "Drake",
        "email": "nathan@nexus.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Create parent account
    acc = await client.post("/api/v1/accounts", json={
        "name": "Starlight Industries",
        "industry": "Manufacturing"
    }, headers=headers)
    assert acc.status_code == 201
    account_id = acc.json()["id"]

    # 3. Create primary contact
    c1 = await client.post("/api/v1/contacts", json={
        "first_name": "Sarah",
        "last_name": "Connor",
        "email": "sarah.connor@starlight.example",
        "account_id": account_id,
        "job_title": "Chief Technology Officer",
        "department": "Engineering",
        "phone": "+1-555-0144",
        "is_primary": True,
        "is_decision_maker": True
    }, headers=headers)
    assert c1.status_code == 201
    c1_data = c1.json()
    assert c1_data["is_primary"] is True
    assert c1_data["ref"].startswith("CON-")
    assert c1_data["account_name"] == "Starlight Industries"
    c1_id = c1_data["id"]

    # 4. Create second contact and promote to primary (should unset c1 primary)
    c2 = await client.post("/api/v1/contacts", json={
        "first_name": "John",
        "last_name": "Connor",
        "email": "john.connor@starlight.example",
        "account_id": account_id,
        "job_title": "VP Procurement",
        "department": "Supply Chain",
        "is_primary": True
    }, headers=headers)
    assert c2.status_code == 201
    assert c2.json()["is_primary"] is True

    # Check c1 is no longer primary
    c1_refreshed = await client.get(f"/api/v1/contacts/{c1_id}", headers=headers)
    assert c1_refreshed.status_code == 200
    assert c1_refreshed.json()["is_primary"] is False

    # 5. List contacts filtered by account
    list_resp = await client.get(f"/api/v1/contacts?account_id={account_id}", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 2

    # 6. Update Contact
    up_resp = await client.put(f"/api/v1/contacts/{c1_id}", json={
        "job_title": "Executive Vice President of Technology",
        "phone": "+1-555-9999"
    }, headers=headers)
    assert up_resp.status_code == 200
    assert up_resp.json()["job_title"] == "Executive Vice President of Technology"

    # 7. Customer 360 should show both contacts
    c360 = await client.get(f"/api/v1/accounts/{account_id}/360", headers=headers)
    assert c360.status_code == 200
    assert len(c360.json()["contacts"]) == 2
    assert c360.json()["metrics"]["total_contacts"] == 2
    assert c360.json()["metrics"]["primary_contact"] == "John Connor"

    # 8. Archive contact
    del_resp = await client.delete(f"/api/v1/contacts/{c1_id}", headers=headers)
    assert del_resp.status_code == 200

    # Contact should no longer be listed
    list_after = await client.get(f"/api/v1/contacts?account_id={account_id}", headers=headers)
    assert list_after.json()["total"] == 1

@pytest.mark.asyncio
async def test_contact_account_selection_and_unassignment(client: AsyncClient):
    # 1. Register organization tenant
    suffix = uuid.uuid4().hex[:6]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Apex Innovations {suffix}",
        "tenant_slug": f"apex-{suffix}",
        "first_name": "Elena",
        "last_name": "Fisher",
        "email": f"elena-{suffix}@apex.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Create two accounts in this tenant
    acc1_res = await client.post("/api/v1/accounts", json={
        "name": "Acme Global",
        "industry": "Technology"
    }, headers=headers)
    assert acc1_res.status_code == 201
    acc1_id = acc1_res.json()["id"]

    acc2_res = await client.post("/api/v1/accounts", json={
        "name": "Zenith Logistics",
        "industry": "Logistics"
    }, headers=headers)
    assert acc2_res.status_code == 201
    acc2_id = acc2_res.json()["id"]

    # 3. Create an unassigned contact (account_id is None)
    c_res = await client.post("/api/v1/contacts", json={
        "first_name": "Victor",
        "last_name": "Sullivan",
        "email": "sully@apex.example",
        "account_id": None
    }, headers=headers)
    assert c_res.status_code == 201
    c_data = c_res.json()
    assert c_data["account_id"] is None
    assert c_data["account_name"] is None
    contact_id = c_data["id"]

    # 4. Update contact: assign to Acme Global (account_id = acc1_id UUID)
    up1 = await client.put(f"/api/v1/contacts/{contact_id}", json={
        "account_id": acc1_id
    }, headers=headers)
    assert up1.status_code == 200
    assert up1.json()["account_id"] == acc1_id
    assert up1.json()["account_name"] == "Acme Global"

    # Verify Customer 360 shows contact under Acme Global
    c360_acc1 = await client.get(f"/api/v1/accounts/{acc1_id}/360", headers=headers)
    assert c360_acc1.status_code == 200
    assert any(c["id"] == contact_id for c in c360_acc1.json()["contacts"])

    # 5. Reassign contact to Zenith Logistics (account_id = acc2_id UUID)
    up2 = await client.put(f"/api/v1/contacts/{contact_id}", json={
        "account_id": acc2_id
    }, headers=headers)
    assert up2.status_code == 200
    assert up2.json()["account_id"] == acc2_id
    assert up2.json()["account_name"] == "Zenith Logistics"

    # Verify contact moved in Customer 360
    c360_acc1_after = await client.get(f"/api/v1/accounts/{acc1_id}/360", headers=headers)
    assert not any(c["id"] == contact_id for c in c360_acc1_after.json()["contacts"])
    c360_acc2 = await client.get(f"/api/v1/accounts/{acc2_id}/360", headers=headers)
    assert any(c["id"] == contact_id for c in c360_acc2.json()["contacts"])

    # 6. Unassign contact (account_id = None)
    up3 = await client.put(f"/api/v1/contacts/{contact_id}", json={
        "account_id": None
    }, headers=headers)
    assert up3.status_code == 200
    assert up3.json()["account_id"] is None
    assert up3.json()["account_name"] is None

    # Verify contact is no longer in Zenith Customer 360
    c360_acc2_after = await client.get(f"/api/v1/accounts/{acc2_id}/360", headers=headers)
    assert not any(c["id"] == contact_id for c in c360_acc2_after.json()["contacts"])
