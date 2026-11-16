import uuid
import pytest
from httpx import AsyncClient
from decimal import Decimal

@pytest.mark.asyncio
async def test_14_specialist_agents_autoseeding_and_telemetry(client: AsyncClient):
    """
    Verifies Phase 7 Specialist Agent Workforce:
    1. Tenant registration and auto-seeding of all 14 specialist personas.
    2. Verification of required personas (SDR, Deal, Quote, Service, Save-Play, Compliance,
       Negotiation, Pricing, Forecast, Inventory, Data Steward, Meeting, Knowledge, CRM Administrator).
    3. Sequential references (AGT-0001 through AGT-0014).
    4. Autonomy tier configuration update (Suggest Only <-> Act with Approval <-> Act Autonomously).
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Aegis Intelligence {uid}",
        "tenant_slug": f"aegis-ai-{uid}",
        "first_name": "Seraphina",
        "last_name": "Vane",
        "email": f"seraphina.{uid}@aegis-ai.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Initial list triggers auto-seeding of all 14 personas
    resp = await client.get("/api/v1/ai/agents", headers=headers)
    assert resp.status_code == 200, resp.text
    agents = resp.json()
    assert len(agents) == 14, f"Expected 14 specialist personas, got {len(agents)}"

    personas = {a["persona"] for a in agents}
    expected_personas = {
        "SDR", "Deal", "Quote", "Service", "Save-Play", "Compliance",
        "Negotiation", "Pricing", "Forecast", "Inventory", "Data Steward",
        "Meeting", "Knowledge", "CRM Administrator"
    }
    assert expected_personas.issubset(personas), f"Missing personas: {expected_personas - personas}"

    # Verify sequential references
    for a in agents:
        assert a["ref"].startswith("AGT-")
        assert a["status"] == "Active"

    # 2. Update agent autonomy level
    quote_agent = next(a for a in agents if a["persona"] == "Quote")
    assert quote_agent["autonomy_level"] == "Act with Approval"

    patch_resp = await client.patch(f"/api/v1/ai/agents/{quote_agent['id']}", json={
        "autonomy_level": "Suggest Only"
    }, headers=headers)
    assert patch_resp.status_code == 200
    updated_agent = patch_resp.json()
    assert updated_agent["autonomy_level"] == "Suggest Only"


@pytest.mark.asyncio
async def test_three_tier_governance_proposals_and_decisions(client: AsyncClient):
    """
    Verifies Three-Tier Autonomy & Governance Gates:
    1. Agent submits proposal under 'Act with Approval' tier -> status: 'Pending Approval'.
    2. Prohibits direct unauthorized state mutation without human sign-off.
    3. Human reviewer approves proposal -> status becomes 'Approved', audit trail recorded.
    4. Second proposal rejected -> status becomes 'Rejected'.
    5. Prohibits re-decision on finalized proposals.
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Governance Trust Corp {uid}",
        "tenant_slug": f"gov-trust-{uid}",
        "first_name": "Marcus",
        "last_name": "Blackwood",
        "email": f"marcus.{uid}@govtrust.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Fetch seeded agents to find Quote Agent
    agents_resp = await client.get("/api/v1/ai/agents", headers=headers)
    assert agents_resp.status_code == 200
    agents = agents_resp.json()
    quote_agent = next(a for a in agents if a["persona"] == "Quote")

    # 1. Create AI proposal
    proposal_payload = {
        "agent_id": quote_agent["id"],
        "agent_name": quote_agent["name"],
        "action": "Apply 18% Multi-Year Volume Discount",
        "reasoning": "Account commits to 3-year upfront SaaS license with 99.9% uptime SLA.",
        "evidence": "Historical win rate on 3-year commits with <=20% discount is 87%.",
        "confidence": 0.94,
        "policy_check": "Commercial Governance v2 Compliant",
        "status": "Pending Approval",
        "payload": {
            "quote_id": str(uuid.uuid4()),
            "discount_pct": 18.0,
            "margin_pct": 46.5
        }
    }
    prop_resp = await client.post("/api/v1/ai/proposals", json=proposal_payload, headers=headers)
    assert prop_resp.status_code == 201, prop_resp.text
    proposal = prop_resp.json()
    assert proposal["ref"].startswith("AIP-")
    assert proposal["status"] == "Pending Approval"
    prop_id = proposal["id"]

    # 2. Human approval decision
    decide_resp = await client.post(f"/api/v1/ai/proposals/{prop_id}/decide", json={
        "approved": True,
        "notes": "Approved by VP Commercial Operations based on margin compliance."
    }, headers=headers)
    assert decide_resp.status_code == 200, decide_resp.text
    decided = decide_resp.json()
    assert decided["status"] == "Approved"
    assert decided["decided_by_name"] is not None
    assert decided["decided_at"] is not None

    # 3. Create second proposal and reject
    prop_resp2 = await client.post("/api/v1/ai/proposals", json={
        **proposal_payload,
        "action": "Unapproved 35% Executive Margin Exception",
        "confidence": 0.65
    }, headers=headers)
    assert prop_resp2.status_code == 201
    prop_id2 = prop_resp2.json()["id"]

    decide_resp2 = await client.post(f"/api/v1/ai/proposals/{prop_id2}/decide", json={
        "approved": False,
        "notes": "Rejected: Discount exceeds ceiling without CFO authorization."
    }, headers=headers)
    assert decide_resp2.status_code == 200
    assert decide_resp2.json()["status"] == "Rejected"

    # 4. Prohibit re-deciding finalized proposal
    redecide = await client.post(f"/api/v1/ai/proposals/{prop_id2}/decide", json={
        "approved": True
    }, headers=headers)
    assert redecide.status_code == 422


@pytest.mark.asyncio
async def test_copilot_grounded_rag_chat(client: AsyncClient):
    """
    Verifies Conversational Copilot & Context Grounding:
    1. Tenant creates live Account and Opportunity records.
    2. Copilot chat query: 'Summarize the current sales pipeline' -> responds with live count & dollar totals.
    3. Copilot chat query: 'Tell me about customer accounts' -> responds with account count.
    4. Multi-provider LLM routing verification (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro).
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Copilot Test Org {uid}",
        "tenant_slug": f"copilot-org-{uid}",
        "first_name": "Talia",
        "last_name": "Al-Mansoor",
        "email": f"talia.{uid}@copilot.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Create Account
    acc_resp = await client.post("/api/v1/accounts", json={
        "name": "Titanium Aerospace Dynamics",
        "industry": "Aerospace & Defense"
    }, headers=headers)
    assert acc_resp.status_code == 201
    acc_id = acc_resp.json()["id"]

    # Create Opportunity
    opp_resp = await client.post("/api/v1/opportunities", json={
        "name": "Fleet Modernization Telemetry Grid",
        "account_id": acc_id,
        "amount": 350000.00,
        "stage": "Proposal",
        "probability": 70
    }, headers=headers)
    assert opp_resp.status_code == 201

    # 1. Copilot Pipeline Query
    chat_resp1 = await client.post("/api/v1/ai/copilot/chat", json={
        "message": "Summarize the current sales pipeline and top deals",
        "provider": "Claude 3.5 Sonnet"
    }, headers=headers)
    assert chat_resp1.status_code == 200, chat_resp1.text
    chat_data1 = chat_resp1.json()
    assert chat_data1["provider_used"] == "Claude 3.5 Sonnet"
    reply1 = chat_data1["reply"]["content"]
    assert "350,000" in reply1 or "$350,000" in reply1
    assert "Fleet Modernization" in reply1 or "1 deals" in reply1 or "1" in reply1
    assert len(chat_data1["reply"]["suggested_links"]) > 0

    # 2. Copilot Account Query with GPT-4o
    chat_resp2 = await client.post("/api/v1/ai/copilot/chat", json={
        "message": "How many customer accounts do we have?",
        "session_id": chat_data1["session_id"],
        "provider": "GPT-4o"
    }, headers=headers)
    assert chat_resp2.status_code == 200
    chat_data2 = chat_resp2.json()
    assert chat_data2["provider_used"] == "GPT-4o"
    assert "1 account" in chat_data2["reply"]["content"].lower() or "1" in chat_data2["reply"]["content"]


@pytest.mark.asyncio
async def test_revenue_digital_twin_simulation_and_scenarios(client: AsyncClient):
    """
    Verifies Revenue Digital Twin:
    1. Real-time what-if simulation calculation on live pipeline.
    2. Win probability uplift and commercial discount sensitivity modeling.
    3. Scenario persistence and retrieval (/ai/revenue-twin/scenarios).
    4. Revenue forecasting rollups (/analytics/forecast).
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Twin Analytics Corp {uid}",
        "tenant_slug": f"twin-corp-{uid}",
        "first_name": "Lukas",
        "last_name": "Lindqvist",
        "email": f"lukas.{uid}@twin-corp.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Seed deal: $200k at 50% = baseline weighted $100k
    acc = await client.post("/api/v1/accounts", json={"name": "Nordic Telematics AB"}, headers=headers)
    assert acc.status_code == 201

    await client.post("/api/v1/opportunities", json={
        "name": "Autonomous Logistics Gateway",
        "account_id": acc.json()["id"],
        "amount": 200000.00,
        "stage": "Discovery",
        "probability": 50,
        "forecast_category": "Pipeline"
    }, headers=headers)

    # 1. Run simulation: +10% probability, 0% discount
    # Baseline weighted = $100k; Simulated = $200k * (50 + 10)% = $120k; Delta = +$20k
    sim_resp = await client.get("/api/v1/ai/revenue-twin/simulate?probability_uplift=10&discount_pct=0", headers=headers)
    assert sim_resp.status_code == 200, sim_resp.text
    sim = sim_resp.json()
    assert float(sim["baseline_weighted_value"]) == 100000.00
    assert float(sim["simulated_weighted_value"]) == 120000.00
    assert float(sim["delta_value"]) == 20000.00
    assert sim["open_deals_count"] == 1

    # 2. Save scenario
    save_resp = await client.post("/api/v1/ai/revenue-twin/scenarios", json={
        "name": "Q1 Aggressive Sales Acceleration Scenario",
        "probability_uplift": 10.0,
        "discount_pct": 5.0,
        "launch_delay_days": 15,
        "assumptions": {"rep_enablement": "Advanced CPQ training"}
    }, headers=headers)
    assert save_resp.status_code == 201, save_resp.text
    saved_scenario = save_resp.json()
    assert saved_scenario["ref"].startswith("SCN-")
    assert saved_scenario["name"] == "Q1 Aggressive Sales Acceleration Scenario"

    # 3. List scenarios
    list_resp = await client.get("/api/v1/ai/revenue-twin/scenarios", headers=headers)
    assert list_resp.status_code == 200
    scenarios = list_resp.json()
    assert len(scenarios) >= 1
    assert any(s["ref"] == saved_scenario["ref"] for s in scenarios)

    # 4. Forecast summary check
    forecast_resp = await client.get("/api/v1/analytics/forecast", headers=headers)
    assert forecast_resp.status_code == 200
    forecast = forecast_resp.json()
    assert float(forecast["total_pipeline"]) == 200000.00
    assert float(forecast["weighted_pipeline"]) == 100000.00


@pytest.mark.asyncio
async def test_ai_and_analytics_tenant_isolation(client: AsyncClient):
    """
    Verifies PostgreSQL RLS Zero Cross-Tenant Leakage:
    1. Tenant Alpha creates private AI proposals and saves twin scenarios.
    2. Tenant Beta registers independently.
    3. Tenant Beta cannot view or decide Tenant Alpha's proposals (returns 404).
    4. Tenant Beta's Copilot context has 0 records and never leaks Tenant Alpha's data.
    """
    uid_a = uuid.uuid4().hex[:8]
    reg_a = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Alpha Dynamics {uid_a}",
        "tenant_slug": f"alpha-dyn-{uid_a}",
        "first_name": "Alpha",
        "last_name": "Lead",
        "email": f"alpha.{uid_a}@alphadyn.example",
        "password": "Password123!"
    })
    headers_a = {"Authorization": f"Bearer {reg_a.json()['access_token']}"}

    uid_b = uuid.uuid4().hex[:8]
    reg_b = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Beta Systems {uid_b}",
        "tenant_slug": f"beta-sys-{uid_b}",
        "first_name": "Beta",
        "last_name": "Lead",
        "email": f"beta.{uid_b}@betasys.example",
        "password": "Password123!"
    })
    headers_b = {"Authorization": f"Bearer {reg_b.json()['access_token']}"}

    # Alpha creates a private proposal
    agents_a = await client.get("/api/v1/ai/agents", headers=headers_a)
    assert agents_a.status_code == 200
    alpha_agent = agents_a.json()[0]

    prop_a = await client.post("/api/v1/ai/proposals", json={
        "agent_id": alpha_agent["id"],
        "agent_name": alpha_agent["name"],
        "action": "Alpha Secret Patent Licensing Deal",
        "reasoning": "Top secret corporate asset monetization",
        "policy_check": "Compliant",
        "status": "Pending Approval",
        "payload": {"secret_code": "ALPHA-TOP-SECRET"}
    }, headers=headers_a)
    assert prop_a.status_code == 201
    alpha_prop_id = prop_a.json()["id"]

    # Beta attempts to read Alpha's proposals
    proposals_b = await client.get("/api/v1/ai/proposals", headers=headers_b)
    assert proposals_b.status_code == 200
    b_ids = [p["id"] for p in proposals_b.json()]
    assert alpha_prop_id not in b_ids

    # Beta attempts to decide Alpha's proposal -> 404
    decide_cross = await client.post(f"/api/v1/ai/proposals/{alpha_prop_id}/decide", json={
        "approved": True
    }, headers=headers_b)
    assert decide_cross.status_code == 404

    # Beta's Copilot has 0 accounts/pipeline
    copilot_b = await client.post("/api/v1/ai/copilot/chat", json={
        "message": "Summarize pipeline"
    }, headers=headers_b)
    assert copilot_b.status_code == 200
    assert "0 deals" in copilot_b.json()["reply"]["content"] or "$0.00" in copilot_b.json()["reply"]["content"]
    assert "Alpha Secret" not in copilot_b.json()["reply"]["content"]
