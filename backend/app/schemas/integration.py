import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

# --- Integration Connector Schemas ---

class IntegrationConnectorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    connector_type: str = Field(..., max_length=50)
    description: Optional[str] = None
    owner: Optional[str] = None
    boundary_notes: Optional[str] = None
    status: str = Field("Planned", max_length=32)
    endpoint_url: Optional[str] = None
    auth_type: str = Field("api_key", max_length=50)
    config: Dict[str, Any] = Field(default_factory=dict)
    health_status: str = Field("Healthy", max_length=32)
    health_latency_ms: int = Field(35, ge=0)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class IntegrationConnectorUpdate(BaseModel):
    status: Optional[str] = None
    endpoint_url: Optional[str] = None
    auth_type: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None
    boundary_notes: Optional[str] = None

class IntegrationConnectorResponse(IntegrationConnectorBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    last_sync_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IntegrationTestResponse(BaseModel):
    connector_id: uuid.UUID
    status: str
    latency_ms: int
    message: str
    timestamp: datetime

# --- Webhook Subscription & Delivery Schemas ---

class WebhookSubscriptionBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    target_url: str = Field(..., min_length=5, max_length=500)
    events: List[str] = Field(default_factory=list)
    is_active: bool = True
    max_retries: int = Field(5, ge=1, le=10)
    retry_backoff_seconds: int = Field(30, ge=5, le=3600)
    custom_headers: Dict[str, str] = Field(default_factory=dict)

class WebhookSubscriptionCreate(WebhookSubscriptionBase):
    secret_key: Optional[str] = None

class WebhookSubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    target_url: Optional[str] = None
    events: Optional[List[str]] = None
    is_active: Optional[bool] = None
    max_retries: Optional[int] = None
    retry_backoff_seconds: Optional[int] = None
    custom_headers: Optional[Dict[str, str]] = None

class WebhookSubscriptionResponse(WebhookSubscriptionBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    secret_key: str
    deliveries_count: int = 0
    last_delivered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WebhookDeliveryResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    subscription_id: uuid.UUID
    ref: str
    event_name: str
    payload: Dict[str, Any]
    signature: str
    status: str
    status_code: Optional[int] = None
    response_body: Optional[str] = None
    retry_count: int = 0
    next_retry_at: Optional[datetime] = None
    duration_ms: int = 0
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Radium ERP Schemas ---

class RadiumSyncRequest(BaseModel):
    entity_type: str = Field("All Core Entities", max_length=100)
    # Sales Orders, Inventory Stock, Invoice Status, Customer Master, All Core Entities
    direction: Optional[str] = Field("Bidirectional", max_length=32)

class RadiumSyncResponse(BaseModel):
    sync_log_id: uuid.UUID
    ref: str
    entity_type: str
    direction: str
    status: str
    records_synced: int
    records_failed: int
    latency_ms: int
    details: str
    timestamp: datetime

class RadiumSyncLogResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    entity_type: str
    direction: str
    status: str
    records_synced: int
    records_failed: int
    details: str
    payload_summary: Dict[str, Any]
    latency_ms: int
    initiated_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RadiumStatusResponse(BaseModel):
    bridge_status: str
    latency_ms: int
    tunnel_encryption: str
    last_sync_time: Optional[datetime] = None
    total_records_synced: int
    error_count: int
    active_mappings_count: int
