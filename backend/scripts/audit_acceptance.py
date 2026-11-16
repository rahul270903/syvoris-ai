import urllib.request
import urllib.error
import json
import uuid

BASE_URL = 'http://127.0.0.1:8000/api/v1'

def api_call(path, method='GET', data=None, token=None, tenant_id=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    if tenant_id:
        headers['X-Tenant-ID'] = str(tenant_id)
    url = f'{BASE_URL}{path}'
    body = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            content = resp.read().decode('utf-8')
            return status, json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        try:
            err_json = json.loads(content)
        except Exception:
            err_json = content
        return e.code, err_json

def run_acceptance_audit():
    print('Starting Comprehensive Acceptance Audit...')

    # 1. Login
    status, res = api_call('/auth/login', method='POST', data={'email': 'arjun.mehta@example.com', 'password': 'Password123!'})
    assert status == 200, f'Login failed: {res}'
    token = res['access_token']
    tenant_id = res['tenant_id']
    print(f'Auth OK. Tenant ID: {tenant_id}')

    audit_results = {}

    # -------------------------------------------------------------
    # 1. Categories Audit
    # -------------------------------------------------------------
    print('\n--- 1. CATEGORIES AUDIT ---')
    s, items = api_call('/catalog/categories', token=token, tenant_id=tenant_id)
    assert s == 200 and len(items) >= 7, f'Categories list failed: {items}'
    root_id = items[0]['id']

    test_cat_data = {
        'name': 'Audit Temp Category',
        'slug': f'audit-temp-{uuid.uuid4().hex[:6]}',
        'category_type': 'Product',
        'parent_id': root_id,
        'sort_order': 99,
        'is_active': True,
        'description': 'Temporary category for acceptance testing'
    }
    s, created = api_call('/catalog/categories', method='POST', data=test_cat_data, token=token, tenant_id=tenant_id)
    assert s == 201, f'Create category failed: {created}'
    cat_id = created['id']
    print(f'Created category: {created["name"]} (ID: {cat_id})')

    s, updated = api_call(f'/catalog/categories/{cat_id}', method='PUT', data={'name': 'Audit Updated Cat', 'description': 'Updated desc'}, token=token, tenant_id=tenant_id)
    assert s == 200 and updated['name'] == 'Audit Updated Cat'

    # Business Logic: Self-parent / cycle rejection
    s, err = api_call(f'/catalog/categories/{cat_id}', method='PUT', data={'parent_id': cat_id}, token=token, tenant_id=tenant_id)
    assert s in (400, 422), f'Cycle prevention failed: {s}, {err}'
    print('Cycle prevention verified (self-parent rejected).')

    s, _ = api_call(f'/catalog/categories/{cat_id}', method='DELETE', token=token, tenant_id=tenant_id)
    assert s == 204, f'Delete category failed: {s}'
    print('Category isolated CRUD & validation verified.')
    audit_results['Categories'] = 'VERIFIED'

    # -------------------------------------------------------------
    # 2. Products Audit
    # -------------------------------------------------------------
    print('\n--- 2. PRODUCTS AUDIT ---')
    s, res = api_call('/products', token=token, tenant_id=tenant_id)
    assert s == 200
    test_sku = f'AUDIT-PRD-{uuid.uuid4().hex[:6].upper()}'
    s, created = api_call('/products', method='POST', data={
        'name': 'Audit Fiber Transceiver',
        'sku': test_sku,
        'category': 'Optical Hardware',
        'standard_price': 499.50,
        'cost_price': 250.00,
        'tax_category': 'Standard',
        'is_active': True
    }, token=token, tenant_id=tenant_id)
    assert s == 201, f'Create product failed: {created}'
    prd_id = created['id']

    # Business Logic: Unique SKU constraint
    s, err = api_call('/products', method='POST', data={
        'name': 'Duplicate SKU Product',
        'sku': test_sku,
        'standard_price': 100.00
    }, token=token, tenant_id=tenant_id)
    assert s in (400, 422), f'Unique SKU validation failed: {s}, {err}'
    print(f'Unique SKU validation verified ({test_sku} duplicate rejected).')

    s, updated = api_call(f'/products/{prd_id}', method='PUT', data={'standard_price': 549.99}, token=token, tenant_id=tenant_id)
    assert s == 200 and float(updated['standard_price']) == 549.99

    s, _ = api_call(f'/products/{prd_id}', method='DELETE', token=token, tenant_id=tenant_id)
    assert s == 204
    print('Products isolated CRUD & SKU uniqueness verified.')
    audit_results['Products'] = 'VERIFIED'

    # -------------------------------------------------------------
    # 3. Services Audit
    # -------------------------------------------------------------
    print('\n--- 3. SERVICES AUDIT ---')
    s, items = api_call('/catalog/services', token=token, tenant_id=tenant_id)
    assert s == 200 and len(items) >= 4

    test_code = f'SRV-AUDIT-{uuid.uuid4().hex[:6].upper()}'
    s, created = api_call('/catalog/services', method='POST', data={
        'name': 'Audit Dark Fiber Maintenance',
        'code': test_code,
        'standard_rate': 1250.00,
        'cost_rate': 600.00,
        'duration_unit': 'Monthly',
        'billing_method': 'Recurring',
        'tax_category': 'Standard',
        'status': 'Active',
        'is_active': True
    }, token=token, tenant_id=tenant_id)
    assert s == 201, f'Create service failed: {created}'
    srv_id = created['id']

    s, updated = api_call(f'/catalog/services/{srv_id}', method='PUT', data={'standard_rate': 1350.00}, token=token, tenant_id=tenant_id)
    assert s == 200 and float(updated['standard_rate']) == 1350.00

    s, _ = api_call(f'/catalog/services/{srv_id}', method='DELETE', token=token, tenant_id=tenant_id)
    assert s == 204
    print('Services isolated CRUD & rate update verified.')
    audit_results['Services'] = 'VERIFIED'

    # -------------------------------------------------------------
    # 4. Bundles Audit
    # -------------------------------------------------------------
    print('\n--- 4. BUNDLES AUDIT ---')
    s, items = api_call('/catalog/bundles', token=token, tenant_id=tenant_id)
    assert s == 200 and len(items) >= 2

    bundle_code = f'BND-AUDIT-{uuid.uuid4().hex[:6].upper()}'
    s, created = api_call('/catalog/bundles', method='POST', data={
        'name': 'Audit Turnkey Metro Bundle',
        'bundle_code': bundle_code,
        'pricing_model': 'Component-based',
        'bundle_price': 2500.00,
        'discount_pct': 10.0,
        'status': 'Active',
        'is_active': True,
        'components': []
    }, token=token, tenant_id=tenant_id)
    assert s == 201, f'Create bundle failed: {created}'
    bnd_id = created['id']

    s, updated = api_call(f'/catalog/bundles/{bnd_id}', method='PUT', data={'discount_pct': 15.0}, token=token, tenant_id=tenant_id)
    assert s == 200 and float(updated['discount_pct']) == 15.0

    s, _ = api_call(f'/catalog/bundles/{bnd_id}', method='DELETE', token=token, tenant_id=tenant_id)
    assert s == 204
    print('Bundles isolated CRUD & discount model verified.')
    audit_results['Bundles'] = 'VERIFIED'

    # -------------------------------------------------------------
    # 5. Product Availability Audit
    # -------------------------------------------------------------
    print('\n--- 5. PRODUCT AVAILABILITY AUDIT ---')
    s, items = api_call('/catalog/availability', token=token, tenant_id=tenant_id)
    assert s == 200 and len(items) >= 4

    s, created = api_call('/catalog/availability', method='POST', data={
        'item_name': 'Audit DWDM Optical Switch',
        'status': 'Available',
        'channel': 'Direct Enterprise',
        'region': 'Kingston Metro',
        'lead_time_days': 5,
        'notes': 'Staged in Kingston Central Hub',
        'is_active': True
    }, token=token, tenant_id=tenant_id)
    assert s == 201, f'Create availability failed: {created}'
    avl_id = created['id']

    s, updated = api_call(f'/catalog/availability/{avl_id}', method='PUT', data={'lead_time_days': 7}, token=token, tenant_id=tenant_id)
    assert s == 200 and updated['lead_time_days'] == 7

    s, _ = api_call(f'/catalog/availability/{avl_id}', method='DELETE', token=token, tenant_id=tenant_id)
    assert s == 204
    print('Product Availability isolated CRUD & lead time verified.')
    audit_results['Product Availability'] = 'VERIFIED'

    # -------------------------------------------------------------
    # 6. Tax Management Audit
    # -------------------------------------------------------------
    print('\n--- 6. TAX MANAGEMENT AUDIT ---')
    s, items = api_call('/inventory/taxes', token=token, tenant_id=tenant_id)
    assert s == 200 and len(items) >= 3

    tax_code = f'TAX-AUDIT-{uuid.uuid4().hex[:4].upper()}'
    s, created = api_call('/inventory/taxes', method='POST', data={
        'name': 'Audit Environmental Surcharge',
        'code': tax_code,
        'rate': 2.50,
        'region': 'Jamaica National',
        'tax_type': 'Standard',
        'status': 'Active'
    }, token=token, tenant_id=tenant_id)
    assert s == 201, f'Create tax rule failed: {created}'
    tax_id = created['id']

    s, updated = api_call(f'/inventory/taxes/{tax_id}', method='PUT', data={'rate': 3.00}, token=token, tenant_id=tenant_id)
    assert s == 200 and float(updated['rate']) == 3.00

    s, _ = api_call(f'/inventory/taxes/{tax_id}', method='DELETE', token=token, tenant_id=tenant_id)
    assert s == 204
    print('Tax Management isolated CRUD & Decimal precision verified.')
    audit_results['Tax Management'] = 'VERIFIED'

    # -------------------------------------------------------------
    # 7. Terms & Conditions Audit
    # -------------------------------------------------------------
    print('\n--- 7. TERMS & CONDITIONS AUDIT ---')
    s, items = api_call('/inventory/terms', token=token, tenant_id=tenant_id)
    assert s == 200 and len(items) >= 3

    s, created = api_call('/inventory/terms', method='POST', data={
        'title': 'Audit Master Service Terms',
        'version': '1.0',
        'category': 'Commercial',
        'content': 'Audit contract terms boilerplate and SLA guarantees.',
        'status': 'Draft'
    }, token=token, tenant_id=tenant_id)
    assert s == 201, f'Create terms failed: {created}'
    trm_id = created['id']

    s, updated = api_call(f'/inventory/terms/{trm_id}', method='PUT', data={'version': '1.1', 'title': 'Audit Master Service Terms v1.1'}, token=token, tenant_id=tenant_id)
    assert s == 200 and updated['version'] == '1.1'

    s, _ = api_call(f'/inventory/terms/{trm_id}', method='DELETE', token=token, tenant_id=tenant_id)
    assert s == 204
    print('Terms & Conditions isolated CRUD & revision tracking verified.')
    audit_results['Terms and Conditions'] = 'VERIFIED'

    # -------------------------------------------------------------
    # 8. Stock Management & Movements Audit
    # -------------------------------------------------------------
    print('\n--- 8. STOCK MANAGEMENT AUDIT ---')
    s, items = api_call('/inventory/stock', token=token, tenant_id=tenant_id)
    assert s == 200 and len(items) >= 4, f'Stock list failed: {items}'
    stock_item = items[0]
    stock_item_id = stock_item['id']
    initial_on_hand = stock_item['quantity_on_hand']

    # Atomic movement (Receipt)
    s, mvt = api_call('/inventory/movements', method='POST', data={
        'inventory_item_id': stock_item_id,
        'movement_type': 'Receipt',
        'quantity': 10,
        'reason': 'Audit shipment arrival'
    }, token=token, tenant_id=tenant_id)
    assert s == 201, f'Stock movement failed: {mvt}'

    s, updated_item = api_call(f'/inventory/items/{stock_item_id}', token=token, tenant_id=tenant_id)
    assert float(updated_item['quantity_on_hand']) == float(initial_on_hand) + 10

    # Business Logic: Negative stock guard
    s, err = api_call('/inventory/movements', method='POST', data={
        'inventory_item_id': stock_item_id,
        'movement_type': 'Issue',
        'quantity': 999999,
        'reason': 'Excessive issue attempt'
    }, token=token, tenant_id=tenant_id)
    assert s in (400, 422), f'Negative stock prevention failed: {s}, {err}'
    print('Negative stock prevention verified (excessive issue rejected).')

    # Reverse test movement to restore exact original balance
    s, _ = api_call('/inventory/movements', method='POST', data={
        'inventory_item_id': stock_item_id,
        'movement_type': 'Issue',
        'quantity': 10,
        'reason': 'Audit rollback'
    }, token=token, tenant_id=tenant_id)
    assert s == 201

    s, final_item = api_call(f'/inventory/items/{stock_item_id}', token=token, tenant_id=tenant_id)
    assert float(final_item['quantity_on_hand']) == float(initial_on_hand)
    print(f'Stock ledger & balance restoration verified (on_hand restored to {initial_on_hand}).')
    audit_results['Stock Management'] = 'VERIFIED'

    # -------------------------------------------------------------
    # 9. Vendors Audit
    # -------------------------------------------------------------
    print('\n--- 9. VENDORS AUDIT ---')
    s, items = api_call('/vendors', token=token, tenant_id=tenant_id)
    assert s == 200 and len(items) >= 3

    s, acc = api_call('/accounts', method='POST', data={
        'name': f'Audit Vendor Partner {uuid.uuid4().hex[:6]}',
        'account_type': 'Vendor',
        'industry': 'Telecommunications Hardware'
    }, token=token, tenant_id=tenant_id)
    assert s == 201
    acc_id = acc['id']

    vendor_code = f'VND-AUDIT-{uuid.uuid4().hex[:6].upper()}'
    s, created = api_call('/vendors', method='POST', data={
        'account_id': acc_id,
        'vendor_code': vendor_code,
        'vendor_category': 'Civil & Construction Works',
        'payment_terms': 'Net 45',
        'rating': 4.8,
        'status': 'Active',
        'compliance_notes': 'Full safety & fiber splicing certifications verified.'
    }, token=token, tenant_id=tenant_id)
    assert s == 201, f'Create vendor failed: {created}'
    vnd_id = created['id']

    s, updated = api_call(f'/vendors/{vnd_id}', method='PUT', data={'rating': 4.9}, token=token, tenant_id=tenant_id)
    assert s == 200 and float(updated['rating']) == 4.9

    s, _ = api_call(f'/vendors/{vnd_id}', method='DELETE', token=token, tenant_id=tenant_id)
    assert s == 204
    s, _ = api_call(f'/accounts/{acc_id}', method='DELETE', token=token, tenant_id=tenant_id)
    print('Vendors isolated CRUD & CRM Account relationship verified.')
    audit_results['Vendors'] = 'VERIFIED'

    # -------------------------------------------------------------
    # 10. Security & RBAC Audit
    # -------------------------------------------------------------
    print('\n--- 10. SECURITY & RBAC AUDIT ---')
    s, unauth = api_call('/catalog/categories')
    assert s in (401, 403), f'Unauthenticated access not blocked: {s}'
    print('Unauthenticated request rejection verified (HTTP 401/403).')

    # B. Tenant Isolation check: Register a second isolated tenant
    tenant_2_slug = f'tenant-iso-{uuid.uuid4().hex[:6]}'
    s, reg_res = api_call('/auth/register', method='POST', data={
        'organization_name': 'Isolated Test Organization',
        'tenant_slug': tenant_2_slug,
        'first_name': 'Iso',
        'last_name': 'User',
        'email': f'iso.{uuid.uuid4().hex[:6]}@example.com',
        'password': 'Password123!'
    })
    assert s == 201, f'Register isolated tenant failed: {reg_res}'
    token_2 = reg_res['access_token']
    tenant_id_2 = reg_res['tenant_id']

    # Query categories as Tenant 2
    s, items_tenant_2 = api_call('/catalog/categories', token=token_2)
    assert s == 200
    assert len(items_tenant_2) == 0, f'Tenant isolation leak: Tenant 2 saw Tenant 1 categories: {items_tenant_2}'
    print(f'Tenant isolation verified (Tenant 2 isolated: saw 0 records from Tenant 1).')

    # Query products as Tenant 2
    s, prd_tenant_2 = api_call('/products', token=token_2)
    assert s == 200
    # Confirm none of Tenant 1's products are visible
    assert all(p['tenant_id'] == str(tenant_id_2) for p in prd_tenant_2.get('items', []))
    assert not any(p['tenant_id'] == str(tenant_id) for p in prd_tenant_2.get('items', []))
    print('Tenant isolation verified for products (0 records from Tenant 1 leaked to Tenant 2).')

    # Query services as Tenant 2
    s, srv_tenant_2 = api_call('/catalog/services', token=token_2)
    assert s == 200
    assert len(srv_tenant_2) == 0, f'Tenant isolation leak in services: {srv_tenant_2}'
    print('Tenant isolation verified for services (Tenant 2 saw 0 records from Tenant 1).')

    # Query stock as Tenant 2
    s, stock_tenant_2 = api_call('/inventory/stock', token=token_2)
    assert s == 200
    assert len(stock_tenant_2) == 0, f'Tenant isolation leak in stock: {stock_tenant_2}'
    print('Tenant isolation verified for stock (Tenant 2 saw 0 records from Tenant 1).')

    # Query vendors as Tenant 2
    s, vnd_tenant_2 = api_call('/vendors', token=token_2)
    assert s == 200
    assert len(vnd_tenant_2) == 0, f'Tenant isolation leak in vendors: {vnd_tenant_2}'
    print('Tenant isolation verified for vendors (Tenant 2 saw 0 records from Tenant 1).')

    print('\n======================================================')
    print('ALL 9 MODULE AUDITS COMPLETED SUCCESSFULLY!')
    print('======================================================')
    for k, v in audit_results.items():
        print(f'  {k:25}: {v}')

if __name__ == '__main__':
    run_acceptance_audit()
