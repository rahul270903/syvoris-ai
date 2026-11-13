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
from app.schemas.sales import (
    SalesOrderUpdate, SalesOrderResponse, OrderLineItemResponse,
    InvoiceResponse
)
from app.schemas.crm import PaginatedList
from app.services.order_service import order_service
from app.core.errors import ValidationException

router = APIRouter()

def _serialize_order(order) -> SalesOrderResponse:
    lines = [
        OrderLineItemResponse(
            id=item.id,
            order_id=item.order_id,
            product_id=item.product_id,
            item_name=item.item_name,
            sku=item.sku,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_pct=item.discount_pct,
            tax_rate=item.tax_rate,
            line_total=item.line_total,
            sort_order=item.sort_order
        ) for item in getattr(order, "line_items", [])
    ]
    contact_name = None
    if order.contact:
        contact_name = f"{order.contact.first_name} {order.contact.last_name}".strip()

    return SalesOrderResponse(
        id=order.id,
        tenant_id=order.tenant_id,
        ref=order.ref,
        name=order.name,
        quote_id=order.quote_id,
        quote_ref=order.quote.ref if order.quote else None,
        opportunity_id=order.opportunity_id,
        opportunity_name=order.opportunity.name if order.opportunity else None,
        account_id=order.account_id,
        account_name=order.account.name if order.account else None,
        contact_id=order.contact_id,
        contact_name=contact_name,
        status=order.status,
        fulfilment_stage=order.fulfilment_stage,
        total_amount=order.total_amount,
        currency=order.currency,
        warehouse_location=order.warehouse_location,
        requested_delivery_date=order.requested_delivery_date,
        carrier=order.carrier,
        tracking_number=order.tracking_number,
        payment_terms=order.payment_terms,
        notes=order.notes,
        owner_id=order.owner_id,
        owner_name=order.owner_name,
        lines=lines,
        created_at=order.created_at,
        updated_at=order.updated_at
    )

def _serialize_invoice(inv) -> InvoiceResponse:
    return InvoiceResponse(
        id=inv.id,
        tenant_id=inv.tenant_id,
        ref=inv.ref,
        name=inv.name,
        sales_order_id=inv.sales_order_id,
        sales_order_ref=inv.sales_order.ref if inv.sales_order else None,
        account_id=inv.account_id,
        account_name=inv.account.name if inv.account else None,
        status=inv.status,
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        total_amount=inv.total_amount,
        paid_amount=inv.paid_amount,
        balance_due=inv.balance_due,
        currency=inv.currency,
        payment_terms=inv.payment_terms,
        notes=inv.notes,
        owner_id=inv.owner_id,
        owner_name=inv.owner_name,
        created_at=inv.created_at,
        updated_at=inv.updated_at
    )

@router.get("", response_model=PaginatedList[SalesOrderResponse])
async def list_orders(
    status: Optional[str] = Query(None, description="Order status filter"),
    account_id: Optional[uuid.UUID] = Query(None, description="Account filter"),
    q: Optional[str] = Query(None, description="Search term for name, ref, or tracking"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    skip = (page - 1) * limit
    items, total = await order_service.list_orders(
        session=db,
        tenant_id=tenant_id,
        status=status,
        account_id=account_id,
        q=q,
        skip=skip,
        limit=limit
    )
    pages = (total + limit - 1) // limit if limit > 0 else 1
    serialized = [_serialize_order(o) for o in items]
    return PaginatedList(
        items=serialized,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/{id}", response_model=SalesOrderResponse)
async def get_order(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    order = await order_service.get_order(
        session=db,
        tenant_id=tenant_id,
        order_id=id
    )
    return _serialize_order(order)

@router.patch("/{id}", response_model=SalesOrderResponse)
async def update_order(
    id: uuid.UUID,
    data: SalesOrderUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    order = await order_service.update_order(
        session=db,
        tenant_id=tenant_id,
        order_id=id,
        data=data,
        actor_id=current_user.id
    )
    return _serialize_order(order)

@router.post("/{id}/invoice", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def generate_invoice_from_order(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    invoice = await order_service.create_invoice_from_order(
        session=db,
        tenant_id=tenant_id,
        order_id=id,
        actor_id=current_user.id,
        actor_name=current_user.email
    )
    return _serialize_invoice(invoice)
