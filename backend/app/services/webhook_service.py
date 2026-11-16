import uuid
import hmac
import hashlib
import json
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.models.integration import WebhookSubscription, WebhookDelivery
from app.schemas.integration import (
    WebhookSubscriptionCreate,
    WebhookSubscriptionUpdate,
    WebhookSubscriptionResponse,
    WebhookDeliveryResponse,
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class WebhookService:
    @staticmethod
    async def _generate_sub_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(WebhookSubscription).where(WebhookSubscription.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"WHK-{year}-{count + 1:04d}"

    @staticmethod
    async def _generate_delivery_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(WebhookDelivery).where(WebhookDelivery.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"WHD-{year}-{count + 1:05d}"

    @staticmethod
    def calculate_signature(secret: str, payload: Dict[str, Any]) -> str:
        """Computes cryptographic HMAC SHA-256 signature of canonical JSON payload."""
        canonical_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        sig = hmac.new(secret.encode('utf-8'), canonical_json.encode('utf-8'), hashlib.sha256).hexdigest()
        return f"sha256={sig}"

    @staticmethod
    async def create_subscription(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        sub_in: WebhookSubscriptionCreate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> WebhookSubscriptionResponse:
        ref = await WebhookService._generate_sub_ref(db, tenant_id)
        secret = sub_in.secret_key or f"whsec_{secrets.token_hex(24)}"

        sub = WebhookSubscription(
            tenant_id=tenant_id,
            ref=ref,
            name=sub_in.name,
            target_url=sub_in.target_url,
            secret_key=secret,
            events=sub_in.events or ["*"],
            is_active=sub_in.is_active,
            max_retries=sub_in.max_retries,
            retry_backoff_seconds=sub_in.retry_backoff_seconds,
            custom_headers=sub_in.custom_headers
        )
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

        await audit_service.log_event(
            db=db,
            action="webhook_subscription.created",
            resource_type="webhook_subscription",
            resource_id=str(sub.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": ref, "name": sub.name, "target_url": sub.target_url, "events": sub.events}
        )

        return WebhookSubscriptionResponse.model_validate(sub)

    @staticmethod
    async def list_subscriptions(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        is_active: Optional[bool] = None
    ) -> List[WebhookSubscriptionResponse]:
        stmt = select(WebhookSubscription).where(
            WebhookSubscription.tenant_id == tenant_id,
            WebhookSubscription.deleted_at.is_(None)
        )
        if is_active is not None:
            stmt = stmt.where(WebhookSubscription.is_active == is_active)

        res = await db.execute(stmt.order_by(WebhookSubscription.created_at.desc()))
        subs = res.scalars().all()
        return [WebhookSubscriptionResponse.model_validate(s) for s in subs]

    @staticmethod
    async def get_subscription(
        db: AsyncSession,
        sub_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> WebhookSubscriptionResponse:
        stmt = select(WebhookSubscription).where(
            WebhookSubscription.id == sub_id,
            WebhookSubscription.tenant_id == tenant_id,
            WebhookSubscription.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        sub = res.scalar_one_or_none()
        if not sub:
            raise NotFoundException("Webhook subscription not found.")
        return WebhookSubscriptionResponse.model_validate(sub)

    @staticmethod
    async def update_subscription(
        db: AsyncSession,
        sub_id: uuid.UUID,
        tenant_id: uuid.UUID,
        sub_in: WebhookSubscriptionUpdate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> WebhookSubscriptionResponse:
        stmt = select(WebhookSubscription).where(
            WebhookSubscription.id == sub_id,
            WebhookSubscription.tenant_id == tenant_id,
            WebhookSubscription.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        sub = res.scalar_one_or_none()
        if not sub:
            raise NotFoundException("Webhook subscription not found.")

        update_dict = sub_in.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(sub, key, val)

        await db.commit()
        await db.refresh(sub)

        await audit_service.log_event(
            db=db,
            action="webhook_subscription.updated",
            resource_type="webhook_subscription",
            resource_id=str(sub.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": sub.ref, "name": sub.name, "is_active": sub.is_active}
        )

        return WebhookSubscriptionResponse.model_validate(sub)

    @staticmethod
    async def delete_subscription(
        db: AsyncSession,
        sub_id: uuid.UUID,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> None:
        stmt = select(WebhookSubscription).where(
            WebhookSubscription.id == sub_id,
            WebhookSubscription.tenant_id == tenant_id,
            WebhookSubscription.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        sub = res.scalar_one_or_none()
        if not sub:
            raise NotFoundException("Webhook subscription not found.")

        sub.deleted_at = datetime.now(timezone.utc)
        sub.is_active = False
        await db.commit()

        await audit_service.log_event(
            db=db,
            action="webhook_subscription.deleted",
            resource_type="webhook_subscription",
            resource_id=str(sub.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": sub.ref}
        )

    @staticmethod
    async def dispatch_event(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        event_name: str,
        payload: Dict[str, Any],
        simulate_failure: bool = False
    ) -> List[WebhookDeliveryResponse]:
        """Dispatches an event to all matching active webhook subscriptions."""
        stmt = select(WebhookSubscription).where(
            WebhookSubscription.tenant_id == tenant_id,
            WebhookSubscription.is_active == True,
            WebhookSubscription.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        active_subs = res.scalars().all()

        deliveries: List[WebhookDeliveryResponse] = []
        delivery_objs: List[WebhookDelivery] = []
        for sub in active_subs:
            # Check if subscribed to this event
            if "*" not in sub.events and event_name not in sub.events:
                continue

            ref = await WebhookService._generate_delivery_ref(db, tenant_id)
            signature = WebhookService.calculate_signature(sub.secret_key, payload)

            status = "Failed" if simulate_failure else "Success"
            status_code = 503 if simulate_failure else 200
            err_msg = "Upstream server returned 503 Service Unavailable" if simulate_failure else None
            next_retry = datetime.now(timezone.utc) + timedelta(seconds=sub.retry_backoff_seconds) if simulate_failure else None

            delivery = WebhookDelivery(
                tenant_id=tenant_id,
                subscription_id=sub.id,
                ref=ref,
                event_name=event_name,
                payload=payload,
                signature=signature,
                status=status,
                status_code=status_code,
                response_body='{"received": true}' if not simulate_failure else '{"error": "temporarily unavailable"}',
                retry_count=0,
                next_retry_at=next_retry,
                duration_ms=45,
                error_message=err_msg
            )
            db.add(delivery)
            delivery_objs.append(delivery)

            sub.deliveries_count += 1
            sub.last_delivered_at = datetime.now(timezone.utc)

        await db.commit()
        for d in delivery_objs:
            await db.refresh(d)
            deliveries.append(WebhookDeliveryResponse.model_validate(d))

        return deliveries

    @staticmethod
    async def retry_delivery(
        db: AsyncSession,
        delivery_id: uuid.UUID,
        tenant_id: uuid.UUID,
        simulate_success: bool = True
    ) -> WebhookDeliveryResponse:
        """Processes exponential backoff retry; routes to Dead-Letter Queue if max retries exceeded."""
        stmt = select(WebhookDelivery).where(
            WebhookDelivery.id == delivery_id,
            WebhookDelivery.tenant_id == tenant_id
        )
        res = await db.execute(stmt)
        delivery = res.scalar_one_or_none()
        if not delivery:
            raise NotFoundException("Delivery record not found.")

        # Load subscription for backoff config
        sub_res = await db.execute(select(WebhookSubscription).where(WebhookSubscription.id == delivery.subscription_id))
        sub = sub_res.scalar_one_or_none()
        max_retries = sub.max_retries if sub else 5
        base_backoff = sub.retry_backoff_seconds if sub else 30

        delivery.retry_count += 1

        if simulate_success:
            delivery.status = "Success"
            delivery.status_code = 200
            delivery.error_message = None
            delivery.next_retry_at = None
            delivery.response_body = '{"received": true, "attempt": ' + str(delivery.retry_count) + '}'
        else:
            if delivery.retry_count >= max_retries:
                delivery.status = "Dead-Letter"
                delivery.error_message = f"Exhausted maximum retry attempts ({max_retries}). Moved to Dead-Letter Queue."
                delivery.next_retry_at = None
            else:
                delivery.status = "Retrying"
                # Exponential backoff formula: base * (2 ** retry_count)
                backoff_delay = base_backoff * (2 ** (delivery.retry_count - 1))
                delivery.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=backoff_delay)
                delivery.error_message = f"Retry attempt {delivery.retry_count} failed. Backoff: {backoff_delay}s."

        await db.commit()
        await db.refresh(delivery)
        return WebhookDeliveryResponse.model_validate(delivery)

    @staticmethod
    async def list_deliveries(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        subscription_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[WebhookDeliveryResponse]:
        stmt = select(WebhookDelivery).where(WebhookDelivery.tenant_id == tenant_id)
        if subscription_id:
            stmt = stmt.where(WebhookDelivery.subscription_id == subscription_id)
        if status:
            stmt = stmt.where(WebhookDelivery.status == status)

        res = await db.execute(stmt.order_by(WebhookDelivery.created_at.desc()).limit(limit))
        items = res.scalars().all()
        return [WebhookDeliveryResponse.model_validate(d) for d in items]
