import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_

from app.models.ai import AIAgent, AIProposal
from app.schemas.ai import (
    AIAgentCreate,
    AIAgentUpdate,
    AIAgentResponse,
    AIProposalCreate,
    AIProposalResponse,
    AIProposalDecisionRequest,
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

STANDARD_SPECIALIST_PERSONAS = [
    {
        "name": "SDR Agent",
        "persona": "SDR",
        "module": "CRM",
        "role_description": "Lead qualification, enrichment, and initial routing.",
        "autonomy_level": "Suggest Only",
        "primary_kpi": "Qualification velocity",
        "tool_permissions": ["leads:read", "leads:write", "enrichment:read"],
        "system_prompt": "You are the SDR Agent. Analyze inbound inquiries, score intent, verify corporate domain information, and route to appropriate territory queues."
    },
    {
        "name": "Deal Agent",
        "persona": "Deal",
        "module": "Sales",
        "role_description": "Deal health monitoring, stalled deal detection, and stakeholder gap alerts.",
        "autonomy_level": "Suggest Only",
        "primary_kpi": "Win rate uplift",
        "tool_permissions": ["opportunities:read", "contacts:read", "activities:read"],
        "system_prompt": "You are the Deal Agent. Monitor stage velocity, detect deal stall risks, and alert account teams when key economic decision makers are missing."
    },
    {
        "name": "Quote Agent",
        "persona": "Quote",
        "module": "CPQ",
        "role_description": "Quote drafting and margin guardrail verification.",
        "autonomy_level": "Act with Approval",
        "primary_kpi": "Margin compliance",
        "tool_permissions": ["quotes:read", "quotes:write", "products:read", "pricing:read"],
        "system_prompt": "You are the Quote Agent. Draft commercial quotations, enforce gross margin thresholds, and stage discount approval requests."
    },
    {
        "name": "Service Agent",
        "persona": "Service",
        "module": "Service",
        "role_description": "Knowledge retrieval and draft case response formulation.",
        "autonomy_level": "Suggest Only",
        "primary_kpi": "First contact resolution",
        "tool_permissions": ["cases:read", "knowledge:read", "interactions:read"],
        "system_prompt": "You are the Service Agent. Formulate high-quality technical support responses grounded strictly in verified knowledge articles."
    },
    {
        "name": "Save-Play Agent",
        "persona": "Save-Play",
        "module": "Customer Success",
        "role_description": "Churn risk detection and account retention playbooks.",
        "autonomy_level": "Act with Approval",
        "primary_kpi": "Net revenue retention",
        "tool_permissions": ["accounts:read", "cases:read", "surveys:read"],
        "system_prompt": "You are the Save-Play Agent. Identify early indicators of account dissatisfaction, executive turnover, or usage drops, and trigger proactive retention plays."
    },
    {
        "name": "Compliance Guardian",
        "persona": "Compliance",
        "module": "Governance",
        "role_description": "Policy supervision across consent rules and export controls.",
        "autonomy_level": "Act Autonomously",
        "primary_kpi": "Zero compliance breaches",
        "tool_permissions": ["audit:read", "contacts:read", "terms:read"],
        "system_prompt": "You are the Compliance Guardian. Verify customer consent preferences, GDPR/CCPA suppression lists, and export sanctions before communications dispatch."
    },
    {
        "name": "Negotiation Agent",
        "persona": "Negotiation",
        "module": "Revenue Operations",
        "role_description": "Margin-preserving commercial discount recommendations.",
        "autonomy_level": "Suggest Only",
        "primary_kpi": "Discount containment",
        "tool_permissions": ["quotes:read", "opportunities:read", "pricing:read"],
        "system_prompt": "You are the Negotiation Agent. Propose tiered term concessions, multi-year prepay incentives, and give-get negotiation strategies."
    },
    {
        "name": "Pricing Agent",
        "persona": "Pricing",
        "module": "Commercial Operations",
        "role_description": "Dynamic pricing intelligence based on historical win rates and volume.",
        "autonomy_level": "Suggest Only",
        "primary_kpi": "Average deal size",
        "tool_permissions": ["price_books:read", "products:read", "quotes:read"],
        "system_prompt": "You are the Pricing Agent. Analyze deal size cohorts and historical win/loss ratios to suggest optimal discount price points."
    },
    {
        "name": "Forecast Agent",
        "persona": "Forecast",
        "module": "Sales Operations",
        "role_description": "Win probability analysis and pipeline movement commentary.",
        "autonomy_level": "Suggest Only",
        "primary_kpi": "Forecast accuracy",
        "tool_permissions": ["opportunities:read", "pipelines:read"],
        "system_prompt": "You are the Forecast Agent. Provide continuous telemetry on quarterly commit reliability, slip probabilities, and pipeline coverage ratios."
    },
    {
        "name": "Inventory Agent",
        "persona": "Inventory",
        "module": "Operations",
        "role_description": "Availability-to-promise checks and stockout risk alerts.",
        "autonomy_level": "Suggest Only",
        "primary_kpi": "Order fill rate",
        "tool_permissions": ["inventory:read", "catalog:read", "orders:read"],
        "system_prompt": "You are the Inventory Agent. Verify inventory stock balance across fulfillment centers and alert sales reps to lead-time constraints."
    },
    {
        "name": "Data Steward",
        "persona": "Data Steward",
        "module": "Data Governance",
        "role_description": "Duplicate detection, incomplete record remediation, and entity resolution.",
        "autonomy_level": "Act with Approval",
        "primary_kpi": "Data health score",
        "tool_permissions": ["accounts:read", "accounts:write", "contacts:read", "contacts:write"],
        "system_prompt": "You are the Data Steward. Identify duplicate account and contact records, propose canonical merges, and enrich missing company fields."
    },
    {
        "name": "Meeting Agent",
        "persona": "Meeting",
        "module": "Sales Operations",
        "role_description": "Meeting transcription summarization and follow-up task generation.",
        "autonomy_level": "Act with Approval",
        "primary_kpi": "Post-meeting action velocity",
        "tool_permissions": ["activities:read", "activities:write", "tasks:write"],
        "system_prompt": "You are the Meeting Agent. Extract commitments, objections, and next steps from call notes, and stage follow-up calendar tasks."
    },
    {
        "name": "Knowledge Agent",
        "persona": "Knowledge",
        "module": "Service Operations",
        "role_description": "Automated article drafting from verified case resolutions.",
        "autonomy_level": "Act with Approval",
        "primary_kpi": "Knowledge base coverage",
        "tool_permissions": ["cases:read", "knowledge:read", "knowledge:write"],
        "system_prompt": "You are the Knowledge Agent. Synthesize verified support engineering case resolutions into structured internal and public knowledge base articles."
    },
    {
        "name": "CRM Administrator Agent",
        "persona": "CRM Administrator",
        "module": "Platform Administration",
        "role_description": "Natural language configuration and workflow drafting.",
        "autonomy_level": "Act with Approval",
        "primary_kpi": "Admin task cycle time",
        "tool_permissions": ["workflows:read", "workflows:write", "roles:read"],
        "system_prompt": "You are the CRM Administrator Agent. Translate natural language business requests into reviewable workflow triggers, approval matrices, and picklist definitions."
    }
]

class AIAgentService:
    @staticmethod
    async def _generate_agent_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(AIAgent).where(AIAgent.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        return f"AGT-{count + 1:04d}"

    @staticmethod
    async def _generate_proposal_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(AIProposal).where(AIProposal.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"AIP-{year}-{count + 1:05d}"

    @staticmethod
    async def seed_default_agents(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        owner_id: Optional[uuid.UUID] = None,
        owner_name: Optional[str] = None
    ) -> List[AIAgent]:
        """Seed all 14 specialist personas if tenant has none."""
        stmt = select(AIAgent).where(AIAgent.tenant_id == tenant_id, AIAgent.deleted_at.is_(None))
        res = await db.execute(stmt)
        existing = res.scalars().all()
        if existing:
            return list(existing)

        seeded: List[AIAgent] = []
        for defn in STANDARD_SPECIALIST_PERSONAS:
            ref = await AIAgentService._generate_agent_ref(db, tenant_id)
            agent = AIAgent(
                tenant_id=tenant_id,
                ref=ref,
                name=defn["name"],
                persona=defn["persona"],
                module=defn["module"],
                role_description=defn["role_description"],
                autonomy_level=defn["autonomy_level"],
                status="Active",
                system_prompt=defn["system_prompt"],
                tool_permissions=defn["tool_permissions"],
                primary_kpi=defn["primary_kpi"],
                owner_id=owner_id,
                owner_name=owner_name or "System Administrator",
                metrics={"proposals_count": 0, "approved_count": 0, "accuracy_score": 0.94},
                custom_fields={}
            )
            db.add(agent)
            seeded.append(agent)

        await db.commit()
        for a in seeded:
            await db.refresh(a)
        return seeded

    @staticmethod
    async def list_agents(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        persona: Optional[str] = None,
        module: Optional[str] = None,
        autonomy_level: Optional[str] = None,
        status: Optional[str] = None,
        owner_id: Optional[uuid.UUID] = None,
        owner_name: Optional[str] = None
    ) -> List[AIAgentResponse]:
        """List specialist workforce agents, auto-seeding the 14 personas if empty."""
        stmt = select(AIAgent).where(AIAgent.tenant_id == tenant_id, AIAgent.deleted_at.is_(None))
        if persona:
            stmt = stmt.where(AIAgent.persona == persona)
        if module:
            stmt = stmt.where(AIAgent.module == module)
        if autonomy_level:
            stmt = stmt.where(AIAgent.autonomy_level == autonomy_level)
        if status:
            stmt = stmt.where(AIAgent.status == status)

        res = await db.execute(stmt.order_by(AIAgent.created_at.asc()))
        agents = res.scalars().all()

        if not agents and not persona and not module and not autonomy_level and not status:
            seeded = await AIAgentService.seed_default_agents(db, tenant_id, owner_id=owner_id, owner_name=owner_name)
            return [AIAgentResponse.model_validate(a) for a in seeded]

        return [AIAgentResponse.model_validate(a) for a in agents]

    @staticmethod
    async def get_agent(db: AsyncSession, agent_id: uuid.UUID, tenant_id: uuid.UUID) -> AIAgentResponse:
        stmt = select(AIAgent).where(
            AIAgent.id == agent_id,
            AIAgent.tenant_id == tenant_id,
            AIAgent.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        agent = res.scalar_one_or_none()
        if not agent:
            raise NotFoundException("AI agent not found.")
        return AIAgentResponse.model_validate(agent)

    @staticmethod
    async def update_agent(
        db: AsyncSession,
        agent_id: uuid.UUID,
        tenant_id: uuid.UUID,
        agent_in: AIAgentUpdate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> AIAgentResponse:
        stmt = select(AIAgent).where(
            AIAgent.id == agent_id,
            AIAgent.tenant_id == tenant_id,
            AIAgent.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        agent = res.scalar_one_or_none()
        if not agent:
            raise NotFoundException("AI agent not found.")

        update_dict = agent_in.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(agent, key, val)

        await db.commit()
        await db.refresh(agent)

        await audit_service.log_event(
            db=db,
            action="ai_agent.updated",
            resource_type="ai_agent",
            resource_id=str(agent.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": agent.ref, "name": agent.name, "autonomy_level": agent.autonomy_level}
        )

        return AIAgentResponse.model_validate(agent)

    @staticmethod
    async def list_proposals(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        status: Optional[str] = None,
        agent_id: Optional[uuid.UUID] = None
    ) -> List[AIProposalResponse]:
        """List proposals requiring human decision or review."""
        stmt = select(AIProposal).where(AIProposal.tenant_id == tenant_id, AIProposal.deleted_at.is_(None))
        if status:
            stmt = stmt.where(AIProposal.status == status)
        if agent_id:
            stmt = stmt.where(AIProposal.agent_id == agent_id)

        res = await db.execute(stmt.order_by(AIProposal.created_at.desc()))
        items = res.scalars().all()
        return [AIProposalResponse.model_validate(p) for p in items]

    @staticmethod
    async def create_proposal(
        db: AsyncSession,
        proposal_in: AIProposalCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> AIProposalResponse:
        """Create an actionable proposal under the three-tier governance policy."""
        # Check agent autonomy
        agent_res = await db.execute(
            select(AIAgent).where(AIAgent.id == proposal_in.agent_id, AIAgent.tenant_id == tenant_id)
        )
        agent = agent_res.scalar_one_or_none()
        if not agent:
            raise NotFoundException("Governing agent not found.")

        ref = await AIAgentService._generate_proposal_ref(db, tenant_id)
        initial_status = "Pending Approval" if agent.autonomy_level == "Act with Approval" else "Suggest Only"
        if agent.autonomy_level == "Act Autonomously":
            initial_status = "Executed"

        proposal = AIProposal(
            tenant_id=tenant_id,
            ref=ref,
            agent_id=proposal_in.agent_id,
            agent_name=agent.name,
            action=proposal_in.action,
            reasoning=proposal_in.reasoning,
            evidence=proposal_in.evidence,
            confidence=proposal_in.confidence,
            policy_check=proposal_in.policy_check,
            status=initial_status,
            payload=proposal_in.payload
        )
        db.add(proposal)

        # Update agent proposal metrics
        curr_metrics = dict(agent.metrics) if agent.metrics else {}
        curr_metrics["proposals_count"] = curr_metrics.get("proposals_count", 0) + 1
        agent.metrics = curr_metrics

        await db.commit()
        await db.refresh(proposal)

        await audit_service.log_event(
            db=db,
            action="ai_proposal.created",
            resource_type="ai_proposal",
            resource_id=str(proposal.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name or agent.name,
            metadata={"ref": ref, "action": proposal.action, "autonomy_level": agent.autonomy_level, "status": initial_status}
        )

        return AIProposalResponse.model_validate(proposal)

    @staticmethod
    async def decide_proposal(
        db: AsyncSession,
        proposal_id: uuid.UUID,
        tenant_id: uuid.UUID,
        decision_in: AIProposalDecisionRequest,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> AIProposalResponse:
        """Human decision gate: approve or reject an AI proposal."""
        stmt = select(AIProposal).where(
            AIProposal.id == proposal_id,
            AIProposal.tenant_id == tenant_id,
            AIProposal.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        proposal = res.scalar_one_or_none()
        if not proposal:
            raise NotFoundException("Proposal not found.")

        if proposal.status not in ["Pending Approval", "Suggest Only"]:
            raise ValidationException(f"Proposal cannot be decided from status '{proposal.status}'.")

        proposal.status = "Approved" if decision_in.approved else "Rejected"
        proposal.decided_by_id = actor_id
        proposal.decided_by_name = actor_name or "Human Reviewer"
        proposal.decided_at = datetime.now(timezone.utc)
        proposal.decision_notes = decision_in.notes

        # Update governing agent approval metric
        agent_res = await db.execute(select(AIAgent).where(AIAgent.id == proposal.agent_id))
        agent = agent_res.scalar_one_or_none()
        if agent and agent.metrics:
            m = dict(agent.metrics)
            if decision_in.approved:
                m["approved_count"] = m.get("approved_count", 0) + 1
            agent.metrics = m

        await db.commit()
        await db.refresh(proposal)

        await audit_service.log_event(
            db=db,
            action="ai_proposal.decided",
            resource_type="ai_proposal",
            resource_id=str(proposal.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": proposal.ref, "decision": proposal.status, "notes": decision_in.notes}
        )

        return AIProposalResponse.model_validate(proposal)
