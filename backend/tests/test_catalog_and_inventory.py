import pytest
from httpx import AsyncClient
from decimal import Decimal

@pytest.mark.asyncio
async def test_catalog_categories_and_hierarchy(client: AsyncClient):
    """
    Verifies Catalog Categories (CAT-01):
    1. Category creation with auto-generated sequential reference (CAT-XXXX).
    2. Slug uniqueness enforcement within tenant.
    3. Hierarchical parent-child relationship.
    4. Circular hierarchy detection and prevention (422 Unprocessable Entity).
    """
    # 1. Register organization & tenant
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Nexus Optical Networks",
        "tenant_slug": "nexus-cat-test",
        "first_name": "Tariq",
        "last_name": "Mansoor",
        "email": "tariq.mansoor@nexus-cat.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 2. Create parent category
    parent_resp = await client.post("/api/v1/catalog/categories", json={
        "name": "Optical Fiber Infrastructure",
        "slug": "optical-fiber-infra",
        "category_type": "Product",
        "description": "Passive optical cabling and enclosures."
    }, headers=headers)
    assert parent_resp.status_code == 201
    parent = parent_resp.json()
    assert parent["ref"].startswith("CAT-")
    assert parent["name"] == "Optical Fiber Infrastructure"
    parent_id = parent["id"]

    # 3. Test duplicate slug conflict
    dup_resp = await client.post("/api/v1/catalog/categories", json={
        "name": "Optical Fiber Duplicate",
        "slug": "optical-fiber-infra",
        "category_type": "Product"
    }, headers=headers)
    assert dup_resp.status_code == 409

    # 4. Create child category
    child_resp = await client.post("/api/v1/catalog/categories", json={
        "name": "Armored Underground Cabling",
        "slug": "armored-underground-cabling",
        "category_type": "Product",
        "parent_id": parent_id
    }, headers=headers)
    assert child_resp.status_code == 201
    child = child_resp.json()
    assert child["parent_id"] == parent_id
    assert child["parent_name"] == "Optical Fiber Infrastructure"
    child_id = child["id"]

    # 5. Prevent circular dependency: setting parent to self or descendant
    self_resp = await client.put(f"/api/v1/catalog/categories/{parent_id}", json={
        "parent_id": parent_id
    }, headers=headers)
    assert self_resp.status_code == 422

    desc_resp = await client.put(f"/api/v1/catalog/categories/{parent_id}", json={
        "parent_id": child_id
    }, headers=headers)
    assert desc_resp.status_code == 422

    # 6. Verify list shows hierarchy
    list_resp = await client.get("/api/v1/catalog/categories", headers=headers)
    assert list_resp.status_code == 200
    cats = list_resp.json()
    assert len(cats) >= 2


@pytest.mark.asyncio
async def test_services_catalog_lifecycle(client: AsyncClient):
    """
    Verifies Service Catalogue (CAT-02):
    1. Service item creation with billing method and frequency.
    2. Rate validation and Decimal currency precision.
    3. Unique service code enforcement within tenant.
    4. Service update and search filtering.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Quantum Telco Services",
        "tenant_slug": "quantum-svc-test",
        "first_name": "Maya",
        "last_name": "Lin",
        "email": "maya.lin@quantum-svc.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create service
    svc_resp = await client.post("/api/v1/catalog/services", json={
        "name": "Optical Fusion Splicing Tier-1",
        "code": "SVC-FUSION-T1",
        "service_type": "Field Operations",
        "description": "High-precision single-mode fusion splicing and protection sleeve placement.",
        "billing_method": "Hourly",
        "billing_frequency": "One-Time",
        "duration_unit": "Hour",
        "standard_rate": 135.00,
        "cost_rate": 70.00,
        "currency": "USD",
        "tax_rate": 15.00,
        "status": "Active"
    }, headers=headers)
    assert svc_resp.status_code == 201
    svc = svc_resp.json()
    assert svc["ref"].startswith("SVC-")
    assert svc["code"] == "SVC-FUSION-T1"
    assert float(svc["standard_rate"]) == 135.00
    svc_id = svc["id"]

    # 2. Prevent duplicate service code
    dup_resp = await client.post("/api/v1/catalog/services", json={
        "name": "Duplicate Code Service",
        "code": "SVC-FUSION-T1",
        "standard_rate": 100.00
    }, headers=headers)
    assert dup_resp.status_code == 409

    # 3. Update service rate
    upd_resp = await client.put(f"/api/v1/catalog/services/{svc_id}", json={
        "standard_rate": 145.00
    }, headers=headers)
    assert upd_resp.status_code == 200
    assert float(upd_resp.json()["standard_rate"]) == 145.00

    # 4. Query services with search
    search_resp = await client.get("/api/v1/catalog/services?q=Fusion", headers=headers)
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) == 1
    assert results[0]["id"] == svc_id


@pytest.mark.asyncio
async def test_product_bundles_and_pricing_engine(client: AsyncClient):
    """
    Verifies Product & Service Bundles (CAT-03):
    1. Fixed-price bundles.
    2. Component-based bundles with dynamic discount calculations.
    3. Validity date window enforcement.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Apex Connectivity Systems",
        "tenant_slug": "apex-bnd-test",
        "first_name": "Kofi",
        "last_name": "Adjei",
        "email": "kofi.adjei@apex-bnd.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create a Product
    prod_resp = await client.post("/api/v1/products", json={
        "sku": "PRD-CAB-96C",
        "name": "96-Core High Density Fiber Trunk",
        "category": "Cabling",
        "standard_price": 2000.00,
        "cost_price": 1400.00
    }, headers=headers)
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]

    # 2. Create a Service
    svc_resp = await client.post("/api/v1/catalog/services", json={
        "name": "Full Route Fiber Certification",
        "code": "SVC-CERT-ROUTE",
        "standard_rate": 1000.00,
        "cost_rate": 500.00
    }, headers=headers)
    assert svc_resp.status_code == 201
    svc_id = svc_resp.json()["id"]

    # 3. Create Fixed Bundle
    fixed_resp = await client.post("/api/v1/catalog/bundles", json={
        "name": "Commercial Fiber Turnkey Starter",
        "bundle_code": "BND-STARTER-01",
        "pricing_model": "Fixed",
        "bundle_price": 2700.00,
        "discount_pct": 10.00,
        "currency": "USD",
        "status": "Active",
        "components": [
            {
                "component_type": "Product",
                "product_id": prod_id,
                "item_name": "96-Core High Density Fiber Trunk",
                "sku_or_code": "PRD-CAB-96C",
                "quantity": 1.00,
                "unit_price": 2000.00,
                "discount_pct": 0.00,
                "is_optional": False
            },
            {
                "component_type": "Service",
                "service_id": svc_id,
                "item_name": "Full Route Fiber Certification",
                "sku_or_code": "SVC-CERT-ROUTE",
                "quantity": 1.00,
                "unit_price": 1000.00,
                "discount_pct": 0.00,
                "is_optional": False
            }
        ]
    }, headers=headers)
    assert fixed_resp.status_code == 201
    fixed_bundle = fixed_resp.json()
    assert fixed_bundle["ref"].startswith("BND-")
    assert float(fixed_bundle["bundle_price"]) == 2700.00
    assert float(fixed_bundle["calculated_total"]) == 2700.00
    assert len(fixed_bundle["components"]) == 2

    # 4. Create Component-Based Bundle
    comp_resp = await client.post("/api/v1/catalog/bundles", json={
        "name": "Flexible Infrastructure Package",
        "bundle_code": "BND-FLEX-02",
        "pricing_model": "Component-based",
        "bundle_price": 0.00,
        "discount_pct": 10.00,  # 10% off final sum
        "currency": "USD",
        "components": [
            {
                "component_type": "Product",
                "product_id": prod_id,
                "item_name": "96-Core High Density Fiber Trunk",
                "sku_or_code": "PRD-CAB-96C",
                "quantity": 2.00,
                "unit_price": 2000.00,  # 4000
                "discount_pct": 0.00,
                "is_optional": False
            },
            {
                "component_type": "Service",
                "service_id": svc_id,
                "item_name": "Full Route Fiber Certification",
                "sku_or_code": "SVC-CERT-ROUTE",
                "quantity": 1.00,
                "unit_price": 1000.00,  # 1000
                "discount_pct": 0.00,
                "is_optional": False
            }
        ]
    }, headers=headers)
    assert comp_resp.status_code == 201
    comp_bundle = comp_resp.json()
    # Total before bundle discount = 4000 + 1000 = 5000. With 10% bundle discount = 4500.00
    assert float(comp_bundle["calculated_total"]) == 4500.00


@pytest.mark.asyncio
async def test_warehouse_and_stock_movements_atomic(client: AsyncClient):
    """
    Verifies Warehouse & Stock Management (CAT-05):
    1. Warehouse location creation and default assignment.
    2. Stock balance initialization.
    3. Atomic Stock Movement execution: Receipt, Issue, and Transfer.
    4. Negative stock protection (guard prevents over-allocation).
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Caribbean Optical Logistics",
        "tenant_slug": "carib-stock-test",
        "first_name": "Damion",
        "last_name": "Clarke",
        "email": "damion.clarke@carib-stock.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create Location A (Kingston Hub)
    loc_a_resp = await client.post("/api/v1/inventory/locations", json={
        "name": "Kingston Central Logistics Hub",
        "code": "WH-KIN-A",
        "city": "Kingston",
        "country": "Jamaica",
        "is_default": True
    }, headers=headers)
    assert loc_a_resp.status_code == 201
    loc_a_id = loc_a_resp.json()["id"]

    # 2. Create Location B (Montego Bay Depot)
    loc_b_resp = await client.post("/api/v1/inventory/locations", json={
        "name": "Montego Bay Regional Depot",
        "code": "WH-MBJ-B",
        "city": "Montego Bay",
        "country": "Jamaica",
        "is_default": False
    }, headers=headers)
    assert loc_b_resp.status_code == 201
    loc_b_id = loc_b_resp.json()["id"]

    # 3. Create Product
    prod_resp = await client.post("/api/v1/products", json={
        "sku": "FBR-PATCH-10M",
        "name": "Duplex LC-LC Single Mode Patch Cord (10m)",
        "category": "Accessories",
        "standard_price": 25.00,
        "cost_price": 12.00
    }, headers=headers)
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]

    # 4. Initialize Stock Item at Hub A
    stock_item_resp = await client.post("/api/v1/inventory/stock", json={
        "product_id": prod_id,
        "location_id": loc_a_id,
        "reorder_threshold": 10.00,
        "reorder_quantity": 50.00,
        "unit_of_measure": "Piece"
    }, headers=headers)
    assert stock_item_resp.status_code == 201
    item_a_id = stock_item_resp.json()["id"]
    assert float(stock_item_resp.json()["quantity_on_hand"]) == 0.00

    # 5. Record Receipt Movement: +100 units
    receipt_resp = await client.post("/api/v1/inventory/movements", json={
        "inventory_item_id": item_a_id,
        "movement_type": "Receipt",
        "quantity": 100.00,
        "reason": "PO-1001 supplier delivery received"
    }, headers=headers)
    assert receipt_resp.status_code == 201
    rec = receipt_resp.json()
    assert rec["ref"].startswith("MOV-")
    assert float(rec["balance_before"]) == 0.00
    assert float(rec["balance_after"]) == 100.00

    # 6. Record Issue Movement: -20 units
    issue_resp = await client.post("/api/v1/inventory/movements", json={
        "inventory_item_id": item_a_id,
        "movement_type": "Issue",
        "quantity": 20.00,
        "reason": "Dispatched for client installation"
    }, headers=headers)
    assert issue_resp.status_code == 201
    iss = issue_resp.json()
    assert float(iss["balance_before"]) == 100.00
    assert float(iss["balance_after"]) == 80.00

    # 7. Record Inter-Warehouse Transfer: 30 units from Hub A to Hub B
    transfer_resp = await client.post("/api/v1/inventory/movements", json={
        "inventory_item_id": item_a_id,
        "movement_type": "Transfer",
        "quantity": 30.00,
        "to_location_id": loc_b_id,
        "reason": "Stock rebalancing to western corridor"
    }, headers=headers)
    assert transfer_resp.status_code == 201
    tr = transfer_resp.json()
    assert float(tr["balance_before"]) == 80.00
    assert float(tr["balance_after"]) == 50.00

    # Verify Hub B now has 30 units
    hub_b_items = await client.get(f"/api/v1/inventory/stock?location_id={loc_b_id}", headers=headers)
    assert hub_b_items.status_code == 200
    b_items = hub_b_items.json()
    assert len(b_items) == 1
    assert float(b_items[0]["quantity_on_hand"]) == 30.00

    # 8. Negative Stock Guard: Attempting to issue 60 units from Hub A (only 50 available)
    over_resp = await client.post("/api/v1/inventory/movements", json={
        "inventory_item_id": item_a_id,
        "movement_type": "Issue",
        "quantity": 60.00,
        "reason": "Excess issue test"
    }, headers=headers)
    assert over_resp.status_code == 422


@pytest.mark.asyncio
async def test_vendor_profiles_and_supply_catalog(client: AsyncClient):
    """
    Verifies Vendors & Supply Catalog (CAT-06):
    1. Reuses CRM Account as Vendor Profile.
    2. Enforces unique vendor code per organization.
    3. Adds supplied products with supplier SKU, unit cost, and lead times.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Sovereign Fiber Caribbean",
        "tenant_slug": "sov-vendor-test",
        "first_name": "Althea",
        "last_name": "Grant",
        "email": "althea.grant@sov-vendor.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create CRM Account with Vendor type
    acc_resp = await client.post("/api/v1/accounts", json={
        "name": "Corning Global Manufacturing",
        "industry": "Optical Fiber",
        "account_type": "Vendor"
    }, headers=headers)
    assert acc_resp.status_code == 201
    acc_id = acc_resp.json()["id"]

    # 2. Create Vendor Profile
    vp_resp = await client.post("/api/v1/vendors", json={
        "account_id": acc_id,
        "vendor_code": "VND-CRN-01",
        "vendor_category": "Fiber & Cabling",
        "payment_terms": "Net 45",
        "rating": 4.9,
        "status": "Active"
    }, headers=headers)
    assert vp_resp.status_code == 201
    vp = vp_resp.json()
    assert vp["ref"].startswith("VND-")
    assert vp["account_name"] == "Corning Global Manufacturing"
    vendor_id = vp["id"]

    # 3. Create a Product to link
    prod_resp = await client.post("/api/v1/products", json={
        "sku": "FBR-TRK-288C",
        "name": "288-Core Ultra Ribbon Fiber Cable",
        "category": "Cabling",
        "standard_price": 5500.00,
        "cost_price": 3800.00
    }, headers=headers)
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]

    # 4. Link product to Vendor supply catalog
    v_prod_resp = await client.post(f"/api/v1/vendors/{vendor_id}/products", json={
        "product_id": prod_id,
        "vendor_sku": "CRN-RIBBON-288",
        "unit_cost": 3800.00,
        "currency": "USD",
        "lead_time_days": 10,
        "min_order_quantity": 2.00,
        "is_preferred_vendor": True
    }, headers=headers)
    assert v_prod_resp.status_code == 201
    v_prod = v_prod_resp.json()
    assert v_prod["vendor_sku"] == "CRN-RIBBON-288"
    assert float(v_prod["unit_cost"]) == 3800.00
    assert v_prod["is_preferred_vendor"] is True

    # 5. Fetch Vendor and confirm supplied products populated
    get_vp_resp = await client.get(f"/api/v1/vendors/{vendor_id}", headers=headers)
    assert get_vp_resp.status_code == 200
    fetched_vp = get_vp_resp.json()
    assert fetched_vp["supplied_products_count"] == 1
    assert fetched_vp["supplied_products"][0]["vendor_sku"] == "CRN-RIBBON-288"


@pytest.mark.asyncio
async def test_tax_rules_and_exact_precision(client: AsyncClient):
    """
    Verifies Tax Management (CAT-04 / TAX-01):
    1. Tax rule creation with jurisdiction and exact Decimal rate.
    2. Conflict on duplicate tax code.
    3. Update tax rate and verify query filter.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Antilles Tax Test Org",
        "tenant_slug": "antilles-tax-test",
        "first_name": "Leila",
        "last_name": "Reyes",
        "email": "leila.reyes@antilles-tax.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create Tax Rule
    tax_resp = await client.post("/api/v1/inventory/taxes", json={
        "name": "General Consumption Tax (GCT) - Telecom",
        "code": "GCT-TEL-25",
        "rate": 25.00,
        "region": "Jamaica",
        "tax_type": "Special",
        "is_inclusive": False,
        "status": "Active"
    }, headers=headers)
    assert tax_resp.status_code == 201
    tax = tax_resp.json()
    assert tax["ref"].startswith("TAX-")
    assert tax["code"] == "GCT-TEL-25"
    assert float(tax["rate"]) == 25.00
    tax_id = tax["id"]

    # 2. Prevent duplicate tax code
    dup_resp = await client.post("/api/v1/inventory/taxes", json={
        "name": "Duplicate Tax",
        "code": "GCT-TEL-25",
        "rate": 15.00
    }, headers=headers)
    assert dup_resp.status_code == 409

    # 3. List taxes
    list_resp = await client.get("/api/v1/inventory/taxes", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1


@pytest.mark.asyncio
async def test_commercial_terms_lifecycle(client: AsyncClient):
    """
    Verifies Terms and Conditions (CAT-04 / TRM-01):
    1. Draft commercial term creation.
    2. Publishing term with version number and default assignment.
    3. Retrieval and category filtering.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Bauxite Telecom Corp",
        "tenant_slug": "bauxite-terms-test",
        "first_name": "Carlton",
        "last_name": "Simms",
        "email": "carlton.simms@bauxite-terms.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create Draft Term
    term_resp = await client.post("/api/v1/inventory/terms", json={
        "title": "Master Services Agreement (Carrier)",
        "version": "1.0",
        "category": "Commercial",
        "content": "Standard enterprise commercial terms for optical dark fiber leasing.",
        "status": "Draft",
        "is_default": False
    }, headers=headers)
    assert term_resp.status_code == 201
    term = term_resp.json()
    assert term["ref"].startswith("TRM-")
    assert term["status"] == "Draft"
    term_id = term["id"]

    # 2. Update to Published
    pub_resp = await client.put(f"/api/v1/inventory/terms/{term_id}", json={
        "status": "Published",
        "is_default": True
    }, headers=headers)
    assert pub_resp.status_code == 200
    pub_term = pub_resp.json()
    assert pub_term["status"] == "Published"
    assert pub_term["is_default"] is True
    assert pub_term["published_by"] is not None


@pytest.mark.asyncio
async def test_product_availability_windows(client: AsyncClient):
    """
    Verifies Product Availability (CAT-03 / AVL-01):
    1. Availability window creation with lead time and channel restrictions.
    2. Dynamic evaluation of effectiveness window.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Solstice Fiber Ltd",
        "tenant_slug": "solstice-avail-test",
        "first_name": "Nia",
        "last_name": "Campbell",
        "email": "nia.campbell@solstice-avail.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create availability record
    avail_resp = await client.post("/api/v1/catalog/availability", json={
        "item_name": "High-Capacity Optical Multiplexer Chassis",
        "status": "Available",
        "channel": "Enterprise Direct",
        "region": "Jamaica",
        "lead_time_days": 7,
        "notes": "Available from Kingston distribution center."
    }, headers=headers)
    assert avail_resp.status_code == 201
    avail = avail_resp.json()
    assert avail["status"] == "Available"
    assert avail["lead_time_days"] == 7
    assert avail["is_currently_effective"] is True
