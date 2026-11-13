import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload

from app.models.service import CustomerSurvey, SurveyResponse, Case
from app.models.crm import Account, Contact
from app.schemas.service import (
    CustomerSurveyCreate,
    CustomerSurveyUpdate,
    CustomerSurveyResponse,
    SurveyResponseCreate,
    SurveyResponseItem,
    CSATSummaryResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class FeedbackService:
    """Service managing customer feedback, CSAT/NPS surveys, sentiment and ratings."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(CustomerSurvey).where(CustomerSurvey.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"SRV-{year}-{count + 1:05d}"

    @staticmethod
    async def list_surveys(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        is_active: Optional[bool] = None
    ) -> List[CustomerSurveyResponse]:
        stmt = select(CustomerSurvey).where(
            CustomerSurvey.tenant_id == tenant_id,
            CustomerSurvey.deleted_at.is_(None)
        )
        if is_active is not None:
            stmt = stmt.where(CustomerSurvey.is_active == is_active)

        stmt = stmt.order_by(CustomerSurvey.created_at.desc())
        res = await db.execute(stmt)
        surveys = res.scalars().all()

        if not surveys:
            # Seed default CSAT and NPS surveys
            csat_ref = await FeedbackService._generate_ref(db, tenant_id)
            csat = CustomerSurvey(
                tenant_id=tenant_id,
                ref=csat_ref,
                title="Post-Service CSAT Satisfaction Survey",
                survey_type="CSAT",
                trigger_event="case.resolved",
                is_active=True,
                custom_fields={
                    "questions": [
                        {"id": "q1", "text": "How satisfied were you with the resolution of your issue?", "scale": 5}
                    ]
                }
            )
            db.add(csat)

            nps_ref = await FeedbackService._generate_ref(db, tenant_id)
            nps = CustomerSurvey(
                tenant_id=tenant_id,
                ref=nps_ref,
                title="Customer Relationship NPS Survey",
                survey_type="NPS",
                trigger_event="quarterly",
                is_active=True,
                custom_fields={
                    "questions": [
                        {"id": "q1", "text": "How likely are you to recommend SYVORIS Ai to a colleague?", "scale": 10}
                    ]
                }
            )
            db.add(nps)
            await db.commit()

            res = await db.execute(stmt)
            surveys = res.scalars().all()

        results: List[CustomerSurveyResponse] = []
        for s in surveys:
            # Calculate stats
            r_stmt = select(func.count(), func.avg(SurveyResponse.score)).where(
                SurveyResponse.survey_id == s.id,
                SurveyResponse.deleted_at.is_(None)
            )
            r_res = await db.execute(r_stmt)
            row = r_res.first()
            count = row[0] or 0
            avg_score = Decimal(str(round(row[1], 2))) if row and row[1] is not None else Decimal("0.00")

            resp = CustomerSurveyResponse.model_validate(s)
            resp.response_count = count
            resp.average_score = avg_score
            results.append(resp)

        return results

    @staticmethod
    async def get_survey(db: AsyncSession, survey_id: uuid.UUID, tenant_id: uuid.UUID) -> CustomerSurveyResponse:
        stmt = select(CustomerSurvey).where(
            CustomerSurvey.id == survey_id,
            CustomerSurvey.tenant_id == tenant_id,
            CustomerSurvey.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        s = res.scalar_one_or_none()
        if not s:
            raise NotFoundException("Survey not found.")

        r_stmt = select(func.count(), func.avg(SurveyResponse.score)).where(
            SurveyResponse.survey_id == s.id,
            SurveyResponse.deleted_at.is_(None)
        )
        r_res = await db.execute(r_stmt)
        row = r_res.first()
        count = row[0] or 0
        avg_score = Decimal(str(round(row[1], 2))) if row and row[1] is not None else Decimal("0.00")

        resp = CustomerSurveyResponse.model_validate(s)
        resp.response_count = count
        resp.average_score = avg_score
        return resp

    @staticmethod
    async def create_survey(
        db: AsyncSession,
        survey_in: CustomerSurveyCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> CustomerSurveyResponse:
        ref = await FeedbackService._generate_ref(db, tenant_id)
        survey = CustomerSurvey(
            tenant_id=tenant_id,
            ref=ref,
            title=survey_in.title,
            survey_type=survey_in.survey_type,
            trigger_event=survey_in.trigger_event,
            is_active=survey_in.is_active,
            custom_fields={"questions": survey_in.questions, **survey_in.custom_fields}
        )
        db.add(survey)
        await db.commit()
        await db.refresh(survey)

        await audit_service.log_event(
            db=db,
            action="survey.created",
            resource_type="survey",
            resource_id=str(survey.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": ref, "title": survey.title, "type": survey.survey_type}
        )

        return CustomerSurveyResponse.model_validate(survey)

    @staticmethod
    async def submit_response(
        db: AsyncSession,
        resp_in: SurveyResponseCreate,
        tenant_id: uuid.UUID
    ) -> SurveyResponseItem:
        # Determine sentiment
        sentiment = resp_in.sentiment or "Neutral"
        if resp_in.score >= 4:
            sentiment = "Positive"
        elif resp_in.score <= 2:
            sentiment = "Negative"

        response = SurveyResponse(
            tenant_id=tenant_id,
            survey_id=resp_in.survey_id,
            case_id=resp_in.case_id,
            account_id=resp_in.account_id,
            contact_id=resp_in.contact_id,
            score=resp_in.score,
            sentiment=sentiment,
            feedback_text=resp_in.feedback_text,
            custom_fields=resp_in.answers
        )
        db.add(response)

        # If linked to a case, update case's csat_score
        if resp_in.case_id:
            c_res = await db.execute(
                select(Case).where(Case.id == resp_in.case_id, Case.tenant_id == tenant_id, Case.deleted_at.is_(None))
            )
            c = c_res.scalar_one_or_none()
            if c:
                c.csat_score = resp_in.score

        await db.commit()
        await db.refresh(response)

        item = SurveyResponseItem.model_validate(response)
        item.answers = response.custom_fields or {}
        return item

    @staticmethod
    async def list_responses(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        survey_id: Optional[uuid.UUID] = None,
        case_id: Optional[uuid.UUID] = None,
        account_id: Optional[uuid.UUID] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[SurveyResponseItem], int, int]:
        stmt = (
            select(SurveyResponse)
            .where(SurveyResponse.tenant_id == tenant_id, SurveyResponse.deleted_at.is_(None))
            .order_by(SurveyResponse.created_at.desc())
        )

        if survey_id:
            stmt = stmt.where(SurveyResponse.survey_id == survey_id)
        if case_id:
            stmt = stmt.where(SurveyResponse.case_id == case_id)
        if account_id:
            stmt = stmt.where(SurveyResponse.account_id == account_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.offset((page - 1) * limit).limit(limit)
        res = await db.execute(stmt)
        items = res.scalars().all()
        pages = (total + limit - 1) // limit if total > 0 else 1

        result: List[SurveyResponseItem] = []
        for r in items:
            item = SurveyResponseItem.model_validate(r)
            item.answers = r.custom_fields or {}
            if r.account_id:
                acc = await db.get(Account, r.account_id)
                if acc:
                    item.account_name = acc.name
            if r.contact_id:
                ct = await db.get(Contact, r.contact_id)
                if ct:
                    item.contact_name = f"{ct.first_name} {ct.last_name}"
            result.append(item)

        return result, total, pages

    @staticmethod
    async def get_csat_summary(db: AsyncSession, tenant_id: uuid.UUID) -> CSATSummaryResponse:
        stmt = select(SurveyResponse).where(
            SurveyResponse.tenant_id == tenant_id,
            SurveyResponse.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        responses = res.scalars().all()
        total = len(responses)

        if total == 0:
            return CSATSummaryResponse(
                total_responses=0,
                average_csat=Decimal("0.00"),
                csat_percentage=Decimal("0.00"),
                nps_score=0,
                positive_count=0,
                neutral_count=0,
                negative_count=0
            )

        avg_csat = sum(r.score for r in responses) / total
        positive = sum(1 for r in responses if r.sentiment == "Positive" or r.score >= 4)
        neutral = sum(1 for r in responses if r.sentiment == "Neutral" or r.score == 3)
        negative = sum(1 for r in responses if r.sentiment == "Negative" or r.score <= 2)

        csat_pct = (positive / total) * 100.0

        # NPS calculation: Promoters (9-10) - Detractors (0-6)
        promoters = sum(1 for r in responses if r.score >= 9)
        detractors = sum(1 for r in responses if r.score <= 6)
        nps = int(((promoters - detractors) / total) * 100) if total > 0 else 0

        return CSATSummaryResponse(
            total_responses=total,
            average_csat=Decimal(str(round(avg_csat, 2))),
            csat_percentage=Decimal(str(round(csat_pct, 1))),
            nps_score=nps,
            positive_count=positive,
            neutral_count=neutral,
            negative_count=negative
        )
