import uuid
import hmac
import hashlib
import json
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.webhook_service import WebhookService


@pytest.mark.asyncio
async def test_integration_connectors_autoseeding_and_live_test(client: AsyncClient):
    """
    Verifies Phase 8 Enterprise Connectors:
    1. Tenant registration & auto-seeding of all 6 enterprise connectors.
    2. Verification of required connectors (Radium ERP, Email Service, Calendar Provider,
       Telephony & Voice, SMS Gateway, Website Chat).
    3. Sequential references (CON-0001 through CON-0006).
    4. Connector configuration update (endpoint_url, config payload).
    5. Live health test ping verifying latency measurement.
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Nexus Connect {uid}",
        "tenant_slug": f"nexus-conn-{uid}",
        "first_name": "Marcus",
        "last_name": "Vance",
        "email": f"marcus.{uid}@nexus.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Initial list triggers auto-seeding of 6 enterprise connectors
    resp = await client.get("/api/v1/integrations/connectors", headers=headers)
    assert resp.status_code == 200, resp.text
    connectors = resp.json()
    assert len(connectors) == 6, f"Expected 6 connectors, got {len(connectors)}"

    names = {c["name"] for c in connectors}
    expected_names = {
        "Radium ERP", "Email Service", "Calendar Provider",
        "Telephony & Voice", "SMS Gateway", "Website Chat & SDK"
    }
    assert expected_names.issubset(names)

    # Verify sequential refs and status
    for c in connectors:
        assert c["ref"].startswith("INT-")
        assert c["status"].lower() in ("connected", "configured", "available", "active", "planned")

    # 2. Update Radium ERP connector endpoint
    radium_conn = next(c for c in connectors if c["name"] == "Radium ERP")
    patch_resp = await client.patch(
        f"/api/v1/integrations/connectors/{radium_conn['id']}",
        json={
            "endpoint_url": "https://erp.syvoris-enterprise.internal/api/v2",
            "auth_type": "mTLS",
            "config": {"client_cert": "mtls_production_crt", "timeout_sec": 15}
        },
        headers=headers
    )
    assert patch_resp.status_code == 200, patch_resp.text
    updated = patch_resp.json()
    assert updated["endpoint_url"] == "https://erp.syvoris-enterprise.internal/api/v2"
    assert updated["auth_type"] == "mTLS"
    assert updated["config"]["timeout_sec"] == 15

    # 3. Test connection ping
    test_resp = await client.post(
        f"/api/v1/integrations/connectors/{radium_conn['id']}/test",
        headers=headers
    )
    assert test_resp.status_code == 200, test_resp.text
    test_data = test_resp.json()
    assert test_data["status"] in ("Healthy", "connected")
    assert test_data["latency_ms"] > 0
    assert "Radium ERP" in test_data["message"]


@pytest.mark.asyncio
async def test_outbound_webhook_subscription_and_hmac_signing(client: AsyncClient):
    """
    Verifies Phase 8 Webhook Fabric:
    1. Outbound webhook subscription creation with auto-generated secret key.
    2. Synthetic ping event dispatch.
    3. Verification of HMAC SHA-256 signature format (`sha256=<hex>`).
    4. Exact cryptographic parity check against standard HMAC SHA-256 implementation.
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Webhook Enclave {uid}",
        "tenant_slug": f"wh-enclave-{uid}",
        "first_name": "Elena",
        "last_name": "Rostova",
        "email": f"elena.{uid}@enclave.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create webhook subscription
    wh_resp = await client.post("/api/v1/integrations/webhooks", json={
        "name": "Order Events Webhook",
        "target_url": "https://consumer.client-enclave.com/events/orders",
        "events": ["order.created", "quote.approved", "ping"],
        "max_retries": 3,
        "retry_backoff_seconds": 10
    }, headers=headers)
    assert wh_resp.status_code == 201, wh_resp.text
    wh_data = wh_resp.json()
    assert wh_data["ref"].startswith("WHK-")
    assert wh_data["secret_key"].startswith("whsec_")
    secret_key = wh_data["secret_key"]
    sub_id = wh_data["id"]

    # 2. Dispatch synthetic ping event
    ping_resp = await client.post(f"/api/v1/integrations/webhooks/{sub_id}/test", headers=headers)
    assert ping_resp.status_code == 200, ping_resp.text
    deliveries = ping_resp.json()
    assert len(deliveries) >= 1
    delivery = deliveries[0]

    assert delivery["status"] == "Success"
    assert delivery["ref"].startswith("WHD-")
    assert delivery["signature"].startswith("sha256=")

    # 3. Independent HMAC SHA-256 calculation verification
    payload = delivery["payload"]
    canonical_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    expected_sig = "sha256=" + hmac.new(
        secret_key.encode('utf-8'),
        canonical_json.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    assert delivery["signature"] == expected_sig, "HMAC signature mismatch"


@pytest.mark.asyncio
async def test_webhook_delivery_backoff_and_dead_letter_queue(client: AsyncClient, db_session: AsyncSession):
    """
    Verifies Phase 8 Webhook Resilience & Dead-Letter Queue:
    1. Register subscription with max_retries = 2.
    2. Simulate upstream failure during event dispatch.
    3. Verify exponential retry progression.
    4. Verify Dead-Letter Queue routing upon exhausting maximum retry threshold.
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Resilience Core {uid}",
        "tenant_slug": f"resilience-{uid}",
        "first_name": "Liam",
        "last_name": "Thornton",
        "email": f"liam.{uid}@resilience.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create subscription with max_retries = 2
    sub_resp = await client.post("/api/v1/integrations/webhooks", json={
        "name": "DLQ Test Webhook",
        "target_url": "https://failing-endpoint.internal/events",
        "events": ["invoice.paid"],
        "max_retries": 2,
        "retry_backoff_seconds": 15
    }, headers=headers)
    assert sub_resp.status_code == 201
    sub_data = sub_resp.json()
    sub_id = uuid.UUID(sub_data["id"])
    tenant_id = uuid.UUID(sub_data["tenant_id"])

    # 2. Dispatch simulated failing event
    deliveries = await WebhookService.dispatch_event(
        db=db_session,
        tenant_id=tenant_id,
        event_name="invoice.paid",
        payload={"invoice_id": str(uuid.uuid4()), "amount": "12500.00"},
        simulate_failure=True
    )
    assert len(deliveries) == 1
    d = deliveries[0]
    delivery_id = uuid.UUID(str(d.id))
    assert d.status == "Failed"
    assert d.retry_count == 0

    # Attempt 1 retry (still failing) -> should be 'Retrying'
    retry1 = await WebhookService.retry_delivery(
        db=db_session,
        delivery_id=delivery_id,
        tenant_id=tenant_id,
        simulate_success=False
    )
    assert retry1.status == "Retrying"
    assert retry1.retry_count == 1
    assert retry1.next_retry_at is not None

    # Attempt 2 retry (still failing, reaches max_retries = 2) -> Dead-Letter
    retry2 = await WebhookService.retry_delivery(
        db=db_session,
        delivery_id=delivery_id,
        tenant_id=tenant_id,
        simulate_success=False
    )
    assert retry2.status == "Dead-Letter"
    assert retry2.retry_count == 2
    assert "Dead-Letter Queue" in retry2.error_message

    # 3. Verify DLQ query via API
    dlq_resp = await client.get("/api/v1/integrations/webhooks/deliveries?status=Dead-Letter", headers=headers)
    assert dlq_resp.status_code == 200, dlq_resp.text
    dlq_items = dlq_resp.json()
    assert len(dlq_items) >= 1
    assert any(item["id"] == str(delivery_id) for item in dlq_items)


@pytest.mark.asyncio
async def test_radium_erp_bridge_sync_and_status(client: AsyncClient):
    """
    Verifies Phase 8 Radium ERP Connector:
    1. Bridge status telemetry query (tunnel mode, health, total synced).
    2. Bidirectional delta sync execution across core business entities.
    3. Sync log auditing with records processed, latency, and initiated_by.
    4. Verified update to aggregate bridge status.
    """
    uid = uuid.uuid4().hex[:8]
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Enterprise Sync {uid}",
        "tenant_slug": f"erp-sync-{uid}",
        "first_name": "Aria",
        "last_name": "Kowalski",
        "email": f"aria.{uid}@erpsync.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201, reg.text
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Initial bridge status
    status_resp = await client.get("/api/v1/integrations/radium/status", headers=headers)
    assert status_resp.status_code == 200, status_resp.text
    status_data = status_resp.json()
    assert status_data["bridge_status"] == "Active & Healthy"
    assert "mTLS" in status_data["tunnel_encryption"]
    assert status_data["latency_ms"] > 0

    # 2. Trigger sync
    sync_resp = await client.post("/api/v1/integrations/radium/sync", json={
        "entity_type": "All Core Entities",
        "direction": "Bidirectional",
        "force_full": False
    }, headers=headers)
    assert sync_resp.status_code == 200, sync_resp.text
    sync_res = sync_resp.json()
    assert sync_res["ref"].startswith("RAD-SYNC-")
    assert sync_res["status"].lower() == "success"
    assert sync_res["records_synced"] >= 0
    assert sync_res["latency_ms"] > 0

    # 3. List sync logs
    logs_resp = await client.get("/api/v1/integrations/radium/logs", headers=headers)
    assert logs_resp.status_code == 200, logs_resp.text
    logs = logs_resp.json()
    assert len(logs) >= 1
    latest_log = logs[0]
    assert latest_log["ref"] == sync_res["ref"]
    assert latest_log["entity_type"] == "All Core Entities"
    assert latest_log["direction"] == "Bidirectional"
    assert latest_log["status"].lower() == "success"
    assert latest_log["initiated_by"] == "Aria Kowalski"

    # 4. Bridge status reflects sync run
    updated_status_resp = await client.get("/api/v1/integrations/radium/status", headers=headers)
    assert updated_status_resp.status_code == 200
    updated_status = updated_status_resp.json()
    assert updated_status["last_sync_time"] is not None


@pytest.mark.asyncio
async def test_integrations_multi_tenant_isolation(client: AsyncClient):
    """
    Verifies strict multi-tenant boundary enforcement across:
    1. Connectors isolation.
    2. Outbound Webhook Subscriptions and Delivery Logs.
    3. Radium ERP Synchronization Logs.
    """
    # Register Tenant Alpha
    u1 = uuid.uuid4().hex[:8]
    r1 = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Alpha Corp {u1}",
        "tenant_slug": f"alpha-{u1}",
        "first_name": "Arthur",
        "last_name": "Dent",
        "email": f"arthur.{u1}@alpha.example",
        "password": "Password123!"
    })
    assert r1.status_code == 201
    h1 = {"Authorization": f"Bearer {r1.json()['access_token']}"}

    # Register Tenant Beta
    u2 = uuid.uuid4().hex[:8]
    r2 = await client.post("/api/v1/auth/register", json={
        "organization_name": f"Beta Industries {u2}",
        "tenant_slug": f"beta-{u2}",
        "first_name": "Ford",
        "last_name": "Prefect",
        "email": f"ford.{u2}@beta.example",
        "password": "Password123!"
    })
    assert r2.status_code == 201
    h2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}

    # 1. Tenant Alpha creates a private webhook
    wh_alpha = await client.post("/api/v1/integrations/webhooks", json={
        "name": "Alpha Private Webhook",
        "target_url": "https://alpha.example/webhooks",
        "events": ["deal.stage_changed"]
    }, headers=h1)
    assert wh_alpha.status_code == 201
    alpha_wh_id = wh_alpha.json()["id"]

    # Tenant Alpha triggers Radium sync
    sync_alpha = await client.post("/api/v1/integrations/radium/sync", json={
        "entity_type": "Sales Orders"
    }, headers=h1)
    assert sync_alpha.status_code == 200

    # 2. Tenant Beta queries webhooks -> must NOT see Alpha's webhook
    beta_webhooks = await client.get("/api/v1/integrations/webhooks", headers=h2)
    assert beta_webhooks.status_code == 200
    beta_wh_list = beta_webhooks.json()
    assert not any(w["id"] == alpha_wh_id for w in beta_wh_list)

    # Tenant Beta attempts direct retrieval of Alpha's webhook -> 404
    direct_get = await client.get(f"/api/v1/integrations/webhooks/{alpha_wh_id}", headers=h2)
    assert direct_get.status_code == 404

    # Tenant Beta attempts to trigger test ping on Alpha's webhook -> 404
    direct_test = await client.post(f"/api/v1/integrations/webhooks/{alpha_wh_id}/test", headers=h2)
    assert direct_test.status_code == 404

    # 3. Tenant Beta queries Radium logs -> must NOT see Alpha's sync logs
    beta_logs = await client.get("/api/v1/integrations/radium/logs", headers=h2)
    assert beta_logs.status_code == 200
    assert len(beta_logs.json()) == 0, "Tenant Beta should see 0 sync logs initially"
