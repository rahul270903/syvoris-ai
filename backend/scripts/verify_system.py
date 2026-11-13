import asyncio
import os
import sys
import sqlite3
import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.services.rbac_service import rbac_service

async def run_comprehensive_verification():
    print("=" * 70)
    print("  SYVORIS Ai™ — COMPREHENSIVE MULTI-TIER SYSTEM VERIFICATION")
    print("=" * 70)
    results = {}

    # ---------------------------------------------------------
    # 1. DATABASE TIER INTEGRITY
    # ---------------------------------------------------------
    print("\n[TIER 1: DATABASE INTEGRITY & SCHEMA AUDIT]")
    db_path = "syvoris_dev.db"
    if not os.path.exists(db_path):
        db_path = os.path.join(backend_dir, "syvoris_dev.db")
    
    print(f"Target Database File: {os.path.abspath(db_path)}")
    assert os.path.exists(db_path), f"Database file not found: {db_path}"

    con = sqlite3.connect(db_path)
    cur = con.cursor()

    # SQLite integrity check
    integrity = cur.execute("PRAGMA integrity_check").fetchall()
    print(f"  ✓ PRAGMA integrity_check: {integrity[0][0]}")
    assert integrity[0][0] == "ok", "Database integrity check failed!"

    # Check foreign keys
    fk_errors = cur.execute("PRAGMA foreign_key_check").fetchall()
    print(f"  ✓ PRAGMA foreign_key_check: {len(fk_errors)} violations")

    # Table count & schema check
    tables = [t[0] for t in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    print(f"  ✓ Registered Tables: {len(tables)} tables found")
    
    expected_core_tables = [
        "tenants", "organization_settings", "users", "tenant_memberships",
        "roles", "permissions", "role_permissions", "user_roles",
        "audit_events", "refresh_tokens",
        "accounts", "contacts", "leads", "crm_activities",
        "opportunities", "opportunity_stage_history", "pipelines",
        "products", "price_books", "price_book_entries",
        "quotes", "quote_line_items",
        "approval_requests", "sales_orders", "order_line_items",
        "invoices"
    ]
    missing_tables = [tbl for tbl in expected_core_tables if tbl not in tables]
    if missing_tables:
        print(f"  ✗ WARNING: Missing tables: {missing_tables}")
    else:
        print("  ✓ All 26 expected core & commercial tables are present.")

    # Record counts
    print("\n  Current Record Counts:")
    for tbl in ["tenants", "users", "roles", "permissions", "accounts", "contacts", "leads", "opportunities", "products", "price_books", "quotes", "sales_orders", "invoices", "audit_events"]:
        if tbl in tables:
            cnt = cur.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
            print(f"    - {tbl:<25}: {cnt}")

    results["database_integrity"] = "PASSED"
    con.close()

    # ---------------------------------------------------------
    # 2. BACKEND API & LIFECYCLE VERIFICATION (via ASGI client)
    # ---------------------------------------------------------
    print("\n[TIER 2: BACKEND API END-TO-END FLOW VERIFICATION]")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # A. Health Check
        health = await client.get("/api/v1/health")
        print(f"  ✓ Health Check (/api/v1/health): status {health.status_code}")
        assert health.status_code == 200
        health_data = health.json()
        print(f"    Platform: {health_data.get('platform')}, Status: {health_data.get('status')}")

        # B. Onboard new isolated verification tenant
        tenant_slug = f"verify-{uuid.uuid4().hex[:8]}"
        reg_res = await client.post("/api/v1/auth/register", json={
            "organization_name": "Apex Enterprise Systems",
            "tenant_slug": tenant_slug,
            "first_name": "Marcus",
            "last_name": "Vance",
            "email": f"marcus@{tenant_slug}.com",
            "password": "SecurePassword123!"
        })
        print(f"  ✓ Tenant Self-Registration: status {reg_res.status_code}")
        assert reg_res.status_code == 201
        auth_data = reg_res.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        perms = auth_data.get("permissions", [])
        print(f"    Tenant: {auth_data.get('tenant_slug')}, Role: {auth_data.get('role')}, Permissions Granted: {len(perms)}")
        assert "opportunities:read" in perms
        assert "quotes:read" in perms
        assert "campaigns:read" in perms
        assert "cases:read" in perms

        # C. Lead Capture & Qualification
        lead_res = await client.post("/api/v1/leads", json={
            "first_name": "Sophia",
            "last_name": "Chen",
            "company_name": "Starlight Photonics",
            "email": f"sophia@{tenant_slug}.com",
            "phone": "+1-555-0199",
            "source": "Website",
            "industry": "DeepTech Hardware",
            "territory": "North America",
            "description": "High intent prospective enterprise client inquiring about photonics instrumentation."
        }, headers=headers)
        print(f"  ✓ Lead Creation: status {lead_res.status_code}")
        assert lead_res.status_code == 201
        lead = lead_res.json()
        print(f"    Lead Ref: {lead['ref']}, Fit Score: {lead['score']}, Status: {lead['status']}")

        # Qualify lead
        qual_res = await client.patch(f"/api/v1/leads/{lead['id']}", json={"status": "Qualified"}, headers=headers)
        print(f"  ✓ Lead Qualification: status {qual_res.status_code}")
        assert qual_res.status_code == 200

        # D. Atomic Lead Conversion
        conv_res = await client.post(f"/api/v1/leads/{lead['id']}/convert", json={
            "create_account": True,
            "account_name": "Starlight Photonics Inc.",
            "create_contact": True,
            "create_opportunity": True,
            "opportunity_name": "Starlight — Quantum Laser Hardware Deal",
            "opportunity_amount": "125000.00"
        }, headers=headers)
        print(f"  ✓ Atomic Lead Conversion: status {conv_res.status_code}")
        assert conv_res.status_code == 200
        conv_data = conv_res.json()
        account_id = conv_data["account"]["id"]
        contact_id = conv_data["contact"]["id"]
        opportunity_id = conv_data["opportunity"]["id"]
        print(f"    Created Account: {conv_data['account']['name']} ({conv_data['account']['ref']})")
        print(f"    Created Contact: {conv_data['contact']['full_name']} ({conv_data['contact']['ref']})")
        print(f"    Created Opportunity: {conv_data['opportunity']['name']} ({conv_data['opportunity']['ref']})")

        # E. Opportunity Stage Gate Progression
        opp_res = await client.post(f"/api/v1/opportunities/{opportunity_id}/stage", json={
            "to_stage": "Qualification",
            "notes": "Discovery meeting completed with technical and commercial sponsors."
        }, headers=headers)
        print(f"  ✓ Opportunity Stage Gate Transition -> Qualification: status {opp_res.status_code}")
        assert opp_res.status_code == 200

        # F. Product Catalog & Price Book Setup
        prod_res = await client.post("/api/v1/products", json={
            "name": "Quantum Precision Laser Module L-900",
            "sku": f"SKU-QPL-{uuid.uuid4().hex[:6].upper()}",
            "category": "Hardware",
            "standard_price": "25000.00",
            "cost_price": "14000.00",
            "tax_category": "Standard",
            "tax_rate": "8.50"
        }, headers=headers)
        print(f"  ✓ Product Catalog Creation: status {prod_res.status_code}")
        assert prod_res.status_code == 201
        product = prod_res.json()

        pb_res = await client.post("/api/v1/price-books", json={
            "name": "Enterprise Strategic 2026",
            "currency": "USD",
            "is_default": False,
            "entries": [
                {
                    "product_id": product["id"],
                    "list_price": "24000.00",
                    "currency": "USD"
                }
            ]
        }, headers=headers)
        print(f"  ✓ Commercial Price Book Creation with Entries: status {pb_res.status_code}")
        assert pb_res.status_code == 201
        price_book = pb_res.json()
        print(f"    Price Book Ref: {price_book['id']}, Entries: {len(price_book['entries'])}")

        # G. Server-Authoritative CPQ Calculation Engine
        cpq_calc = await client.post("/api/v1/cpq/calculate", json={
            "lines": [
                {
                    "product_id": product["id"],
                    "item_name": "Quantum Precision Laser Module L-900",
                    "sku": product["sku"],
                    "quantity": "5",
                    "unit_price": "24000.00",
                    "discount_percent": "10.00",
                    "tax_rate": "8.50",
                    "unit_cost": "14000.00"
                }
            ],
            "header_discount_percent": "5.00"
        }, headers=headers)
        print(f"  ✓ Server-Authoritative CPQ Calculation: status {cpq_calc.status_code}")
        assert cpq_calc.status_code == 200
        calc = cpq_calc.json()
        print(f"    Subtotal: ${calc['subtotal']}, Total Discount: ${calc['total_discount']}, Grand Total: ${calc['grand_total']}, Margin: {calc['margin_pct']}%")
        assert Decimal(calc["grand_total"]) > 0

        # H. Quoting, Line Items & Threshold Approval
        quote_res = await client.post("/api/v1/quotes", json={
            "name": "Quantum Instrumentation Proposal",
            "opportunity_id": opportunity_id,
            "account_id": account_id,
            "contact_id": contact_id,
            "price_book_id": price_book["id"],
            "header_discount_pct": "18.00", # triggers discount approval (> 15%)
            "valid_until": "2026-12-31",
            "lines": [
                {
                    "product_id": product["id"],
                    "item_name": "Quantum Precision Laser Module L-900",
                    "sku": product["sku"],
                    "quantity": "4",
                    "unit_price": "24000.00",
                    "discount_pct": "5.00",
                    "tax_rate": "8.50"
                }
            ]
        }, headers=headers)
        print(f"  ✓ Multi-Line Quotation Creation: status {quote_res.status_code}")
        assert quote_res.status_code == 201
        quote = quote_res.json()
        print(f"    Quote Ref: {quote['ref']}, Status: {quote['status']}, Grand Total: ${quote['grand_total']}")

        # Submit for approval
        sub_app = await client.post(f"/api/v1/quotes/{quote['id']}/submit-approval", json={
            "justification": "Strategic initial placement with flagship deeptech account."
        }, headers=headers)
        print(f"  ✓ Quote Submitted for Governance Approval: status {sub_app.status_code}")
        assert sub_app.status_code == 200
        assert sub_app.json()["status"] == "Pending Approval"

        # Manager Approval Decision
        dec_res = await client.post(f"/api/v1/quotes/{quote['id']}/approve", json={
            "approved": True,
            "comments": "Approved by Commercial Operations Director."
        }, headers=headers)
        print(f"  ✓ Commercial Governance Approval Granted: status {dec_res.status_code}")
        assert dec_res.status_code == 200
        assert dec_res.json()["status"] == "Approved"

        # I. Customer Acceptance & Atomic Order Conversion
        accept_res = await client.post(f"/api/v1/quotes/{quote['id']}/accept", json={
            "notes": "Signed commercial agreement received."
        }, headers=headers)
        print(f"  ✓ Quote Acceptance & Automatic Sales Order Generation: status {accept_res.status_code}")
        assert accept_res.status_code == 200
        so_data = accept_res.json()
        sales_order_id = so_data["id"]
        assert sales_order_id is not None
        print(f"    Generated Sales Order: Ref {so_data['ref']} (ID: {sales_order_id})")

        # Verify Opportunity is now Closed Won
        opp_after = await client.get(f"/api/v1/opportunities/{opportunity_id}", headers=headers)
        assert opp_after.status_code == 200
        print(f"  ✓ Linked Opportunity Status Post-Acceptance: '{opp_after.json()['stage']}' (Closed Won confirmed)")
        assert opp_after.json()["stage"] == "Closed Won"

        # J. Order Fulfilment & Customer Invoice Generation
        inv_gen_res = await client.post(f"/api/v1/sales-orders/{sales_order_id}/invoice", headers=headers)
        print(f"  ✓ Customer Invoice Generation: status {inv_gen_res.status_code}")
        assert inv_gen_res.status_code == 201
        invoice = inv_gen_res.json()
        print(f"    Invoice Ref: {invoice['ref']}, Status: {invoice['status']}, Total: ${invoice['total_amount']}, Balance: ${invoice['balance_due']}")

        # Record Payment
        pay_res = await client.post(f"/api/v1/invoices/{invoice['id']}/payment", json={
            "amount": invoice["total_amount"],
            "notes": "Full wire transfer payment received."
        }, headers=headers)
        print(f"  ✓ Customer Payment Recording: status {pay_res.status_code}")
        assert pay_res.status_code == 200
        paid_inv = pay_res.json()
        print(f"    Updated Invoice Status: {paid_inv['status']}, Remaining Balance: ${paid_inv['balance_due']}")
        assert Decimal(paid_inv["balance_due"]) == Decimal("0.00")

        # K. Immutable Security Audit Trail Verification
        audit_res = await client.get("/api/v1/admin/audit/?limit=20", headers=headers)
        print(f"  ✓ Security Audit Trail Retrieval: status {audit_res.status_code}")
        assert audit_res.status_code == 200
        events = audit_res.json()
        print(f"    Total Audit Events captured for this session: {len(events)}")
        actions_logged = [e["action"] for e in events]
        print(f"    Captured Action Events: {', '.join(set(actions_logged))}")
        assert len(events) >= 5, "Audit events were not properly persisted!"

        # ---------------------------------------------------------
        # TIER 3: MARKETING & CUSTOMER EXPERIENCE VERIFICATION
        # ---------------------------------------------------------
        print("\n[TIER 3: MARKETING & CUSTOMER EXPERIENCE END-TO-END FLOW]")

        # L. Campaign Management & Attribution
        camp_res = await client.post("/api/v1/campaigns", json={
            "name": "Global DeepTech Growth Campaign 2026",
            "type": "Email",
            "channel": "Email",
            "budget": "50000.00",
            "actual_cost": "15000.00",
            "expected_revenue": "300000.00",
            "target_audience": "Photonics and Hardware CTOs",
            "objective": "Generate high-value SQLs."
        }, headers=headers)
        print(f"  ✓ Campaign Creation: status {camp_res.status_code}")
        assert camp_res.status_code == 201
        camp = camp_res.json()
        campaign_id = camp["id"]
        print(f"    Campaign Ref: {camp['ref']}, Status: {camp['status']}")

        # Transition campaign to Active
        c_stat_res = await client.post(f"/api/v1/campaigns/{campaign_id}/status?new_status=Active", headers=headers)
        print(f"  ✓ Campaign Status Transition -> Active: status {c_stat_res.status_code}")
        assert c_stat_res.status_code == 200

        # Add member to campaign
        cm_res = await client.post(f"/api/v1/campaigns/{campaign_id}/members", json={
            "lead_id": lead["id"],
            "status": "Responded",
            "engagement_score": 25
        }, headers=headers)
        print(f"  ✓ Campaign Member Added: status {cm_res.status_code}")
        assert cm_res.status_code == 201

        # Attribution
        attr_res = await client.get(f"/api/v1/campaigns/{campaign_id}/attribution", headers=headers)
        print(f"  ✓ Campaign Attribution & ROI Calculation: status {attr_res.status_code}")
        assert attr_res.status_code == 200
        attr = attr_res.json()
        print(f"    Attribution: Leads: {attr['leads_count']}, Converted: {attr['converted_leads_count']}, ROI: {attr['roi_percentage']}%")

        # M. Audience Segmentation
        seg_res = await client.post("/api/v1/segments", json={
            "name": "High-Value Hardware Leads Segment",
            "segment_type": "Dynamic",
            "target_entity": "leads",
            "filter_criteria": {"source": "Website"}
        }, headers=headers)
        print(f"  ✓ Audience Segment Creation: status {seg_res.status_code}")
        assert seg_res.status_code == 201
        seg = seg_res.json()
        segment_id = seg["id"]

        eval_res = await client.post(f"/api/v1/segments/{segment_id}/evaluate", headers=headers)
        print(f"  ✓ Dynamic Audience Segment Evaluation: status {eval_res.status_code}, Members: {eval_res.json().get('member_count')}")
        assert eval_res.status_code == 200

        # N. Email Templates & Personalization
        tpl_res = await client.post("/api/v1/email-templates", json={
            "name": "Executive Photonics Briefing",
            "subject": "Exclusive Invitation: Advanced Photonics for {{company}}",
            "category": "Invitation",
            "body_html": "<p>Dear {{first_name}}, we invite {{company}} to an exclusive briefing.</p>",
            "merge_tags": ["first_name", "company"]
        }, headers=headers)
        print(f"  ✓ Email Template Creation: status {tpl_res.status_code}")
        assert tpl_res.status_code == 201
        tpl = tpl_res.json()
        print(f"    Template Ref: {tpl['ref']}, Merge Tags: {tpl['merge_tags']}")

        # O. SLA Policies & Customer Support Cases
        sla_res = await client.get("/api/v1/service/sla", headers=headers)
        print(f"  ✓ SLA Policy Auto-Seeding & Retrieval: status {sla_res.status_code}")
        assert sla_res.status_code == 200
        policies = sla_res.json()
        print(f"    Active SLA Policies: {len(policies)} policies configured")
        assert len(policies) >= 4

        case_res = await client.post("/api/v1/cases", json={
            "subject": "Laser Calibration Variance on Production Line 3",
            "description": "Output power deviation exceeded 0.05% threshold.",
            "account_id": account_id,
            "contact_id": contact_id,
            "priority": "High",
            "category": "Hardware",
            "channel": "Portal",
            "sentiment": "Neutral"
        }, headers=headers)
        print(f"  ✓ Customer Support Case Lodged: status {case_res.status_code}")
        assert case_res.status_code == 201
        case = case_res.json()
        case_id = case["id"]
        print(f"    Case Ref: {case['ref']}, SLA Response Deadline: {case['sla_response_deadline']}")
        assert case["sla_response_deadline"] is not None

        # Add comment
        comm_res = await client.post(f"/api/v1/cases/{case_id}/comments", json={
            "message": "Field service technician dispatched to verify optical sensor alignment.",
            "is_internal": True,
            "channel": "Portal"
        }, headers=headers)
        print(f"  ✓ Case Staff Comment Added: status {comm_res.status_code}")
        assert comm_res.status_code == 201

        # Transition to Awaiting Customer (SLA pause)
        trans1_res = await client.post(f"/api/v1/cases/{case_id}/transition", json={
            "target_status": "Awaiting Customer",
            "notes": "Awaiting customer diagnostic logs from cleanroom sensor."
        }, headers=headers)
        print(f"  ✓ Case Transition -> Awaiting Customer (Clock Paused): status {trans1_res.status_code}")
        assert trans1_res.status_code == 200
        assert trans1_res.json()["sla_paused_at"] is not None

        # Transition to Resolved
        trans2_res = await client.post(f"/api/v1/cases/{case_id}/transition", json={
            "target_status": "Resolved",
            "resolution_summary": "Optical sensor recalibrated and alignment lock confirmed.",
            "csat_score": 5
        }, headers=headers)
        print(f"  ✓ Case Transition -> Resolved (Clock Stopped): status {trans2_res.status_code}")
        assert trans2_res.status_code == 200
        assert trans2_res.json()["resolved_at"] is not None

        # P. Customer CSAT Survey & Feedback
        surveys_res = await client.get("/api/v1/surveys", headers=headers)
        assert surveys_res.status_code == 200
        surveys = surveys_res.json()
        survey_id = surveys[0]["id"]

        survey_resp = await client.post("/api/v1/surveys/responses", json={
            "survey_id": survey_id,
            "case_id": case_id,
            "account_id": account_id,
            "score": 5,
            "sentiment": "Positive",
            "feedback_text": "Exceptional field technician support and immediate calibration resolution."
        }, headers=headers)
        print(f"  ✓ Customer CSAT Survey Response Submitted: status {survey_resp.status_code}")
        assert survey_resp.status_code == 201

        csat_res = await client.get("/api/v1/surveys/csat-summary", headers=headers)
        print(f"  ✓ Aggregate CSAT & NPS Metrics: status {csat_res.status_code}")
        assert csat_res.status_code == 200
        csat_data = csat_res.json()
        print(f"    Total Feedback: {csat_data['total_responses']}, CSAT: {csat_data['csat_percentage']}%, NPS: {csat_data['nps_score']}")

        # Q. Knowledge Base
        kb_res = await client.post("/api/v1/knowledge", json={
            "title": "Quantum Precision Laser Recalibration Standard Operating Procedure",
            "category": "Maintenance",
            "summary": "Standard alignment and calibration procedure for L-900 series modules.",
            "content": "<p>Ensure ambient temperature is 20C +/- 1C before running optical diagnostic routine.</p>",
            "visibility": "Customer-facing",
            "status": "Published"
        }, headers=headers)
        print(f"  ✓ Knowledge Base Article Creation: status {kb_res.status_code}")
        assert kb_res.status_code == 201
        kb = kb_res.json()

        vote_res = await client.post(f"/api/v1/knowledge/{kb['id']}/helpful", headers=headers)
        print(f"  ✓ Knowledge Article Helpful Voting: status {vote_res.status_code}, Upvotes: {vote_res.json().get('helpful_count')}")
        assert vote_res.status_code == 200

        # R. Customer 360 Verification with Cases
        c360_res = await client.get(f"/api/v1/accounts/{account_id}/360", headers=headers)
        print(f"  ✓ Customer 360 Support Cases Integration: status {c360_res.status_code}")
        assert c360_res.status_code == 200
        c360 = c360_res.json()
        print(f"    Customer 360 Linked Cases: {len(c360.get('cases', []))}, Total Cases Metric: {c360.get('metrics', {}).get('total_cases')}")
        assert len(c360.get("cases", [])) >= 1

    results["backend_e2e_flow"] = "PASSED"

    print("\n" + "=" * 70)
    print("  ALL TIERS VERIFIED CLEANLY — NO REGRESSIONS DETECTED")
    print("=" * 70)
    return results

if __name__ == "__main__":
    asyncio.run(run_comprehensive_verification())
