# SYVORIS Ai — Requirements Traceability

This matrix traces the supplied cleaned CRM architecture and the master prototype brief to implementation surfaces in this project. It is a prototype-level traceability map, not a production certification.

| Source architecture area | SYVORIS Ai implementation | Primary route(s) | Prototype status |
|---|---|---|---|
| Experience Layer | Login, responsive app shell, navigation, global search, dashboard, workflow navigator | `/login`, `/dashboard`, `/workflows/lifecycle` | Interactive demo |
| CRM Transaction Layer | Organizations, contacts, leads, deals, cases, projects, catalogue, quotes, orders, invoices, activities, tasks and documents | `/organizations`, `/contacts`, `/leads`, `/opportunities`, `/cases`, `/projects`, `/catalog/products`, `/quotes`, `/sales-orders`, `/invoices` | Shared record model and writable local workspaces |
| Memory & Context Layer | Customer 360 links, activity history, account relationship graph and Customer Intelligence | `/customers/360`, `/customers/timeline`, `/accounts/hierarchies`, `/ai/customer-intelligence` | Local linked-record demonstration; no semantic index/vector store |
| Agentic Orchestration Layer | Agent workforce, action proposals, autonomy choices, approval/rejection, retry/handoff concepts | `/ai/agents`, `/ai/activity`, `/ai/governance`, `/approvals` | Simulated state machine and human approval UI |
| Knowledge & Intelligence Layer | Knowledge base, scoring fields, forecasting, recommendations and Revenue Digital Twin | `/knowledge`, `/lead-scoring`, `/sales/forecasting`, `/ai/recommendations`, `/ai/revenue-twin` | Seeded/deterministic analytics; no model gateway or RAG service |
| Integration & Event Layer | Connector boundary, domain event list and API/webhook topic preview | `/integrations`, `/integrations/radium`, `/integrations/events`, `/integrations/apis` | Local event history and planned connector references; no live API/webhook delivery |
| Trust & Governance Layer | Consent fields and campaign gating, approval actions, role context, audit history and agent policy controls | `/customers/consent`, `/campaigns`, `/approvals`, `/admin/roles`, `/admin/audit`, `/ai/governance` | UI/business-flow simulation; not production IAM/RBAC/ABAC or immutable audit |
| Essentials & Customer 360 | Accounts, contacts, hierarchy, preferences, duplicates, documents and import preview | `/organizations`, `/contacts`, `/customers/360`, `/accounts/hierarchies`, `/customers/consent`, `/data/duplicates`, `/documents`, `/data/import` | Interactive record workspaces; import upload remains planned |
| Lead Capture & Conversations | Lead capture, sources, score, qualification, assignment, conversion, inbox and communication activity logs | `/leads`, `/lead-capture`, `/lead-sources`, `/lead-scoring`, `/lead-qualification`, `/lead-assignment`, `/lead-conversion`, `/inbox`, `/communications/*` | Local workflow simulations; external email/SMS/voice/chat not connected |
| Sales | Pipeline, opportunity stage management, quote builder/approval/acceptance, orders and invoice references | `/sales/pipeline`, `/opportunities`, `/quotes`, `/quotes/builder`, `/quotes/approvals`, `/sales-orders`, `/orders/fulfilment`, `/invoices` | Connected local records and calculated quote/order lines; no live ERP posting |
| Marketing | Campaign lifecycle, audience segmentation, consent-aware simulated response, campaign metrics and CSAT | `/campaigns`, `/segments`, `/marketing/builder`, `/marketing/performance`, `/loyalty`, `/service/feedback` | Local demo campaigns; no external message delivery |
| Help / Service | Cases, support queue, knowledge, SLA, business hours, webforms, appointments, portal preview, CSAT | `/cases`, `/service/queue`, `/knowledge`, `/service/sla`, `/service/business-hours`, `/service/webforms`, `/service/appointments`, `/customer-portal`, `/service/feedback` | Case and task workflows; service portal and channels remain preview/simulated |
| Project Management | Project handoff, tasks, milestones, calendar, resources, costs and analytics | `/projects`, `/projects/tasks`, `/projects/milestones`, `/projects/calendar`, `/projects/resources`, `/projects/costs`, `/projects/analytics` | Linked local records; Gantt and real time/cost integration remain prototype scope |
| Inventory & Order Fulfilment | Product/service catalogue, availability references, order fulfilment and vendors | `/catalog/products`, `/catalog/services`, `/catalog/availability`, `/orders/fulfilment`, `/catalog/vendors` | Read/reference boundaries only; Radium ERP ownership/API unresolved |
| Administration | Users, roles, hierarchy, field/pipeline/workflow/approval configuration, templates, data and audit | `/admin/*` | Config/preview records; production enforcement and workflow execution are not connected |
| Service Desk | Internal tickets, employee directory and internal knowledge | `/internal/tickets`, `/internal/employees`, `/internal/faq` | Local reference workspaces |
| AI-native agent portfolio | SDR, Deal, Quote, Service, Save-Play, Compliance, Negotiation, Pricing, Forecast, Inventory, Data Steward, Meeting, Knowledge and CRM Administrator | `/ai/agents`, `/ai/org-chart`, `/ai/marketplace` | All 14 represented in seeded workforce or marketplace; no live models/tool credentials |

## Key workflow acceptance coverage

| Journey | Connected steps represented | Status |
|---|---|---|
| Lead to Customer | Qualify lead → convert → create organization/contact/opportunity → link records | Implemented as local workflow |
| Opportunity to Revenue | Opportunity → quote lines → approval → accept → sales order → fulfilment → invoice reference | Implemented as local workflow |
| Marketing to Lead | Campaign review/approval/schedule/activate → consent eligibility check → simulated response lead | Implemented as local workflow |
| Customer Service | Case assignment/status changes → resolution → activity history → follow-up task | Implemented as local workflow |
| Closed-Won to Project | Closed-won opportunity → linked project draft → project task | Implemented as local workflow |
| AI-Assisted Operations | Agent proposal → evidence/policy review → human approve/reject → audit trail | Implemented as simulated workflow |
