import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload

from app.models.crm import Opportunity, OpportunityStageHistory, Pipeline, Account, Contact
from app.schemas.crm import (
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityResponse,
    OpportunityStageTransitionRequest,
    OpportunityStageHistoryResponse,
    PipelineResponse,
    PipelineStageConfig
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

# Standard Blueprint Pipeline Stages & Gates (OP-01)
DEFAULT_STAGES: List[Dict[str, Any]] = [
    {"code": "New Opportunity", "name": "New Opportunity", "probability": 10, "forecast_category": "Pipeline", "order": 1, "gate_requirements": []},
    {"code": "Qualification", "name": "Qualification", "probability": 25, "forecast_category": "Pipeline", "order": 2, "gate_requirements": []},
    {"code": "Discovery", "name": "Discovery", "probability": 40, "forecast_category": "Pipeline", "order": 3, "gate_requirements": ["contact"]},
    {"code": "Proposal", "name": "Proposal", "probability": 65, "forecast_category": "Best Case", "order": 4, "gate_requirements": ["contact", "budget_confirmed", "expected_close_date"]},
    {"code": "Negotiation", "name": "Negotiation", "probability": 85, "forecast_category": "Commit", "order": 5, "gate_requirements": ["contact", "budget_confirmed", "decision_maker_bought_in"]},
    {"code": "Closed Won", "name": "Closed Won", "probability": 100, "forecast_category": "Closed", "order": 6, "gate_requirements": ["win_description"]},
    {"code": "Closed Lost", "name": "Closed Lost", "probability": 0, "forecast_category": "Omitted", "order": 7, "gate_requirements": ["loss_reason"]}
]

class OpportunityService:
    """Service handling sales opportunity lifecycle, pipeline configuration, stage-gate validation and funnel velocity tracking."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(Opportunity).where(Opportunity.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"OPP-{year}-{count + 1:05d}"

    @staticmethod
    async def list_pipelines(db: AsyncSession, tenant_id: uuid.UUID) -> List[PipelineResponse]:
        """List active pipelines for tenant, ensuring a default pipeline exists."""
        stmt = select(Pipeline).where(
            Pipeline.tenant_id == tenant_id,
            Pipeline.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        pipelines = res.scalars().all()

        if not pipelines:
            # Seed standard default pipeline for tenant
            default_pipe = Pipeline(
                tenant_id=tenant_id,
                name="Standard Direct Sales Pipeline",
                code="default",
                description="Default B2B consultative enterprise sales pipeline.",
                is_default=True,
                is_active=True,
                stages_config=DEFAULT_STAGES
            )
            db.add(default_pipe)
            await db.commit()
            await db.refresh(default_pipe)
            pipelines = [default_pipe]

        return [
            PipelineResponse(
                id=p.id,
                tenant_id=p.tenant_id,
                name=p.name,
                code=p.code,
                description=p.description,
                is_default=p.is_default,
                is_active=p.is_active,
                stages=[PipelineStageConfig(**st) for st in p.stages_config]
            )
            for p in pipelines
        ]

    @staticmethod
    async def list_opportunities(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        q: Optional[str] = None,
        stage: Optional[str] = None,
        pipeline_id: Optional[str] = None,
        forecast_category: Optional[str] = None,
        owner_id: Optional[uuid.UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[OpportunityResponse], int, int]:
        query = select(Opportunity).where(
            Opportunity.tenant_id == tenant_id,
            Opportunity.deleted_at.is_(None)
        ).options(
            selectinload(Opportunity.account),
            selectinload(Opportunity.contact),
            selectinload(Opportunity.stage_history)
        )

        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.where(or_(
                Opportunity.name.ilike(term),
                Opportunity.ref.ilike(term)
            ))

        if stage and stage.strip():
            query = query.where(Opportunity.stage == stage.strip())

        if pipeline_id and pipeline_id.strip():
            query = query.where(Opportunity.pipeline_id == pipeline_id.strip())

        if forecast_category and forecast_category.strip():
            query = query.where(Opportunity.forecast_category == forecast_category.strip())

        if owner_id:
            query = query.where(Opportunity.owner_id == owner_id)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        # Sort
        sort_col = getattr(Opportunity, sort_by, Opportunity.created_at)
        if sort_order.lower() == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(sort_col)

        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        res = await db.execute(query)
        opps = res.scalars().all()
        pages = (total + limit - 1) // limit if total > 0 else 1

        items = [OpportunityService._map_response(o) for o in opps]
        return items, total, pages

    @staticmethod
    async def get_opportunity(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        opportunity_id: uuid.UUID
    ) -> OpportunityResponse:
        opp = await OpportunityService._load_opportunity(db, tenant_id, opportunity_id)
        return OpportunityService._map_response(opp)

    @staticmethod
    async def create_opportunity(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        req: OpportunityCreate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> OpportunityResponse:
        # Verify account belongs to tenant
        if not req.account_id:
            raise ValidationException("An opportunity must be associated with an existing account.")

        acc_stmt = select(Account).where(
            Account.id == req.account_id,
            Account.tenant_id == tenant_id,
            Account.deleted_at.is_(None)
        )
        account = (await db.execute(acc_stmt)).scalar_one_or_none()
        if not account:
            raise ValidationException("Specified account does not exist in this organization.")

        # Check contact if provided
        if req.contact_id:
            con_stmt = select(Contact).where(
                Contact.id == req.contact_id,
                Contact.tenant_id == tenant_id,
                Contact.deleted_at.is_(None)
            )
            contact = (await db.execute(con_stmt)).scalar_one_or_none()
            if not contact:
                raise ValidationException("Specified contact does not exist in this organization.")

        ref = await OpportunityService._generate_ref(db, tenant_id)
        now = datetime.now(timezone.utc)

        # Stage defaults
        stage_cfg = next((s for s in DEFAULT_STAGES if s["code"] == req.stage), DEFAULT_STAGES[1])
        prob = req.probability if req.probability is not None else stage_cfg["probability"]
        fc = req.forecast_category or stage_cfg["forecast_category"]

        opp = Opportunity(
            tenant_id=tenant_id,
            account_id=req.account_id,
            contact_id=req.contact_id,
            ref=ref,
            name=req.name.strip(),
            pipeline_id=req.pipeline_id or "default",
            stage=req.stage,
            amount=req.amount or Decimal("0.00"),
            currency=req.currency or "USD",
            probability=prob,
            expected_close_date=req.expected_close_date,
            forecast_category=fc,
            risk_level=req.risk_level or "Low",
            lead_source=req.lead_source,
            stage_entered_at=now,
            budget_confirmed=req.budget_confirmed,
            decision_maker_bought_in=req.decision_maker_bought_in,
            next_step=req.next_step,
            competitor_name=req.competitor_name,
            owner_id=req.owner_id or actor_id,
            owner_name=actor_name,
            custom_fields=req.custom_fields or {},
            created_by=actor_id,
            updated_by=actor_id
        )
        db.add(opp)
        await db.flush()

        # Log initial stage entry history
        initial_history = OpportunityStageHistory(
            tenant_id=tenant_id,
            opportunity_id=opp.id,
            from_stage=None,
            to_stage=opp.stage,
            transition_at=now,
            days_in_previous_stage=Decimal("0.00"),
            actor_id=actor_id,
            actor_name=actor_name,
            notes="Opportunity initiated."
        )
        db.add(initial_history)

        await db.commit()
        await db.refresh(opp)

        await audit_service.log_event(
            db, action="opportunity.created", resource_type="opportunity",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(opp.id), metadata={"ref": opp.ref, "name": opp.name, "amount": str(opp.amount)}
        )

        return await OpportunityService.get_opportunity(db, tenant_id, opp.id)

    @staticmethod
    async def update_opportunity(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        opportunity_id: uuid.UUID,
        req: OpportunityUpdate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> OpportunityResponse:
        opp = await OpportunityService._load_opportunity(db, tenant_id, opportunity_id)

        patch_data = req.model_dump(exclude_unset=True)
        if "stage" in patch_data and patch_data["stage"] != opp.stage:
            # Delegate to validated stage transition
            return await OpportunityService.transition_stage(
                db=db,
                tenant_id=tenant_id,
                opportunity_id=opportunity_id,
                req=OpportunityStageTransitionRequest(
                    to_stage=patch_data["stage"],
                    budget_confirmed=patch_data.get("budget_confirmed"),
                    decision_maker_bought_in=patch_data.get("decision_maker_bought_in"),
                    loss_reason=patch_data.get("loss_reason"),
                    win_description=patch_data.get("win_description"),
                    competitor_name=patch_data.get("competitor_name"),
                    notes="Updated via edit form"
                ),
                actor_id=actor_id,
                actor_name=actor_name
            )

        for k, v in patch_data.items():
            if hasattr(opp, k):
                setattr(opp, k, v)

        opp.updated_at = datetime.now(timezone.utc)
        opp.updated_by = actor_id
        await db.commit()
        await db.refresh(opp)

        return OpportunityService._map_response(opp)

    @staticmethod
    async def transition_stage(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        opportunity_id: uuid.UUID,
        req: OpportunityStageTransitionRequest,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> OpportunityResponse:
        """Controlled stage progression enforcing stage-gate validation and logging stage durations (OP-01, OP-02)."""
        opp = await OpportunityService._load_opportunity(db, tenant_id, opportunity_id)

        if opp.stage == req.to_stage:
            return OpportunityService._map_response(opp)

        target_stage_cfg = next((s for s in DEFAULT_STAGES if s["code"] == req.to_stage), None)
        if not target_stage_cfg:
            raise ValidationException(f"Invalid target pipeline stage: '{req.to_stage}'.")

        # Stage-Gate Validation Engine (OP-01)
        gates = target_stage_cfg.get("gate_requirements", [])

        # 1. Gate: Contact required
        if "contact" in gates and not opp.contact_id:
            raise ValidationException(
                f"Stage gate validation failed for '{req.to_stage}': A designated stakeholder contact is required."
            )

        # 2. Gate: Budget confirmation
        budget_ok = req.budget_confirmed if req.budget_confirmed is not None else opp.budget_confirmed
        if "budget_confirmed" in gates and not budget_ok:
            raise ValidationException(
                f"Stage gate validation failed for '{req.to_stage}': Budget must be confirmed before advancing."
            )

        # 3. Gate: Expected close date
        if "expected_close_date" in gates and not opp.expected_close_date:
            raise ValidationException(
                f"Stage gate validation failed for '{req.to_stage}': Expected close date must be defined."
            )

        # 4. Gate: Decision maker buy-in
        dm_ok = req.decision_maker_bought_in if req.decision_maker_bought_in is not None else opp.decision_maker_bought_in
        if "decision_maker_bought_in" in gates and not dm_ok:
            raise ValidationException(
                f"Stage gate validation failed for '{req.to_stage}': Key decision-maker alignment is required before negotiation."
            )

        # 5. Gate: Win description
        win_desc = req.win_description or opp.win_description
        if "win_description" in gates and not win_desc:
            raise ValidationException(
                "Stage gate validation failed: Closing as Won requires a brief win summary."
            )

        # 6. Gate: Loss reason
        loss_rsn = req.loss_reason or opp.loss_reason
        if "loss_reason" in gates and not loss_rsn:
            raise ValidationException(
                "Stage gate validation failed: Closing as Lost requires a documented loss reason."
            )

        now = datetime.now(timezone.utc)
        prev_entered_at = opp.stage_entered_at or opp.created_at
        if prev_entered_at.tzinfo is None:
            prev_entered_at = prev_entered_at.replace(tzinfo=timezone.utc)
        # Duration calculation in fractional days (OP-02)
        elapsed_seconds = max((now - prev_entered_at).total_seconds(), 0)
        days_in_stage = Decimal(str(round(elapsed_seconds / 86400.0, 2)))

        from_stage = opp.stage

        # Apply state updates
        opp.stage = req.to_stage
        opp.probability = target_stage_cfg["probability"]
        opp.forecast_category = target_stage_cfg["forecast_category"]
        opp.stage_entered_at = now
        opp.updated_at = now
        opp.updated_by = actor_id

        if req.budget_confirmed is not None:
            opp.budget_confirmed = req.budget_confirmed
        if req.decision_maker_bought_in is not None:
            opp.decision_maker_bought_in = req.decision_maker_bought_in
        if req.loss_reason is not None:
            opp.loss_reason = req.loss_reason
        if req.win_description is not None:
            opp.win_description = req.win_description
        if req.competitor_name is not None:
            opp.competitor_name = req.competitor_name

        # Record Stage History
        history = OpportunityStageHistory(
            tenant_id=tenant_id,
            opportunity_id=opp.id,
            from_stage=from_stage,
            to_stage=req.to_stage,
            transition_at=now,
            days_in_previous_stage=days_in_stage,
            actor_id=actor_id,
            actor_name=actor_name,
            notes=req.notes
        )
        db.add(history)

        await db.commit()
        await db.refresh(opp)

        await audit_service.log_event(
            db, action="opportunity.stage_changed", resource_type="opportunity",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(opp.id),
            metadata={
                "from_stage": from_stage,
                "to_stage": req.to_stage,
                "days_in_previous_stage": float(days_in_stage),
                "probability": opp.probability
            }
        )

        return await OpportunityService.get_opportunity(db, tenant_id, opp.id)

    @staticmethod
    async def delete_opportunity(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        opportunity_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> None:
        opp = await OpportunityService._load_opportunity(db, tenant_id, opportunity_id)
        opp.deleted_at = datetime.now(timezone.utc)
        opp.updated_by = actor_id

        await audit_service.log_event(
            db, action="opportunity.deleted", resource_type="opportunity",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(opp.id), metadata={"ref": opp.ref, "name": opp.name}
        )
        await db.commit()

    @staticmethod
    async def _load_opportunity(db: AsyncSession, tenant_id: uuid.UUID, opp_id: uuid.UUID) -> Opportunity:
        stmt = select(Opportunity).where(
            Opportunity.id == opp_id,
            Opportunity.tenant_id == tenant_id,
            Opportunity.deleted_at.is_(None)
        ).options(
            selectinload(Opportunity.account),
            selectinload(Opportunity.contact),
            selectinload(Opportunity.stage_history)
        )
        res = await db.execute(stmt)
        opp = res.scalar_one_or_none()
        if not opp:
            raise NotFoundException("Opportunity not found.")
        return opp

    @staticmethod
    def _map_response(o: Opportunity) -> OpportunityResponse:
        def get_tz_aware_dt(dt: datetime) -> datetime:
            return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)

        hist = [
            OpportunityStageHistoryResponse(
                id=h.id,
                opportunity_id=h.opportunity_id,
                from_stage=h.from_stage,
                to_stage=h.to_stage,
                transition_at=h.transition_at,
                days_in_previous_stage=h.days_in_previous_stage,
                actor_id=h.actor_id,
                actor_name=h.actor_name,
                notes=h.notes
            )
            for h in sorted(o.stage_history or [], key=lambda x: get_tz_aware_dt(x.transition_at), reverse=True)
        ]

        return OpportunityResponse(
            id=o.id,
            tenant_id=o.tenant_id,
            account_id=o.account_id,
            account_name=o.account.name if o.account else None,
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
            stage_entered_at=o.stage_entered_at,
            budget_confirmed=o.budget_confirmed,
            decision_maker_bought_in=o.decision_maker_bought_in,
            next_step=o.next_step,
            competitor_name=o.competitor_name,
            loss_reason=o.loss_reason,
            win_description=o.win_description,
            owner_id=o.owner_id,
            owner_name=o.owner_name,
            custom_fields=o.custom_fields or {},
            stage_history=hist,
            created_at=o.created_at,
            updated_at=o.updated_at
        )
