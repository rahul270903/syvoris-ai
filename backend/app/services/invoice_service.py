import uuid
from datetime import datetime, date, timezone
from typing import List, Optional, Tuple
from decimal import Decimal
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sales import Invoice
from app.models.crm import Account
from app.schemas.sales import InvoiceCreate, InvoiceUpdate
from app.core.errors import ValidationException, NotFoundException
from app.services.audit_service import audit_service

class InvoiceService:
    async def list_invoices(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        status: Optional[str] = None,
        account_id: Optional[uuid.UUID] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Invoice], int]:
        query = select(Invoice).where(
            Invoice.tenant_id == tenant_id,
            Invoice.deleted_at.is_(None)
        ).options(
            joinedload(Invoice.account),
            joinedload(Invoice.sales_order)
        )

        if status:
            query = query.where(Invoice.status == status)
        if account_id:
            query = query.where(Invoice.account_id == account_id)
        if q:
            search = f"%{q}%"
            query = query.where(
                or_(
                    Invoice.name.ilike(search),
                    Invoice.ref.ilike(search)
                )
            )

        total_stmt = select(func.count()).select_from(
            select(Invoice.id).where(
                Invoice.tenant_id == tenant_id,
                Invoice.deleted_at.is_(None)
            ).subquery()
        )
        total = (await session.execute(total_stmt)).scalar() or 0

        query = query.order_by(desc(Invoice.created_at)).offset(skip).limit(limit)
        items = (await session.execute(query)).scalars().all()
        return list(items), total

    async def get_invoice(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        invoice_id: uuid.UUID
    ) -> Invoice:
        query = select(Invoice).where(
            Invoice.id == invoice_id,
            Invoice.tenant_id == tenant_id,
            Invoice.deleted_at.is_(None)
        ).options(
            joinedload(Invoice.account),
            joinedload(Invoice.sales_order)
        )
        invoice = (await session.execute(query)).scalar_one_or_none()
        if not invoice:
            raise NotFoundException("Customer Invoice not found in organization.")
        return invoice

    async def record_payment(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        invoice_id: uuid.UUID,
        payment_amount: Decimal,
        actor_id: Optional[uuid.UUID] = None
    ) -> Invoice:
        invoice = await self.get_invoice(session, tenant_id, invoice_id)
        if invoice.status == "Void":
            raise ValidationException("Cannot record payment for a voided invoice.")

        new_paid = invoice.paid_amount + payment_amount
        if new_paid > invoice.total_amount:
            raise ValidationException(f"Payment amount of {payment_amount} exceeds outstanding balance of {invoice.balance_due}.")

        invoice.paid_amount = new_paid
        invoice.balance_due = max(Decimal("0.00"), invoice.total_amount - new_paid)
        if invoice.balance_due == Decimal("0.00"):
            invoice.status = "Paid"
        elif new_paid > Decimal("0.00"):
            invoice.status = "Partially Paid"

        invoice.updated_at = datetime.now(timezone.utc)
        await session.commit()

        await audit_service.log_event(
            session,
            action="invoice.payment_recorded",
            resource_type="invoice",
            tenant_id=tenant_id,
            actor_id=actor_id,
            resource_id=str(invoice.id),
            metadata={
                "ref": invoice.ref,
                "payment_amount": str(payment_amount),
                "paid_amount": str(invoice.paid_amount),
                "balance_due": str(invoice.balance_due),
                "status": invoice.status
            }
        )
        return await self.get_invoice(session, tenant_id, invoice.id)

    async def update_invoice(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        invoice_id: uuid.UUID,
        data: InvoiceUpdate,
        actor_id: Optional[uuid.UUID] = None
    ) -> Invoice:
        invoice = await self.get_invoice(session, tenant_id, invoice_id)
        update_dict = data.model_dump(exclude_unset=True)

        for key, val in update_dict.items():
            if key == "paid_amount" and val is not None:
                invoice.paid_amount = val
                invoice.balance_due = max(Decimal("0.00"), invoice.total_amount - val)
                if invoice.balance_due == Decimal("0.00"):
                    invoice.status = "Paid"
                elif val > Decimal("0.00"):
                    invoice.status = "Partially Paid"
            else:
                setattr(invoice, key, val)

        invoice.updated_at = datetime.now(timezone.utc)
        await session.commit()

        safe_meta = {k: str(v) if isinstance(v, (Decimal, date)) else v for k, v in update_dict.items()}
        await audit_service.log_event(
            session,
            action="invoice.updated",
            resource_type="invoice",
            tenant_id=tenant_id,
            actor_id=actor_id,
            resource_id=str(invoice.id),
            metadata=safe_meta
        )
        return await self.get_invoice(session, tenant_id, invoice.id)

invoice_service = InvoiceService()
