import uuid
import json
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_commercial_plans_and_default_subscription(client: AsyncClient):
    """
    Verifies Phase 9 Commercial Plans & Auto-Seeding:
    1. Query all 4 commercial SaaS tiers (Starter, Professional, Enterprise, Ultimate).
    2. Tenant registration & auto-initialization of Starter subscription.
    3. Auto-initialization of 30-day Usage Meter with Starter quotas.
    """
    # 1. Query Plans
    plans_resp = await client.get("/api/v1/billing/plans")
    assert plans_resp.status_code == 200, plans_resp.text
    plans = plans_resp.json()
    assert len(plans) == 4

    tiers = {p["tier"] for p in plans}
    assert tiers == {"Starter", "Professional", "Enterprise", "Ultimate"}

    starter = next(p for p in plans if p["tier"] == "Starter")
    assert starter["monthly_price"] == 49.0
    assert starter["seats_limit"] == 5
    assert starter["ai_tokens_limit"] == 50000

    enterprise = next(p for p in plans if p["tier"] == "Enterprise")
    assert enterprise["seats_limit"] == 100
    assert enterprise["ai_tokens_limit"] == 2000000

    # 2. Register Tenant
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Vanguard SaaS {uid}",
        "tenant_slug": f"vanguard-{uid}",
        "first_name": "Victor",
        "last_name": "Stone",
        "email": f"victor.{uid}@vanguard.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 3. Query Default Subscription
    sub_resp = await client.get("/api/v1/billing/subscription", headers=headers)
    assert sub_resp.status_code == 200, sub_resp.text
    sub = sub_resp.json()
    assert sub["plan_tier"] == "Starter"
    assert sub["status"] == "active"
    assert sub["stripe_customer_id"].startswith("cus_")

    # 4. Query Initial Usage Meter
    meter_resp = await client.get("/api/v1/billing/usage", headers=headers)
    assert meter_resp.status_code == 200, meter_resp.text
    meter = meter_resp.json()
    assert meter["seats_limit"] == 5
    assert meter["seats_used"] >= 1
    assert meter["ai_tokens_limit"] == 50000
    assert meter["ai_tokens_used"] == 0


@pytest.mark.asyncio
async def test_stripe_checkout_and_webhook_subscription_upgrade(client: AsyncClient):
    """
    Verifies Phase 9 Checkout & Stripe Webhook Lifecycle:
    1. Initiate Stripe Checkout session for Enterprise tier.
    2. Dispatch mock checkout.session.completed webhook.
    3. Verify tenant subscription and usage meter limits upgrade to Enterprise.
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Aero Enterprise {uid}",
        "tenant_slug": f"aero-{uid}",
        "first_name": "Amelia",
        "last_name": "Earhart",
        "email": f"amelia.{uid}@aero.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Extract tenant_id from sub
    sub_init = (await client.get("/api/v1/billing/subscription", headers=headers)).json()
    tenant_id = sub_init["tenant_id"]

    # 1. Create Checkout Session
    checkout_resp = await client.post("/api/v1/billing/checkout", json={
        "plan_tier": "Enterprise",
        "billing_cycle": "annual"
    }, headers=headers)
    assert checkout_resp.status_code == 200, checkout_resp.text
    checkout_data = checkout_resp.json()
    assert checkout_data["session_id"].startswith("cs_test_")
    assert "checkout.stripe.com" in checkout_data["checkout_url"]

    # 2. Simulate Stripe Webhook: checkout.session.completed
    mock_event_id = f"evt_checkout_{uuid.uuid4().hex[:12]}"
    webhook_payload = {
        "id": mock_event_id,
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": checkout_data["session_id"],
                "customer": sub_init["stripe_customer_id"],
                "subscription": f"sub_stripe_{uuid.uuid4().hex[:8]}",
                "metadata": {
                    "tenant_id": tenant_id,
                    "plan_tier": "Enterprise",
                    "billing_cycle": "annual"
                }
            }
        }
    }

    wh_resp = await client.post(
        "/api/v1/billing/webhook",
        content=json.dumps(webhook_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    assert wh_resp.status_code == 200, wh_resp.text
    wh_data = wh_resp.json()
    assert wh_data["status"] == "processed"
    assert "Enterprise" in wh_data["message"]

    # 3. Verify Subscription Updated
    sub_upgraded = (await client.get("/api/v1/billing/subscription", headers=headers)).json()
    assert sub_upgraded["plan_tier"] == "Enterprise"
    assert sub_upgraded["billing_cycle"] == "annual"
    assert sub_upgraded["status"] == "active"

    # 4. Verify Meter Limits Upgraded to Enterprise (100 seats, 2M AI tokens)
    meter_upgraded = (await client.get("/api/v1/billing/usage", headers=headers)).json()
    assert meter_upgraded["seats_limit"] == 100
    assert meter_upgraded["ai_tokens_limit"] == 2000000
    assert meter_upgraded["storage_bytes_limit"] == 500 * 1024 * 1024 * 1024


@pytest.mark.asyncio
async def test_usage_metering_increments_and_entitlement_gating(client: AsyncClient):
    """
    Verifies Phase 9 Usage Metering & Quota Enforcement:
    1. Record AI reasoning tokens consumption and verify percentage calculation.
    2. Idempotency protection with identical idempotency_key.
    3. Rejection of usage attempt exceeding tier entitlement quota (422 Unprocessable).
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Quota Enclave {uid}",
        "tenant_slug": f"quota-{uid}",
        "first_name": "Quinn",
        "last_name": "O'Connor",
        "email": f"quinn.{uid}@quota.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Record Valid AI Token Burn (12,500 tokens on 50,000 Starter limit)
    rec1 = await client.post("/api/v1/billing/usage/record", json={
        "meter_type": "ai_tokens",
        "quantity": 12500,
        "idempotency_key": f"rag-burn-{uid}-1",
        "description": "Copilot RAG prompt completion"
    }, headers=headers)
    assert rec1.status_code == 200, rec1.text
    rec1_data = rec1.json()
    assert rec1_data["meter_type"] == "ai_tokens"
    assert rec1_data["quantity"] == 12500

    # Verify Usage Meter reflects increment
    usage = (await client.get("/api/v1/billing/usage", headers=headers)).json()
    assert usage["ai_tokens_used"] == 12500
    assert usage["ai_tokens_percent"] == 25.0

    # 2. Idempotency Check: replay same idempotency key -> returns existing record without incrementing
    rec_dup = await client.post("/api/v1/billing/usage/record", json={
        "meter_type": "ai_tokens",
        "quantity": 12500,
        "idempotency_key": f"rag-burn-{uid}-1",
        "description": "Copilot RAG prompt completion"
    }, headers=headers)
    assert rec_dup.status_code == 200
    usage_dup = (await client.get("/api/v1/billing/usage", headers=headers)).json()
    assert usage_dup["ai_tokens_used"] == 12500, "Duplicate event must not double-count usage"

    # 3. Entitlement Gating: Attempt to burn 40,000 tokens (12,500 + 40,000 = 52,500 > 50,000 limit)
    over_burn = await client.post("/api/v1/billing/usage/record", json={
        "meter_type": "ai_tokens",
        "quantity": 40000,
        "description": "Bulk scenario simulation"
    }, headers=headers)
    assert over_burn.status_code == 422, over_burn.text
    assert "entitlement limit exceeded" in over_burn.text.lower()


@pytest.mark.asyncio
async def test_stripe_webhook_idempotency_and_lifecycle_transitions(client: AsyncClient):
    """
    Verifies Phase 9 Webhook Reliability & Subscription State Transitions:
    1. Webhook replay detection (ignored status for duplicate event IDs).
    2. Payment failure handling (`invoice.payment_failed` -> `past_due`).
    3. Subscription cancellation (`customer.subscription.deleted` -> `canceled` and downgrade to Starter).
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Lifecycle Dynamics {uid}",
        "tenant_slug": f"lifecycle-{uid}",
        "first_name": "Laura",
        "last_name": "Palmer",
        "email": f"laura.{uid}@twinpeaks.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    sub_init = (await client.get("/api/v1/billing/subscription", headers=headers)).json()
    tenant_id = sub_init["tenant_id"]

    # 1. Dispatch Webhook Event
    event_id = f"evt_life_{uuid.uuid4().hex[:12]}"
    payload = {
        "id": event_id,
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_mock_lifecycle",
                "customer": sub_init["stripe_customer_id"],
                "metadata": {"tenant_id": tenant_id, "plan_tier": "Professional"}
            }
        }
    }
    r1 = await client.post("/api/v1/billing/webhook", content=json.dumps(payload).encode("utf-8"))
    assert r1.status_code == 200
    assert r1.json()["status"] == "processed"

    # Replay identical event -> should return 'ignored'
    r2 = await client.post("/api/v1/billing/webhook", content=json.dumps(payload).encode("utf-8"))
    assert r2.status_code == 200
    assert r2.json()["status"] == "ignored"

    # 2. Payment Failed Event
    fail_event_id = f"evt_fail_{uuid.uuid4().hex[:12]}"
    fail_payload = {
        "id": fail_event_id,
        "type": "invoice.payment_failed",
        "data": {
            "object": {
                "customer": sub_init["stripe_customer_id"]
            }
        }
    }
    r_fail = await client.post("/api/v1/billing/webhook", content=json.dumps(fail_payload).encode("utf-8"))
    assert r_fail.status_code == 200
    sub_fail = (await client.get("/api/v1/billing/subscription", headers=headers)).json()
    assert sub_fail["status"] == "past_due"

    # 3. Cancellation Event
    cancel_event_id = f"evt_cancel_{uuid.uuid4().hex[:12]}"
    cancel_payload = {
        "id": cancel_event_id,
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "customer": sub_init["stripe_customer_id"]
            }
        }
    }
    r_cancel = await client.post("/api/v1/billing/webhook", content=json.dumps(cancel_payload).encode("utf-8"))
    assert r_cancel.status_code == 200
    sub_cancel = (await client.get("/api/v1/billing/subscription", headers=headers)).json()
    assert sub_cancel["status"] == "canceled"

    # Reverts meter to Starter limits
    meter = (await client.get("/api/v1/billing/usage", headers=headers)).json()
    assert meter["seats_limit"] == 5
    assert meter["ai_tokens_limit"] == 50000


@pytest.mark.asyncio
async def test_billing_multi_tenant_isolation(client: AsyncClient):
    """
    Verifies strict multi-tenant boundary isolation across:
    1. Subscriptions.
    2. Usage Meters.
    3. Usage Events & Quota Consumption.
    """
    # Register Tenant A
    u1 = uuid.uuid4().hex[:8]
    r1 = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Alpha Billing {u1}",
        "tenant_slug": f"alpha-bill-{u1}",
        "first_name": "Avery",
        "last_name": "Brooks",
        "email": f"avery.{u1}@alpha.example",
        "password": "Password123!"
    })
    assert r1.status_code == 201
    h1 = {"Authorization": f"Bearer {r1.json()['access_token']}"}

    # Register Tenant B
    u2 = uuid.uuid4().hex[:8]
    r2 = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Beta Billing {u2}",
        "tenant_slug": f"beta-bill-{u2}",
        "first_name": "Benjamin",
        "last_name": "Sisko",
        "email": f"benjamin.{u2}@beta.example",
        "password": "Password123!"
    })
    assert r2.status_code == 201
    h2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}

    # Tenant A burns 20,000 AI tokens
    await client.post("/api/v1/billing/usage/record", json={
        "meter_type": "ai_tokens",
        "quantity": 20000,
        "description": "Alpha Tenant Usage"
    }, headers=h1)

    usage_a = (await client.get("/api/v1/billing/usage", headers=h1)).json()
    assert usage_a["ai_tokens_used"] == 20000

    # Tenant B queries usage -> must have 0 tokens used
    usage_b = (await client.get("/api/v1/billing/usage", headers=h2)).json()
    assert usage_b["ai_tokens_used"] == 0, "Tenant B must not see or inherit Tenant A's usage"
    assert usage_b["tenant_id"] != usage_a["tenant_id"]
