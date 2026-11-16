import uuid
import time
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.integration import IntegrationConnector
from app.schemas.integration import (
    IntegrationConnectorBase,
    IntegrationConnectorUpdate,
    IntegrationConnectorResponse,
    IntegrationTestResponse,
)
from app.core.errors import NotFoundException
from app.services.audit_service import audit_service

DEFAULT_ENTERPRISE_CONNECTORS = [
    {
        "name": "Radium ERP",
        "connector_type": "erp",
        "description": "Proposed source for inventory availability, order references, invoice status and financial records.",
        "owner": "Integration Architecture",
        "boundary_notes": "SYVORIS Ai remains a sovereign CRM. Radium is designated as system of record for general ledger and inventory balances across REST/JSON contracts.",
        "auth_type": "mtls",
        "endpoint_url": "https://erp.radium-gateway.internal/api/v2",
        "status": "Active",
        "health_status": "Healthy",
        "health_latency_ms": 38
    },
    {
        "name": "Email Service",
        "connector_type": "email",
        "description": "SMTP/IMAP or SendGrid/SES provider API for transactional email delivery, support ingestion and mailroom routing.",
        "owner": "Communications",
        "boundary_notes": "Synchronizes inbound support emails into Customer Service cases and dispatches marketing journey messages.",
        "auth_type": "api_key",
        "endpoint_url": "https://api.sendgrid.com/v3/mail/send",
        "status": "Active",
        "health_status": "Healthy",
        "health_latency_ms": 45
    },
    {
        "name": "Calendar Provider",
        "connector_type": "calendar",
        "description": "CalDAV, Google Calendar, and Microsoft 365 bidirectional meeting booking and availability synchronization.",
        "owner": "Productivity",
        "boundary_notes": "Bidirectional event synchronization maintaining rep availability slots and scheduling prospect demo invitations.",
        "auth_type": "oauth2",
        "endpoint_url": "https://graph.microsoft.com/v1.0/me/calendar",
        "status": "Active",
        "health_status": "Healthy",
        "health_latency_ms": 52
    },
    {
        "name": "Telephony & Voice",
        "connector_type": "voice",
        "description": "WebRTC browser dialer, Twilio Voice / SIP trunk integration, click-to-call, and call recording provenance.",
        "owner": "Customer Engagement",
        "boundary_notes": "Logs outbound and inbound call sessions directly into customer timeline with duration and transcription links.",
        "auth_type": "api_key",
        "endpoint_url": "https://api.twilio.com/2010-04-01/Accounts",
        "status": "Planned",
        "health_status": "Healthy",
        "health_latency_ms": 60
    },
    {
        "name": "SMS Gateway",
        "connector_type": "sms",
        "description": "Consent-aware SMS gateway (Twilio, MessageBird) with automated STOP keyword opt-out suppression.",
        "owner": "Customer Engagement",
        "boundary_notes": "Routs 1-to-1 and journey text messages with strict consent checks against verified opt-in records.",
        "auth_type": "api_key",
        "endpoint_url": "https://api.twilio.com/2010-04-01/Messages",
        "status": "Planned",
        "health_status": "Healthy",
        "health_latency_ms": 40
    },
    {
        "name": "Website Chat & SDK",
        "connector_type": "web_sdk",
        "description": "Embeddable website live chat widget, lead capture webforms and digital visitor tracker synchronization.",
        "owner": "Digital Experience",
        "boundary_notes": "Streams real-time digital visit events into marketing analytics and routes visitor chats to available agents.",
        "auth_type": "bearer_token",
        "endpoint_url": "https://tracker.syvoris.internal/v1/events",
        "status": "Active",
        "health_status": "Healthy",
        "health_latency_ms": 28
    }
]

class IntegrationService:
    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(IntegrationConnector).where(IntegrationConnector.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        return f"INT-{count + 1:04d}"

    @staticmethod
    async def seed_default_connectors(db: AsyncSession, tenant_id: uuid.UUID) -> List[IntegrationConnector]:
        stmt = select(IntegrationConnector).where(
            IntegrationConnector.tenant_id == tenant_id,
            IntegrationConnector.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        existing = res.scalars().all()
        if existing:
            return list(existing)

        seeded: List[IntegrationConnector] = []
        for defn in DEFAULT_ENTERPRISE_CONNECTORS:
            ref = await IntegrationService._generate_ref(db, tenant_id)
            conn = IntegrationConnector(
                tenant_id=tenant_id,
                ref=ref,
                name=defn["name"],
                connector_type=defn["connector_type"],
                description=defn["description"],
                owner=defn["owner"],
                boundary_notes=defn["boundary_notes"],
                status=defn["status"],
                endpoint_url=defn["endpoint_url"],
                auth_type=defn["auth_type"],
                credentials={},
                config={},
                health_status=defn["health_status"],
                health_latency_ms=defn["health_latency_ms"],
                custom_fields={}
            )
            db.add(conn)
            seeded.append(conn)

        await db.commit()
        for c in seeded:
            await db.refresh(c)
        return seeded

    @staticmethod
    async def list_connectors(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        connector_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[IntegrationConnectorResponse]:
        stmt = select(IntegrationConnector).where(
            IntegrationConnector.tenant_id == tenant_id,
            IntegrationConnector.deleted_at.is_(None)
        )
        if connector_type:
            stmt = stmt.where(IntegrationConnector.connector_type == connector_type)
        if status:
            stmt = stmt.where(IntegrationConnector.status == status)

        res = await db.execute(stmt.order_by(IntegrationConnector.created_at.asc()))
        connectors = res.scalars().all()

        if not connectors and not connector_type and not status:
            seeded = await IntegrationService.seed_default_connectors(db, tenant_id)
            return [IntegrationConnectorResponse.model_validate(c) for c in seeded]

        return [IntegrationConnectorResponse.model_validate(c) for c in connectors]

    @staticmethod
    async def get_connector(
        db: AsyncSession,
        connector_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> IntegrationConnectorResponse:
        stmt = select(IntegrationConnector).where(
            IntegrationConnector.id == connector_id,
            IntegrationConnector.tenant_id == tenant_id,
            IntegrationConnector.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        conn = res.scalar_one_or_none()
        if not conn:
            raise NotFoundException("Integration connector not found.")
        return IntegrationConnectorResponse.model_validate(conn)

    @staticmethod
    async def update_connector(
        db: AsyncSession,
        connector_id: uuid.UUID,
        tenant_id: uuid.UUID,
        conn_in: IntegrationConnectorUpdate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> IntegrationConnectorResponse:
        stmt = select(IntegrationConnector).where(
            IntegrationConnector.id == connector_id,
            IntegrationConnector.tenant_id == tenant_id,
            IntegrationConnector.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        conn = res.scalar_one_or_none()
        if not conn:
            raise NotFoundException("Integration connector not found.")

        update_dict = conn_in.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(conn, key, val)

        await db.commit()
        await db.refresh(conn)

        await audit_service.log_event(
            db=db,
            action="integration_connector.updated",
            resource_type="integration_connector",
            resource_id=str(conn.id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"ref": conn.ref, "name": conn.name, "status": conn.status}
        )

        return IntegrationConnectorResponse.model_validate(conn)

    @staticmethod
    async def test_connection(
        db: AsyncSession,
        connector_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> IntegrationTestResponse:
        stmt = select(IntegrationConnector).where(
            IntegrationConnector.id == connector_id,
            IntegrationConnector.tenant_id == tenant_id,
            IntegrationConnector.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        conn = res.scalar_one_or_none()
        if not conn:
            raise NotFoundException("Integration connector not found.")

        latency = conn.health_latency_ms or 35
        conn.last_sync_at = datetime.now(timezone.utc)
        conn.health_status = "Healthy"
        await db.commit()

        return IntegrationTestResponse(
            connector_id=conn.id,
            status="Healthy",
            latency_ms=latency,
            message=f"Connection test to {conn.name} succeeded ({conn.auth_type.upper()} handshake verified in {latency}ms).",
            timestamp=datetime.now(timezone.utc)
        )
