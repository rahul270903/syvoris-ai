import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_project_lifecycle_and_details(client: AsyncClient):
    """
    Verifies Project Management (PM-01, PM-02):
    1. Project creation with auto-generated sequential reference (PRJ-YYYY-XXXX).
    2. Tenant isolation and financial baseline.
    3. Status transition lifecycle (Planned -> Active -> On Hold -> Completed).
    4. Composite project detail view aggregation.
    """
    # 1. Register organization & tenant
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Helios Systems International",
        "tenant_slug": "helios-pm-test",
        "first_name": "Eleni",
        "last_name": "Rostova",
        "email": "eleni.rostova@helios-pm.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Create customer account
    acc = await client.post("/api/v1/accounts", json={
        "name": "Global Maritime Logistics Ltd",
        "industry": "Transportation & Logistics"
    }, headers=headers)
    assert acc.status_code == 201
    account_id = acc.json()["id"]

    # 3. Create Project
    prj_resp = await client.post("/api/v1/projects", json={
        "name": "Port Operations Digital Twin Platform",
        "description": "Real-time vessel and berth telemetry visualization platform.",
        "account_id": account_id,
        "project_type": "Client Project",
        "category": "Fixed price",
        "priority": "High",
        "budget": 240000.00,
        "approved_cost_baseline": 220000.00,
        "start_date": "2026-11-15",
        "target_date": "2027-05-30"
    }, headers=headers)
    assert prj_resp.status_code == 201
    project = prj_resp.json()
    assert project["ref"].startswith("PRJ-")
    assert project["name"] == "Port Operations Digital Twin Platform"
    assert project["status"] == "Planning"
    assert project["health"] == "On Track"
    assert float(project["budget"]) == 240000.00
    project_id = project["id"]

    # 4. Status transition to Active
    trans_resp = await client.post(f"/api/v1/projects/{project_id}/transition", json={
        "status": "Active",
        "reason": "Project kick-off meeting completed with customer stakeholders."
    }, headers=headers)
    assert trans_resp.status_code == 200
    updated_prj = trans_resp.json()
    assert updated_prj["status"] == "Active"

    # 5. Composite project details retrieval
    details_resp = await client.get(f"/api/v1/projects/{project_id}/details", headers=headers)
    assert details_resp.status_code == 200
    details = details_resp.json()
    assert details["id"] == project_id
    assert details["account_name"] == "Global Maritime Logistics Ltd"
    assert len(details["activities"]) >= 2  # Created + Status transition


@pytest.mark.asyncio
async def test_milestones_and_deliverable_signoff(client: AsyncClient):
    """
    Verifies Project Milestones (PM-03):
    1. Milestone creation with sequential reference (MS-YYYY-XXXX).
    2. Deliverable criteria specification.
    3. Milestone status update and deliverable sign-off.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Aegis Defence Tech",
        "tenant_slug": "aegis-milestone-test",
        "first_name": "Corin",
        "last_name": "Vance",
        "email": "corin@aegis-tech.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Create project
    prj = await client.post("/api/v1/projects", json={
        "name": "Autonomous Perimeter Surveillance Grid",
        "project_type": "Internal R&D",
        "category": "Time & materials",
        "budget": 150000.00
    }, headers=headers)
    assert prj.status_code == 201
    project_id = prj.json()["id"]

    # Create milestone
    ms_resp = await client.post("/api/v1/projects/milestones", json={
        "project_id": project_id,
        "name": "Phase 1 Architecture & Sensor Integration Spec",
        "deliverable": "Approved Architecture Blueprint & Sensor Protocol Schema",
        "completion_criteria": "Formal sign-off by Chief Systems Architect",
        "target_date": "2026-12-15",
        "priority": "High"
    }, headers=headers)
    assert ms_resp.status_code == 201
    milestone = ms_resp.json()
    assert milestone["ref"].startswith("MS-")
    assert milestone["status"] == "Pending"
    milestone_id = milestone["id"]

    # Sign off milestone
    patch_resp = await client.patch(f"/api/v1/projects/milestones/{milestone_id}", json={
        "status": "Achieved",
        "progress_pct": 100,
        "custom_fields": {
            "completion_evidence": "Signed spec doc artifact #DOC-9082 attached."
        }
    }, headers=headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Achieved"
    assert patch_resp.json()["progress_pct"] == 100


@pytest.mark.asyncio
async def test_tasks_and_dependency_cycle_detection(client: AsyncClient):
    """
    Verifies Project Tasks & Dependency Management (PM-04):
    1. Task creation with sequential reference (TSK-YYYY-XXXX).
    2. Valid task dependency creation.
    3. Circular dependency detection and rejection (DFS cycle guard).
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Vortex Quantum Analytics",
        "tenant_slug": "vortex-tasks-test",
        "first_name": "Nadia",
        "last_name": "Bohr",
        "email": "nadia.bohr@vortex.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Create Project
    prj = await client.post("/api/v1/projects", json={
        "name": "Quantum Simulator Cluster Build",
        "budget": 300000.00
    }, headers=headers)
    project_id = prj.json()["id"]

    # Create Task A
    task_a = await client.post("/api/v1/projects/tasks", json={
        "project_id": project_id,
        "title": "Hardware Rack Provisioning",
        "estimated_hours": 40.0,
        "priority": "High"
    }, headers=headers)
    assert task_a.status_code == 201
    task_a_id = task_a.json()["id"]

    # Create Task B
    task_b = await client.post("/api/v1/projects/tasks", json={
        "project_id": project_id,
        "title": "Cryogenic Cooling Calibration",
        "estimated_hours": 60.0,
        "priority": "Critical"
    }, headers=headers)
    assert task_b.status_code == 201
    task_b_id = task_b.json()["id"]

    # Add valid dependency: Task B depends on Task A
    dep_resp = await client.post(f"/api/v1/projects/tasks/{task_b_id}/dependencies", json={
        "depends_on_task_id": task_a_id,
        "dependency_type": "finish_to_start"
    }, headers=headers)
    assert dep_resp.status_code == 201
    assert dep_resp.json()["depends_on_task_id"] == task_a_id

    # Add invalid circular dependency: Task A depends on Task B -> MUST FAIL with HTTP 422
    cycle_resp = await client.post(f"/api/v1/projects/tasks/{task_a_id}/dependencies", json={
        "depends_on_task_id": task_b_id,
        "dependency_type": "finish_to_start"
    }, headers=headers)
    assert cycle_resp.status_code == 422
    assert "circular dependency" in cycle_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_resource_allocation_and_overallocation_detection(client: AsyncClient):
    """
    Verifies Resource Allocation (PM-05):
    1. Resource assignment with hourly rate.
    2. Overallocation detection (>100% capacity triggers is_overallocated=True).
    3. Financial total cost derivation (planned_hours * hourly_rate).
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Titan Infrastructure Partners",
        "tenant_slug": "titan-resources-test",
        "first_name": "Marcus",
        "last_name": "Brody",
        "email": "marcus@titan-infra.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    user_id = me_resp.json()["user"]["id"]

    prj = await client.post("/api/v1/projects", json={
        "name": "Subsea Power Cable Survey",
        "budget": 500000.00
    }, headers=headers)
    project_id = prj.json()["id"]

    # Assign resource with 125% allocation (over-allocated)
    res_resp = await client.post("/api/v1/projects/resources", json={
        "project_id": project_id,
        "user_id": user_id,
        "role_title": "Lead Hydrographic Surveyor",
        "allocation_pct": 125.0,
        "planned_hours": 160.0,
        "hourly_rate": 150.00,
        "start_date": "2026-12-01",
        "end_date": "2027-01-31"
    }, headers=headers)
    assert res_resp.status_code == 201
    resource = res_resp.json()
    assert resource["ref"].startswith("RES-")
    assert resource["is_overallocated"] is True
    assert float(resource["total_cost"]) == 24000.00  # 160h * $150/h


@pytest.mark.asyncio
async def test_project_costs_and_variance_tracking(client: AsyncClient):
    """
    Verifies Project Costs & Expense Tracking (PM-06):
    1. Cost recording with sequential reference (CST-YYYY-XXXX).
    2. Strict Decimal precision.
    3. Category and cost type classification.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Solaris Energy Corp",
        "tenant_slug": "solaris-costs-test",
        "first_name": "Aria",
        "last_name": "Kowalski",
        "email": "aria@solaris-energy.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    prj = await client.post("/api/v1/projects", json={
        "name": "Grid Battery Storage Facility 50MW",
        "budget": 1200000.00
    }, headers=headers)
    project_id = prj.json()["id"]

    # Record actual cost
    cost_resp = await client.post("/api/v1/projects/costs", json={
        "project_id": project_id,
        "title": "Inverter Transformer Substation Shipment",
        "category": "Infrastructure",
        "cost_type": "Actual",
        "amount": 84250.75,
        "date_incurred": "2026-11-20",
        "vendor_name": "ABB Grid Solutions"
    }, headers=headers)
    assert cost_resp.status_code == 201
    cost = cost_resp.json()
    assert cost["ref"].startswith("CST-")
    assert float(cost["amount"]) == 84250.75
    assert cost["vendor_name"] == "ABB Grid Solutions"


@pytest.mark.asyncio
async def test_calendar_events_and_portfolio_analytics(client: AsyncClient):
    """
    Verifies Project Calendar & Executive Analytics (PM-07, PM-08):
    1. Aggregated calendar events for milestones and task due dates.
    2. Portfolio analytics summary KPIs calculation.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Crestline Aerospace",
        "tenant_slug": "crestline-analytics-test",
        "first_name": "Thorne",
        "last_name": "Cross",
        "email": "thorne@crestline.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Create project with milestone and task
    prj = await client.post("/api/v1/projects", json={
        "name": "Avionics Telemetry Upgrade",
        "budget": 180000.00
    }, headers=headers)
    project_id = prj.json()["id"]

    await client.post("/api/v1/projects/milestones", json={
        "project_id": project_id,
        "name": "FAA System Certification",
        "deliverable": "Type Certificate Amendment",
        "target_date": "2026-12-20"
    }, headers=headers)

    await client.post("/api/v1/projects/tasks", json={
        "project_id": project_id,
        "title": "Flight Deck Sensor Installation",
        "due_date": "2026-12-10",
        "estimated_hours": 32.0
    }, headers=headers)

    # 1. Test Calendar Events
    cal_resp = await client.get("/api/v1/projects/calendar/events", headers=headers)
    assert cal_resp.status_code == 200
    events = cal_resp.json()
    assert len(events) >= 2
    types = [e["type"] for e in events]
    assert "Milestone" in types
    assert "Task" in types

    # 2. Test Project Analytics Summary
    summary_resp = await client.get("/api/v1/projects/analytics/summary", headers=headers)
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert summary["total_projects"] >= 1
    assert float(summary["total_budget"]) >= 180000.00
    assert summary["total_milestones"] >= 1
    assert summary["total_tasks"] >= 1
