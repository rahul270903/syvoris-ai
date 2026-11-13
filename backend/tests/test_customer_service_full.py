import uuid
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_customer_service_full_workflow(client: AsyncClient):
    uid = uuid.uuid4().hex[:8]
    # Register test tenant
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Service Test Org {uid}",
        "tenant_slug": f"service-org-{uid}",
        "first_name": "Sarah",
        "last_name": "Connor",
        "email": f"sarah.{uid}@example.com",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    auth_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create an Account & Contact
    acc_res = await client.post("/api/v1/accounts", json={
        "name": f"AeroVance Logistics {uid}",
        "account_type": "Customer",
        "industry": "Logistics",
        "status": "Active"
    }, headers=auth_headers)
    assert acc_res.status_code == 201
    account_id = acc_res.json()["id"]

    con_res = await client.post("/api/v1/contacts", json={
        "first_name": "Elena",
        "last_name": "Rostova",
        "email": f"elena.{uid}@aerovance.example",
        "account_id": account_id,
        "job_title": "VP Operations"
    }, headers=auth_headers)
    assert con_res.status_code == 201
    contact_id = con_res.json()["id"]

    # 2. Test Business Hours & Holidays
    bh_res = await client.post("/api/v1/service/business-hours", json={
        "name": "Global 24/5 Business Hours",
        "timezone": "UTC",
        "is_default": True
    }, headers=auth_headers)
    assert bh_res.status_code == 201
    bh = bh_res.json()
    assert bh["ref"].startswith("BHR-")
    bh_id = bh["id"]

    hol_res = await client.post(f"/api/v1/service/business-hours/{bh_id}/holidays", json={
        "name": "Global Systems Holiday",
        "holiday_date": "2027-01-01"
    }, headers=auth_headers)
    assert hol_res.status_code == 200

    # 3. Test Support Queues
    q_res = await client.post("/api/v1/service/queues", json={
        "name": "L2 Cloud & DevOps Escalations",
        "code": f"cloud-escalations-{uid}",
        "description": "High priority incident triage",
        "priority": "High",
        "max_capacity": 20
    }, headers=auth_headers)
    assert q_res.status_code == 201
    queue = q_res.json()
    assert queue["ref"].startswith("QUE-")

    queues_list_res = await client.get("/api/v1/service/queues", headers=auth_headers)
    assert queues_list_res.status_code == 200
    assert len(queues_list_res.json()) >= 1

    # 4. Test Case Creation & Claiming
    case_res = await client.post("/api/v1/cases", json={
        "subject": "Intermittent Gateway Timeout in US-East",
        "description": "HTTP 504 errors reported on ingest API.",
        "account_id": account_id,
        "contact_id": contact_id,
        "priority": "High",
        "category": "Cloud Infrastructure",
        "assigned_queue": queue["name"]
    }, headers=auth_headers)
    assert case_res.status_code == 201
    case = case_res.json()
    assert case["ref"].startswith("CASE-")
    case_id = case["id"]

    # Add an internal comment and a public comment
    await client.post(f"/api/v1/cases/{case_id}/comments", json={
        "message": "Public: We are actively running network diagnostics.",
        "is_internal": False
    }, headers=auth_headers)

    await client.post(f"/api/v1/cases/{case_id}/comments", json={
        "message": "Internal Note: Investigating upstream AWS DirectConnect link drop.",
        "is_internal": True
    }, headers=auth_headers)

    # Claim case from queue
    claim_res = await client.post("/api/v1/service/queues/claim", json={
        "case_id": case_id
    }, headers=auth_headers)
    assert claim_res.status_code == 200
    claimed = claim_res.json()
    assert claimed["status"] in ("Assigned", "In Progress")

    # 5. Test Support Mailroom & Thread Matching
    mb_res = await client.post("/api/v1/service/mailroom/mailboxes", json={
        "name": "Automated Cloud Care Desk",
        "email": f"cloud-care.{uid}@support.example",
        "default_priority": "High"
    }, headers=auth_headers)
    assert mb_res.status_code == 201

    # Simulate email matching existing case via thread token
    msg_token_res = await client.post("/api/v1/service/mailroom/simulate", json={
        "mailbox_email": f"cloud-care.{uid}@support.example",
        "sender_email": f"elena.{uid}@aerovance.example",
        "sender_name": "Elena Rostova",
        "subject": f"Re: [{case['ref']}] Diagnostics Update",
        "body_text": "Here are the HAR file captures from our proxy.",
        "message_id": f"msg-token-{uid}"
    }, headers=auth_headers)
    assert msg_token_res.status_code == 200
    msg_token = msg_token_res.json()
    assert msg_token["status"] == "Linked"
    assert msg_token["case_id"] == case_id

    # Simulate email without thread token -> Creates a new case automatically
    msg_new_res = await client.post("/api/v1/service/mailroom/simulate", json={
        "mailbox_email": f"cloud-care.{uid}@support.example",
        "sender_email": f"billing.{uid}@aerovance.example",
        "sender_name": "Billing Dept",
        "subject": "Request for updated annual master contract PDF",
        "body_text": "Please provide the latest signed counter-party agreement.",
        "message_id": f"msg-new-{uid}"
    }, headers=auth_headers)
    assert msg_new_res.status_code == 200
    msg_new = msg_new_res.json()
    assert msg_new["status"] == "Processed"
    assert msg_new["case_id"] is not None

    # 6. Test Live Chats & Case Conversion
    chat_create_res = await client.post("/api/v1/service/chats", json={
        "visitor_name": "Elena Rostova",
        "visitor_email": f"elena.{uid}@aerovance.example",
        "initial_message": "Can you advise on the TLS 1.3 ciphers requirement?",
        "account_id": account_id,
        "contact_id": contact_id
    }, headers=auth_headers)
    assert chat_create_res.status_code == 201
    chat = chat_create_res.json()
    assert chat["ref"].startswith("CHT-")
    chat_id = chat["id"]

    # Send agent response
    msg_chat_res = await client.post(f"/api/v1/service/chats/{chat_id}/messages", json={
        "sender_type": "agent",
        "sender_name": "Sarah Connor",
        "message_text": "Yes, we support TLS_AES_128_GCM_SHA256 and TLS_AES_256_GCM_SHA384."
    }, headers=auth_headers)
    assert msg_chat_res.status_code == 200

    # Convert live chat into formal Case
    convert_res = await client.post(f"/api/v1/service/chats/{chat_id}/convert-to-case", json={
        "subject": "TLS 1.3 Cipher Suite Certification Inquiry",
        "priority": "Normal",
        "category": "Security & Compliance"
    }, headers=auth_headers)
    assert convert_res.status_code == 200
    converted_case = convert_res.json()
    assert converted_case["ref"].startswith("CASE-")
    assert "TLS 1.3" in converted_case["description"]

    # 7. Test Websense Trackers & Visitor Footprints
    trk_res = await client.post("/api/v1/service/trackers", json={
        "name": "Checkout & Architecture Viewer Tracker",
        "domain": "portal.aerovance.example",
        "url_pattern": "/checkout/*",
        "dwell_threshold_seconds": 30,
        "action": "Trigger Live Chat Prompt"
    }, headers=auth_headers)
    assert trk_res.status_code == 201
    tracker = trk_res.json()
    assert tracker["ref"].startswith("TRK-")
    trk_id = tracker["id"]

    # Log visitor dwell event
    evt_res = await client.post("/api/v1/service/trackers/events", json={
        "tracker_id": trk_id,
        "session_id": f"sess-{uid}",
        "page_url": "https://portal.aerovance.example/checkout/enterprise-review",
        "dwell_seconds": 45,
        "contact_id": contact_id
    }, headers=auth_headers)
    assert evt_res.status_code == 200
    evt = evt_res.json()
    assert evt["action_taken"] == "Trigger Live Chat Prompt"

    # 8. Test Support Webforms & Honeypot Spam Filtering
    wf_res = await client.post("/api/v1/service/webforms", json={
        "name": "Partner Escalation Webform",
        "slug": f"partner-escalation-{uid}",
        "title": "Partner Support Escalation",
        "category": "Partner Operations",
        "priority": "High"
    }, headers=auth_headers)
    assert wf_res.status_code == 201
    webform = wf_res.json()
    assert webform["ref"].startswith("WBF-")

    # Clean submission -> Creates case
    sub_clean_res = await client.post(f"/api/v1/portal/webforms/{webform['slug']}/submit", json={
        "submission_data": {
            "name": "Marcus Vance",
            "email": f"marcus.{uid}@partner.example",
            "subject": "Partner API Key Regeneration Needed",
            "description": "Production credentials rotation required due to security audit."
        }
    })
    assert sub_clean_res.status_code == 200
    sub_clean = sub_clean_res.json()
    assert sub_clean["status"] == "Accepted"
    assert sub_clean["case_id"] is not None

    # Bot spam submission with honeypot triggered -> Flagged_Spam, does NOT create case
    sub_spam_res = await client.post(f"/api/v1/portal/webforms/{webform['slug']}/submit", json={
        "submission_data": {
            "name": "SpamBot 3000",
            "email": "bot@automated-spam.invalid"
        },
        "honeypot_field": "I am a hidden bot input"
    })
    assert sub_spam_res.status_code == 200
    sub_spam = sub_spam_res.json()
    assert sub_spam["status"] == "Flagged_Spam"
    assert sub_spam["case_id"] is None

    # 9. Test Appointment Types & Double-Booking Prevention
    at_res = await client.post("/api/v1/service/appointments/types", json={
        "name": "Solutions Architecture Review",
        "slug": f"solutions-arch-{uid}",
        "duration_minutes": 30,
        "buffer_minutes": 15
    }, headers=auth_headers)
    assert at_res.status_code == 201
    atype = at_res.json()
    atype_id = atype["id"]

    slot_start = datetime.now(timezone.utc) + timedelta(days=5, hours=10)
    slot_end = slot_start + timedelta(minutes=30)

    # First booking succeeds
    book_res = await client.post("/api/v1/service/appointments/book", json={
        "appointment_type_id": atype_id,
        "customer_name": "Elena Rostova",
        "customer_email": f"elena.{uid}@aerovance.example",
        "start_time": slot_start.isoformat(),
        "end_time": slot_end.isoformat(),
        "account_id": account_id,
        "contact_id": contact_id
    }, headers=auth_headers)
    assert book_res.status_code == 201
    appt = book_res.json()
    assert appt["ref"].startswith("APT-")

    # Overlapping second booking is blocked by transactional collision check
    overlap_res = await client.post("/api/v1/service/appointments/book", json={
        "appointment_type_id": atype_id,
        "customer_name": "Another Customer",
        "customer_email": "other@example.com",
        "start_time": (slot_start + timedelta(minutes=15)).isoformat(),
        "end_time": (slot_end + timedelta(minutes=15)).isoformat()
    }, headers=auth_headers)
    assert overlap_res.status_code in (400, 422)
    assert "already booked" in overlap_res.text

    # 10. Test Dedicated Customer Portal Endpoints & Security Boundaries
    portal_cases_res = await client.get(f"/api/v1/portal/cases?account_id={account_id}", headers=auth_headers)
    assert portal_cases_res.status_code == 200
    p_cases = portal_cases_res.json()
    assert len(p_cases) >= 1

    # Verify that internal notes are STRICTLY CENSORED in portal responses
    target_p_case = next((c for c in p_cases if c["id"] == case_id), None)
    assert target_p_case is not None
    for comment in target_p_case["comments"]:
        assert comment["is_internal"] is False
        assert "AWS DirectConnect" not in comment["message"]

    # 11. Test Live Service Dashboard Metrics
    metrics_res = await client.get("/api/v1/service/dashboard-metrics", headers=auth_headers)
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics["total_cases"] >= 2
    assert "High" in metrics["priority_distribution"]
    assert metrics["sla_compliance_rate"] >= 0.0
    assert len(metrics["recent_activity"]) >= 1
