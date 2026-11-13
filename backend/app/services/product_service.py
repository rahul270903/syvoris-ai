import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from decimal import Decimal
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sales import Product, PriceBook, PriceBookEntry
from app.schemas.sales import (
    ProductCreate, ProductUpdate,
    PriceBookCreate, PriceBookUpdate, PriceBookEntryCreate
)
from app.core.errors import ValidationException, NotFoundException
from app.services.audit_service import audit_service

DEFAULT_CATALOG = [
    {
        "sku": "SYV-CORE-ENT",
        "name": "Enterprise AI Cloud Core Subscription (Annual)",
        "category": "Software",
        "description": "Base enterprise cloud platform license covering tenant core and orchestration engines.",
        "unit_of_measure": "License/Year",
        "standard_price": Decimal("8500.00"),
        "cost_price": Decimal("2100.00"),
        "tax_category": "Standard",
        "tax_rate": Decimal("8.25")
    },
    {
        "sku": "SYV-REV-INT",
        "name": "Predictive Sales & Revenue Intelligence Module",
        "category": "Software",
        "description": "Autonomous deal scoring, win-loss predictive modeling, and pipeline health monitor.",
        "unit_of_measure": "Module",
        "standard_price": Decimal("35000.00"),
        "cost_price": Decimal("8500.00"),
        "tax_category": "Standard",
        "tax_rate": Decimal("8.25")
    },
    {
        "sku": "SYV-SVC-IMP",
        "name": "Enterprise Implementation & Integration Pack",
        "category": "Services",
        "description": "On-site architecture design, ERP connector deployment, and staff certification.",
        "unit_of_measure": "Package",
        "standard_price": Decimal("20000.00"),
        "cost_price": Decimal("7500.00"),
        "tax_category": "Exempt",
        "tax_rate": Decimal("0.00")
    },
    {
        "sku": "SYV-AI-SEAT",
        "name": "AI Autonomous Agent Worker Seat (Monthly)",
        "category": "Software",
        "description": "Provisioned compute slot for continuous autonomous CRM execution agents.",
        "unit_of_measure": "Seat/Month",
        "standard_price": Decimal("450.00"),
        "cost_price": Decimal("90.00"),
        "tax_category": "Standard",
        "tax_rate": Decimal("8.25")
    }
]

class ProductService:
    async def seed_defaults_if_empty(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        """Seed default products and standard price book if tenant catalog is empty."""
        count_stmt = select(func.count(Product.id)).where(
            Product.tenant_id == tenant_id,
            Product.deleted_at.is_(None)
        )
        count = (await session.execute(count_stmt)).scalar() or 0
        if count == 0:
            created_products = []
            for item in DEFAULT_CATALOG:
                prod = Product(
                    tenant_id=tenant_id,
                    sku=item["sku"],
                    name=item["name"],
                    category=item["category"],
                    description=item["description"],
                    unit_of_measure=item["unit_of_measure"],
                    standard_price=item["standard_price"],
                    cost_price=item["cost_price"],
                    tax_category=item["tax_category"],
                    tax_rate=item["tax_rate"],
                    is_active=True,
                    custom_fields={}
                )
                session.add(prod)
                created_products.append(prod)
            await session.flush()

            # Seed Standard Commercial Price Book
            pb = PriceBook(
                tenant_id=tenant_id,
                name="Standard Commercial Price Book",
                description="Default global list prices for commercial contracts",
                currency="USD",
                is_default=True,
                is_active=True,
                custom_fields={}
            )
            session.add(pb)
            await session.flush()

            for p in created_products:
                entry = PriceBookEntry(
                    tenant_id=tenant_id,
                    price_book_id=pb.id,
                    product_id=p.id,
                    list_price=p.standard_price,
                    currency="USD",
                    is_active=True
                )
                session.add(entry)
            await session.commit()

    async def list_products(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Product], int]:
        await self.seed_defaults_if_empty(session, tenant_id)

        query = select(Product).where(
            Product.tenant_id == tenant_id,
            Product.deleted_at.is_(None)
        )

        if category:
            query = query.where(Product.category == category)
        if is_active is not None:
            query = query.where(Product.is_active == is_active)
        if q:
            search = f"%{q}%"
            query = query.where(
                or_(
                    Product.name.ilike(search),
                    Product.sku.ilike(search),
                    Product.category.ilike(search)
                )
            )

        total_stmt = select(func.count()).select_from(query.subquery())
        total = (await session.execute(total_stmt)).scalar() or 0

        query = query.order_by(Product.name.asc()).offset(skip).limit(limit)
        items = (await session.execute(query)).scalars().all()
        return list(items), total

    async def get_product(self, session: AsyncSession, tenant_id: uuid.UUID, product_id: uuid.UUID) -> Product:
        query = select(Product).where(
            Product.id == product_id,
            Product.tenant_id == tenant_id,
            Product.deleted_at.is_(None)
        )
        product = (await session.execute(query)).scalar_one_or_none()
        if not product:
            raise NotFoundException("Product not found in organization catalog.")
        return product

    async def create_product(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        data: ProductCreate,
        actor_id: Optional[uuid.UUID] = None
    ) -> Product:
        # Check SKU uniqueness
        dup_query = select(Product).where(
            Product.tenant_id == tenant_id,
            Product.sku == data.sku.strip(),
            Product.deleted_at.is_(None)
        )
        if (await session.execute(dup_query)).scalar_one_or_none():
            raise ValidationException(f"Product SKU '{data.sku}' already exists.")

        product = Product(
            tenant_id=tenant_id,
            sku=data.sku.strip(),
            name=data.name.strip(),
            category=data.category,
            description=data.description,
            unit_of_measure=data.unit_of_measure,
            standard_price=data.standard_price,
            cost_price=data.cost_price,
            tax_category=data.tax_category,
            tax_rate=data.tax_rate,
            is_active=data.is_active,
            custom_fields=data.custom_fields
        )
        session.add(product)
        await session.commit()
        await session.refresh(product)

        await audit_service.log_event(
            session,
            action="product.created",
            resource_type="product",
            tenant_id=tenant_id,
            actor_id=actor_id,
            resource_id=str(product.id),
            metadata={"sku": product.sku, "name": product.name, "standard_price": str(product.standard_price)}
        )
        return product

    async def update_product(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        product_id: uuid.UUID,
        data: ProductUpdate,
        actor_id: Optional[uuid.UUID] = None
    ) -> Product:
        product = await self.get_product(session, tenant_id, product_id)

        update_dict = data.model_dump(exclude_unset=True)
        if "sku" in update_dict and update_dict["sku"] != product.sku:
            dup_query = select(Product).where(
                Product.tenant_id == tenant_id,
                Product.sku == update_dict["sku"].strip(),
                Product.id != product_id,
                Product.deleted_at.is_(None)
            )
            if (await session.execute(dup_query)).scalar_one_or_none():
                raise ValidationException(f"Product SKU '{update_dict['sku']}' already in use.")
            product.sku = update_dict["sku"].strip()

        for key, val in update_dict.items():
            if key != "sku":
                setattr(product, key, val)

        product.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(product)

        # Sanitize decimals in update_dict for metadata JSON
        safe_meta = {k: str(v) if isinstance(v, Decimal) else v for k, v in update_dict.items()}
        await audit_service.log_event(
            session,
            action="product.updated",
            resource_type="product",
            tenant_id=tenant_id,
            actor_id=actor_id,
            resource_id=str(product.id),
            metadata=safe_meta
        )
        return product

    async def delete_product(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        product_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None
    ) -> None:
        product = await self.get_product(session, tenant_id, product_id)
        product.deleted_at = datetime.now(timezone.utc)
        product.is_active = False
        await session.commit()

        await audit_service.log_event(
            session,
            action="product.deleted",
            resource_type="product",
            tenant_id=tenant_id,
            actor_id=actor_id,
            resource_id=str(product.id),
            metadata={"sku": product.sku, "name": product.name}
        )

    # ----------------- Price Books -----------------

    async def list_price_books(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[PriceBook], int]:
        await self.seed_defaults_if_empty(session, tenant_id)

        query = select(PriceBook).where(
            PriceBook.tenant_id == tenant_id,
            PriceBook.deleted_at.is_(None)
        ).options(
            selectinload(PriceBook.entries).joinedload(PriceBookEntry.product)
        )

        if is_active is not None:
            query = query.where(PriceBook.is_active == is_active)

        total_stmt = select(func.count()).select_from(
            select(PriceBook.id).where(
                PriceBook.tenant_id == tenant_id,
                PriceBook.deleted_at.is_(None)
            ).subquery()
        )
        total = (await session.execute(total_stmt)).scalar() or 0

        query = query.order_by(PriceBook.is_default.desc(), PriceBook.name.asc()).offset(skip).limit(limit)
        items = (await session.execute(query)).scalars().all()
        return list(items), total

    async def get_price_book(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        price_book_id: uuid.UUID
    ) -> PriceBook:
        query = select(PriceBook).where(
            PriceBook.id == price_book_id,
            PriceBook.tenant_id == tenant_id,
            PriceBook.deleted_at.is_(None)
        ).options(
            selectinload(PriceBook.entries).joinedload(PriceBookEntry.product)
        )
        price_book = (await session.execute(query)).scalar_one_or_none()
        if not price_book:
            raise NotFoundException("Price Book not found in organization.")
        return price_book

    async def create_price_book(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        data: PriceBookCreate,
        actor_id: Optional[uuid.UUID] = None
    ) -> PriceBook:
        if data.is_default:
            # Set other price books is_default to false
            await session.execute(
                select(PriceBook).where(
                    PriceBook.tenant_id == tenant_id,
                    PriceBook.is_default.is_(True)
                )
            )

        price_book = PriceBook(
            tenant_id=tenant_id,
            name=data.name.strip(),
            description=data.description,
            currency=data.currency,
            is_default=data.is_default,
            is_active=data.is_active,
            valid_from=data.valid_from,
            valid_to=data.valid_to,
            custom_fields=data.custom_fields
        )
        session.add(price_book)
        await session.flush()

        if data.entries:
            for entry_data in data.entries:
                entry = PriceBookEntry(
                    tenant_id=tenant_id,
                    price_book_id=price_book.id,
                    product_id=entry_data.product_id,
                    list_price=entry_data.list_price,
                    currency=entry_data.currency or data.currency,
                    is_active=entry_data.is_active
                )
                session.add(entry)

        await session.commit()
        return await self.get_price_book(session, tenant_id, price_book.id)

    async def update_price_book(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        price_book_id: uuid.UUID,
        data: PriceBookUpdate,
        actor_id: Optional[uuid.UUID] = None
    ) -> PriceBook:
        price_book = await self.get_price_book(session, tenant_id, price_book_id)
        update_dict = data.model_dump(exclude_unset=True, exclude={"entries"})

        for key, val in update_dict.items():
            setattr(price_book, key, val)

        if data.entries is not None:
            # Refresh entries
            for existing in price_book.entries:
                await session.delete(existing)
            await session.flush()

            for entry_data in data.entries:
                entry = PriceBookEntry(
                    tenant_id=tenant_id,
                    price_book_id=price_book.id,
                    product_id=entry_data.product_id,
                    list_price=entry_data.list_price,
                    currency=entry_data.currency or price_book.currency,
                    is_active=entry_data.is_active
                )
                session.add(entry)

        price_book.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return await self.get_price_book(session, tenant_id, price_book.id)

product_service = ProductService()
