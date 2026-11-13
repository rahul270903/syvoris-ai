import uuid
import pytest
from decimal import Decimal
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_marketing_campaigns_lifecycle_and_attribution(client: AsyncClient):
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Marketing Test Org {uid}",
        "tenant_slug": f"marketing-org-{uid}",
        "first_name": "Elena",
        "last_name": "Rostova",
        "email": f"elena.{uid}@example.com",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    auth_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    # 1. Create a Campaign
    campaign_data = {
        "name": "Q4 Enterprise Digital Transformation Outreach",
        "type": "Email",
        "channel": "Email",
        "budget": "50000.00",
        "actual_cost": "15000.00",
        "expected_revenue": "250000.00",
        "target_audience": "VP of Technology & CTOs",
        "objective": "Generate 50 qualified SQLs for enterprise cloud migration."
    }
    resp = await client.post("/api/v1/campaigns", json=campaign_data, headers=auth_headers)
    assert resp.status_code == 201, resp.text
    campaign = resp.json()
    assert campaign["name"] == campaign_data["name"]
    assert campaign["ref"].startswith("CMP-")
    assert campaign["status"] == "Planning"
    campaign_id = campaign["id"]

    # 2. Transition Campaign Status to Active
    resp = await client.post(f"/api/v1/campaigns/{campaign_id}/status?new_status=Active", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "Active"

    # 3. Create a Lead linked to this Campaign
    lead_data = {
        "first_name": "Elena",
        "last_name": "Rostova",
        "company_name": "Rostov Dynamics",
        "email": f"elena.rostova.{uuid.uuid4().hex[:6]}@example.com",
        "phone": "+1-555-0199",
        "source": "Campaign",
        "industry": "Technology",
        "status": "New"
    }
    lead_resp = await client.post("/api/v1/leads", json=lead_data, headers=auth_headers)
    assert lead_resp.status_code == 201
    lead = lead_resp.json()

    # 4. Add Campaign Member
    member_data = {
        "lead_id": lead["id"],
        "status": "Sent",
        "engagement_score": 15,
        "unsubscribed": False
    }
    resp = await client.post(f"/api/v1/campaigns/{campaign_id}/members", json=member_data, headers=auth_headers)
    assert resp.status_code == 201
    member = resp.json()
    assert member["lead_id"] == lead["id"]
    assert member["status"] == "Sent"

    # 5. List Campaign Members
    resp = await client.get(f"/api/v1/campaigns/{campaign_id}/members", headers=auth_headers)
    assert resp.status_code == 200
    members_list = resp.json()
    assert members_list["total"] >= 1
    assert any(m["id"] == member["id"] for m in members_list["items"])

    # 6. Retrieve Campaign Attribution
    resp = await client.get(f"/api/v1/campaigns/{campaign_id}/attribution", headers=auth_headers)
    assert resp.status_code == 200
    attribution = resp.json()
    assert attribution["campaign_id"] == campaign_id
    assert Decimal(str(attribution["budget"])) == Decimal("50000.00")

    # 7. Create Audience Segment
    seg_data = {
        "name": "High-Tech Leads Segment",
        "description": "Dynamic segment targeting technology sector leads with scores >= 30",
        "segment_type": "Dynamic",
        "target_entity": "leads",
        "filter_criteria": {
            "source": "Campaign"
        }
    }
    resp = await client.post("/api/v1/segments", json=seg_data, headers=auth_headers)
    assert resp.status_code == 201
    segment = resp.json()
    assert segment["ref"].startswith("SEG-")
    assert segment["target_entity"] == "leads"

    # 8. Evaluate Segment
    resp = await client.post(f"/api/v1/segments/{segment['id']}/evaluate", headers=auth_headers)
    assert resp.status_code == 200
    eval_res = resp.json()
    assert "member_count" in eval_res
    assert eval_res["segment_id"] == segment["id"]

    # 9. Create Email Template
    tpl_data = {
        "name": "Executive Invitation Template",
        "subject": "Exclusive Invitation: Next-Gen AI Architecture for {{company}}",
        "category": "Invitation",
        "body_html": "<p>Dear {{first_name}},</p><p>We invite {{company}} to our executive roundtable.</p>",
        "merge_tags": ["first_name", "company"]
    }
    resp = await client.post("/api/v1/email-templates", json=tpl_data, headers=auth_headers)
    assert resp.status_code == 201
    tpl = resp.json()
    assert tpl["ref"].startswith("TPL-")
    assert "first_name" in tpl["merge_tags"]
    assert "company" in tpl["merge_tags"]

    # 10. List Email Templates
    resp = await client.get("/api/v1/email-templates", headers=auth_headers)
    assert resp.status_code == 200
    templates = resp.json()
    assert templates["total"] >= 1
