import uuid
import math
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from decimal import Decimal
from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crm import Lead, Account, Contact, Opportunity, CRMActivity
from app.models.user import User
from app.schemas.crm import (
    LeadCreate, LeadUpdate, LeadResponse,
    OpportunityCreate, OpportunityResponse,
    AccountCreate, AccountResponse,
    ContactCreate, ContactResponse,
    LeadConvertRequest, LeadConvertResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service
from app.services.account_service import AccountService
from app.services.contact_service import ContactService

GENERIC_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "icloud.com", "aol.com", "mail.com", "protonmail.com"
}

PRIORITY_INDUSTRIES = {
    "telecommunications", "technology", "finance", "healthcare",
    "saas", "manufacturing", "information technology", "banking"
}

class LeadService:
    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(Lead).where(Lead.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"LED-{year}-{count + 1:05d}"

    @staticmethod
    async def _generate_opp_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(Opportunity).where(Opportunity.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"OPP-{year}-{count + 1:05d}"

    @staticmethod
    def calculate_lead_score(data: Dict[str, Any]) -> Tuple[int, List[Dict[str, Any]]]:
        """
        Rule-Based Lead Scoring Engine per Blueprint specifications:
        Evaluates demographic fit, authority, contact accessibility, source intent, and consent.
        Returns clamped integer score (0-100) and an explainable breakdown of factor contributions.
        """
        score = 10
        factors: List[Dict[str, Any]] = [
            {"factor": "Baseline Intake", "weight": 10, "type": "positive"}
        ]

        # 1. Job Title & Seniority Authority
        job_title = str(data.get("job_title") or "").strip().lower()
        if any(t in job_title for t in ["c-level", "chief", "cxo", "ceo", "cto", "cio", "cfo", "cro", "president", "founder", "owner"]):
            score += 25
            factors.append({"factor": "Executive C-Level Decision Maker", "weight": 25, "type": "positive"})
        elif any(t in job_title for t in ["vice president", "vp", "director", "head of", "procurement", "buyer"]):
            score += 20
            factors.append({"factor": "Senior Director / Procurement Authority", "weight": 20, "type": "positive"})
        elif any(t in job_title for t in ["manager", "lead", "supervisor", "coordinator"]):
            score += 10
            factors.append({"factor": "Operational Department Management", "weight": 10, "type": "positive"})
        elif any(t in job_title for t in ["intern", "assistant", "student"]):
            score -= 10
            factors.append({"factor": "Entry-Level / Non-Decision Maker", "weight": -10, "type": "negative"})

        # 2. Email Quality & Domain Corporate Verification
        email = str(data.get("email") or "").strip().lower()
        if "@" in email:
            domain = email.split("@")[-1]
            if domain in GENERIC_EMAIL_DOMAINS:
                score -= 5
                factors.append({"factor": "Generic Public Webmail Domain", "weight": -5, "type": "negative"})
            else:
                score += 15
                factors.append({"factor": "Verified Corporate Email Domain", "weight": 15, "type": "positive"})

        # 3. Direct Contact Channels (Phone)
        phone = str(data.get("phone") or "").strip()
        if phone and len(phone) >= 7:
            score += 10
            factors.append({"factor": "Direct Contact Phone Provided", "weight": 10, "type": "positive"})

        # 4. Source Channel & Intent
        source = str(data.get("source") or "").strip().lower()
        if any(s in source for s in ["partner", "referral", "demo request", "inbound demo"]):
            score += 20
            factors.append({"factor": "High-Intent Inbound / Partner Referral", "weight": 20, "type": "positive"})
        elif any(s in source for s in ["website", "contact", "webform"]):
            score += 10
            factors.append({"factor": "Direct Website Inbound Intake", "weight": 10, "type": "positive"})
        elif any(s in source for s in ["event", "trade show", "webinar"]):
            score += 10
            factors.append({"factor": "Event / Webinar Engagement", "weight": 10, "type": "positive"})
        elif "outbound" in source:
            score += 5
            factors.append({"factor": "Outbound Prospecting Source", "weight": 5, "type": "positive"})

        # 5. Target Strategic Industry
        industry = str(data.get("industry") or "").strip().lower()
        if industry in PRIORITY_INDUSTRIES or any(ind in industry for ind in PRIORITY_INDUSTRIES):
            score += 15
            factors.append({"factor": "Tier-1 Strategic Industry Fit", "weight": 15, "type": "positive"})
        elif industry:
            score += 5
            factors.append({"factor": "Standard Commercial Industry", "weight": 5, "type": "positive"})

        # 6. Communication Consent
        consent = str(data.get("consent_status") or "").strip().lower()
        if any(c in consent for c in ["permitted", "granted", "opted-in", "yes"]):
            score += 10
            factors.append({"factor": "Explicit Communication Consent Verified", "weight": 10, "type": "positive"})

        # Final bounds clamping between 0 and 100
        clamped_score = max(0, min(100, score))
        return clamped_score, factors

    @staticmethod
    def _build_lead_response(lead: Lead) -> LeadResponse:
        custom_fields = lead.custom_fields or {}
        score_factors = custom_fields.get("score_factors", [])
        return LeadResponse(
            id=lead.id,
            tenant_id=lead.tenant_id,
            ref=lead.ref,
            first_name=lead.first_name,
            last_name=lead.last_name,
            full_name=lead.full_name,
            company_name=lead.company_name,
            job_title=lead.job_title,
            email=lead.email,
            phone=lead.phone,
            source=lead.source,
            industry=lead.industry,
            territory=lead.territory,
            status=lead.status,
            score=lead.score,
            score_factors=score_factors,
            priority=lead.priority,
            consent_status=lead.consent_status,
            owner_id=lead.owner_id,
            owner_name=lead.owner_name,
            converted_account_id=lead.converted_account_id,
            converted_account_name=lead.converted_account.name if lead.converted_account else None,
            converted_contact_id=lead.converted_contact_id,
            converted_contact_name=lead.converted_contact.full_name if lead.converted_contact else None,
            converted_opportunity_id=lead.converted_opportunity_id,
            converted_opportunity_name=lead.converted_opportunity.name if lead.converted_opportunity else None,
            converted_at=lead.converted_at,
            description=lead.description,
            custom_fields=custom_fields,
            created_at=lead.created_at,
            updated_at=lead.updated_at
        )

    @staticmethod
    async def list_leads(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        q: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        min_score: Optional[int] = None,
        owner_id: Optional[uuid.UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[LeadResponse], int, int]:
        query = (
            select(Lead)
            .options(
                joinedload(Lead.converted_account),
                joinedload(Lead.converted_contact),
                joinedload(Lead.converted_opportunity)
            )
            .where(
                Lead.tenant_id == tenant_id,
                Lead.deleted_at.is_(None)
            )
        )

        if status and status not in ("All", "All statuses"):
            query = query.where(Lead.status == status)

        if source and source not in ("All", "All sources"):
            query = query.where(Lead.source == source)

        if min_score is not None:
            query = query.where(Lead.score >= min_score)

        if owner_id:
            query = query.where(Lead.owner_id == owner_id)

        if q:
            term = f"%{q.strip().lower()}%"
            query = query.where(
                or_(
                    func.lower(Lead.first_name).like(term),
                    func.lower(Lead.last_name).like(term),
                    func.lower(Lead.company_name).like(term),
                    func.lower(Lead.email).like(term),
                    func.lower(Lead.phone).like(term),
                    func.lower(Lead.ref).like(term),
                    func.lower(Lead.job_title).like(term),
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_res = await db.execute(count_query)
        total = total_res.scalar() or 0

        # Sort
        sort_col = getattr(Lead, sort_by, Lead.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_col))
        else:
            query = query.order_by(desc(sort_col))

        # Paginate
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        res = await db.execute(query)
        leads = res.scalars().all()

        items = [LeadService._build_lead_response(l) for l in leads]
        pages = math.ceil(total / limit) if limit > 0 else 1
        return items, total, pages

    @staticmethod
    async def create_lead(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        req: LeadCreate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> LeadResponse:
        ref = await LeadService._generate_ref(db, tenant_id)

        # Calculate lead score if not explicitly passed
        lead_dict = req.model_dump()
        calculated_score, score_factors = LeadService.calculate_lead_score(lead_dict)
        final_score = req.score if req.score is not None else calculated_score

        custom_fields = req.custom_fields or {}
        custom_fields["score_factors"] = score_factors

        owner_name = actor_name
        if req.owner_id:
            owner = await db.get(User, req.owner_id)
            if not owner or owner.deleted_at is not None:
                raise ValidationException("Selected owner user does not exist.")
            owner_name = owner.full_name

        lead = Lead(
            tenant_id=tenant_id,
            ref=ref,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            company_name=req.company_name.strip(),
            job_title=req.job_title.strip() if req.job_title else None,
            email=req.email.strip().lower(),
            phone=req.phone.strip() if req.phone else None,
            source=req.source.strip() if req.source else "Website",
            industry=req.industry.strip() if req.industry else None,
            territory=req.territory.strip() if req.territory else None,
            status=req.status.strip() if req.status else "New",
            score=final_score,
            priority=req.priority.strip() if req.priority else "Normal",
            consent_status=req.consent_status.strip() if req.consent_status else "Pending",
            owner_id=req.owner_id,
            owner_name=owner_name,
            description=req.description,
            custom_fields=custom_fields,
            created_by=actor_id,
            updated_by=actor_id
        )

        db.add(lead)
        await db.commit()
        await db.refresh(lead)

        await audit_service.log_event(
            db=db,
            actor_name=actor_name,
            action="lead.created",
            resource_type="lead",
            resource_id=str(lead.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            metadata={
                "ref": lead.ref,
                "name": lead.full_name,
                "company": lead.company_name,
                "score": lead.score
            }
        )

        return LeadService._build_lead_response(lead)

    @staticmethod
    async def get_lead(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        lead_id: uuid.UUID
    ) -> LeadResponse:
        query = (
            select(Lead)
            .options(
                joinedload(Lead.converted_account),
                joinedload(Lead.converted_contact),
                joinedload(Lead.converted_opportunity)
            )
            .where(
                Lead.id == lead_id,
                Lead.tenant_id == tenant_id,
                Lead.deleted_at.is_(None)
            )
        )
        res = await db.execute(query)
        lead = res.scalar_one_or_none()
        if not lead:
            raise NotFoundException("Lead record not found.")
        return LeadService._build_lead_response(lead)

    @staticmethod
    async def update_lead(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        lead_id: uuid.UUID,
        patch: LeadUpdate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> LeadResponse:
        query = (
            select(Lead)
            .options(
                joinedload(Lead.converted_account),
                joinedload(Lead.converted_contact),
                joinedload(Lead.converted_opportunity)
            )
            .where(
                Lead.id == lead_id,
                Lead.tenant_id == tenant_id,
                Lead.deleted_at.is_(None)
            )
        )
        res = await db.execute(query)
        lead = res.scalar_one_or_none()
        if not lead:
            raise NotFoundException("Lead record not found.")

        updated_fields = []
        data = patch.model_dump(exclude_unset=True)

        # Enforce status transition validation
        if "status" in data and data["status"] is not None:
            new_status = data["status"]
            allowed_statuses = {"New", "Contacted", "Engaged", "In Progress", "Qualified", "Nurture", "Disqualified", "Converted"}
            if new_status not in allowed_statuses:
                raise ValidationException(f"Invalid lead status '{new_status}'. Allowed statuses: {', '.join(sorted(allowed_statuses))}")
            if lead.status == "Converted" and new_status != "Converted":
                raise ValidationException("Cannot modify status of an already converted lead.")

        if "owner_id" in data and data["owner_id"] is not None:
            owner = await db.get(User, data["owner_id"])
            if not owner or owner.deleted_at is not None:
                raise ValidationException("Selected owner user does not exist.")
            lead.owner_name = owner.full_name
            updated_fields.append("owner_name")

        for k, v in data.items():
            if k == "custom_fields" and v is not None:
                current_cf = dict(lead.custom_fields or {})
                current_cf.update(v)
                lead.custom_fields = current_cf
                updated_fields.append(k)
            elif hasattr(lead, k) and v is not None:
                setattr(lead, k, v)
                updated_fields.append(k)

        # Recalculate lead score dynamically if relevant profile fields changed and score was not manually forced
        if "score" not in data and any(f in updated_fields for f in ["job_title", "email", "phone", "source", "industry", "consent_status"]):
            calc_dict = {
                "job_title": lead.job_title,
                "email": lead.email,
                "phone": lead.phone,
                "source": lead.source,
                "industry": lead.industry,
                "consent_status": lead.consent_status
            }
            new_score, factors = LeadService.calculate_lead_score(calc_dict)
            lead.score = new_score
            cf = dict(lead.custom_fields or {})
            cf["score_factors"] = factors
            lead.custom_fields = cf

        lead.updated_by = actor_id
        await db.commit()
        await db.refresh(lead)

        await audit_service.log_event(
            db=db,
            actor_name=actor_name,
            action="lead.updated",
            resource_type="lead",
            resource_id=str(lead.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            metadata={"ref": lead.ref, "updated_fields": updated_fields}
        )

        return LeadService._build_lead_response(lead)

    @staticmethod
    async def delete_lead(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        lead_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> None:
        lead = await db.get(Lead, lead_id)
        if not lead or lead.tenant_id != tenant_id or lead.deleted_at is not None:
            raise NotFoundException("Lead record not found.")

        lead.deleted_at = datetime.now(timezone.utc)
        lead.updated_by = actor_id
        await db.commit()

        await audit_service.log_event(
            db=db,
            actor_name=actor_name,
            action="lead.archived",
            resource_type="lead",
            resource_id=str(lead.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            metadata={"ref": lead.ref, "company": lead.company_name}
        )

    @staticmethod
    async def convert_lead(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        lead_id: uuid.UUID,
        req: LeadConvertRequest,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> LeadConvertResponse:
        """
        ATOMIC LEAD CONVERSION ENGINE (LD-03 / Verification Gate M2):
        Converts a qualified lead into Account, Contact, and optional Opportunity
        in a SINGLE ACID TRANSACTION.
        Guarantees zero orphan records on any validation or constraint failure.
        """
        # Fetch lead with locks
        lead = await db.get(Lead, lead_id)
        if not lead or lead.tenant_id != tenant_id or lead.deleted_at is not None:
            raise NotFoundException("Lead record not found.")

        if lead.status == "Converted" or lead.converted_at is not None:
            raise ValidationException("Lead is already converted and cannot be converted again.")

        if lead.status == "Disqualified":
            raise ValidationException("Disqualified leads cannot be converted. Re-qualify the lead before conversion.")

        # Begin atomic transaction block using savepoint
        async with db.begin_nested():
            # 1. Resolve or Create Account
            target_account: Account
            if req.account_mode == "link":
                if not req.existing_account_id:
                    raise ValidationException("Existing account ID is required when linking to an existing account.")
                target_account = await db.get(Account, req.existing_account_id)
                if not target_account or target_account.tenant_id != tenant_id or target_account.deleted_at is not None:
                    raise ValidationException("Specified existing account does not exist in this organization.")
            else:
                acc_payload = req.new_account or {}
                acc_name = str(acc_payload.get("name") or lead.company_name).strip()
                if not acc_name:
                    raise ValidationException("Account name is required for creating a customer organization.")
                
                acc_ref = await AccountService._generate_ref(db, tenant_id)
                target_account = Account(
                    tenant_id=tenant_id,
                    ref=acc_ref,
                    name=acc_name,
                    account_type="Customer",
                    industry=acc_payload.get("industry") or lead.industry,
                    website=acc_payload.get("website"),
                    phone=acc_payload.get("phone") or lead.phone,
                    email=acc_payload.get("email") or lead.email,
                    address=acc_payload.get("address") or lead.territory,
                    billing_address=acc_payload.get("billing_address") or {},
                    shipping_address=acc_payload.get("shipping_address") or {},
                    ownership="Private",
                    status="Active",
                    description=f"Account created via atomic lead conversion from {lead.ref}.",
                    credit_limit=Decimal(str(acc_payload.get("credit_limit") or "0.00")),
                    owner_id=lead.owner_id or actor_id,
                    owner_name=lead.owner_name or actor_name,
                    custom_fields={"source_lead_ref": lead.ref},
                    created_by=actor_id,
                    updated_by=actor_id
                )
                db.add(target_account)
                await db.flush()  # Populates target_account.id within transaction

            # 2. Create Contact
            con_payload = req.contact or {}
            first_name = str(con_payload.get("first_name") or lead.first_name).strip()
            last_name = str(con_payload.get("last_name") or lead.last_name).strip()
            con_email = str(con_payload.get("email") or lead.email).strip().lower()

            if not first_name or not last_name or not con_email:
                raise ValidationException("Contact first name, last name, and email are required.")

            con_ref = await ContactService._generate_ref(db, tenant_id)
            target_contact = Contact(
                tenant_id=tenant_id,
                account_id=target_account.id,
                ref=con_ref,
                first_name=first_name,
                last_name=last_name,
                email=con_email,
                phone=con_payload.get("phone") or lead.phone,
                job_title=con_payload.get("job_title") or lead.job_title,
                department=con_payload.get("department") or "Procurement",
                status="Active",
                is_primary=True,
                is_decision_maker=True,
                owner_id=lead.owner_id or actor_id,
                owner_name=lead.owner_name or actor_name,
                description=f"Primary contact converted from qualified lead {lead.ref}.",
                custom_fields={"source_lead_ref": lead.ref},
                created_by=actor_id,
                updated_by=actor_id
            )
            db.add(target_contact)
            await db.flush()  # Populates target_contact.id within transaction

            # 3. Create Opportunity (if requested)
            target_opp: Optional[Opportunity] = None
            if req.create_opportunity:
                opp_payload = req.opportunity or {}
                opp_name = str(opp_payload.get("name") or f"{target_account.name} · Enterprise Solution").strip()
                opp_ref = await LeadService._generate_opp_ref(db, tenant_id)
                opp_amount = Decimal(str(opp_payload.get("amount") or "0.00"))
                opp_stage = str(opp_payload.get("stage") or "Qualification")
                opp_prob = int(opp_payload.get("probability") or 25)

                close_date_raw = opp_payload.get("expected_close_date")
                close_date: Optional[datetime] = None
                if close_date_raw:
                    try:
                        if isinstance(close_date_raw, str):
                            close_date = datetime.fromisoformat(close_date_raw.replace("Z", "+00:00"))
                        elif isinstance(close_date_raw, datetime):
                            close_date = close_date_raw
                    except Exception:
                        close_date = None

                target_opp = Opportunity(
                    tenant_id=tenant_id,
                    account_id=target_account.id,
                    contact_id=target_contact.id,
                    ref=opp_ref,
                    name=opp_name,
                    pipeline_id=str(opp_payload.get("pipeline_id") or "default"),
                    stage=opp_stage,
                    amount=opp_amount,
                    currency=str(opp_payload.get("currency") or "USD"),
                    probability=opp_prob,
                    expected_close_date=close_date,
                    forecast_category="Pipeline",
                    risk_level="Low",
                    lead_source=lead.source,
                    owner_id=lead.owner_id or actor_id,
                    owner_name=lead.owner_name or actor_name,
                    custom_fields={"source_lead_ref": lead.ref},
                    created_by=actor_id,
                    updated_by=actor_id
                )
                db.add(target_opp)
                await db.flush()  # Populates target_opp.id within transaction

            # 4. Transfer & Create CRM Activity on Account and Contact
            conversion_activity = CRMActivity(
                tenant_id=tenant_id,
                account_id=target_account.id,
                contact_id=target_contact.id,
                activity_type="StatusChange",
                subject=f"Lead Converted: {lead.ref}",
                description=(
                    f"Prospect {lead.full_name} ({lead.company_name}) successfully converted into "
                    f"Account {target_account.ref} and Contact {target_contact.ref}. "
                    f"{'Opportunity ' + target_opp.ref + ' created. ' if target_opp else ''}"
                    f"Original notes: {lead.description or 'None'}"
                ),
                occurred_at=datetime.now(timezone.utc),
                actor_id=actor_id,
                actor_name=actor_name,
                metadata_json={
                    "lead_ref": lead.ref,
                    "lead_id": str(lead.id),
                    "account_ref": target_account.ref,
                    "contact_ref": target_contact.ref,
                    "opportunity_ref": target_opp.ref if target_opp else None
                }
            )
            db.add(conversion_activity)

            # 5. Transition Lead to Converted
            lead.status = "Converted"
            lead.converted_account_id = target_account.id
            lead.converted_contact_id = target_contact.id
            lead.converted_opportunity_id = target_opp.id if target_opp else None
            lead.converted_at = datetime.now(timezone.utc)
            lead.updated_by = actor_id

        # Commit entire ACID transaction
        await db.commit()

        # Audit event
        await audit_service.log_event(
            db=db,
            actor_name=actor_name,
            action="lead.converted",
            resource_type="lead",
            resource_id=str(lead.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            metadata={
                "lead_ref": lead.ref,
                "account_id": str(target_account.id),
                "account_ref": target_account.ref,
                "contact_id": str(target_contact.id),
                "contact_ref": target_contact.ref,
                "opportunity_id": str(target_opp.id) if target_opp else None,
                "opportunity_ref": target_opp.ref if target_opp else None
            }
        )

        # Build responses
        acc_resp = AccountResponse(
            id=target_account.id,
            tenant_id=target_account.tenant_id,
            ref=target_account.ref,
            name=target_account.name,
            account_type=target_account.account_type,
            industry=target_account.industry,
            website=target_account.website,
            phone=target_account.phone,
            email=target_account.email,
            address=target_account.address,
            billing_address=target_account.billing_address or {},
            shipping_address=target_account.shipping_address or {},
            ownership=target_account.ownership,
            status=target_account.status,
            description=target_account.description,
            credit_limit=target_account.credit_limit,
            owner_id=target_account.owner_id,
            owner_name=target_account.owner_name,
            parent_id=target_account.parent_id,
            custom_fields=target_account.custom_fields or {},
            created_at=target_account.created_at,
            updated_at=target_account.updated_at,
            contacts_count=1
        )

        con_resp = ContactResponse(
            id=target_contact.id,
            tenant_id=target_contact.tenant_id,
            account_id=target_contact.account_id,
            account_name=target_account.name,
            ref=target_contact.ref,
            first_name=target_contact.first_name,
            last_name=target_contact.last_name,
            full_name=target_contact.full_name,
            email=target_contact.email,
            phone=target_contact.phone,
            job_title=target_contact.job_title,
            department=target_contact.department,
            status=target_contact.status,
            is_primary=target_contact.is_primary,
            is_decision_maker=target_contact.is_decision_maker,
            owner_id=target_contact.owner_id,
            owner_name=target_contact.owner_name,
            description=target_contact.description,
            custom_fields=target_contact.custom_fields or {},
            created_at=target_contact.created_at,
            updated_at=target_contact.updated_at
        )

        opp_resp: Optional[OpportunityResponse] = None
        if target_opp:
            opp_resp = OpportunityResponse(
                id=target_opp.id,
                tenant_id=target_opp.tenant_id,
                account_id=target_opp.account_id,
                account_name=target_account.name,
                contact_id=target_opp.contact_id,
                contact_name=target_contact.full_name,
                ref=target_opp.ref,
                name=target_opp.name,
                pipeline_id=target_opp.pipeline_id,
                stage=target_opp.stage,
                amount=target_opp.amount,
                currency=target_opp.currency,
                probability=target_opp.probability,
                expected_close_date=target_opp.expected_close_date,
                forecast_category=target_opp.forecast_category,
                risk_level=target_opp.risk_level,
                lead_source=target_opp.lead_source,
                owner_id=target_opp.owner_id,
                owner_name=target_opp.owner_name,
                custom_fields=target_opp.custom_fields or {},
                created_at=target_opp.created_at,
                updated_at=target_opp.updated_at
            )

        lead_resp = LeadService._build_lead_response(lead)

        return LeadConvertResponse(
            lead=lead_resp,
            account=acc_resp,
            contact=con_resp,
            opportunity=opp_resp,
            message=f"Lead {lead.ref} successfully converted into Account {target_account.ref} and Contact {target_contact.ref}."
        )

lead_service = LeadService()
