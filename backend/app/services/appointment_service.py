import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, or_
from app.models.service import AppointmentType, CustomerAppointment
from app.models.crm import Contact, Account
from app.schemas.service import (
    AppointmentTypeCreate,
    AppointmentTypeUpdate,
    AppointmentTypeResponse,
    CustomerAppointmentCreate,
    CustomerAppointmentUpdate,
    CustomerAppointmentResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class AppointmentService:
    """Service managing customer appointment types, slot scheduling, and double-booking prevention."""

    @staticmethod
    async def _generate_type_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(AppointmentType).where(AppointmentType.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"ATY-{year}-{count + 1:05d}"

    @staticmethod
    async def _generate_booking_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(CustomerAppointment).where(CustomerAppointment.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"APT-{year}-{count + 1:05d}"

    @staticmethod
    async def list_types(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        is_active: Optional[bool] = None
    ) -> List[AppointmentTypeResponse]:
        stmt = select(AppointmentType).where(
            AppointmentType.tenant_id == tenant_id,
            AppointmentType.deleted_at.is_(None)
        )
        if is_active is not None:
            stmt = stmt.where(AppointmentType.is_active == is_active)
        stmt = stmt.order_by(AppointmentType.name.asc())

        res = await db.execute(stmt)
        types = res.scalars().all()
        return [AppointmentTypeResponse.model_validate(t) for t in types]

    @staticmethod
    async def create_type(
        db: AsyncSession,
        type_in: AppointmentTypeCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> AppointmentTypeResponse:
        # Check duplicate slug
        stmt = select(AppointmentType).where(
            AppointmentType.tenant_id == tenant_id,
            AppointmentType.slug == type_in.slug,
            AppointmentType.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise ValidationException(f"Appointment type with slug '{type_in.slug}' already exists.")

        ref = await AppointmentService._generate_type_ref(db, tenant_id)
        atype = AppointmentType(
            tenant_id=tenant_id,
            ref=ref,
            name=type_in.name,
            slug=type_in.slug,
            description=type_in.description,
            duration_minutes=type_in.duration_minutes,
            buffer_minutes=type_in.buffer_minutes,
            assigned_user_id=type_in.assigned_user_id,
            assigned_user_name=type_in.assigned_user_name,
            is_active=type_in.is_active,
            custom_fields=type_in.custom_fields
        )
        db.add(atype)
        await db.commit()
        await db.refresh(atype)

        await audit_service.log_event(
            db=db,
            action="appointment_type.created",
            resource_type="appointment_type",
            resource_id=str(atype.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": atype.ref, "name": atype.name}
        )

        return AppointmentTypeResponse.model_validate(atype)

    @staticmethod
    async def list_appointments(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        type_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[CustomerAppointmentResponse]:
        stmt = select(CustomerAppointment).where(
            CustomerAppointment.tenant_id == tenant_id,
            CustomerAppointment.deleted_at.is_(None)
        )
        if type_id:
            stmt = stmt.where(CustomerAppointment.appointment_type_id == type_id)
        if status:
            stmt = stmt.where(CustomerAppointment.status == status)

        stmt = stmt.order_by(desc(CustomerAppointment.start_time)).limit(limit)
        res = await db.execute(stmt)
        appts = res.scalars().all()

        results: List[CustomerAppointmentResponse] = []
        for a in appts:
            type_name = None
            if a.appointment_type_id:
                t_res = await db.execute(select(AppointmentType.name).where(AppointmentType.id == a.appointment_type_id))
                type_name = t_res.scalar_one_or_none()

            acc_name = None
            if a.account_id:
                acc_res = await db.execute(select(Account.name).where(Account.id == a.account_id))
                acc_name = acc_res.scalar_one_or_none()

            item = CustomerAppointmentResponse.model_validate(a)
            item.appointment_type_name = type_name
            item.account_name = acc_name
            results.append(item)

        return results

    @staticmethod
    async def book_appointment(
        db: AsyncSession,
        appt_in: CustomerAppointmentCreate,
        tenant_id: uuid.UUID
    ) -> CustomerAppointmentResponse:
        # Validate appointment type
        type_stmt = select(AppointmentType).where(
            AppointmentType.id == appt_in.appointment_type_id,
            AppointmentType.tenant_id == tenant_id,
            AppointmentType.is_active == True,
            AppointmentType.deleted_at.is_(None)
        )
        type_res = await db.execute(type_stmt)
        atype = type_res.scalar_one_or_none()
        if not atype:
            raise NotFoundException("Active appointment type not found.")

        # Ensure start_time < end_time
        if appt_in.start_time >= appt_in.end_time:
            raise ValidationException("Appointment start time must be before end time.")

        # Transactional double-booking prevention check
        overlap_stmt = select(CustomerAppointment).where(
            CustomerAppointment.tenant_id == tenant_id,
            CustomerAppointment.appointment_type_id == atype.id,
            CustomerAppointment.status.in_(["Scheduled", "Confirmed"]),
            CustomerAppointment.deleted_at.is_(None),
            and_(
                CustomerAppointment.start_time < appt_in.end_time,
                CustomerAppointment.end_time > appt_in.start_time
            )
        )
        overlap_res = await db.execute(overlap_stmt)
        if overlap_res.scalar_one_or_none():
            raise ValidationException("The selected time slot is already booked. Please choose another time.")

        ref = await AppointmentService._generate_booking_ref(db, tenant_id)

        # Link contact if exists
        contact_id = appt_in.contact_id
        account_id = appt_in.account_id
        if not contact_id and appt_in.customer_email:
            c_res = await db.execute(
                select(Contact).where(
                    Contact.tenant_id == tenant_id,
                    Contact.email == appt_in.customer_email,
                    Contact.deleted_at.is_(None)
                )
            )
            contact = c_res.scalar_one_or_none()
            if contact:
                contact_id = contact.id
                if not account_id:
                    account_id = contact.account_id

        appt = CustomerAppointment(
            tenant_id=tenant_id,
            ref=ref,
            appointment_type_id=atype.id,
            contact_id=contact_id,
            account_id=account_id,
            assigned_user_id=appt_in.assigned_user_id or atype.assigned_user_id,
            assigned_user_name=appt_in.assigned_user_name or atype.assigned_user_name,
            start_time=appt_in.start_time,
            end_time=appt_in.end_time,
            status="Scheduled",
            customer_name=appt_in.customer_name,
            customer_email=appt_in.customer_email,
            notes=appt_in.notes,
            custom_fields=appt_in.custom_fields
        )
        db.add(appt)
        await db.commit()
        await db.refresh(appt)

        await audit_service.log_event(
            db=db,
            action="customer_appointment.booked",
            resource_type="customer_appointment",
            resource_id=str(appt.id),
            tenant_id=tenant_id,
            actor_name=appt.customer_name,
            metadata={"ref": appt.ref, "type": atype.name, "start": appt.start_time.isoformat()}
        )

        resp = CustomerAppointmentResponse.model_validate(appt)
        resp.appointment_type_name = atype.name
        return resp
