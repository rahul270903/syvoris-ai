import uuid
from datetime import datetime, timezone, date
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, func, and_, or_, delete
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import (
    EntityNotFoundException,
    ConflictException,
    ValidationException
)
from app.models.catalog import (
    CatalogCategory,
    ServiceItem,
    ProductBundle,
    BundleComponent,
    ProductAvailability,
    TaxRule,
    CommercialTerms,
)
from app.models.sales import Product
from app.schemas.catalog import (
    CatalogCategoryCreate,
    CatalogCategoryUpdate,
    ServiceItemCreate,
    ServiceItemUpdate,
    ProductBundleCreate,
    ProductBundleUpdate,
    ProductAvailabilityCreate,
    ProductAvailabilityUpdate,
    TaxRuleCreate,
    TaxRuleUpdate,
    CommercialTermsCreate,
    CommercialTermsUpdate,
)

class CatalogService:

    # =========================================================================
    # 1. CATALOG CATEGORIES (Hierarchical taxonomy)
    # =========================================================================

    async def list_categories(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        category_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        parent_id: Optional[uuid.UUID] = None,
    ) -> List[CatalogCategory]:
        query = (
            select(CatalogCategory)
            .where(CatalogCategory.tenant_id == tenant_id)
            .options(joinedload(CatalogCategory.parent), selectinload(CatalogCategory.children))
        )
        if category_type:
            query = query.where(CatalogCategory.category_type == category_type)
        if is_active is not None:
            query = query.where(CatalogCategory.is_active == is_active)
        if parent_id is not None:
            query = query.where(CatalogCategory.parent_id == parent_id)
        query = query.order_by(CatalogCategory.sort_order.asc(), CatalogCategory.name.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_category(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        category_id: uuid.UUID,
    ) -> CatalogCategory:
        query = (
            select(CatalogCategory)
            .where(CatalogCategory.id == category_id, CatalogCategory.tenant_id == tenant_id)
            .options(joinedload(CatalogCategory.parent), selectinload(CatalogCategory.children))
        )
        result = await db.execute(query)
        cat = result.scalar_one_or_none()
        if not cat:
            raise EntityNotFoundException(f"CatalogCategory with id {category_id} not found.")
        return cat

    async def create_category(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: CatalogCategoryCreate,
    ) -> CatalogCategory:
        # Check slug uniqueness within tenant
        existing = await db.execute(
            select(CatalogCategory).where(
                CatalogCategory.tenant_id == tenant_id,
                CatalogCategory.slug == data.slug.strip().lower()
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Category slug '{data.slug}' already exists in this tenant.")

        if data.parent_id:
            parent = await self.get_category(db, tenant_id, data.parent_id)
            if not parent:
                raise ValidationException("Specified parent category does not exist.")

        # Generate human-friendly reference
        count_res = await db.execute(
            select(func.count()).select_from(CatalogCategory).where(CatalogCategory.tenant_id == tenant_id)
        )
        seq = (count_res.scalar() or 0) + 1
        ref = f"CAT-{seq:04d}"

        cat = CatalogCategory(
            tenant_id=tenant_id,
            ref=ref,
            name=data.name.strip(),
            slug=data.slug.strip().lower(),
            description=data.description,
            category_type=data.category_type,
            parent_id=data.parent_id,
            sort_order=data.sort_order,
            is_active=data.is_active,
            image_url=data.image_url,
            custom_fields=data.custom_fields,
        )
        db.add(cat)
        await db.commit()
        return await self.get_category(db, tenant_id, cat.id)

    async def update_category(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        category_id: uuid.UUID,
        data: CatalogCategoryUpdate,
    ) -> CatalogCategory:
        cat = await self.get_category(db, tenant_id, category_id)

        if data.slug is not None:
            new_slug = data.slug.strip().lower()
            if new_slug != cat.slug:
                existing = await db.execute(
                    select(CatalogCategory).where(
                        CatalogCategory.tenant_id == tenant_id,
                        CatalogCategory.slug == new_slug,
                        CatalogCategory.id != category_id
                    )
                )
                if existing.scalar_one_or_none():
                    raise ConflictException(f"Category slug '{new_slug}' already exists in this tenant.")
                cat.slug = new_slug

        if data.parent_id is not None:
            if data.parent_id == category_id:
                raise ValidationException("A category cannot be its own parent.")
            # Cycle detection: check that parent_id is not among descendants
            descendant_ids = await self._get_all_descendant_ids(db, tenant_id, category_id)
            if data.parent_id in descendant_ids:
                raise ValidationException("Cannot assign descendant category as parent (cycle detected).")
            cat.parent_id = data.parent_id

        if data.name is not None:
            cat.name = data.name.strip()
        if data.description is not None:
            cat.description = data.description
        if data.category_type is not None:
            cat.category_type = data.category_type
        if data.sort_order is not None:
            cat.sort_order = data.sort_order
        if data.is_active is not None:
            cat.is_active = data.is_active
        if data.image_url is not None:
            cat.image_url = data.image_url
        if data.custom_fields is not None:
            cat.custom_fields = data.custom_fields

        await db.commit()
        return await self.get_category(db, tenant_id, cat.id)

    async def delete_category(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        category_id: uuid.UUID,
    ) -> None:
        cat = await self.get_category(db, tenant_id, category_id)
        # Check if has children
        if cat.children and len(cat.children) > 0:
            raise ValidationException("Cannot delete category with existing subcategories. Reassign or delete subcategories first.")
        # Check if services reference it
        svc_count = await db.execute(
            select(func.count()).select_from(ServiceItem).where(
                ServiceItem.tenant_id == tenant_id,
                ServiceItem.category_id == category_id
            )
        )
        if (svc_count.scalar() or 0) > 0:
            raise ValidationException("Cannot delete category with associated services.")

        await db.delete(cat)
        await db.commit()

    async def _get_all_descendant_ids(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        root_id: uuid.UUID,
    ) -> List[uuid.UUID]:
        descendants = []
        queue = [root_id]
        while queue:
            curr = queue.pop(0)
            res = await db.execute(
                select(CatalogCategory.id).where(
                    CatalogCategory.tenant_id == tenant_id,
                    CatalogCategory.parent_id == curr
                )
            )
            child_ids = list(res.scalars().all())
            descendants.extend(child_ids)
            queue.extend(child_ids)
        return descendants

    # =========================================================================
    # 2. SERVICES CATALOG
    # =========================================================================

    async def list_services(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        category_id: Optional[uuid.UUID] = None,
        service_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ServiceItem]:
        query = select(ServiceItem).where(ServiceItem.tenant_id == tenant_id)
        if category_id:
            query = query.where(ServiceItem.category_id == category_id)
        if service_type:
            query = query.where(ServiceItem.service_type == service_type)
        if status:
            query = query.where(ServiceItem.status == status)
        if search:
            s = f"%{search.strip()}%"
            query = query.where(or_(ServiceItem.name.ilike(s), ServiceItem.code.ilike(s), ServiceItem.ref.ilike(s)))
        query = query.order_by(ServiceItem.name.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_service(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        service_id: uuid.UUID,
    ) -> ServiceItem:
        query = (
            select(ServiceItem)
            .where(ServiceItem.id == service_id, ServiceItem.tenant_id == tenant_id)
            .options(joinedload(ServiceItem.category))
        )
        result = await db.execute(query)
        svc = result.scalar_one_or_none()
        if not svc:
            raise EntityNotFoundException(f"ServiceItem with id {service_id} not found.")
        return svc

    async def create_service(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: ServiceItemCreate,
    ) -> ServiceItem:
        # Check code uniqueness
        existing = await db.execute(
            select(ServiceItem).where(
                ServiceItem.tenant_id == tenant_id,
                ServiceItem.code == data.code.strip()
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Service code '{data.code}' already exists in this tenant.")

        category_name = data.category_name
        if data.category_id:
            cat = await self.get_category(db, tenant_id, data.category_id)
            category_name = cat.name

        count_res = await db.execute(
            select(func.count()).select_from(ServiceItem).where(ServiceItem.tenant_id == tenant_id)
        )
        seq = (count_res.scalar() or 0) + 1
        ref = f"SVC-{seq:04d}"

        svc = ServiceItem(
            tenant_id=tenant_id,
            ref=ref,
            name=data.name.strip(),
            code=data.code.strip(),
            category_id=data.category_id,
            category_name=category_name,
            service_type=data.service_type,
            description=data.description,
            billing_method=data.billing_method,
            billing_frequency=data.billing_frequency,
            duration_unit=data.duration_unit,
            standard_rate=data.standard_rate,
            cost_rate=data.cost_rate,
            currency=data.currency,
            tax_category=data.tax_category,
            tax_rate=data.tax_rate,
            terms_reference=data.terms_reference,
            status=data.status,
            is_active=data.is_active,
            custom_fields=data.custom_fields,
        )
        db.add(svc)
        await db.commit()
        return await self.get_service(db, tenant_id, svc.id)

    async def update_service(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        service_id: uuid.UUID,
        data: ServiceItemUpdate,
    ) -> ServiceItem:
        svc = await self.get_service(db, tenant_id, service_id)

        if data.code is not None:
            new_code = data.code.strip()
            if new_code != svc.code:
                existing = await db.execute(
                    select(ServiceItem).where(
                        ServiceItem.tenant_id == tenant_id,
                        ServiceItem.code == new_code,
                        ServiceItem.id != service_id
                    )
                )
                if existing.scalar_one_or_none():
                    raise ConflictException(f"Service code '{new_code}' already exists in this tenant.")
                svc.code = new_code

        if data.category_id is not None:
            if data.category_id != svc.category_id:
                cat = await self.get_category(db, tenant_id, data.category_id)
                svc.category_id = data.category_id
                svc.category_name = cat.name

        if data.name is not None:
            svc.name = data.name.strip()
        if data.service_type is not None:
            svc.service_type = data.service_type
        if data.description is not None:
            svc.description = data.description
        if data.billing_method is not None:
            svc.billing_method = data.billing_method
        if data.billing_frequency is not None:
            svc.billing_frequency = data.billing_frequency
        if data.duration_unit is not None:
            svc.duration_unit = data.duration_unit
        if data.standard_rate is not None:
            svc.standard_rate = data.standard_rate
        if data.cost_rate is not None:
            svc.cost_rate = data.cost_rate
        if data.currency is not None:
            svc.currency = data.currency
        if data.tax_category is not None:
            svc.tax_category = data.tax_category
        if data.tax_rate is not None:
            svc.tax_rate = data.tax_rate
        if data.terms_reference is not None:
            svc.terms_reference = data.terms_reference
        if data.status is not None:
            svc.status = data.status
        if data.is_active is not None:
            svc.is_active = data.is_active
        if data.custom_fields is not None:
            svc.custom_fields = data.custom_fields

        await db.commit()
        return await self.get_service(db, tenant_id, svc.id)

    async def delete_service(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        service_id: uuid.UUID,
    ) -> None:
        svc = await self.get_service(db, tenant_id, service_id)
        await db.delete(svc)
        await db.commit()

    # =========================================================================
    # 3. PRODUCT BUNDLES
    # =========================================================================

    async def list_bundles(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ProductBundle]:
        query = select(ProductBundle).where(ProductBundle.tenant_id == tenant_id).options(selectinload(ProductBundle.components))
        if status:
            query = query.where(ProductBundle.status == status)
        if search:
            s = f"%{search.strip()}%"
            query = query.where(or_(ProductBundle.name.ilike(s), ProductBundle.bundle_code.ilike(s), ProductBundle.ref.ilike(s)))
        query = query.order_by(ProductBundle.name.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_bundle(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        bundle_id: uuid.UUID,
    ) -> ProductBundle:
        query = (
            select(ProductBundle)
            .where(ProductBundle.id == bundle_id, ProductBundle.tenant_id == tenant_id)
            .options(selectinload(ProductBundle.components))
        )
        result = await db.execute(query)
        bundle = result.scalar_one_or_none()
        if not bundle:
            raise EntityNotFoundException(f"ProductBundle with id {bundle_id} not found.")
        return bundle

    async def create_bundle(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: ProductBundleCreate,
    ) -> ProductBundle:
        existing = await db.execute(
            select(ProductBundle).where(
                ProductBundle.tenant_id == tenant_id,
                ProductBundle.bundle_code == data.bundle_code.strip()
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Bundle code '{data.bundle_code}' already exists in this tenant.")

        count_res = await db.execute(
            select(func.count()).select_from(ProductBundle).where(ProductBundle.tenant_id == tenant_id)
        )
        seq = (count_res.scalar() or 0) + 1
        ref = f"BND-{seq:04d}"

        bundle = ProductBundle(
            tenant_id=tenant_id,
            ref=ref,
            name=data.name.strip(),
            bundle_code=data.bundle_code.strip(),
            description=data.description,
            pricing_model=data.pricing_model,
            bundle_price=data.bundle_price,
            discount_pct=data.discount_pct,
            currency=data.currency,
            valid_from=data.valid_from,
            valid_until=data.valid_until,
            status=data.status,
            is_active=data.is_active,
            custom_fields=data.custom_fields,
        )
        db.add(bundle)
        await db.flush()

        for idx, comp in enumerate(data.components):
            c = BundleComponent(
                tenant_id=tenant_id,
                bundle_id=bundle.id,
                component_type=comp.component_type,
                product_id=comp.product_id,
                service_id=comp.service_id,
                item_name=comp.item_name,
                sku_or_code=comp.sku_or_code,
                quantity=comp.quantity,
                unit_price=comp.unit_price,
                discount_pct=comp.discount_pct,
                is_optional=comp.is_optional,
                sort_order=comp.sort_order or idx,
            )
            db.add(c)

        await db.commit()
        return await self.get_bundle(db, tenant_id, bundle.id)

    async def update_bundle(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        bundle_id: uuid.UUID,
        data: ProductBundleUpdate,
    ) -> ProductBundle:
        bundle = await self.get_bundle(db, tenant_id, bundle_id)

        if data.bundle_code is not None:
            new_code = data.bundle_code.strip()
            if new_code != bundle.bundle_code:
                existing = await db.execute(
                    select(ProductBundle).where(
                        ProductBundle.tenant_id == tenant_id,
                        ProductBundle.bundle_code == new_code,
                        ProductBundle.id != bundle_id
                    )
                )
                if existing.scalar_one_or_none():
                    raise ConflictException(f"Bundle code '{new_code}' already exists in this tenant.")
                bundle.bundle_code = new_code

        if data.name is not None:
            bundle.name = data.name.strip()
        if data.description is not None:
            bundle.description = data.description
        if data.pricing_model is not None:
            bundle.pricing_model = data.pricing_model
        if data.bundle_price is not None:
            bundle.bundle_price = data.bundle_price
        if data.discount_pct is not None:
            bundle.discount_pct = data.discount_pct
        if data.currency is not None:
            bundle.currency = data.currency
        if data.valid_from is not None:
            bundle.valid_from = data.valid_from
        if data.valid_until is not None:
            bundle.valid_until = data.valid_until
        if data.status is not None:
            bundle.status = data.status
        if data.is_active is not None:
            bundle.is_active = data.is_active
        if data.custom_fields is not None:
            bundle.custom_fields = data.custom_fields

        if data.components is not None:
            # Replace components
            await db.execute(
                delete(BundleComponent).where(
                    BundleComponent.bundle_id == bundle_id,
                    BundleComponent.tenant_id == tenant_id
                )
            )
            for idx, comp in enumerate(data.components):
                c = BundleComponent(
                    tenant_id=tenant_id,
                    bundle_id=bundle.id,
                    component_type=comp.component_type,
                    product_id=comp.product_id,
                    service_id=comp.service_id,
                    item_name=comp.item_name,
                    sku_or_code=comp.sku_or_code,
                    quantity=comp.quantity,
                    unit_price=comp.unit_price,
                    discount_pct=comp.discount_pct,
                    is_optional=comp.is_optional,
                    sort_order=comp.sort_order or idx,
                )
                db.add(c)

        await db.commit()
        return await self.get_bundle(db, tenant_id, bundle.id)

    async def delete_bundle(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        bundle_id: uuid.UUID,
    ) -> None:
        bundle = await self.get_bundle(db, tenant_id, bundle_id)
        await db.delete(bundle)
        await db.commit()

    def calculate_bundle_price(self, bundle: ProductBundle) -> Decimal:
        if bundle.pricing_model == "Fixed":
            return bundle.bundle_price
        # Component-based: sum of (unit_price * quantity * (1 - discount_pct/100))
        total = Decimal("0.00")
        for comp in bundle.components:
            line = comp.unit_price * comp.quantity
            if comp.discount_pct > Decimal("0.00"):
                line = line * (Decimal("1.00") - comp.discount_pct / Decimal("100.00"))
            total += line
        if bundle.discount_pct > Decimal("0.00"):
            total = total * (Decimal("1.00") - bundle.discount_pct / Decimal("100.00"))
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # =========================================================================
    # 4. PRODUCT & SERVICE AVAILABILITY
    # =========================================================================

    async def list_availability(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        status: Optional[str] = None,
        channel: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ProductAvailability]:
        query = select(ProductAvailability).where(ProductAvailability.tenant_id == tenant_id)
        if status:
            query = query.where(ProductAvailability.status == status)
        if channel:
            query = query.where(ProductAvailability.channel == channel)
        if search:
            s = f"%{search.strip()}%"
            query = query.where(ProductAvailability.item_name.ilike(s))
        query = query.order_by(ProductAvailability.item_name.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_availability(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        availability_id: uuid.UUID,
    ) -> ProductAvailability:
        query = select(ProductAvailability).where(
            ProductAvailability.id == availability_id,
            ProductAvailability.tenant_id == tenant_id
        )
        result = await db.execute(query)
        item = result.scalar_one_or_none()
        if not item:
            raise EntityNotFoundException(f"ProductAvailability with id {availability_id} not found.")
        return item

    async def create_availability(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: ProductAvailabilityCreate,
    ) -> ProductAvailability:
        item_name = data.item_name
        if data.product_id:
            p_res = await db.execute(select(Product).where(Product.id == data.product_id, Product.tenant_id == tenant_id))
            p = p_res.scalar_one_or_none()
            if p:
                item_name = p.name
        elif data.service_id:
            s_res = await db.execute(select(ServiceItem).where(ServiceItem.id == data.service_id, ServiceItem.tenant_id == tenant_id))
            s = s_res.scalar_one_or_none()
            if s:
                item_name = s.name

        avail = ProductAvailability(
            tenant_id=tenant_id,
            product_id=data.product_id,
            service_id=data.service_id,
            item_name=item_name or "Catalog Item",
            status=data.status,
            effective_start_date=data.effective_start_date,
            effective_end_date=data.effective_end_date,
            channel=data.channel,
            region=data.region,
            lead_time_days=data.lead_time_days,
            notes=data.notes,
            is_active=data.is_active,
            custom_fields=data.custom_fields,
        )
        db.add(avail)
        await db.commit()
        await db.refresh(avail)
        return avail

    async def update_availability(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        availability_id: uuid.UUID,
        data: ProductAvailabilityUpdate,
    ) -> ProductAvailability:
        avail = await self.get_availability(db, tenant_id, availability_id)
        if data.item_name is not None:
            avail.item_name = data.item_name
        if data.status is not None:
            avail.status = data.status
        if data.effective_start_date is not None:
            avail.effective_start_date = data.effective_start_date
        if data.effective_end_date is not None:
            avail.effective_end_date = data.effective_end_date
        if data.channel is not None:
            avail.channel = data.channel
        if data.region is not None:
            avail.region = data.region
        if data.lead_time_days is not None:
            avail.lead_time_days = data.lead_time_days
        if data.notes is not None:
            avail.notes = data.notes
        if data.is_active is not None:
            avail.is_active = data.is_active
        if data.custom_fields is not None:
            avail.custom_fields = data.custom_fields

        await db.commit()
        await db.refresh(avail)
        return avail

    async def delete_availability(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        availability_id: uuid.UUID,
    ) -> None:
        avail = await self.get_availability(db, tenant_id, availability_id)
        await db.delete(avail)
        await db.commit()

    # =========================================================================
    # 5. TAX MANAGEMENT
    # =========================================================================

    async def list_tax_rules(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        status: Optional[str] = None,
        region: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[TaxRule]:
        query = select(TaxRule).where(TaxRule.tenant_id == tenant_id)
        if status:
            query = query.where(TaxRule.status == status)
        if region:
            query = query.where(TaxRule.region == region)
        if search:
            s = f"%{search.strip()}%"
            query = query.where(or_(TaxRule.name.ilike(s), TaxRule.code.ilike(s), TaxRule.ref.ilike(s)))
        query = query.order_by(TaxRule.name.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_tax_rule(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        tax_rule_id: uuid.UUID,
    ) -> TaxRule:
        query = select(TaxRule).where(TaxRule.id == tax_rule_id, TaxRule.tenant_id == tenant_id)
        result = await db.execute(query)
        rule = result.scalar_one_or_none()
        if not rule:
            raise EntityNotFoundException(f"TaxRule with id {tax_rule_id} not found.")
        return rule

    async def create_tax_rule(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: TaxRuleCreate,
    ) -> TaxRule:
        existing = await db.execute(
            select(TaxRule).where(TaxRule.tenant_id == tenant_id, TaxRule.code == data.code.strip())
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"TaxRule code '{data.code}' already exists.")

        count_res = await db.execute(
            select(func.count()).select_from(TaxRule).where(TaxRule.tenant_id == tenant_id)
        )
        seq = (count_res.scalar() or 0) + 1
        ref = f"TAX-{seq:04d}"

        rule = TaxRule(
            tenant_id=tenant_id,
            ref=ref,
            name=data.name.strip(),
            code=data.code.strip(),
            rate=data.rate,
            region=data.region,
            tax_type=data.tax_type,
            is_inclusive=data.is_inclusive,
            effective_start_date=data.effective_start_date,
            effective_end_date=data.effective_end_date,
            status=data.status,
            description=data.description,
            custom_fields=data.custom_fields,
        )
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return rule

    async def update_tax_rule(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        tax_rule_id: uuid.UUID,
        data: TaxRuleUpdate,
    ) -> TaxRule:
        rule = await self.get_tax_rule(db, tenant_id, tax_rule_id)
        if data.code is not None:
            new_code = data.code.strip()
            if new_code != rule.code:
                existing = await db.execute(
                    select(TaxRule).where(
                        TaxRule.tenant_id == tenant_id,
                        TaxRule.code == new_code,
                        TaxRule.id != tax_rule_id
                    )
                )
                if existing.scalar_one_or_none():
                    raise ConflictException(f"TaxRule code '{new_code}' already exists.")
                rule.code = new_code
        if data.name is not None:
            rule.name = data.name.strip()
        if data.rate is not None:
            rule.rate = data.rate
        if data.region is not None:
            rule.region = data.region
        if data.tax_type is not None:
            rule.tax_type = data.tax_type
        if data.is_inclusive is not None:
            rule.is_inclusive = data.is_inclusive
        if data.effective_start_date is not None:
            rule.effective_start_date = data.effective_start_date
        if data.effective_end_date is not None:
            rule.effective_end_date = data.effective_end_date
        if data.status is not None:
            rule.status = data.status
        if data.description is not None:
            rule.description = data.description
        if data.custom_fields is not None:
            rule.custom_fields = data.custom_fields

        await db.commit()
        await db.refresh(rule)
        return rule

    async def delete_tax_rule(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        tax_rule_id: uuid.UUID,
    ) -> None:
        rule = await self.get_tax_rule(db, tenant_id, tax_rule_id)
        await db.delete(rule)
        await db.commit()

    # =========================================================================
    # 6. COMMERCIAL TERMS & CONDITIONS
    # =========================================================================

    async def list_commercial_terms(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        category: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[CommercialTerms]:
        query = select(CommercialTerms).where(CommercialTerms.tenant_id == tenant_id)
        if category:
            query = query.where(CommercialTerms.category == category)
        if status:
            query = query.where(CommercialTerms.status == status)
        if search:
            s = f"%{search.strip()}%"
            query = query.where(or_(CommercialTerms.title.ilike(s), CommercialTerms.ref.ilike(s)))
        query = query.order_by(CommercialTerms.title.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_commercial_term(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        term_id: uuid.UUID,
    ) -> CommercialTerms:
        query = select(CommercialTerms).where(CommercialTerms.id == term_id, CommercialTerms.tenant_id == tenant_id)
        result = await db.execute(query)
        term = result.scalar_one_or_none()
        if not term:
            raise EntityNotFoundException(f"CommercialTerms with id {term_id} not found.")
        return term

    async def create_commercial_term(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: CommercialTermsCreate,
        author_name: str = "Admin",
    ) -> CommercialTerms:
        count_res = await db.execute(
            select(func.count()).select_from(CommercialTerms).where(CommercialTerms.tenant_id == tenant_id)
        )
        seq = (count_res.scalar() or 0) + 1
        ref = f"TRM-{seq:04d}"

        term = CommercialTerms(
            tenant_id=tenant_id,
            ref=ref,
            title=data.title.strip(),
            version=data.version.strip(),
            category=data.category,
            content=data.content,
            effective_date=data.effective_date,
            expiration_date=data.expiration_date,
            status=data.status,
            is_default=data.is_default,
            published_by=author_name if data.status == "Published" else None,
            published_at=datetime.now(timezone.utc) if data.status == "Published" else None,
            custom_fields=data.custom_fields,
        )
        if data.is_default:
            # Set other terms in this category to non-default
            await db.execute(
                select(CommercialTerms).where(
                    CommercialTerms.tenant_id == tenant_id,
                    CommercialTerms.category == data.category
                )
            )
            # Update default flag
            from sqlalchemy import update
            await db.execute(
                update(CommercialTerms)
                .where(CommercialTerms.tenant_id == tenant_id, CommercialTerms.category == data.category)
                .values(is_default=False)
            )

        db.add(term)
        await db.commit()
        await db.refresh(term)
        return term

    async def update_commercial_term(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        term_id: uuid.UUID,
        data: CommercialTermsUpdate,
        actor_name: str = "Admin",
    ) -> CommercialTerms:
        term = await self.get_commercial_term(db, tenant_id, term_id)
        if data.title is not None:
            term.title = data.title.strip()
        if data.version is not None:
            term.version = data.version.strip()
        if data.category is not None:
            term.category = data.category
        if data.content is not None:
            term.content = data.content
        if data.effective_date is not None:
            term.effective_date = data.effective_date
        if data.expiration_date is not None:
            term.expiration_date = data.expiration_date
        if data.status is not None:
            term.status = data.status
            if data.status == "Published" and not term.published_at:
                term.published_at = datetime.now(timezone.utc)
                term.published_by = actor_name
        if data.is_default is not None:
            term.is_default = data.is_default
            if data.is_default:
                from sqlalchemy import update
                await db.execute(
                    update(CommercialTerms)
                    .where(CommercialTerms.tenant_id == tenant_id, CommercialTerms.category == term.category, CommercialTerms.id != term_id)
                    .values(is_default=False)
                )
        if data.custom_fields is not None:
            term.custom_fields = data.custom_fields

        await db.commit()
        await db.refresh(term)
        return term

    async def delete_commercial_term(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        term_id: uuid.UUID,
    ) -> None:
        term = await self.get_commercial_term(db, tenant_id, term_id)
        await db.delete(term)
        await db.commit()

catalog_service = CatalogService()
