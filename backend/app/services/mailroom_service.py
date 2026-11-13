import uuid
import re
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.service import SupportMailbox, MailroomMessage, Case, CaseComment
from app.models.crm import Contact, Account
from app.schemas.service import (
    SupportMailboxCreate,
    SupportMailboxUpdate,
    SupportMailboxResponse,
    MailroomMessageResponse,
    InboundEmailSimulation,
    CaseCreate
)
from app.services.case_service import CaseService
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

CASE_REF_REGEX = re.compile(r"\[(CASE-\d{4}-\d{5})\]", re.IGNORECASE)

class MailroomService:
    """Service managing email-to-case ingestion scanner, thread token matching, and mailbox routing."""

    @staticmethod
    async def _generate_mailbox_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(SupportMailbox).where(SupportMailbox.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"MLR-{year}-{count + 1:05d}"

    @staticmethod
    async def list_mailboxes(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        is_active: Optional[bool] = None
    ) -> List[SupportMailboxResponse]:
        stmt = select(SupportMailbox).where(
            SupportMailbox.tenant_id == tenant_id,
            SupportMailbox.deleted_at.is_(None)
        )
        if is_active is not None:
            stmt = stmt.where(SupportMailbox.is_active == is_active)
        stmt = stmt.order_by(SupportMailbox.name.asc())

        res = await db.execute(stmt)
        mailboxes = res.scalars().all()

        results: List[SupportMailboxResponse] = []
        for mb in mailboxes:
            msg_count_res = await db.execute(
                select(func.count()).select_from(MailroomMessage).where(
                    MailroomMessage.tenant_id == tenant_id,
                    MailroomMessage.mailbox_id == mb.id
                )
            )
            item = SupportMailboxResponse.model_validate(mb)
            item.message_count = msg_count_res.scalar() or 0
            results.append(item)

        return results

    @staticmethod
    async def create_mailbox(
        db: AsyncSession,
        mailbox_in: SupportMailboxCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> SupportMailboxResponse:
        # Check duplicate email
        stmt = select(SupportMailbox).where(
            SupportMailbox.tenant_id == tenant_id,
            SupportMailbox.email == mailbox_in.email,
            SupportMailbox.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise ValidationException(f"Support mailbox with email '{mailbox_in.email}' already exists.")

        ref = await MailroomService._generate_mailbox_ref(db, tenant_id)
        mailbox = SupportMailbox(
            tenant_id=tenant_id,
            ref=ref,
            name=mailbox_in.name,
            email=mailbox_in.email,
            routing_rule=mailbox_in.routing_rule,
            default_priority=mailbox_in.default_priority,
            default_category=mailbox_in.default_category,
            default_queue_id=mailbox_in.default_queue_id,
            is_active=mailbox_in.is_active,
            custom_fields=mailbox_in.custom_fields
        )
        db.add(mailbox)
        await db.commit()
        await db.refresh(mailbox)

        await audit_service.log_event(
            db=db,
            action="support_mailbox.created",
            resource_type="support_mailbox",
            resource_id=str(mailbox.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": mailbox.ref, "email": mailbox.email}
        )

        resp = SupportMailboxResponse.model_validate(mailbox)
        resp.message_count = 0
        return resp

    @staticmethod
    async def list_messages(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        mailbox_id: Optional[uuid.UUID] = None,
        limit: int = 50
    ) -> List[MailroomMessageResponse]:
        stmt = select(MailroomMessage).where(
            MailroomMessage.tenant_id == tenant_id,
            MailroomMessage.deleted_at.is_(None)
        )
        if mailbox_id:
            stmt = stmt.where(MailroomMessage.mailbox_id == mailbox_id)
        stmt = stmt.order_by(desc(MailroomMessage.created_at)).limit(limit)

        res = await db.execute(stmt)
        msgs = res.scalars().all()

        results: List[MailroomMessageResponse] = []
        for m in msgs:
            case_ref = None
            if m.case_id:
                c_res = await db.execute(select(Case.ref).where(Case.id == m.case_id))
                case_ref = c_res.scalar_one_or_none()

            item = MailroomMessageResponse.model_validate(m)
            item.case_ref = case_ref
            results.append(item)

        return results

    @staticmethod
    async def process_inbound_email(
        db: AsyncSession,
        payload: InboundEmailSimulation,
        tenant_id: uuid.UUID
    ) -> MailroomMessageResponse:
        message_id = payload.message_id or f"msg-{uuid.uuid4().hex[:12]}@inbound.syvoris.ai"

        # Deduplication check
        dup_stmt = select(MailroomMessage).where(
            MailroomMessage.tenant_id == tenant_id,
            MailroomMessage.message_id == message_id
        )
        dup_res = await db.execute(dup_stmt)
        existing = dup_res.scalar_one_or_none()
        if existing:
            resp = MailroomMessageResponse.model_validate(existing)
            return resp

        # Find matching mailbox
        mb_stmt = select(SupportMailbox).where(
            SupportMailbox.tenant_id == tenant_id,
            SupportMailbox.email == payload.mailbox_email,
            SupportMailbox.deleted_at.is_(None)
        )
        mb_res = await db.execute(mb_stmt)
        mailbox = mb_res.scalar_one_or_none()

        # Thread token extraction from Subject or Body
        match = CASE_REF_REGEX.search(payload.subject) or CASE_REF_REGEX.search(payload.body_text)
        linked_case: Optional[Case] = None
        thread_token: Optional[str] = None

        if match:
            found_ref = match.group(1).upper()
            thread_token = f"[{found_ref}]"
            case_stmt = select(Case).where(
                Case.tenant_id == tenant_id,
                Case.ref == found_ref,
                Case.deleted_at.is_(None)
            )
            case_res = await db.execute(case_stmt)
            linked_case = case_res.scalar_one_or_none()

        # Find or link Contact by email
        contact_stmt = select(Contact).where(
            Contact.tenant_id == tenant_id,
            Contact.email == payload.sender_email,
            Contact.deleted_at.is_(None)
        )
        contact_res = await db.execute(contact_stmt)
        contact = contact_res.scalar_one_or_none()

        account_id = contact.account_id if contact else None

        if linked_case:
            # Append reply to existing case
            comment = CaseComment(
                tenant_id=tenant_id,
                case_id=linked_case.id,
                author_name=payload.sender_name or payload.sender_email,
                is_internal=False,
                channel="Email",
                message=payload.body_text,
                custom_fields={"message_id": message_id}
            )
            db.add(comment)

            # Re-open if closed or waiting
            if linked_case.status in ("Awaiting Customer", "Resolved"):
                linked_case.status = "In Progress"

            case_id = linked_case.id
            status = "Linked"
        else:
            # Create a brand new case from email
            case_in = CaseCreate(
                subject=payload.subject,
                description=payload.body_text,
                account_id=account_id,
                contact_id=contact.id if contact else None,
                priority=mailbox.default_priority if mailbox else "Normal",
                category=mailbox.default_category if mailbox else "Technical Support",
                channel="Email",
                assigned_queue="Tier-1 Support",
                custom_fields={"inbound_email": payload.sender_email, "message_id": message_id}
            )
            new_case = await CaseService.create_case(
                db=db,
                case_in=case_in,
                tenant_id=tenant_id,
                actor_name=payload.sender_name or payload.sender_email
            )
            case_id = new_case.id
            status = "Processed"

        msg = MailroomMessage(
            tenant_id=tenant_id,
            mailbox_id=mailbox.id if mailbox else None,
            case_id=case_id,
            message_id=message_id,
            sender_email=payload.sender_email,
            sender_name=payload.sender_name,
            subject=payload.subject,
            body_text=payload.body_text,
            thread_token=thread_token,
            status=status,
            custom_fields={}
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)

        # Get case ref for response
        c_res = await db.execute(select(Case.ref).where(Case.id == case_id))
        case_ref = c_res.scalar_one_or_none()

        resp = MailroomMessageResponse.model_validate(msg)
        resp.case_ref = case_ref
        return resp
