from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    tenants,
    users,
    roles,
    audit,
    accounts,
    contacts,
    leads,
    duplicates,
    opportunities,
    products,
    price_books,
    cpq,
    quotes,
    orders,
    invoices,
    approvals,
    campaigns,
    segments,
    email_templates,
    cases,
    sla,
    knowledge,
    surveys,
    service,
    portal,
    projects
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Identity"])
api_router.include_router(tenants.router, prefix="/tenant", tags=["Tenant Administration"])
api_router.include_router(users.router, prefix="/admin/users", tags=["User & Membership Administration"])
api_router.include_router(roles.router, prefix="/admin/roles", tags=["Role-Based Access Control"])
api_router.include_router(audit.router, prefix="/admin/audit", tags=["Security Audit Trail"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["Accounts & Customer 360"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["Contacts & Stakeholders"])
api_router.include_router(leads.router, prefix="/leads", tags=["Leads & Conversion Engine"])
api_router.include_router(duplicates.router, prefix="/crm/duplicates", tags=["Deduplication & Record Merge Engine"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["Sales Pipelines & Opportunities"])
api_router.include_router(products.router, prefix="/products", tags=["Product Catalog"])
api_router.include_router(price_books.router, prefix="/price-books", tags=["Price Books & Commercial Pricing"])
api_router.include_router(cpq.router, prefix="/cpq", tags=["CPQ Calculation Engine"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["Quotations & CPQ Execution"])
api_router.include_router(orders.router, prefix="/sales-orders", tags=["Sales Orders & Order Fulfilment"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Customer Invoices & Billing"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["Commercial Approvals Queue"])

# Marketing Workstream
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["Marketing Campaigns"])
api_router.include_router(segments.router, prefix="/segments", tags=["Audience Segmentation"])
api_router.include_router(email_templates.router, prefix="/email-templates", tags=["Marketing Email Templates"])

# Customer Experience Workstream
api_router.include_router(cases.router, prefix="/cases", tags=["Customer Service Cases"])
api_router.include_router(service.router, prefix="/service", tags=["Customer Service Operations"])
api_router.include_router(portal.router, prefix="/portal", tags=["Customer Self-Service Portal"])
api_router.include_router(portal.router, prefix="/public", tags=["Public Support Intake"])
api_router.include_router(sla.router, prefix="/service/sla", tags=["SLA Policies"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge Base"])
api_router.include_router(surveys.router, prefix="/surveys", tags=["Surveys & Feedback"])
api_router.include_router(projects.router, prefix="/projects", tags=["Project Management"])
