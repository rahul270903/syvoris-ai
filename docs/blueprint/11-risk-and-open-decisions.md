# SYVORIS Ai™ — Technical Risks & Open Business Decisions
**Risk Matrix, Mitigation Strategies, and Architectural Decision Register**  
*Document Version: 1.0.0 (Phase 0 Discovery Baseline)*  
*Status: Approved Blueprint*

---

## 1. Executive Summary

Enterprise SaaS development requires upfront identification of technical risks, architectural pitfalls, and open business choices. This document captures the critical technical and architectural risks discovered during Phase 0, presents battle-tested mitigation strategies, and records open commercial decisions requiring executive stakeholder resolution.

---

## 2. Technical Risk Matrix & Mitigation Strategies

```mermaid
quadrantChart
    title Technical Risk Assessment (Impact vs Likelihood)
    x-axis Low Likelihood --> High Likelihood
    y-axis Low Impact --> Critical Impact
    quadrant-1 High Priority (Mitigate Immediately)
    quadrant-2 Strategic Monitoring
    quadrant-3 Low Priority
    quadrant-4 Tactical Contingency
    "Cross-Tenant RLS Leakage": [0.2, 0.95]
    "LLM Latency & Cost Spike": [0.8, 0.75]
    "Celery Queue Backlog in Campaigns": [0.7, 0.60]
    "Radium ERP Tight Coupling": [0.4, 0.85]
    "Multi-Node WebSocket Sync": [0.6, 0.50]
    "High-Volume Migration Locking": [0.3, 0.70]
```

### Risk 1: Cross-Tenant Data Leakage via Connection Pool Session Bleed
- **Category:** Critical Security & Architectural Risk
- **Description:** When using connection pooling (e.g., PgBouncer or SQLAlchemy AsyncEngine pool), a database connection checked out by Tenant A sets `SET LOCAL app.current_tenant_id = 'tenant_a'`. If a subsequent request for Tenant B checks out the same connection and fails to set its own tenant ID (or experiences an unhandled exception before setting it), Tenant B could potentially execute queries under Tenant A's context.
- **Impact:** Critical cross-tenant corporate data breach and regulatory liability.
- **Mitigation Strategy:**
  1. Use `SET LOCAL` exclusively within transaction blocks; PostgreSQL automatically resets transaction-local settings on `COMMIT` or `ROLLBACK`.
  2. Implement an engine checkout listener (`@event.listens_for(Pool, "checkin")`) that executes `DISCARD ALL` or `RESET ALL` whenever a connection returns to the pool.
  3. Author RLS policies to evaluate: `USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`. If the setting is empty or missing, the query matches **0 rows**, failing safely (closed by default).
  4. Mandatory automated CI/CD integration tests verifying connection recycling across different tenant contexts.

### Risk 2: LLM Latency, Token Cost Spikes & Hallucination in Copilot
- **Category:** Operational & Financial Risk
- **Description:** Unbounded natural-language queries, large context window dumps, and multi-agent loops can generate unpredictable token consumption costs ($100s per tenant daily) and introduce slow response latencies (5–15 seconds), degrading user satisfaction.
- **Impact:** Margin erosion on SaaS subscription tiers and poor user responsiveness.
- **Mitigation Strategy:**
  1. **Strict Context Budgeting:** Restrict RAG retrieval to top-5 most relevant chunks using cosine similarity thresholds (`score >= 0.78`).
  2. **Model Tiering:** Route simple classification and summarization to fast, cost-efficient models (e.g., Claude 3.5 Haiku / GPT-4o-mini); reserve flagship models (Claude 3.5 Sonnet / GPT-4o) exclusively for complex negotiation, contract analysis, and CPQ reasoning.
  3. **Streaming Responses:** Use Server-Sent Events (SSE) to stream copilot tokens immediately (< 500ms time-to-first-token).
  4. **Tenant Token Quotas:** Enforce monthly hard and soft token spend caps per subscription plan tier, tracked via the AI Governance proxy.

### Risk 3: Background Worker Queue Starvation During Marketing Campaign Blasts
- **Category:** Performance & Scalability Risk
- **Description:** When an enterprise tenant dispatches an email campaign to 100,000 contacts, worker task queues become saturated, delaying time-critical transactional tasks (e.g., password reset emails, lead assignment routing, SLA countdown monitors).
- **Impact:** Delayed transactional emails and missed customer service SLA alerts.
- **Mitigation Strategy:**
  1. **Dedicated Priority Queues:** Segregate Celery queues into distinct priorities:
     - `high-priority`: Password resets, real-time auth, lead routing, approval notifications.
     - `medium-priority`: Case SLA evaluations, quote PDF generation, webhook dispatches.
     - `low-priority`: Bulk marketing campaign dispatches, CSV imports/exports, data sync.
  2. Assign dedicated worker pools to the `high-priority` queue, ensuring zero starvation during bulk marketing runs.

### Risk 4: Tight Coupling Between SYVORIS Ai and Radium ERP
- **Category:** System Architecture & Sovereign Product Boundary Risk
- **Description:** If developers directly import Radium ERP database tables, reuse Radium models, or make core CRM workflows block synchronously on Radium ERP uptime, SYVORIS Ai loses its independence as a standalone commercial product.
- **Impact:** Inability to sell SYVORIS Ai to companies that do not use Radium ERP; total CRM outage if Radium ERP is down.
- **Mitigation Strategy:**
  1. Formalize the **Radium Integration Boundary** as a decoupled external connector.
  2. All Radium ERP communication must flow through the abstract `IntegrationConnector` interface via asynchronous REST or webhook adapters.
  3. Zero shared database credentials or foreign key dependencies between the systems.
  4. SYVORIS Ai operates in fully standalone mode with local product and invoice registries when Radium ERP is not configured.

---

## 3. Open Business & Architectural Decisions

The following critical decisions require executive stakeholder resolution before proceeding into implementation:

| Decision ID | Domain | Decision Topic | Recommended Option | Alternative Options | Impact & Trade-Offs |
|---|---|---|---|---|---|
| **DEC-01** | Commercial | Subscription Billing & Payment Gateway | **Stripe Billing** | LemonSqueezy, Adyen, Chargebee | Stripe offers best-in-class multi-tenant customer portal, automated tax calculation (Stripe Tax), usage-based metering, and mature webhooks. |
| **DEC-02** | Cloud Infrastructure | Production Hosting Environment | **Managed Kubernetes on AWS (EKS) or DigitalOcean Kubernetes** | AWS ECS / Fargate, Bare Metal | Kubernetes provides unified container orchestration across FastAPI API pods, Celery workers, and Redis with horizontal pod autoscaling (HPA). |
| **DEC-03** | AI Providers | LLM Gateway & Provider Strategy | **Multi-Provider LiteLLM Proxy (Anthropic Claude 3.5 Sonnet primary; OpenAI fallback)** | Direct single-provider SDK, AWS Bedrock, Self-hosted vLLM | Prevents vendor lock-in; provides automatic fallback during provider outages; enables cost-optimal model routing per agent task. |
| **DEC-04** | Communications | Outbound Email & SMS Infrastructure | **Amazon SES (bulk) + Twilio SendGrid (transactional) + Twilio (SMS/Voice)** | Mailgun, Postmark, MessageBird | SES provides lowest cost for high-volume marketing; SendGrid/Postmark guarantees high deliverability for transactional password/approval alerts. |
| **DEC-05** | Integration | Radium ERP System-of-Record (SoR) Boundary | **SYVORIS Ai owns Opportunity & Quote; Radium ERP owns Master Inventory & General Ledger** | SYVORIS owns all inventory; Radium owns all pricing | Clean commercial boundary: sales reps work unimpeded in SYVORIS; accepted orders hand off to Radium for physical picking, packing, and accounting. |
| **DEC-06** | Networking | Custom Tenant Domains & Wildcard SSL | **Cloudflare for SaaS (SSL for SaaS)** | AWS CloudFront + ACM, Caddy Reverse Proxy | Cloudflare for SaaS provides automated wildcard SSL provisioning for custom customer domains (`crm.customer.com`) with DDoS protection and WAF. |

---

## 4. Stakeholder Sign-Off Framework

Before initiating **Phase 1 (SaaS Foundation)**, executive stakeholders must confirm:
1. Approval of the **PostgreSQL Shared Database with Kernel Row-Level Security (RLS)** as the primary multi-tenancy model.
2. Approval of the **FastAPI + PostgreSQL + Celery + React 18** technology stack.
3. Selection of primary cloud provider and payment gateway (Stripe recommended).
4. Formal sign-off on the **Phase 0 Discovery Baseline**.
