import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.models.user import User
from app.schemas.billing import (
    CommercialPlanResponse,
    TenantSubscriptionResponse,
    TenantUsageMeterResponse,
    UsageRecordCreate,
    UsageRecordResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    CustomerPortalRequest,
    CustomerPortalResponse,
    StripeWebhookResponse,
)
from app.services.billing_service import BillingService
from app.services.usage_metering_service import UsageMeteringService
from app.core.errors import ValidationException

router = APIRouter()

# --- Public & Commercial Plans ---

@router.get("/plans", response_model=List[CommercialPlanResponse])
async def list_plans():
    """Returns available commercial SaaS plans, tier entitlements, quotas, and pricing."""
    return BillingService.get_plans()


# --- Tenant Subscription Lifecycle ---

@router.get("/subscription", response_model=TenantSubscriptionResponse)
async def get_subscription(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("billing:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve the current organization's active subscription, tier, and renewal period."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await BillingService.get_or_create_subscription(db, tenant_id=tenant_id)


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    req: CheckoutSessionRequest,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("billing:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Initiates a Stripe Checkout session to purchase or upgrade to a higher commercial tier."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await BillingService.create_checkout_session(db, tenant_id=tenant_id, req=req)


@router.post("/portal", response_model=CustomerPortalResponse)
async def create_customer_portal(
    req: CustomerPortalRequest,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("billing:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Generates a secure Stripe Customer Billing Portal link for invoice and payment method management."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await BillingService.create_portal_session(db, tenant_id=tenant_id, req=req)


# --- Stripe Webhook Ingestion ---

@router.post("/webhook", response_model=StripeWebhookResponse)
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db)
):
    """
    Public webhook receiver for incoming asynchronous Stripe events.
    Verifies payload signature, validates idempotency, and updates subscription state.
    """
    raw_body = await request.body()
    return await BillingService.process_stripe_webhook(
        db=db,
        raw_body=raw_body,
        stripe_signature=stripe_signature
    )


# --- Usage Metering & Entitlements ---

@router.get("/usage", response_model=TenantUsageMeterResponse)
async def get_usage_meters(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("billing:read")),
    db: AsyncSession = Depends(get_db)
):
    """Returns real-time usage consumption vs entitlement quotas for the active 30-day period."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await UsageMeteringService.get_usage_metrics(db, tenant_id=tenant_id)


@router.post("/usage/record", response_model=UsageRecordResponse)
async def record_usage(
    record_in: UsageRecordCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("billing:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Records an auditable usage event (AI tokens, storage bytes, seats, API calls) and enforces quotas."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await UsageMeteringService.record_usage(
        db=db,
        tenant_id=tenant_id,
        record_in=record_in,
        actor_id=current_user.id
    )
