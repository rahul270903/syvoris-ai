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
from app.schemas.service import (
    KnowledgeArticleCreate,
    KnowledgeArticleUpdate,
    KnowledgeArticleResponse,
    PaginatedList
)
from app.services.knowledge_service import KnowledgeService
from app.core.errors import ValidationException

router = APIRouter()

@router.get("", response_model=PaginatedList[KnowledgeArticleResponse])
async def list_articles(
    q: Optional[str] = Query(None, description="Search term for title or content"),
    category: Optional[str] = Query(None, description="Category filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    visibility: Optional[str] = Query(None, description="Visibility filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("knowledge:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve paginated knowledge base articles."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, total, pages = await KnowledgeService.list_articles(
        db=db,
        tenant_id=tenant_id,
        q=q,
        category=category,
        status=status,
        visibility=visibility,
        page=page,
        limit=limit
    )
    return PaginatedList(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("", response_model=KnowledgeArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    article_in: KnowledgeArticleCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("knowledge:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new knowledge base article."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await KnowledgeService.create_article(
        db=db,
        article_in=article_in,
        tenant_id=tenant_id,
        author_id=current_user.id,
        author_name=current_user.full_name
    )

@router.get("/{id}", response_model=KnowledgeArticleResponse)
async def get_article(
    id: uuid.UUID,
    increment_view: bool = Query(True, description="Whether to increment the view counter"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("knowledge:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve a knowledge article by ID."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await KnowledgeService.get_article(
        db=db,
        article_id=id,
        tenant_id=tenant_id,
        increment_view=increment_view
    )

@router.patch("/{id}", response_model=KnowledgeArticleResponse)
async def update_article(
    id: uuid.UUID,
    article_in: KnowledgeArticleUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("knowledge:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update a knowledge article."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await KnowledgeService.update_article(
        db=db,
        article_id=id,
        article_in=article_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/{id}/helpful", response_model=KnowledgeArticleResponse)
async def vote_helpful(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("knowledge:read")),
    db: AsyncSession = Depends(get_db)
):
    """Mark an article as helpful."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await KnowledgeService.vote_helpful(db, article_id=id, tenant_id=tenant_id)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("knowledge:write")),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a knowledge article."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await KnowledgeService.delete_article(
        db=db,
        article_id=id,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
