import pytest
from httpx import AsyncClient
import uuid

@pytest.mark.asyncio
async def test_rbac_sales_marketing_cx_permissions_and_sync(client: AsyncClient):
    # 1. Register a new tenant with Owner
    tenant_slug = f"sync-org-{uuid.uuid4().hex[:8]}"
    owner_reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Sync Org",
        "tenant_slug": tenant_slug,
        "first_name": "Dev",
        "last_name": "Admin",
        "email": f"owner@{tenant_slug}.example",
        "password": "Password123!"
    })
    assert owner_reg.status_code == 201
    owner_data = owner_reg.json()
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}
    
    # Verify Tenant Owner received permissions across Sales, Marketing, CX
    perms = set(owner_data["permissions"])
    
    # Sales & Revenue
    assert "opportunities:read" in perms
    assert "opportunities:write" in perms
    assert "quotes:read" in perms
    assert "quotes:write" in perms
    assert "quotes:approve" in perms
    assert "products:read" in perms
    assert "price_books:read" in perms
    assert "orders:read" in perms
    assert "invoices:read" in perms

    # Marketing
    assert "campaigns:read" in perms
    assert "marketing:read" in perms
    assert "segments:read" in perms
    assert "trackers:read" in perms

    # Customer Experience
    assert "cases:read" in perms
    assert "service:read" in perms
    assert "interactions:read" in perms
    assert "portal:read" in perms

    # 2. Test accessing opportunities endpoint
    opps_resp = await client.get("/api/v1/opportunities", headers=owner_headers)
    assert opps_resp.status_code == 200

    # 3. Test accessing quotes endpoint
    quotes_resp = await client.get("/api/v1/quotes", headers=owner_headers)
    assert quotes_resp.status_code == 200

    # 4. Test accessing products endpoint
    prods_resp = await client.get("/api/v1/products", headers=owner_headers)
    assert prods_resp.status_code == 200

    # 5. Test accessing price-books endpoint
    pb_resp = await client.get("/api/v1/price-books", headers=owner_headers)
    assert pb_resp.status_code == 200

    # 6. Test accessing sales-orders endpoint
    orders_resp = await client.get("/api/v1/sales-orders", headers=owner_headers)
    assert orders_resp.status_code == 200

    # 7. Test accessing invoices endpoint
    inv_resp = await client.get("/api/v1/invoices", headers=owner_headers)
    assert inv_resp.status_code == 200

    # 8. Test invite of Sales Manager and Sales Representative
    invite_sm = await client.post("/api/v1/admin/users/invite", json={
        "email": f"sm@{tenant_slug}.example",
        "first_name": "Sales",
        "last_name": "Manager",
        "role_name": "Sales Manager",
        "job_title": "VP Sales"
    }, headers=owner_headers)
    assert invite_sm.status_code == 201

    invite_rep = await client.post("/api/v1/admin/users/invite", json={
        "email": f"rep@{tenant_slug}.example",
        "first_name": "Sales",
        "last_name": "Rep",
        "role_name": "Sales Representative",
        "job_title": "Account Exec"
    }, headers=owner_headers)
    assert invite_rep.status_code == 201
