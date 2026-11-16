import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, func, and_, or_, delete, update
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import (
    EntityNotFoundException,
    ConflictException,
    ValidationException
)
from app.models.catalog import (
    VendorProfile,
    VendorProduct,
    ServiceItem,
)
from app.models.crm import Account
from app.models.sales import Product
from app.schemas.catalog import (
    VendorProfileCreate,
    VendorProfileUpdate,
    VendorProductCreate,
)

class VendorService:

    # =========================================================================
    # 1. VENDOR PROFILES (Linked to CRM Accounts)
    # =========================================================================

    async def list_vendors(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        vendor_category: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query = (
            select(VendorProfile, Account)
            .join(Account, VendorProfile.account_id == Account.id)
            .where(VendorProfile.tenant_id == tenant_id)
            .options(selectinload(VendorProfile.supplied_products))
        )
        if vendor_category:
            query = query.where(VendorProfile.vendor_category == vendor_category)
        if status:
            query = query.where(VendorProfile.status == status)
        if search:
            s = f"%{search.strip()}%"
            query = query.where(or_(
                Account.name.ilike(s),
                VendorProfile.vendor_code.ilike(s),
                VendorProfile.ref.ilike(s)
            ))

        query = query.order_by(Account.name.asc())
        result = await db.execute(query)
        rows = result.all()

        output = []
        for v, acc in rows:
            output.append({
                "id": v.id,
                "tenant_id": v.tenant_id,
                "ref": v.ref,
                "account_id": v.account_id,
                "account_name": acc.name,
                "account_email": acc.email,
                "account_phone": acc.phone,
                "account_city": (acc.billing_address.get("city") if isinstance(acc.billing_address, dict) else None) or acc.address or "",
                "vendor_code": v.vendor_code,
                "vendor_category": v.vendor_category,
                "payment_terms": v.payment_terms,
                "tax_id": v.tax_id,
                "rating": v.rating,
                "status": v.status,
                "compliance_notes": v.compliance_notes,
                "custom_fields": v.custom_fields,
                "created_at": v.created_at,
                "updated_at": v.updated_at,
                "supplied_products_count": len(v.supplied_products),
                "supplied_products": [
                    {
                        "id": sp.id,
                        "tenant_id": sp.tenant_id,
                        "vendor_id": sp.vendor_id,
                        "product_id": sp.product_id,
                        "service_id": sp.service_id,
                        "vendor_sku": sp.vendor_sku,
                        "unit_cost": sp.unit_cost,
                        "currency": sp.currency,
                        "lead_time_days": sp.lead_time_days,
                        "min_order_quantity": sp.min_order_quantity,
                        "is_preferred_vendor": sp.is_preferred_vendor,
                        "custom_fields": sp.custom_fields,
                        "created_at": sp.created_at,
                        "updated_at": sp.updated_at,
                    }
                    for sp in v.supplied_products
                ]
            })
        return output

    async def get_vendor(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        vendor_id: uuid.UUID,
    ) -> Dict[str, Any]:
        query = (
            select(VendorProfile, Account)
            .join(Account, VendorProfile.account_id == Account.id)
            .where(VendorProfile.id == vendor_id, VendorProfile.tenant_id == tenant_id)
            .options(selectinload(VendorProfile.supplied_products))
        )
        result = await db.execute(query)
        row = result.first()
        if not row:
            raise EntityNotFoundException(f"VendorProfile with id {vendor_id} not found.")

        v, acc = row
        return {
            "id": v.id,
            "tenant_id": v.tenant_id,
            "ref": v.ref,
            "account_id": v.account_id,
            "account_name": acc.name,
            "account_email": acc.email,
            "account_phone": acc.phone,
            "account_city": (acc.billing_address.get("city") if isinstance(acc.billing_address, dict) else None) or acc.address or "",
            "vendor_code": v.vendor_code,
            "vendor_category": v.vendor_category,
            "payment_terms": v.payment_terms,
            "tax_id": v.tax_id,
            "rating": v.rating,
            "status": v.status,
            "compliance_notes": v.compliance_notes,
            "custom_fields": v.custom_fields,
            "created_at": v.created_at,
            "updated_at": v.updated_at,
            "supplied_products_count": len(v.supplied_products),
            "supplied_products": [
                {
                    "id": sp.id,
                    "tenant_id": sp.tenant_id,
                    "vendor_id": sp.vendor_id,
                    "product_id": sp.product_id,
                    "service_id": sp.service_id,
                    "vendor_sku": sp.vendor_sku,
                    "unit_cost": sp.unit_cost,
                    "currency": sp.currency,
                    "lead_time_days": sp.lead_time_days,
                    "min_order_quantity": sp.min_order_quantity,
                    "is_preferred_vendor": sp.is_preferred_vendor,
                    "custom_fields": sp.custom_fields,
                    "created_at": sp.created_at,
                    "updated_at": sp.updated_at,
                }
                for sp in v.supplied_products
            ]
        }

    async def create_vendor(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: VendorProfileCreate,
    ) -> Dict[str, Any]:
        # Verify account exists
        acc_res = await db.execute(
            select(Account).where(Account.id == data.account_id, Account.tenant_id == tenant_id)
        )
        acc = acc_res.scalar_one_or_none()
        if not acc:
            raise EntityNotFoundException(f"CRM Account with id {data.account_id} not found.")

        # Ensure account type is Vendor
        if acc.account_type != "Vendor":
            acc.account_type = "Vendor"

        # Check vendor code uniqueness
        existing = await db.execute(
            select(VendorProfile).where(
                VendorProfile.tenant_id == tenant_id,
                VendorProfile.vendor_code == data.vendor_code.strip()
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Vendor code '{data.vendor_code}' already exists.")

        count_res = await db.execute(
            select(func.count()).select_from(VendorProfile).where(VendorProfile.tenant_id == tenant_id)
        )
        seq = (count_res.scalar() or 0) + 1
        ref = f"VND-{seq:04d}"

        vp = VendorProfile(
            tenant_id=tenant_id,
            ref=ref,
            account_id=data.account_id,
            vendor_code=data.vendor_code.strip(),
            vendor_category=data.vendor_category,
            payment_terms=data.payment_terms,
            tax_id=data.tax_id,
            rating=data.rating,
            status=data.status,
            compliance_notes=data.compliance_notes,
            custom_fields=data.custom_fields,
        )
        db.add(vp)
        await db.commit()
        return await self.get_vendor(db, tenant_id, vp.id)

    async def update_vendor(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        vendor_id: uuid.UUID,
        data: VendorProfileUpdate,
    ) -> Dict[str, Any]:
        res = await db.execute(
            select(VendorProfile).where(VendorProfile.id == vendor_id, VendorProfile.tenant_id == tenant_id)
        )
        vp = res.scalar_one_or_none()
        if not vp:
            raise EntityNotFoundException(f"VendorProfile with id {vendor_id} not found.")

        if data.vendor_category is not None:
            vp.vendor_category = data.vendor_category
        if data.payment_terms is not None:
            vp.payment_terms = data.payment_terms
        if data.tax_id is not None:
            vp.tax_id = data.tax_id
        if data.rating is not None:
            vp.rating = data.rating
        if data.status is not None:
            vp.status = data.status
        if data.compliance_notes is not None:
            vp.compliance_notes = data.compliance_notes
        if data.custom_fields is not None:
            vp.custom_fields = data.custom_fields

        await db.commit()
        return await self.get_vendor(db, tenant_id, vp.id)

    async def delete_vendor(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        vendor_id: uuid.UUID,
    ) -> None:
        res = await db.execute(
            select(VendorProfile).where(VendorProfile.id == vendor_id, VendorProfile.tenant_id == tenant_id)
        )
        vp = res.scalar_one_or_none()
        if not vp:
            raise EntityNotFoundException(f"VendorProfile with id {vendor_id} not found.")
        await db.delete(vp)
        await db.commit()

    # =========================================================================
    # 2. VENDOR PRODUCTS & SUPPLY CATALOG
    # =========================================================================

    async def add_vendor_product(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        vendor_id: uuid.UUID,
        data: VendorProductCreate,
    ) -> VendorProduct:
        # Check vendor exists
        v_res = await db.execute(
            select(VendorProfile).where(VendorProfile.id == vendor_id, VendorProfile.tenant_id == tenant_id)
        )
        if not v_res.scalar_one_or_none():
            raise EntityNotFoundException(f"VendorProfile with id {vendor_id} not found.")

        if not data.product_id and not data.service_id:
            raise ValidationException("Either product_id or service_id must be provided.")

        vp = VendorProduct(
            tenant_id=tenant_id,
            vendor_id=vendor_id,
            product_id=data.product_id,
            service_id=data.service_id,
            vendor_sku=data.vendor_sku,
            unit_cost=data.unit_cost,
            currency=data.currency,
            lead_time_days=data.lead_time_days,
            min_order_quantity=data.min_order_quantity,
            is_preferred_vendor=data.is_preferred_vendor,
            custom_fields=data.custom_fields,
        )
        db.add(vp)
        await db.commit()
        await db.refresh(vp)
        return vp

    async def remove_vendor_product(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        vendor_product_id: uuid.UUID,
    ) -> None:
        res = await db.execute(
            select(VendorProduct).where(VendorProduct.id == vendor_product_id, VendorProduct.tenant_id == tenant_id)
        )
        vp = res.scalar_one_or_none()
        if not vp:
            raise EntityNotFoundException(f"VendorProduct with id {vendor_product_id} not found.")
        await db.delete(vp)
        await db.commit()

vendor_service = VendorService()
