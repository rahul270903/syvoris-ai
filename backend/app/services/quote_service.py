import uuid
from datetime import datetime, date, timezone
from typing import List, Optional, Tuple, Dict, Any
from decimal import Decimal
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sales import (
    Quote, QuoteLineItem, SalesOrder, OrderLineItem,
    ApprovalRequest, Product
)
from app.models.crm import Account, Contact, Opportunity, OpportunityStageHistory
from app.schemas.sales import (
    QuoteCreate, QuoteUpdate, QuoteLineItemCreate,
    QuoteSubmitForApprovalRequest, QuoteApprovalDecisionRequest,
    QuoteAcceptRequest, CPQCalculationRequest, CPQLineInput
)
from app.services.cpq_service import cpq_service
from app.core.errors import ValidationException, NotFoundException
from app.services.audit_service import audit_service

class QuoteService:
    async def _generate_quote_ref(self, session: AsyncSession, tenant_id: uuid.UUID) -> str:
        current_year = datetime.now(timezone.utc).year
        prefix = f"QTE-{current_year}-"
        
        count_query = select(func.count(func.distinct(Quote.ref))).where(
            Quote.tenant_id == tenant_id,
            Quote.ref.like(f"{prefix}%")
        )
        count = (await session.execute(count_query)).scalar() or 0
        return f"{prefix}{count + 1:05d}"

    async def _generate_approval_ref(self, session: AsyncSession, tenant_id: uuid.UUID) -> str:
        current_year = datetime.now(timezone.utc).year
        prefix = f"APR-{current_year}-"
        count_query = select(func.count(ApprovalRequest.id)).where(
            ApprovalRequest.tenant_id == tenant_id,
            ApprovalRequest.ref.like(f"{prefix}%")
        )
        count = (await session.execute(count_query)).scalar() or 0
        return f"{prefix}{count + 1:05d}"

    async def _generate_order_ref(self, session: AsyncSession, tenant_id: uuid.UUID) -> str:
        current_year = datetime.now(timezone.utc).year
        prefix = f"SO-{current_year}-"
        count_query = select(func.count(SalesOrder.id)).where(
            SalesOrder.tenant_id == tenant_id,
            SalesOrder.ref.like(f"{prefix}%")
        )
        count = (await session.execute(count_query)).scalar() or 0
        return f"{prefix}{count + 1:05d}"

    async def list_quotes(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        status: Optional[str] = None,
        account_id: Optional[uuid.UUID] = None,
        opportunity_id: Optional[uuid.UUID] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Quote], int]:
        query = select(Quote).where(
            Quote.tenant_id == tenant_id,
            Quote.deleted_at.is_(None)
        ).options(
            selectinload(Quote.line_items),
            joinedload(Quote.account),
            joinedload(Quote.contact),
            joinedload(Quote.opportunity),
            joinedload(Quote.price_book)
        )

        if status:
            query = query.where(Quote.status == status)
        if account_id:
            query = query.where(Quote.account_id == account_id)
        if opportunity_id:
            query = query.where(Quote.opportunity_id == opportunity_id)
        if q:
            search = f"%{q}%"
            query = query.where(
                or_(
                    Quote.name.ilike(search),
                    Quote.ref.ilike(search),
                    Quote.notes.ilike(search)
                )
            )

        total_stmt = select(func.count()).select_from(
            select(Quote.id).where(
                Quote.tenant_id == tenant_id,
                Quote.deleted_at.is_(None)
            ).subquery()
        )
        total = (await session.execute(total_stmt)).scalar() or 0

        query = query.order_by(desc(Quote.created_at)).offset(skip).limit(limit)
        items = (await session.execute(query)).scalars().all()
        return list(items), total

    async def get_quote(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        quote_id: uuid.UUID
    ) -> Quote:
        query = select(Quote).where(
            Quote.id == quote_id,
            Quote.tenant_id == tenant_id,
            Quote.deleted_at.is_(None)
        ).options(
            selectinload(Quote.line_items),
            joinedload(Quote.account),
            joinedload(Quote.contact),
            joinedload(Quote.opportunity),
            joinedload(Quote.price_book)
        )
        quote = (await session.execute(query)).scalar_one_or_none()
        if not quote:
            raise NotFoundException("Quotation not found in organization.")
        return quote

    async def create_quote(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        data: QuoteCreate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "System"
    ) -> Quote:
        # Validate Account
        acc = (await session.execute(
            select(Account).where(
                Account.id == data.account_id,
                Account.tenant_id == tenant_id,
                Account.deleted_at.is_(None)
            )
        )).scalar_one_or_none()
        if not acc:
            raise ValidationException("Specified account does not exist in this organization.")

        # Validate Opportunity if provided
        if data.opportunity_id:
            opp = (await session.execute(
                select(Opportunity).where(
                    Opportunity.id == data.opportunity_id,
                    Opportunity.tenant_id == tenant_id,
                    Opportunity.deleted_at.is_(None)
                )
            )).scalar_one_or_none()
            if not opp:
                raise ValidationException("Specified opportunity does not exist in this organization.")

        # Perform server-authoritative CPQ calculations
        cpq_request = CPQCalculationRequest(
            price_book_id=data.price_book_id,
            currency=data.currency,
            header_discount_pct=data.header_discount_pct,
            lines=[
                CPQLineInput(
                    product_id=line.product_id,
                    item_name=line.item_name,
                    sku=line.sku,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    cost_price=line.cost_price,
                    discount_pct=line.discount_pct,
                    tax_rate=line.tax_rate,
                    sort_order=line.sort_order
                ) for line in data.lines
            ]
        )
        cpq_calc = cpq_service.calculate(cpq_request)

        ref = await self._generate_quote_ref(session, tenant_id)
        status = "Pending Approval" if cpq_calc.requires_approval else "Draft"

        quote = Quote(
            tenant_id=tenant_id,
            ref=ref,
            version=1,
            parent_quote_id=None,
            name=data.name.strip(),
            opportunity_id=data.opportunity_id,
            account_id=data.account_id,
            contact_id=data.contact_id,
            price_book_id=data.price_book_id,
            status=status,
            valid_until=data.valid_until,
            currency=data.currency,
            header_discount_pct=cpq_calc.header_discount_pct,
            subtotal=cpq_calc.subtotal,
            total_discount=cpq_calc.total_discount,
            total_tax=cpq_calc.total_tax,
            grand_total=cpq_calc.grand_total,
            total_cost=cpq_calc.total_cost,
            margin_amount=cpq_calc.margin_amount,
            margin_pct=cpq_calc.margin_pct,
            payment_terms=data.payment_terms,
            notes=data.notes,
            owner_id=actor_id,
            owner_name=actor_name,
            custom_fields=data.custom_fields
        )
        session.add(quote)
        await session.flush()

        # Add line items
        for line_output in cpq_calc.lines:
            item = QuoteLineItem(
                tenant_id=tenant_id,
                quote_id=quote.id,
                product_id=line_output.product_id,
                item_name=line_output.item_name,
                sku=line_output.sku,
                quantity=line_output.quantity,
                unit_price=line_output.unit_price,
                cost_price=line_output.cost_price,
                discount_pct=line_output.discount_pct,
                tax_rate=line_output.tax_rate,
                discount_amount=line_output.discount_amount,
                net_amount=line_output.net_amount,
                tax_amount=line_output.tax_amount,
                line_total=line_output.line_total,
                sort_order=line_output.sort_order
            )
            session.add(item)

        # If requires approval, create ApprovalRequest
        if cpq_calc.requires_approval:
            app_ref = await self._generate_approval_ref(session, tenant_id)
            approval = ApprovalRequest(
                tenant_id=tenant_id,
                ref=app_ref,
                entity_type="Quote",
                entity_id=quote.id,
                entity_ref=quote.ref,
                title=f"Quote {quote.ref}: Discount Approval Required",
                category="Discount Override",
                requester_id=actor_id,
                requester_name=actor_name,
                status="Pending",
                amount=quote.grand_total,
                discount_pct=quote.header_discount_pct,
                risk="High" if quote.header_discount_pct > Decimal("20.00") else "Medium",
                policy="Commercial Policy §4.2: Discount exceeding 15% requires Manager authorization.",
                justification="; ".join(cpq_calc.approval_reasons)
            )
            session.add(approval)

        await session.commit()

        await audit_service.log_event(
            session,
            action="quote.created",
            resource_type="quote",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(quote.id),
            metadata={
                "ref": quote.ref,
                "version": quote.version,
                "grand_total": str(quote.grand_total),
                "status": quote.status
            }
        )

        return await self.get_quote(session, tenant_id, quote.id)

    async def update_quote(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        quote_id: uuid.UUID,
        data: QuoteUpdate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "System"
    ) -> Quote:
        quote = await self.get_quote(session, tenant_id, quote_id)

        # Approved and Accepted quotes are locked!
        if quote.status in ["Approved", "Accepted"]:
            raise ValidationException(
                f"Quotation {quote.ref} is in '{quote.status}' status and locked against modification. "
                f"Create a new revision to alter commercial terms."
            )

        update_dict = data.model_dump(exclude_unset=True, exclude={"lines"})
        for key, val in update_dict.items():
            setattr(quote, key, val)

        if data.lines is not None:
            # Re-evaluate CPQ
            cpq_request = CPQCalculationRequest(
                price_book_id=quote.price_book_id,
                currency=quote.currency,
                header_discount_pct=quote.header_discount_pct,
                lines=[
                    CPQLineInput(
                        product_id=line.product_id,
                        item_name=line.item_name,
                        sku=line.sku,
                        quantity=line.quantity,
                        unit_price=line.unit_price,
                        cost_price=line.cost_price,
                        discount_pct=line.discount_pct,
                        tax_rate=line.tax_rate,
                        sort_order=line.sort_order
                    ) for line in data.lines
                ]
            )
            cpq_calc = cpq_service.calculate(cpq_request)

            quote.subtotal = cpq_calc.subtotal
            quote.total_discount = cpq_calc.total_discount
            quote.total_tax = cpq_calc.total_tax
            quote.grand_total = cpq_calc.grand_total
            quote.total_cost = cpq_calc.total_cost
            quote.margin_amount = cpq_calc.margin_amount
            quote.margin_pct = cpq_calc.margin_pct

            if cpq_calc.requires_approval and quote.status != "Pending Approval":
                quote.status = "Pending Approval"

            # Clear existing lines and replace
            for old_line in quote.line_items:
                await session.delete(old_line)
            await session.flush()

            for line_output in cpq_calc.lines:
                item = QuoteLineItem(
                    tenant_id=tenant_id,
                    quote_id=quote.id,
                    product_id=line_output.product_id,
                    item_name=line_output.item_name,
                    sku=line_output.sku,
                    quantity=line_output.quantity,
                    unit_price=line_output.unit_price,
                    cost_price=line_output.cost_price,
                    discount_pct=line_output.discount_pct,
                    tax_rate=line_output.tax_rate,
                    discount_amount=line_output.discount_amount,
                    net_amount=line_output.net_amount,
                    tax_amount=line_output.tax_amount,
                    line_total=line_output.line_total,
                    sort_order=line_output.sort_order
                )
                session.add(item)

        quote.updated_at = datetime.now(timezone.utc)
        await session.commit()

        await audit_service.log_event(
            session,
            action="quote.updated",
            resource_type="quote",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(quote.id),
            metadata={"ref": quote.ref, "status": quote.status, "grand_total": str(quote.grand_total)}
        )
        return await self.get_quote(session, tenant_id, quote.id)

    async def create_revision(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        quote_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "System"
    ) -> Quote:
        parent = await self.get_quote(session, tenant_id, quote_id)

        new_quote = Quote(
            tenant_id=tenant_id,
            ref=parent.ref,
            version=parent.version + 1,
            parent_quote_id=parent.id,
            name=f"{parent.name} (Rev {parent.version + 1})",
            opportunity_id=parent.opportunity_id,
            account_id=parent.account_id,
            contact_id=parent.contact_id,
            price_book_id=parent.price_book_id,
            status="Draft",
            valid_until=parent.valid_until,
            currency=parent.currency,
            header_discount_pct=parent.header_discount_pct,
            subtotal=parent.subtotal,
            total_discount=parent.total_discount,
            total_tax=parent.total_tax,
            grand_total=parent.grand_total,
            total_cost=parent.total_cost,
            margin_amount=parent.margin_amount,
            margin_pct=parent.margin_pct,
            payment_terms=parent.payment_terms,
            notes=parent.notes,
            owner_id=actor_id or parent.owner_id,
            owner_name=actor_name if actor_id else parent.owner_name,
            custom_fields=dict(parent.custom_fields)
        )
        session.add(new_quote)
        await session.flush()

        for line in parent.line_items:
            item = QuoteLineItem(
                tenant_id=tenant_id,
                quote_id=new_quote.id,
                product_id=line.product_id,
                item_name=line.item_name,
                sku=line.sku,
                quantity=line.quantity,
                unit_price=line.unit_price,
                cost_price=line.cost_price,
                discount_pct=line.discount_pct,
                tax_rate=line.tax_rate,
                discount_amount=line.discount_amount,
                net_amount=line.net_amount,
                tax_amount=line.tax_amount,
                line_total=line.line_total,
                sort_order=line.sort_order
            )
            session.add(item)

        await session.commit()

        await audit_service.log_event(
            session,
            action="quote.revised",
            resource_type="quote",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(new_quote.id),
            metadata={
                "ref": new_quote.ref,
                "version": new_quote.version,
                "parent_version": parent.version
            }
        )
        return await self.get_quote(session, tenant_id, new_quote.id)

    async def submit_for_approval(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        quote_id: uuid.UUID,
        data: QuoteSubmitForApprovalRequest,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "System"
    ) -> Quote:
        quote = await self.get_quote(session, tenant_id, quote_id)
        if quote.status == "Accepted":
            raise ValidationException("Cannot submit accepted quote for approval.")

        quote.status = "Pending Approval"
        quote.updated_at = datetime.now(timezone.utc)

        app_ref = await self._generate_approval_ref(session, tenant_id)
        approval = ApprovalRequest(
            tenant_id=tenant_id,
            ref=app_ref,
            entity_type="Quote",
            entity_id=quote.id,
            entity_ref=quote.ref,
            title=f"Quote {quote.ref}: Approval Request",
            category="Discount Override",
            requester_id=actor_id,
            requester_name=actor_name,
            status="Pending",
            amount=quote.grand_total,
            discount_pct=quote.header_discount_pct,
            risk="High" if quote.header_discount_pct > Decimal("20.00") else "Medium",
            policy="Commercial Policy §4.2: Discount authorization workflow.",
            justification=data.justification
        )
        session.add(approval)
        await session.commit()

        await audit_service.log_event(
            session,
            action="quote.submitted_for_approval",
            resource_type="quote",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(quote.id),
            metadata={"ref": quote.ref, "justification": data.justification}
        )
        return await self.get_quote(session, tenant_id, quote.id)

    async def approve_quote(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        quote_id: uuid.UUID,
        data: QuoteApprovalDecisionRequest,
        approver_id: Optional[uuid.UUID] = None,
        approver_name: str = "Manager"
    ) -> Quote:
        quote = await self.get_quote(session, tenant_id, quote_id)
        if quote.status != "Pending Approval":
            raise ValidationException(f"Cannot resolve approval for quote in '{quote.status}' status.")

        new_status = "Approved" if data.approved else "Rejected"
        quote.status = new_status
        quote.updated_at = datetime.now(timezone.utc)

        # Update approval request
        app_stmt = select(ApprovalRequest).where(
            ApprovalRequest.tenant_id == tenant_id,
            ApprovalRequest.entity_id == quote.id,
            ApprovalRequest.status == "Pending"
        ).order_by(desc(ApprovalRequest.created_at))
        approval = (await session.execute(app_stmt)).scalars().first()
        if approval:
            approval.status = new_status
            approval.approver_id = approver_id
            approval.approver_name = approver_name
            approval.resolved_at = datetime.now(timezone.utc)
            if not data.approved:
                approval.rejection_reason = data.comments

        await session.commit()

        await audit_service.log_event(
            session,
            action=f"quote.{new_status.lower()}",
            resource_type="quote",
            tenant_id=tenant_id,
            actor_id=approver_id,
            actor_name=approver_name,
            resource_id=str(quote.id),
            metadata={"ref": quote.ref, "decision": new_status, "comments": data.comments}
        )
        return await self.get_quote(session, tenant_id, quote.id)

    async def accept_quote(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        quote_id: uuid.UUID,
        data: QuoteAcceptRequest,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "System"
    ) -> SalesOrder:
        """
        Atomic conversion of an accepted Quote into a confirmed Sales Order.
        If an opportunity is linked, advances Opportunity to Closed Won.
        """
        quote = await self.get_quote(session, tenant_id, quote_id)
        if quote.status == "Rejected":
            raise ValidationException("Cannot accept a rejected quote.")
        if quote.status == "Accepted":
            raise ValidationException("Quotation is already accepted.")
        if quote.status == "Pending Approval":
            raise ValidationException("Quotation requires management approval before client acceptance.")

        # 1. Update quote status to Accepted
        quote.status = "Accepted"
        quote.updated_at = datetime.now(timezone.utc)

        # 2. Create Sales Order
        order_ref = await self._generate_order_ref(session, tenant_id)
        order = SalesOrder(
            tenant_id=tenant_id,
            ref=order_ref,
            name=f"Order from {quote.ref} ({quote.name})",
            quote_id=quote.id,
            opportunity_id=quote.opportunity_id,
            account_id=quote.account_id,
            contact_id=quote.contact_id,
            status="Confirmed",
            fulfilment_stage="Placed",
            total_amount=quote.grand_total,
            currency=quote.currency,
            warehouse_location=data.warehouse_location or "Chicago Central Depot",
            requested_delivery_date=data.requested_delivery_date,
            carrier=data.carrier or "Standard Commercial Freight",
            tracking_number=data.tracking_number,
            payment_terms=quote.payment_terms,
            notes=data.notes or quote.notes,
            owner_id=actor_id or quote.owner_id,
            owner_name=actor_name,
            custom_fields={}
        )

        # 3. Clone quote line items to order line items
        for q_line in quote.line_items:
            o_line = OrderLineItem(
                tenant_id=tenant_id,
                product_id=q_line.product_id,
                item_name=q_line.item_name,
                sku=q_line.sku,
                quantity=q_line.quantity,
                unit_price=q_line.unit_price,
                discount_pct=q_line.discount_pct,
                tax_rate=q_line.tax_rate,
                line_total=q_line.line_total,
                sort_order=q_line.sort_order
            )
            order.line_items.append(o_line)

        session.add(order)

        # 4. Advance Opportunity to Closed Won if linked
        opp = quote.opportunity
        if opp and opp.stage != "Closed Won":
            old_stage = opp.stage
            now_dt = datetime.now(timezone.utc)
            elapsed_days = Decimal("0.00")
            prev_entered_at = opp.stage_entered_at or opp.created_at
            if prev_entered_at:
                if prev_entered_at.tzinfo is None:
                    prev_entered_at = prev_entered_at.replace(tzinfo=timezone.utc)
                delta = now_dt - prev_entered_at
                elapsed_days = Decimal(f"{delta.total_seconds() / 86400:.2f}")

            opp.stage = "Closed Won"
            opp.probability = 100
            opp.stage_entered_at = now_dt
            opp.win_description = f"Accepted Quotation {quote.ref} ({order.ref})"
            opp.updated_at = now_dt

            history_record = OpportunityStageHistory(
                tenant_id=tenant_id,
                opportunity_id=opp.id,
                from_stage=old_stage,
                to_stage="Closed Won",
                transition_at=now_dt,
                days_in_previous_stage=elapsed_days,
                actor_id=actor_id,
                actor_name=actor_name,
                notes=f"Quote {quote.ref} accepted and converted into order {order.ref}"
            )
            session.add(history_record)

        await session.commit()

        # 5. Audit Logging
        await audit_service.log_event(
            session,
            action="quote.accepted",
            resource_type="quote",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(quote.id),
            metadata={"ref": quote.ref, "sales_order_ref": order.ref, "amount": str(quote.grand_total)}
        )

        await audit_service.log_event(
            session,
            action="sales_order.created",
            resource_type="sales_order",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(order.id),
            metadata={"ref": order.ref, "quote_ref": quote.ref, "amount": str(order.total_amount)}
        )

        order.quote = quote
        order.account = quote.account
        order.contact = quote.contact
        order.opportunity = opp
        return order

quote_service = QuoteService()
