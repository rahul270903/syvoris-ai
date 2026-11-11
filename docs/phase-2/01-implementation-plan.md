# SYVORIS Ai™ — Phase 2: Customer 360, Accounts, Contacts & Foundations
## Architectural & Implementation Plan

**Product:** SYVORIS Ai™ — Enterprise CRM, Sales & Marketing  
**Phase:** Phase 2 — Core CRM Data Foundation (Customer 360, Accounts, Contacts & Activities)  
**Version:** 1.0.0  
**Date:** 2026-11-12  

---

## 1. Executive Summary & Objectives

Phase 2 establishes the core CRM relationship tier for SYVORIS Ai. Moving beyond the tenant and identity foundation established in Phase 1, Phase 2 implements a robust, multi-tenant enterprise data model for:
1. **Accounts (Organizations Master)**: Company records, hierarchy, industry classification, financial parameters, addresses, ownership, and lifecycle status.
2. **Contacts (People Master)**: Individual stakeholders, title, department, communication coordinates, primary contact designation, and explicit association with parent accounts.
3. **Customer 360 & Activity Timeline**: Unified aggregation of account intelligence, associated contacts, activity timeline, and relationship notes.
4. **Tenant-Strict PostgreSQL RLS & RBAC**: Database-level kernel isolation on all customer tables using the existing `app.current_tenant_id` session setting and role-based permissions (`accounts:read`, `accounts:write`, `contacts:read`, `contacts:write`).

---

## 2. Technical Architecture & Database Schema

### 2.1 Database Models (`backend/app/models/crm.py`)

All core CRM tables inherit from `TenantScopedModel` (`tenant_id`, `id`, `created_at`, `updated_at`, `deleted_at`).

#### 1. `Account` (`accounts`)
- `id`: UUID (Primary Key)
- `tenant_id`: UUID (Foreign Key -> `tenants.id`, ON DELETE CASCADE)
- `ref`: VARCHAR(32) NOT NULL (e.g., `ACC-2026-00001`, unique per tenant)
- `name`: VARCHAR(255) NOT NULL (Company name)
- `account_type`: VARCHAR(50) NOT NULL DEFAULT 'Customer' (Customer, Prospect, Partner, Vendor, Reseller)
- `industry`: VARCHAR(100) (e.g., Telecommunications, Healthcare, Finance, SaaS)
- `website`: VARCHAR(255)
- `phone`: VARCHAR(50)
- `email`: VARCHAR(255)
- `ownership`: VARCHAR(50) DEFAULT 'Private' (Public, Private, Subsidiary, Government)
- `status`: VARCHAR(50) NOT NULL DEFAULT 'Active' (Active, Inactive, Onboarding, Archived)
- `description`: TEXT
- `billing_address`: JSONB DEFAULT `{}`
- `shipping_address`: JSONB DEFAULT `{}`
- `credit_limit`: NUMERIC(15, 2) DEFAULT 0.00
- `owner_id`: UUID (Foreign Key -> `users.id`, nullable)
- `owner_name`: VARCHAR(255)
- `custom_fields`: JSONB DEFAULT `{}`
- `parent_id`: UUID (Foreign Key -> `accounts.id` self-referential, ON DELETE SET NULL)
- `created_by`: UUID (Foreign Key -> `users.id`)
- `updated_by`: UUID (Foreign Key -> `users.id`)

#### 2. `Contact` (`contacts`)
- `id`: UUID (Primary Key)
- `tenant_id`: UUID (Foreign Key -> `tenants.id`, ON DELETE CASCADE)
- `account_id`: UUID (Foreign Key -> `accounts.id`, ON DELETE SET NULL)
- `ref`: VARCHAR(32) NOT NULL (e.g., `CON-2026-00001`, unique per tenant)
- `first_name`: VARCHAR(100) NOT NULL
- `last_name`: VARCHAR(100) NOT NULL
- `email`: VARCHAR(255) NOT NULL
- `phone`: VARCHAR(50)
- `job_title`: VARCHAR(100)
- `department`: VARCHAR(100)
- `status`: VARCHAR(50) NOT NULL DEFAULT 'Active' (Active, Inactive, Archived)
- `is_primary`: BOOLEAN NOT NULL DEFAULT false
- `is_decision_maker`: BOOLEAN NOT NULL DEFAULT false
- `owner_id`: UUID (Foreign Key -> `users.id`, nullable)
- `owner_name`: VARCHAR(255)
- `description`: TEXT
- `custom_fields`: JSONB DEFAULT `{}`
- `created_by`: UUID (Foreign Key -> `users.id`)
- `updated_by`: UUID (Foreign Key -> `users.id`)

#### 3. `CRMActivity` (`crm_activities`)
- `id`: UUID (Primary Key)
- `tenant_id`: UUID (Foreign Key -> `tenants.id`, ON DELETE CASCADE)
- `account_id`: UUID (Foreign Key -> `accounts.id`, ON DELETE CASCADE)
- `contact_id`: UUID (Foreign Key -> `contacts.id`, ON DELETE SET NULL)
- `activity_type`: VARCHAR(50) NOT NULL (Note, Call, Meeting, Email, Task, StatusChange)
- `subject`: VARCHAR(255) NOT NULL
- `description`: TEXT
- `occurred_at`: TIMESTAMPTZ NOT NULL DEFAULT now()
- `actor_id`: UUID (Foreign Key -> `users.id`, nullable)
- `actor_name`: VARCHAR(255) NOT NULL
- `metadata`: JSONB DEFAULT `{}`

### 2.2 PostgreSQL Row-Level Security (RLS)

In Alembic migration `003_accounts_and_contacts.py`:
- `ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;`
- `ALTER TABLE accounts FORCE ROW LEVEL SECURITY;`
- `CREATE POLICY accounts_tenant_isolation ON accounts AS RESTRICTIVE USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);`
- Identical RLS enabled and forced for `contacts` and `crm_activities`.

---

## 3. API Specifications (`backend/app/api/v1/endpoints/`)

### 3.1 Accounts Endpoints (`/api/v1/accounts`)
- `GET /api/v1/accounts` — List accounts with query search, industry filter, status filter, sorting, and pagination (`page`, `limit`). Protected by `accounts:read`.
- `POST /api/v1/accounts` — Create an account. Auto-generates sequential `ACC-YYYY-XXXXX` ref, logs audit event `account.created`. Protected by `accounts:write`.
- `GET /api/v1/accounts/{id}` — Get single account with owner and contacts count. Protected by `accounts:read`.
- `PUT /api/v1/accounts/{id}` — Update account fields. Logs audit event `account.updated`. Protected by `accounts:write`.
- `DELETE /api/v1/accounts/{id}` — Soft delete (archive) account. Sets `deleted_at = now()`, logs audit event `account.archived`. Protected by `accounts:write`.
- `GET /api/v1/accounts/{id}/360` — Aggregated Customer 360 overview: account details, all associated contacts, recent activities, and metrics. Protected by `accounts:read`.
- `POST /api/v1/accounts/{id}/activities` — Log note or activity on account. Protected by `accounts:write`.

### 3.2 Contacts Endpoints (`/api/v1/contacts`)
- `GET /api/v1/contacts` — List contacts with search, account filter, status filter, pagination. Protected by `contacts:read`.
- `POST /api/v1/contacts` — Create contact. Auto-generates `CON-YYYY-XXXXX` ref, links to account, logs `contact.created`. Protected by `contacts:write`.
- `GET /api/v1/contacts/{id}` — Get contact details with linked account details. Protected by `contacts:read`.
- `PUT /api/v1/contacts/{id}` — Update contact fields. Logs `contact.updated`. Protected by `contacts:write`.
- `DELETE /api/v1/contacts/{id}` — Soft delete (archive) contact. Sets `deleted_at = now()`, logs `contact.archived`. Protected by `contacts:write`.

---

## 4. Frontend Integration Plan

1. **API Client (`src/services/api.ts`)**:
   - Add typed API methods: `listAccounts`, `createAccount`, `getAccount`, `updateAccount`, `deleteAccount`, `getAccount360`, `createAccountActivity`, `listContacts`, `createContact`, `getContact`, `updateContact`, `deleteContact`.
2. **Workspace & Navigation Integration**:
   - Preserve all 132 existing routes in `src/App.tsx`.
   - Update `WorkspacePage.tsx` for `/organizations` and `/contacts` so records are fetched directly from `/api/v1/accounts` and `/api/v1/contacts`, mapped cleanly into the existing CRM data structure.
   - Wire form submissions (`Create`, `Edit`, `Archive/Delete`) directly to the backend API endpoints.
   - Update `Customer360View.tsx` to display real backend Customer 360 data, associated contacts, and interactive activity logging.

---

## 5. Verification & Acceptance Criteria

1. **Unit & Integration Tests**:
   - `test_accounts.py`: CRUD operations, pagination, search, archiving.
   - `test_contacts.py`: CRUD operations, account linking, primary contact toggle.
   - `test_customer360.py`: Aggregate view verification, activity timeline creation.
2. **Security & Isolation Tests**:
   - Native PostgreSQL 18.1 RLS tests proving Tenant A cannot view, update, or delete Tenant B's accounts or contacts, even if requested by ID.
   - RBAC tests verifying permission enforcement (`accounts:read`, `accounts:write`, `contacts:read`, `contacts:write`).
3. **Frontend Verification**:
   - `npm run check:project` verifying 132 routes and 33 source files intact.
   - `npm run typecheck` passing with zero errors.
   - `npm run build` completing with clean production bundles.
