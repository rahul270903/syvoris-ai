import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, func, and_, or_, update
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import (
    EntityNotFoundException,
    ConflictException,
    ValidationException
)
from app.models.catalog import (
    WarehouseLocation,
    InventoryItem,
    StockMovement,
)
from app.models.sales import Product
from app.schemas.catalog import (
    WarehouseLocationCreate,
    WarehouseLocationUpdate,
    InventoryItemCreate,
    InventoryItemUpdate,
    StockMovementCreate,
)

class InventoryService:

    # =========================================================================
    # 1. WAREHOUSE LOCATIONS
    # =========================================================================

    async def list_locations(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> List[WarehouseLocation]:
        query = (
            select(WarehouseLocation)
            .where(WarehouseLocation.tenant_id == tenant_id)
            .options(selectinload(WarehouseLocation.inventory_items))
        )
        if is_active is not None:
            query = query.where(WarehouseLocation.is_active == is_active)
        if search:
            s = f"%{search.strip()}%"
            query = query.where(or_(WarehouseLocation.name.ilike(s), WarehouseLocation.code.ilike(s)))
        query = query.order_by(WarehouseLocation.name.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_location(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        location_id: uuid.UUID,
    ) -> WarehouseLocation:
        query = select(WarehouseLocation).where(
            WarehouseLocation.id == location_id,
            WarehouseLocation.tenant_id == tenant_id
        )
        result = await db.execute(query)
        loc = result.scalar_one_or_none()
        if not loc:
            raise EntityNotFoundException(f"WarehouseLocation with id {location_id} not found.")
        return loc

    async def create_location(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: WarehouseLocationCreate,
    ) -> WarehouseLocation:
        existing = await db.execute(
            select(WarehouseLocation).where(
                WarehouseLocation.tenant_id == tenant_id,
                WarehouseLocation.code == data.code.strip()
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Location code '{data.code}' already exists in this tenant.")

        count_res = await db.execute(
            select(func.count()).select_from(WarehouseLocation).where(WarehouseLocation.tenant_id == tenant_id)
        )
        seq = (count_res.scalar() or 0) + 1
        ref = f"LOC-{seq:04d}"

        if data.is_default:
            await db.execute(
                update(WarehouseLocation)
                .where(WarehouseLocation.tenant_id == tenant_id)
                .values(is_default=False)
            )

        loc = WarehouseLocation(
            tenant_id=tenant_id,
            ref=ref,
            name=data.name.strip(),
            code=data.code.strip(),
            address=data.address,
            city=data.city,
            country=data.country,
            is_active=data.is_active,
            is_default=data.is_default,
            manager_name=data.manager_name,
            custom_fields=data.custom_fields,
        )
        db.add(loc)
        await db.commit()
        await db.refresh(loc)
        return loc

    async def update_location(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        location_id: uuid.UUID,
        data: WarehouseLocationUpdate,
    ) -> WarehouseLocation:
        loc = await self.get_location(db, tenant_id, location_id)

        if data.code is not None:
            new_code = data.code.strip()
            if new_code != loc.code:
                existing = await db.execute(
                    select(WarehouseLocation).where(
                        WarehouseLocation.tenant_id == tenant_id,
                        WarehouseLocation.code == new_code,
                        WarehouseLocation.id != location_id
                    )
                )
                if existing.scalar_one_or_none():
                    raise ConflictException(f"Location code '{new_code}' already exists.")
                loc.code = new_code

        if data.name is not None:
            loc.name = data.name.strip()
        if data.address is not None:
            loc.address = data.address
        if data.city is not None:
            loc.city = data.city
        if data.country is not None:
            loc.country = data.country
        if data.is_active is not None:
            loc.is_active = data.is_active
        if data.manager_name is not None:
            loc.manager_name = data.manager_name
        if data.custom_fields is not None:
            loc.custom_fields = data.custom_fields
        if data.is_default is not None:
            loc.is_default = data.is_default
            if data.is_default:
                await db.execute(
                    update(WarehouseLocation)
                    .where(WarehouseLocation.tenant_id == tenant_id, WarehouseLocation.id != location_id)
                    .values(is_default=False)
                )

        await db.commit()
        await db.refresh(loc)
        return loc

    async def delete_location(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        location_id: uuid.UUID,
    ) -> None:
        loc = await self.get_location(db, tenant_id, location_id)
        # Check if items exist in this location
        items_count = await db.execute(
            select(func.count()).select_from(InventoryItem).where(
                InventoryItem.tenant_id == tenant_id,
                InventoryItem.location_id == location_id
            )
        )
        if (items_count.scalar() or 0) > 0:
            raise ValidationException("Cannot delete location with existing inventory items. Relocate stock first.")

        await db.delete(loc)
        await db.commit()

    # =========================================================================
    # 2. INVENTORY ITEMS (Product balances)
    # =========================================================================

    async def list_inventory_items(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        location_id: Optional[uuid.UUID] = None,
        product_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query = (
            select(InventoryItem, Product, WarehouseLocation)
            .join(Product, InventoryItem.product_id == Product.id)
            .join(WarehouseLocation, InventoryItem.location_id == WarehouseLocation.id)
            .where(InventoryItem.tenant_id == tenant_id)
        )
        if location_id:
            query = query.where(InventoryItem.location_id == location_id)
        if product_id:
            query = query.where(InventoryItem.product_id == product_id)
        if status:
            query = query.where(InventoryItem.status == status)
        if search:
            s = f"%{search.strip()}%"
            query = query.where(or_(Product.name.ilike(s), Product.sku.ilike(s), WarehouseLocation.name.ilike(s)))

        query = query.order_by(Product.name.asc())
        result = await db.execute(query)
        rows = result.all()

        output = []
        for inv, prod, loc in rows:
            available = max(Decimal("0.00"), inv.quantity_on_hand - inv.quantity_reserved)
            output.append({
                "id": inv.id,
                "tenant_id": inv.tenant_id,
                "ref": inv.ref,
                "product_id": inv.product_id,
                "product_sku": prod.sku,
                "product_name": prod.name,
                "location_id": inv.location_id,
                "location_name": loc.name,
                "location_code": loc.code,
                "quantity_on_hand": inv.quantity_on_hand,
                "quantity_reserved": inv.quantity_reserved,
                "quantity_available": available,
                "reorder_threshold": inv.reorder_threshold,
                "reorder_quantity": inv.reorder_quantity,
                "unit_of_measure": inv.unit_of_measure,
                "last_counted_at": inv.last_counted_at,
                "status": inv.status,
                "custom_fields": inv.custom_fields,
                "created_at": inv.created_at,
                "updated_at": inv.updated_at,
            })
        return output

    async def get_inventory_item(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        item_id: uuid.UUID,
    ) -> InventoryItem:
        query = (
            select(InventoryItem)
            .where(InventoryItem.id == item_id, InventoryItem.tenant_id == tenant_id)
            .options(joinedload(InventoryItem.location))
        )
        result = await db.execute(query)
        item = result.scalar_one_or_none()
        if not item:
            raise EntityNotFoundException(f"InventoryItem with id {item_id} not found.")
        return item

    async def get_or_create_inventory_item(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        product_id: uuid.UUID,
        location_id: uuid.UUID,
        reorder_threshold: Decimal = Decimal("10.00"),
        reorder_quantity: Decimal = Decimal("50.00"),
        unit_of_measure: str = "Unit",
    ) -> InventoryItem:
        query = select(InventoryItem).where(
            InventoryItem.tenant_id == tenant_id,
            InventoryItem.product_id == product_id,
            InventoryItem.location_id == location_id
        )
        res = await db.execute(query)
        item = res.scalar_one_or_none()
        if item:
            return item

        count_res = await db.execute(
            select(func.count()).select_from(InventoryItem).where(InventoryItem.tenant_id == tenant_id)
        )
        seq = (count_res.scalar() or 0) + 1
        ref = f"INV-{seq:04d}"

        item = InventoryItem(
            tenant_id=tenant_id,
            ref=ref,
            product_id=product_id,
            location_id=location_id,
            quantity_on_hand=Decimal("0.00"),
            quantity_reserved=Decimal("0.00"),
            reorder_threshold=reorder_threshold,
            reorder_quantity=reorder_quantity,
            unit_of_measure=unit_of_measure,
            status="In Stock",
            custom_fields={},
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item

    async def update_inventory_item(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        item_id: uuid.UUID,
        data: InventoryItemUpdate,
    ) -> InventoryItem:
        item = await self.get_inventory_item(db, tenant_id, item_id)
        if data.quantity_reserved is not None:
            if data.quantity_reserved > item.quantity_on_hand:
                raise ValidationException("Quantity reserved cannot exceed quantity on hand.")
            item.quantity_reserved = data.quantity_reserved
        if data.reorder_threshold is not None:
            item.reorder_threshold = data.reorder_threshold
        if data.reorder_quantity is not None:
            item.reorder_quantity = data.reorder_quantity
        if data.unit_of_measure is not None:
            item.unit_of_measure = data.unit_of_measure
        if data.last_counted_at is not None:
            item.last_counted_at = data.last_counted_at
        if data.status is not None:
            item.status = data.status
        if data.custom_fields is not None:
            item.custom_fields = data.custom_fields

        await db.commit()
        await db.refresh(item)
        return item

    # =========================================================================
    # 3. STOCK MOVEMENTS LEDGER (Atomic transactions)
    # =========================================================================

    async def record_stock_movement(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        data: StockMovementCreate,
        user_id: Optional[uuid.UUID] = None,
        user_name: str = "System",
    ) -> StockMovement:
        item = await self.get_inventory_item(db, tenant_id, data.inventory_item_id)
        qty = data.quantity
        if qty <= Decimal("0.00"):
            raise ValidationException("Movement quantity must be greater than zero.")

        bal_before = item.quantity_on_hand
        bal_after = bal_before

        m_type = data.movement_type.strip().capitalize()

        if m_type == "Receipt":
            bal_after = bal_before + qty
            item.quantity_on_hand = bal_after
        elif m_type == "Issue":
            avail = bal_before - item.quantity_reserved
            if qty > avail:
                raise ValidationException(
                    f"Insufficient stock for issue. Available: {avail}, Requested: {qty}"
                )
            bal_after = bal_before - qty
            item.quantity_on_hand = bal_after
        elif m_type == "Transfer":
            if not data.to_location_id:
                raise ValidationException("Destination location is required for stock transfer.")
            if data.to_location_id == item.location_id:
                raise ValidationException("Source and destination locations cannot be identical.")
            avail = bal_before - item.quantity_reserved
            if qty > avail:
                raise ValidationException(
                    f"Insufficient stock for transfer. Available: {avail}, Requested: {qty}"
                )
            bal_after = bal_before - qty
            item.quantity_on_hand = bal_after

            # Create or update receiving location balance
            dest_item = await self.get_or_create_inventory_item(
                db, tenant_id, item.product_id, data.to_location_id,
                reorder_threshold=item.reorder_threshold,
                reorder_quantity=item.reorder_quantity,
                unit_of_measure=item.unit_of_measure
            )
            dest_before = dest_item.quantity_on_hand
            dest_after = dest_before + qty
            dest_item.quantity_on_hand = dest_after

            # Record corresponding receipt at destination
            dest_count = await db.execute(
                select(func.count()).select_from(StockMovement).where(StockMovement.tenant_id == tenant_id)
            )
            dest_seq = (dest_count.scalar() or 0) + 2
            dest_movement = StockMovement(
                tenant_id=tenant_id,
                ref=f"MOV-{dest_seq:04d}",
                inventory_item_id=dest_item.id,
                movement_type="Receipt",
                quantity=qty,
                balance_before=dest_before,
                balance_after=dest_after,
                from_location_id=item.location_id,
                to_location_id=data.to_location_id,
                reference_doc_type=data.reference_doc_type or "TransferReceipt",
                reference_doc_id=data.reference_doc_id,
                reason=f"Transfer received from {item.location.name}: {data.reason or ''}".strip(),
                performed_by_id=user_id,
                performed_by_name=user_name,
            )
            db.add(dest_movement)

        elif m_type == "Adjustment":
            # For adjustment, qty can adjust upwards or downwards depending on reason / balance
            # In our API, Adjustment sets new count or offsets.
            # Here: data.quantity is treated as net addition or reduction.
            # If reason contains "physical count", balance_after is set to qty
            if "count" in (data.reason or "").lower():
                bal_after = qty
                item.quantity_on_hand = bal_after
            else:
                bal_after = bal_before + qty
                item.quantity_on_hand = bal_after
        elif m_type == "Reservation":
            avail = bal_before - item.quantity_reserved
            if qty > avail:
                raise ValidationException(
                    f"Insufficient stock for reservation. Available: {avail}, Requested: {qty}"
                )
            item.quantity_reserved = item.quantity_reserved + qty
            bal_after = bal_before
        elif m_type == "Release":
            if qty > item.quantity_reserved:
                raise ValidationException(
                    f"Release quantity ({qty}) exceeds reserved quantity ({item.quantity_reserved})."
                )
            item.quantity_reserved = item.quantity_reserved - qty
            bal_after = bal_before
        else:
            raise ValidationException(f"Invalid movement type: {data.movement_type}")

        # Update item status
        if item.quantity_on_hand <= Decimal("0.00"):
            item.status = "Out of Stock"
        elif item.quantity_on_hand <= item.reorder_threshold:
            item.status = "Low Stock"
        else:
            item.status = "In Stock"

        count_res = await db.execute(
            select(func.count()).select_from(StockMovement).where(StockMovement.tenant_id == tenant_id)
        )
        seq = (count_res.scalar() or 0) + 1
        ref = f"MOV-{seq:04d}"

        movement = StockMovement(
            tenant_id=tenant_id,
            ref=ref,
            inventory_item_id=item.id,
            movement_type=m_type,
            quantity=qty,
            balance_before=bal_before,
            balance_after=bal_after,
            from_location_id=data.from_location_id or item.location_id,
            to_location_id=data.to_location_id,
            reference_doc_type=data.reference_doc_type,
            reference_doc_id=data.reference_doc_id,
            reason=data.reason,
            performed_by_id=user_id,
            performed_by_name=user_name,
        )
        db.add(movement)
        await db.commit()
        await db.refresh(movement)
        return movement

    async def list_stock_movements(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        inventory_item_id: Optional[uuid.UUID] = None,
        movement_type: Optional[str] = None,
    ) -> List[StockMovement]:
        query = select(StockMovement).where(StockMovement.tenant_id == tenant_id)
        if inventory_item_id:
            query = query.where(StockMovement.inventory_item_id == inventory_item_id)
        if movement_type:
            query = query.where(StockMovement.movement_type == movement_type)
        query = query.order_by(StockMovement.created_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

inventory_service = InventoryService()
