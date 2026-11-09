# SYVORIS Ai™ — Enterprise CRM, Sales & Marketing

**Engage · Convert · Grow**

A standalone, responsive React + TypeScript interactive enterprise CRM wireframe and workflow prototype. Built as an independent CRM platform, separate from Radium ERP, using the cleaned architecture baseline as the primary functional specification. The brand identity is **SYVORIS Ai™** throughout.

---

## Getting Started Locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (default: `http://localhost:5173`).

### Demonstration Access

The login screen provides prototype demonstration access:
- Pre-filled with `demo@syvoris.example` / `••••••••`.
- Accepts any non-empty email and password for prototype evaluation.
- UI role switcher supports evaluating views as System Administrator, Sales Manager, Sales Representative, Marketing Manager, Customer Support Agent, Service Manager, or Executive.
- Note: Prototype demonstration only; not a production security boundary.

### Build and Integrity Checks

```bash
npm run check:project   # Validates route uniqueness, relative imports, and assets (132 routes checked)
npm run typecheck       # Strict TypeScript typechecking (0 errors)
npm run build           # Vite production build (dist/)
npm run preview         # Preview production build locally
```

---

## Product Architecture & 132 Unique Workspace Routes

SYVORIS Ai maps cleanly to the seven architectural layers defined in the solution architecture:

1. **Experience Layer:** Responsive web application shell, executive command centre, sales workspace, customer 360 workspace, customer self-service portal preview, and conversational copilot.
2. **CRM Transaction Layer:** Canonical entities for Leads, Contacts, Organizations, Deals, Quotes, Sales Orders, Purchase Orders, Invoices, Cases, Projects, Products, Services, Price Books, Vendors, Tasks, and Documents.
3. **Memory & Context Layer:** Unified customer memory, chronological customer interaction timeline, relationship hierarchy graph, duplicate detection, and communication preferences/consent.
4. **Agentic Orchestration Layer:** Goal-based specialist agents, autonomy levels (*Suggest Only*, *Act with Approval*, *Act Autonomously*), and human approval gates.
5. **Knowledge & Intelligence Layer:** Living knowledge base, predictive deal risk scoring, revenue digital twin what-if scenario simulator, and explainable decision trails.
6. **Integration & Event Layer:** Proposed Radium ERP integration boundary, event fabric with published domain events, versioned REST API catalog, and webhook topic subscriptions.
7. **Trust & Governance Layer:** Consent management, policy enforcement guardrails, audit logging, and sensitive data controls.

### Complete Module Coverage (132 Routes)

- **Executive Command Centre (2 routes):** Executive Dashboard (`/dashboard`), Workflow Navigator (`/workflows/lifecycle`).
- **Essentials & Customer 360 (11 routes):** Organizations / Accounts (`/organizations`), Contacts (`/contacts`), Customer 360 (`/customers/360`), Account Hierarchies (`/accounts/hierarchies`), Customer Activity Timeline (`/customers/timeline`), Customer Preferences (`/customers/preferences`), Consent Management (`/customers/consent`), Relationship Management (`/relationships`), Duplicate Detection (`/data/duplicates`), Document Management (`/documents`), Data Import (`/data/import`).
- **Lead Capture & Conversations (19 routes):** Leads (`/leads`), Lead Capture (`/lead-capture`), Lead Sources (`/lead-sources`), Lead Scoring (`/lead-scoring`), Lead Qualification (`/lead-qualification`), Lead Assignment (`/lead-assignment`), Lead Conversion Engine (`/lead-conversion`), Lead Import (`/lead-import`), Unified Inbox (`/inbox`), Email (`/communications/email`), Phone Calls (`/communications/calls`), SMS Messages (`/communications/sms`), Website Live Chat (`/communications/live-chat`), Meetings (`/meetings`), Activities (`/activities`), Tasks (`/tasks`), Calendar / Events (`/calendar`), Approvals (`/approvals`), Team Collaboration (`/collaboration`).
- **Sales & Revenue (18 routes):** Sales Pipeline (`/sales/pipeline`), Opportunities / Deals (`/opportunities`), Sales Forecasting (`/sales/forecasting`), Sales Activities (`/sales/activities`), Sales Leaderboard (`/sales/leaderboard`), My Sales Dashboard (`/sales/my-dashboard`), Sales Playbooks (`/sales/playbooks`), Sales Sequences (`/sales/sequences`), Sales Performance Analytics (`/sales/performance`), Quote Management (`/quotes`), Quote Builder (`/quotes/builder`), Product Configuration (`/quotes/configuration`), Price Books (`/price-books`), Discount Management (`/discounts`), Quote Approvals (`/quotes/approvals`), Quote Documents (`/quotes/documents`), Sales Orders (`/sales-orders`), Order Details (`/orders/details`).
- **Order Fulfilment (5 routes):** Order Allocation (`/orders/allocation`), Fulfilment Status (`/orders/fulfilment`), Purchase Orders (`/purchase-orders`), Customer Invoices (`/invoices`), Order Documents (`/orders/documents`).
- **Marketing & Customer Experience (9 routes):** Marketing Dashboard (`/marketing`), Campaign Management (`/campaigns`), Audience Segmentation (`/segments`), Campaign Builder (`/campaigns/builder`), Email Templates (`/marketing/email-templates`), Marketing Performance (`/marketing/performance`), Customer Engagement (`/engagement`), Loyalty Programs (`/loyalty`), Surveys & CSAT (`/surveys`).
- **Customer Service & Help Desk (14 routes):** Service Dashboard (`/service`), Cases (`/cases`), Support Queue (`/service/queue`), Support Mailroom (`/service/mailroom`), Live Chats (`/service/live-chats`), Websense Trackers (`/service/trackers`), Knowledge Base (`/knowledge`), SLA Management (`/service/sla`), Business Hours (`/service/business-hours`), Support Webforms (`/service/webforms`), Appointment Pages (`/service/appointments`), Customer Portal (`/customer-portal`), Customer Feedback (`/service/feedback`), Service Analytics (`/service/analytics`).
- **Project Management (8 routes):** Projects (`/projects`), Project Details (`/projects/details`), Project Tasks (`/projects/tasks`), Milestones (`/projects/milestones`), Project Calendar (`/projects/calendar`), Resource Allocation (`/projects/resources`), Project Costs (`/projects/costs`), Project Analytics (`/projects/analytics`).
- **Product & Service Catalogue (9 routes):** Products (`/catalog/products`), Services (`/catalog/services`), Categories (`/catalog/categories`), Bundles (`/catalog/bundles`), Product Availability (`/catalog/availability`), Tax Management (`/inventory/taxes`), Terms and Conditions (`/inventory/terms`), Stock Management (`/inventory/stock`), Vendors (`/catalog/vendors`).
- **AI Intelligence & Agent Workforce (10 routes):** AI Command Centre (`/ai`), Conversational Copilot (`/ai/copilot`), Agent Workforce (`/ai/agents`), Agent Organisation Chart (`/ai/org-chart`), Agent Marketplace (`/ai/marketplace`), AI Activity Queue (`/ai/activity`), AI Recommendations (`/ai/recommendations`), Revenue Digital Twin (`/ai/revenue-twin`), Customer Intelligence (`/ai/customer-intelligence`), AI Governance (`/ai/governance`).
- **Administration & Configuration (19 routes):** Users (`/admin/users`), Roles & Profiles (`/admin/roles`), Teams (`/admin/teams`), Organization Hierarchy (`/admin/hierarchy`), Permissions (`/admin/permissions`), Pipelines & Stages (`/admin/pipelines`), Assignment Rules (`/admin/assignment`), Workflow Designer (`/admin/workflows`), Approval Configuration (`/admin/approvals`), Picklist Configuration (`/admin/picklists`), Email Templates (`/admin/email-templates`), Print Templates (`/admin/print-templates`), Integration Management (`/admin/integrations`), AI Model Configuration (`/admin/ai-models`), Agent Policies (`/admin/agent-policies`), Audit Trail (`/admin/audit`), Data Management (`/admin/data`), Duplicate Management (`/admin/duplicates`), Import / Export (`/admin/import-export`), Recycle Bin (`/admin/recycle-bin`).
- **Service Desk & Employees (3 routes):** Internal Tickets (`/internal/tickets`), Employees (`/internal/employees`), Internal FAQ (`/internal/faq`).
- **Integrations & Platform (4 routes):** Integration Hub (`/integrations`), Radium ERP Connector (`/integrations/radium`), Event Fabric (`/integrations/events`), API & Webhooks (`/integrations/apis`).

---

## 6 Connected End-to-End Business Workflows

The application connects records across business stages:

### 1. Lead to Customer
1. Create a lead or select a qualified prospect.
2. Open the **4-Step Lead Conversion Wizard**.
3. Organization resolution: detects potential duplicate accounts; choose to link to an existing account or create a new organization.
4. Configure contact person profile with job title, direct phone, and communication consent.
5. Configure deal parameters: opportunity title, stage (`Qualification`), estimated value, expected close date.
6. Execution creates all linked entities, marks lead `Converted`, logs the audit entry, and opens the **Customer 360** workspace.

### 2. Opportunity to Revenue
1. Open the interactive **Kanban Sales Pipeline** (`/sales/pipeline`).
2. Move deal cards between stages with 1-click `← Prev` and `Next →` buttons; pipeline stage totals and weighted forecast update immediately.
3. On Proposal stage, trigger **Create Quote** from opportunity context.
4. In the **Quote Builder**, review line items, apply unit prices and discounts.
5. If discount exceeds the 5% standard representative threshold, submit for manager approval (`Pending Approval`).
6. Approve the quote from the Human Approval queue.
7. Customer accepts quote (`Accepted`).
8. 1-click **Convert to Sales Order**: carries forward line items, customer, and quote reference.
9. Perform simulated inventory check against the Radium ERP boundary.
10. Trigger **Generate Invoice**: creates an official invoice reference with payment terms and due date.
11. Verify all records appear in the customer's chronological activity timeline.

### 3. Marketing to Lead
1. Open Campaign Management (`/campaigns`).
2. Build campaign with audience segmentation and primary channel (Email, SMS, Voice).
3. Validate communication consent: campaign scheduler verifies eligible contacts who have granted consent for that channel.
4. Schedule and activate the campaign.
5. Trigger **Simulate Response**: generates an inbound qualified lead attributed to the campaign.
6. Open the newly generated lead in the Lead Management workspace.

### 4. Customer Service
1. Inbound support case logged (`/cases`).
2. Case priority assigned (`Critical`, `High`, `Normal`) with real-time **SLA Countdown Timer** indicator.
3. Case workflow: *Start Case* → *In Progress* → *Escalate to Tier 2* → *Resolve Case*.
4. Resolution dialog captures root-cause resolution notes and auto-posts a resolution activity entry to the customer's activity timeline.
5. Post-resolution CSAT survey captured in `/service/feedback`.

### 5. Closed-Won to Project
1. When an opportunity reaches `Closed Won`, trigger **Create Project Handoff**.
2. Automatically generates a project draft carrying forward customer, deal value as approved budget, scope description, and finish date.
3. Open Project Management (`/projects`): inspect milestone timeline, add tasks, review budget vs. actuals, and track delivery health.

### 6. AI-Assisted Operations
1. Open Conversational Copilot (`/ai/copilot`) or AI Recommendations (`/ai/recommendations`).
2. Query customer health, open pipeline value, or stalled deals.
3. Inspect AI decision proposals with explainable evidence:
   - Proposed action
   - Contributing reasoning
   - Supporting CRM data evidence
   - Governance policy checks
   - AI confidence score (e.g. 94%)
4. Apply human gate: **Approve Action** or **Reject Action**.
5. Every decision is recorded in the immutable audit trail (`/admin/audit`).

---

## 14 Specialized AI Agent Workforce

All 14 agents defined in the target architecture are configured with assigned modules, KPIs, permissions, and autonomy modes:

| Agent Name | Role | Module | Primary KPI | Default Autonomy |
|---|---|---|---|---|
| **SDR Agent** | Lead qualification | Lead Capture | Qualified opportunities / response time | Suggest Only |
| **Deal Agent** | Deal execution | Sales | Stage velocity / win rate | Act with Approval |
| **Negotiation Agent** | Commercial negotiation | Sales | Margin adherence / negotiation cycle time | Act with Approval |
| **Quote Agent** | Commercial drafting | Quotes & CPQ | Quote turnaround / pricing accuracy | Act with Approval |
| **Service Agent** | Service resolution | Help Desk | First-contact resolution / CSAT | Suggest Only |
| **Save-Play Agent** | Churn retention | Customer Success | Recovered revenue / churn reduction | Suggest Only |
| **Pricing Agent** | Pricing intelligence | Quotes & CPQ | Margin protection / discount adherence | Suggest Only |
| **Forecast Agent** | Forecast intelligence | Sales Analytics | Forecast variance / pipeline coverage | Suggest Only |
| **Inventory Agent** | Availability intelligence | Order Fulfilment | Availability risk detection | Suggest Only |
| **Data Steward** | Data hygiene | Customer 360 | Duplicate reduction / record completeness | Act with Approval |
| **Compliance Guardian** | Policy supervision | Governance | Prevented violations / false-positive rate | Act with Approval |
| **Meeting Agent** | Meeting intelligence | Collaboration | Action capture / follow-up completion | Suggest Only |
| **Knowledge Agent** | Knowledge operations | Help Desk | Knowledge reuse / article quality | Act with Approval |
| **CRM Administrator Agent** | Configuration copilot | Administration | Configuration turnaround / policy compliance | Suggest Only |

---

## Dedicated Workspaces & Key Capabilities

### Customer 360 Workspace (`/customers/360`)
- **Account Selector Bar:** Switch between corporate accounts.
- **Header Profile Card:** Account name, corporate tier, annual revenue, account health score (e.g. 94/100 · Strong), predictive sentiment, and credit limit.
- **10 Contextual Tabs:**
  1. *Overview & Hierarchy:* Master profile attributes, corporate holding relationships, and subsidiaries.
  2. *Contacts:* Linked stakeholders with email, direct phone, department, and communication consent pills.
  3. *Opportunities & Deals:* All active and historical pipeline records with deal values and stages.
  4. *Quotes & CPQ:* Commercial proposals, discount rates, line items, and approval states.
  5. *Sales Orders:* Confirmed orders, fulfilment status, and warehouse references.
  6. *Invoices:* Billing references, due dates, terms, and balance records.
  7. *Support Cases:* Open and resolved tickets, priority badges, and SLA timers.
  8. *Projects:* Active implementations, milestone progress bars, and budget indicators.
  9. *Customer Timeline:* Chronological narrative of all interactions across email, phone, meetings, orders, and support tickets.
  10. *AI Intelligence & Sentiment:* Next-best-action recommendations, evidence rationale, churn risk calculation (1.4% Low), and expansion propensity.

### Communications Simulator
- **Email:** Compose email with template selection, contact picker, subject, body, and simulated send that appends to the customer's timeline and emits domain events.
- **Phone Calls:** Click-to-call dialer, inbound/outbound direction, duration timer, outcome selector, AI call summary auto-post, and recording URL reference.
- **SMS Messages:** Recipient phone, real-time communication consent verification check (blocks sending if contact has not consented to SMS), character counter.
- **Website Live Chat:** Interactive session simulator with visitor footprint (IP, location, active URL, dwell time), and 1-click **Convert Chat to Lead** action.
- **Meetings:** Meeting title, invitees, date/time, agenda, and simulated calendar sync.

### Integration Boundaries
- **Radium ERP:** Dedicated connector console (`/integrations/radium`) with bidirectional synchronization simulation, entity mapping table (AR, OE, INV), latency telemetry, and explicit separation of CRM and ERP concerns.
- **Communications:** Email, telephony, SMS, and calendar connectors are demonstration interfaces.

---

## Production Deployment Guide

SYVORIS Ai is completely packaged and ready for immediate deployment to any cloud hosting provider or container platform.

### Option 1: Vercel (Zero Configuration)
The project includes `vercel.json` with SPA route rewrites configured:
```bash
# Using Vercel CLI
npm i -g vercel
vercel deploy --prod
```
Or connect the repository directly in the Vercel Dashboard (`Output Directory: dist`, `Build Command: npm run build`).

### Option 2: Netlify (Zero Configuration)
The project includes `netlify.toml` with build commands and SPA redirect headers:
```bash
# Using Netlify CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```
Or import the repository into Netlify (`Publish directory: dist`).

### Option 3: Docker / Container Platform (AWS ECS, GCP Cloud Run, Azure, Kubernetes)
A production multi-stage `Dockerfile` and optimized `nginx.conf` are included:
```bash
# Build the production Docker image
docker build -t syvoris-ai-crm:latest .

# Run the container locally on port 8080
docker run -d -p 8080:80 --name syvoris-crm syvoris-ai-crm:latest
```
Visit `http://localhost:8080`.

### Option 4: Static Web Server (Nginx, Apache, S3 + CloudFront)
1. Run `npm run build` to generate the production bundle in `dist/`.
2. Upload the contents of `dist/` to any static web hosting service.
3. Configure your web server to serve `index.html` for all 404 paths (standard Single Page Application routing).

---

## Verification & Acceptance Checklist

- [x] Application loads without runtime errors.
- [x] All 132 navigation routes are unique and resolve to populated workspace views.
- [x] 0 dead navigation links; 0 blank workspaces.
- [x] Customer 360 workspace provides 10 contextual tabs with connected records.
- [x] 4-step Lead Conversion Wizard creates linked Organization, Contact, and Deal records.
- [x] Interactive Kanban Pipeline supports moving deals between stages with real-time recalculation of pipeline and weighted forecast totals.
- [x] Quote Builder supports multiple line items, discount guardrail validation, manager approval workflow, and conversion to Sales Order.
- [x] Closed-Won opportunity triggers delivery project creation handoff.
- [x] Support cases feature SLA countdown indicators, escalation, and resolution notes auto-posting to customer timeline.
- [x] Communication simulator supports Email, Phone Calls, SMS with consent check, Live Chat, and Meetings.
- [x] 14 specialist AI agents configured with autonomy modes and explainable decision trails.
- [x] Browser `localStorage` persistence under `syvoris-ai:prototype:v1`.
- [x] Brand identity strictly uses **SYVORIS Ai™** throughout (no legacy CRM branding in code or UI).
- [x] `npm run check:project` passed (132 routes verified).
- [x] `npm run typecheck` passed (0 TypeScript diagnostics).
- [x] `npm run build` completed successfully (`dist/`).
