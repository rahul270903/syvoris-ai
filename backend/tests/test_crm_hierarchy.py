import pytest
import uuid
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_account_hierarchy_and_cycle_prevention(client: AsyncClient):
    """
    Verifies CR-02 Parent-Child Hierarchy Engine:
    1. Creating multi-tiered accounts (Grandparent -> Parent -> Child).
    2. Hierarchy retrieval returns root, correct depths, and rolled up metrics.
    3. Cycle prevention rejects self-parenting and circular references with 422.
    """
    # 1. Register organization
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Titan Aerospace Holding",
        "tenant_slug": "titan-aerospace-hierarchy",
        "first_name": "Eleanor",
        "last_name": "Vance",
        "email": "eleanor@titanaero.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Create Grandparent Account (Holding)
    gp_resp = await client.post("/api/v1/accounts", json={
        "name": "Titan Aerospace Global Holdings",
        "account_type": "Enterprise",
        "industry": "Aerospace & Defense"
    }, headers=headers)
    assert gp_resp.status_code == 201
    gp_id = gp_resp.json()["id"]

    # 3. Create Parent Account (Subsidiary) pointing to Grandparent
    p_resp = await client.post("/api/v1/accounts", json={
        "name": "Titan Defense Systems LLC",
        "account_type": "Customer",
        "parent_id": gp_id
    }, headers=headers)
    assert p_resp.status_code == 201
    p_id = p_resp.json()["id"]

    # 4. Create Child Account (Operating Unit) pointing to Parent
    c_resp = await client.post("/api/v1/accounts", json={
        "name": "Titan Avionics Division",
        "account_type": "Customer",
        "parent_id": p_id
    }, headers=headers)
    assert c_resp.status_code == 201
    c_id = c_resp.json()["id"]

    # 5. Fetch hierarchy from Child node - should traverse up to Grandparent and return full tree
    hier_resp = await client.get(f"/api/v1/accounts/{c_id}/hierarchy", headers=headers)
    assert hier_resp.status_code == 200
    hier = hier_resp.json()

    assert hier["root"]["id"] == gp_id
    assert hier["root"]["depth"] == 0
    assert hier["current_account_id"] == c_id
    assert hier["total_hierarchy_accounts"] == 3
    assert hier["max_depth"] == 2

    # Verify children nesting
    assert len(hier["root"]["children"]) == 1
    child_level_1 = hier["root"]["children"][0]
    assert child_level_1["id"] == p_id
    assert child_level_1["depth"] == 1
    assert len(child_level_1["children"]) == 1
    child_level_2 = child_level_1["children"][0]
    assert child_level_2["id"] == c_id
    assert child_level_2["depth"] == 2

    # 6. Cycle Prevention Test 1: Self-parenting
    self_cycle = await client.patch(f"/api/v1/accounts/{p_id}", json={
        "parent_id": p_id
    }, headers=headers)
    assert self_cycle.status_code == 422
    assert "cannot be its own parent" in self_cycle.json()["detail"].lower()

    # 7. Cycle Prevention Test 2: Circular Ancestor Assignment (Assign Child as Parent of Grandparent)
    circ_cycle = await client.patch(f"/api/v1/accounts/{gp_id}", json={
        "parent_id": c_id
    }, headers=headers)
    assert circ_cycle.status_code == 422
    assert "cyclic" in circ_cycle.json()["detail"].lower()

    # 8. Verify hierarchy remains intact and clean after rejected cycles
    hier_check = await client.get(f"/api/v1/accounts/{gp_id}/hierarchy", headers=headers)
    assert hier_check.status_code == 200
    assert hier_check.json()["total_hierarchy_accounts"] == 3
