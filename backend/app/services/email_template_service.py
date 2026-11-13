import uuid
import re
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_

from app.models.marketing import EmailTemplate
from app.schemas.marketing import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplateResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class EmailTemplateService:
    """Service managing reusable email templates, merge-tag extraction and rendering."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(EmailTemplate).where(EmailTemplate.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"TPL-{year}-{count + 1:05d}"

    @staticmethod
    def _extract_merge_tags(content: str) -> List[str]:
        tags = re.findall(r"\{\{([a-zA-Z0-9_]+)\}\}", content)
        return sorted(list(set(tags)))

    @staticmethod
    async def list_templates(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        q: Optional[str] = None,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[EmailTemplateResponse], int, int]:
        stmt = select(EmailTemplate).where(
            EmailTemplate.tenant_id == tenant_id,
            EmailTemplate.deleted_at.is_(None)
        )

        if q:
            term = f"%{q}%"
            stmt = stmt.where(or_(EmailTemplate.name.ilike(term), EmailTemplate.subject.ilike(term), EmailTemplate.ref.ilike(term)))
        if category:
            stmt = stmt.where(EmailTemplate.category == category)
        if is_active is not None:
            stmt = stmt.where(EmailTemplate.is_active == is_active)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(EmailTemplate.created_at.desc()).offset((page - 1) * limit).limit(limit)
        res = await db.execute(stmt)
        templates = res.scalars().all()
        pages = (total + limit - 1) // limit if total > 0 else 1

        return [EmailTemplateResponse.model_validate(t) for t in templates], total, pages

    @staticmethod
    async def get_template(db: AsyncSession, template_id: uuid.UUID, tenant_id: uuid.UUID) -> EmailTemplateResponse:
        stmt = select(EmailTemplate).where(
            EmailTemplate.id == template_id,
            EmailTemplate.tenant_id == tenant_id,
            EmailTemplate.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        tpl = res.scalar_one_or_none()
        if not tpl:
            raise NotFoundException("Email template not found.")
        return EmailTemplateResponse.model_validate(tpl)

    @staticmethod
    async def create_template(
        db: AsyncSession,
        tpl_in: EmailTemplateCreate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> EmailTemplateResponse:
        ref = await EmailTemplateService._generate_ref(db, tenant_id)
        merge_tags = tpl_in.merge_tags or EmailTemplateService._extract_merge_tags(tpl_in.body_html)

        template = EmailTemplate(
            tenant_id=tenant_id,
            ref=ref,
            name=tpl_in.name,
            subject=tpl_in.subject,
            category=tpl_in.category,
            body_html=tpl_in.body_html,
            body_text=tpl_in.body_text,
            merge_tags=merge_tags,
            is_active=tpl_in.is_active,
            owner_id=tpl_in.owner_id or actor_id,
            owner_name=tpl_in.owner_name or actor_name,
            custom_fields=tpl_in.custom_fields
        )
        db.add(template)
        await db.commit()
        await db.refresh(template)

        await audit_service.log_event(
            db=db,
            action="email_template.created",
            resource_type="email_template",
            resource_id=str(template.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": ref, "name": template.name, "category": template.category}
        )

        return EmailTemplateResponse.model_validate(template)

    @staticmethod
    async def update_template(
        db: AsyncSession,
        template_id: uuid.UUID,
        tpl_in: EmailTemplateUpdate,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> EmailTemplateResponse:
        stmt = select(EmailTemplate).where(
            EmailTemplate.id == template_id,
            EmailTemplate.tenant_id == tenant_id,
            EmailTemplate.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        template = res.scalar_one_or_none()
        if not template:
            raise NotFoundException("Email template not found.")

        update_dict = tpl_in.model_dump(exclude_unset=True)
        if "body_html" in update_dict and "merge_tags" not in update_dict:
            update_dict["merge_tags"] = EmailTemplateService._extract_merge_tags(update_dict["body_html"])

        for key, val in update_dict.items():
            setattr(template, key, val)

        await db.commit()
        await db.refresh(template)

        await audit_service.log_event(
            db=db,
            action="email_template.updated",
            resource_type="email_template",
            resource_id=str(template.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": template.ref, "updated_fields": list(update_dict.keys())}
        )

        return EmailTemplateResponse.model_validate(template)

    @staticmethod
    async def delete_template(
        db: AsyncSession,
        template_id: uuid.UUID,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> None:
        stmt = select(EmailTemplate).where(
            EmailTemplate.id == template_id,
            EmailTemplate.tenant_id == tenant_id,
            EmailTemplate.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        template = res.scalar_one_or_none()
        if not template:
            raise NotFoundException("Email template not found.")

        template.deleted_at = datetime.now(timezone.utc)
        await db.commit()

        await audit_service.log_event(
            db=db,
            action="email_template.deleted",
            resource_type="email_template",
            resource_id=str(template.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": template.ref}
        )

    @staticmethod
    def render_template(content: str, context: Dict[str, Any]) -> str:
        """Substitute {{tag}} placeholders with context values."""
        rendered = content
        for key, val in context.items():
            pattern = re.compile(r"\{\{\s*" + re.escape(key) + r"\s*\}\}")
            rendered = pattern.sub(str(val), rendered)
        return rendered
