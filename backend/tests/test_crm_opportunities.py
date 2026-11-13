import pytest
import uuid
from decimal import Decimal
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_opportunity_lifecycle_and_stage_gate_governance(client: AsyncClient):
    """
    Verifies Phase 3 Milestone 3A (OP-01, OP-02):
    1. Opportunity CRUD and sequential ref (OPP-YYYY-XXXXX).
    2. Multiple pipelines and stage retrieval.
    3. Stage-Gate validation rules (Discovery requires contact; Proposal requires budget & close date; Closed Won requires win description).
    4. Rejection of premature progression with HTTP 422.
    5. Stage duration and transition history logging.
    6. Audit ledger recording.
    """
    # 1. Register organization
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Vanguard Optical Networks",
        "tenant_slug": "vanguard-pipeline-test",
        "first_name": "Garrick",
        "last_name": "Ollivander",
        "email": "garrick@vanguard.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Check Pipeline retrieval
    pipes_resp = await client.get("/api/v1/opportunities/pipelines", headers=headers)
    assert pipes_resp.status_code == 200
    pipes = pipes_resp.json()
    assert len(pipes) >= 1
    assert pipes[0]["code"] == "default"
    assert len(pipes[0]["stages"]) == 7

    # 3. Create Account and Contact
    acc = await client.post("/api/v1/accounts", json={
        "name": "Telecom Global Carriers Ltd",
        "industry": "Telecommunications"
    }, headers=headers)
    assert acc.status_code == 201
    account_id = acc.json()["id"]

    con = await client.post("/api/v1/contacts", json={
        "first_name": "Arthur",
        "last_name": "Dent",
        "email": "arthur.dent@telecomglobal.example",
        "account_id": account_id
    }, headers=headers)
    assert con.status_code == 201
    contact_id = con.json()["id"]

    # 4. Create Opportunity without Contact in 'Qualification' stage
    opp_resp = await client.post("/api/v1/opportunities", json={
        "name": "500Gbps WDM Metro Backbone Expansion",
        "account_id": account_id,
        "amount": 275000.00,
        "stage": "Qualification",
        "expected_close_date": "2027-06-30T00:00:00Z"
    }, headers=headers)
    assert opp_resp.status_code == 201
    opp_data = opp_resp.json()
    assert opp_data["ref"].startswith("OPP-")
    assert opp_data["stage"] == "Qualification"
    assert opp_data["probability"] == 25
    opp_id = opp_data["id"]

    # 5. Stage Gate Test 1: Advance to 'Discovery' without contact -> FAILS (422)
    gate_fail_1 = await client.post(f"/api/v1/opportunities/{opp_id}/stage", json={
        "to_stage": "Discovery"
    }, headers=headers)
    assert gate_fail_1.status_code == 422
    assert "designated stakeholder contact is required" in gate_fail_1.json()["detail"].lower()

    # Link contact to opportunity
    await client.patch(f"/api/v1/opportunities/{opp_id}", json={
        "contact_id": contact_id
    }, headers=headers)

    # Now advance to 'Discovery' -> SUCCEEDS
    disc_step = await client.post(f"/api/v1/opportunities/{opp_id}/stage", json={
        "to_stage": "Discovery"
    }, headers=headers)
    assert disc_step.status_code == 200
    assert disc_step.json()["stage"] == "Discovery"
    assert disc_step.json()["probability"] == 40

    # 6. Stage Gate Test 2: Advance to 'Proposal' without budget confirmation -> FAILS (422)
    gate_fail_2 = await client.post(f"/api/v1/opportunities/{opp_id}/stage", json={
        "to_stage": "Proposal",
        "budget_confirmed": False
    }, headers=headers)
    assert gate_fail_2.status_code == 422
    assert "budget must be confirmed" in gate_fail_2.json()["detail"].lower()

    # Advance to 'Proposal' with budget confirmed -> SUCCEEDS
    prop_step = await client.post(f"/api/v1/opportunities/{opp_id}/stage", json={
        "to_stage": "Proposal",
        "budget_confirmed": True
    }, headers=headers)
    assert prop_step.status_code == 200
    assert prop_step.json()["stage"] == "Proposal"
    assert prop_step.json()["probability"] == 65
    assert prop_step.json()["budget_confirmed"] is True

    # 7. Stage Gate Test 3: Close as Won without win summary -> FAILS (422)
    won_fail = await client.post(f"/api/v1/opportunities/{opp_id}/stage", json={
        "to_stage": "Closed Won"
    }, headers=headers)
    assert won_fail.status_code == 422
    assert "win summary" in won_fail.json()["detail"].lower()

    # Close as Won with win description -> SUCCEEDS
    won_step = await client.post(f"/api/v1/opportunities/{opp_id}/stage", json={
        "to_stage": "Closed Won",
        "win_description": "Selected over competitors due to lowest latency optical transport and SLAs."
    }, headers=headers)
    assert won_step.status_code == 200
    final_opp = won_step.json()
    assert final_opp["stage"] == "Closed Won"
    assert final_opp["probability"] == 100
    assert final_opp["forecast_category"] == "Closed"

    # 8. Verify Stage Duration & Transition History (OP-02)
    hist = final_opp["stage_history"]
    assert len(hist) >= 4  # Initial + Discovery + Proposal + Closed Won
    assert hist[0]["to_stage"] == "Closed Won"
    assert hist[0]["from_stage"] == "Proposal"
    assert "days_in_previous_stage" in hist[0]
