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
from app.schemas.integration import (
    IntegrationConnectorResponse,
    IntegrationConnectorUpdate,
    IntegrationTestResponse,
    WebhookSubscriptionCreate,
    WebhookSubscriptionUpdate,
    WebhookSubscriptionResponse,
    WebhookDeliveryResponse,
    RadiumSyncRequest,
    RadiumSyncResponse,
    RadiumSyncLogResponse,
    RadiumStatusResponse,
)
from app.services.integration_service import IntegrationService
from app.services.webhook_service import WebhookService
from app.services.radium_connector_service import RadiumConnectorService
from app.core.errors import ValidationException

router = APIRouter()

# --- Integration Connectors ---

@router.get("/connectors", response_model=List[IntegrationConnectorResponse])
async def list_connectors(
    connector_type: Optional[str] = Query(None, description="Filter by type (erp, email, calendar, etc.)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("integrations:read")),
    db: AsyncSession = Depends(get_db)
):
    """List registered external integration connectors (auto-seeds defaults if empty)."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await IntegrationService.list_connectors(
        db=db,
        tenant_id=tenant_id,
        connector_type=connector_type,
        status=status
    )

@router.get("/connectors/{id}", response_model=IntegrationConnectorResponse)
async def get_connector(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("integrations:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve connector details and credentials status."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await IntegrationService.get_connector(db, connector_id=id, tenant_id=tenant_id)

@router.patch("/connectors/{id}", response_model=IntegrationConnectorResponse)
async def update_connector(
    id: uuid.UUID,
    conn_in: IntegrationConnectorUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("integrations:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Update connector credentials, endpoint URL, or synchronization settings."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await IntegrationService.update_connector(
        db=db,
        connector_id=id,
        tenant_id=tenant_id,
        conn_in=conn_in,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/connectors/{id}/test", response_model=IntegrationTestResponse)
async def test_connector(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("integrations:read")),
    db: AsyncSession = Depends(get_db)
):
    """Perform live health check and latency inspection against external connector."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await IntegrationService.test_connection(db, connector_id=id, tenant_id=tenant_id)

# --- Webhook Fabric ---

@router.get("/webhooks", response_model=List[WebhookSubscriptionResponse])
async def list_webhooks(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("webhooks:read")),
    db: AsyncSession = Depends(get_db)
):
    """List registered outbound webhook event subscriptions."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await WebhookService.list_subscriptions(db, tenant_id=tenant_id, is_active=is_active)

@router.get("/webhooks/deliveries", response_model=List[WebhookDeliveryResponse])
async def list_webhook_deliveries(
    subscription_id: Optional[uuid.UUID] = Query(None, description="Filter by subscription"),
    status: Optional[str] = Query(None, description="Filter by status (Success, Retrying, Failed, Dead-Letter)"),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("webhooks:read")),
    db: AsyncSession = Depends(get_db)
):
    """List webhook delivery execution records and Dead-Letter Queue."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await WebhookService.list_deliveries(
        db=db,
        tenant_id=tenant_id,
        subscription_id=subscription_id,
        status=status,
        limit=limit
    )

@router.post("/webhooks", response_model=WebhookSubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    sub_in: WebhookSubscriptionCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("webhooks:write")),
    db: AsyncSession = Depends(get_db)
):
    """Register an outbound webhook endpoint with cryptographically generated HMAC SHA-256 secret."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await WebhookService.create_subscription(
        db=db,
        tenant_id=tenant_id,
        sub_in=sub_in,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/webhooks/{id}", response_model=WebhookSubscriptionResponse)
async def get_webhook(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("webhooks:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve webhook subscription details."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await WebhookService.get_subscription(db, sub_id=id, tenant_id=tenant_id)

@router.patch("/webhooks/{id}", response_model=WebhookSubscriptionResponse)
async def update_webhook(
    id: uuid.UUID,
    sub_in: WebhookSubscriptionUpdate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("webhooks:write")),
    db: AsyncSession = Depends(get_db)
):
    """Update webhook target URL, events, or backoff configuration."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await WebhookService.update_subscription(
        db=db,
        sub_id=id,
        tenant_id=tenant_id,
        sub_in=sub_in,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.delete("/webhooks/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("webhooks:write")),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate and delete a webhook subscription."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    await WebhookService.delete_subscription(
        db=db,
        sub_id=id,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/webhooks/{id}/test", response_model=List[WebhookDeliveryResponse])
async def test_webhook_ping(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("webhooks:write")),
    db: AsyncSession = Depends(get_db)
):
    """Send synthetic ping event through the webhook dispatcher with signed HMAC signature."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    sub = await WebhookService.get_subscription(db, sub_id=id, tenant_id=tenant_id)
    return await WebhookService.dispatch_event(
        db=db,
        tenant_id=tenant_id,
        event_name="ping",
        payload={"ping": True, "ref": sub.ref, "message": "SYVORIS Ai Webhook Test Delivery"}
    )

# --- Radium ERP Bridge ---

@router.post("/radium/sync", response_model=RadiumSyncResponse)
async def trigger_radium_sync(
    req: RadiumSyncRequest,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("integrations:manage")),
    db: AsyncSession = Depends(get_db)
):
    """Trigger bidirectional delta reconciliation between SYVORIS Ai CRM and Radium ERP."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await RadiumConnectorService.trigger_sync(
        db=db,
        tenant_id=tenant_id,
        req=req,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/radium/logs", response_model=List[RadiumSyncLogResponse])
async def list_radium_logs(
    limit: int = Query(20, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("integrations:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve historical transaction sync logs between CRM and Radium ERP."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await RadiumConnectorService.list_sync_logs(db, tenant_id=tenant_id, limit=limit)

@router.get("/radium/status", response_model=RadiumStatusResponse)
async def get_radium_status(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("integrations:read")),
    db: AsyncSession = Depends(get_db)
):
    """Get Radium ERP bridge status, mTLS tunnel telemetry and aggregate counts."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    return await RadiumConnectorService.get_bridge_status(db, tenant_id=tenant_id)
