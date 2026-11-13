import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_lead_lifecycle_scoring_and_filtering(client: AsyncClient):
    # 1. Register a tenant organization
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Vanguard Enterprises",
        "tenant_slug": "vanguard-leads-test",
        "first_name": "Victor",
        "last_name": "Vanguard",
        "email": "victor@vanguard.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Lead with executive title and high-intent source -> automatic rule scoring
    lead_payload = {
        "first_name": "Elena",
        "last_name": "Rostova",
        "company_name": "Nordic Telecommunications OY",
        "job_title": "Chief Technology Officer",
        "email": "elena.rostova@nordictelecom.fi",
        "phone": "+358-40-555-0199",
        "source": "Partner Referral",
        "industry": "Telecommunications",
        "territory": "Nordics",
        "status": "New",
        "priority": "High",
        "consent_status": "Opted-In via Partner",
        "description": "Enterprise fiber core network upgrade proposal."
    }
    create_resp = await client.post("/api/v1/leads", json=lead_payload, headers=headers)
    assert create_resp.status_code == 201
    lead_data = create_resp.json()
    lead_id = lead_data["id"]

    assert lead_data["ref"].startswith("LED-")
    assert lead_data["full_name"] == "Elena Rostova"
    assert lead_data["company_name"] == "Nordic Telecommunications OY"
    # CTO (+25), corporate domain (+15), phone (+10), partner referral (+20), telecom (+15), consent (+10), base (10) -> score = 100
    assert lead_data["score"] >= 80
    assert len(lead_data["score_factors"]) >= 4

    # 3. Create a lower-tier lead with generic webmail and junior title
    junior_lead = await client.post("/api/v1/leads", json={
        "first_name": "John",
        "last_name": "Doe",
        "company_name": "Unknown Ventures",
        "job_title": "Student Intern",
        "email": "johndoe@gmail.com",
        "source": "Outbound Cold",
        "status": "New"
    }, headers=headers)
    assert junior_lead.status_code == 201
    junior_data = junior_lead.json()
    assert junior_data["score"] < 30

    # 4. List Leads with filtering and search
    # Search by company name
    search_resp = await client.get("/api/v1/leads?q=Nordic", headers=headers)
    assert search_resp.status_code == 200
    search_items = search_resp.json()["items"]
    assert any(l["id"] == lead_id for l in search_items)
    assert not any(l["id"] == junior_data["id"] for l in search_items)

    # Filter by minimum score
    score_filter = await client.get("/api/v1/leads?min_score=70", headers=headers)
    assert score_filter.status_code == 200
    high_score_items = score_filter.json()["items"]
    assert any(l["id"] == lead_id for l in high_score_items)
    assert not any(l["id"] == junior_data["id"] for l in high_score_items)

    # 5. Retrieve Lead by ID
    get_resp = await client.get(f"/api/v1/leads/{lead_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == lead_id

    # 6. Update Lead (PATCH) - qualify lead and change job title
    update_resp = await client.patch(f"/api/v1/leads/{lead_id}", json={
        "status": "Qualified",
        "priority": "Urgent"
    }, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "Qualified"
    assert update_resp.json()["priority"] == "Urgent"

    # 7. Soft delete (archive) Lead
    del_resp = await client.delete(f"/api/v1/leads/{junior_data['id']}", headers=headers)
    assert del_resp.status_code == 200
    assert "archived" in del_resp.json()["message"].lower()

    # Archived lead must no longer appear in active list
    list_after = await client.get("/api/v1/leads", headers=headers)
    assert list_after.status_code == 200
    assert not any(l["id"] == junior_data["id"] for l in list_after.json()["items"])


@pytest.mark.asyncio
async def test_lead_status_transitions_and_rules(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Status Governance Org",
        "tenant_slug": "status-gov-test",
        "first_name": "Greg",
        "last_name": "Governance",
        "email": "greg@gov.example",
        "password": "Password123!"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Create lead
    create_resp = await client.post("/api/v1/leads", json={
        "first_name": "Sarah",
        "last_name": "Connor",
        "company_name": "Cyberdyne Systems",
        "email": "sarah@cyberdyne.example",
        "status": "New"
    }, headers=headers)
    assert create_resp.status_code == 201
    lead_id = create_resp.json()["id"]

    # Test invalid status string rejection
    bad_status = await client.patch(f"/api/v1/leads/{lead_id}", json={
        "status": "CompletelyBogusStatus"
    }, headers=headers)
    assert bad_status.status_code == 422
    assert "invalid lead status" in bad_status.json()["detail"].lower()

    # Transition to Disqualified
    disq_resp = await client.patch(f"/api/v1/leads/{lead_id}", json={
        "status": "Disqualified"
    }, headers=headers)
    assert disq_resp.status_code == 200
    assert disq_resp.json()["status"] == "Disqualified"

    # Attempting to convert a Disqualified lead directly must be rejected
    conv_disq = await client.post(f"/api/v1/leads/{lead_id}/convert", json={
        "account_mode": "create",
        "new_account": {"name": "Cyberdyne Systems Corp"},
        "contact": {"first_name": "Sarah", "last_name": "Connor", "email": "sarah@cyberdyne.example"}
    }, headers=headers)
    assert conv_disq.status_code == 422
    assert "disqualified" in conv_disq.json()["detail"].lower()

    # Re-qualify lead
    qual_resp = await client.patch(f"/api/v1/leads/{lead_id}", json={
        "status": "Qualified"
    }, headers=headers)
    assert qual_resp.status_code == 200
    assert qual_resp.json()["status"] == "Qualified"

    # Convert lead
    conv_ok = await client.post(f"/api/v1/leads/{lead_id}/convert", json={
        "account_mode": "create",
        "new_account": {"name": "Cyberdyne Systems Corp"},
        "contact": {"first_name": "Sarah", "last_name": "Connor", "email": "sarah@cyberdyne.example"}
    }, headers=headers)
    assert conv_ok.status_code == 200
    assert conv_ok.json()["lead"]["status"] == "Converted"

    # Modifying status of an already converted lead must be rejected
    cant_change = await client.patch(f"/api/v1/leads/{lead_id}", json={
        "status": "New"
    }, headers=headers)
    assert cant_change.status_code == 422
    assert "already converted" in cant_change.json()["detail"].lower()
