import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from decimal import Decimal
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sales import ApprovalRequest
from app.core.errors import NotFoundException

class ApprovalService:
    async def list_approvals(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        status: Optional[str] = None,
        category: Optional[str] = None,
        entity_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[ApprovalRequest], int]:
        query = select(ApprovalRequest).where(
            ApprovalRequest.tenant_id == tenant_id,
            ApprovalRequest.deleted_at.is_(None)
        )

        if status:
            query = query.where(ApprovalRequest.status == status)
        if category:
            query = query.where(ApprovalRequest.category == category)
        if entity_type:
            query = query.where(ApprovalRequest.entity_type == entity_type)

        total_stmt = select(func.count()).select_from(
            select(ApprovalRequest.id).where(
                ApprovalRequest.tenant_id == tenant_id,
                ApprovalRequest.deleted_at.is_(None)
            ).subquery()
        )
        total = (await session.execute(total_stmt)).scalar() or 0

        query = query.order_by(desc(ApprovalRequest.created_at)).offset(skip).limit(limit)
        items = (await session.execute(query)).scalars().all()
        return list(items), total

    async def get_approval(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        approval_id: uuid.UUID
    ) -> ApprovalRequest:
        query = select(ApprovalRequest).where(
            ApprovalRequest.id == approval_id,
            ApprovalRequest.tenant_id == tenant_id,
            ApprovalRequest.deleted_at.is_(None)
        )
        item = (await session.execute(query)).scalar_one_or_none()
        if not item:
            raise NotFoundException("Approval Request not found.")
        return item

approval_service = ApprovalService()
