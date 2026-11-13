import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload

from app.models.marketing import Campaign, CampaignMember
from app.models.crm import Lead, Opportunity, Contact
from app.schemas.marketing import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignMemberCreate,
    CampaignMemberResponse,
    CampaignAttributionResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class CampaignService:
    """Service managing marketing campaigns, lifecycles, audience members, and ROI attribution."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(Campaign).where(Campaign.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"CMP-{year}-{count + 1:05d}"

    @staticmethod
    async def _compute_campaign_metrics(
        db: AsyncSession,
        campaign: Campaign,
        tenant_id: uuid.UUID
    ) -> Tuple[int, int, int, Decimal, Decimal]:
        m_res = await db.execute(
            select(func.count()).select_from(CampaignMember).where(
                CampaignMember.campaign_id == campaign.id,
                CampaignMember.tenant_id == tenant_id,
                CampaignMember.deleted_at.is_(None)
            )
        )
        member_count = m_res.scalar() or 0

        l_res = await db.execute(
            select(CampaignMember.lead_id).where(
                CampaignMember.campaign_id == campaign.id,
                CampaignMember.tenant_id == tenant_id,
                CampaignMember.lead_id.isnot(None),
                CampaignMember.deleted_at.is_(None)
            )
        )
        lead_ids = [lid for lid in l_res.scalars().all() if lid]
        lead_count = len(lead_ids)

        opp_conditions = [
            Opportunity.lead_source == campaign.name,
            Opportunity.lead_source == campaign.ref
        ]
        if lead_ids:
            conv_res = await db.execute(
                select(Lead.converted_opportunity_id).where(
                    Lead.id.in_(lead_ids),
                    Lead.converted_opportunity_id.isnot(None)
                )
            )
            conv_opp_ids = [oid for oid in conv_res.scalars().all() if oid]
            if conv_opp_ids:
                opp_conditions.append(Opportunity.id.in_(conv_opp_ids))

        opps_res = await db.execute(
            select(Opportunity).where(
                or_(*opp_conditions),
                Opportunity.tenant_id == tenant_id,
                Opportunity.deleted_at.is_(None)
            )
        )
        opps = opps_res.scalars().all()
        opp_count = len(opps)
        won_revenue = sum(o.amount for o in opps if o.stage == "Closed Won") or Decimal("0.00")

        roi = Decimal("0.00")
        if campaign.actual_cost > 0:
            roi = ((won_revenue - campaign.actual_cost) / campaign.actual_cost) * Decimal("100.0")

        return member_count, lead_count, opp_count, won_revenue, round(roi, 2)

    @staticmethod
    async def list_campaigns(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        q: Optional[str] = None,
        type: Optional[str] = None,
        status: Optional[str] = None,
        owner_id: Optional[uuid.UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[CampaignResponse], int, int]:
        stmt = select(Campaign).where(
            Campaign.tenant_id == tenant_id,
            Campaign.deleted_at.is_(None)
        )

        if q:
            term = f"%{q}%"
            stmt = stmt.where(or_(Campaign.name.ilike(term), Campaign.ref.ilike(term)))
        if type:
            stmt = stmt.where(Campaign.type == type)
        if status:
            stmt = stmt.where(Campaign.status == status)
        if owner_id:
            stmt = stmt.where(Campaign.owner_id == owner_id)

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        # Sort
        sort_col = getattr(Campaign, sort_by, Campaign.created_at)
        stmt = stmt.order_by(sort_col.asc() if sort_order == "asc" else sort_col.desc())
        stmt = stmt.offset((page - 1) * limit).limit(limit)

        res = await db.execute(stmt)
        campaigns = res.scalars().all()
        pages = (total + limit - 1) // limit if total > 0 else 1

        result_items: List[CampaignResponse] = []
        for c in campaigns:
            member_count, lead_count, opp_count, won_revenue, roi = await CampaignService._compute_campaign_metrics(
                db, c, tenant_id
            )
            resp = CampaignResponse.model_validate(c)
            resp.member_count = member_count
            resp.leads_generated_count = lead_count
            resp.opportunities_influenced_count = opp_count
            resp.revenue_generated = won_revenue
            resp.roi_percentage = roi
            result_items.append(resp)

        return result_items, total, pages

    @staticmethod
    async def get_campaign(db: AsyncSession, campaign_id: uuid.UUID, tenant_id: uuid.UUID) -> CampaignResponse:
        stmt = select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.tenant_id == tenant_id,
            Campaign.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        campaign = res.scalar_one_or_none()
        if not campaign:
            raise NotFoundException("Campaign not found.")

        member_count, lead_count, opp_count, won_revenue, roi = await CampaignService._compute_campaign_metrics(
            db, campaign, tenant_id
        )
        resp = CampaignResponse.model_validate(campaign)
        resp.member_count = member_count
        resp.leads_generated_count = lead_count
        resp.opportunities_influenced_count = opp_count
        resp.revenue_generated = won_revenue
        resp.roi_percentage = roi
        return resp

    @staticmethod
    async def create_campaign(
        db: AsyncSession,
        campaign_in: CampaignCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> CampaignResponse:
        ref = await CampaignService._generate_ref(db, tenant_id)
        campaign = Campaign(
            tenant_id=tenant_id,
            ref=ref,
            name=campaign_in.name,
            type=campaign_in.type,
            status="Planning",
            channel=campaign_in.channel,
            start_date=campaign_in.start_date,
            end_date=campaign_in.end_date,
            target_audience=campaign_in.target_audience,
            objective=campaign_in.objective,
            budget=campaign_in.budget,
            actual_cost=campaign_in.actual_cost,
            expected_revenue=campaign_in.expected_revenue,
            owner_id=campaign_in.owner_id or actor_id,
            owner_name=campaign_in.owner_name or actor_name,
            custom_fields=campaign_in.custom_fields
        )
        db.add(campaign)
        await db.commit()
        await db.refresh(campaign)

        await audit_service.log_event(
            db=db,
            action="campaign.created",
            resource_type="campaign",
            resource_id=str(campaign.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": ref, "name": campaign.name, "budget": str(campaign.budget)}
        )

        return await CampaignService.get_campaign(db, campaign.id, tenant_id)

    @staticmethod
    async def update_campaign(
        db: AsyncSession,
        campaign_id: uuid.UUID,
        campaign_in: CampaignUpdate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> CampaignResponse:
        stmt = select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.tenant_id == tenant_id,
            Campaign.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        campaign = res.scalar_one_or_none()
        if not campaign:
            raise NotFoundException("Campaign not found.")

        update_dict = campaign_in.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(campaign, key, val)

        await db.commit()
        await db.refresh(campaign)

        await audit_service.log_event(
            db=db,
            action="campaign.updated",
            resource_type="campaign",
            resource_id=str(campaign.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": campaign.ref, "updated_fields": list(update_dict.keys())}
        )

        return await CampaignService.get_campaign(db, campaign.id, tenant_id)

    @staticmethod
    async def transition_status(
        db: AsyncSession,
        campaign_id: uuid.UUID,
        new_status: str,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> CampaignResponse:
        valid_statuses = ["Planning", "Active", "Paused", "Completed", "Cancelled"]
        if new_status not in valid_statuses:
            raise ValidationException(f"Invalid status: '{new_status}'. Allowed: {valid_statuses}")

        stmt = select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.tenant_id == tenant_id,
            Campaign.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        campaign = res.scalar_one_or_none()
        if not campaign:
            raise NotFoundException("Campaign not found.")

        old_status = campaign.status
        campaign.status = new_status
        await db.commit()

        await audit_service.log_event(
            db=db,
            action="campaign.status_changed",
            resource_type="campaign",
            resource_id=str(campaign.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": campaign.ref, "old_status": old_status, "new_status": new_status}
        )

        return await CampaignService.get_campaign(db, campaign.id, tenant_id)

    @staticmethod
    async def delete_campaign(
        db: AsyncSession,
        campaign_id: uuid.UUID,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> None:
        stmt = select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.tenant_id == tenant_id,
            Campaign.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        campaign = res.scalar_one_or_none()
        if not campaign:
            raise NotFoundException("Campaign not found.")

        campaign.deleted_at = datetime.now(timezone.utc)
        await db.commit()

        await audit_service.log_event(
            db=db,
            action="campaign.deleted",
            resource_type="campaign",
            resource_id=str(campaign.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": campaign.ref}
        )

    # --- Campaign Member Management ---

    @staticmethod
    async def add_member(
        db: AsyncSession,
        campaign_id: uuid.UUID,
        member_in: CampaignMemberCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> CampaignMemberResponse:
        # Verify campaign exists
        c_res = await db.execute(
            select(Campaign).where(Campaign.id == campaign_id, Campaign.tenant_id == tenant_id, Campaign.deleted_at.is_(None))
        )
        if not c_res.scalar_one_or_none():
            raise NotFoundException("Campaign not found.")

        if not member_in.contact_id and not member_in.lead_id:
            raise ValidationException("Either contact_id or lead_id must be provided.")

        member = CampaignMember(
            tenant_id=tenant_id,
            campaign_id=campaign_id,
            contact_id=member_in.contact_id,
            lead_id=member_in.lead_id,
            status=member_in.status,
            engagement_score=member_in.engagement_score,
            unsubscribed=member_in.unsubscribed,
            custom_fields=member_in.custom_fields
        )
        db.add(member)
        await db.commit()
        await db.refresh(member)

        return CampaignMemberResponse.model_validate(member)

    @staticmethod
    async def list_members(
        db: AsyncSession,
        campaign_id: uuid.UUID,
        tenant_id: uuid.UUID,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[CampaignMemberResponse], int, int]:
        stmt = (
            select(CampaignMember)
            .where(
                CampaignMember.campaign_id == campaign_id,
                CampaignMember.tenant_id == tenant_id,
                CampaignMember.deleted_at.is_(None)
            )
            .options(selectinload(CampaignMember.contact), selectinload(CampaignMember.lead))
            .offset((page - 1) * limit)
            .limit(limit)
        )
        count_stmt = select(func.count()).select_from(
            select(CampaignMember).where(
                CampaignMember.campaign_id == campaign_id,
                CampaignMember.tenant_id == tenant_id,
                CampaignMember.deleted_at.is_(None)
            ).subquery()
        )
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        res = await db.execute(stmt)
        members = res.scalars().all()
        pages = (total + limit - 1) // limit if total > 0 else 1

        result: List[CampaignMemberResponse] = []
        for m in members:
            resp = CampaignMemberResponse.model_validate(m)
            if m.contact:
                resp.name = f"{m.contact.first_name} {m.contact.last_name}"
                resp.email = m.contact.email
            elif m.lead:
                resp.name = f"{m.lead.first_name} {m.lead.last_name}"
                resp.email = m.lead.email
                resp.company = m.lead.company_name
            result.append(resp)

        return result, total, pages

    @staticmethod
    async def get_attribution(
        db: AsyncSession,
        campaign_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> CampaignAttributionResponse:
        stmt = select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.tenant_id == tenant_id,
            Campaign.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        campaign = res.scalar_one_or_none()
        if not campaign:
            raise NotFoundException("Campaign not found.")

        # Leads via CampaignMember
        member_leads_stmt = select(CampaignMember.lead_id).where(
            CampaignMember.campaign_id == campaign_id,
            CampaignMember.tenant_id == tenant_id,
            CampaignMember.lead_id.isnot(None),
            CampaignMember.deleted_at.is_(None)
        )
        lead_ids_res = await db.execute(member_leads_stmt)
        lead_ids = [lid for lid in lead_ids_res.scalars().all() if lid]

        leads = []
        if lead_ids:
            leads_res = await db.execute(
                select(Lead).where(
                    Lead.id.in_(lead_ids),
                    Lead.tenant_id == tenant_id,
                    Lead.deleted_at.is_(None)
                )
            )
            leads = leads_res.scalars().all()
        leads_count = len(leads)
        converted_count = sum(1 for l in leads if l.status == "Converted")

        # Opportunities
        opp_conditions = [
            Opportunity.lead_source == campaign.name,
            Opportunity.lead_source == campaign.ref
        ]
        if lead_ids:
            conv_res = await db.execute(
                select(Lead.converted_opportunity_id).where(
                    Lead.id.in_(lead_ids),
                    Lead.converted_opportunity_id.isnot(None)
                )
            )
            conv_opp_ids = [oid for oid in conv_res.scalars().all() if oid]
            if conv_opp_ids:
                opp_conditions.append(Opportunity.id.in_(conv_opp_ids))

        opps_res = await db.execute(
            select(Opportunity).where(
                or_(*opp_conditions),
                Opportunity.tenant_id == tenant_id,
                Opportunity.deleted_at.is_(None)
            )
        )
        opps = opps_res.scalars().all()
        opp_count = len(opps)
        closed_won_revenue = sum(o.amount for o in opps if o.stage == "Closed Won") or Decimal("0.00")
        pipeline_influenced = sum(o.amount for o in opps) or Decimal("0.00")

        roi = Decimal("0.00")
        if campaign.actual_cost > 0:
            roi = ((closed_won_revenue - campaign.actual_cost) / campaign.actual_cost) * Decimal("100.0")

        cpl = Decimal("0.00")
        if leads_count > 0 and campaign.actual_cost > 0:
            cpl = campaign.actual_cost / Decimal(leads_count)

        return CampaignAttributionResponse(
            campaign_id=campaign.id,
            campaign_name=campaign.name,
            ref=campaign.ref,
            budget=campaign.budget,
            actual_cost=campaign.actual_cost,
            leads_count=leads_count,
            converted_leads_count=converted_count,
            opportunities_count=opp_count,
            closed_won_revenue=closed_won_revenue,
            pipeline_influenced=pipeline_influenced,
            roi_percentage=round(roi, 2),
            cost_per_lead=round(cpl, 2)
        )
