import uuid
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.models.user import User
from app.schemas.ai import (
    AIAgentResponse,
    AIAgentUpdate,
    AIProposalResponse,
    AIProposalCreate,
    AIProposalDecisionRequest,
    AIChatQueryRequest,
    AIChatQueryResponse,
    AIChatSessionResponse,
    RevenueTwinSimulateRequest,
    RevenueTwinSimulateResponse,
    RevenueScenarioCreate,
    RevenueScenarioResponse,
)
from app.services.ai_agent_service import AIAgentService
from app.services.ai_gateway_service import AIGatewayService
from app.services.analytics_service import AnalyticsService
from app.core.errors import ValidationException

router = APIRouter()

# --- Agent Workforce ---

@router.get("/agents", response_model=List[AIAgentResponse])
async def list_agents(
    persona: Optional[str] = Query(None, description="Filter by persona"),
    module: Optional[str] = Query(None, description="Filter by functional module"),
    autonomy_level: Optional[str] = Query(None, description="Filter by autonomy tier"),
    status: Optional[str] = Query(None, description="Filter by status"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve 14 specialist agent workforce personas (auto-seeded if empty)."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AIAgentService.list_agents(
        db=db,
        tenant_id=tenant_id,
        persona=persona,
        module=module,
        autonomy_level=autonomy_level,
        status=status,
        owner_id=current_user.id,
        owner_name=current_user.full_name
    )

@router.get("/agents/{id}", response_model=AIAgentResponse)
async def get_agent(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve specific agent configuration and telemetry."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AIAgentService.get_agent(db, agent_id=id, tenant_id=tenant_id)

@router.patch("/agents/{id}", response_model=AIAgentResponse)
async def update_agent(
    id: uuid.UUID,
    agent_in: AIAgentUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("ai:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Update agent autonomy level, system prompt, or tool permissions."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AIAgentService.update_agent(
        db=db,
        agent_id=id,
        tenant_id=tenant_id,
        agent_in=agent_in,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

# --- Governance & AI Proposals ---

@router.get("/proposals", response_model=List[AIProposalResponse])
async def list_proposals(
    status: Optional[str] = Query(None, description="Filter by status (Pending Approval, Approved, Rejected)"),
    agent_id: Optional[uuid.UUID] = Query(None, description="Filter by agent ID"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db)
):
    """List agent action proposals requiring review or verification."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AIAgentService.list_proposals(
        db=db,
        tenant_id=tenant_id,
        status=status,
        agent_id=agent_id
    )

@router.post("/proposals", response_model=AIProposalResponse, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    proposal_in: AIProposalCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("ai:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Submit an action proposal governed by three-tier autonomy policies."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AIAgentService.create_proposal(
        db=db,
        proposal_in=proposal_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/proposals/{id}/decide", response_model=AIProposalResponse)
async def decide_proposal(
    id: uuid.UUID,
    decision_in: AIProposalDecisionRequest,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("ai:proposals:decide")),
    db: AsyncSession = Depends(get_db)
):
    """Human decision gate: approve or reject an AI proposal."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AIAgentService.decide_proposal(
        db=db,
        proposal_id=id,
        tenant_id=tenant_id,
        decision_in=decision_in,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

# --- Conversational Copilot ---

@router.post("/copilot/chat", response_model=AIChatQueryResponse)
async def copilot_chat(
    req: AIChatQueryRequest,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db)
):
    """Natural language query grounded in tenant CRM context with multi-provider routing."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AIGatewayService.chat(
        db=db,
        tenant_id=tenant_id,
        req=req,
        user_id=current_user.id,
        user_name=current_user.full_name
    )

@router.get("/copilot/sessions", response_model=List[AIChatSessionResponse])
async def list_copilot_sessions(
    limit: int = Query(10, ge=1, le=50),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db)
):
    """List recent copilot chat sessions for current tenant."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AIGatewayService.list_recent_sessions(db, tenant_id=tenant_id, limit=limit)

# --- Revenue Digital Twin ---

@router.get("/revenue-twin/simulate", response_model=RevenueTwinSimulateResponse)
async def simulate_revenue_twin(
    probability_uplift: Decimal = Query(Decimal("5.00"), ge=-50, le=50),
    launch_delay_days: int = Query(0, ge=0, le=365),
    discount_pct: Decimal = Query(Decimal("0.00"), ge=0, le=50),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db)
):
    """Calculate simulated pipeline outcomes in real-time without modifying live records."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    req = RevenueTwinSimulateRequest(
        probability_uplift=probability_uplift,
        launch_delay_days=launch_delay_days,
        discount_pct=discount_pct
    )
    return await AnalyticsService.simulate_revenue_twin(db, tenant_id=tenant_id, req=req)

@router.post("/revenue-twin/scenarios", response_model=RevenueScenarioResponse, status_code=status.HTTP_201_CREATED)
async def save_revenue_scenario(
    scenario_in: RevenueScenarioCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("ai:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Save a scenario simulation in the Revenue Digital Twin ledger."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AnalyticsService.save_revenue_scenario(
        db=db,
        tenant_id=tenant_id,
        scenario_in=scenario_in,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/revenue-twin/scenarios", response_model=List[RevenueScenarioResponse])
async def list_revenue_scenarios(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db)
):
    """List saved revenue twin scenario projections."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await AnalyticsService.list_revenue_scenarios(db, tenant_id=tenant_id)
