# SYVORIS Ai™ — API Architecture & Endpoint Specification
**RESTful OpenAPI 3.1 Contract, Authentication, and Payload Schemas**  
*Document Version: 1.0.0 (Phase 0 Discovery Baseline)*  
*Status: Approved Blueprint*

---

## 1. Global API Standards & Conventions

### 1.1 Transport, Protocol & Versioning
- **Base URI:** `https://api.syvoris.com/api/v1` or `https://{tenant_slug}.syvoris.com/api/v1`
- **Protocol:** HTTP/2 over TLS 1.3
- **Format:** Strict JSON (`application/json; charset=utf-8`)
- **API Spec:** OpenAPI 3.1.0 generated natively by Python FastAPI

### 1.2 Authentication & Headers
- **User Authentication:** `Authorization: Bearer <jwt_access_token>`
- **API Key Authentication:** `X-API-Key: syv_live_<random_bytes>` (strictly scoped to a specific tenant)
- **Correlation & Idempotency:**
  - `X-Correlation-ID: <uuid>` (propagated across all services and audit trails)
  - `Idempotency-Key: <unique_string>` (required on financial and conversion mutations: convert lead, submit quote, issue invoice)

### 1.3 Standard Success Response Envelope
For collection endpoints:
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1284,
    "has_more": true
  },
  "links": {
    "next": "/api/v1/opportunities?page=2&limit=50",
    "prev": null
  }
}
```

For single-entity endpoints:
```json
{
  "data": {
    "id": "018f4a21-7291-7f91-8b01-a12903847a99",
    "ref": "OPP-2026-00214",
    "type": "opportunity",
    "attributes": { ... },
    "relationships": { ... },
    "created_at": "2026-11-11T12:00:00Z"
  }
}
```

### 1.4 Standard RFC 7807 Error Envelope
```json
{
  "type": "https://errors.syvoris.com/v1/validation-error",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The commercial line items violate minimum margin policy guardrails.",
  "instance": "/api/v1/quotes/018f4a21-7291-7f91-8b01-a12903847a99/lines",
  "code": "ERR_CPQ_MARGIN_VIOLATION",
  "errors": [
    {
      "field": "line_items[0].discount_pct",
      "message": "Discount exceeds maximum allowed representative threshold of 15.00%."
    }
  ],
  "correlation_id": "c7a8291f-0b32-4d1a-9f44-8841a98e2190"
}
```

---

## 2. Core API Endpoint Catalog

### 2.1 Authentication & Tenancy Service

| Method | Endpoint | Description | Auth Scope | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Self-service tenant registration & admin provisioning | Public | 5 / min |
| `POST` | `/api/v1/auth/login` | Authenticate user credentials, issue JWT access & refresh token | Public | 10 / min |
| `POST` | `/api/v1/auth/refresh` | Exchange valid refresh token for a new access token | Public (Cookie) | 30 / min |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh token and invalidate user session | Bearer | 30 / min |
| `POST` | `/api/v1/auth/password-reset/request`| Trigger password reset email with single-use token | Public | 3 / min |
| `POST` | `/api/v1/auth/password-reset/confirm`| Complete password reset using verified token | Public | 5 / min |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile, roles, and permissions | Bearer | 100 / min |
| `GET` | `/api/v1/tenant/settings` | Get current tenant profile, branding, and active modules | Bearer (`tenant:read`)| 60 / min |
| `PUT` | `/api/v1/tenant/settings` | Update tenant branding, currency, and regional settings | Bearer (`tenant:admin`)| 20 / min |

---

### 2.2 Organizations (Accounts) & Contacts

| Method | Endpoint | Description | Auth Scope |
|---|---|---|---|
| `GET` | `/api/v1/accounts` | List accounts with pagination, text search, and filters | `accounts:read` |
| `POST` | `/api/v1/accounts` | Create an organization master record | `accounts:create` |
| `GET` | `/api/v1/accounts/{id}` | Retrieve account details by ID or reference | `accounts:read` |
| `PUT` | `/api/v1/accounts/{id}` | Update account fields, credit limit, or addresses | `accounts:update` |
| `DELETE`| `/api/v1/accounts/{id}` | Soft-delete an account (moves to Recycle Bin) | `accounts:delete` |
| `GET` | `/api/v1/accounts/{id}/360`| Aggregate Customer 360 view (deals, cases, quotes) | `accounts:read` |
| `GET` | `/api/v1/contacts` | List contacts with filtering by account or consent | `contacts:read` |
| `POST` | `/api/v1/contacts` | Create a new contact linked to an organization | `contacts:create` |
| `GET` | `/api/v1/contacts/{id}` | Retrieve contact profile and direct communication channels | `contacts:read` |
| `PUT` | `/api/v1/contacts/{id}` | Update contact attributes, title, or consent status | `contacts:update` |
| `DELETE`| `/api/v1/contacts/{id}` | Soft-delete a contact | `contacts:delete` |

---

### 2.3 Leads & Conversion Engine

| Method | Endpoint | Description | Auth Scope |
|---|---|---|---|
| `GET` | `/api/v1/leads` | List leads with filtering by score, status, and owner | `leads:read` |
| `POST` | `/api/v1/leads` | Create a lead record (internal sales intake) | `leads:create` |
| `POST` | `/api/v1/public/leads` | Public web-to-lead ingestion endpoint (CORS/CSRF protected)| Public (Tenant Key) |
| `GET` | `/api/v1/leads/{id}` | Get lead qualification details and activity history | `leads:read` |
| `PUT` | `/api/v1/leads/{id}` | Update lead fields, score, priority, or owner | `leads:update` |
| `DELETE`| `/api/v1/leads/{id}` | Soft-delete a lead | `leads:delete` |
| `POST` | `/api/v1/leads/{id}/convert`| **Atomic Lead Conversion Engine:** Transforms a qualified lead into Account, Contact, and Opportunity in a single ACID transaction | `leads:convert` |

#### Lead Conversion Payload Schema:
```json
{
  "account_mode": "create_new", // or "link_existing"
  "existing_account_id": null,
  "new_account": {
    "name": "Caribbean Fiber Solutions",
    "industry": "Telecommunications",
    "segment": "Enterprise",
    "territory": "Caribbean"
  },
  "contact": {
    "first_name": "Marcus",
    "last_name": "Sterling",
    "job_title": "Procurement Director",
    "email": "marcus.sterling@example.test",
    "phone": "+1 876 555 0182",
    "consent_status": "Email and phone permitted"
  },
  "create_opportunity": true,
  "opportunity": {
    "name": "Caribbean Fiber Solutions · Core Infrastructure Expansion",
    "amount": 185000.00,
    "stage": "Qualification",
    "expected_close_date": "2026-12-31"
  }
}
```

---

### 2.4 Opportunities, Pipelines & CPQ

| Method | Endpoint | Description | Auth Scope |
|---|---|---|---|
| `GET` | `/api/v1/opportunities` | List opportunities with stage, pipeline, and risk filters | `deals:read` |
| `POST` | `/api/v1/opportunities` | Create an opportunity record | `deals:create` |
| `GET` | `/api/v1/opportunities/{id}` | Get deal details, stakeholders, and stage history | `deals:read` |
| `PUT` | `/api/v1/opportunities/{id}` | Update deal fields, close date, or win probability | `deals:update` |
| `POST` | `/api/v1/opportunities/{id}/stage` | Advance deal stage with stage-gate validation | `deals:update` |
| `GET` | `/api/v1/quotes` | List commercial quotes with approval status filtering | `quotes:read` |
| `POST` | `/api/v1/quotes` | Create quote with header details and multi-line items | `quotes:create` |
| `GET` | `/api/v1/quotes/{id}` | Retrieve quote specification, calculated lines, and totals | `quotes:read` |
| `PUT` | `/api/v1/quotes/{id}` | Update quote draft lines (recalculates totals on server) | `quotes:update` |
| `POST` | `/api/v1/quotes/{id}/submit` | Submit quote for managerial approval (if threshold breached)| `quotes:update` |
| `POST` | `/api/v1/quotes/{id}/accept` | Accept quote and automatically convert to Sales Order | `quotes:update` |
| `GET` | `/api/v1/quotes/{id}/pdf` | Generate official branded quote PDF document | `quotes:read` |
| `GET` | `/api/v1/orders` | List sales orders with fulfilment stage filters | `orders:read` |
| `POST` | `/api/v1/orders/{id}/fulfilment`| Advance order dispatch stage (Allocated, Shipped, Delivered) | `orders:update` |
| `GET` | `/api/v1/invoices` | List customer invoice ledger with overdue filters | `invoices:read` |

---

### 2.5 Customer Service & Case Management

| Method | Endpoint | Description | Auth Scope |
|---|---|---|---|
| `GET` | `/api/v1/cases` | List support cases with priority, SLA, and queue filters | `cases:read` |
| `POST` | `/api/v1/cases` | Create a support case | `cases:create` |
| `GET` | `/api/v1/cases/{id}` | Retrieve case details, SLA timers, and conversation thread | `cases:read` |
| `PUT` | `/api/v1/cases/{id}` | Update case status, assigned agent, or priority | `cases:update` |
| `POST` | `/api/v1/cases/{id}/resolve` | Resolve case with mandatory resolution summary & CSAT trigger| `cases:update` |
| `GET` | `/api/v1/knowledge/articles` | Search published knowledge articles with full-text query | `knowledge:read` |
| `POST` | `/api/v1/knowledge/articles` | Publish or draft a knowledge base article | `knowledge:create` |

---

### 2.6 Workflows & Approval Engine

| Method | Endpoint | Description | Auth Scope |
|---|---|---|---|
| `GET` | `/api/v1/workflows` | List configured business automation rules | `workflows:admin` |
| `POST` | `/api/v1/workflows` | Create a visual workflow definition | `workflows:admin` |
| `PUT` | `/api/v1/workflows/{id}/status`| Toggle workflow active/paused state | `workflows:admin` |
| `GET` | `/api/v1/approvals` | List pending approval requests for current user/role | `approvals:read` |
| `POST` | `/api/v1/approvals/{id}/decide`| Grant human approval or reject with mandatory justification | `approvals:decide` |

---

### 2.7 AI Intelligence & Governed Agent Workforce

| Method | Endpoint | Description | Auth Scope |
|---|---|---|---|
| `POST` | `/api/v1/ai/copilot/chat` | Send conversational prompt to CRM Copilot (RAG grounded) | `ai:copilot` |
| `GET` | `/api/v1/ai/agents` | List 14 specialist agent personas and operational status | `ai:agents:read` |
| `PUT` | `/api/v1/ai/agents/{id}/autonomy`| Configure agent autonomy level (Suggest Only, Act with Approval)| `ai:admin` |
| `GET` | `/api/v1/ai/proposals` | List pending AI action proposals awaiting human review | `ai:proposals:read` |
| `POST` | `/api/v1/ai/proposals/{id}/execute`| Authorize and execute a staged AI action proposal | `ai:proposals:approve` |
| `POST` | `/api/v1/ai/revenue-twin/simulate`| Run pipeline what-if scenario simulations | `ai:analytics` |

---

### 2.8 Integrations & Outbound Webhooks

| Method | Endpoint | Description | Auth Scope |
|---|---|---|---|
| `GET` | `/api/v1/integrations` | List configured external connectors and health status | `integrations:admin` |
| `POST` | `/api/v1/integrations/{name}/sync`| Trigger synchronization job for designated connector | `integrations:admin` |
| `POST` | `/api/v1/integrations/radium/sync`| Trigger bi-directional master catalog & order sync with Radium ERP | `integrations:admin` |
| `GET` | `/api/v1/webhooks/subscriptions`| List registered outbound webhook endpoints | `webhooks:admin` |
| `POST` | `/api/v1/webhooks/subscriptions`| Register an outbound webhook URL with subscribed topics | `webhooks:admin` |
| `GET` | `/api/v1/webhooks/deliveries` | View historical webhook delivery attempts and HTTP status codes | `webhooks:admin` |
