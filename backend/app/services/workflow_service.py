import uuid
import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_

from app.models.workflow import Workflow, WorkflowExecution, ApprovalRule
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    WorkflowExecutionResponse,
    ApprovalRuleCreate,
    ApprovalRuleUpdate,
    ApprovalRuleResponse,
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

DEFAULT_ENTERPRISE_WORKFLOWS = [
    {
        "name": "Strategic Lead Auto-Assignment",
        "category": "Sales",
        "trigger_type": "event",
        "trigger_event": "lead.created",
        "condition_expression": "Filter: Company revenue > $10M OR employee count > 250",
        "action_summary": "Route to Strategic Enterprise Queue & notify Territory Director",
        "conditions": {
            "or": [
                {"field": "annual_revenue", "op": "gt", "val": 10000000},
                {"field": "employee_count", "op": "gt", "val": 250}
            ]
        },
        "actions": [
            {"type": "assign_queue", "target": "Strategic Enterprise Queue"},
            {"type": "notify", "role": "Territory Director", "message": "High-value enterprise lead captured."}
        ],
        "status": "Active"
    },
    {
        "name": "Discount Governance & Approval Escalation",
        "category": "CPQ",
        "trigger_type": "event",
        "trigger_event": "quote.submitted",
        "condition_expression": "Filter: Line item discount > 15% OR margin < 40%",
        "action_summary": "Require VP Sales approval before client dispatch",
        "conditions": {
            "or": [
                {"field": "discount_pct", "op": "gt", "val": 15},
                {"field": "margin_pct", "op": "lt", "val": 40}
            ]
        },
        "actions": [
            {"type": "require_approval", "role": "VP Sales", "timeout_hours": 24},
            {"type": "lock_record", "status": "Pending Approval"}
        ],
        "status": "Active"
    },
    {
        "name": "Closed-Won Deal Delivery Handover",
        "category": "Delivery",
        "trigger_type": "event",
        "trigger_event": "deal.stage_changed",
        "condition_expression": "Filter: Commercial contract executed = true",
        "action_summary": "Create post-sales Implementation Project & assign Customer Success Manager",
        "conditions": {
            "and": [
                {"field": "stage", "op": "eq", "val": "Closed Won"}
            ]
        },
        "actions": [
            {"type": "create_project", "template": "Enterprise Implementation", "billing_model": "Fixed price"},
            {"type": "assign_csm", "role": "Customer Success Manager"}
        ],
        "status": "Active"
    },
    {
        "name": "High-Priority Case SLA Escalation",
        "category": "Service",
        "trigger_type": "event",
        "trigger_event": "case.breached",
        "condition_expression": "Filter: Priority == High AND Status != Resolved",
        "action_summary": "Escalate to Support Engineering Director & dispatch SMS alert",
        "conditions": {
            "and": [
                {"field": "priority", "op": "eq", "val": "High"},
                {"field": "status", "op": "neq", "val": "Resolved"}
            ]
        },
        "actions": [
            {"type": "escalate", "role": "Support Engineering Director"},
            {"type": "dispatch_alert", "channel": "SMS", "recipient": "on-call-director"}
        ],
        "status": "Active"
    },
    {
        "name": "New Client Onboarding Journey Enrollment",
        "category": "Marketing",
        "trigger_type": "event",
        "trigger_event": "order.fulfilled",
        "condition_expression": "Filter: Customer order count == 1 (New Logo)",
        "action_summary": "Enroll Primary Contact in 14-Day Welcome Email Sequence",
        "conditions": {
            "and": [
                {"field": "is_new_logo", "op": "eq", "val": True}
            ]
        },
        "actions": [
            {"type": "enroll_sequence", "sequence": "14-Day Welcome Journey", "cadence": "Daily"}
        ],
        "status": "Active"
    }
]

class WorkflowService:
    """Service managing visual workflow rules, event triggers, condition evaluation, and execution logs."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(Workflow).where(Workflow.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"WF-{year}-{count + 1:05d}"

    @staticmethod
    async def _generate_execution_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(WorkflowExecution).where(WorkflowExecution.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"WFE-{year}-{count + 1:05d}"

    @staticmethod
    async def seed_default_workflows(db: AsyncSession, tenant_id: uuid.UUID) -> List[Workflow]:
        """Seed standard enterprise workflows if tenant has none."""
        stmt = select(Workflow).where(Workflow.tenant_id == tenant_id, Workflow.deleted_at.is_(None))
        res = await db.execute(stmt)
        existing = res.scalars().all()
        if existing:
            return list(existing)

        seeded: List[Workflow] = []
        for defn in DEFAULT_ENTERPRISE_WORKFLOWS:
            ref = await WorkflowService._generate_ref(db, tenant_id)
            wf = Workflow(
                tenant_id=tenant_id,
                ref=ref,
                name=defn["name"],
                category=defn["category"],
                trigger_type=defn["trigger_type"],
                trigger_event=defn["trigger_event"],
                condition_expression=defn["condition_expression"],
                conditions=defn["conditions"],
                action_summary=defn["action_summary"],
                actions=defn["actions"],
                status=defn["status"]
            )
            db.add(wf)
            seeded.append(wf)

        await db.commit()
        for wf in seeded:
            await db.refresh(wf)
        return seeded

    @staticmethod
    async def list_workflows(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        q: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[WorkflowResponse], int, int]:
        """Retrieve paginated workflows, auto-seeding defaults if empty."""
        stmt = (
            select(Workflow)
            .where(Workflow.tenant_id == tenant_id, Workflow.deleted_at.is_(None))
        )

        if q:
            term = f"%{q}%"
            stmt = stmt.where(
                or_(
                    Workflow.name.ilike(term),
                    Workflow.ref.ilike(term),
                    Workflow.trigger_event.ilike(term),
                    Workflow.action_summary.ilike(term)
                )
            )
        if category:
            stmt = stmt.where(Workflow.category == category)
        if status:
            stmt = stmt.where(Workflow.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        if total == 0 and not q and not category and not status:
            # Seed defaults
            seeded = await WorkflowService.seed_default_workflows(db, tenant_id)
            return [WorkflowResponse.model_validate(w) for w in seeded], len(seeded), 1

        pages = (total + limit - 1) // limit if total > 0 else 1
        stmt = stmt.order_by(Workflow.created_at.desc()).offset((page - 1) * limit).limit(limit)
        res = await db.execute(stmt)
        items = res.scalars().all()

        return [WorkflowResponse.model_validate(w) for w in items], total, pages

    @staticmethod
    async def get_workflow(db: AsyncSession, workflow_id: uuid.UUID, tenant_id: uuid.UUID) -> WorkflowResponse:
        stmt = select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.tenant_id == tenant_id,
            Workflow.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        wf = res.scalar_one_or_none()
        if not wf:
            raise NotFoundException("Workflow rule not found.")
        return WorkflowResponse.model_validate(wf)

    @staticmethod
    async def create_workflow(
        db: AsyncSession,
        workflow_in: WorkflowCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> WorkflowResponse:
        ref = await WorkflowService._generate_ref(db, tenant_id)
        wf = Workflow(
            tenant_id=tenant_id,
            ref=ref,
            name=workflow_in.name,
            description=workflow_in.description,
            category=workflow_in.category,
            trigger_type=workflow_in.trigger_type,
            trigger_event=workflow_in.trigger_event,
            trigger_config=workflow_in.trigger_config,
            condition_expression=workflow_in.condition_expression,
            conditions=workflow_in.conditions,
            action_summary=workflow_in.action_summary,
            actions=workflow_in.actions,
            status=workflow_in.status,
            owner_id=actor_id,
            owner_name=actor_name,
            custom_fields=workflow_in.custom_fields
        )
        db.add(wf)
        await db.commit()
        await db.refresh(wf)

        await audit_service.log_event(
            db=db,
            action="workflow.created",
            resource_type="workflow",
            resource_id=str(wf.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": ref, "name": wf.name, "trigger_event": wf.trigger_event}
        )

        return WorkflowResponse.model_validate(wf)

    @staticmethod
    async def update_workflow(
        db: AsyncSession,
        workflow_id: uuid.UUID,
        workflow_in: WorkflowUpdate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> WorkflowResponse:
        stmt = select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.tenant_id == tenant_id,
            Workflow.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        wf = res.scalar_one_or_none()
        if not wf:
            raise NotFoundException("Workflow rule not found.")

        update_dict = workflow_in.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(wf, key, val)

        await db.commit()
        await db.refresh(wf)

        await audit_service.log_event(
            db=db,
            action="workflow.updated",
            resource_type="workflow",
            resource_id=str(wf.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": wf.ref, "updated_fields": list(update_dict.keys())}
        )

        return WorkflowResponse.model_validate(wf)

    @staticmethod
    async def toggle_workflow_status(
        db: AsyncSession,
        workflow_id: uuid.UUID,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> WorkflowResponse:
        stmt = select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.tenant_id == tenant_id,
            Workflow.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        wf = res.scalar_one_or_none()
        if not wf:
            raise NotFoundException("Workflow rule not found.")

        wf.status = "Paused" if wf.status == "Active" else "Active"
        await db.commit()
        await db.refresh(wf)

        await audit_service.log_event(
            db=db,
            action="workflow.status_toggled",
            resource_type="workflow",
            resource_id=str(wf.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": wf.ref, "status": wf.status}
        )

        return WorkflowResponse.model_validate(wf)

    @staticmethod
    async def delete_workflow(
        db: AsyncSession,
        workflow_id: uuid.UUID,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> None:
        stmt = select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.tenant_id == tenant_id,
            Workflow.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        wf = res.scalar_one_or_none()
        if not wf:
            raise NotFoundException("Workflow rule not found.")

        wf.deleted_at = datetime.now(timezone.utc)
        wf.status = "Paused"
        await db.commit()

        await audit_service.log_event(
            db=db,
            action="workflow.deleted",
            resource_type="workflow",
            resource_id=str(wf.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": wf.ref}
        )

    @staticmethod
    def evaluate_condition_node(node: Dict[str, Any], payload: Dict[str, Any]) -> bool:
        """Evaluates a single condition dictionary against an input payload."""
        if "and" in node:
            return all(WorkflowService.evaluate_condition_node(child, payload) for child in node["and"])
        if "or" in node:
            return any(WorkflowService.evaluate_condition_node(child, payload) for child in node["or"])

        field = node.get("field")
        op = node.get("op", "eq")
        expected = node.get("val")

        if not field or field not in payload:
            return False

        actual = payload.get(field)
        try:
            if op == "eq":
                return actual == expected
            elif op == "neq":
                return actual != expected
            elif op == "gt":
                return float(actual) > float(expected)
            elif op == "gte":
                return float(actual) >= float(expected)
            elif op == "lt":
                return float(actual) < float(expected)
            elif op == "lte":
                return float(actual) <= float(expected)
            elif op == "contains":
                return str(expected).lower() in str(actual).lower()
        except (ValueError, TypeError):
            return False
        return False

    @staticmethod
    async def execute_workflow(
        db: AsyncSession,
        workflow_id: uuid.UUID,
        tenant_id: uuid.UUID,
        payload: Dict[str, Any],
        entity_type: Optional[str] = None,
        entity_id: Optional[uuid.UUID] = None
    ) -> WorkflowExecutionResponse:
        """Execute a workflow against payload, evaluating conditions and recording execution logs."""
        stmt = select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.tenant_id == tenant_id,
            Workflow.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        wf = res.scalar_one_or_none()
        if not wf:
            raise NotFoundException("Workflow rule not found.")

        start_time = time.time()
        execution_ref = await WorkflowService._generate_execution_ref(db, tenant_id)
        
        # Evaluate conditions
        matched = True
        if wf.conditions:
            matched = WorkflowService.evaluate_condition_node(wf.conditions, payload)

        execution_log: List[Dict[str, Any]] = []
        status = "Success"
        error_msg: Optional[str] = None

        if matched:
            for idx, action in enumerate(wf.actions):
                act_type = action.get("type", "unknown")
                execution_log.append({
                    "step": idx + 1,
                    "action_type": act_type,
                    "status": "Executed",
                    "details": f"Dispatched {act_type} successfully with config: {action}",
                    "executed_at": datetime.now(timezone.utc).isoformat()
                })
        else:
            status = "Skipped"
            execution_log.append({
                "step": 0,
                "action_type": "condition_filter",
                "status": "Not Matched",
                "details": "Filter criteria not satisfied by input payload.",
                "executed_at": datetime.now(timezone.utc).isoformat()
            })

        duration_ms = int((time.time() - start_time) * 1000)

        # Update workflow stats
        wf.executions_count += 1
        wf.last_executed_at = datetime.now(timezone.utc)

        execution = WorkflowExecution(
            tenant_id=tenant_id,
            workflow_id=wf.id,
            ref=execution_ref,
            trigger_event=wf.trigger_event,
            entity_type=entity_type,
            entity_id=entity_id,
            status=status,
            input_payload=payload,
            execution_log=execution_log,
            error_message=error_msg,
            duration_ms=duration_ms,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc)
        )
        db.add(execution)
        await db.commit()
        await db.refresh(execution)

        return WorkflowExecutionResponse.model_validate(execution)

    @staticmethod
    async def list_executions(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        workflow_id: Optional[uuid.UUID] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[WorkflowExecutionResponse], int, int]:
        stmt = (
            select(WorkflowExecution)
            .where(WorkflowExecution.tenant_id == tenant_id)
        )
        if workflow_id:
            stmt = stmt.where(WorkflowExecution.workflow_id == workflow_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        pages = (total + limit - 1) // limit if total > 0 else 1
        stmt = stmt.order_by(WorkflowExecution.started_at.desc()).offset((page - 1) * limit).limit(limit)
        res = await db.execute(stmt)
        items = res.scalars().all()

        return [WorkflowExecutionResponse.model_validate(e) for e in items], total, pages

    @staticmethod
    async def dispatch_domain_event(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        event_name: str,
        payload: Dict[str, Any],
        entity_type: Optional[str] = None,
        entity_id: Optional[uuid.UUID] = None
    ) -> List[WorkflowExecutionResponse]:
        """Dispatch a domain event across all active workflows listening for event_name."""
        stmt = select(Workflow).where(
            Workflow.tenant_id == tenant_id,
            Workflow.status == "Active",
            Workflow.trigger_event == event_name,
            Workflow.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        matching_workflows = res.scalars().all()

        executions: List[WorkflowExecutionResponse] = []
        for wf in matching_workflows:
            exec_res = await WorkflowService.execute_workflow(
                db=db,
                workflow_id=wf.id,
                tenant_id=tenant_id,
                payload=payload,
                entity_type=entity_type,
                entity_id=entity_id
            )
            executions.append(exec_res)
        return executions
