import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

# --- Commercial Plans ---

class CommercialPlanResponse(BaseModel):
    tier: str
    name: str
    description: str
    monthly_price: float
    annual_price_per_month: float
    currency: str = "USD"
    seats_limit: int
    storage_gb: int
    ai_tokens_limit: int
    api_calls_limit: int
    features: List[str] = Field(default_factory=list)


# --- Subscriptions ---

class TenantSubscriptionResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    stripe_customer_id: str
    stripe_subscription_id: Optional[str] = None
    plan_tier: str
    billing_cycle: str
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    canceled_at: Optional[datetime] = None
    trial_ends_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Usage Metering ---

class TenantUsageMeterResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    billing_period_start: datetime
    billing_period_end: datetime
    seats_limit: int
    seats_used: int
    storage_bytes_limit: int
    storage_bytes_used: int
    storage_gb_used: float
    ai_tokens_limit: int
    ai_tokens_used: int
    api_calls_limit: int
    api_calls_used: int
    seats_percent: float
    storage_percent: float
    ai_tokens_percent: float
    api_calls_percent: float

    model_config = ConfigDict(from_attributes=True)


class UsageRecordCreate(BaseModel):
    meter_type: str = Field(..., description="ai_tokens, storage_bytes, seat, api_call")
    quantity: int = Field(..., ge=1)
    idempotency_key: Optional[str] = None
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UsageRecordResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    meter_type: str
    quantity: int
    idempotency_key: Optional[str] = None
    actor_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Checkout & Customer Portal ---

class CheckoutSessionRequest(BaseModel):
    plan_tier: str = Field(..., description="Starter, Professional, Enterprise, Ultimate")
    billing_cycle: str = Field("monthly", description="monthly or annual")
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class CheckoutSessionResponse(BaseModel):
    session_id: str
    checkout_url: str
    plan_tier: str
    billing_cycle: str


class CustomerPortalRequest(BaseModel):
    return_url: Optional[str] = None


class CustomerPortalResponse(BaseModel):
    portal_url: str


# --- Webhooks ---

class StripeWebhookResponse(BaseModel):
    status: str
    event_id: str
    event_type: str
    message: str
