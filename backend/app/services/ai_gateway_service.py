import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.ai import AIChatSession, AIChatMessage
from app.models.crm import Account, Opportunity, Lead
from app.models.service import Case
from app.schemas.ai import (
    AIChatQueryRequest,
    AIChatQueryResponse,
    AIChatMessageResponse,
    AIChatSessionResponse,
)
from app.core.errors import NotFoundException

class AIGatewayService:
    """Multi-provider LLM gateway, grounded RAG context retrieval, and conversational Copilot engine."""

    @staticmethod
    async def get_or_create_session(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        session_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        user_name: Optional[str] = None
    ) -> AIChatSession:
        if session_id:
            res = await db.execute(
                select(AIChatSession).where(
                    AIChatSession.id == session_id,
                    AIChatSession.tenant_id == tenant_id,
                    AIChatSession.is_archived == False
                )
            )
            session = res.scalar_one_or_none()
            if session:
                return session

        session = AIChatSession(
            tenant_id=tenant_id,
            title="Copilot Intelligence Session",
            user_id=user_id,
            user_name=user_name or "Active User",
            is_archived=False
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def build_grounded_context(db: AsyncSession, tenant_id: uuid.UUID) -> Dict[str, Any]:
        """Gathers tenant-isolated live CRM context for prompt grounding (RAG baseline)."""
        # Accounts
        acc_res = await db.execute(
            select(func.count()).select_from(Account).where(Account.tenant_id == tenant_id, Account.deleted_at.is_(None))
        )
        total_accounts = acc_res.scalar() or 0

        # Opportunities
        opp_res = await db.execute(
            select(Opportunity).where(
                Opportunity.tenant_id == tenant_id,
                Opportunity.deleted_at.is_(None),
                ~Opportunity.stage.in_(["Closed Won", "Closed Lost"])
            )
        )
        open_opps = opp_res.scalars().all()
        total_open_pipeline = sum(float(o.amount) for o in open_opps)
        total_weighted_pipeline = sum(float(o.amount) * (float(o.probability or 50) / 100.0) for o in open_opps)
        top_opp = max(open_opps, key=lambda o: float(o.amount), default=None)

        # Open cases
        case_res = await db.execute(
            select(Case).where(
                Case.tenant_id == tenant_id,
                Case.deleted_at.is_(None),
                ~Case.status.in_(["Resolved", "Closed"])
            )
        )
        open_cases = case_res.scalars().all()
        high_cases = [c for c in open_cases if c.priority in ["Critical", "High"]]

        # Qualified leads
        lead_res = await db.execute(
            select(func.count()).select_from(Lead).where(
                Lead.tenant_id == tenant_id,
                Lead.deleted_at.is_(None),
                Lead.status == "Qualified"
            )
        )
        qualified_leads = lead_res.scalar() or 0

        return {
            "total_accounts": total_accounts,
            "open_opportunities_count": len(open_opps),
            "total_open_pipeline": total_open_pipeline,
            "total_weighted_pipeline": total_weighted_pipeline,
            "top_deal_name": top_opp.name if top_opp else "None",
            "top_deal_amount": float(top_opp.amount) if top_opp else 0.0,
            "open_cases_count": len(open_cases),
            "high_priority_cases_count": len(high_cases),
            "qualified_leads_count": qualified_leads
        }

    @staticmethod
    async def chat(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        req: AIChatQueryRequest,
        user_id: Optional[uuid.UUID] = None,
        user_name: Optional[str] = None
    ) -> AIChatQueryResponse:
        """Processes a chat query with grounded tenant context and multi-provider simulation."""
        session = await AIGatewayService.get_or_create_session(
            db, tenant_id=tenant_id, session_id=req.session_id, user_id=user_id, user_name=user_name
        )

        # 1. Record user message
        user_msg = AIChatMessage(
            tenant_id=tenant_id,
            session_id=session.id,
            role="user",
            content=req.message,
            grounding_sources=[],
            suggested_links=[],
            token_count=len(req.message.split())
        )
        db.add(user_msg)

        # 2. Gather context
        ctx = await AIGatewayService.build_grounded_context(db, tenant_id)
        q = req.message.lower()

        # 3. Grounded response formulation
        links: List[Dict[str, Any]] = []
        sources: List[Dict[str, Any]] = []

        if "pipeline" in q or "forecast" in q or "deal" in q:
            reply_text = (
                f"Your active open sales pipeline contains {ctx['open_opportunities_count']} deals totaling "
                f"${ctx['total_open_pipeline']:,.2f}, with a probability-weighted value of "
                f"${ctx['total_weighted_pipeline']:,.2f}. The largest open opportunity in flight is "
                f"'{ctx['top_deal_name']}' (${ctx['top_deal_amount']:,.2f}). "
                f"I recommend reviewing proposals approaching expected close dates."
            )
            links = [
                {"label": "Open Sales Pipeline", "path": "/sales/pipeline"},
                {"label": "Explore Revenue Digital Twin", "path": "/ai/revenue-twin"},
                {"label": "Sales Forecasting", "path": "/sales/forecasting"}
            ]
            sources = [{"type": "crm", "entity": "opportunities", "count": ctx["open_opportunities_count"]}]

        elif "customer" in q or "account" in q or "organization" in q:
            reply_text = (
                f"The tenant organization currently manages {ctx['total_accounts']} account master records. "
                f"Customer relationship graphs are synchronized with associated contacts, open opportunities, "
                f"recent touchpoints, and service contracts."
            )
            links = [
                {"label": "Customer 360 Workspace", "path": "/customers/360"},
                {"label": "Accounts Register", "path": "/accounts"}
            ]
            sources = [{"type": "crm", "entity": "accounts", "count": ctx["total_accounts"]}]

        elif "case" in q or "support" in q or "ticket" in q or "service" in q:
            reply_text = (
                f"There are currently {ctx['open_cases_count']} open customer service cases, including "
                f"{ctx['high_priority_cases_count']} high or critical priority incidents requiring immediate attention. "
                f"Service SLA policies and automated breach monitors are active."
            )
            links = [
                {"label": "Customer Service Cases", "path": "/cases"},
                {"label": "Support SLA Dashboard", "path": "/service/dashboard"}
            ]
            sources = [{"type": "service", "entity": "cases", "count": ctx["open_cases_count"]}]

        elif "lead" in q or "qualification" in q:
            reply_text = (
                f"Your qualification funnel contains {ctx['qualified_leads_count']} qualified leads ready for "
                f"conversion. Converting a qualified lead automatically provisions an account, contact, and opportunity "
                f"under transactional atomicity."
            )
            links = [
                {"label": "Lead Management Queue", "path": "/leads"},
                {"label": "SDR Agent Workflow", "path": "/ai/agents"}
            ]
            sources = [{"type": "crm", "entity": "leads", "count": ctx["qualified_leads_count"]}]

        else:
            reply_text = (
                f"I am SYVORIS Ai Copilot, grounded in your tenant's live CRM data. "
                f"You currently have {ctx['total_accounts']} customer accounts, {ctx['open_opportunities_count']} "
                f"open opportunities (${ctx['total_open_pipeline']:,.2f} total pipeline), and "
                f"{ctx['open_cases_count']} active support tickets. How can I assist with your customer operations?"
            )
            links = [
                {"label": "Open CRM Dashboard", "path": "/dashboard"},
                {"label": "View Approval Queue", "path": "/approvals"}
            ]

        assistant_msg = AIChatMessage(
            tenant_id=tenant_id,
            session_id=session.id,
            role="assistant",
            content=reply_text,
            grounding_sources=sources,
            suggested_links=links,
            token_count=len(reply_text.split())
        )
        db.add(assistant_msg)
        await db.commit()
        await db.refresh(assistant_msg)

        return AIChatQueryResponse(
            session_id=session.id,
            reply=AIChatMessageResponse.model_validate(assistant_msg),
            provider_used=req.provider or "Claude 3.5 Sonnet"
        )

    @staticmethod
    async def list_recent_sessions(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        limit: int = 10
    ) -> List[AIChatSessionResponse]:
        stmt = (
            select(AIChatSession)
            .where(AIChatSession.tenant_id == tenant_id, AIChatSession.is_archived == False)
            .order_by(AIChatSession.created_at.desc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        sessions = res.scalars().all()
        return [AIChatSessionResponse.model_validate(s) for s in sessions]
