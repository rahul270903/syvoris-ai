import uuid
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_lead_conversion_atomic_success(client: AsyncClient):
    """
    Verifies that a qualified lead converts atomically into:
    1. A new Account
    2. A new Contact (linked to Account)
    3. A new Opportunity (linked to Account and Contact)
    4. An activity ledger entry tracking the conversion provenance
    5. The lead status transitioning to 'Converted'
    """
    # 1. Register Tenant
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Meridian Global",
        "tenant_slug": "meridian-conversion-test",
        "first_name": "Marcus",
        "last_name": "Sterling",
        "email": "marcus@meridian.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Create Lead
    lead_resp = await client.post("/api/v1/leads", json={
        "first_name": "Sophia",
        "last_name": "Chen",
        "company_name": "Pacific Quantum Networks",
        "job_title": "VP Infrastructure",
        "email": "sophia.chen@pacificquantum.example",
        "phone": "+1-415-555-0188",
        "source": "Webform",
        "industry": "Technology",
        "status": "Qualified",
        "description": "Enterprise cloud interconnect expansion."
    }, headers=headers)
    assert lead_resp.status_code == 201
    lead_id = lead_resp.json()["id"]
    lead_ref = lead_resp.json()["ref"]

    # 3. Execute Atomic Lead Conversion
    conv_resp = await client.post(f"/api/v1/leads/{lead_id}/convert", json={
        "account_mode": "create",
        "new_account": {
            "name": "Pacific Quantum Networks Corp",
            "industry": "Technology",
            "segment": "Enterprise",
            "territory": "Pacific Rim",
            "credit_limit": 150000.00
        },
        "contact": {
            "first_name": "Sophia",
            "last_name": "Chen",
            "job_title": "VP Infrastructure",
            "email": "sophia.chen@pacificquantum.example",
            "phone": "+1-415-555-0188",
            "consent_status": "Opted-In"
        },
        "create_opportunity": True,
        "opportunity": {
            "name": "Pacific Quantum · Cloud Interconnect Phase 1",
            "amount": 175000.00,
            "stage": "Proposal",
            "probability": 50,
            "expected_close_date": "2026-12-31T00:00:00Z"
        }
    }, headers=headers)

    assert conv_resp.status_code == 200
    res_data = conv_resp.json()

    # Verify Account created
    acc = res_data["account"]
    assert acc["id"] is not None
    assert acc["ref"].startswith("ACC-")
    assert acc["name"] == "Pacific Quantum Networks Corp"

    # Verify Contact created and associated with Account
    con = res_data["contact"]
    assert con["id"] is not None
    assert con["ref"].startswith("CON-")
    assert con["account_id"] == acc["id"]
    assert con["first_name"] == "Sophia"

    # Verify Opportunity created and associated with both Account and Contact
    opp = res_data["opportunity"]
    assert opp is not None
    assert opp["ref"].startswith("OPP-")
    assert opp["account_id"] == acc["id"]
    assert opp["contact_id"] == con["id"]
    assert float(opp["amount"]) == 175000.00

    # Verify Lead marked as Converted
    lead_after = res_data["lead"]
    assert lead_after["status"] == "Converted"
    assert lead_after["converted_account_id"] == acc["id"]
    assert lead_after["converted_contact_id"] == con["id"]
    assert lead_after["converted_opportunity_id"] == opp["id"]
    assert lead_after["converted_at"] is not None

    # Verify Customer 360 includes the conversion activity
    c360_resp = await client.get(f"/api/v1/accounts/{acc['id']}/360", headers=headers)
    assert c360_resp.status_code == 200
    activities = c360_resp.json()["activities"]
    assert any("Lead Converted" in act["subject"] for act in activities)

    # 4. DUPLICATE CONVERSION PREVENTION
    # Attempting to convert the already converted lead must be rejected with 422 ValidationException
    dup_resp = await client.post(f"/api/v1/leads/{lead_id}/convert", json={
        "account_mode": "create",
        "new_account": {"name": "Pacific Quantum Networks Corp"},
        "contact": {"first_name": "Sophia", "last_name": "Chen", "email": "sophia@example.com"}
    }, headers=headers)
    assert dup_resp.status_code == 422
    assert "already converted" in dup_resp.json()["detail"].lower()

@pytest.mark.asyncio
async def test_lead_conversion_atomic_rollback_on_failure(client: AsyncClient):
    """
    Verifies that if any step of conversion fails (e.g. invalid linked account ID),
    the entire transaction rolls back: zero orphaned accounts or contacts created.
    """
    # 1. Register Tenant
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Rollback Test Org",
        "tenant_slug": "rollback-test-org",
        "first_name": "Rachel",
        "last_name": "Rollback",
        "email": "rachel@rollback.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Create Lead
    lead_resp = await client.post("/api/v1/leads", json={
        "first_name": "David",
        "last_name": "Miller",
        "company_name": "Doomed Enterprise Ltd",
        "email": "david@doomed.example",
        "status": "Qualified"
    }, headers=headers)
    assert lead_resp.status_code == 201
    lead_id = lead_resp.json()["id"]

    # 3. Count initial accounts and contacts
    acc_initial = await client.get("/api/v1/accounts", headers=headers)
    con_initial = await client.get("/api/v1/contacts", headers=headers)
    initial_acc_count = acc_initial.json()["total"]
    initial_con_count = con_initial.json()["total"]

    # 4. Inject Failure: Pass nonexistent UUID for linked account
    fake_account_id = str(uuid.uuid4())
    fail_conv = await client.post(f"/api/v1/leads/{lead_id}/convert", json={
        "account_mode": "link",
        "existing_account_id": fake_account_id,
        "contact": {
            "first_name": "David",
            "last_name": "Miller",
            "email": "david@doomed.example"
        }
    }, headers=headers)

    # Must fail with validation error
    assert fail_conv.status_code == 422
    assert "does not exist" in fail_conv.json()["detail"]

    # 5. VERIFY ZERO ORPHANED RECORDS
    acc_after = await client.get("/api/v1/accounts", headers=headers)
    con_after = await client.get("/api/v1/contacts", headers=headers)
    assert acc_after.json()["total"] == initial_acc_count
    assert con_after.json()["total"] == initial_con_count

    # 6. Verify lead remains unconverted
    lead_check = await client.get(f"/api/v1/leads/{lead_id}", headers=headers)
    assert lead_check.status_code == 200
    assert lead_check.json()["status"] == "Qualified"
    assert lead_check.json()["converted_at"] is None
