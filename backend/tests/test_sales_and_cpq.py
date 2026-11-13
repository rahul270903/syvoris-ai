import pytest
import uuid
from decimal import Decimal
from httpx import AsyncClient

from app.services.cpq_service import cpq_service
from app.schemas.sales import CPQCalculationRequest, CPQLineInput

def test_cpq_pure_service_calculations():
    """
    Verifies CPQ calculation engine with zero floating point discrepancies.
    1. Line 1: 12 units @ $8,500.00 = $102,000.00 gross, 15% discount ($15,300.00), Net = $86,700.00, 8.25% Tax ($7,152.75) -> Line Total $93,852.75.
    2. Line 2: 1 unit @ $35,000.00, 10% discount ($3,500.00), Net = $31,500.00, 8.25% Tax ($2,598.75) -> Line Total $34,098.75.
    3. Line 3: 1 unit @ $20,000.00, 0% discount, 0% Tax -> Line Total $20,000.00.
    4. Subtotal: $157,000.00, Line Discounts: $18,800.00, Taxes: $9,751.50.
    5. Header Discount: 5.00% applied to Net before header ($138,200.00 * 5% = $6,910.00).
    6. Grand Total: ($138,200.00 - $6,910.00) + $9,751.50 = $141,041.50.
    """
    req = CPQCalculationRequest(
        currency="USD",
        header_discount_pct=Decimal("5.00"),
        lines=[
            CPQLineInput(
                item_name="Enterprise AI Cloud Core Subscription (Annual)",
                sku="SYV-CORE-ENT",
                quantity=Decimal("12.0000"),
                unit_price=Decimal("8500.00"),
                cost_price=Decimal("2100.00"),
                discount_pct=Decimal("15.00"),
                tax_rate=Decimal("8.25")
            ),
            CPQLineInput(
                item_name="Predictive Sales & Revenue Intelligence Module",
                sku="SYV-REV-INT",
                quantity=Decimal("1.0000"),
                unit_price=Decimal("35000.00"),
                cost_price=Decimal("8500.00"),
                discount_pct=Decimal("10.00"),
                tax_rate=Decimal("8.25")
            ),
            CPQLineInput(
                item_name="Enterprise Implementation & Integration Pack",
                sku="SYV-SVC-IMP",
                quantity=Decimal("1.0000"),
                unit_price=Decimal("20000.00"),
                cost_price=Decimal("7500.00"),
                discount_pct=Decimal("0.00"),
                tax_rate=Decimal("0.00")
            )
        ]
    )

    res = cpq_service.calculate(req)
    assert res.subtotal == Decimal("157000.00")
    assert res.lines[0].discount_amount == Decimal("15300.00")
    assert res.lines[0].net_amount == Decimal("86700.00")
    assert res.lines[0].tax_amount == Decimal("7152.75")
    assert res.lines[0].line_total == Decimal("93852.75")

    assert res.lines[1].discount_amount == Decimal("3500.00")
    assert res.lines[1].net_amount == Decimal("31500.00")
    assert res.lines[1].tax_amount == Decimal("2598.75")
    assert res.lines[1].line_total == Decimal("34098.75")

    assert res.lines[2].line_total == Decimal("20000.00")

    # Total discount = 18800 line discounts + 6910 header discount = 25710.00
    assert res.total_discount == Decimal("25710.00")
    assert res.total_tax == Decimal("9751.50")
    assert res.grand_total == Decimal("141041.50")

    # Margin check: total cost = 12*2100 + 8500 + 7500 = 25200 + 8500 + 7500 = 41200.00
    assert res.total_cost == Decimal("41200.00")
    assert res.margin_amount == Decimal("99841.50")
    assert res.margin_pct == Decimal("70.79")
    assert not res.requires_approval

    # Exceeding threshold triggers approval
    req_high_disc = CPQCalculationRequest(
        currency="USD",
        header_discount_pct=Decimal("22.00"),
        lines=req.lines
    )
    res_high = cpq_service.calculate(req_high_disc)
    assert res_high.requires_approval
    assert any("exceeds commercial policy threshold" in r for r in res_high.approval_reasons)


@pytest.mark.asyncio
async def test_product_catalog_and_price_book_crud(client: AsyncClient):
    """
    Verifies Milestone 3B:
    1. Product auto-seeding.
    2. Product listing and filtering.
    3. Custom product creation and SKU uniqueness.
    4. Price Book creation with list prices.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Helios Solar Dynamics",
        "tenant_slug": "helios-catalog-test",
        "first_name": "Helena",
        "last_name": "Troy",
        "email": "helena@helios.example",
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Products list auto-seeds default catalog
    prod_resp = await client.get("/api/v1/products", headers=headers)
    assert prod_resp.status_code == 200
    products = prod_resp.json()["items"]
    assert len(products) >= 4
    skus = [p["sku"] for p in products]
    assert "SYV-CORE-ENT" in skus
    assert "SYV-REV-INT" in skus

    # 2. Create custom product
    new_prod = await client.post("/api/v1/products", json={
        "sku": "SOL-PV-PANEL-450",
        "name": "Bifacial Monocrystalline Solar Panel 450W",
        "category": "Hardware",
        "unit_of_measure": "Panel",
        "standard_price": 285.00,
        "cost_price": 140.00,
        "tax_category": "Standard",
        "tax_rate": 8.25
    }, headers=headers)
    assert new_prod.status_code == 201
    panel_id = new_prod.json()["id"]

    # 3. Duplicate SKU rejected
    dup_prod = await client.post("/api/v1/products", json={
        "sku": "SOL-PV-PANEL-450",
        "name": "Duplicate Panel",
        "category": "Hardware",
        "standard_price": 300.00
    }, headers=headers)
    assert dup_prod.status_code == 422

    # 4. Create Price Book with custom entry
    pb_resp = await client.post("/api/v1/price-books", json={
        "name": "Enterprise Commercial Tier-A",
        "description": "Special discounted rate card for utility-scale contracts",
        "currency": "USD",
        "entries": [
            {
                "product_id": panel_id,
                "list_price": 240.00,
                "currency": "USD"
            }
        ]
    }, headers=headers)
    assert pb_resp.status_code == 201
    pb = pb_resp.json()
    assert pb["name"] == "Enterprise Commercial Tier-A"
    assert len(pb["entries"]) == 1
    assert float(pb["entries"][0]["list_price"]) == 240.00


@pytest.mark.asyncio
async def test_quote_lifecycle_approvals_and_revisions(client: AsyncClient):
    """
    Verifies Milestone 3C:
    1. Quote creation with server CPQ calculation.
    2. Automatic Pending Approval when discount > 15%.
    3. Manager approval workflow.
    4. Approved quote locking.
    5. Version revisioning.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Aether Aerospace Corp",
        "tenant_slug": "aether-quote-test",
        "first_name": "Sarah",
        "last_name": "Connor",
        "email": "sarah@aether.example",
        "password": "Password123!"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Create Account
    acc = await client.post("/api/v1/accounts", json={
        "name": "Orbital Space Systems",
        "industry": "Aerospace"
    }, headers=headers)
    account_id = acc.json()["id"]

    # Create Quote with 20% header discount -> forces Pending Approval
    q_resp = await client.post("/api/v1/quotes", json={
        "name": "Orbital AI Operations Suite",
        "account_id": account_id,
        "valid_until": "2027-12-31",
        "currency": "USD",
        "header_discount_pct": 20.00,
        "payment_terms": "Net 30",
        "lines": [
            {
                "item_name": "Enterprise AI Cloud Core Subscription",
                "sku": "SYV-CORE-ENT",
                "quantity": 2,
                "unit_price": 8500.00,
                "discount_pct": 0.00,
                "tax_rate": 8.25
            }
        ]
    }, headers=headers)
    assert q_resp.status_code == 201
    quote = q_resp.json()
    quote_id = quote["id"]
    assert quote["status"] == "Pending Approval"
    assert quote["ref"].startswith("QTE-")

    # Verify Approval Request was logged
    app_resp = await client.get("/api/v1/approvals", headers=headers)
    assert app_resp.status_code == 200
    approvals = app_resp.json()["items"]
    assert len(approvals) >= 1
    quote_approval = next(a for a in approvals if a["entity_id"] == quote_id)
    assert quote_approval["status"] == "Pending"

    # Manager approves quote
    dec_resp = await client.post(f"/api/v1/quotes/{quote_id}/approve", json={
        "approved": True,
        "comments": "Strategic aerospace account authorized by VP Sales."
    }, headers=headers)
    assert dec_resp.status_code == 200
    assert dec_resp.json()["status"] == "Approved"

    # Direct edit on Approved quote is prohibited (locked!)
    patch_resp = await client.patch(f"/api/v1/quotes/{quote_id}", json={
        "name": "Attempted Change to Locked Quote"
    }, headers=headers)
    assert patch_resp.status_code == 422
    assert "locked against modification" in patch_resp.json()["detail"]

    # Create revision
    rev_resp = await client.post(f"/api/v1/quotes/{quote_id}/revision", headers=headers)
    assert rev_resp.status_code == 201
    rev = rev_resp.json()
    assert rev["ref"] == quote["ref"]
    assert rev["version"] == 2
    assert rev["parent_quote_id"] == quote_id
    assert rev["status"] == "Draft"


@pytest.mark.asyncio
async def test_quote_acceptance_order_conversion_and_invoicing(client: AsyncClient):
    """
    Verifies Milestone 3D:
    1. Create Opportunity and Quote.
    2. Client accepts Quote -> Atomic conversion to Sales Order.
    3. Opportunity automatically advances to Closed Won.
    4. Sales Order generates Customer Invoice.
    5. Invoice partial and full payments.
    """
    reg = await client.post("/api/v1/auth/register", json={
        "organization_name": "Titan Heavy Industries",
        "tenant_slug": "titan-order-test",
        "first_name": "James",
        "last_name": "Holden",
        "email": "james@titan.example",
        "password": "Password123!"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Create Account, Contact & Opportunity
    acc = await client.post("/api/v1/accounts", json={"name": "Ceres Logistics Corp"}, headers=headers)
    account_id = acc.json()["id"]

    con = await client.post("/api/v1/contacts", json={
        "first_name": "Naomi", "last_name": "Nagata", "email": "naomi@ceres.example", "account_id": account_id
    }, headers=headers)
    contact_id = con.json()["id"]

    opp = await client.post("/api/v1/opportunities", json={
        "name": "Fleetwide Telemetry Automation",
        "account_id": account_id,
        "contact_id": contact_id,
        "amount": 55000.00,
        "stage": "Proposal",
        "expected_close_date": "2027-08-30T00:00:00Z"
    }, headers=headers)
    opp_id = opp.json()["id"]

    # 2. Create Quote within approved threshold (10% discount)
    q_resp = await client.post("/api/v1/quotes", json={
        "name": "Telemetry Automation Solution Quote",
        "account_id": account_id,
        "contact_id": contact_id,
        "opportunity_id": opp_id,
        "valid_until": "2027-10-31",
        "header_discount_pct": 10.00,
        "payment_terms": "Net 30",
        "lines": [
            {
                "item_name": "Predictive Sales & Revenue Intelligence Module",
                "sku": "SYV-REV-INT",
                "quantity": 1,
                "unit_price": 35000.00,
                "discount_pct": 0.00,
                "tax_rate": 8.25
            },
            {
                "item_name": "Enterprise Implementation & Integration Pack",
                "sku": "SYV-SVC-IMP",
                "quantity": 1,
                "unit_price": 20000.00,
                "discount_pct": 0.00,
                "tax_rate": 0.00
            }
        ]
    }, headers=headers)
    assert q_resp.status_code == 201
    quote = q_resp.json()
    assert quote["status"] == "Draft"
    quote_id = quote["id"]

    # 3. Accept Quote and convert to Sales Order
    accept_resp = await client.post(f"/api/v1/quotes/{quote_id}/accept", json={
        "warehouse_location": "Houston Central Logistics Hub",
        "carrier": "FedEx Enterprise Express",
        "tracking_number": "FX-994019284US",
        "notes": "Fast-track telemetry provisioning requested by customer."
    }, headers=headers)
    assert accept_resp.status_code == 200
    order = accept_resp.json()
    order_id = order["id"]
    assert order["ref"].startswith("SO-")
    assert order["status"] == "Confirmed"
    assert order["quote_ref"] == quote["ref"]
    assert len(order["lines"]) == 2

    # Check Quote status is Accepted
    q_check = await client.get(f"/api/v1/quotes/{quote_id}", headers=headers)
    assert q_check.json()["status"] == "Accepted"

    # Check Opportunity transitioned to Closed Won!
    opp_check = await client.get(f"/api/v1/opportunities/{opp_id}", headers=headers)
    assert opp_check.json()["stage"] == "Closed Won"
    assert opp_check.json()["probability"] == 100

    # 4. Generate Invoice from Sales Order
    inv_resp = await client.post(f"/api/v1/sales-orders/{order_id}/invoice", headers=headers)
    assert inv_resp.status_code == 201
    invoice = inv_resp.json()
    inv_id = invoice["id"]
    assert invoice["ref"].startswith("INV-")
    assert invoice["status"] == "Issued"
    assert float(invoice["balance_due"]) == float(invoice["total_amount"])

    # 5. Record Partial Payment
    total_amt = float(invoice["total_amount"])
    part_payment = 20000.00
    pay1_resp = await client.post(f"/api/v1/invoices/{inv_id}/payment", json={
        "amount": part_payment
    }, headers=headers)
    assert pay1_resp.status_code == 200
    inv_part = pay1_resp.json()
    assert inv_part["status"] == "Partially Paid"
    assert float(inv_part["paid_amount"]) == part_payment
    assert float(inv_part["balance_due"]) == round(total_amt - part_payment, 2)

    # 6. Record Full Remaining Payment
    remaining = float(inv_part["balance_due"])
    pay2_resp = await client.post(f"/api/v1/invoices/{inv_id}/payment", json={
        "amount": remaining
    }, headers=headers)
    assert pay2_resp.status_code == 200
    inv_full = pay2_resp.json()
    assert inv_full["status"] == "Paid"
    assert float(inv_full["balance_due"]) == 0.00
