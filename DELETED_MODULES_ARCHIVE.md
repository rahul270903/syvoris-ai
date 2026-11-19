# SYVORIS AI CRM — DELETED & CONSOLIDATED MODULES ARCHIVE
**Document Version:** 1.0.0  
**Last Updated:** November 19, 2026  
**Status:** Permanent Architectural Record & Restoration Blueprint

---

## 1. Executive Summary & Purpose

In accordance with architectural refinement, all standalone, disconnected, non-mandatory, and redundant duplicate submodules across the platform have been pruned. This streamlines the application into **10 cohesive, high-impact business modules** that directly interconnect accounts, contacts, pipeline opportunities, commercial CPQ, sales orders, invoices, customer service cases, and autonomous AI agents.

To preserve backward compatibility:
- All pruned routes have been configured with automatic client-side redirects (`<Navigate replace />`) in [`src/App.tsx`](file:///d:/syvoris-ai/src/App.tsx).
- No bookmarked URL, legacy link, or integration callback will encounter a 404.
- This document provides the complete catalog of deleted routes, the architectural rationale for removal, and step-by-step restoration blueprints should any feature need to be revived or modified in future releases.

---

## 2. Inventory of Deleted & Consolidated Modules

### Category A: Entire Standalone ITSM Group Removed (Service Desk)
| Pruned Module | Former Route | Rationale for Removal | Canonical Hub / Active Destination |
| :--- | :--- | :--- | :--- |
| **Internal Tickets** | `/internal/tickets` | Disconnected internal IT employee incident system; not customer-facing CRM. Customer service cases are fully managed in `/cases`. | [Customer Cases (`/cases`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| **Employees Directory** | `/internal/employees` | Standalone internal HR roster disconnected from CRM roles, users, and contacts. Platform users are managed in `/admin/users`. | [User Administration (`/admin/users`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| **Internal FAQ** | `/internal/faq` | Internal IT helpdesk articles duplicate the centralized enterprise knowledge repository. | [Knowledge Base (`/knowledge`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |

---

### Category B: Disconnected Standalone Mockups & Empty Arrays Pruned
| Pruned Module | Former Route | Rationale for Removal | Canonical Hub / Active Destination |
| :--- | :--- | :--- | :--- |
| **Loyalty Programs** | `/loyalty` | Standalone dummy feature (`loyalty: []` in seed); zero link to customer accounts, quotes, invoices, or billing. Non-mandatory for B2B CRM. | [Customer 360 (`/customers/360`)](file:///d:/syvoris-ai/src/features/workspace/Customer360View.tsx) |
| **Product Bundles** | `/catalog/bundles` | Standalone empty collection (`bundles: []` in seed); CPQ quote lines and price books already handle line items and multi-product quotes natively. | [Product Catalogue (`/catalog/products`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| **Support Mailroom** | `/service/mailroom` | Standalone email intake scanner removed per explicit customer request; case creation is unified in Cases and Portal. | [Service Dashboard (`/service`)](file:///d:/syvoris-ai/src/features/workspace/ServiceDashboardView.tsx) |
| **Live Chats** | `/service/live-chats` | Standalone chat session duplicate pruned per explicit customer request. | [Service Dashboard (`/service`)](file:///d:/syvoris-ai/src/features/workspace/ServiceDashboardView.tsx) |
| **Websense Trackers** | `/service/trackers` | Standalone mock website tracker table with zero interaction with cases or customer accounts. | [Service Dashboard (`/service`)](file:///d:/syvoris-ai/src/features/workspace/ServiceDashboardView.tsx) |
| **Support Webforms** | `/service/webforms` | Standalone empty collection (`webforms: []` in seed) with no intake processor. Support case creation is handled natively in Cases and Customer Portal. | [Cases (`/cases`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| **Appointment Pages** | `/service/appointments` | Standalone empty collection (`appointments: []` in seed); meeting scheduling is handled centrally in Calendar. | [Calendar / Events (`/calendar`)](file:///d:/syvoris-ai/src/features/workspace/CalendarView.tsx) |
| **Sales Playbooks** | `/sales/playbooks` | Standalone empty collection (`playbooks: []` in seed); static text cards disconnected from deals and CPQ. | [Sales Pipeline (`/sales/pipeline`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| **Sales Sequences** | `/sales/sequences` | Standalone empty collection (`sequences: []` in seed); automated lead and deal actions are orchestrated by the AI Agent Workforce and Workflow Designer. | [Sales Pipeline (`/sales/pipeline`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| **Team Collaboration** | `/collaboration` | Disconnected mock message feed; communication history and activity logging are embedded directly on accounts, contacts, and deals. | [Activities (`/activities`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |

---

### Category C: Redundant Single-Filter Clones & Duplicate Routes Consolidated
| Pruned Route | Former Module Name | Rationale for Removal | Canonical Hub / Active Destination |
| :--- | :--- | :--- | :--- |
| `/lead-conversion` | **Lead Conversion** | Redundant standalone page opening an isolated modal; full lead conversion (to Account, Contact & Deal) is built natively into every lead in `/leads`. | [Leads Workspace (`/leads`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/lead-import` | **Lead Import** | Redundant duplicate route of the primary data import engine. | [Data Import (`/data/import`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/communications/email` | **Email** | Single-filter duplicate. Unified Inbox covers all emails with multi-channel filtering. | [Unified Inbox (`/inbox`)](file:///d:/syvoris-ai/src/features/workspace/UnifiedInboxView.tsx) |
| `/communications/calls` | **Phone Calls** | Single-filter duplicate. Unified Inbox and Activities cover voice interactions. | [Unified Inbox (`/inbox`)](file:///d:/syvoris-ai/src/features/workspace/UnifiedInboxView.tsx) |
| `/communications/sms` | **SMS Messages** | Single-filter duplicate. Unified Inbox covers SMS messages. | [Unified Inbox (`/inbox`)](file:///d:/syvoris-ai/src/features/workspace/UnifiedInboxView.tsx) |
| `/communications/live-chat` | **Website Live Chat** | Single-filter duplicate. Unified Inbox covers live chat interactions. | [Unified Inbox (`/inbox`)](file:///d:/syvoris-ai/src/features/workspace/UnifiedInboxView.tsx) |
| `/service/live-chats` | **Live Chats** | Duplicate of the conversation channel in Unified Inbox. | [Unified Inbox (`/inbox`)](file:///d:/syvoris-ai/src/features/workspace/UnifiedInboxView.tsx) |
| `/meetings` | **Meetings** | Single-filter duplicate of calendar events and interactions. | [Calendar / Events (`/calendar`)](file:///d:/syvoris-ai/src/features/workspace/CalendarView.tsx) |
| `/sales/activities` | **Sales Activities** | Duplicate filter of the master CRM activities timeline. | [Activities (`/activities`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/sales/my-dashboard` | **My Sales Dashboard** | Redundant clone of team and personal sales analytics. | [Sales Performance (`/sales/performance`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/quotes/configuration` | **Product Configuration** | Identical duplicate of the master product catalog. | [Products (`/catalog/products`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/discounts` | **Discount Management** | Duplicate filter of approval rules; human review is centralized in Approvals. | [Approvals Queue (`/approvals`)](file:///d:/syvoris-ai/src/features/workspace/ApprovalsView.tsx) |
| `/quotes/approvals` | **Quote Approvals** | Redundant filter; quote approval thresholds are governed in Approvals. | [Approvals Queue (`/approvals`)](file:///d:/syvoris-ai/src/features/workspace/ApprovalsView.tsx) |
| `/quotes/documents` | **Quote Documents** | Filtered subset of master documents; quote generation is handled in Quotes. | [Document Management (`/documents`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/orders/details` | **Order Details** | Redundant duplicate route of Sales Orders master table. | [Sales Orders (`/sales-orders`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/orders/allocation` | **Order Allocation** | Redundant duplicate of order fulfilment workflow. | [Fulfilment Status (`/orders/fulfilment`)](file:///d:/syvoris-ai/src/features/workspace/OrderFulfilmentView.tsx) |
| `/orders/documents` | **Order Documents** | Filtered subset of master documents. | [Document Management (`/documents`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/marketing/email-templates` | **Email Templates** | Redundant duplicate of Admin email template repository. | [Email Templates (`/admin/email-templates`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/marketing/performance` | **Marketing Performance** | Duplicate route clone of the primary marketing analytics dashboard. | [Marketing Dashboard (`/marketing`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/engagement` | **Customer Engagement** | Duplicate view of customer timeline and interactions. | [Customer Timeline (`/customers/timeline`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/service/feedback` | **Customer Feedback** | Identical duplicate of Surveys & CSAT. | [Surveys & CSAT (`/surveys`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/service/analytics` | **Service Analytics** | Duplicate view of Service Dashboard metrics. | [Service Dashboard (`/service`)](file:///d:/syvoris-ai/src/features/workspace/ServiceDashboardView.tsx) |
| `/service/business-hours` | **Business Hours** | Operating calendar rules are integrated directly into SLA policies. | [SLA Management (`/service/sla`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/catalog/availability` | **Product Availability** | Stock status and ATP validation are handled in Stock Management & Radium ERP. | [Stock Management (`/inventory/stock`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/projects/tasks` | **Project Tasks** | Duplicate view of task management. | [Tasks (`/tasks`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/projects/calendar` | **Project Calendar** | Duplicate view of the primary interactive calendar. | [Calendar / Events (`/calendar`)](file:///d:/syvoris-ai/src/features/workspace/CalendarView.tsx) |
| `/admin/hierarchy` | **Org Hierarchy** | Duplicate view of account hierarchies. | [Account Hierarchies (`/accounts/hierarchies`)](file:///d:/syvoris-ai/src/features/workspace/AccountHierarchiesView.tsx) |
| `/admin/permissions` | **Permissions** | Duplicate view of RBAC security roles. | [Roles & Profiles (`/admin/roles`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/admin/print-templates` | **Print Templates** | Layouts are managed in documents and quote templates. | [Document Management (`/documents`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/admin/integrations` | **Integration Mgmt** | Duplicate route of the primary integration hub. | [Integration Hub (`/integrations`)](file:///d:/syvoris-ai/src/features/integrations/IntegrationWorkspace.tsx) |
| `/admin/agent-policies` | **Agent Policies** | Duplicate route of AI Governance. | [AI Governance (`/ai/governance`)](file:///d:/syvoris-ai/src/features/ai/AIWorkspace.tsx) |
| `/admin/data` | **Data Management** | Duplicate route of Data Import. | [Data Import (`/data/import`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/admin/import-export` | **Import / Export** | Duplicate route of Data Import. | [Data Import (`/data/import`)](file:///d:/syvoris-ai/src/features/workspace/WorkspacePage.tsx) |
| `/data/duplicates` | **Duplicate Detection** | Duplicate steward review queue; unified under Administration. | [Duplicate Management (`/admin/duplicates`)](file:///d:/syvoris-ai/src/features/workspace/DuplicateManagementView.tsx) |

---

## 3. The Streamlined 10-Module Architecture

Following consolidation, the navigation sidebar exposes exactly **10 purpose-driven modules** (86 unique routes):

1. **Command Centre** (`/dashboard`, `/workflows/lifecycle`)
2. **Essentials & Customer 360** (`/organizations`, `/contacts`, `/customers/360`, `/accounts/hierarchies`, `/customers/timeline`, `/customers/consent`, `/relationships`, `/documents`, `/data/import`)
3. **Lead Capture & Conversations** (`/leads`, `/lead-capture`, `/lead-sources`, `/lead-scoring`, `/lead-qualification`, `/lead-assignment`, `/inbox`, `/activities`, `/tasks`, `/calendar`, `/approvals`)
4. **Sales & Revenue (CPQ & Orders)** (`/sales/pipeline`, `/opportunities`, `/sales/forecasting`, `/sales/leaderboard`, `/sales/performance`, `/quotes`, `/quotes/builder`, `/price-books`, `/sales-orders`, `/orders/fulfilment`, `/purchase-orders`, `/invoices`)
5. **Marketing & Customer Experience** (`/marketing`, `/campaigns`, `/segments`, `/campaigns/builder`, `/surveys`)
6. **Customer Service & Support** (`/service`, `/cases`, `/service/queue`, `/service/mailroom`, `/knowledge`, `/service/sla`, `/customer-portal`)
7. **Project Management** (`/projects`, `/projects/details`, `/projects/milestones`, `/projects/resources`, `/projects/costs`, `/projects/analytics`)
8. **Product & Service Catalogue** (`/catalog/products`, `/catalog/services`, `/catalog/categories`, `/inventory/taxes`, `/inventory/terms`, `/inventory/stock`, `/catalog/vendors`)
9. **AI Intelligence & Governed Workforce** (`/ai`, `/ai/copilot`, `/ai/agents`, `/ai/org-chart`, `/ai/marketplace`, `/ai/activity`, `/ai/recommendations`, `/ai/revenue-twin`, `/ai/customer-intelligence`, `/ai/governance`)
10. **Administration, Platform & Integrations** (`/admin/users`, `/admin/roles`, `/admin/teams`, `/admin/pipelines`, `/admin/assignment`, `/admin/workflows`, `/admin/approvals`, `/admin/picklists`, `/admin/email-templates`, `/admin/ai-models`, `/admin/audit`, `/admin/duplicates`, `/admin/recycle-bin`, `/integrations`, `/integrations/radium`, `/integrations/events`, `/integrations/apis`)

---

## 4. How to Restore or Modify Any Pruned Module in the Future

If business requirements evolve and you need to restore or build out any pruned module as a dedicated feature:

### Step 1: Re-add the Navigation Item
In [`src/app/navigation.ts`](file:///d:/syvoris-ai/src/app/navigation.ts), locate the desired target module in `navGroups` and re-insert the `item(...)` entry:
```typescript
// Example: Restoring Loyalty Programs to 'Marketing & Customer Experience':
item('Loyalty Programs', '/loyalty', 'Customer rewards and tier benefits.', 'loyalty', Award, 'Marketing'),
```

### Step 2: Remove the Redirect Alias
In [`src/App.tsx`](file:///d:/syvoris-ai/src/App.tsx), remove the fallback redirect route for that path (e.g. remove `<Route path="/loyalty" element={<Navigate to="/customers/360" replace />} />`). The dynamic `allNavItems` mapper will then automatically mount it.

### Step 3: Populate Seed and Backend Schema (If Entity Needed)
- Ensure the entity key exists in [`src/data/seed.ts`](file:///d:/syvoris-ai/src/data/seed.ts) with real records.
- If persisting to PostgreSQL, create an Alembic migration in `backend/alembic/versions/` defining the table, tenant isolation foreign keys, and RLS policies.

### Step 4: Run Verification
```bash
npm run check:project   # Confirms routes and imports
npm run typecheck       # Confirms TypeScript types
npm run build           # Confirms production bundle build
```
