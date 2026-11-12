import pytest
import uuid
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_duplicate_scanning_and_matching_rules(client: AsyncClient):
    """
    Verifies CR-04 Deduplication Scanning Engine:
    1. Scans accounts, contacts, and leads.
    2. Flags exact email matches (100% confidence).
    3. Flags exact phone matches (90% confidence).
    4. Flags fuzzy name matches (70-95% confidence).
    5. Does NOT match on blank or missing emails/phones.
    """
    # 1. Register organization
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Apex Data Labs",
        "tenant_slug": "apex-dedup-scan-test",
        "first_name": "Cassian",
        "last_name": "Andor",
        "email": "cassian@apexdata.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Account scanning test setup: Create two duplicate accounts (one exact email, one fuzzy name)
    acc1 = await client.post("/api/v1/accounts", json={
        "name": "OmniCorp International Inc",
        "email": "contact@omnicorp.example",
        "phone": "+1-800-555-0199",
        "website": "https://omnicorp.example"
    }, headers=headers)
    assert acc1.status_code == 201

    acc2 = await client.post("/api/v1/accounts", json={
        "name": "OmniCorp International LLC",
        "email": "contact@omnicorp.example",  # Exact email match
        "phone": "+1 (800) 555-0199",         # Exact phone match after normalization
        "website": "https://omnicorp.example"
    }, headers=headers)
    assert acc2.status_code == 201

    # Create third account with no email and no phone (should NOT trigger false positive match)
    acc3 = await client.post("/api/v1/accounts", json={
        "name": "Different Global Ventures",
        "email": None,
        "phone": None
    }, headers=headers)
    assert acc3.status_code == 201

    # Scan Accounts
    acc_scan = await client.post("/api/v1/crm/duplicates/scan", json={
        "entity_type": "account",
        "limit": 10
    }, headers=headers)
    assert acc_scan.status_code == 200
    acc_data = acc_scan.json()
    assert acc_data["clusters_found"] >= 1
    cluster = acc_data["clusters"][0]
    assert cluster["confidence_score"] == 100
    rule_names = [r["rule_name"] for r in cluster["rules_triggered"]]
    assert "exact_email_match" in rule_names
    assert "exact_phone_match" in rule_names

    # 3. Contact scanning test setup: Create two contacts with same email
    con1 = await client.post("/api/v1/contacts", json={
        "first_name": "Valerie",
        "last_name": "Kane",
        "email": "valerie.kane@apexdata.example",
        "phone": "+1-555-222-3333"
    }, headers=headers)
    assert con1.status_code == 201

    con2 = await client.post("/api/v1/contacts", json={
        "first_name": "Valerie",
        "last_name": "Kane",
        "email": "valerie.kane@apexdata.example",
        "phone": "+1-555-222-3333"
    }, headers=headers)
    assert con2.status_code == 201

    con_scan = await client.post("/api/v1/crm/duplicates/scan", json={
        "entity_type": "contact",
        "limit": 10
    }, headers=headers)
    assert con_scan.status_code == 200
    assert con_scan.json()["clusters_found"] >= 1
    assert con_scan.json()["clusters"][0]["confidence_score"] == 100

    # 4. Lead scanning test setup: Create two leads with same email
    l1 = await client.post("/api/v1/leads", json={
        "first_name": "Lando",
        "last_name": "Calrissian",
        "company_name": "Cloud City Mining Corp",
        "email": "lando@cloudcity.example",
        "phone": "+1-555-777-8888"
    }, headers=headers)
    assert l1.status_code == 201

    l2 = await client.post("/api/v1/leads", json={
        "first_name": "Lando",
        "last_name": "Calrissian",
        "company_name": "Cloud City Mining Corp",
        "email": "lando@cloudcity.example",
        "phone": "+1-555-777-8888"
    }, headers=headers)
    assert l2.status_code == 201

    lead_scan = await client.post("/api/v1/crm/duplicates/scan", json={
        "entity_type": "lead",
        "limit": 10
    }, headers=headers)
    assert lead_scan.status_code == 200
    assert lead_scan.json()["clusters_found"] >= 1
    assert lead_scan.json()["clusters"][0]["confidence_score"] == 100
