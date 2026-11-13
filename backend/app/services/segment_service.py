import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_

from app.models.marketing import AudienceSegment
from app.models.crm import Contact, Lead, Account
from app.schemas.marketing import (
    AudienceSegmentCreate,
    AudienceSegmentUpdate,
    AudienceSegmentResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class SegmentService:
    """Service managing audience segments, dynamic rule evaluation, and member calculation."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(AudienceSegment).where(AudienceSegment.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"SEG-{year}-{count + 1:05d}"

    @staticmethod
    async def list_segments(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        q: Optional[str] = None,
        segment_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[AudienceSegmentResponse], int, int]:
        stmt = select(AudienceSegment).where(
            AudienceSegment.tenant_id == tenant_id,
            AudienceSegment.deleted_at.is_(None)
        )

        if q:
            term = f"%{q}%"
            stmt = stmt.where(or_(AudienceSegment.name.ilike(term), AudienceSegment.ref.ilike(term)))
        if segment_type:
            stmt = stmt.where(AudienceSegment.segment_type == segment_type)
        if is_active is not None:
            stmt = stmt.where(AudienceSegment.is_active == is_active)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(AudienceSegment.created_at.desc()).offset((page - 1) * limit).limit(limit)
        res = await db.execute(stmt)
        segments = res.scalars().all()
        pages = (total + limit - 1) // limit if total > 0 else 1

        return [AudienceSegmentResponse.model_validate(s) for s in segments], total, pages

    @staticmethod
    async def get_segment(db: AsyncSession, segment_id: uuid.UUID, tenant_id: uuid.UUID) -> AudienceSegmentResponse:
        stmt = select(AudienceSegment).where(
            AudienceSegment.id == segment_id,
            AudienceSegment.tenant_id == tenant_id,
            AudienceSegment.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        segment = res.scalar_one_or_none()
        if not segment:
            raise NotFoundException("Audience segment not found.")
        return AudienceSegmentResponse.model_validate(segment)

    @staticmethod
    async def create_segment(
        db: AsyncSession,
        segment_in: AudienceSegmentCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> AudienceSegmentResponse:
        ref = await SegmentService._generate_ref(db, tenant_id)
        segment = AudienceSegment(
            tenant_id=tenant_id,
            ref=ref,
            name=segment_in.name,
            description=segment_in.description,
            segment_type=segment_in.segment_type,
            target_entity=segment_in.target_entity,
            filter_criteria=segment_in.filter_criteria,
            is_active=segment_in.is_active,
            owner_id=segment_in.owner_id or actor_id,
            owner_name=segment_in.owner_name or actor_name,
            custom_fields=segment_in.custom_fields,
            member_count=0
        )
        db.add(segment)
        await db.commit()
        await db.refresh(segment)

        # Evaluate initial count
        await SegmentService.evaluate_segment(db, segment.id, tenant_id)
        await db.refresh(segment)

        await audit_service.log_event(
            db=db,
            action="segment.created",
            resource_type="segment",
            resource_id=str(segment.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": ref, "name": segment.name, "target_entity": segment.target_entity}
        )

        return AudienceSegmentResponse.model_validate(segment)

    @staticmethod
    async def update_segment(
        db: AsyncSession,
        segment_id: uuid.UUID,
        segment_in: AudienceSegmentUpdate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> AudienceSegmentResponse:
        stmt = select(AudienceSegment).where(
            AudienceSegment.id == segment_id,
            AudienceSegment.tenant_id == tenant_id,
            AudienceSegment.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        segment = res.scalar_one_or_none()
        if not segment:
            raise NotFoundException("Audience segment not found.")

        update_dict = segment_in.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(segment, key, val)

        await db.commit()
        await db.refresh(segment)

        # Re-evaluate count if criteria changed
        if "filter_criteria" in update_dict or "target_entity" in update_dict:
            await SegmentService.evaluate_segment(db, segment.id, tenant_id)
            await db.refresh(segment)

        await audit_service.log_event(
            db=db,
            action="segment.updated",
            resource_type="segment",
            resource_id=str(segment.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": segment.ref, "updated_fields": list(update_dict.keys())}
        )

        return AudienceSegmentResponse.model_validate(segment)

    @staticmethod
    async def delete_segment(
        db: AsyncSession,
        segment_id: uuid.UUID,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> None:
        stmt = select(AudienceSegment).where(
            AudienceSegment.id == segment_id,
            AudienceSegment.tenant_id == tenant_id,
            AudienceSegment.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        segment = res.scalar_one_or_none()
        if not segment:
            raise NotFoundException("Audience segment not found.")

        segment.deleted_at = datetime.now(timezone.utc)
        await db.commit()

        await audit_service.log_event(
            db=db,
            action="segment.deleted",
            resource_type="segment",
            resource_id=str(segment.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": segment.ref}
        )

    @staticmethod
    async def evaluate_segment(
        db: AsyncSession,
        segment_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> Dict[str, Any]:
        """Dynamically evaluate segment matching records and update member_count."""
        stmt = select(AudienceSegment).where(
            AudienceSegment.id == segment_id,
            AudienceSegment.tenant_id == tenant_id,
            AudienceSegment.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        segment = res.scalar_one_or_none()
        if not segment:
            raise NotFoundException("Audience segment not found.")

        criteria = segment.filter_criteria or {}
        members_preview: List[Dict[str, Any]] = []

        if segment.target_entity == "leads":
            l_stmt = select(Lead).where(Lead.tenant_id == tenant_id, Lead.deleted_at.is_(None))
            if "status" in criteria:
                l_stmt = l_stmt.where(Lead.status == criteria["status"])
            if "min_score" in criteria:
                l_stmt = l_stmt.where(Lead.score >= int(criteria["min_score"]))
            if "source" in criteria:
                l_stmt = l_stmt.where(Lead.source == criteria["source"])

            l_res = await db.execute(l_stmt.limit(100))
            leads = l_res.scalars().all()
            segment.member_count = len(leads)
            members_preview = [
                {"id": str(l.id), "ref": l.ref, "name": f"{l.first_name} {l.last_name}", "email": l.email, "company": l.company_name}
                for l in leads[:20]
            ]
        else: # contacts
            c_stmt = select(Contact).where(Contact.tenant_id == tenant_id, Contact.deleted_at.is_(None))
            if "job_title" in criteria:
                c_stmt = c_stmt.where(Contact.job_title.ilike(f"%{criteria['job_title']}%"))
            if "department" in criteria:
                c_stmt = c_stmt.where(Contact.department == criteria["department"])

            c_res = await db.execute(c_stmt.limit(100))
            contacts = c_res.scalars().all()
            segment.member_count = len(contacts)
            members_preview = [
                {"id": str(c.id), "ref": c.ref, "name": f"{c.first_name} {c.last_name}", "email": c.email}
                for c in contacts[:20]
            ]

        await db.commit()
        return {
            "segment_id": segment.id,
            "member_count": segment.member_count,
            "members_preview": members_preview
        }
