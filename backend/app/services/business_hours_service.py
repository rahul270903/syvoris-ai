import uuid
from datetime import datetime, timezone, timedelta, date, time
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.models.service import BusinessHours, BusinessHoliday
from app.schemas.service import (
    BusinessHoursCreate,
    BusinessHoursUpdate,
    BusinessHoursResponse,
    BusinessHolidayCreate,
    BusinessHolidayResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

DEFAULT_SCHEDULE = {
    "monday": {"active": True, "open": "09:00", "close": "17:00"},
    "tuesday": {"active": True, "open": "09:00", "close": "17:00"},
    "wednesday": {"active": True, "open": "09:00", "close": "17:00"},
    "thursday": {"active": True, "open": "09:00", "close": "17:00"},
    "friday": {"active": True, "open": "09:00", "close": "17:00"},
    "saturday": {"active": False, "open": "00:00", "close": "00:00"},
    "sunday": {"active": False, "open": "00:00", "close": "00:00"},
}

class BusinessHoursService:
    """Service managing business calendars, operating hours, holidays, and SLA deadline calculations."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(BusinessHours).where(BusinessHours.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"BHR-{year}-{count + 1:05d}"

    @staticmethod
    async def list_business_hours(
        db: AsyncSession,
        tenant_id: uuid.UUID
    ) -> List[BusinessHoursResponse]:
        stmt = (
            select(BusinessHours)
            .where(BusinessHours.tenant_id == tenant_id, BusinessHours.deleted_at.is_(None))
            .options(selectinload(BusinessHours.holidays))
            .order_by(BusinessHours.name.asc())
        )
        res = await db.execute(stmt)
        bhs = res.scalars().all()
        return [BusinessHoursResponse.model_validate(b) for b in bhs]

    @staticmethod
    async def get_default_business_hours(
        db: AsyncSession,
        tenant_id: uuid.UUID
    ) -> Optional[BusinessHours]:
        stmt = (
            select(BusinessHours)
            .where(
                BusinessHours.tenant_id == tenant_id,
                BusinessHours.is_default == True,
                BusinessHours.deleted_at.is_(None)
            )
            .options(selectinload(BusinessHours.holidays))
        )
        res = await db.execute(stmt)
        bh = res.scalar_one_or_none()
        if not bh:
            # Fall back to first available
            fallback = await db.execute(
                select(BusinessHours)
                .where(BusinessHours.tenant_id == tenant_id, BusinessHours.deleted_at.is_(None))
                .options(selectinload(BusinessHours.holidays))
            )
            bh = fallback.scalars().first()
        return bh

    @staticmethod
    async def create_business_hours(
        db: AsyncSession,
        bh_in: BusinessHoursCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> BusinessHoursResponse:
        ref = await BusinessHoursService._generate_ref(db, tenant_id)
        schedule = bh_in.schedule_config if bh_in.schedule_config else DEFAULT_SCHEDULE

        if bh_in.is_default:
            # Unset other defaults
            all_bhs = await db.execute(
                select(BusinessHours).where(BusinessHours.tenant_id == tenant_id, BusinessHours.is_default == True)
            )
            for existing in all_bhs.scalars().all():
                existing.is_default = False

        bh = BusinessHours(
            tenant_id=tenant_id,
            ref=ref,
            name=bh_in.name,
            timezone=bh_in.timezone,
            schedule_config=schedule,
            is_default=bh_in.is_default,
            custom_fields=bh_in.custom_fields
        )
        db.add(bh)
        await db.commit()
        await db.refresh(bh)

        await audit_service.log_event(
            db=db,
            action="business_hours.created",
            resource_type="business_hours",
            resource_id=str(bh.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": bh.ref, "name": bh.name}
        )

        resp = BusinessHoursResponse(
            id=bh.id,
            tenant_id=bh.tenant_id,
            ref=bh.ref,
            name=bh.name,
            timezone=bh.timezone,
            schedule_config=bh.schedule_config,
            is_default=bh.is_default,
            custom_fields=bh.custom_fields,
            holidays=[],
            created_at=bh.created_at,
            updated_at=bh.updated_at
        )
        return resp

    @staticmethod
    async def add_holiday(
        db: AsyncSession,
        business_hours_id: uuid.UUID,
        holiday_in: BusinessHolidayCreate,
        tenant_id: uuid.UUID
    ) -> BusinessHolidayResponse:
        stmt = select(BusinessHours).where(
            BusinessHours.id == business_hours_id,
            BusinessHours.tenant_id == tenant_id,
            BusinessHours.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        bh = res.scalar_one_or_none()
        if not bh:
            raise NotFoundException("Business hours configuration not found.")

        holiday = BusinessHoliday(
            tenant_id=tenant_id,
            business_hours_id=business_hours_id,
            name=holiday_in.name,
            holiday_date=holiday_in.holiday_date,
            custom_fields=holiday_in.custom_fields
        )
        db.add(holiday)
        await db.commit()
        await db.refresh(holiday)

        return BusinessHolidayResponse.model_validate(holiday)

    @staticmethod
    def calculate_deadline(
        start_time: datetime,
        hours: int,
        business_hours: Optional[BusinessHours] = None
    ) -> datetime:
        """Calculates SLA deadline taking business operating hours and holidays into account."""
        if not business_hours or not business_hours.schedule_config:
            return start_time + timedelta(hours=hours)

        schedule = business_hours.schedule_config
        holiday_dates = {h.holiday_date for h in business_hours.holidays} if business_hours.holidays else set()

        curr = start_time.astimezone(timezone.utc)
        remaining_minutes = hours * 60

        # Safety loop guard: max 30 calendar days
        iterations = 0
        while remaining_minutes > 0 and iterations < 720:
            iterations += 1
            day_name = curr.strftime("%A").lower()
            day_config = schedule.get(day_name, {})

            is_holiday = curr.date() in holiday_dates
            is_active = day_config.get("active", False) and not is_holiday

            if not is_active:
                # Advance to next day 09:00
                curr = (curr + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)
                continue

            open_str = day_config.get("open", "09:00")
            close_str = day_config.get("close", "17:00")
            open_h, open_m = map(int, open_str.split(":"))
            close_h, close_m = map(int, close_str.split(":"))

            day_open = curr.replace(hour=open_h, minute=open_m, second=0, microsecond=0)
            day_close = curr.replace(hour=close_h, minute=close_m, second=0, microsecond=0)

            if curr < day_open:
                curr = day_open

            if curr >= day_close:
                # Beyond today's closing, advance to tomorrow opening
                curr = (curr + timedelta(days=1)).replace(hour=open_h, minute=open_m, second=0, microsecond=0)
                continue

            # Minutes left in today's working shift
            available_minutes = int((day_close - curr).total_seconds() / 60)
            if remaining_minutes <= available_minutes:
                curr = curr + timedelta(minutes=remaining_minutes)
                remaining_minutes = 0
                break
            else:
                remaining_minutes -= available_minutes
                # Advance to next day open
                curr = (curr + timedelta(days=1)).replace(hour=open_h, minute=open_m, second=0, microsecond=0)

        return curr
