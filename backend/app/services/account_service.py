import uuid
import math
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from decimal import Decimal
from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crm import Account, Contact, CRMActivity, Opportunity
from app.models.service import Case
from app.models.user import User
from app.schemas.crm import (
    AccountCreate, AccountUpdate, AccountResponse,
    CRMActivityCreate, CRMActivityResponse, Customer360Response, ContactResponse,
    OpportunityResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class AccountService:
    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(Account).where(Account.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"ACC-{year}-{count + 1:05d}"

    @staticmethod
    async def list_accounts(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        q: Optional[str] = None,
        industry: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[AccountResponse], int, int]:
        query = select(Account).where(
            Account.tenant_id == tenant_id,
            Account.deleted_at.is_(None)
        )

        if q:
            term = f"%{q.strip().lower()}%"
            query = query.where(
                or_(
                    func.lower(Account.name).like(term),
                    func.lower(Account.ref).like(term),
                    func.lower(Account.industry).like(term),
                    func.lower(Account.email).like(term),
                    func.lower(Account.phone).like(term),
                )
            )

        if industry and industry != "All":
            query = query.where(Account.industry == industry)

        if status and status != "All" and status != "All statuses":
            query = query.where(Account.status == status)

        # Count total matching
        count_query = select(func.count()).select_from(query.subquery())
        total_res = await db.execute(count_query)
        total = total_res.scalar() or 0

        # Sorting
        sort_col = getattr(Account, sort_by, Account.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_col))
        else:
            query = query.order_by(desc(sort_col))

        # Pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        res = await db.execute(query)
        accounts = res.scalars().all()

        # Build response with contacts count
        items: List[AccountResponse] = []
        for acc in accounts:
            contacts_count = len(acc.contacts) if acc.contacts else 0
            items.append(
                AccountResponse(
                    id=acc.id,
                    tenant_id=acc.tenant_id,
                    ref=acc.ref,
                    name=acc.name,
                    account_type=acc.account_type,
                    industry=acc.industry,
                    website=acc.website,
                    phone=acc.phone,
                    email=acc.email,
                    address=acc.address,
                    billing_address=acc.billing_address or {},
                    shipping_address=acc.shipping_address or {},
                    ownership=acc.ownership,
                    status=acc.status,
                    description=acc.description,
                    credit_limit=acc.credit_limit,
                    owner_id=acc.owner_id,
                    owner_name=acc.owner_name,
                    parent_id=acc.parent_id,
                    custom_fields=acc.custom_fields or {},
                    created_at=acc.created_at,
                    updated_at=acc.updated_at,
                    contacts_count=contacts_count
                )
            )

        pages = math.ceil(total / limit) if limit > 0 else 1
        return items, total, pages

    @staticmethod
    async def create_account(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        req: AccountCreate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> AccountResponse:
        ref = await AccountService._generate_ref(db, tenant_id)

        # Resolve owner_name if owner_id provided
        owner_name = actor_name
        if req.parent_id:
            parent = await db.get(Account, req.parent_id)
            if not parent or parent.tenant_id != tenant_id or parent.is_deleted:
                raise ValidationException("Specified parent account does not exist or belongs to another organization.")

        account = Account(
            tenant_id=tenant_id,
            ref=ref,
            name=req.name.strip(),
            account_type=req.account_type,
            industry=req.industry.strip() if req.industry else None,
            website=req.website.strip() if req.website else None,
            phone=req.phone.strip() if req.phone else None,
            email=req.email.strip().lower() if req.email else None,
            address=req.address.strip() if req.address else None,
            billing_address=req.billing_address or {},
            shipping_address=req.shipping_address or {},
            ownership=req.ownership,
            status=req.status,
            description=req.description,
            credit_limit=req.credit_limit or Decimal("0.00"),
            owner_id=actor_id,
            owner_name=owner_name,
            parent_id=req.parent_id,
            custom_fields=req.custom_fields or {},
            created_by=actor_id,
            updated_by=actor_id
        )

        db.add(account)
        await db.commit()
        await db.refresh(account)

        # Automatically log activity and audit event
        await audit_service.log_event(
            db, action="account.created", resource_type="account",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(account.id), metadata={"name": account.name, "ref": account.ref}
        )

        return AccountResponse(
            id=account.id,
            tenant_id=account.tenant_id,
            ref=account.ref,
            name=account.name,
            account_type=account.account_type,
            industry=account.industry,
            website=account.website,
            phone=account.phone,
            email=account.email,
            address=account.address,
            billing_address=account.billing_address or {},
            shipping_address=account.shipping_address or {},
            ownership=account.ownership,
            status=account.status,
            description=account.description,
            credit_limit=account.credit_limit,
            owner_id=account.owner_id,
            owner_name=account.owner_name,
            parent_id=account.parent_id,
            custom_fields=account.custom_fields or {},
            created_at=account.created_at,
            updated_at=account.updated_at,
            contacts_count=0
        )

    @staticmethod
    async def get_account(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        account_id: uuid.UUID
    ) -> AccountResponse:
        res = await db.execute(
            select(Account).where(
                Account.id == account_id,
                Account.tenant_id == tenant_id,
                Account.deleted_at.is_(None)
            )
        )
        account = res.scalar_one_or_none()
        if not account:
            raise NotFoundException("Account not found.")

        return AccountResponse(
            id=account.id,
            tenant_id=account.tenant_id,
            ref=account.ref,
            name=account.name,
            account_type=account.account_type,
            industry=account.industry,
            website=account.website,
            phone=account.phone,
            email=account.email,
            address=account.address,
            billing_address=account.billing_address or {},
            shipping_address=account.shipping_address or {},
            ownership=account.ownership,
            status=account.status,
            description=account.description,
            credit_limit=account.credit_limit,
            owner_id=account.owner_id,
            owner_name=account.owner_name,
            parent_id=account.parent_id,
            custom_fields=account.custom_fields or {},
            created_at=account.created_at,
            updated_at=account.updated_at,
            contacts_count=len(account.contacts) if account.contacts else 0
        )

    @staticmethod
    async def update_account(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        account_id: uuid.UUID,
        req: AccountUpdate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> AccountResponse:
        res = await db.execute(
            select(Account).where(
                Account.id == account_id,
                Account.tenant_id == tenant_id,
                Account.deleted_at.is_(None)
            )
        )
        account = res.scalar_one_or_none()
        if not account:
            raise NotFoundException("Account not found.")

        patch_data = req.model_dump(exclude_unset=True)
        if "parent_id" in patch_data and patch_data["parent_id"] is not None:
            from app.services.hierarchy_service import HierarchyService
            await HierarchyService.validate_parent_assignment(
                db=db,
                tenant_id=tenant_id,
                account_id=account_id,
                parent_id=patch_data["parent_id"]
            )

        for k, v in patch_data.items():
            if k == "name" and v:
                account.name = v.strip()
            elif k == "credit_limit" and v is not None:
                account.credit_limit = v
            elif hasattr(account, k):
                setattr(account, k, v)

        account.updated_at = datetime.now(timezone.utc)
        account.updated_by = actor_id

        await db.commit()
        await db.refresh(account)

        await audit_service.log_event(
            db, action="account.updated", resource_type="account",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(account.id), metadata={"name": account.name, "updated_fields": list(patch_data.keys())}
        )

        return AccountResponse(
            id=account.id,
            tenant_id=account.tenant_id,
            ref=account.ref,
            name=account.name,
            account_type=account.account_type,
            industry=account.industry,
            website=account.website,
            phone=account.phone,
            email=account.email,
            address=account.address,
            billing_address=account.billing_address or {},
            shipping_address=account.shipping_address or {},
            ownership=account.ownership,
            status=account.status,
            description=account.description,
            credit_limit=account.credit_limit,
            owner_id=account.owner_id,
            owner_name=account.owner_name,
            parent_id=account.parent_id,
            custom_fields=account.custom_fields or {},
            created_at=account.created_at,
            updated_at=account.updated_at,
            contacts_count=len(account.contacts) if account.contacts else 0
        )

    @staticmethod
    async def archive_account(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        account_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> bool:
        res = await db.execute(
            select(Account).where(
                Account.id == account_id,
                Account.tenant_id == tenant_id,
                Account.deleted_at.is_(None)
            )
        )
        account = res.scalar_one_or_none()
        if not account:
            raise NotFoundException("Account not found.")

        account.status = "Archived"
        account.deleted_at = datetime.now(timezone.utc)
        account.updated_by = actor_id

        await db.commit()

        await audit_service.log_event(
            db, action="account.archived", resource_type="account",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(account.id), metadata={"name": account.name, "ref": account.ref}
        )
        return True

    @staticmethod
    async def get_account_360(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        account_id: uuid.UUID
    ) -> Customer360Response:
        res = await db.execute(
            select(Account)
            .where(
                Account.id == account_id,
                Account.tenant_id == tenant_id,
                Account.deleted_at.is_(None)
            )
            .options(
                selectinload(Account.contacts),
                selectinload(Account.activities),
                selectinload(Account.opportunities)
            )
        )
        account = res.scalar_one_or_none()
        if not account:
            raise NotFoundException("Account not found.")

        contacts_list = [
            ContactResponse(
                id=c.id,
                tenant_id=c.tenant_id,
                account_id=c.account_id,
                account_name=account.name,
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
            for c in account.contacts if not c.is_deleted
        ]

        activities_list = [
            CRMActivityResponse(
                id=a.id,
                tenant_id=a.tenant_id,
                account_id=a.account_id,
                contact_id=a.contact_id,
                activity_type=a.activity_type,
                subject=a.subject,
                description=a.description,
                occurred_at=a.occurred_at,
                actor_id=a.actor_id,
                actor_name=a.actor_name,
                metadata=a.metadata_json or {}
            )
            for a in sorted(account.activities, key=lambda x: x.occurred_at, reverse=True)
            if not a.is_deleted
        ]

        opportunities_list = [
            OpportunityResponse(
                id=o.id,
                tenant_id=o.tenant_id,
                account_id=o.account_id,
                account_name=account.name,
                contact_id=o.contact_id,
                contact_name=o.contact.full_name if o.contact else None,
                ref=o.ref,
                name=o.name,
                pipeline_id=o.pipeline_id,
                stage=o.stage,
                amount=o.amount,
                currency=o.currency,
                probability=o.probability,
                expected_close_date=o.expected_close_date,
                forecast_category=o.forecast_category,
                risk_level=o.risk_level,
                lead_source=o.lead_source,
                owner_id=o.owner_id,
                owner_name=o.owner_name,
                custom_fields=o.custom_fields or {},
                created_at=o.created_at,
                updated_at=o.updated_at
            )
            for o in (account.opportunities or []) if not o.is_deleted
        ]

        acc_resp = AccountResponse(
            id=account.id,
            tenant_id=account.tenant_id,
            ref=account.ref,
            name=account.name,
            account_type=account.account_type,
            industry=account.industry,
            website=account.website,
            phone=account.phone,
            email=account.email,
            address=account.address,
            billing_address=account.billing_address or {},
            shipping_address=account.shipping_address or {},
            ownership=account.ownership,
            status=account.status,
            description=account.description,
            credit_limit=account.credit_limit,
            owner_id=account.owner_id,
            owner_name=account.owner_name,
            parent_id=account.parent_id,
            custom_fields=account.custom_fields or {},
            created_at=account.created_at,
            updated_at=account.updated_at,
            contacts_count=len(contacts_list)
        )

        open_opps = [o for o in opportunities_list if o.stage not in ("Closed Won", "Closed Lost")]
        total_pipe_val = sum((Decimal(str(o.amount)) for o in open_opps), Decimal("0.00"))

        cases_res = await db.execute(
            select(Case).where(Case.account_id == account_id, Case.tenant_id == tenant_id, Case.deleted_at.is_(None))
        )
        cases_list = [
            {
                "id": str(c.id),
                "ref": c.ref,
                "subject": c.subject,
                "status": c.status,
                "priority": c.priority,
                "category": c.category,
                "sentiment": c.sentiment,
                "sla_breached": c.sla_breached,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in cases_res.scalars().all()
        ]
        open_cases = [c for c in cases_list if c["status"] not in ("Resolved", "Closed")]

        metrics = {
            "total_contacts": len(contacts_list),
            "primary_contact": next((c.full_name for c in contacts_list if c.is_primary), None),
            "total_activities": len(activities_list),
            "total_opportunities": len(opportunities_list),
            "open_opportunities_count": len(open_opps),
            "open_pipeline_value": float(total_pipe_val),
            "total_cases": len(cases_list),
            "open_cases_count": len(open_cases),
            "credit_limit": float(account.credit_limit),
            "account_status": account.status,
            "health_score": 92 if account.status == "Active" else 50
        }

        return Customer360Response(
            account=acc_resp,
            contacts=contacts_list,
            activities=activities_list,
            opportunities=opportunities_list,
            cases=cases_list,
            metrics=metrics
        )

    @staticmethod
    async def create_activity(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        account_id: uuid.UUID,
        req: CRMActivityCreate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> CRMActivityResponse:
        account = await db.get(Account, account_id)
        if not account or account.tenant_id != tenant_id or account.is_deleted:
            raise NotFoundException("Account not found.")

        if req.contact_id:
            contact = await db.get(Contact, req.contact_id)
            if not contact or contact.tenant_id != tenant_id or contact.is_deleted:
                raise ValidationException("Specified contact does not exist in this organization.")

        activity = CRMActivity(
            tenant_id=tenant_id,
            account_id=account_id,
            contact_id=req.contact_id,
            activity_type=req.activity_type,
            subject=req.subject.strip(),
            description=req.description,
            occurred_at=datetime.now(timezone.utc),
            actor_id=actor_id,
            actor_name=actor_name,
            metadata_json=req.metadata or {}
        )

        db.add(activity)
        await db.commit()
        await db.refresh(activity)

        await audit_service.log_event(
            db, action="account.activity_logged", resource_type="activity",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(activity.id), metadata={"subject": activity.subject, "type": activity.activity_type}
        )

        return CRMActivityResponse(
            id=activity.id,
            tenant_id=activity.tenant_id,
            account_id=activity.account_id,
            contact_id=activity.contact_id,
            activity_type=activity.activity_type,
            subject=activity.subject,
            description=activity.description,
            occurred_at=activity.occurred_at,
            actor_id=activity.actor_id,
            actor_name=activity.actor_name,
            metadata=activity.metadata_json or {}
        )
