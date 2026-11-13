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
    QuoteCreate, QuoteUpdate, QuoteResponse, QuoteLineItemResponse,
    QuoteSubmitForApprovalRequest, QuoteApprovalDecisionRequest,
    QuoteAcceptRequest, SalesOrderResponse, OrderLineItemResponse
)
from app.schemas.crm import PaginatedList
from app.services.quote_service import quote_service
from app.core.errors import ValidationException

router = APIRouter()

def _serialize_quote(q) -> QuoteResponse:
    lines = [
        QuoteLineItemResponse(
            id=item.id,
            quote_id=item.quote_id,
            product_id=item.product_id,
            item_name=item.item_name,
            sku=item.sku,
            quantity=item.quantity,
            unit_price=item.unit_price,
            cost_price=item.cost_price,
            discount_pct=item.discount_pct,
            tax_rate=item.tax_rate,
            discount_amount=item.discount_amount,
            net_amount=item.net_amount,
            tax_amount=item.tax_amount,
            line_total=item.line_total,
            sort_order=item.sort_order
        ) for item in getattr(q, "line_items", [])
    ]

    contact_name = None
    if q.contact:
        contact_name = f"{q.contact.first_name} {q.contact.last_name}".strip()

    return QuoteResponse(
        id=q.id,
        tenant_id=q.tenant_id,
        ref=q.ref,
        version=q.version,
        parent_quote_id=q.parent_quote_id,
        name=q.name,
        opportunity_id=q.opportunity_id,
        opportunity_name=q.opportunity.name if q.opportunity else None,
        opportunity_ref=q.opportunity.ref if q.opportunity else None,
        account_id=q.account_id,
        account_name=q.account.name if q.account else None,
        contact_id=q.contact_id,
        contact_name=contact_name,
        price_book_id=q.price_book_id,
        price_book_name=q.price_book.name if q.price_book else None,
        status=q.status,
        valid_until=q.valid_until,
        currency=q.currency,
        header_discount_pct=q.header_discount_pct,
        subtotal=q.subtotal,
        total_discount=q.total_discount,
        total_tax=q.total_tax,
        grand_total=q.grand_total,
        total_cost=q.total_cost,
        margin_amount=q.margin_amount,
        margin_pct=q.margin_pct,
        payment_terms=q.payment_terms,
        notes=q.notes,
        owner_id=q.owner_id,
        owner_name=q.owner_name,
        lines=lines,
        custom_fields=q.custom_fields,
        created_at=q.created_at,
        updated_at=q.updated_at
    )

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

@router.get("", response_model=PaginatedList[QuoteResponse])
async def list_quotes(
    status: Optional[str] = Query(None, description="Quote status filter"),
    account_id: Optional[uuid.UUID] = Query(None, description="Account filter"),
    opportunity_id: Optional[uuid.UUID] = Query(None, description="Opportunity filter"),
    q: Optional[str] = Query(None, description="Search term for name or ref"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    skip = (page - 1) * limit
    items, total = await quote_service.list_quotes(
        session=db,
        tenant_id=tenant_id,
        status=status,
        account_id=account_id,
        opportunity_id=opportunity_id,
        q=q,
        skip=skip,
        limit=limit
    )
    pages = (total + limit - 1) // limit if limit > 0 else 1
    serialized = [_serialize_quote(q) for q in items]
    return PaginatedList(
        items=serialized,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.post("", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_quote(
    data: QuoteCreate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    quote = await quote_service.create_quote(
        session=db,
        tenant_id=tenant_id,
        data=data,
        actor_id=current_user.id,
        actor_name=current_user.email
    )
    return _serialize_quote(quote)

@router.get("/{id}", response_model=QuoteResponse)
async def get_quote(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    quote = await quote_service.get_quote(
        session=db,
        tenant_id=tenant_id,
        quote_id=id
    )
    return _serialize_quote(quote)

@router.patch("/{id}", response_model=QuoteResponse)
async def update_quote(
    id: uuid.UUID,
    data: QuoteUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    quote = await quote_service.update_quote(
        session=db,
        tenant_id=tenant_id,
        quote_id=id,
        data=data,
        actor_id=current_user.id,
        actor_name=current_user.email
    )
    return _serialize_quote(quote)

@router.post("/{id}/revision", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_revision(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    quote = await quote_service.create_revision(
        session=db,
        tenant_id=tenant_id,
        quote_id=id,
        actor_id=current_user.id,
        actor_name=current_user.email
    )
    return _serialize_quote(quote)

@router.post("/{id}/submit-approval", response_model=QuoteResponse)
async def submit_for_approval(
    id: uuid.UUID,
    data: QuoteSubmitForApprovalRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    quote = await quote_service.submit_for_approval(
        session=db,
        tenant_id=tenant_id,
        quote_id=id,
        data=data,
        actor_id=current_user.id,
        actor_name=current_user.email
    )
    return _serialize_quote(quote)

@router.post("/{id}/approve", response_model=QuoteResponse)
async def approve_or_reject_quote(
    id: uuid.UUID,
    data: QuoteApprovalDecisionRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:approve")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    quote = await quote_service.approve_quote(
        session=db,
        tenant_id=tenant_id,
        quote_id=id,
        data=data,
        approver_id=current_user.id,
        approver_name=current_user.email
    )
    return _serialize_quote(quote)

@router.post("/{id}/accept", response_model=SalesOrderResponse)
async def accept_quote_and_convert(
    id: uuid.UUID,
    data: QuoteAcceptRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    order = await quote_service.accept_quote(
        session=db,
        tenant_id=tenant_id,
        quote_id=id,
        data=data,
        actor_id=current_user.id,
        actor_name=current_user.email
    )
    return _serialize_order(order)
