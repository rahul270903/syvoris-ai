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
    duplicates
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
