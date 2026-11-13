import uuid
from datetime import datetime, date, timezone
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import select, func, and_, or_, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppException, NotFoundException, ValidationException
from app.models.project import (
    Project,
    ProjectMilestone,
    ProjectTask,
    TaskDependency,
    ProjectResource,
    ProjectCost,
    ProjectActivity,
)
from app.models.crm import Account, Contact, Opportunity
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectDetailResponse,
    ProjectMilestoneCreate,
    ProjectMilestoneUpdate,
    ProjectMilestoneResponse,
    ProjectTaskCreate,
    ProjectTaskUpdate,
    ProjectTaskResponse,
    TaskDependencyResponse,
    ProjectResourceCreate,
    ProjectResourceUpdate,
    ProjectResourceResponse,
    ProjectCostCreate,
    ProjectCostUpdate,
    ProjectCostResponse,
    ProjectActivityResponse,
    ProjectCalendarEvent,
    ProjectAnalyticsSummary,
)

class ProjectService:

    # ------------------------------------------------------------------
    # Sequential Reference Generators
    # ------------------------------------------------------------------
    @staticmethod
    async def _next_ref(db: AsyncSession, model, prefix: str, tenant_id: uuid.UUID) -> str:
        year = datetime.now(timezone.utc).year
        search_pattern = f"{prefix}-{year}-%"
        res = await db.execute(
            select(func.count(model.id)).where(
                model.tenant_id == tenant_id,
                model.ref.like(search_pattern),
            )
        )
        count = res.scalar() or 0
        return f"{prefix}-{year}-{count + 1:04d}"

    # ------------------------------------------------------------------
    # Activity Logger
    # ------------------------------------------------------------------
    @staticmethod
    async def log_activity(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
        activity_type: str,
        action: str,
        actor_name: str,
        actor_id: Optional[uuid.UUID] = None,
        details: Optional[str] = None,
    ) -> ProjectActivity:
        activity = ProjectActivity(
            tenant_id=tenant_id,
            project_id=project_id,
            activity_type=activity_type,
            action=action,
            actor_name=actor_name,
            actor_id=actor_id,
            details=details,
            occurred_at=datetime.now(timezone.utc),
        )
        db.add(activity)
        return activity

    # ------------------------------------------------------------------
    # Projects CRUD & Operations
    # ------------------------------------------------------------------
    async def list_projects(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        status: Optional[str] = None,
        health: Optional[str] = None,
        account_id: Optional[uuid.UUID] = None,
    ) -> List[ProjectResponse]:
        query = select(Project).where(
            Project.tenant_id == tenant_id,
            Project.deleted_at.is_(None)
        ).options(
            selectinload(Project.account),
            selectinload(Project.costs),
        ).order_by(Project.created_at.desc())

        if status:
            query = query.where(Project.status == status)
        if health:
            query = query.where(Project.health == health)
        if account_id:
            query = query.where(Project.account_id == account_id)

        res = await db.execute(query)
        projects = res.scalars().all()

        responses = []
        for p in projects:
            actual_cost = sum((c.amount for c in p.costs if c.deleted_at is None and c.status == "Approved"), Decimal("0.00"))
            variance = p.budget - actual_cost
            account_name = p.account.name if p.account else None

            resp = ProjectResponse(
                id=p.id,
                tenant_id=p.tenant_id,
                ref=p.ref,
                name=p.name,
                description=p.description,
                objectives=p.objectives,
                project_type=p.project_type,
                category=p.category,
                status=p.status,
                priority=p.priority,
                health=p.health,
                account_id=p.account_id,
                account_name=account_name,
                contact_id=p.contact_id,
                opportunity_id=p.opportunity_id,
                owner_id=p.owner_id,
                owner_name=p.owner_name,
                manager_id=p.manager_id,
                manager_name=p.manager_name,
                start_date=p.start_date,
                target_date=p.target_date,
                actual_completion_date=p.actual_completion_date,
                budget=p.budget,
                approved_cost_baseline=p.approved_cost_baseline,
                currency=p.currency,
                progress_pct=p.progress_pct,
                custom_fields=p.custom_fields,
                actual_cost=actual_cost,
                cost_variance=variance,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            responses.append(resp)
        return responses

    async def get_project(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
    ) -> ProjectResponse:
        res = await db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.tenant_id == tenant_id,
                Project.deleted_at.is_(None)
            ).options(
                selectinload(Project.account),
                selectinload(Project.costs),
            )
        )
        p = res.scalar_one_or_none()
        if not p:
            raise NotFoundException("Project not found.")

        actual_cost = sum((c.amount for c in p.costs if c.deleted_at is None and c.status == "Approved"), Decimal("0.00"))
        variance = p.budget - actual_cost
        account_name = p.account.name if p.account else None

        return ProjectResponse(
            id=p.id,
            tenant_id=p.tenant_id,
            ref=p.ref,
            name=p.name,
            description=p.description,
            objectives=p.objectives,
            project_type=p.project_type,
            category=p.category,
            status=p.status,
            priority=p.priority,
            health=p.health,
            account_id=p.account_id,
            account_name=account_name,
            contact_id=p.contact_id,
            opportunity_id=p.opportunity_id,
            owner_id=p.owner_id,
            owner_name=p.owner_name,
            manager_id=p.manager_id,
            manager_name=p.manager_name,
            start_date=p.start_date,
            target_date=p.target_date,
            actual_completion_date=p.actual_completion_date,
            budget=p.budget,
            approved_cost_baseline=p.approved_cost_baseline,
            currency=p.currency,
            progress_pct=p.progress_pct,
            custom_fields=p.custom_fields,
            actual_cost=actual_cost,
            cost_variance=variance,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )

    async def get_project_details(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
    ) -> ProjectDetailResponse:
        res = await db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.tenant_id == tenant_id,
                Project.deleted_at.is_(None)
            ).options(
                selectinload(Project.account),
                selectinload(Project.milestones),
                selectinload(Project.tasks).selectinload(ProjectTask.dependencies).selectinload(TaskDependency.depends_on),
                selectinload(Project.resources).selectinload(ProjectResource.user),
                selectinload(Project.costs),
                selectinload(Project.activities),
            )
        )
        p = res.scalar_one_or_none()
        if not p:
            raise NotFoundException("Project not found.")

        actual_cost = sum((c.amount for c in p.costs if c.deleted_at is None and c.status == "Approved"), Decimal("0.00"))
        variance = p.budget - actual_cost
        account_name = p.account.name if p.account else None

        # Build Milestone responses
        milestone_resps = []
        for m in sorted([m for m in p.milestones if m.deleted_at is None], key=lambda x: x.order_index):
            task_cnt = len([t for t in p.tasks if t.milestone_id == m.id and t.deleted_at is None])
            milestone_resps.append(
                ProjectMilestoneResponse(
                    id=m.id,
                    tenant_id=m.tenant_id,
                    project_id=m.project_id,
                    ref=m.ref,
                    name=m.name,
                    description=m.description,
                    deliverable=m.deliverable,
                    owner_id=m.owner_id,
                    owner_name=m.owner_name,
                    status=m.status,
                    priority=m.priority,
                    target_date=m.target_date,
                    completion_date=m.completion_date,
                    completion_criteria=m.completion_criteria,
                    order_index=m.order_index,
                    progress_pct=m.progress_pct,
                    custom_fields=m.custom_fields,
                    project_ref=p.ref,
                    project_name=p.name,
                    task_count=task_cnt,
                    created_at=m.created_at,
                    updated_at=m.updated_at,
                )
            )

        # Build Task responses
        milestone_map = {m.id: m.name for m in p.milestones}
        task_resps = []
        for t in [t for t in p.tasks if t.deleted_at is None]:
            dep_resps = [
                TaskDependencyResponse(
                    id=dep.id,
                    task_id=dep.task_id,
                    depends_on_task_id=dep.depends_on_task_id,
                    dependency_type=dep.dependency_type,
                    depends_on_title=dep.depends_on.title if dep.depends_on else None,
                    depends_on_ref=dep.depends_on.ref if dep.depends_on else None,
                )
                for dep in t.dependencies if dep.deleted_at is None
            ]
            task_resps.append(
                ProjectTaskResponse(
                    id=t.id,
                    tenant_id=t.tenant_id,
                    project_id=t.project_id,
                    milestone_id=t.milestone_id,
                    parent_task_id=t.parent_task_id,
                    ref=t.ref,
                    title=t.title,
                    description=t.description,
                    assigned_user_id=t.assigned_user_id,
                    assigned_user_name=t.assigned_user_name,
                    priority=t.priority,
                    status=t.status,
                    start_date=t.start_date,
                    due_date=t.due_date,
                    completed_at=t.completed_at,
                    estimated_hours=t.estimated_hours,
                    actual_hours=t.actual_hours,
                    progress_pct=t.progress_pct,
                    blocked_reason=t.blocked_reason,
                    custom_fields=t.custom_fields,
                    project_ref=p.ref,
                    project_name=p.name,
                    milestone_name=milestone_map.get(t.milestone_id),
                    dependencies=dep_resps,
                    created_at=t.created_at,
                    updated_at=t.updated_at,
                )
            )

        # Build Resource responses
        resource_resps = []
        for r in [r for r in p.resources if r.deleted_at is None]:
            total_cost = r.actual_hours * r.hourly_rate if r.actual_hours > Decimal("0") else r.planned_hours * r.hourly_rate
            resource_resps.append(
                ProjectResourceResponse(
                    id=r.id,
                    tenant_id=r.tenant_id,
                    project_id=r.project_id,
                    user_id=r.user_id,
                    ref=r.ref,
                    role_title=r.role_title,
                    allocation_pct=r.allocation_pct,
                    planned_hours=r.planned_hours,
                    actual_hours=r.actual_hours,
                    hourly_rate=r.hourly_rate,
                    start_date=r.start_date,
                    end_date=r.end_date,
                    status=r.status,
                    custom_fields=r.custom_fields,
                    project_ref=p.ref,
                    project_name=p.name,
                    user_name=r.user.full_name if r.user else None,
                    user_email=r.user.email if r.user else None,
                    total_cost=total_cost,
                    is_overallocated=r.allocation_pct > 100,
                    created_at=r.created_at,
                    updated_at=r.updated_at,
                )
            )

        # Build Cost responses
        task_title_map = {t.id: t.title for t in p.tasks}
        cost_resps = []
        for c in [c for c in p.costs if c.deleted_at is None]:
            cost_resps.append(
                ProjectCostResponse(
                    id=c.id,
                    tenant_id=c.tenant_id,
                    project_id=c.project_id,
                    task_id=c.task_id,
                    ref=c.ref,
                    title=c.title,
                    category=c.category,
                    cost_type=c.cost_type,
                    amount=c.amount,
                    currency=c.currency,
                    date_incurred=c.date_incurred,
                    status=c.status,
                    approved_by_id=c.approved_by_id,
                    approved_by_name=c.approved_by_name,
                    vendor_name=c.vendor_name,
                    notes=c.notes,
                    custom_fields=c.custom_fields,
                    project_ref=p.ref,
                    project_name=p.name,
                    task_title=task_title_map.get(c.task_id),
                    created_at=c.created_at,
                    updated_at=c.updated_at,
                )
            )

        # Build Activity responses
        activity_resps = [
            ProjectActivityResponse(
                id=a.id,
                project_id=a.project_id,
                activity_type=a.activity_type,
                action=a.action,
                actor_id=a.actor_id,
                actor_name=a.actor_name,
                details=a.details,
                occurred_at=a.occurred_at,
            )
            for a in sorted([a for a in p.activities if a.deleted_at is None], key=lambda x: x.occurred_at, reverse=True)
        ]

        return ProjectDetailResponse(
            id=p.id,
            tenant_id=p.tenant_id,
            ref=p.ref,
            name=p.name,
            description=p.description,
            objectives=p.objectives,
            project_type=p.project_type,
            category=p.category,
            status=p.status,
            priority=p.priority,
            health=p.health,
            account_id=p.account_id,
            account_name=account_name,
            contact_id=p.contact_id,
            opportunity_id=p.opportunity_id,
            owner_id=p.owner_id,
            owner_name=p.owner_name,
            manager_id=p.manager_id,
            manager_name=p.manager_name,
            start_date=p.start_date,
            target_date=p.target_date,
            actual_completion_date=p.actual_completion_date,
            budget=p.budget,
            approved_cost_baseline=p.approved_cost_baseline,
            currency=p.currency,
            progress_pct=p.progress_pct,
            custom_fields=p.custom_fields,
            actual_cost=actual_cost,
            cost_variance=variance,
            created_at=p.created_at,
            updated_at=p.updated_at,
            milestones=milestone_resps,
            tasks=task_resps,
            resources=resource_resps,
            costs=cost_resps,
            activities=activity_resps,
        )

    async def create_project(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        user_name: str,
        project_in: ProjectCreate,
    ) -> ProjectResponse:
        ref = await self._next_ref(db, Project, "PRJ", tenant_id)
        
        # Default baseline to budget if not provided
        baseline = project_in.approved_cost_baseline
        if baseline == Decimal("0.00") and project_in.budget > Decimal("0.00"):
            baseline = project_in.budget

        project = Project(
            tenant_id=tenant_id,
            ref=ref,
            name=project_in.name,
            description=project_in.description,
            objectives=project_in.objectives,
            project_type=project_in.project_type,
            category=project_in.category,
            status=project_in.status,
            priority=project_in.priority,
            health=project_in.health,
            account_id=project_in.account_id,
            contact_id=project_in.contact_id,
            opportunity_id=project_in.opportunity_id,
            owner_id=project_in.owner_id or user_id,
            owner_name=project_in.owner_name or user_name,
            manager_id=project_in.manager_id or user_id,
            manager_name=project_in.manager_name or user_name,
            start_date=project_in.start_date,
            target_date=project_in.target_date,
            actual_completion_date=project_in.actual_completion_date,
            budget=project_in.budget,
            approved_cost_baseline=baseline,
            currency=project_in.currency,
            progress_pct=project_in.progress_pct,
            custom_fields=project_in.custom_fields,
        )
        db.add(project)
        await db.flush()

        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=project.id,
            activity_type="Creation",
            action="Project chartered",
            actor_name=user_name,
            actor_id=user_id,
            details=f"Project '{project.name}' created with budget {project.currency} {project.budget}.",
        )
        await db.commit()
        return await self.get_project(db, tenant_id, project.id)

    async def update_project(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
        project_update: ProjectUpdate,
        user_name: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> ProjectResponse:
        project = await db.get(Project, project_id)
        if not project or project.tenant_id != tenant_id or project.deleted_at is not None:
            raise NotFoundException("Project not found.")

        update_dict = project_update.model_dump(exclude_unset=True)
        changes = []
        for key, value in update_dict.items():
            old_val = getattr(project, key)
            if old_val != value:
                setattr(project, key, value)
                changes.append(f"{key}: {old_val} -> {value}")

        if changes:
            project.updated_at = datetime.now(timezone.utc)
            await self.log_activity(
                db=db,
                tenant_id=tenant_id,
                project_id=project.id,
                activity_type="Update",
                action="Project specification updated",
                actor_name=user_name,
                actor_id=user_id,
                details="; ".join(changes[:5]),
            )
            await db.commit()

        return await self.get_project(db, tenant_id, project.id)

    async def delete_project(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
        user_name: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> None:
        project = await db.get(Project, project_id)
        if not project or project.tenant_id != tenant_id or project.deleted_at is not None:
            raise NotFoundException("Project not found.")

        project.deleted_at = datetime.now(timezone.utc)
        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=project.id,
            activity_type="Deletion",
            action="Project archived",
            actor_name=user_name,
            actor_id=user_id,
            details=f"Project {project.ref} was moved to archive.",
        )
        await db.commit()

    async def transition_project_status(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
        new_status: str,
        reason: Optional[str],
        user_name: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> ProjectResponse:
        project = await db.get(Project, project_id)
        if not project or project.tenant_id != tenant_id or project.deleted_at is not None:
            raise NotFoundException("Project not found.")

        old_status = project.status
        project.status = new_status
        if new_status == "Completed" and not project.actual_completion_date:
            project.actual_completion_date = datetime.now(timezone.utc).date()
            project.progress_pct = 100

        project.updated_at = datetime.now(timezone.utc)
        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=project.id,
            activity_type="Status Change",
            action=f"Status transitioned: {old_status} -> {new_status}",
            actor_name=user_name,
            actor_id=user_id,
            details=reason or f"Project status moved to {new_status}.",
        )
        await db.commit()
        return await self.get_project(db, tenant_id, project.id)

    # ------------------------------------------------------------------
    # Milestones CRUD
    # ------------------------------------------------------------------
    async def list_milestones(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: Optional[uuid.UUID] = None,
    ) -> List[ProjectMilestoneResponse]:
        query = select(ProjectMilestone).where(
            ProjectMilestone.tenant_id == tenant_id,
            ProjectMilestone.deleted_at.is_(None)
        ).options(
            selectinload(ProjectMilestone.project),
            selectinload(ProjectMilestone.tasks),
        ).order_by(ProjectMilestone.order_index.asc(), ProjectMilestone.target_date.asc())

        if project_id:
            query = query.where(ProjectMilestone.project_id == project_id)

        res = await db.execute(query)
        milestones = res.scalars().all()

        responses = []
        for m in milestones:
            task_cnt = len([t for t in m.tasks if t.deleted_at is None])
            responses.append(
                ProjectMilestoneResponse(
                    id=m.id,
                    tenant_id=m.tenant_id,
                    project_id=m.project_id,
                    ref=m.ref,
                    name=m.name,
                    description=m.description,
                    deliverable=m.deliverable,
                    owner_id=m.owner_id,
                    owner_name=m.owner_name,
                    status=m.status,
                    priority=m.priority,
                    target_date=m.target_date,
                    completion_date=m.completion_date,
                    completion_criteria=m.completion_criteria,
                    order_index=m.order_index,
                    progress_pct=m.progress_pct,
                    custom_fields=m.custom_fields,
                    project_ref=m.project.ref if m.project else None,
                    project_name=m.project.name if m.project else None,
                    task_count=task_cnt,
                    created_at=m.created_at,
                    updated_at=m.updated_at,
                )
            )
        return responses

    async def create_milestone(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_name: str,
        user_id: Optional[uuid.UUID],
        milestone_in: ProjectMilestoneCreate,
    ) -> ProjectMilestoneResponse:
        project = await db.get(Project, milestone_in.project_id)
        if not project or project.tenant_id != tenant_id or project.deleted_at is not None:
            raise NotFoundException("Target project not found.")

        ref = await self._next_ref(db, ProjectMilestone, "MS", tenant_id)
        milestone = ProjectMilestone(
            tenant_id=tenant_id,
            project_id=milestone_in.project_id,
            ref=ref,
            name=milestone_in.name,
            description=milestone_in.description,
            deliverable=milestone_in.deliverable,
            owner_id=milestone_in.owner_id or user_id,
            owner_name=milestone_in.owner_name or user_name,
            status=milestone_in.status,
            priority=milestone_in.priority,
            target_date=milestone_in.target_date,
            completion_date=milestone_in.completion_date,
            completion_criteria=milestone_in.completion_criteria,
            order_index=milestone_in.order_index,
            progress_pct=milestone_in.progress_pct,
            custom_fields=milestone_in.custom_fields,
        )
        db.add(milestone)
        await db.flush()

        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=project.id,
            activity_type="Milestone",
            action="Milestone scheduled",
            actor_name=user_name,
            actor_id=user_id,
            details=f"Milestone '{milestone.name}' scheduled for {milestone.target_date}.",
        )
        await db.commit()
        return (await self.list_milestones(db, tenant_id, project.id))[0]

    async def update_milestone(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        milestone_id: uuid.UUID,
        milestone_update: ProjectMilestoneUpdate,
        user_name: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> ProjectMilestoneResponse:
        milestone = await db.get(ProjectMilestone, milestone_id)
        if not milestone or milestone.tenant_id != tenant_id or milestone.deleted_at is not None:
            raise NotFoundException("Milestone not found.")

        update_dict = milestone_update.model_dump(exclude_unset=True)
        if update_dict.get("status") == "Completed" and not update_dict.get("completion_date"):
            milestone.completion_date = datetime.now(timezone.utc).date()
            milestone.progress_pct = 100

        for key, value in update_dict.items():
            setattr(milestone, key, value)

        milestone.updated_at = datetime.now(timezone.utc)
        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=milestone.project_id,
            activity_type="Milestone",
            action="Milestone updated",
            actor_name=user_name,
            actor_id=user_id,
            details=f"Milestone '{milestone.name}' updated (Status: {milestone.status}, Progress: {milestone.progress_pct}%).",
        )
        await db.commit()

        milestones = await self.list_milestones(db, tenant_id, milestone.project_id)
        match = [m for m in milestones if m.id == milestone_id]
        return match[0] if match else milestones[0]

    async def delete_milestone(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        milestone_id: uuid.UUID,
        user_name: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> None:
        milestone = await db.get(ProjectMilestone, milestone_id)
        if not milestone or milestone.tenant_id != tenant_id or milestone.deleted_at is not None:
            raise NotFoundException("Milestone not found.")

        milestone.deleted_at = datetime.now(timezone.utc)
        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=milestone.project_id,
            activity_type="Milestone",
            action="Milestone removed",
            actor_name=user_name,
            actor_id=user_id,
            details=f"Milestone {milestone.ref} deleted.",
        )
        await db.commit()

    # ------------------------------------------------------------------
    # Tasks & Dependencies CRUD
    # ------------------------------------------------------------------
    async def list_tasks(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: Optional[uuid.UUID] = None,
        milestone_id: Optional[uuid.UUID] = None,
        assigned_user_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
    ) -> List[ProjectTaskResponse]:
        query = select(ProjectTask).where(
            ProjectTask.tenant_id == tenant_id,
            ProjectTask.deleted_at.is_(None)
        ).options(
            selectinload(ProjectTask.project),
            selectinload(ProjectTask.milestone),
            selectinload(ProjectTask.dependencies).selectinload(TaskDependency.depends_on),
        ).order_by(ProjectTask.created_at.desc())

        if project_id:
            query = query.where(ProjectTask.project_id == project_id)
        if milestone_id:
            query = query.where(ProjectTask.milestone_id == milestone_id)
        if assigned_user_id:
            query = query.where(ProjectTask.assigned_user_id == assigned_user_id)
        if status:
            query = query.where(ProjectTask.status == status)

        res = await db.execute(query)
        tasks = res.scalars().all()

        responses = []
        for t in tasks:
            dep_resps = [
                TaskDependencyResponse(
                    id=dep.id,
                    task_id=dep.task_id,
                    depends_on_task_id=dep.depends_on_task_id,
                    dependency_type=dep.dependency_type,
                    depends_on_title=dep.depends_on.title if dep.depends_on else None,
                    depends_on_ref=dep.depends_on.ref if dep.depends_on else None,
                )
                for dep in t.dependencies if dep.deleted_at is None
            ]
            responses.append(
                ProjectTaskResponse(
                    id=t.id,
                    tenant_id=t.tenant_id,
                    project_id=t.project_id,
                    milestone_id=t.milestone_id,
                    parent_task_id=t.parent_task_id,
                    ref=t.ref,
                    title=t.title,
                    description=t.description,
                    assigned_user_id=t.assigned_user_id,
                    assigned_user_name=t.assigned_user_name,
                    priority=t.priority,
                    status=t.status,
                    start_date=t.start_date,
                    due_date=t.due_date,
                    completed_at=t.completed_at,
                    estimated_hours=t.estimated_hours,
                    actual_hours=t.actual_hours,
                    progress_pct=t.progress_pct,
                    blocked_reason=t.blocked_reason,
                    custom_fields=t.custom_fields,
                    project_ref=t.project.ref if t.project else None,
                    project_name=t.project.name if t.project else None,
                    milestone_name=t.milestone.name if t.milestone else None,
                    dependencies=dep_resps,
                    created_at=t.created_at,
                    updated_at=t.updated_at,
                )
            )
        return responses

    async def create_task(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_name: str,
        user_id: Optional[uuid.UUID],
        task_in: ProjectTaskCreate,
    ) -> ProjectTaskResponse:
        project = await db.get(Project, task_in.project_id)
        if not project or project.tenant_id != tenant_id or project.deleted_at is not None:
            raise NotFoundException("Project not found.")

        ref = await self._next_ref(db, ProjectTask, "TSK", tenant_id)
        task = ProjectTask(
            tenant_id=tenant_id,
            project_id=task_in.project_id,
            milestone_id=task_in.milestone_id,
            parent_task_id=task_in.parent_task_id,
            ref=ref,
            title=task_in.title,
            description=task_in.description,
            assigned_user_id=task_in.assigned_user_id or user_id,
            assigned_user_name=task_in.assigned_user_name or user_name,
            priority=task_in.priority,
            status=task_in.status,
            start_date=task_in.start_date,
            due_date=task_in.due_date,
            estimated_hours=task_in.estimated_hours,
            actual_hours=task_in.actual_hours,
            progress_pct=task_in.progress_pct,
            blocked_reason=task_in.blocked_reason,
            custom_fields=task_in.custom_fields,
        )
        db.add(task)
        await db.flush()

        # Handle dependencies if specified
        if task_in.depends_on_task_ids:
            for dep_id in task_in.depends_on_task_ids:
                await self.add_task_dependency(db, tenant_id, task.id, dep_id, "Finish-to-Start")

        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=project.id,
            activity_type="Task",
            action="Task created",
            actor_name=user_name,
            actor_id=user_id,
            details=f"Task '{task.title}' assigned to {task.assigned_user_name or 'Unassigned'}.",
        )
        await db.commit()
        return (await self.list_tasks(db, tenant_id, project_id=project.id, status=task.status))[0]

    async def update_task(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        task_id: uuid.UUID,
        task_update: ProjectTaskUpdate,
        user_name: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> ProjectTaskResponse:
        task = await db.get(ProjectTask, task_id)
        if not task or task.tenant_id != tenant_id or task.deleted_at is not None:
            raise NotFoundException("Task not found.")

        update_dict = task_update.model_dump(exclude_unset=True)
        if update_dict.get("status") == "Completed" and not update_dict.get("completed_at"):
            task.completed_at = datetime.now(timezone.utc)
            task.progress_pct = 100

        for key, value in update_dict.items():
            setattr(task, key, value)

        task.updated_at = datetime.now(timezone.utc)
        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=task.project_id,
            activity_type="Task",
            action="Task progress updated",
            actor_name=user_name,
            actor_id=user_id,
            details=f"Task '{task.title}' (Status: {task.status}, Progress: {task.progress_pct}%).",
        )
        await db.commit()

        tasks = await self.list_tasks(db, tenant_id, project_id=task.project_id)
        match = [t for t in tasks if t.id == task_id]
        return match[0] if match else tasks[0]

    async def delete_task(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        task_id: uuid.UUID,
        user_name: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> None:
        task = await db.get(ProjectTask, task_id)
        if not task or task.tenant_id != tenant_id or task.deleted_at is not None:
            raise NotFoundException("Task not found.")

        task.deleted_at = datetime.now(timezone.utc)
        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=task.project_id,
            activity_type="Task",
            action="Task removed",
            actor_name=user_name,
            actor_id=user_id,
            details=f"Task {task.ref} ('{task.title}') deleted.",
        )
        await db.commit()

    async def add_task_dependency(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        task_id: uuid.UUID,
        depends_on_task_id: uuid.UUID,
        dependency_type: str = "Finish-to-Start",
    ) -> TaskDependencyResponse:
        if task_id == depends_on_task_id:
            raise ValidationException("A task cannot depend on itself.")

        task = await db.get(ProjectTask, task_id)
        dep_task = await db.get(ProjectTask, depends_on_task_id)
        if not task or task.tenant_id != tenant_id or task.deleted_at is not None:
            raise NotFoundException("Task not found.")
        if not dep_task or dep_task.tenant_id != tenant_id or dep_task.deleted_at is not None:
            raise NotFoundException("Target dependency task not found.")

        # Check existing dependency
        existing = await db.execute(
            select(TaskDependency).where(
                TaskDependency.tenant_id == tenant_id,
                TaskDependency.task_id == task_id,
                TaskDependency.depends_on_task_id == depends_on_task_id,
                TaskDependency.deleted_at.is_(None)
            )
        )
        if existing.scalar_one_or_none():
            raise ValidationException("This task dependency already exists.")

        # Cycle detection across dependencies
        all_deps_res = await db.execute(
            select(TaskDependency).where(
                TaskDependency.tenant_id == tenant_id,
                TaskDependency.deleted_at.is_(None)
            )
        )
        all_deps = all_deps_res.scalars().all()

        # Build graph: node -> list of prerequisites (depends_on_task_ids)
        graph: Dict[uuid.UUID, List[uuid.UUID]] = {}
        for d in all_deps:
            graph.setdefault(d.task_id, []).append(d.depends_on_task_id)
        graph.setdefault(task_id, []).append(depends_on_task_id)

        # Check for circular dependency using DFS from depends_on_task_id
        visited = set()
        stack = [depends_on_task_id]
        while stack:
            curr = stack.pop()
            if curr == task_id:
                raise ValidationException("Circular dependency detected. A task cannot depend on its own downstream dependency chain.")
            if curr not in visited:
                visited.add(curr)
                stack.extend(graph.get(curr, []))

        dependency = TaskDependency(
            tenant_id=tenant_id,
            task_id=task_id,
            depends_on_task_id=depends_on_task_id,
            dependency_type=dependency_type,
        )
        db.add(dependency)
        await db.commit()

        return TaskDependencyResponse(
            id=dependency.id,
            task_id=task_id,
            depends_on_task_id=depends_on_task_id,
            dependency_type=dependency_type,
            depends_on_title=dep_task.title,
            depends_on_ref=dep_task.ref,
        )

    async def remove_task_dependency(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        dependency_id: uuid.UUID,
    ) -> None:
        dep = await db.get(TaskDependency, dependency_id)
        if not dep or dep.tenant_id != tenant_id:
            raise NotFoundException("Dependency record not found.")
        await db.delete(dep)
        await db.commit()

    # ------------------------------------------------------------------
    # Resources CRUD
    # ------------------------------------------------------------------
    async def list_resources(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
    ) -> List[ProjectResourceResponse]:
        query = select(ProjectResource).where(
            ProjectResource.tenant_id == tenant_id,
            ProjectResource.deleted_at.is_(None)
        ).options(
            selectinload(ProjectResource.project),
            selectinload(ProjectResource.user),
        ).order_by(ProjectResource.created_at.desc())

        if project_id:
            query = query.where(ProjectResource.project_id == project_id)
        if user_id:
            query = query.where(ProjectResource.user_id == user_id)

        res = await db.execute(query)
        resources = res.scalars().all()

        responses = []
        for r in resources:
            total_cost = r.actual_hours * r.hourly_rate if r.actual_hours > Decimal("0") else r.planned_hours * r.hourly_rate
            responses.append(
                ProjectResourceResponse(
                    id=r.id,
                    tenant_id=r.tenant_id,
                    project_id=r.project_id,
                    user_id=r.user_id,
                    ref=r.ref,
                    role_title=r.role_title,
                    allocation_pct=r.allocation_pct,
                    planned_hours=r.planned_hours,
                    actual_hours=r.actual_hours,
                    hourly_rate=r.hourly_rate,
                    start_date=r.start_date,
                    end_date=r.end_date,
                    status=r.status,
                    custom_fields=r.custom_fields,
                    project_ref=r.project.ref if r.project else None,
                    project_name=r.project.name if r.project else None,
                    user_name=r.user.full_name if r.user else None,
                    user_email=r.user.email if r.user else None,
                    total_cost=total_cost,
                    is_overallocated=r.allocation_pct > 100,
                    created_at=r.created_at,
                    updated_at=r.updated_at,
                )
            )
        return responses

    async def create_resource(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_name: str,
        user_id: Optional[uuid.UUID],
        resource_in: ProjectResourceCreate,
    ) -> ProjectResourceResponse:
        project = await db.get(Project, resource_in.project_id)
        if not project or project.tenant_id != tenant_id or project.deleted_at is not None:
            raise NotFoundException("Project not found.")

        ref = await self._next_ref(db, ProjectResource, "RES", tenant_id)
        resource = ProjectResource(
            tenant_id=tenant_id,
            project_id=resource_in.project_id,
            user_id=resource_in.user_id,
            ref=ref,
            role_title=resource_in.role_title,
            allocation_pct=resource_in.allocation_pct,
            planned_hours=resource_in.planned_hours,
            actual_hours=resource_in.actual_hours,
            hourly_rate=resource_in.hourly_rate,
            start_date=resource_in.start_date,
            end_date=resource_in.end_date,
            status=resource_in.status,
            custom_fields=resource_in.custom_fields,
        )
        db.add(resource)
        await db.flush()

        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=project.id,
            activity_type="Resource Allocation",
            action="Resource assigned",
            actor_name=user_name,
            actor_id=user_id,
            details=f"Assigned {resource.role_title} at {resource.allocation_pct}% allocation.",
        )
        await db.commit()
        return (await self.list_resources(db, tenant_id, project_id=project.id))[0]

    async def update_resource(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        resource_id: uuid.UUID,
        resource_update: ProjectResourceUpdate,
        user_name: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> ProjectResourceResponse:
        resource = await db.get(ProjectResource, resource_id)
        if not resource or resource.tenant_id != tenant_id or resource.deleted_at is not None:
            raise NotFoundException("Resource allocation not found.")

        update_dict = resource_update.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(resource, key, value)

        resource.updated_at = datetime.now(timezone.utc)
        await db.commit()

        resources = await self.list_resources(db, tenant_id, project_id=resource.project_id)
        match = [r for r in resources if r.id == resource_id]
        return match[0] if match else resources[0]

    async def delete_resource(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        resource_id: uuid.UUID,
    ) -> None:
        resource = await db.get(ProjectResource, resource_id)
        if not resource or resource.tenant_id != tenant_id or resource.deleted_at is not None:
            raise NotFoundException("Resource allocation not found.")
        resource.deleted_at = datetime.now(timezone.utc)
        await db.commit()

    # ------------------------------------------------------------------
    # Costs CRUD
    # ------------------------------------------------------------------
    async def list_costs(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: Optional[uuid.UUID] = None,
        category: Optional[str] = None,
    ) -> List[ProjectCostResponse]:
        query = select(ProjectCost).where(
            ProjectCost.tenant_id == tenant_id,
            ProjectCost.deleted_at.is_(None)
        ).options(
            selectinload(ProjectCost.project),
            selectinload(ProjectCost.task),
        ).order_by(ProjectCost.date_incurred.desc())

        if project_id:
            query = query.where(ProjectCost.project_id == project_id)
        if category:
            query = query.where(ProjectCost.category == category)

        res = await db.execute(query)
        costs = res.scalars().all()

        responses = []
        for c in costs:
            responses.append(
                ProjectCostResponse(
                    id=c.id,
                    tenant_id=c.tenant_id,
                    project_id=c.project_id,
                    task_id=c.task_id,
                    ref=c.ref,
                    title=c.title,
                    category=c.category,
                    cost_type=c.cost_type,
                    amount=c.amount,
                    currency=c.currency,
                    date_incurred=c.date_incurred,
                    status=c.status,
                    approved_by_id=c.approved_by_id,
                    approved_by_name=c.approved_by_name,
                    vendor_name=c.vendor_name,
                    notes=c.notes,
                    custom_fields=c.custom_fields,
                    project_ref=c.project.ref if c.project else None,
                    project_name=c.project.name if c.project else None,
                    task_title=c.task.title if c.task else None,
                    created_at=c.created_at,
                    updated_at=c.updated_at,
                )
            )
        return responses

    async def create_cost(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_name: str,
        user_id: Optional[uuid.UUID],
        cost_in: ProjectCostCreate,
    ) -> ProjectCostResponse:
        project = await db.get(Project, cost_in.project_id)
        if not project or project.tenant_id != tenant_id or project.deleted_at is not None:
            raise NotFoundException("Project not found.")

        ref = await self._next_ref(db, ProjectCost, "CST", tenant_id)
        cost = ProjectCost(
            tenant_id=tenant_id,
            project_id=cost_in.project_id,
            task_id=cost_in.task_id,
            ref=ref,
            title=cost_in.title,
            category=cost_in.category,
            cost_type=cost_in.cost_type,
            amount=cost_in.amount,
            currency=cost_in.currency,
            date_incurred=cost_in.date_incurred,
            status=cost_in.status,
            approved_by_id=cost_in.approved_by_id or user_id,
            approved_by_name=cost_in.approved_by_name or user_name,
            vendor_name=cost_in.vendor_name,
            notes=cost_in.notes,
            custom_fields=cost_in.custom_fields,
        )
        db.add(cost)
        await db.flush()

        await self.log_activity(
            db=db,
            tenant_id=tenant_id,
            project_id=project.id,
            activity_type="Financial",
            action="Cost incurred",
            actor_name=user_name,
            actor_id=user_id,
            details=f"Incurred {cost.currency} {cost.amount} ({cost.category}) - '{cost.title}'.",
        )
        await db.commit()
        return (await self.list_costs(db, tenant_id, project_id=project.id))[0]

    async def update_cost(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        cost_id: uuid.UUID,
        cost_update: ProjectCostUpdate,
        user_name: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> ProjectCostResponse:
        cost = await db.get(ProjectCost, cost_id)
        if not cost or cost.tenant_id != tenant_id or cost.deleted_at is not None:
            raise NotFoundException("Cost record not found.")

        update_dict = cost_update.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(cost, key, value)

        cost.updated_at = datetime.now(timezone.utc)
        await db.commit()

        costs = await self.list_costs(db, tenant_id, project_id=cost.project_id)
        match = [c for c in costs if c.id == cost_id]
        return match[0] if match else costs[0]

    async def delete_cost(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        cost_id: uuid.UUID,
    ) -> None:
        cost = await db.get(ProjectCost, cost_id)
        if not cost or cost.tenant_id != tenant_id or cost.deleted_at is not None:
            raise NotFoundException("Cost record not found.")
        cost.deleted_at = datetime.now(timezone.utc)
        await db.commit()

    # ------------------------------------------------------------------
    # Calendar & Timeline Events
    # ------------------------------------------------------------------
    async def list_calendar_events(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[ProjectCalendarEvent]:
        events: List[ProjectCalendarEvent] = []

        # 1. Projects Deadlines
        proj_res = await db.execute(
            select(Project).where(
                Project.tenant_id == tenant_id,
                Project.deleted_at.is_(None),
                Project.target_date.isnot(None),
            ).options(selectinload(Project.account))
        )
        for p in proj_res.scalars().all():
            if (not start_date or p.target_date >= start_date) and (not end_date or p.target_date <= end_date):
                events.append(
                    ProjectCalendarEvent(
                        id=f"prj-{p.id}",
                        title=f"{p.name} - Project Delivery Target",
                        date=p.target_date,
                        time="05:00 PM",
                        type="Deadline",
                        project_id=p.id,
                        project_ref=p.ref,
                        project_name=p.name,
                        account_name=p.account.name if p.account else None,
                        owner=p.manager_name or p.owner_name or "Project Lead",
                        status=p.status,
                        description=p.description or p.objectives,
                    )
                )

        # 2. Milestones
        ms_res = await db.execute(
            select(ProjectMilestone).where(
                ProjectMilestone.tenant_id == tenant_id,
                ProjectMilestone.deleted_at.is_(None),
                ProjectMilestone.target_date.isnot(None),
            ).options(
                selectinload(ProjectMilestone.project).selectinload(Project.account)
            )
        )
        for m in ms_res.scalars().all():
            if (not start_date or m.target_date >= start_date) and (not end_date or m.target_date <= end_date):
                events.append(
                    ProjectCalendarEvent(
                        id=f"ms-{m.id}",
                        title=f"Milestone: {m.name}",
                        date=m.target_date,
                        time="02:00 PM",
                        type="Milestone",
                        project_id=m.project_id,
                        project_ref=m.project.ref if m.project else "PRJ",
                        project_name=m.project.name if m.project else "Project",
                        account_name=m.project.account.name if (m.project and m.project.account) else None,
                        owner=m.owner_name or "Milestone Owner",
                        status=m.status,
                        description=m.deliverable or m.description,
                    )
                )

        # 3. Tasks Due
        task_res = await db.execute(
            select(ProjectTask).where(
                ProjectTask.tenant_id == tenant_id,
                ProjectTask.deleted_at.is_(None),
                ProjectTask.due_date.isnot(None),
            ).options(
                selectinload(ProjectTask.project).selectinload(Project.account)
            )
        )
        for t in task_res.scalars().all():
            if (not start_date or t.due_date >= start_date) and (not end_date or t.due_date <= end_date):
                events.append(
                    ProjectCalendarEvent(
                        id=f"tsk-{t.id}",
                        title=f"Task: {t.title}",
                        date=t.due_date,
                        time="11:00 AM",
                        type="Task",
                        project_id=t.project_id,
                        project_ref=t.project.ref if t.project else "PRJ",
                        project_name=t.project.name if t.project else "Project",
                        account_name=t.project.account.name if (t.project and t.project.account) else None,
                        owner=t.assigned_user_name or "Task Assignee",
                        status=t.status,
                        description=t.description,
                    )
                )

        return sorted(events, key=lambda e: (e.date, e.time))

    # ------------------------------------------------------------------
    # Portfolio Analytics Summary
    # ------------------------------------------------------------------
    async def get_analytics_summary(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
    ) -> ProjectAnalyticsSummary:
        # Projects
        proj_res = await db.execute(
            select(Project).where(
                Project.tenant_id == tenant_id,
                Project.deleted_at.is_(None)
            ).options(selectinload(Project.costs))
        )
        projects = proj_res.scalars().all()

        total_projects = len(projects)
        active_projects = len([p for p in projects if p.status in ("Planning", "In Progress", "In Review")])
        completed_projects = len([p for p in projects if p.status == "Completed"])
        on_track = len([p for p in projects if p.health == "On Track"])
        at_risk = len([p for p in projects if p.health == "At Risk"])
        critical = len([p for p in projects if p.health == "Critical"])

        total_budget = sum((p.budget for p in projects), Decimal("0.00"))
        total_baseline = sum((p.approved_cost_baseline for p in projects), Decimal("0.00"))

        all_costs = []
        for p in projects:
            for c in p.costs:
                if c.deleted_at is None and c.status == "Approved":
                    all_costs.append(c.amount)
        total_actual = sum(all_costs, Decimal("0.00"))
        cost_variance = total_budget - total_actual

        # Tasks
        task_res = await db.execute(
            select(ProjectTask).where(
                ProjectTask.tenant_id == tenant_id,
                ProjectTask.deleted_at.is_(None)
            )
        )
        tasks = task_res.scalars().all()
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.status == "Completed"])
        today = datetime.now(timezone.utc).date()
        overdue_tasks = len([t for t in tasks if t.status != "Completed" and t.due_date and t.due_date < today])
        completion_rate = Decimal("0.00")
        if total_tasks > 0:
            completion_rate = (Decimal(completed_tasks) / Decimal(total_tasks) * Decimal("100.00")).quantize(Decimal("0.01"))

        # Milestones
        ms_res = await db.execute(
            select(ProjectMilestone).where(
                ProjectMilestone.tenant_id == tenant_id,
                ProjectMilestone.deleted_at.is_(None)
            )
        )
        milestones = ms_res.scalars().all()
        total_milestones = len(milestones)
        completed_milestones = len([m for m in milestones if m.status == "Completed"])

        # Resources
        res_res = await db.execute(
            select(ProjectResource).where(
                ProjectResource.tenant_id == tenant_id,
                ProjectResource.deleted_at.is_(None)
            )
        )
        resources = res_res.scalars().all()
        total_resources = len(resources)
        overallocated = len([r for r in resources if r.allocation_pct > 100])

        return ProjectAnalyticsSummary(
            total_projects=total_projects,
            active_projects=active_projects,
            completed_projects=completed_projects,
            on_track_count=on_track,
            at_risk_count=at_risk,
            critical_count=critical,
            total_budget=total_budget,
            total_baseline=total_baseline,
            total_actual_cost=total_actual,
            cost_variance=cost_variance,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            overdue_tasks=overdue_tasks,
            task_completion_rate=completion_rate,
            total_milestones=total_milestones,
            completed_milestones=completed_milestones,
            resource_count=total_resources,
            overallocated_resources=overallocated,
        )

project_service = ProjectService()
