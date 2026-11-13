import uuid
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission,
)
from app.models.user import User
from app.core.errors import ValidationException
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
    TaskDependencyCreate,
    TaskDependencyResponse,
    ProjectResourceCreate,
    ProjectResourceUpdate,
    ProjectResourceResponse,
    ProjectCostCreate,
    ProjectCostUpdate,
    ProjectCostResponse,
    ProjectCalendarEvent,
    ProjectAnalyticsSummary,
)
from app.services.project_service import project_service

router = APIRouter()

# -------------------------------------------------------------
# Portfolio Analytics & Calendar (Fixed path routes first)
# -------------------------------------------------------------

@router.get("/analytics/summary", response_model=ProjectAnalyticsSummary)
async def get_project_analytics(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("projects:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.get_analytics_summary(db, tenant_id)

@router.get("/calendar/events", response_model=List[ProjectCalendarEvent])
async def list_calendar_events(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("projects:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.list_calendar_events(db, tenant_id, start_date, end_date)

# -------------------------------------------------------------
# Tasks & Dependencies
# -------------------------------------------------------------

@router.get("/tasks", response_model=List[ProjectTaskResponse])
async def list_tasks(
    project_id: Optional[uuid.UUID] = Query(None),
    milestone_id: Optional[uuid.UUID] = Query(None),
    assigned_user_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("tasks:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.list_tasks(
        db, tenant_id, project_id=project_id, milestone_id=milestone_id,
        assigned_user_id=assigned_user_id, status=status
    )

@router.post("/tasks", response_model=ProjectTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: ProjectTaskCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("tasks:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.create_task(
        db, tenant_id, current_user.full_name, current_user.id, task_in
    )

@router.patch("/tasks/{task_id}", response_model=ProjectTaskResponse)
async def update_task(
    task_id: uuid.UUID,
    task_update: ProjectTaskUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("tasks:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.update_task(
        db, tenant_id, task_id, task_update, current_user.full_name, current_user.id
    )

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("tasks:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    await project_service.delete_task(db, tenant_id, task_id, current_user.full_name, current_user.id)

@router.post("/tasks/{task_id}/dependencies", response_model=TaskDependencyResponse, status_code=status.HTTP_201_CREATED)
async def add_task_dependency(
    task_id: uuid.UUID,
    dep_in: TaskDependencyCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("tasks:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.add_task_dependency(
        db, tenant_id, task_id, dep_in.depends_on_task_id, dep_in.dependency_type
    )

@router.delete("/tasks/dependencies/{dependency_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_task_dependency(
    dependency_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("tasks:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    await project_service.remove_task_dependency(db, tenant_id, dependency_id)

# -------------------------------------------------------------
# Milestones
# -------------------------------------------------------------

@router.get("/milestones", response_model=List[ProjectMilestoneResponse])
async def list_milestones(
    project_id: Optional[uuid.UUID] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("milestones:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.list_milestones(db, tenant_id, project_id=project_id)

@router.post("/milestones", response_model=ProjectMilestoneResponse, status_code=status.HTTP_201_CREATED)
async def create_milestone(
    milestone_in: ProjectMilestoneCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("milestones:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.create_milestone(
        db, tenant_id, current_user.full_name, current_user.id, milestone_in
    )

@router.patch("/milestones/{milestone_id}", response_model=ProjectMilestoneResponse)
async def update_milestone(
    milestone_id: uuid.UUID,
    milestone_update: ProjectMilestoneUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("milestones:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.update_milestone(
        db, tenant_id, milestone_id, milestone_update, current_user.full_name, current_user.id
    )

@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(
    milestone_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("milestones:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    await project_service.delete_milestone(db, tenant_id, milestone_id, current_user.full_name, current_user.id)

# -------------------------------------------------------------
# Resources
# -------------------------------------------------------------

@router.get("/resources", response_model=List[ProjectResourceResponse])
async def list_resources(
    project_id: Optional[uuid.UUID] = Query(None),
    user_id: Optional[uuid.UUID] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("resources:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.list_resources(db, tenant_id, project_id=project_id, user_id=user_id)

@router.post("/resources", response_model=ProjectResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    resource_in: ProjectResourceCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("resources:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.create_resource(
        db, tenant_id, current_user.full_name, current_user.id, resource_in
    )

@router.patch("/resources/{resource_id}", response_model=ProjectResourceResponse)
async def update_resource(
    resource_id: uuid.UUID,
    resource_update: ProjectResourceUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("resources:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.update_resource(
        db, tenant_id, resource_id, resource_update, current_user.full_name, current_user.id
    )

@router.delete("/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("resources:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    await project_service.delete_resource(db, tenant_id, resource_id)

# -------------------------------------------------------------
# Costs
# -------------------------------------------------------------

@router.get("/costs", response_model=List[ProjectCostResponse])
async def list_costs(
    project_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("costs:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.list_costs(db, tenant_id, project_id=project_id, category=category)

@router.post("/costs", response_model=ProjectCostResponse, status_code=status.HTTP_201_CREATED)
async def create_cost(
    cost_in: ProjectCostCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("costs:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.create_cost(
        db, tenant_id, current_user.full_name, current_user.id, cost_in
    )

@router.patch("/costs/{cost_id}", response_model=ProjectCostResponse)
async def update_cost(
    cost_id: uuid.UUID,
    cost_update: ProjectCostUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("costs:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.update_cost(
        db, tenant_id, cost_id, cost_update, current_user.full_name, current_user.id
    )

@router.delete("/costs/{cost_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cost(
    cost_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("costs:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    await project_service.delete_cost(db, tenant_id, cost_id)

# -------------------------------------------------------------
# Projects (Main entity)
# -------------------------------------------------------------

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    status: Optional[str] = Query(None),
    health: Optional[str] = Query(None),
    account_id: Optional[uuid.UUID] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("projects:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.list_projects(
        db, tenant_id, status=status, health=health, account_id=account_id
    )

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("projects:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.create_project(
        db, tenant_id, current_user.id, current_user.full_name, project_in
    )

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("projects:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.get_project(db, tenant_id, project_id)

@router.get("/{project_id}/details", response_model=ProjectDetailResponse)
async def get_project_details(
    project_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("projects:read")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.get_project_details(db, tenant_id, project_id)

@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("projects:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    return await project_service.update_project(
        db, tenant_id, project_id, project_update, current_user.full_name, current_user.id
    )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("projects:delete")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    await project_service.delete_project(db, tenant_id, project_id, current_user.full_name, current_user.id)

@router.post("/{project_id}/transition", response_model=ProjectResponse)
async def transition_project_status(
    project_id: uuid.UUID,
    status_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("projects:write")),
    db: AsyncSession = Depends(get_db),
):
    if not tenant_id:
        raise ValidationException("Active tenant context is required.")
    new_status = status_data.get("status")
    if not new_status:
        raise ValidationException("Target status is required.")
    reason = status_data.get("reason")
    return await project_service.transition_project_status(
        db, tenant_id, project_id, new_status, reason, current_user.full_name, current_user.id
    )
