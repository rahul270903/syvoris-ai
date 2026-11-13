# SYVORIS Ai™ — Customer Service & Help Desk
## Phase 1 Implementation Matrix & Architecture Audit

**Execution Mode:** GRAVITAS  
**Project:** SYVORIS Ai™ Enterprise Platform  
**Repository:** `D:\syvoris-ai`  
**Branch:** `main`  
**Audit Date:** 2026-11-14  

---

### 1. Module-by-Module Implementation Matrix

| # | Module Name | Route | Blueprint Requirement | Current Frontend State | Current Backend State | Database Support | Gaps & Deliverables | Priority |
|---|---|---|---|---|---|---|---|---|
| **1** | **Service Dashboard** | `/service` | Live operational dashboard: total cases, open cases, status breakdown, priority distribution, SLA compliance %, breach count, avg first response time, avg resolution time, agent workloads. | Generic case listing in `WorkspacePage.tsx` | Basic case list endpoint `/api/v1/cases` | Supported via `cases` and `sla_policies` | Create `/api/v1/service/dashboard-metrics` endpoint; build rich operational dashboard view in `WorkspacePage.tsx`. | **Milestone 1** |
| **2** | **Cases** | `/cases` | Multi-channel ticketing, sequential ref (`CASE-YYYY-XXXXX`), accounts/contacts link, priority, category, status lifecycle, SLA deadlines, internal vs portal comments, audit trail, search/filter/pagination. | Live mapped in `WorkspacePage.tsx` | Full CRUD in `CaseService` & `/api/v1/cases` | `cases` & `case_comments` with RLS | Add attachments support, enhanced timeline display, assignment rules. | **Milestone 1** |
| **3** | **Support Queue** | `/service/queue` | Operational queue management: team/agent assignment, unassigned case queue, priority queue ordering, workload views, 1-click case claim/reassignment, conflict prevention. | Filter on `cases` in `WorkspacePage.tsx` | String column `assigned_queue` on `Case` | `cases` table has `assigned_queue` | Create `support_queues` model, `/api/v1/service/queues` CRUD, queue case claim endpoint. | **Milestone 1** |
| **4** | **Support Mailroom** | `/service/mailroom` | Email-to-case ingestion scanner, mailbox configuration (`support_mailboxes`), email provider abstraction (`IMAP`/`Webhook`), thread token matching (Re: `[CASE-YYYY-XXXXX]`), duplicate prevention (`message_id` unique). | Static seed rows in `WorkspacePage.tsx` | None | None | Create `support_mailboxes` and `mailroom_messages` tables; create Mailroom service & endpoints with thread token matching. | **Milestone 2** |
| **5** | **Live Chats** | `/service/live-chats` | Live customer service chat sessions, visitor identity, agent assignment, message exchange (`chat_messages`), conversation history, case conversion. | Static seed rows in `WorkspacePage.tsx` | None | None | Create `chat_sessions` and `chat_messages` tables; create Chat service & `/api/v1/service/chats` endpoints; case conversion workflow. | **Milestone 2** |
| **6** | **Websense Trackers** | `/service/trackers` | Visitor digital footprints and pre-case website navigation history. URL pattern monitoring, dwell threshold, action triggers (`Trigger Live Chat Prompt`, `Log High-Intent Signal`). | Static seed rows in `WorkspacePage.tsx` | None | None | Create `websense_trackers` and `tracker_events` tables; create Tracker service & `/api/v1/service/trackers` endpoints. | **Milestone 3** |
| **7** | **Knowledge Base** | `/knowledge` | Articles CRUD (`KB-YYYY-XXXXX`), categories/subcategories, full-text search, public vs internal visibility, tags, helpful upvotes, usage metrics. | Live mapped in `WorkspacePage.tsx` | Full CRUD in `KnowledgeService` & `/api/v1/knowledge` | `knowledge_articles` with RLS | Category filtering, public vs internal permission check, portal knowledge integration. | **Milestone 3** |
| **8** | **SLA Management** | `/service/sla` | Tiered SLA policies (Critical, High, Normal, Low), response & resolution targets, warning thresholds (80%), breach detection, pause/resume rules, compliance reports. | Live mapped in `WorkspacePage.tsx` | Full CRUD in `SLAService` & `/api/v1/service/sla` | `sla_policies` with RLS | Integrate with Business Hours calendar engine; calculate warning thresholds (80%). | **Milestone 4** |
| **9** | **Business Hours** | `/service/business-hours` | Business calendar configuration: working days (Mon-Fri), opening/closing times (09:00 - 17:00), time zone, holidays and exceptions, integration with SLA calculations. | Static seed rows in `WorkspacePage.tsx` | None | None | Create `business_hours` and `business_holidays` tables; create BusinessHours service & `/api/v1/service/business-hours` endpoints; wire into SLA deadline engine. | **Milestone 4** |
| **10** | **Support Webforms** | `/service/webforms` | Public intake form configuration, custom fields, category/priority mapping, public intake endpoint `/api/v1/public/webforms/{slug}/submit`, honeypot spam protection, auto case creation, submission history. | Static seed rows in `WorkspacePage.tsx` | None | None | Create `support_webforms` and `webform_submissions` tables; create Webform service & public intake endpoint. | **Milestone 5** |
| **11** | **Appointment Pages** | `/service/appointments` | Self-service appointment scheduling: appointment types, available time slots, agent assignment, business-hours integration, booking and cancellation, transactional double-booking prevention. | Static seed rows in `WorkspacePage.tsx` | None | None | Create `appointment_types` and `customer_appointments` tables; create Appointment service & public booking endpoint. | **Milestone 5** |
| **12** | **Customer Portal** | `/customer-portal` | Secure customer self-service interface: customer profile, view submitted cases, case status & public conversation history (never internal notes), submit new case, browse public knowledge base, book appointment. | Basic ticket lodging in `CustomerPortalView.tsx` | Case list & create via standard API | `cases` & `case_comments` | Dedicated portal endpoints `/api/v1/portal/...` restricting data strictly to the authenticated contact/account; internal note censorship. | **Milestone 6** |

---

### 2. Database Schema Strategy (Alembic Migration 009)

The new tables to be introduced in `009_customer_service_helpdesk.py` (all extending `TenantScopedModel` with PostgreSQL Row-Level Security enabled and enforced):
1. `business_hours` (work week schedule, opening/closing time, timezone)
2. `business_holidays` (tenant holiday calendar)
3. `support_queues` (managed routing queues, priority, assignment rules)
4. `support_mailboxes` (inbound email channels, IMAP/webhook credentials)
5. `mailroom_messages` (inbound/outbound email history, thread token, headers, deduplication `message_id`)
6. `chat_sessions` (customer live chat sessions, agent assignment, state)
7. `chat_messages` (live chat conversation ledger)
8. `websense_trackers` (URL patterns, dwell thresholds, triggers)
9. `tracker_events` (visitor digital footprints, pre-case activity)
10. `support_webforms` (published webform definitions, field schema)
11. `webform_submissions` (intake logs, spam/honeypot flags, created case ref)
12. `appointment_types` (service meeting types, duration, buffer times)
13. `customer_appointments` (scheduled bookings, time slot locks, status)

---

### 3. Execution Plan

* **Milestone 1:** Service Dashboard, Cases enhancements, Support Queue management.
* **Milestone 2:** Support Mailroom & Live Chats.
* **Milestone 3:** Knowledge Base enhancements & Websense Trackers.
* **Milestone 4:** SLA Management & Business Hours calendar engine.
* **Milestone 5:** Support Webforms & Appointment Pages.
* **Milestone 6:** Customer Portal & Security boundary enforcement.
* **Milestone 7:** Cross-module verification, automated tests, regression suite, and final documentation.
