import uuid
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

# ----------------- Products -----------------

class ProductBase(BaseModel):
    sku: str = Field(..., max_length=100)
    name: str = Field(..., max_length=255)
    category: str = Field(default="Software", max_length=100)
    description: Optional[str] = None
    unit_of_measure: str = Field(default="Unit", max_length=32)
    standard_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    tax_category: str = Field(default="Standard", max_length=50)
    tax_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    is_active: bool = True
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    unit_of_measure: Optional[str] = Field(None, max_length=32)
    standard_price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    tax_category: Optional[str] = Field(None, max_length=50)
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# ----------------- Price Books -----------------

class PriceBookEntryCreate(BaseModel):
    product_id: uuid.UUID
    list_price: Decimal = Field(..., ge=0)
    currency: str = Field(default="USD", max_length=3)
    is_active: bool = True

class PriceBookEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    price_book_id: uuid.UUID
    product_id: uuid.UUID
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    list_price: Decimal
    currency: str
    is_active: bool

class PriceBookBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    currency: str = Field(default="USD", max_length=3)
    is_default: bool = False
    is_active: bool = True
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class PriceBookCreate(PriceBookBase):
    entries: Optional[List[PriceBookEntryCreate]] = None

class PriceBookUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    currency: Optional[str] = Field(None, max_length=3)
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    custom_fields: Optional[Dict[str, Any]] = None
    entries: Optional[List[PriceBookEntryCreate]] = None

class PriceBookResponse(PriceBookBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    entries: List[PriceBookEntryResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

# ----------------- CPQ Calculation Engine -----------------

class CPQLineInput(BaseModel):
    product_id: Optional[uuid.UUID] = None
    item_name: str = Field(..., max_length=255)
    sku: Optional[str] = None
    quantity: Decimal = Field(default=Decimal("1.0000"), gt=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    discount_pct: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    sort_order: int = 0

class CPQCalculationRequest(BaseModel):
    price_book_id: Optional[uuid.UUID] = None
    currency: str = Field(default="USD", max_length=3)
    header_discount_pct: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    lines: List[CPQLineInput] = Field(default_factory=list)

class CPQLineOutput(BaseModel):
    product_id: Optional[uuid.UUID] = None
    item_name: str
    sku: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    cost_price: Decimal
    discount_pct: Decimal
    tax_rate: Decimal
    discount_amount: Decimal
    net_amount: Decimal
    tax_amount: Decimal
    line_total: Decimal
    sort_order: int

class CPQCalculationResponse(BaseModel):
    currency: str
    header_discount_pct: Decimal
    subtotal: Decimal
    total_discount: Decimal
    total_tax: Decimal
    grand_total: Decimal
    total_cost: Decimal
    margin_amount: Decimal
    margin_pct: Decimal
    requires_approval: bool
    approval_reasons: List[str]
    lines: List[CPQLineOutput]

# ----------------- Quotes -----------------

class QuoteLineItemCreate(BaseModel):
    product_id: Optional[uuid.UUID] = None
    item_name: str = Field(..., max_length=255)
    sku: Optional[str] = None
    quantity: Decimal = Field(default=Decimal("1.0000"), gt=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    discount_pct: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    sort_order: int = 0

class QuoteLineItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    quote_id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    item_name: str
    sku: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    cost_price: Decimal
    discount_pct: Decimal
    tax_rate: Decimal
    discount_amount: Decimal
    net_amount: Decimal
    tax_amount: Decimal
    line_total: Decimal
    sort_order: int

class QuoteCreate(BaseModel):
    name: str = Field(..., max_length=255)
    opportunity_id: Optional[uuid.UUID] = None
    account_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    price_book_id: Optional[uuid.UUID] = None
    valid_until: date
    currency: str = Field(default="USD", max_length=3)
    header_discount_pct: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    payment_terms: str = Field(default="Net 30", max_length=50)
    notes: Optional[str] = None
    lines: List[QuoteLineItemCreate] = Field(..., min_length=1)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class QuoteUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    opportunity_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    price_book_id: Optional[uuid.UUID] = None
    valid_until: Optional[date] = None
    currency: Optional[str] = Field(None, max_length=3)
    header_discount_pct: Optional[Decimal] = Field(None, ge=0, le=100)
    payment_terms: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    lines: Optional[List[QuoteLineItemCreate]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class QuoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    version: int
    parent_quote_id: Optional[uuid.UUID] = None
    name: str
    opportunity_id: Optional[uuid.UUID] = None
    opportunity_name: Optional[str] = None
    opportunity_ref: Optional[str] = None
    account_id: uuid.UUID
    account_name: Optional[str] = None
    contact_id: Optional[uuid.UUID] = None
    contact_name: Optional[str] = None
    price_book_id: Optional[uuid.UUID] = None
    price_book_name: Optional[str] = None
    status: str
    valid_until: date
    currency: str
    header_discount_pct: Decimal
    subtotal: Decimal
    total_discount: Decimal
    total_tax: Decimal
    grand_total: Decimal
    total_cost: Decimal
    margin_amount: Decimal
    margin_pct: Decimal
    payment_terms: str
    notes: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    lines: List[QuoteLineItemResponse] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

class QuoteSubmitForApprovalRequest(BaseModel):
    justification: str = Field(..., min_length=5)

class QuoteApprovalDecisionRequest(BaseModel):
    approved: bool
    comments: Optional[str] = None

class QuoteAcceptRequest(BaseModel):
    warehouse_location: Optional[str] = None
    requested_delivery_date: Optional[date] = None
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None

# ----------------- Sales Orders -----------------

class OrderLineItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    item_name: str
    sku: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    discount_pct: Decimal
    tax_rate: Decimal
    line_total: Decimal
    sort_order: int

class SalesOrderCreate(BaseModel):
    name: str = Field(..., max_length=255)
    quote_id: Optional[uuid.UUID] = None
    opportunity_id: Optional[uuid.UUID] = None
    account_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    currency: str = Field(default="USD", max_length=3)
    warehouse_location: Optional[str] = None
    requested_delivery_date: Optional[date] = None
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    payment_terms: str = Field(default="Net 30", max_length=50)
    notes: Optional[str] = None
    lines: List[QuoteLineItemCreate] = Field(default_factory=list)

class SalesOrderUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=50)
    fulfilment_stage: Optional[str] = Field(None, max_length=50)
    warehouse_location: Optional[str] = None
    requested_delivery_date: Optional[date] = None
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None

class SalesOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    name: str
    quote_id: Optional[uuid.UUID] = None
    quote_ref: Optional[str] = None
    opportunity_id: Optional[uuid.UUID] = None
    opportunity_name: Optional[str] = None
    account_id: uuid.UUID
    account_name: Optional[str] = None
    contact_id: Optional[uuid.UUID] = None
    contact_name: Optional[str] = None
    status: str
    fulfilment_stage: str
    total_amount: Decimal
    currency: str
    warehouse_location: Optional[str] = None
    requested_delivery_date: Optional[date] = None
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    payment_terms: str
    notes: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    lines: List[OrderLineItemResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

# ----------------- Invoices -----------------

class InvoiceCreate(BaseModel):
    name: str = Field(..., max_length=255)
    sales_order_id: Optional[uuid.UUID] = None
    account_id: uuid.UUID
    status: str = Field(default="Issued", max_length=50)
    issue_date: date
    due_date: date
    total_amount: Decimal = Field(..., ge=0)
    currency: str = Field(default="USD", max_length=3)
    payment_terms: str = Field(default="Net 30", max_length=50)
    notes: Optional[str] = None

class InvoiceUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=50)
    paid_amount: Optional[Decimal] = Field(None, ge=0)
    due_date: Optional[date] = None
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    name: str
    sales_order_id: Optional[uuid.UUID] = None
    sales_order_ref: Optional[str] = None
    account_id: uuid.UUID
    account_name: Optional[str] = None
    status: str
    issue_date: date
    due_date: date
    total_amount: Decimal
    paid_amount: Decimal
    balance_due: Decimal
    currency: str
    payment_terms: str
    notes: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    owner_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# ----------------- Approvals -----------------

class ApprovalRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    entity_type: str
    entity_id: uuid.UUID
    entity_ref: str
    title: str
    category: str
    requester_id: Optional[uuid.UUID] = None
    requester_name: str
    approver_id: Optional[uuid.UUID] = None
    approver_name: Optional[str] = None
    status: str
    amount: Decimal
    discount_pct: Decimal
    risk: str
    policy: str
    justification: str
    rejection_reason: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
