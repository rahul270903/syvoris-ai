import uuid
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_customer_cases_sla_and_feedback(client: AsyncClient):
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"CX Test Org {uid}",
        "tenant_slug": f"cx-org-{uid}",
        "first_name": "Marcus",
        "last_name": "Vance",
        "email": f"marcus.{uid}@example.com",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    auth_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    # 1. Create an Account for the Case
    acc_data = {
        "name": f"AeroTech Solutions {uuid.uuid4().hex[:6]}",
        "account_type": "Customer",
        "industry": "Aerospace",
        "status": "Active"
    }
    acc_resp = await client.post("/api/v1/accounts", json=acc_data, headers=auth_headers)
    assert acc_resp.status_code == 201
    account = acc_resp.json()
    account_id = account["id"]

    # 2. Check SLA Policies list and auto-seed
    sla_resp = await client.get("/api/v1/service/sla", headers=auth_headers)
    assert sla_resp.status_code == 200
    policies = sla_resp.json()
    assert len(policies) >= 4 # Critical, High, Normal, Low auto-seeded

    # 3. Create a Case
    case_data = {
        "subject": "Critical Cloud Gateway Latency Spike",
        "description": "Production API response times elevated across EU-West region.",
        "account_id": account_id,
        "priority": "High",
        "category": "Cloud Infrastructure",
        "channel": "Portal",
        "sentiment": "Negative"
    }
    resp = await client.post("/api/v1/cases", json=case_data, headers=auth_headers)
    assert resp.status_code == 201, resp.text
    case = resp.json()
    assert case["ref"].startswith("CASE-")
    assert case["subject"] == case_data["subject"]
    assert case["status"] == "New"
    assert case["sla_response_deadline"] is not None
    assert case["sla_resolution_deadline"] is not None
    case_id = case["id"]

    # 4. Add a staff comment to the Case
    comment_data = {
        "message": "Tier-2 SRE investigated DNS cache. Initiating routing failover.",
        "is_internal": True,
        "channel": "Portal"
    }
    resp = await client.post(f"/api/v1/cases/{case_id}/comments", json=comment_data, headers=auth_headers)
    assert resp.status_code == 201
    comment = resp.json()
    assert comment["case_id"] == case_id
    assert comment["is_internal"] is True

    # 5. List Case Comments
    resp = await client.get(f"/api/v1/cases/{case_id}/comments", headers=auth_headers)
    assert resp.status_code == 200
    comments = resp.json()
    assert len(comments) >= 1

    # 6. Transition Case to Awaiting Customer (pauses SLA clock)
    resp = await client.post(f"/api/v1/cases/{case_id}/transition", json={
        "target_status": "Awaiting Customer",
        "notes": "Awaiting client verification on isolated test endpoint."
    }, headers=auth_headers)
    assert resp.status_code == 200
    updated_case = resp.json()
    assert updated_case["status"] == "Awaiting Customer"
    assert updated_case["sla_paused_at"] is not None

    # 7. Transition Case to Resolved
    resp = await client.post(f"/api/v1/cases/{case_id}/transition", json={
        "target_status": "Resolved",
        "resolution_summary": "Routing failover completed. Latency normalized under 25ms.",
        "csat_score": 5
    }, headers=auth_headers)
    assert resp.status_code == 200
    resolved_case = resp.json()
    assert resolved_case["status"] == "Resolved"
    assert resolved_case["resolved_at"] is not None
    assert resolved_case["csat_score"] == 5

    # 8. Submit Customer CSAT Survey Response
    surveys_resp = await client.get("/api/v1/surveys", headers=auth_headers)
    assert surveys_resp.status_code == 200
    surveys = surveys_resp.json()
    assert len(surveys) >= 1
    survey_id = surveys[0]["id"]

    resp = await client.post("/api/v1/surveys/responses", json={
        "survey_id": survey_id,
        "case_id": case_id,
        "account_id": account_id,
        "score": 5,
        "sentiment": "Positive",
        "feedback_text": "Extremely fast resolution and great communication by the SRE team."
    }, headers=auth_headers)
    assert resp.status_code == 201
    feedback = resp.json()
    assert feedback["score"] == 5
    assert feedback["sentiment"] == "Positive"

    # 9. Get CSAT Summary
    resp = await client.get("/api/v1/surveys/csat-summary", headers=auth_headers)
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["total_responses"] >= 1
    assert summary["positive_count"] >= 1

    # 10. Verify Case Linkage in Customer 360
    c360_resp = await client.get(f"/api/v1/accounts/{account_id}/360", headers=auth_headers)
    assert c360_resp.status_code == 200
    c360 = c360_resp.json()
    assert "cases" in c360
    assert len(c360["cases"]) >= 1
    assert c360["cases"][0]["id"] == case_id
    assert c360["metrics"]["total_cases"] >= 1

    # 11. Create & Search Knowledge Base Article
    kb_data = {
        "title": "Optimizing Cloud Gateway Latency & DNS Caching",
        "category": "Troubleshooting",
        "summary": "Step-by-step procedure to diagnose and mitigate unexpected gateway latencies.",
        "content": "<p>When latency spikes occur, verify edge cache hit ratios and validate upstream BGP routing.</p>",
        "visibility": "Customer-facing",
        "status": "Published"
    }
    resp = await client.post("/api/v1/knowledge", json=kb_data, headers=auth_headers)
    assert resp.status_code == 201
    kb = resp.json()
    assert kb["ref"].startswith("KB-")
    assert kb["slug"] == "optimizing-cloud-gateway-latency-dns-caching"

    # 12. Vote Helpful on Knowledge Article
    resp = await client.post(f"/api/v1/knowledge/{kb['id']}/helpful", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["helpful_count"] == 1
