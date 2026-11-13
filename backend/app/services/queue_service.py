import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.models.service import SupportQueue, Case
from app.schemas.service import (
    SupportQueueCreate,
    SupportQueueUpdate,
    SupportQueueResponse,
    CaseResponse
)
from app.services.case_service import CaseService
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class QueueService:
    """Service managing support routing queues, workload capacities, and case claims."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(SupportQueue).where(SupportQueue.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"QUE-{year}-{count + 1:05d}"

    @staticmethod
    async def list_queues(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        is_active: Optional[bool] = None
    ) -> List[SupportQueueResponse]:
        stmt = select(SupportQueue).where(
            SupportQueue.tenant_id == tenant_id,
            SupportQueue.deleted_at.is_(None)
        )
        if is_active is not None:
            stmt = stmt.where(SupportQueue.is_active == is_active)
        stmt = stmt.order_by(SupportQueue.name.asc())

        res = await db.execute(stmt)
        queues = res.scalars().all()

        results: List[SupportQueueResponse] = []
        for q in queues:
            # Count active cases assigned to this queue
            case_stmt = select(func.count()).select_from(Case).where(
                Case.tenant_id == tenant_id,
                Case.deleted_at.is_(None),
                Case.assigned_queue == q.name,
                Case.status.in_(["New", "Assigned", "In Progress", "Awaiting Customer"])
            )
            count_res = await db.execute(case_stmt)
            active_count = count_res.scalar() or 0

            item = SupportQueueResponse.model_validate(q)
            item.active_case_count = active_count
            results.append(item)

        return results

    @staticmethod
    async def create_queue(
        db: AsyncSession,
        queue_in: SupportQueueCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> SupportQueueResponse:
        # Check duplicate code
        stmt = select(SupportQueue).where(
            SupportQueue.tenant_id == tenant_id,
            SupportQueue.code == queue_in.code,
            SupportQueue.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise ValidationException(f"Support queue with code '{queue_in.code}' already exists.")

        ref = await QueueService._generate_ref(db, tenant_id)
        queue = SupportQueue(
            tenant_id=tenant_id,
            ref=ref,
            name=queue_in.name,
            code=queue_in.code,
            description=queue_in.description,
            priority=queue_in.priority,
            default_channel=queue_in.default_channel,
            max_capacity=queue_in.max_capacity,
            is_active=queue_in.is_active,
            custom_fields=queue_in.custom_fields
        )
        db.add(queue)
        await db.commit()
        await db.refresh(queue)

        await audit_service.log_event(
            db=db,
            action="service_queue.created",
            resource_type="support_queue",
            resource_id=str(queue.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": queue.ref, "name": queue.name}
        )

        resp = SupportQueueResponse.model_validate(queue)
        resp.active_case_count = 0
        return resp

    @staticmethod
    async def claim_case(
        db: AsyncSession,
        case_id: uuid.UUID,
        user_id: uuid.UUID,
        user_name: str,
        tenant_id: uuid.UUID
    ) -> CaseResponse:
        stmt = select(Case).where(
            Case.id == case_id,
            Case.tenant_id == tenant_id,
            Case.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        c = res.scalar_one_or_none()
        if not c:
            raise NotFoundException("Case not found.")

        old_user = c.assigned_user_name
        c.assigned_user_id = user_id
        c.assigned_user_name = user_name
        if c.status == "New":
            c.status = "Assigned"

        await db.commit()
        await db.refresh(c)

        await audit_service.log_event(
            db=db,
            action="case.claimed",
            resource_type="case",
            resource_id=str(c.id),
            tenant_id=tenant_id,
            actor_id=user_id,
            actor_name=user_name,
            metadata={"ref": c.ref, "previous_assignee": old_user, "claimed_by": user_name}
        )

        return await CaseService.get_case(db, c.id, tenant_id)
