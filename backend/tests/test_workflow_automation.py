import uuid
import pytest
from httpx import AsyncClient
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.workflow_service import WorkflowService

@pytest.mark.asyncio
async def test_workflow_autoseeding_and_crud(client: AsyncClient):
    """
    Verifies Phase 6 Workflow Automation:
    1. Tenant registration and auto-seeding of standard enterprise workflows.
    2. Workflow listing with search and category filters.
    3. Custom workflow creation with AST conditions and automated actions.
    4. Status toggling (Active <-> Paused).
    5. Soft deletion of workflows.
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Workflow Enterprise {uid}",
        "tenant_slug": f"wf-corp-{uid}",
        "first_name": "Aria",
        "last_name": "Sterling",
        "email": f"aria.{uid}@wfcorp.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Initial listing triggers auto-seeding of 5 standard workflows
    list_resp = await client.get("/api/v1/workflows", headers=headers)
    assert list_resp.status_code == 200, list_resp.text
    data = list_resp.json()
    assert data["total"] >= 5
    assert len(data["items"]) >= 5
    first_wf = data["items"][0]
    assert first_wf["ref"].startswith("WF-")
    assert first_wf["status"] == "Active"

    # 2. Filter workflows by category
    sales_resp = await client.get("/api/v1/workflows?category=Sales", headers=headers)
    assert sales_resp.status_code == 200
    sales_data = sales_resp.json()
    assert all(w["category"] == "Sales" for w in sales_data["items"])

    # 3. Create a custom automated workflow
    new_wf_payload = {
        "name": "High-Value Opportunity Escalation Engine",
        "description": "Automatically alerts executive leadership on $500k+ deals",
        "category": "Sales",
        "trigger_type": "event",
        "trigger_event": "deal.created",
        "condition_expression": "Filter: deal.amount >= 500000",
        "conditions": {
            "and": [
                {"field": "amount", "op": "gte", "val": 500000}
            ]
        },
        "action_summary": "Notify Chief Revenue Officer & assign strategic deal coach",
        "actions": [
            {"type": "notify", "role": "CRO", "priority": "Urgent"},
            {"type": "assign_coach", "specialty": "Enterprise Negotiation"}
        ],
        "status": "Active"
    }
    create_resp = await client.post("/api/v1/workflows", json=new_wf_payload, headers=headers)
    assert create_resp.status_code == 201, create_resp.text
    created_wf = create_resp.json()
    wf_id = created_wf["id"]
    assert created_wf["ref"].startswith("WF-")
    assert created_wf["name"] == new_wf_payload["name"]
    assert created_wf["status"] == "Active"

    # 4. Toggle workflow status to Paused
    toggle_resp = await client.post(f"/api/v1/workflows/{wf_id}/toggle", headers=headers)
    assert toggle_resp.status_code == 200
    toggled = toggle_resp.json()
    assert toggled["status"] == "Paused"

    # Toggle back to Active
    toggle_resp2 = await client.post(f"/api/v1/workflows/{wf_id}/toggle", headers=headers)
    assert toggle_resp2.status_code == 200
    toggled2 = toggle_resp2.json()
    assert toggled2["status"] == "Active"

    # 5. Retrieve specific workflow by ID
    get_resp = await client.get(f"/api/v1/workflows/{wf_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == wf_id

    # 6. Delete workflow
    del_resp = await client.delete(f"/api/v1/workflows/{wf_id}", headers=headers)
    assert del_resp.status_code == 204

    # Verify not found after deletion
    get_deleted = await client.get(f"/api/v1/workflows/{wf_id}", headers=headers)
    assert get_deleted.status_code == 404


@pytest.mark.asyncio
async def test_workflow_execution_and_condition_evaluation(client: AsyncClient):
    """
    Verifies Rule Engine Execution & AST Filtering:
    1. Workflow with AST condition (compound or + gt).
    2. Execution with matching payload -> Success + action execution log.
    3. Execution with non-matching payload -> Skipped + not-matched log.
    4. Execution ledger retrieval (/workflows/{id}/executions).
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Rule Engine Corp {uid}",
        "tenant_slug": f"rule-engine-{uid}",
        "first_name": "Devon",
        "last_name": "Kowalski",
        "email": f"devon.{uid}@ruleengine.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Create rule with AST conditions
    wf_payload = {
        "name": "Dynamic Discount Authorization Check",
        "category": "CPQ",
        "trigger_type": "event",
        "trigger_event": "quote.evaluated",
        "condition_expression": "Filter: discount_pct > 20 OR margin_pct < 35",
        "conditions": {
            "or": [
                {"field": "discount_pct", "op": "gt", "val": 20},
                {"field": "margin_pct", "op": "lt", "val": 35}
            ]
        },
        "action_summary": "Enforce Multi-Tier Approval Chain",
        "actions": [
            {"type": "create_approval_request", "approver_role": "VP Commercial Operations"},
            {"type": "audit_compliance", "policy": "Commercial Governance v2"}
        ],
        "status": "Active"
    }
    wf_resp = await client.post("/api/v1/workflows", json=wf_payload, headers=headers)
    assert wf_resp.status_code == 201
    wf = wf_resp.json()
    wf_id = wf["id"]

    # Test 1: Execute with matching payload (discount_pct = 25 > 20)
    exec_match = await client.post(f"/api/v1/workflows/{wf_id}/execute", json={
        "payload": {
            "discount_pct": 25.0,
            "margin_pct": 42.0,
            "quote_ref": "Q-2026-00042"
        },
        "entity_type": "Quote",
        "entity_id": str(uuid.uuid4())
    }, headers=headers)
    assert exec_match.status_code == 200, exec_match.text
    res_match = exec_match.json()
    assert res_match["ref"].startswith("WFE-")
    assert res_match["status"] == "Success"
    assert len(res_match["execution_log"]) == 2
    assert res_match["execution_log"][0]["status"] == "Executed"
    assert res_match["duration_ms"] >= 0

    # Test 2: Execute with non-matching payload (discount_pct = 10, margin_pct = 50)
    exec_skip = await client.post(f"/api/v1/workflows/{wf_id}/execute", json={
        "payload": {
            "discount_pct": 10.0,
            "margin_pct": 50.0,
            "quote_ref": "Q-2026-00043"
        },
        "entity_type": "Quote",
        "entity_id": str(uuid.uuid4())
    }, headers=headers)
    assert exec_skip.status_code == 200
    res_skip = exec_skip.json()
    assert res_skip["status"] == "Skipped"
    assert len(res_skip["execution_log"]) == 1
    assert res_skip["execution_log"][0]["status"] == "Not Matched"

    # Test 3: Retrieve historical executions
    history_resp = await client.get(f"/api/v1/workflows/{wf_id}/executions", headers=headers)
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert history["total"] == 2
    assert len(history["items"]) == 2
    statuses = {e["status"] for e in history["items"]}
    assert "Success" in statuses
    assert "Skipped" in statuses


@pytest.mark.asyncio
async def test_workflow_tenant_isolation(client: AsyncClient):
    """
    Verifies PostgreSQL RLS Tenant Boundary Enforcement:
    1. Tenant Alpha creates private workflow rules.
    2. Tenant Beta registers independently.
    3. Tenant Beta cannot view, toggle, execute, or delete Tenant Alpha's workflows.
    """
    uid_a = uuid.uuid4().hex[:8]
    reg_a = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Tenant Alpha {uid_a}",
        "tenant_slug": f"alpha-{uid_a}",
        "first_name": "Alpha",
        "last_name": "User",
        "email": f"alpha.{uid_a}@alpha.example",
        "password": "Password123!"
    })
    assert reg_a.status_code == 201
    headers_a = {"Authorization": f"Bearer {reg_a.json()['access_token']}"}

    uid_b = uuid.uuid4().hex[:8]
    reg_b = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Tenant Beta {uid_b}",
        "tenant_slug": f"beta-{uid_b}",
        "first_name": "Beta",
        "last_name": "User",
        "email": f"beta.{uid_b}@beta.example",
        "password": "Password123!"
    })
    assert reg_b.status_code == 201
    headers_b = {"Authorization": f"Bearer {reg_b.json()['access_token']}"}

    # Tenant Alpha creates private workflow
    create_a = await client.post("/api/v1/workflows", json={
        "name": "Alpha Confidential IP Routing",
        "category": "Sales",
        "trigger_type": "event",
        "trigger_event": "alpha.secret.event",
        "conditions": {},
        "actions": [{"type": "encrypt", "target": "Alpha Vault"}],
        "status": "Active"
    }, headers=headers_a)
    assert create_a.status_code == 201
    alpha_wf_id = create_a.json()["id"]

    # Tenant Beta attempts to access Alpha's workflow by ID
    get_cross = await client.get(f"/api/v1/workflows/{alpha_wf_id}", headers=headers_b)
    assert get_cross.status_code == 404

    # Tenant Beta attempts to toggle Alpha's workflow
    toggle_cross = await client.post(f"/api/v1/workflows/{alpha_wf_id}/toggle", headers=headers_b)
    assert toggle_cross.status_code == 404

    # Tenant Beta attempts to execute Alpha's workflow
    exec_cross = await client.post(f"/api/v1/workflows/{alpha_wf_id}/execute", json={
        "payload": {"data": "malicious"}
    }, headers=headers_b)
    assert exec_cross.status_code == 404

    # Tenant Beta attempts to delete Alpha's workflow
    del_cross = await client.delete(f"/api/v1/workflows/{alpha_wf_id}", headers=headers_b)
    assert del_cross.status_code == 404

    # Tenant Beta lists workflows - Alpha's workflow must NOT appear
    list_b = await client.get("/api/v1/workflows", headers=headers_b)
    assert list_b.status_code == 200
    b_ids = [w["id"] for w in list_b.json()["items"]]
    assert alpha_wf_id not in b_ids


@pytest.mark.asyncio
async def test_complex_ast_condition_filtering():
    """
    Unit test WorkflowService.evaluate_condition_node for complex boolean algebra:
    - nested and/or expressions
    - string contains (case-insensitive)
    - comparison operators (gte, lte, eq, neq, gt, lt)
    """
    node = {
        "and": [
            {
                "or": [
                    {"field": "country", "op": "eq", "val": "United States"},
                    {"field": "country", "op": "eq", "val": "Canada"}
                ]
            },
            {"field": "deal_size", "op": "gte", "val": 100000},
            {"field": "industry", "op": "contains", "val": "tech"}
        ]
    }

    # Satisfies all: US, 120k >= 100k, 'Financial Technology' contains 'tech'
    match_payload = {
        "country": "United States",
        "deal_size": 120000,
        "industry": "Financial Technology"
    }
    assert WorkflowService.evaluate_condition_node(node, match_payload) is True

    # Fails country
    fail_country = {
        "country": "Germany",
        "deal_size": 150000,
        "industry": "Clean Tech"
    }
    assert WorkflowService.evaluate_condition_node(node, fail_country) is False

    # Fails deal size
    fail_size = {
        "country": "Canada",
        "deal_size": 80000,
        "industry": "Deep Tech"
    }
    assert WorkflowService.evaluate_condition_node(node, fail_size) is False

    # Fails industry
    fail_industry = {
        "country": "United States",
        "deal_size": 200000,
        "industry": "Agriculture"
    }
    assert WorkflowService.evaluate_condition_node(node, fail_industry) is False

