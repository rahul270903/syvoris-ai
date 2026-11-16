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

    async def decide_approval(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        approval_id: uuid.UUID,
        decision: str,
        comments: Optional[str] = None,
        approver_id: Optional[uuid.UUID] = None,
        approver_name: str = "Manager"
    ) -> ApprovalRequest:
        app_req = await self.get_approval(session, tenant_id, approval_id)
        now_dt = datetime.now(timezone.utc)
        is_approved = (decision.lower() == "approve")

        app_req.status = "Approved" if is_approved else "Rejected"
        app_req.approver_id = approver_id
        app_req.approver_name = approver_name
        app_req.resolved_at = now_dt
        if not is_approved:
            app_req.rejection_reason = comments or "Declined by management."

        # If target entity is Quote, update Quote status directly
        if app_req.entity_type == "Quote" and app_req.entity_id:
            from app.models.sales import Quote
            quote_query = select(Quote).where(
                Quote.id == app_req.entity_id,
                Quote.tenant_id == tenant_id
            )
            quote = (await session.execute(quote_query)).scalar_one_or_none()
            if quote:
                quote.status = "Approved" if is_approved else "Rejected"
                quote.updated_at = now_dt

        await session.commit()
        await session.refresh(app_req)
        return app_req

approval_service = ApprovalService()
