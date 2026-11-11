import pytest
import re
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_email_verification_flow(client: AsyncClient):
    # 1. Register new tenant organization
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Verification Corp",
        "tenant_slug": "verify-corp",
        "first_name": "Victor",
        "last_name": "Vance",
        "email": "victor@verify.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201

    # 2. Check profile - is_verified should initially be False
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["user"]["is_verified"] is False

    # 3. Read email verification token from test_emails.log
    with open("storage/test_emails.log", "r", encoding="utf-8") as f:
        log_content = f.read()
    tokens = re.findall(r"Verification Token:\s*([A-Za-z0-9_-]+)", log_content)
    assert len(tokens) > 0
    latest_verify_token = tokens[-1]

    # 4. Attempt verification with invalid token -> 422 ValidationException
    invalid_resp = await client.post("/api/v1/auth/verify-email", json={"token": "invalid_fake_token_12345"})
    assert invalid_resp.status_code == 422

    # 5. Confirm email verification with valid token -> 200 OK
    verify_resp = await client.post("/api/v1/auth/verify-email", json={"token": latest_verify_token})
    assert verify_resp.status_code == 200
    assert "successfully verified" in verify_resp.json()["message"].lower()

    # 6. Profile should now reflect is_verified == True
    me_after = await client.get("/api/v1/auth/me", headers=headers)
    assert me_after.status_code == 200
    assert me_after.json()["user"]["is_verified"] is True

    # 7. Re-using the same token should fail -> 422 ValidationException
    replay_resp = await client.post("/api/v1/auth/verify-email", json={"token": latest_verify_token})
    assert replay_resp.status_code == 422
