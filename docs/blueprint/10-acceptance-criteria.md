# SYVORIS Ai™ — Functional Acceptance Criteria & Definition of Done
**Quality Standards, Verification Checklists, and Module Acceptance Gates**  
*Document Version: 1.0.0 (Phase 0 Discovery Baseline)*  
*Status: Approved Blueprint*

---

## 1. Global Definition of Done (DoD)

A module or feature within SYVORIS Ai™ is **NOT** considered complete simply because its user interface, routes, or buttons exist. To be certified as **Production Complete**, every module must fulfill all six tiers of the Quality Standard:

### Tier 1: Frontend & User Experience
- [ ] Responsive UI rendered cleanly across desktop (1920x1080, 1440x900) and mobile tablet viewports.
- [ ] Zero unhandled JavaScript errors or React rendering console warnings.
- [ ] Proper loading skeletons, realistic empty states (`EmptyState.tsx`), and clear error feedback toasts.
- [ ] Client-side form validation matching server-side constraints (required fields, email format, non-negative numbers).
- [ ] Preservation of the established SYVORIS Ai visual identity (Navy/Electric Blue/Cyan palette).

### Tier 2: Backend Architecture & Business Rules
- [ ] Endpoints implement versioned REST conventions (`/api/v1/*`) and strict Pydantic v2 schemas.
- [ ] All business calculations (discounts, taxes, margins, SLA targets) are calculated authoritatively on the backend.
- [ ] Financial and conversion mutations require an `Idempotency-Key` header to prevent duplicate operations.
- [ ] Standardized RFC 7807 problem details returned on all 4xx/5xx errors.

### Tier 3: Database & Multi-Tenant Security
- [ ] Tables possess a non-nullable `tenant_id` foreign key with active PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`).
- [ ] Soft deletion (`deleted_at`) implemented across all business records; queries default to active records.
- [ ] Primary keys use UUIDs; foreign keys enforce referential integrity (`ON DELETE RESTRICT` for financial records).
- [ ] Appropriate indexes created for filtered, sorted, and foreign key columns.

### Tier 4: Access Control & Field-Level Security (RBAC/FLS)
- [ ] Every endpoint verifies user role permissions before processing requests.
- [ ] Record ownership scopes (Private, Team, Territory, Public) enforced on all read/write queries.
- [ ] Field-Level Security masks or strips restricted attributes from API responses based on user role.

### Tier 5: Auditability & Activity Provenance
- [ ] Every create, update, delete, stage change, and approval is recorded in the append-only `audit_ledger`.
- [ ] Material changes append a record to the entity's activity history and emit a domain event to the event bus.

### Tier 6: Automated Testing & Verification
- [ ] Unit tests covering domain business logic (e.g., pricing formulas, SLA countdowns).
- [ ] Integration tests verifying API endpoints and database transaction rollback on error.
- [ ] Dedicated multi-tenant isolation tests verifying zero cross-tenant record leakage.

---

## 2. Module-Specific Acceptance Criteria

### 2.1 Organizations (Accounts) & Contacts
- **CR-01 (Account Creation):** Users can create an account with valid name, industry, segment, territory, and addresses. Attempting to create an account with an identical reference within the same tenant fails with `HTTP 409 Conflict`.
- **CR-02 (Parent-Child Hierarchy):** Setting a parent organization displays proper recursive indentation in hierarchy views; circular parent references are rejected by server validation.
- **CR-03 (Customer 360 Aggregation):** Opening an account profile aggregates all linked contacts, opportunities, quotes, sales orders, invoices, cases, projects, and activities in a single payload returning in < 150ms.
- **CR-04 (Duplicate Detection):** Triggering duplicate scan flags contacts or accounts with matching normalized email addresses or phone numbers. Merging two records re-points all child deals, cases, and quotes to the surviving record and soft-deletes the duplicate with an audit log.

### 2.2 Leads & Atomic Lead Conversion
- **LD-01 (Lead Intake):** Inbound webform submissions create unassigned leads stamped with the webform source and initial calculated lead score.
- **LD-02 (Lead Scoring):** Updating lead attributes (e.g., employee count, industry) recalculates lead score dynamically with explainable positive/negative factors.
- **LD-03 (Atomic Lead Conversion Engine):**
  - Executing `POST /api/v1/leads/{id}/convert` wraps Account creation, Contact creation, and Opportunity creation in a single ACID transaction.
  - If any step fails (e.g., missing required deal close date), the entire transaction rolls back; zero orphan accounts or contacts are created.
  - On success, the lead status transitions to `Converted`, and historical lead notes/activities are copied to the new Account and Opportunity.

### 2.3 Sales Pipelines, Opportunities & CPQ
- **OP-01 (Pipeline Stage Progression):** Moving a deal forward in the Kanban pipeline validates mandatory stage gate fields (e.g., moving to 'Proposal' requires an active primary contact and budget confirmation).
- **OP-02 (Stage Duration Tracking):** Every stage transition records the timestamp and duration in the deal history, enabling funnel velocity reporting.
- **OP-03 (Multi-Line CPQ Calculations):**
  - Line item total equals `quantity * unitPrice * (1 - discount/100) * (1 + taxRate/100)`.
  - Server recalculates all line items and grand totals upon save; client-calculated totals are ignored.
  - Header discounts apply proportionally across taxable lines.
- **OP-04 (Discount Governance & Approval Gate):**
  - Quotes with line discounts exceeding the sales rep threshold (e.g., > 15%) automatically lock into `Pending Approval` status.
  - The quote cannot be converted to a Sales Order or downloaded as an accepted document until approved by an authorized manager in `/approvals`.
- **OP-05 (Quote Versioning):** Editing an approved or sent quote forks a new revision (e.g., `QT-2026-001.2`); previous versions remain locked for audit compliance.
- **OP-06 (Order & Invoice Generation):** Accepting a quote transitions status to `Accepted`, generates a linked Sales Order with identical line items, and updates the source Opportunity stage to `Closed Won`.

### 2.4 Customer Service & SLA Engine
- **CS-01 (Email-to-Case Threading):** Inbound emails referencing an existing case ticket token (e.g., `[CASE-2026-00318]`) in the subject append to the existing case conversation thread; new subjects create a new categorized case.
- **CS-02 (SLA Countdown Timers):**
  - High-priority cases calculate First Response Time (e.g., 2 hours) and Resolution Time (e.g., 8 hours) based strictly on configured tenant business hours.
  - Setting case status to `Awaiting Customer Response` pauses the active SLA timer.
  - Transitioning back to `In Progress` resumes the SLA countdown from the remaining time balance.
- **CS-03 (SLA Breach Escalation):** When an active case reaches 80% of its SLA deadline without response, an automated warning notification is dispatched. Upon 100% breach, ticket priority is bumped and the supervisor is alerted.
- **CS-04 (CSAT Collection):** Resolving a case dispatches a single-use CSAT survey link to the customer contact; submitting a rating updates the case CSAT score and team satisfaction analytics.

### 2.5 Workflow Automation & Approval Engine
- **WF-01 (Event-Driven Execution):** Emitting a domain event (`lead.created`, `quote.submitted`, `deal.won`) asynchronously triggers matching active workflow rules within < 500ms.
- **WF-02 (Delayed Timers):** Time-delayed actions (e.g., send follow-up email 48 hours after quote delivery) persist in Celery Beat and execute accurately at the target timestamp unless cancelled by a state change (e.g., quote accepted early).
- **WF-03 (Approval Routing):** Approval requests route to the configured managerial role; approvers receive email alerts and can approve or reject with mandatory justification.
- **WF-04 (Execution Traceability):** Every workflow execution records input parameters, step durations, output payloads, and error tracebacks in `/admin/audit`.

### 2.6 Governed AI Workforce & Copilot
- **AI-01 (Grounded Copilot RAG):** Copilot queries generate answers grounded strictly in tenant-owned records retrieved via `pgvector` similarity search; zero cross-tenant retrieval.
- **AI-02 (Three-Tier Autonomy Enforcement):**
  - Actions configured as `Suggest Only` present read-only insights; write API endpoints are disabled.
  - Actions configured as `Act with Approval` stage an actionable proposal in `ai_proposals`; execution is blocked until an authorized human user clicks `Approve`.
  - Actions configured as `Act Autonomously` execute only if pre-conditions and policy limits (e.g., maximum automated discount <= 5%) are met.
- **AI-03 (Decision Provenance):** 100% of AI agent outputs store reasoning, confidence scores, policy checks, and the approving user's identity in the immutable audit ledger.

### 2.7 Integrations & Radium ERP Connector
- **INT-01 (Outbound Webhooks):** Record lifecycle events dispatch signed JSON payloads with an `X-Syvoris-Signature` header. Failed deliveries retry with exponential backoff (1m, 5m, 15m, 1h, 6h).
- **INT-02 (Radium ERP Decoupling):**
  - Synchronizing master products and inventory queries Radium ERP via REST/API without direct database connection.
  - Confirmed Sales Orders export to Radium ERP idempotently; duplicate export attempts return the existing Radium order reference.
  - If Radium ERP is unreachable, SYVORIS Ai queues the export and continues CRM operations without error.
