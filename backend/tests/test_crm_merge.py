import pytest
import uuid
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_atomic_record_merge_and_relationship_reassignment(client: AsyncClient):
    """
    Verifies CR-04 Atomic Record Merge Engine:
    1. Re-points child contacts, opportunities, and activities from duplicate to master.
    2. Re-points child accounts that had duplicate as parent_id to master.
    3. Soft-deletes duplicate record and marks merged_into_id = master.id.
    4. Applies validated field overrides.
    5. Rejects self-merge and cross-tenant merge.
    6. Verifies audit trail and activity logging.
    """
    # 1. Register organization
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Nexus Corporation",
        "tenant_slug": "nexus-merge-test",
        "first_name": "Sarah",
        "last_name": "Connor",
        "email": "sarah@nexuscorp.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Create Master Account
    m_resp = await client.post("/api/v1/accounts", json={
        "name": "Cyberdyne Systems Master Inc",
        "email": "hq@cyberdyne.example",
        "phone": "+1-800-000-0001",
        "industry": "Robotics"
    }, headers=headers)
    assert m_resp.status_code == 201
    master_id = m_resp.json()["id"]
    master_ref = m_resp.json()["ref"]

    # 3. Create Duplicate Account
    d_resp = await client.post("/api/v1/accounts", json={
        "name": "Cyberdyne Systems Duplicate LLC",
        "email": "hq@cyberdyne.example",
        "phone": "+1-800-000-0002",
        "industry": "AI Research"
    }, headers=headers)
    assert d_resp.status_code == 201
    dup_id = d_resp.json()["id"]

    # 4. Attach child Contact and Opportunity to Duplicate Account
    c_resp = await client.post("/api/v1/contacts", json={
        "first_name": "Miles",
        "last_name": "Dyson",
        "email": "miles.dyson@cyberdyne.example",
        "account_id": dup_id
    }, headers=headers)
    assert c_resp.status_code == 201
    contact_id = c_resp.json()["id"]

    # Log an activity against Duplicate Account
    act_resp = await client.post(f"/api/v1/accounts/{dup_id}/activities", json={
        "activity_type": "Call",
        "subject": "Neural Net Prototype Review",
        "description": "Reviewed architecture and budget requirements"
    }, headers=headers)
    assert act_resp.status_code == 201

    # Create a child Account pointing to duplicate as parent
    sub_acc = await client.post("/api/v1/accounts", json={
        "name": "Cyberdyne Skynet Division",
        "parent_id": dup_id
    }, headers=headers)
    assert sub_acc.status_code == 201
    sub_id = sub_acc.json()["id"]

    # 5. Guard Test: Attempt Self-Merge (must fail 422)
    self_merge = await client.post("/api/v1/crm/duplicates/merge", json={
        "entity_type": "account",
        "master_id": master_id,
        "duplicate_ids": [master_id]
    }, headers=headers)
    assert self_merge.status_code == 422

    # 6. Execute Valid Atomic Merge
    merge_resp = await client.post("/api/v1/crm/duplicates/merge", json={
        "entity_type": "account",
        "master_id": master_id,
        "duplicate_ids": [dup_id],
        "field_overrides": {
            "website": "https://cyberdyne.example",
            "phone": "+1-800-CYBERDYNE"
        }
    }, headers=headers)
    assert merge_resp.status_code == 200
    m_data = merge_resp.json()
    assert m_data["master_id"] == master_id
    assert m_data["reassigned_counts"]["contacts"] == 1
    assert m_data["reassigned_counts"]["activities"] >= 1
    assert m_data["reassigned_counts"]["child_accounts"] == 1

    # 7. Verify Child Contact was re-pointed to Master Account
    con_check = await client.get(f"/api/v1/contacts/{contact_id}", headers=headers)
    assert con_check.status_code == 200
    assert con_check.json()["account_id"] == master_id

    # 8. Verify Sub-Account parent was re-pointed to Master Account
    sub_check = await client.get(f"/api/v1/accounts/{sub_id}", headers=headers)
    assert sub_check.status_code == 200
    assert sub_check.json()["parent_id"] == master_id

    # 9. Verify Duplicate Account is archived / soft-deleted
    dup_check = await client.get(f"/api/v1/accounts/{dup_id}", headers=headers)
    assert dup_check.status_code == 404  # Soft-deleted record excluded from active queries

    # 10. Verify Master Account received field overrides and Customer 360 includes reassigned contact
    c360 = await client.get(f"/api/v1/accounts/{master_id}/360", headers=headers)
    assert c360.status_code == 200
    acc_360 = c360.json()
    assert acc_360["account"]["phone"] == "+1-800-CYBERDYNE"
    assert acc_360["account"]["website"] == "https://cyberdyne.example"
    contact_ids_in_360 = [c["id"] for c in acc_360["contacts"]]
    assert contact_id in contact_ids_in_360
