import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.ai import RevenueScenario, CustomReport
from app.models.crm import Opportunity
from app.schemas.ai import (
    RevenueTwinSimulateRequest,
    RevenueTwinSimulateResponse,
    RevenueScenarioCreate,
    RevenueScenarioResponse,
    CustomReportCreate,
    CustomReportResponse,
    ForecastSummaryResponse,
)
from app.core.errors import NotFoundException
from app.services.audit_service import audit_service

class AnalyticsService:
    """Analytics, revenue forecasting, digital twin simulations, and custom reporting."""

    @staticmethod
    async def _generate_scenario_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(RevenueScenario).where(RevenueScenario.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"SCN-{year}-{count + 1:04d}"

    @staticmethod
    async def _generate_report_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(CustomReport).where(CustomReport.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"RPT-{year}-{count + 1:04d}"

    @staticmethod
    async def simulate_revenue_twin(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        req: RevenueTwinSimulateRequest
    ) -> RevenueTwinSimulateResponse:
        """Simulate revenue impact of probability uplift, launch delay, and commercial discount."""
        stmt = select(Opportunity).where(
            Opportunity.tenant_id == tenant_id,
            Opportunity.deleted_at.is_(None),
            ~Opportunity.stage.in_(["Closed Won", "Closed Lost"])
        )
        res = await db.execute(stmt)
        deals = res.scalars().all()

        open_deals_count = len(deals)
        total_open_pipeline = Decimal("0.00")
        baseline_weighted = Decimal("0.00")
        simulated_weighted = Decimal("0.00")

        prob_uplift = Decimal(str(req.probability_uplift))
        discount_factor = Decimal("1.00") - (Decimal(str(req.discount_pct)) / Decimal("100.00"))

        for d in deals:
            amt = Decimal(str(d.amount or 0.00))
            prob = Decimal(str(d.probability or 50.0))
            total_open_pipeline += amt

            base_w = amt * (prob / Decimal("100.00"))
            baseline_weighted += base_w

            # Adjusted probability clamped [0, 100]
            sim_prob = min(Decimal("100.00"), max(Decimal("0.00"), prob + prob_uplift))
            sim_w = amt * (sim_prob / Decimal("100.00")) * discount_factor
            simulated_weighted += sim_w

        delta = simulated_weighted - baseline_weighted
        commentary = (
            f"Applying +{req.probability_uplift}% win probability uplift with a {req.discount_pct}% commercial discount "
            f"across {open_deals_count} active deals yields a simulated weighted outcome of ${simulated_weighted:,.2f} "
            f"({'+' if delta >= 0 else ''}${delta:,.2f} vs current baseline)."
        )

        return RevenueTwinSimulateResponse(
            baseline_weighted_value=baseline_weighted.quantize(Decimal("0.01")),
            simulated_weighted_value=simulated_weighted.quantize(Decimal("0.01")),
            delta_value=delta.quantize(Decimal("0.01")),
            open_pipeline_total=total_open_pipeline.quantize(Decimal("0.01")),
            open_deals_count=open_deals_count,
            probability_uplift=req.probability_uplift,
            launch_delay_days=req.launch_delay_days,
            discount_pct=req.discount_pct,
            summary_commentary=commentary
        )

    @staticmethod
    async def save_revenue_scenario(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        scenario_in: RevenueScenarioCreate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> RevenueScenarioResponse:
        """Persist a digital twin what-if scenario into the database."""
        # Calculate values
        sim_res = await AnalyticsService.simulate_revenue_twin(
            db, tenant_id=tenant_id,
            req=RevenueTwinSimulateRequest(
                probability_uplift=scenario_in.probability_uplift,
                launch_delay_days=scenario_in.launch_delay_days,
                discount_pct=scenario_in.discount_pct
            )
        )

        ref = await AnalyticsService._generate_scenario_ref(db, tenant_id)
        scenario = RevenueScenario(
            tenant_id=tenant_id,
            ref=ref,
            name=scenario_in.name,
            description=scenario_in.description,
            probability_uplift=scenario_in.probability_uplift,
            launch_delay_days=scenario_in.launch_delay_days,
            discount_pct=scenario_in.discount_pct,
            baseline_pipeline_value=sim_res.baseline_weighted_value,
            projected_pipeline_value=sim_res.simulated_weighted_value,
            delta_value=sim_res.delta_value,
            assumptions=scenario_in.assumptions,
            status="Simulated",
            created_by_name=actor_name or "Active User"
        )
        db.add(scenario)
        await db.commit()
        await db.refresh(scenario)

        await audit_service.log_event(
            db=db,
            action="revenue_twin.scenario_saved",
            resource_type="revenue_scenario",
            resource_id=str(scenario.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": ref, "projected_value": str(scenario.projected_pipeline_value)}
        )

        return RevenueScenarioResponse.model_validate(scenario)

    @staticmethod
    async def list_revenue_scenarios(
        db: AsyncSession,
        tenant_id: uuid.UUID
    ) -> List[RevenueScenarioResponse]:
        stmt = (
            select(RevenueScenario)
            .where(RevenueScenario.tenant_id == tenant_id, RevenueScenario.deleted_at.is_(None))
            .order_by(RevenueScenario.created_at.desc())
        )
        res = await db.execute(stmt)
        items = res.scalars().all()
        return [RevenueScenarioResponse.model_validate(s) for s in items]

    @staticmethod
    async def get_forecast_summary(
        db: AsyncSession,
        tenant_id: uuid.UUID
    ) -> ForecastSummaryResponse:
        """Computes collaborative revenue forecast rollups by stage and forecast category."""
        stmt = select(Opportunity).where(
            Opportunity.tenant_id == tenant_id,
            Opportunity.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        deals = res.scalars().all()

        total_pipe = Decimal("0.00")
        weighted_pipe = Decimal("0.00")
        commit_val = Decimal("0.00")
        best_case_val = Decimal("0.00")
        won_val = Decimal("0.00")
        lost_val = Decimal("0.00")

        by_cat: Dict[str, Decimal] = {"Pipeline": Decimal("0.00"), "Best Case": Decimal("0.00"), "Commit": Decimal("0.00"), "Closed Won": Decimal("0.00"), "Closed Lost": Decimal("0.00")}
        by_stage: Dict[str, Decimal] = {}

        for d in deals:
            amt = Decimal(str(d.amount or 0.00))
            prob = Decimal(str(d.probability or 0.0))
            stage = d.stage or "New"
            cat = d.forecast_category or ("Closed Won" if stage == "Closed Won" else "Closed Lost" if stage == "Closed Lost" else "Pipeline")

            by_stage[stage] = by_stage.get(stage, Decimal("0.00")) + amt
            by_cat[cat] = by_cat.get(cat, Decimal("0.00")) + amt

            if stage == "Closed Won":
                won_val += amt
            elif stage == "Closed Lost":
                lost_val += amt
            else:
                total_pipe += amt
                weighted_pipe += amt * (prob / Decimal("100.00"))
                if cat == "Commit":
                    commit_val += amt
                elif cat == "Best Case":
                    best_case_val += amt

        # Attainment based on sample quarterly target of $500,000
        quarterly_quota = Decimal("500000.00")
        attainment = (won_val / quarterly_quota * Decimal("100.00")).quantize(Decimal("0.01")) if quarterly_quota > 0 else Decimal("0.00")

        return ForecastSummaryResponse(
            total_pipeline=total_pipe.quantize(Decimal("0.01")),
            weighted_pipeline=weighted_pipe.quantize(Decimal("0.01")),
            commit_value=commit_val.quantize(Decimal("0.01")),
            best_case_value=best_case_val.quantize(Decimal("0.01")),
            closed_won_value=won_val.quantize(Decimal("0.01")),
            closed_lost_value=lost_val.quantize(Decimal("0.01")),
            quota_attainment_pct=attainment,
            by_category={k: v.quantize(Decimal("0.01")) for k, v in by_cat.items()},
            by_stage={k: v.quantize(Decimal("0.01")) for k, v in by_stage.items()}
        )

    @staticmethod
    async def list_reports(
        db: AsyncSession,
        tenant_id: uuid.UUID
    ) -> List[CustomReportResponse]:
        stmt = (
            select(CustomReport)
            .where(CustomReport.tenant_id == tenant_id, CustomReport.deleted_at.is_(None))
            .order_by(CustomReport.created_at.desc())
        )
        res = await db.execute(stmt)
        items = res.scalars().all()
        return [CustomReportResponse.model_validate(r) for r in items]

    @staticmethod
    async def create_report(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        report_in: CustomReportCreate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> CustomReportResponse:
        ref = await AnalyticsService._generate_report_ref(db, tenant_id)
        report = CustomReport(
            tenant_id=tenant_id,
            ref=ref,
            name=report_in.name,
            description=report_in.description,
            entity_type=report_in.entity_type,
            report_type=report_in.report_type,
            filters=report_in.filters,
            groupings=report_in.groupings,
            aggregates=report_in.aggregates,
            columns=report_in.columns,
            chart_config=report_in.chart_config,
            created_by_name=actor_name or "Active User"
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)

        await audit_service.log_event(
            db=db,
            action="custom_report.created",
            resource_type="custom_report",
            resource_id=str(report.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": ref, "name": report.name, "entity_type": report.entity_type}
        )

        return CustomReportResponse.model_validate(report)
