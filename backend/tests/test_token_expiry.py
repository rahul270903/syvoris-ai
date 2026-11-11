import pytest
from datetime import timedelta
from httpx import AsyncClient
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_jwt_expiration_rejection(client: AsyncClient):
    # Create an already expired access token (-5 minutes)
    expired_token = create_access_token(
        data={"sub": "00000000-0000-0000-0000-000000000001", "tenant_id": "11111111-1111-1111-1111-111111111111"},
        expires_delta=timedelta(minutes=-5)
    )

    # Attempt to access protected endpoint with expired token
    resp = await client.get("/api/v1/tenant/profile", headers={"Authorization": f"Bearer {expired_token}"})
    
    # Must be HTTP 401 Unauthorized with expired message
    assert resp.status_code == 401
    assert "expired" in resp.json()["detail"].lower()
