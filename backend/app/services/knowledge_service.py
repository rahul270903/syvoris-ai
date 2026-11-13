import uuid
import re
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_

from app.models.service import KnowledgeArticle
from app.schemas.service import (
    KnowledgeArticleCreate,
    KnowledgeArticleUpdate,
    KnowledgeArticleResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class KnowledgeService:
    """Service managing self-service knowledge base articles, categories, and metrics."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(KnowledgeArticle).where(KnowledgeArticle.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"KB-{year}-{count + 1:05d}"

    @staticmethod
    def _slugify(title: str) -> str:
        slug = re.sub(r"[^\w\s-]", "", title).strip().lower()
        slug = re.sub(r"[-\s]+", "-", slug)
        return slug or f"kb-article-{uuid.uuid4().hex[:8]}"

    @staticmethod
    async def list_articles(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        q: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        visibility: Optional[str] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[KnowledgeArticleResponse], int, int]:
        stmt = select(KnowledgeArticle).where(
            KnowledgeArticle.tenant_id == tenant_id,
            KnowledgeArticle.deleted_at.is_(None)
        )

        if q:
            term = f"%{q}%"
            stmt = stmt.where(or_(
                KnowledgeArticle.title.ilike(term),
                KnowledgeArticle.summary.ilike(term),
                KnowledgeArticle.content.ilike(term),
                KnowledgeArticle.ref.ilike(term)
            ))
        if category:
            stmt = stmt.where(KnowledgeArticle.category == category)
        if status:
            stmt = stmt.where(KnowledgeArticle.status == status)
        if visibility:
            stmt = stmt.where(KnowledgeArticle.visibility == visibility)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(KnowledgeArticle.created_at.desc()).offset((page - 1) * limit).limit(limit)
        res = await db.execute(stmt)
        articles = res.scalars().all()
        pages = (total + limit - 1) // limit if total > 0 else 1

        return [KnowledgeArticleResponse.model_validate(a) for a in articles], total, pages

    @staticmethod
    async def get_article(
        db: AsyncSession,
        article_id: uuid.UUID,
        tenant_id: uuid.UUID,
        increment_view: bool = False
    ) -> KnowledgeArticleResponse:
        stmt = select(KnowledgeArticle).where(
            KnowledgeArticle.id == article_id,
            KnowledgeArticle.tenant_id == tenant_id,
            KnowledgeArticle.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        article = res.scalar_one_or_none()
        if not article:
            raise NotFoundException("Knowledge article not found.")

        if increment_view:
            article.view_count += 1
            await db.commit()
            await db.refresh(article)

        return KnowledgeArticleResponse.model_validate(article)

    @staticmethod
    async def create_article(
        db: AsyncSession,
        article_in: KnowledgeArticleCreate,
        tenant_id: uuid.UUID,
        author_id: Optional[uuid.UUID] = None,
        author_name: Optional[str] = None
    ) -> KnowledgeArticleResponse:
        ref = await KnowledgeService._generate_ref(db, tenant_id)
        slug = article_in.slug or KnowledgeService._slugify(article_in.title)

        article = KnowledgeArticle(
            tenant_id=tenant_id,
            ref=ref,
            title=article_in.title,
            slug=slug,
            category=article_in.category,
            summary=article_in.summary,
            content=article_in.content,
            visibility=article_in.visibility,
            status=article_in.status,
            author_id=author_id,
            author_name=author_name or "Support Staff",
            custom_fields=article_in.custom_fields,
            view_count=0,
            helpful_count=0
        )
        db.add(article)
        await db.commit()
        await db.refresh(article)

        await audit_service.log_event(
            db=db,
            action="knowledge_article.created",
            resource_type="knowledge_article",
            resource_id=str(article.id),
            tenant_id=tenant_id,
            actor_id=author_id,
            actor_name=author_name,
            metadata={"ref": ref, "title": article.title, "category": article.category}
        )

        return KnowledgeArticleResponse.model_validate(article)

    @staticmethod
    async def update_article(
        db: AsyncSession,
        article_id: uuid.UUID,
        article_in: KnowledgeArticleUpdate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> KnowledgeArticleResponse:
        stmt = select(KnowledgeArticle).where(
            KnowledgeArticle.id == article_id,
            KnowledgeArticle.tenant_id == tenant_id,
            KnowledgeArticle.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        article = res.scalar_one_or_none()
        if not article:
            raise NotFoundException("Knowledge article not found.")

        update_dict = article_in.model_dump(exclude_unset=True)
        if "title" in update_dict and "slug" not in update_dict:
            update_dict["slug"] = KnowledgeService._slugify(update_dict["title"])

        for key, val in update_dict.items():
            setattr(article, key, val)

        await db.commit()
        await db.refresh(article)

        await audit_service.log_event(
            db=db,
            action="knowledge_article.updated",
            resource_type="knowledge_article",
            resource_id=str(article.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": article.ref, "updated_fields": list(update_dict.keys())}
        )

        return KnowledgeArticleResponse.model_validate(article)

    @staticmethod
    async def vote_helpful(
        db: AsyncSession,
        article_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> KnowledgeArticleResponse:
        stmt = select(KnowledgeArticle).where(
            KnowledgeArticle.id == article_id,
            KnowledgeArticle.tenant_id == tenant_id,
            KnowledgeArticle.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        article = res.scalar_one_or_none()
        if not article:
            raise NotFoundException("Knowledge article not found.")

        article.helpful_count += 1
        await db.commit()
        await db.refresh(article)
        return KnowledgeArticleResponse.model_validate(article)

    @staticmethod
    async def delete_article(
        db: AsyncSession,
        article_id: uuid.UUID,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> None:
        stmt = select(KnowledgeArticle).where(
            KnowledgeArticle.id == article_id,
            KnowledgeArticle.tenant_id == tenant_id,
            KnowledgeArticle.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        article = res.scalar_one_or_none()
        if not article:
            raise NotFoundException("Knowledge article not found.")

        article.deleted_at = datetime.now(timezone.utc)
        await db.commit()

        await audit_service.log_event(
            db=db,
            action="knowledge_article.deleted",
            resource_type="knowledge_article",
            resource_id=str(article.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": article.ref}
        )
