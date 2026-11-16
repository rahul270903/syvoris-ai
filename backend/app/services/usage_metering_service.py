import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.billing import TenantUsageMeter, UsageEvent
from app.models.tenant import Tenant
from app.models.user import TenantMembership
from app.schemas.billing import TenantUsageMeterResponse, UsageRecordCreate, UsageRecordResponse
from app.core.errors import ValidationException, NotFoundException

PLAN_QUOTAS = {
    "Starter": {
        "seats_limit": 5,
        "storage_bytes_limit": 10 * 1024 * 1024 * 1024,  # 10 GB
        "ai_tokens_limit": 50000,
        "api_calls_limit": 10000,
    },
    "Professional": {
        "seats_limit": 25,
        "storage_bytes_limit": 50 * 1024 * 1024 * 1024,  # 50 GB
        "ai_tokens_limit": 250000,
        "api_calls_limit": 50000,
    },
    "Enterprise": {
        "seats_limit": 100,
        "storage_bytes_limit": 500 * 1024 * 1024 * 1024,  # 500 GB
        "ai_tokens_limit": 2000000,
        "api_calls_limit": 500000,
    },
    "Ultimate": {
        "seats_limit": 10000,
        "storage_bytes_limit": 2000 * 1024 * 1024 * 1024,  # 2 TB
        "ai_tokens_limit": 10000000,
        "api_calls_limit": 5000000,
    },
}

class UsageMeteringService:
    @staticmethod
    async def get_or_create_meter(db: AsyncSession, tenant_id: uuid.UUID) -> TenantUsageMeter:
        """Retrieves or auto-initializes the active 30-day billing meter for a tenant."""
        now = datetime.now(timezone.utc)
        stmt = select(TenantUsageMeter).where(
            TenantUsageMeter.tenant_id == tenant_id,
            TenantUsageMeter.billing_period_end > now,
            TenantUsageMeter.deleted_at.is_(None)
        ).order_by(TenantUsageMeter.created_at.desc())
        res = await db.execute(stmt)
        meter = res.scalar_one_or_none()

        if meter:
            # Sync seats used
            seat_count_res = await db.execute(
                select(func.count()).select_from(TenantMembership).where(
                    TenantMembership.tenant_id == tenant_id,
                    TenantMembership.deleted_at.is_(None)
                )
            )
            meter.seats_used = max(seat_count_res.scalar() or 1, 1)
            await db.commit()
            await db.refresh(meter)
            return meter

        # Inspect tenant tier
        tenant_res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = tenant_res.scalar_one_or_none()
        plan_tier = tenant.plan_tier if tenant else "Starter"
        quotas = PLAN_QUOTAS.get(plan_tier, PLAN_QUOTAS["Starter"])

        seat_count_res = await db.execute(
            select(func.count()).select_from(TenantMembership).where(
                TenantMembership.tenant_id == tenant_id,
                TenantMembership.deleted_at.is_(None)
            )
        )
        current_seats = max(seat_count_res.scalar() or 1, 1)

        period_start = now
        period_end = now + timedelta(days=30)

        meter = TenantUsageMeter(
            tenant_id=tenant_id,
            billing_period_start=period_start,
            billing_period_end=period_end,
            seats_limit=quotas["seats_limit"],
            seats_used=current_seats,
            storage_bytes_limit=quotas["storage_bytes_limit"],
            storage_bytes_used=0,
            ai_tokens_limit=quotas["ai_tokens_limit"],
            ai_tokens_used=0,
            api_calls_limit=quotas["api_calls_limit"],
            api_calls_used=0,
        )
        db.add(meter)
        await db.commit()
        await db.refresh(meter)
        return meter

    @staticmethod
    async def get_usage_metrics(db: AsyncSession, tenant_id: uuid.UUID) -> TenantUsageMeterResponse:
        meter = await UsageMeteringService.get_or_create_meter(db, tenant_id)

        seats_pct = round((meter.seats_used / meter.seats_limit) * 100, 1) if meter.seats_limit > 0 else 0.0
        storage_pct = round((meter.storage_bytes_used / meter.storage_bytes_limit) * 100, 1) if meter.storage_bytes_limit > 0 else 0.0
        ai_tokens_pct = round((meter.ai_tokens_used / meter.ai_tokens_limit) * 100, 1) if meter.ai_tokens_limit > 0 else 0.0
        api_calls_pct = round((meter.api_calls_used / meter.api_calls_limit) * 100, 1) if meter.api_calls_limit > 0 else 0.0
        storage_gb = round(meter.storage_bytes_used / (1024 * 1024 * 1024), 2)

        return TenantUsageMeterResponse(
            id=meter.id,
            tenant_id=meter.tenant_id,
            billing_period_start=meter.billing_period_start,
            billing_period_end=meter.billing_period_end,
            seats_limit=meter.seats_limit,
            seats_used=meter.seats_used,
            storage_bytes_limit=meter.storage_bytes_limit,
            storage_bytes_used=meter.storage_bytes_used,
            storage_gb_used=storage_gb,
            ai_tokens_limit=meter.ai_tokens_limit,
            ai_tokens_used=meter.ai_tokens_used,
            api_calls_limit=meter.api_calls_limit,
            api_calls_used=meter.api_calls_used,
            seats_percent=seats_pct,
            storage_percent=storage_pct,
            ai_tokens_percent=ai_tokens_pct,
            api_calls_percent=api_calls_pct,
        )

    @staticmethod
    async def update_meter_limits_for_tier(db: AsyncSession, tenant_id: uuid.UUID, plan_tier: str) -> TenantUsageMeter:
        """Dynamically adjusts active meter limits when subscription tier changes."""
        meter = await UsageMeteringService.get_or_create_meter(db, tenant_id)
        quotas = PLAN_QUOTAS.get(plan_tier, PLAN_QUOTAS["Starter"])

        meter.seats_limit = quotas["seats_limit"]
        meter.storage_bytes_limit = quotas["storage_bytes_limit"]
        meter.ai_tokens_limit = quotas["ai_tokens_limit"]
        meter.api_calls_limit = quotas["api_calls_limit"]

        await db.commit()
        await db.refresh(meter)
        return meter

    @staticmethod
    async def record_usage(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        record_in: UsageRecordCreate,
        actor_id: Optional[uuid.UUID] = None
    ) -> UsageRecordResponse:
        """Records an auditable usage increment and enforces entitlement quota gates."""
        # 1. Idempotency Check
        if record_in.idempotency_key:
            stmt = select(UsageEvent).where(
                UsageEvent.tenant_id == tenant_id,
                UsageEvent.idempotency_key == record_in.idempotency_key
            )
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()
            if existing:
                return UsageRecordResponse.model_validate(existing)

        meter = await UsageMeteringService.get_or_create_meter(db, tenant_id)

        # 2. Quota Check & Entitlement Enforcement
        if record_in.meter_type == "ai_tokens":
            if meter.ai_tokens_used + record_in.quantity > meter.ai_tokens_limit:
                raise ValidationException(
                    f"Monthly AI token entitlement limit exceeded ({meter.ai_tokens_used + record_in.quantity} > {meter.ai_tokens_limit}). Upgrade subscription tier to continue."
                )
            meter.ai_tokens_used += record_in.quantity

        elif record_in.meter_type == "seat":
            if meter.seats_used + record_in.quantity > meter.seats_limit:
                raise ValidationException(
                    f"Team seat quota exceeded ({meter.seats_used + record_in.quantity} > {meter.seats_limit}). Upgrade subscription tier to add seats."
                )
            meter.seats_used += record_in.quantity

        elif record_in.meter_type == "storage_bytes":
            if meter.storage_bytes_used + record_in.quantity > meter.storage_bytes_limit:
                raise ValidationException(
                    f"Storage quota limit reached ({meter.storage_bytes_used + record_in.quantity} bytes > {meter.storage_bytes_limit} bytes). Upgrade plan to upload files."
                )
            meter.storage_bytes_used += record_in.quantity

        elif record_in.meter_type == "api_call":
            meter.api_calls_used += record_in.quantity

        else:
            raise ValidationException(f"Invalid meter_type '{record_in.meter_type}'. Allowed: ai_tokens, seat, storage_bytes, api_call")

        # 3. Create Usage Event Audit Record
        event = UsageEvent(
            tenant_id=tenant_id,
            meter_type=record_in.meter_type,
            quantity=record_in.quantity,
            idempotency_key=record_in.idempotency_key,
            actor_id=actor_id,
            description=record_in.description,
            event_metadata=record_in.metadata
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)

        return UsageRecordResponse.model_validate(event)
