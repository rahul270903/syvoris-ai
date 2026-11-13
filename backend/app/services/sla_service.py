import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_

from app.models.service import SLAPolicy
from app.schemas.service import (
    SLAPolicyCreate,
    SLAPolicyUpdate,
    SLAPolicyResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

DEFAULT_SLA_TARGETS = {
    "Critical": {"first_response_hours": 1, "resolution_hours": 4},
    "High": {"first_response_hours": 2, "resolution_hours": 8},
    "Normal": {"first_response_hours": 4, "resolution_hours": 24},
    "Low": {"first_response_hours": 8, "resolution_hours": 48},
}

class SLAService:
    """Service managing SLA policies, target calculations and breach tracking."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(SLAPolicy).where(SLAPolicy.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"SLA-{year}-{count + 1:05d}"

    @staticmethod
    async def list_policies(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        is_active: Optional[bool] = None
    ) -> List[SLAPolicyResponse]:
        stmt = select(SLAPolicy).where(
            SLAPolicy.tenant_id == tenant_id,
            SLAPolicy.deleted_at.is_(None)
        )
        if is_active is not None:
            stmt = stmt.where(SLAPolicy.is_active == is_active)

        stmt = stmt.order_by(SLAPolicy.created_at.desc())
        res = await db.execute(stmt)
        policies = res.scalars().all()

        if not policies:
            # Seed standard default policies
            for prio, targets in DEFAULT_SLA_TARGETS.items():
                ref = await SLAService._generate_ref(db, tenant_id)
                p = SLAPolicy(
                    tenant_id=tenant_id,
                    ref=ref,
                    name=f"Standard {prio} SLA Policy",
                    priority=prio,
                    first_response_hours=targets["first_response_hours"],
                    resolution_hours=targets["resolution_hours"],
                    business_hours_only=True,
                    is_active=True
                )
                db.add(p)
            await db.commit()
            res = await db.execute(stmt)
            policies = res.scalars().all()

        return [SLAPolicyResponse.model_validate(p) for p in policies]

    @staticmethod
    async def get_policy(db: AsyncSession, policy_id: uuid.UUID, tenant_id: uuid.UUID) -> SLAPolicyResponse:
        stmt = select(SLAPolicy).where(
            SLAPolicy.id == policy_id,
            SLAPolicy.tenant_id == tenant_id,
            SLAPolicy.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        policy = res.scalar_one_or_none()
        if not policy:
            raise NotFoundException("SLA policy not found.")
        return SLAPolicyResponse.model_validate(policy)

    @staticmethod
    async def create_policy(
        db: AsyncSession,
        policy_in: SLAPolicyCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> SLAPolicyResponse:
        ref = await SLAService._generate_ref(db, tenant_id)
        policy = SLAPolicy(
            tenant_id=tenant_id,
            ref=ref,
            name=policy_in.name,
            description=policy_in.description,
            priority=policy_in.priority,
            first_response_hours=policy_in.first_response_hours,
            resolution_hours=policy_in.resolution_hours,
            business_hours_only=policy_in.business_hours_only,
            is_active=policy_in.is_active,
            custom_fields=policy_in.custom_fields
        )
        db.add(policy)
        await db.commit()
        await db.refresh(policy)

        await audit_service.log_event(
            db=db,
            action="sla_policy.created",
            resource_type="sla_policy",
            resource_id=str(policy.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": ref, "name": policy.name, "priority": policy.priority}
        )

        return SLAPolicyResponse.model_validate(policy)

    @staticmethod
    async def update_policy(
        db: AsyncSession,
        policy_id: uuid.UUID,
        policy_in: SLAPolicyUpdate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> SLAPolicyResponse:
        stmt = select(SLAPolicy).where(
            SLAPolicy.id == policy_id,
            SLAPolicy.tenant_id == tenant_id,
            SLAPolicy.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        policy = res.scalar_one_or_none()
        if not policy:
            raise NotFoundException("SLA policy not found.")

        update_dict = policy_in.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(policy, key, val)

        await db.commit()
        await db.refresh(policy)

        await audit_service.log_event(
            db=db,
            action="sla_policy.updated",
            resource_type="sla_policy",
            resource_id=str(policy.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": policy.ref, "updated_fields": list(update_dict.keys())}
        )

        return SLAPolicyResponse.model_validate(policy)

    @staticmethod
    async def calculate_deadlines(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        priority: str,
        base_time: Optional[datetime] = None
    ) -> Tuple[datetime, datetime]:
        now = ensure_utc(base_time) or datetime.now(timezone.utc)
        # Look for custom policy matching priority
        stmt = select(SLAPolicy).where(
            SLAPolicy.tenant_id == tenant_id,
            SLAPolicy.priority == priority,
            SLAPolicy.is_active == True,
            SLAPolicy.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        policy = res.scalar_one_or_none()

        resp_hrs = policy.first_response_hours if policy else DEFAULT_SLA_TARGETS.get(priority, {}).get("first_response_hours", 4)
        res_hrs = policy.resolution_hours if policy else DEFAULT_SLA_TARGETS.get(priority, {}).get("resolution_hours", 24)

        from app.services.business_hours_service import BusinessHoursService
        business_hours = None
        if not policy or policy.business_hours_only:
            business_hours = await BusinessHoursService.get_default_business_hours(db, tenant_id)

        response_deadline = BusinessHoursService.calculate_deadline(now, resp_hrs, business_hours)
        resolution_deadline = BusinessHoursService.calculate_deadline(now, res_hrs, business_hours)
        return response_deadline, resolution_deadline
