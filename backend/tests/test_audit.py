import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_audit_ledger_recording_and_security(client: AsyncClient):
    # 1. Register Epsilon
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Epsilon Innovations",
        "tenant_slug": "epsilon-innovations",
        "first_name": "Elena",
        "last_name": "Rostova",
        "email": "elena@epsilon.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    tokens = reg.json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # 2. Update settings
    up_settings = await client.put("/api/v1/tenant/settings", json={
        "timezone": "Europe/London",
        "primary_color": "#06b6d4"
    }, headers=headers)
    assert up_settings.status_code == 200

    # 3. Query audit events
    audit_resp = await client.get("/api/v1/admin/audit/", headers=headers)
    assert audit_resp.status_code == 200
    events = audit_resp.json()
    assert len(events) >= 2

    # Check that settings update was recorded
    settings_event = next((e for e in events if e["action"] == "tenant.settings_updated"), None)
    assert settings_event is not None
    assert settings_event["actor_name"] == "Elena Rostova"
    assert settings_event["metadata"]["timezone"] == "Europe/London"

    # Verify no passwords or tokens are stored in metadata
    for ev in events:
        for k, v in ev["metadata"].items():
            assert "password" not in k.lower()
            assert "token" not in k.lower()
            if isinstance(v, str):
                assert "Password123!" not in v
