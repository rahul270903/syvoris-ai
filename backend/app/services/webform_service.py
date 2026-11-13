import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.service import SupportWebform, WebformSubmission, Case
from app.models.crm import Contact
from app.schemas.service import (
    SupportWebformCreate,
    SupportWebformUpdate,
    SupportWebformResponse,
    WebformSubmissionCreate,
    WebformSubmissionResponse,
    CaseCreate
)
from app.services.case_service import CaseService
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

DEFAULT_WEBFORM_FIELDS = [
    {"name": "full_name", "label": "Full Name", "type": "text", "required": True},
    {"name": "email", "label": "Business Email", "type": "email", "required": True},
    {"name": "subject", "label": "Issue Subject", "type": "text", "required": True},
    {"name": "category", "label": "Category", "type": "select", "options": ["Technical Support", "Billing", "Account Access"], "required": True},
    {"name": "description", "label": "Description of Issue", "type": "textarea", "required": True},
]

class WebformService:
    """Service managing support intake webforms, spam/honeypot filtering, and automated case creation."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(SupportWebform).where(SupportWebform.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"WBF-{year}-{count + 1:05d}"

    @staticmethod
    async def list_webforms(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        is_active: Optional[bool] = None
    ) -> List[SupportWebformResponse]:
        stmt = select(SupportWebform).where(
            SupportWebform.tenant_id == tenant_id,
            SupportWebform.deleted_at.is_(None)
        )
        if is_active is not None:
            stmt = stmt.where(SupportWebform.is_active == is_active)
        stmt = stmt.order_by(SupportWebform.name.asc())

        res = await db.execute(stmt)
        forms = res.scalars().all()

        results: List[SupportWebformResponse] = []
        for f in forms:
            sub_count_res = await db.execute(
                select(func.count()).select_from(WebformSubmission).where(
                    WebformSubmission.tenant_id == tenant_id,
                    WebformSubmission.webform_id == f.id
                )
            )
            item = SupportWebformResponse.model_validate(f)
            item.submission_count = sub_count_res.scalar() or 0
            results.append(item)

        return results

    @staticmethod
    async def get_webform_by_slug(
        db: AsyncSession,
        slug: str,
        tenant_id: Optional[uuid.UUID] = None
    ) -> SupportWebformResponse:
        stmt = select(SupportWebform).where(
            SupportWebform.slug == slug,
            SupportWebform.is_active == True,
            SupportWebform.deleted_at.is_(None)
        )
        if tenant_id:
            stmt = stmt.where(SupportWebform.tenant_id == tenant_id)

        res = await db.execute(stmt)
        f = res.scalar_one_or_none()
        if not f:
            raise NotFoundException(f"Webform with slug '{slug}' not found.")

        sub_count_res = await db.execute(
            select(func.count()).select_from(WebformSubmission).where(WebformSubmission.webform_id == f.id)
        )
        item = SupportWebformResponse.model_validate(f)
        item.submission_count = sub_count_res.scalar() or 0
        return item

    @staticmethod
    async def create_webform(
        db: AsyncSession,
        webform_in: SupportWebformCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> SupportWebformResponse:
        # Check duplicate slug
        dup_stmt = select(SupportWebform).where(
            SupportWebform.tenant_id == tenant_id,
            SupportWebform.slug == webform_in.slug,
            SupportWebform.deleted_at.is_(None)
        )
        dup_res = await db.execute(dup_stmt)
        if dup_res.scalar_one_or_none():
            raise ValidationException(f"Webform with slug '{webform_in.slug}' already exists.")

        ref = await WebformService._generate_ref(db, tenant_id)
        fields = webform_in.fields_config if webform_in.fields_config else DEFAULT_WEBFORM_FIELDS

        webform = SupportWebform(
            tenant_id=tenant_id,
            ref=ref,
            name=webform_in.name,
            slug=webform_in.slug,
            title=webform_in.title,
            description=webform_in.description,
            fields_config=fields,
            category=webform_in.category,
            priority=webform_in.priority,
            target_queue_id=webform_in.target_queue_id,
            is_active=webform_in.is_active,
            custom_fields=webform_in.custom_fields
        )
        db.add(webform)
        await db.commit()
        await db.refresh(webform)

        await audit_service.log_event(
            db=db,
            action="support_webform.created",
            resource_type="support_webform",
            resource_id=str(webform.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": webform.ref, "slug": webform.slug}
        )

        resp = SupportWebformResponse.model_validate(webform)
        resp.submission_count = 0
        return resp

    @staticmethod
    async def submit_webform(
        db: AsyncSession,
        slug: str,
        submission_in: WebformSubmissionCreate,
        ip_address: Optional[str] = None
    ) -> WebformSubmissionResponse:
        # Find active webform
        stmt = select(SupportWebform).where(
            SupportWebform.slug == slug,
            SupportWebform.is_active == True,
            SupportWebform.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        form = res.scalar_one_or_none()
        if not form:
            raise NotFoundException("Webform not found or inactive.")

        tenant_id = form.tenant_id
        data = submission_in.submission_data

        # Honeypot spam defense
        is_spam = bool(submission_in.honeypot_field and submission_in.honeypot_field.strip())
        status = "Flagged_Spam" if is_spam else "Accepted"
        created_case_id: Optional[uuid.UUID] = None

        if not is_spam:
            subject = str(data.get("subject") or f"Inquiry via {form.title}")
            description = str(data.get("description") or "Customer submission received through support webform.")
            sender_email = str(data.get("email") or "")
            sender_name = str(data.get("full_name") or data.get("name") or "Webform Visitor")

            # Link or find contact
            contact_id = None
            account_id = None
            if sender_email:
                c_stmt = select(Contact).where(
                    Contact.tenant_id == tenant_id,
                    Contact.email == sender_email,
                    Contact.deleted_at.is_(None)
                )
                c_res = await db.execute(c_stmt)
                contact = c_res.scalar_one_or_none()
                if contact:
                    contact_id = contact.id
                    account_id = contact.account_id

            case_in = CaseCreate(
                subject=subject,
                description=description,
                account_id=account_id,
                contact_id=contact_id,
                priority=form.priority,
                category=form.category,
                channel="Webform",
                assigned_queue="Tier-1 Support",
                custom_fields={"webform_ref": form.ref, "webform_slug": form.slug, "submission_data": data}
            )
            new_case = await CaseService.create_case(
                db=db,
                case_in=case_in,
                tenant_id=tenant_id,
                actor_name=sender_name
            )
            created_case_id = new_case.id

        sub = WebformSubmission(
            tenant_id=tenant_id,
            webform_id=form.id,
            case_id=created_case_id,
            submission_data=data,
            honeypot_triggered=is_spam,
            ip_address=ip_address,
            status=status,
            custom_fields={}
        )
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

        case_ref = None
        if created_case_id:
            c_res = await db.execute(select(Case.ref).where(Case.id == created_case_id))
            case_ref = c_res.scalar_one_or_none()

        resp = WebformSubmissionResponse(
            id=sub.id,
            tenant_id=sub.tenant_id,
            webform_id=sub.webform_id,
            case_id=sub.case_id,
            case_ref=case_ref,
            submission_data=sub.submission_data,
            honeypot_triggered=sub.honeypot_triggered,
            status=sub.status,
            created_at=sub.created_at
        )
        return resp

    @staticmethod
    async def list_submissions(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        webform_id: Optional[uuid.UUID] = None,
        limit: int = 50
    ) -> List[WebformSubmissionResponse]:
        stmt = select(WebformSubmission).where(
            WebformSubmission.tenant_id == tenant_id,
            WebformSubmission.deleted_at.is_(None)
        )
        if webform_id:
            stmt = stmt.where(WebformSubmission.webform_id == webform_id)
        stmt = stmt.order_by(desc(WebformSubmission.created_at)).limit(limit)

        res = await db.execute(stmt)
        subs = res.scalars().all()

        results: List[WebformSubmissionResponse] = []
        for s in subs:
            case_ref = None
            if s.case_id:
                c_res = await db.execute(select(Case.ref).where(Case.id == s.case_id))
                case_ref = c_res.scalar_one_or_none()

            results.append(
                WebformSubmissionResponse(
                    id=s.id,
                    tenant_id=s.tenant_id,
                    webform_id=s.webform_id,
                    case_id=s.case_id,
                    case_ref=case_ref,
                    submission_data=s.submission_data,
                    honeypot_triggered=s.honeypot_triggered,
                    status=s.status,
                    created_at=s.created_at
                )
            )
        return results
