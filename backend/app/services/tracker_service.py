import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.service import WebsenseTracker, TrackerEvent
from app.schemas.service import (
    WebsenseTrackerCreate,
    WebsenseTrackerUpdate,
    WebsenseTrackerResponse,
    TrackerEventCreate,
    TrackerEventResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class TrackerService:
    """Service managing Websense digital footprints, pre-case URL monitoring, and intent triggers."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(WebsenseTracker).where(WebsenseTracker.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"TRK-{year}-{count + 1:05d}"

    @staticmethod
    async def list_trackers(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        is_active: Optional[bool] = None
    ) -> List[WebsenseTrackerResponse]:
        stmt = select(WebsenseTracker).where(
            WebsenseTracker.tenant_id == tenant_id,
            WebsenseTracker.deleted_at.is_(None)
        )
        if is_active is not None:
            stmt = stmt.where(WebsenseTracker.is_active == is_active)
        stmt = stmt.order_by(WebsenseTracker.name.asc())

        res = await db.execute(stmt)
        trackers = res.scalars().all()

        results: List[WebsenseTrackerResponse] = []
        for t in trackers:
            event_count_res = await db.execute(
                select(func.count()).select_from(TrackerEvent).where(
                    TrackerEvent.tenant_id == tenant_id,
                    TrackerEvent.tracker_id == t.id
                )
            )
            item = WebsenseTrackerResponse.model_validate(t)
            item.event_count = event_count_res.scalar() or 0
            results.append(item)

        return results

    @staticmethod
    async def create_tracker(
        db: AsyncSession,
        tracker_in: WebsenseTrackerCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> WebsenseTrackerResponse:
        ref = await TrackerService._generate_ref(db, tenant_id)
        tracker = WebsenseTracker(
            tenant_id=tenant_id,
            ref=ref,
            name=tracker_in.name,
            domain=tracker_in.domain,
            url_pattern=tracker_in.url_pattern,
            dwell_threshold_seconds=tracker_in.dwell_threshold_seconds,
            action=tracker_in.action,
            is_active=tracker_in.is_active,
            custom_fields=tracker_in.custom_fields
        )
        db.add(tracker)
        await db.commit()
        await db.refresh(tracker)

        await audit_service.log_event(
            db=db,
            action="websense_tracker.created",
            resource_type="websense_tracker",
            resource_id=str(tracker.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": tracker.ref, "domain": tracker.domain}
        )

        resp = WebsenseTrackerResponse.model_validate(tracker)
        resp.event_count = 0
        return resp

    @staticmethod
    async def log_event(
        db: AsyncSession,
        event_in: TrackerEventCreate,
        tenant_id: uuid.UUID
    ) -> TrackerEventResponse:
        # Check if dwell threshold exceeded to record action
        action_taken = event_in.action_taken
        if not action_taken and event_in.tracker_id:
            t_res = await db.execute(
                select(WebsenseTracker).where(WebsenseTracker.id == event_in.tracker_id)
            )
            trk = t_res.scalar_one_or_none()
            if trk and event_in.dwell_seconds >= trk.dwell_threshold_seconds:
                action_taken = trk.action

        event = TrackerEvent(
            tenant_id=tenant_id,
            tracker_id=event_in.tracker_id,
            session_id=event_in.session_id,
            visitor_ip=event_in.visitor_ip,
            page_url=event_in.page_url,
            dwell_seconds=event_in.dwell_seconds,
            action_taken=action_taken,
            contact_id=event_in.contact_id,
            case_id=event_in.case_id,
            custom_fields=event_in.custom_fields
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)

        tracker_name = None
        if event.tracker_id:
            tn_res = await db.execute(select(WebsenseTracker.name).where(WebsenseTracker.id == event.tracker_id))
            tracker_name = tn_res.scalar_one_or_none()

        resp = TrackerEventResponse.model_validate(event)
        resp.tracker_name = tracker_name
        return resp

    @staticmethod
    async def list_events(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        tracker_id: Optional[uuid.UUID] = None,
        case_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None,
        limit: int = 50
    ) -> List[TrackerEventResponse]:
        stmt = select(TrackerEvent).where(
            TrackerEvent.tenant_id == tenant_id,
            TrackerEvent.deleted_at.is_(None)
        )
        if tracker_id:
            stmt = stmt.where(TrackerEvent.tracker_id == tracker_id)
        if case_id:
            stmt = stmt.where(TrackerEvent.case_id == case_id)
        if session_id:
            stmt = stmt.where(TrackerEvent.session_id == session_id)

        stmt = stmt.order_by(desc(TrackerEvent.created_at)).limit(limit)
        res = await db.execute(stmt)
        events = res.scalars().all()

        results: List[TrackerEventResponse] = []
        for e in events:
            tracker_name = None
            if e.tracker_id:
                tn_res = await db.execute(select(WebsenseTracker.name).where(WebsenseTracker.id == e.tracker_id))
                tracker_name = tn_res.scalar_one_or_none()
            item = TrackerEventResponse.model_validate(e)
            item.tracker_name = tracker_name
            results.append(item)

        return results
