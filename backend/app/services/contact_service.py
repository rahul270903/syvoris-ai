import uuid
import math
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import select, func, desc, asc, or_, update
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crm import Contact, Account
from app.schemas.crm import ContactCreate, ContactUpdate, ContactResponse
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class ContactService:
    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(Contact).where(Contact.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"CON-{year}-{count + 1:05d}"

    @staticmethod
    async def list_contacts(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        q: Optional[str] = None,
        account_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[ContactResponse], int, int]:
        query = (
            select(Contact)
            .options(joinedload(Contact.account))
            .where(
                Contact.tenant_id == tenant_id,
                Contact.deleted_at.is_(None)
            )
        )

        if account_id:
            query = query.where(Contact.account_id == account_id)

        if status and status != "All" and status != "All statuses":
            query = query.where(Contact.status == status)

        if q:
            term = f"%{q.strip().lower()}%"
            query = query.where(
                or_(
                    func.lower(Contact.first_name).like(term),
                    func.lower(Contact.last_name).like(term),
                    func.lower(Contact.email).like(term),
                    func.lower(Contact.phone).like(term),
                    func.lower(Contact.job_title).like(term),
                    func.lower(Contact.department).like(term),
                    func.lower(Contact.ref).like(term),
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_res = await db.execute(count_query)
        total = total_res.scalar() or 0

        # Order and paginate
        query = query.order_by(desc(Contact.created_at))
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        res = await db.execute(query)
        contacts = res.scalars().all()

        items = [
            ContactResponse(
                id=c.id,
                tenant_id=c.tenant_id,
                account_id=c.account_id,
                account_name=c.account.name if c.account else None,
                ref=c.ref,
                first_name=c.first_name,
                last_name=c.last_name,
                full_name=c.full_name,
                email=c.email,
                phone=c.phone,
                job_title=c.job_title,
                department=c.department,
                status=c.status,
                is_primary=c.is_primary,
                is_decision_maker=c.is_decision_maker,
                owner_id=c.owner_id,
                owner_name=c.owner_name,
                description=c.description,
                custom_fields=c.custom_fields or {},
                created_at=c.created_at,
                updated_at=c.updated_at
            )
            for c in contacts
        ]

        pages = math.ceil(total / limit) if limit > 0 else 1
        return items, total, pages

    @staticmethod
    async def create_contact(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        req: ContactCreate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> ContactResponse:
        account_name = None
        if req.account_id:
            account = await db.get(Account, req.account_id)
            if not account or account.tenant_id != tenant_id or account.is_deleted:
                raise ValidationException("Specified account does not exist in this organization.")
            account_name = account.name

            # If marked primary, unset other primaries for this account
            if req.is_primary:
                await db.execute(
                    update(Contact)
                    .where(
                        Contact.tenant_id == tenant_id,
                        Contact.account_id == req.account_id,
                        Contact.is_primary == True
                    )
                    .values(is_primary=False)
                )

        ref = await ContactService._generate_ref(db, tenant_id)

        contact = Contact(
            tenant_id=tenant_id,
            account_id=req.account_id,
            ref=ref,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            email=req.email.strip().lower(),
            phone=req.phone.strip() if req.phone else None,
            job_title=req.job_title.strip() if req.job_title else None,
            department=req.department.strip() if req.department else None,
            status=req.status,
            is_primary=req.is_primary,
            is_decision_maker=req.is_decision_maker,
            owner_id=actor_id,
            owner_name=actor_name,
            description=req.description,
            custom_fields=req.custom_fields or {},
            created_by=actor_id,
            updated_by=actor_id
        )

        db.add(contact)
        await db.commit()
        await db.refresh(contact)

        await audit_service.log_event(
            db, action="contact.created", resource_type="contact",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(contact.id),
            metadata={"name": contact.full_name, "email": contact.email, "ref": contact.ref}
        )

        return ContactResponse(
            id=contact.id,
            tenant_id=contact.tenant_id,
            account_id=contact.account_id,
            account_name=account_name,
            ref=contact.ref,
            first_name=contact.first_name,
            last_name=contact.last_name,
            full_name=contact.full_name,
            email=contact.email,
            phone=contact.phone,
            job_title=contact.job_title,
            department=contact.department,
            status=contact.status,
            is_primary=contact.is_primary,
            is_decision_maker=contact.is_decision_maker,
            owner_id=contact.owner_id,
            owner_name=contact.owner_name,
            description=contact.description,
            custom_fields=contact.custom_fields or {},
            created_at=contact.created_at,
            updated_at=contact.updated_at
        )

    @staticmethod
    async def get_contact(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        contact_id: uuid.UUID
    ) -> ContactResponse:
        res = await db.execute(
            select(Contact)
            .options(joinedload(Contact.account))
            .where(
                Contact.id == contact_id,
                Contact.tenant_id == tenant_id,
                Contact.deleted_at.is_(None)
            )
        )
        contact = res.scalar_one_or_none()
        if not contact:
            raise NotFoundException("Contact not found.")

        return ContactResponse(
            id=contact.id,
            tenant_id=contact.tenant_id,
            account_id=contact.account_id,
            account_name=contact.account.name if contact.account else None,
            ref=contact.ref,
            first_name=contact.first_name,
            last_name=contact.last_name,
            full_name=contact.full_name,
            email=contact.email,
            phone=contact.phone,
            job_title=contact.job_title,
            department=contact.department,
            status=contact.status,
            is_primary=contact.is_primary,
            is_decision_maker=contact.is_decision_maker,
            owner_id=contact.owner_id,
            owner_name=contact.owner_name,
            description=contact.description,
            custom_fields=contact.custom_fields or {},
            created_at=contact.created_at,
            updated_at=contact.updated_at
        )

    @staticmethod
    async def update_contact(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        contact_id: uuid.UUID,
        req: ContactUpdate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> ContactResponse:
        res = await db.execute(
            select(Contact)
            .options(joinedload(Contact.account))
            .where(
                Contact.id == contact_id,
                Contact.tenant_id == tenant_id,
                Contact.deleted_at.is_(None)
            )
        )
        contact = res.scalar_one_or_none()
        if not contact:
            raise NotFoundException("Contact not found.")

        patch_data = req.model_dump(exclude_unset=True)

        # If changing account_id or setting is_primary=True, validate
        if "account_id" in patch_data and patch_data["account_id"]:
            acc = await db.get(Account, patch_data["account_id"])
            if not acc or acc.tenant_id != tenant_id or acc.is_deleted:
                raise ValidationException("Specified account does not exist in this organization.")

        effective_account_id = patch_data.get("account_id", contact.account_id)
        if patch_data.get("is_primary") is True and effective_account_id:
            await db.execute(
                update(Contact)
                .where(
                    Contact.tenant_id == tenant_id,
                    Contact.account_id == effective_account_id,
                    Contact.id != contact.id,
                    Contact.is_primary == True
                )
                .values(is_primary=False)
            )

        for k, v in patch_data.items():
            if k in ["first_name", "last_name", "job_title", "department"] and v is not None:
                setattr(contact, k, v.strip())
            elif k == "email" and v is not None:
                contact.email = v.strip().lower()
            elif hasattr(contact, k):
                setattr(contact, k, v)

        contact.updated_at = datetime.now(timezone.utc)
        contact.updated_by = actor_id

        await db.commit()
        await db.refresh(contact)

        await audit_service.log_event(
            db, action="contact.updated", resource_type="contact",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(contact.id), metadata={"name": contact.full_name, "updated_fields": list(patch_data.keys())}
        )

        return ContactResponse(
            id=contact.id,
            tenant_id=contact.tenant_id,
            account_id=contact.account_id,
            account_name=contact.account.name if contact.account else None,
            ref=contact.ref,
            first_name=contact.first_name,
            last_name=contact.last_name,
            full_name=contact.full_name,
            email=contact.email,
            phone=contact.phone,
            job_title=contact.job_title,
            department=contact.department,
            status=contact.status,
            is_primary=contact.is_primary,
            is_decision_maker=contact.is_decision_maker,
            owner_id=contact.owner_id,
            owner_name=contact.owner_name,
            description=contact.description,
            custom_fields=contact.custom_fields or {},
            created_at=contact.created_at,
            updated_at=contact.updated_at
        )

    @staticmethod
    async def archive_contact(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        contact_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> bool:
        res = await db.execute(
            select(Contact).where(
                Contact.id == contact_id,
                Contact.tenant_id == tenant_id,
                Contact.deleted_at.is_(None)
            )
        )
        contact = res.scalar_one_or_none()
        if not contact:
            raise NotFoundException("Contact not found.")

        contact.status = "Archived"
        contact.deleted_at = datetime.now(timezone.utc)
        contact.updated_by = actor_id

        await db.commit()

        await audit_service.log_event(
            db, action="contact.archived", resource_type="contact",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(contact.id), metadata={"name": contact.full_name, "ref": contact.ref}
        )
        return True
