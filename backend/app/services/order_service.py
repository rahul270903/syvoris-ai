import uuid
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional, Tuple
from decimal import Decimal
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sales import SalesOrder, OrderLineItem, Invoice, Quote
from app.models.crm import Account, Contact
from app.schemas.sales import SalesOrderCreate, SalesOrderUpdate
from app.core.errors import ValidationException, NotFoundException
from app.services.audit_service import audit_service

class OrderService:
    async def _generate_order_ref(self, session: AsyncSession, tenant_id: uuid.UUID) -> str:
        current_year = datetime.now(timezone.utc).year
        prefix = f"SO-{current_year}-"
        count_query = select(func.count(SalesOrder.id)).where(
            SalesOrder.tenant_id == tenant_id,
            SalesOrder.ref.like(f"{prefix}%")
        )
        count = (await session.execute(count_query)).scalar() or 0
        return f"{prefix}{count + 1:05d}"

    async def _generate_invoice_ref(self, session: AsyncSession, tenant_id: uuid.UUID) -> str:
        current_year = datetime.now(timezone.utc).year
        prefix = f"INV-{current_year}-"
        count_query = select(func.count(Invoice.id)).where(
            Invoice.tenant_id == tenant_id,
            Invoice.ref.like(f"{prefix}%")
        )
        count = (await session.execute(count_query)).scalar() or 0
        return f"{prefix}{count + 1:05d}"

    async def list_orders(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        status: Optional[str] = None,
        account_id: Optional[uuid.UUID] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[SalesOrder], int]:
        query = select(SalesOrder).where(
            SalesOrder.tenant_id == tenant_id,
            SalesOrder.deleted_at.is_(None)
        ).options(
            selectinload(SalesOrder.line_items),
            selectinload(SalesOrder.invoices),
            joinedload(SalesOrder.account),
            joinedload(SalesOrder.contact),
            joinedload(SalesOrder.quote),
            joinedload(SalesOrder.opportunity)
        )

        if status:
            query = query.where(SalesOrder.status == status)
        if account_id:
            query = query.where(SalesOrder.account_id == account_id)
        if q:
            search = f"%{q}%"
            query = query.where(
                or_(
                    SalesOrder.name.ilike(search),
                    SalesOrder.ref.ilike(search),
                    SalesOrder.tracking_number.ilike(search)
                )
            )

        total_stmt = select(func.count()).select_from(
            select(SalesOrder.id).where(
                SalesOrder.tenant_id == tenant_id,
                SalesOrder.deleted_at.is_(None)
            ).subquery()
        )
        total = (await session.execute(total_stmt)).scalar() or 0

        query = query.order_by(desc(SalesOrder.created_at)).offset(skip).limit(limit)
        items = (await session.execute(query)).scalars().all()
        return list(items), total

    async def get_order(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        order_id: uuid.UUID
    ) -> SalesOrder:
        query = select(SalesOrder).where(
            SalesOrder.id == order_id,
            SalesOrder.tenant_id == tenant_id,
            SalesOrder.deleted_at.is_(None)
        ).options(
            selectinload(SalesOrder.line_items),
            selectinload(SalesOrder.invoices),
            joinedload(SalesOrder.account),
            joinedload(SalesOrder.contact),
            joinedload(SalesOrder.quote),
            joinedload(SalesOrder.opportunity)
        )
        order = (await session.execute(query)).scalar_one_or_none()
        if not order:
            raise NotFoundException("Sales Order not found in organization.")
        return order

    async def update_order(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        order_id: uuid.UUID,
        data: SalesOrderUpdate,
        actor_id: Optional[uuid.UUID] = None
    ) -> SalesOrder:
        order = await self.get_order(session, tenant_id, order_id)

        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(order, key, val)

        # Synchronize fulfilment_stage if status changed to Shipped/Delivered
        if "status" in update_dict:
            if update_dict["status"] in ["Shipped", "Delivered", "Packed", "Allocated"]:
                order.fulfilment_stage = update_dict["status"]

        order.updated_at = datetime.now(timezone.utc)
        await session.commit()

        safe_meta = {k: str(v) if isinstance(v, (Decimal, date)) else v for k, v in update_dict.items()}
        await audit_service.log_event(
            session,
            action="sales_order.updated",
            resource_type="sales_order",
            tenant_id=tenant_id,
            actor_id=actor_id,
            resource_id=str(order.id),
            metadata=safe_meta
        )
        return await self.get_order(session, tenant_id, order.id)

    async def create_invoice_from_order(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        order_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "System"
    ) -> Invoice:
        order = await self.get_order(session, tenant_id, order_id)
        if order.status == "Cancelled":
            raise ValidationException("Cannot generate invoice for a cancelled sales order.")

        # Determine payment due date
        days_offset = 30
        if "15" in (order.payment_terms or ""):
            days_offset = 15
        elif "45" in (order.payment_terms or ""):
            days_offset = 45
        elif "60" in (order.payment_terms or ""):
            days_offset = 60
        elif "receipt" in (order.payment_terms or "").lower():
            days_offset = 0

        issue_d = date.today()
        due_d = issue_d + timedelta(days=days_offset)

        inv_ref = await self._generate_invoice_ref(session, tenant_id)
        invoice = Invoice(
            tenant_id=tenant_id,
            ref=inv_ref,
            name=f"Invoice for {order.ref}",
            sales_order_id=order.id,
            account_id=order.account_id,
            status="Issued",
            issue_date=issue_d,
            due_date=due_d,
            total_amount=order.total_amount,
            paid_amount=Decimal("0.00"),
            balance_due=order.total_amount,
            currency=order.currency,
            payment_terms=order.payment_terms,
            notes=order.notes,
            owner_id=actor_id or order.owner_id,
            owner_name=actor_name
        )
        session.add(invoice)
        await session.commit()

        await audit_service.log_event(
            session,
            action="invoice.issued",
            resource_type="invoice",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(invoice.id),
            metadata={"ref": invoice.ref, "order_ref": order.ref, "total_amount": str(invoice.total_amount)}
        )

        query = select(Invoice).where(
            Invoice.id == invoice.id,
            Invoice.tenant_id == tenant_id
        ).options(
            joinedload(Invoice.account),
            joinedload(Invoice.sales_order)
        )
        return (await session.execute(query)).scalar_one()

    async def create_order(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        data: SalesOrderCreate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "Sales Operations"
    ) -> SalesOrder:
        ref = await self._generate_order_ref(session, tenant_id)
        total = Decimal("0.00")
        for line in getattr(data, "lines", []):
            qty = Decimal(str(line.quantity))
            price = Decimal(str(line.unit_price))
            disc_pct = Decimal(str(line.discount_pct or 0))
            tax_rt = Decimal(str(line.tax_rate or 0))
            sub = qty * price
            disc = sub * (disc_pct / Decimal("100"))
            net = sub - disc
            tax = net * (tax_rt / Decimal("100"))
            total += (net + tax)

        order = SalesOrder(
            tenant_id=tenant_id,
            ref=ref,
            name=data.name,
            quote_id=data.quote_id,
            opportunity_id=data.opportunity_id,
            account_id=data.account_id,
            contact_id=data.contact_id,
            status="Draft",
            fulfilment_stage="Draft",
            total_amount=total,
            currency=data.currency or "USD",
            warehouse_location=data.warehouse_location or "Kingston Central Logistics Hub",
            requested_delivery_date=data.requested_delivery_date,
            carrier=data.carrier,
            tracking_number=data.tracking_number,
            payment_terms=data.payment_terms or "Net 30",
            notes=data.notes,
            owner_id=actor_id,
            owner_name=actor_name,
            custom_fields={}
        )
        session.add(order)
        await session.flush()

        for idx, line in enumerate(getattr(data, "lines", [])):
            qty = Decimal(str(line.quantity))
            price = Decimal(str(line.unit_price))
            disc_pct = Decimal(str(line.discount_pct or 0))
            tax_rt = Decimal(str(line.tax_rate or 0))
            sub = qty * price
            disc = sub * (disc_pct / Decimal("100"))
            net = sub - disc
            tax = net * (tax_rt / Decimal("100"))
            ltotal = net + tax

            ol = OrderLineItem(
                tenant_id=tenant_id,
                order_id=order.id,
                product_id=line.product_id,
                item_name=line.item_name,
                sku=line.sku,
                quantity=qty,
                unit_price=price,
                discount_pct=disc_pct,
                tax_rate=tax_rt,
                line_total=ltotal,
                sort_order=idx
            )
            session.add(ol)

        await session.commit()
        await audit_service.log_event(
            session,
            action="sales_order.created",
            resource_type="sales_order",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(order.id),
            metadata={"ref": order.ref, "total_amount": str(order.total_amount)}
        )
        return await self.get_order(session, tenant_id, order.id)

    async def delete_order(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        order_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None
    ) -> None:
        order = await self.get_order(session, tenant_id, order_id)
        order.deleted_at = datetime.now(timezone.utc)
        await session.commit()
        await audit_service.log_event(
            session,
            action="sales_order.deleted",
            resource_type="sales_order",
            tenant_id=tenant_id,
            actor_id=actor_id,
            resource_id=str(order.id),
            metadata={"ref": order.ref, "name": order.name}
        )

order_service = OrderService()
