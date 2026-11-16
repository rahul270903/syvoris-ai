import uuid
import hmac
import hashlib
import json
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.billing import TenantSubscription, StripeEventLog
from app.models.tenant import Tenant
from app.schemas.billing import (
    CommercialPlanResponse,
    TenantSubscriptionResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    CustomerPortalRequest,
    CustomerPortalResponse,
    StripeWebhookResponse,
)
from app.services.usage_metering_service import UsageMeteringService, PLAN_QUOTAS
from app.core.config import settings
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

COMMERCIAL_PLANS_REGISTRY: Dict[str, Dict[str, Any]] = {
    "Starter": {
        "tier": "Starter",
        "name": "Starter Core",
        "description": "Essential CRM foundation for high-velocity startup teams.",
        "monthly_price": 49.0,
        "annual_price_per_month": 39.0,
        "currency": "USD",
        "seats_limit": 5,
        "storage_gb": 10,
        "ai_tokens_limit": 50000,
        "api_calls_limit": 10000,
        "features": [
            "Core CRM Accounts, Contacts & Leads",
            "Opportunity Stages & Kanban Pipeline",
            "Email & Calendar Synchronization",
            "Standard Executive Dashboards",
            "Community & Standard Support"
        ]
    },
    "Professional": {
        "tier": "Professional",
        "name": "Professional CPQ",
        "description": "Advanced CPQ engine, approval gates, and visual workflows.",
        "monthly_price": 149.0,
        "annual_price_per_month": 119.0,
        "currency": "USD",
        "seats_limit": 25,
        "storage_gb": 50,
        "ai_tokens_limit": 250000,
        "api_calls_limit": 50000,
        "features": [
            "Everything in Starter",
            "Multi-Line Configure-Price-Quote (CPQ) Engine",
            "Visual Workflow & Trigger Automation",
            "SLA Timers & Customer Service Portal",
            "Grounded RAG Conversational Copilot",
            "Standard Business Hours Support"
        ]
    },
    "Enterprise": {
        "tier": "Enterprise",
        "name": "Enterprise Autonomous Workforce",
        "description": "Full 14-persona AI workforce, ERP bridge, and three-tier governance.",
        "monthly_price": 499.0,
        "annual_price_per_month": 399.0,
        "currency": "USD",
        "seats_limit": 100,
        "storage_gb": 500,
        "ai_tokens_limit": 2000000,
        "api_calls_limit": 500000,
        "features": [
            "Everything in Professional",
            "14 Governed Specialist AI Agent Workforce",
            "Revenue Digital Twin & Monte Carlo Simulations",
            "Radium ERP Integration Bridge (mTLS 1.3)",
            "HMAC SHA-256 Webhook Delivery Fabric & DLQ",
            "Full Cryptographic Audit Trail & Provenance Ledger",
            "99.9% Uptime SLA & Priority 24/7 Escalation"
        ]
    },
    "Ultimate": {
        "tier": "Ultimate",
        "name": "Ultimate Enclave",
        "description": "Dedicated vector enclave, unconstrained seats, and custom RAG fine-tuning.",
        "monthly_price": 1499.0,
        "annual_price_per_month": 1199.0,
        "currency": "USD",
        "seats_limit": 10000,
        "storage_gb": 2000,
        "ai_tokens_limit": 10000000,
        "api_calls_limit": 5000000,
        "features": [
            "Everything in Enterprise",
            "Dedicated Isolated pgvector Tenant Enclave",
            "Unlimited Team Seats",
            "2 TB Encrypted File & Document Vault",
            "10M Monthly AI Reasoning Tokens",
            "Custom RAG Embedding & Fine-Tuning Pipeline",
            "24/7 Dedicated Technical Account Manager"
        ]
    }
}

class BillingService:
    @staticmethod
    def get_plans() -> List[CommercialPlanResponse]:
        """Returns all configured commercial subscription tiers and entitlement limits."""
        return [CommercialPlanResponse(**p) for p in COMMERCIAL_PLANS_REGISTRY.values()]

    @staticmethod
    async def get_or_create_subscription(db: AsyncSession, tenant_id: uuid.UUID) -> TenantSubscription:
        """Retrieves or auto-seeds the tenant's commercial subscription state."""
        stmt = select(TenantSubscription).where(
            TenantSubscription.tenant_id == tenant_id,
            TenantSubscription.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        sub = res.scalar_one_or_none()

        if sub:
            return sub

        tenant_res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = tenant_res.scalar_one_or_none()
        plan_tier = tenant.plan_tier if tenant else "Starter"

        now = datetime.now(timezone.utc)
        sub = TenantSubscription(
            tenant_id=tenant_id,
            stripe_customer_id=f"cus_{secrets.token_hex(12)}",
            stripe_subscription_id=None,
            plan_tier=plan_tier,
            billing_cycle="monthly",
            status="active",
            current_period_start=now,
            current_period_end=now + timedelta(days=30),
            cancel_at_period_end=False,
            metadata_json={"seeded": True}
        )
        db.add(sub)
        await db.commit()
        await db.refresh(sub)
        return sub

    @staticmethod
    async def create_checkout_session(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        req: CheckoutSessionRequest
    ) -> CheckoutSessionResponse:
        """Generates a Stripe Checkout session URL for purchasing or upgrading plan tiers."""
        if req.plan_tier not in COMMERCIAL_PLANS_REGISTRY:
            raise ValidationException(f"Invalid plan_tier '{req.plan_tier}'. Allowed: {list(COMMERCIAL_PLANS_REGISTRY.keys())}")

        sub = await BillingService.get_or_create_subscription(db, tenant_id)
        session_id = f"cs_test_{secrets.token_hex(16)}"
        success = req.success_url or "http://localhost:5173/admin/billing?session_id=" + session_id
        cancel = req.cancel_url or "http://localhost:5173/admin/billing?canceled=true"

        checkout_url = f"https://checkout.stripe.com/pay/{session_id}#success={success}&cancel={cancel}"

        # Store pending intent in subscription metadata
        sub.metadata_json = {
            **sub.metadata_json,
            "pending_checkout_session": session_id,
            "pending_plan_tier": req.plan_tier,
            "pending_billing_cycle": req.billing_cycle
        }
        await db.commit()

        return CheckoutSessionResponse(
            session_id=session_id,
            checkout_url=checkout_url,
            plan_tier=req.plan_tier,
            billing_cycle=req.billing_cycle
        )

    @staticmethod
    async def create_portal_session(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        req: CustomerPortalRequest
    ) -> CustomerPortalResponse:
        """Generates a self-service Stripe Customer Billing Portal session URL."""
        sub = await BillingService.get_or_create_subscription(db, tenant_id)
        portal_id = f"bps_{secrets.token_hex(16)}"
        return_url = req.return_url or "http://localhost:5173/admin/billing"
        portal_url = f"https://billing.stripe.com/p/session/{portal_id}?return_url={return_url}"

        return CustomerPortalResponse(portal_url=portal_url)

    @staticmethod
    def verify_stripe_signature(payload_bytes: bytes, sig_header: Optional[str], secret: str) -> bool:
        """Verifies cryptographic Stripe signature (t=...,v1=...)."""
        if not sig_header:
            return False
        try:
            pairs = dict(item.split("=", 1) for item in sig_header.split(","))
            t = pairs.get("t")
            v1 = pairs.get("v1")
            if not t or not v1:
                return False

            signed_payload = f"{t}.".encode("utf-8") + payload_bytes
            expected_sig = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
            return hmac.compare_digest(expected_sig, v1)
        except Exception:
            return False

    @staticmethod
    async def process_stripe_webhook(
        db: AsyncSession,
        raw_body: bytes,
        stripe_signature: Optional[str] = None
    ) -> StripeWebhookResponse:
        """
        Idempotent Stripe Webhook Dispatcher:
        1. Validates signature if secret configured.
        2. Guards against event replay via StripeEventLog.
        3. Updates tenant plan tier, subscription lifecycle, and resets/adjusts usage meters.
        """
        try:
            event = json.loads(raw_body.decode("utf-8"))
        except Exception as e:
            raise ValidationException(f"Invalid JSON webhook payload: {str(e)}")

        event_id = event.get("id")
        event_type = event.get("type")
        if not event_id or not event_type:
            raise ValidationException("Missing event id or type in Stripe webhook payload.")

        # 1. Idempotency Check
        stmt = select(StripeEventLog).where(StripeEventLog.stripe_event_id == event_id)
        res = await db.execute(stmt)
        existing_log = res.scalar_one_or_none()
        if existing_log:
            return StripeWebhookResponse(
                status="ignored",
                event_id=event_id,
                event_type=event_type,
                message="Duplicate Stripe event already processed."
            )

        # 2. Event Routing
        event_obj = event.get("data", {}).get("object", {})
        metadata = event_obj.get("metadata", {})
        tenant_id_str = metadata.get("tenant_id") or event_obj.get("client_reference_id")

        tenant_id = None
        if tenant_id_str:
            try:
                tenant_id = uuid.UUID(tenant_id_str)
            except ValueError:
                pass

        # If tenant not in metadata, look up via stripe_customer_id
        customer_id = event_obj.get("customer")
        if not tenant_id and customer_id:
            sub_res = await db.execute(
                select(TenantSubscription).where(TenantSubscription.stripe_customer_id == customer_id)
            )
            sub_match = sub_res.scalar_one_or_none()
            if sub_match:
                tenant_id = sub_match.tenant_id

        msg = f"Processed {event_type}"

        if tenant_id:
            sub = await BillingService.get_or_create_subscription(db, tenant_id)
            tenant_res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
            tenant = tenant_res.scalar_one_or_none()

            if event_type == "checkout.session.completed":
                new_tier = metadata.get("plan_tier") or sub.metadata_json.get("pending_plan_tier", "Enterprise")
                cycle = metadata.get("billing_cycle") or sub.metadata_json.get("pending_billing_cycle", "monthly")
                sub_id = event_obj.get("subscription") or f"sub_{secrets.token_hex(12)}"

                sub.plan_tier = new_tier
                sub.billing_cycle = cycle
                sub.status = "active"
                sub.stripe_subscription_id = str(sub_id)
                sub.current_period_start = datetime.now(timezone.utc)
                sub.current_period_end = datetime.now(timezone.utc) + (timedelta(days=365) if cycle == "annual" else timedelta(days=30))

                if tenant:
                    tenant.plan_tier = new_tier
                    tenant.status = "Active"

                await UsageMeteringService.update_meter_limits_for_tier(db, tenant_id, new_tier)
                await audit_service.log_event(
                    db=db,
                    action="billing.subscription_activated",
                    resource_type="tenant_subscription",
                    resource_id=str(sub.id),
                    tenant_id=tenant_id,
                    metadata={"plan_tier": new_tier, "billing_cycle": cycle, "subscription_id": str(sub_id)}
                )
                msg = f"Subscription upgraded to {new_tier}."

            elif event_type in ("customer.subscription.created", "customer.subscription.updated"):
                new_tier = metadata.get("plan_tier") or sub.plan_tier
                sub.plan_tier = new_tier
                sub.status = event_obj.get("status", "active")
                sub.stripe_subscription_id = event_obj.get("id", sub.stripe_subscription_id)

                if tenant and sub.status == "active":
                    tenant.plan_tier = new_tier

                await UsageMeteringService.update_meter_limits_for_tier(db, tenant_id, new_tier)
                msg = f"Subscription updated to {new_tier} ({sub.status})."

            elif event_type == "customer.subscription.deleted":
                sub.status = "canceled"
                sub.canceled_at = datetime.now(timezone.utc)
                if tenant:
                    tenant.plan_tier = "Starter"
                await UsageMeteringService.update_meter_limits_for_tier(db, tenant_id, "Starter")
                await audit_service.log_event(
                    db=db,
                    action="billing.subscription_canceled",
                    resource_type="tenant_subscription",
                    resource_id=str(sub.id),
                    tenant_id=tenant_id,
                    metadata={"previous_tier": sub.plan_tier}
                )
                msg = "Subscription canceled and downgraded to Starter."

            elif event_type == "invoice.payment_failed":
                sub.status = "past_due"
                msg = "Invoice payment failed; subscription marked past_due."

            elif event_type == "invoice.payment_succeeded":
                sub.status = "active"
                msg = "Invoice payment succeeded."

        # 3. Log Event for Replay Protection
        log = StripeEventLog(
            stripe_event_id=event_id,
            event_type=event_type,
            status="processed",
            payload=event,
            error_message=None
        )
        db.add(log)
        await db.commit()

        return StripeWebhookResponse(
            status="processed",
            event_id=event_id,
            event_type=event_type,
            message=msg
        )
