import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditEvent

class AuditService:
    @staticmethod
    async def log_event(
        db: AsyncSession,
        action: str,
        resource_type: str,
        tenant_id: Optional[uuid.UUID] = None,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "System",
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        correlation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditEvent:
        """Create an append-only audit record. Sanitizes sensitive keys."""
        safe_meta = {}
        if metadata:
            for k, v in metadata.items():
                if any(secret in k.lower() for secret in ["password", "token", "secret", "authorization", "hash"]):
                    safe_meta[k] = "[REDACTED]"
                else:
                    safe_meta[k] = v

        event = AuditEvent(
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            correlation_id=correlation_id,
            meta=safe_meta
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event

    @staticmethod
    async def list_events(
        db: AsyncSession,
        tenant_id: Optional[uuid.UUID] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditEvent]:
        query = select(AuditEvent)
        if tenant_id:
            query = query.where(AuditEvent.tenant_id == tenant_id)
        query = query.order_by(desc(AuditEvent.created_at)).offset(offset).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

audit_service = AuditService()
