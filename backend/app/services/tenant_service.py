import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant, OrganizationSettings
from app.schemas.tenant import (
    TenantResponse,
    OrgSettingsResponse,
    OrgSettingsUpdate
)
from app.core.errors import NotFoundException
from app.services.audit_service import audit_service

class TenantService:
    @staticmethod
    async def get_tenant_profile(db: AsyncSession, tenant_id: uuid.UUID) -> TenantResponse:
        query = (
            select(Tenant)
            .where(Tenant.id == tenant_id, Tenant.deleted_at.is_(None))
            .options(selectinload(Tenant.organization_settings))
        )
        res = await db.execute(query)
        tenant = res.scalar_one_or_none()
        if not tenant:
            raise NotFoundException("Tenant organization not found.")

        org_resp = None
        if tenant.organization_settings:
            s = tenant.organization_settings
            org_resp = OrgSettingsResponse(
                id=s.id,
                tenant_id=s.tenant_id,
                currency=s.currency,
                timezone=s.timezone,
                date_format=s.date_format,
                logo_url=s.logo_url,
                primary_color=s.primary_color,
                support_email=s.support_email,
                phone=s.phone,
                address=s.address or {}
            )

        return TenantResponse(
            id=tenant.id,
            slug=tenant.slug,
            name=tenant.name,
            plan_tier=tenant.plan_tier,
            status=tenant.status,
            custom_domain=tenant.custom_domain,
            settings=tenant.settings or {},
            organization_settings=org_resp
        )

    @staticmethod
    async def update_organization_settings(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: OrgSettingsUpdate,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "System"
    ) -> OrgSettingsResponse:
        query = select(OrganizationSettings).where(OrganizationSettings.tenant_id == tenant_id)
        res = await db.execute(query)
        settings_obj = res.scalar_one_or_none()

        if not settings_obj:
            settings_obj = OrganizationSettings(tenant_id=tenant_id)
            db.add(settings_obj)

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(settings_obj, key, value)

        await db.commit()
        await db.refresh(settings_obj)

        await audit_service.log_event(
            db, action="tenant.settings_updated", resource_type="organization_settings",
            tenant_id=tenant_id, actor_id=actor_id, actor_name=actor_name,
            resource_id=str(settings_obj.id), metadata=update_dict
        )

        return OrgSettingsResponse(
            id=settings_obj.id,
            tenant_id=settings_obj.tenant_id,
            currency=settings_obj.currency,
            timezone=settings_obj.timezone,
            date_format=settings_obj.date_format,
            logo_url=settings_obj.logo_url,
            primary_color=settings_obj.primary_color,
            support_email=settings_obj.support_email,
            phone=settings_obj.phone,
            address=settings_obj.address or {}
        )

tenant_service = TenantService()
