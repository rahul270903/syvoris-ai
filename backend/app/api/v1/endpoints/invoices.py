import uuid
from typing import Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.models.user import User
from app.schemas.sales import InvoiceUpdate, InvoiceResponse
from app.schemas.crm import PaginatedList
from app.services.invoice_service import invoice_service
from app.core.errors import ValidationException

router = APIRouter()

class PaymentRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)

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

@router.get("", response_model=PaginatedList[InvoiceResponse])
async def list_invoices(
    status: Optional[str] = Query(None, description="Invoice status filter"),
    account_id: Optional[uuid.UUID] = Query(None, description="Account filter"),
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
    items, total = await invoice_service.list_invoices(
        session=db,
        tenant_id=tenant_id,
        status=status,
        account_id=account_id,
        q=q,
        skip=skip,
        limit=limit
    )
    pages = (total + limit - 1) // limit if limit > 0 else 1
    serialized = [_serialize_invoice(i) for i in items]
    return PaginatedList(
        items=serialized,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/{id}", response_model=InvoiceResponse)
async def get_invoice(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:read")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    inv = await invoice_service.get_invoice(
        session=db,
        tenant_id=tenant_id,
        invoice_id=id
    )
    return _serialize_invoice(inv)

@router.patch("/{id}", response_model=InvoiceResponse)
async def update_invoice(
    id: uuid.UUID,
    data: InvoiceUpdate,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    inv = await invoice_service.update_invoice(
        session=db,
        tenant_id=tenant_id,
        invoice_id=id,
        data=data,
        actor_id=current_user.id
    )
    return _serialize_invoice(inv)

@router.post("/{id}/payment", response_model=InvoiceResponse)
async def record_payment(
    id: uuid.UUID,
    data: PaymentRequest,
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("quotes:write")),
    db: AsyncSession = Depends(get_db)
):
    if not tenant_id:
        raise ValidationException("No active organization context.")

    inv = await invoice_service.record_payment(
        session=db,
        tenant_id=tenant_id,
        invoice_id=id,
        payment_amount=data.amount,
        actor_id=current_user.id
    )
    return _serialize_invoice(inv)
