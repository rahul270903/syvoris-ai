import uuid
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
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    WorkflowExecutionResponse,
    WorkflowExecutionRequest,
    PaginatedList,
)
from app.services.workflow_service import WorkflowService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[WorkflowResponse])
async def list_workflows(
    q: Optional[str] = Query(None, description="Search term for workflow name, ref, or action"),
    category: Optional[str] = Query(None, description="Filter by category (Sales, CPQ, Service, etc.)"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Paused, Draft)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("workflows:read")),
    db: AsyncSession = Depends(get_db)
):
    """List business process automation workflow rules."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await WorkflowService.list_workflows(
        db=db,
        tenant_id=tenant_id,
        q=q,
        category=category,
        status=status,
        page=page,
        limit=limit
    )
    return PaginatedList(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_in: WorkflowCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("workflows:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new automation workflow rule."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await WorkflowService.create_workflow(
        db=db,
        workflow_in=workflow_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/{id}", response_model=WorkflowResponse)
async def get_workflow(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("workflows:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve an automation workflow rule by ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await WorkflowService.get_workflow(db, workflow_id=id, tenant_id=tenant_id)

@router.patch("/{id}", response_model=WorkflowResponse)
async def update_workflow(
    id: uuid.UUID,
    workflow_in: WorkflowUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("workflows:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update a workflow rule configuration."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await WorkflowService.update_workflow(
        db=db,
        workflow_id=id,
        workflow_in=workflow_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/{id}/toggle", response_model=WorkflowResponse)
async def toggle_workflow(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("workflows:write")),
    db: AsyncSession = Depends(get_db)
):
    """Toggle a workflow active or paused state."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await WorkflowService.toggle_workflow_status(
        db=db,
        workflow_id=id,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/{id}/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(
    id: uuid.UUID,
    exec_in: WorkflowExecutionRequest,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("workflows:write")),
    db: AsyncSession = Depends(get_db)
):
    """Trigger manual execution or simulation of a workflow rule."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await WorkflowService.execute_workflow(
        db=db,
        workflow_id=id,
        tenant_id=tenant_id,
        payload=exec_in.payload,
        entity_type=exec_in.entity_type,
        entity_id=exec_in.entity_id
    )

@router.get("/{id}/executions", response_model=PaginatedList[WorkflowExecutionResponse])
async def list_workflow_executions(
    id: uuid.UUID,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("workflows:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve historical execution logs for a workflow rule."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await WorkflowService.list_executions(
        db=db,
        tenant_id=tenant_id,
        workflow_id=id,
        page=page,
        limit=limit
    )
    return PaginatedList(items=items, total=total, page=page, limit=limit, pages=pages)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("workflows:write")),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a workflow rule."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await WorkflowService.delete_workflow(
        db=db,
        workflow_id=id,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
