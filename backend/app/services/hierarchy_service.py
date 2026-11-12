import uuid
from typing import List, Dict, Any, Optional, Set
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.crm import Account, Contact, Opportunity
from app.schemas.crm import (
    AccountHierarchyNode,
    AccountHierarchyResponse
)
from app.core.errors import NotFoundException, ValidationException

class HierarchyService:
    """Service handling recursive account parent-child hierarchies, cycle detection, and hierarchy metrics."""

    @staticmethod
    async def validate_parent_assignment(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        account_id: uuid.UUID,
        parent_id: Optional[uuid.UUID]
    ) -> None:
        """Validate that assigning parent_id to account_id does not create a self-reference or circular reference."""
        if not parent_id:
            return

        if parent_id == account_id:
            raise ValidationException("An account cannot be its own parent.")

        # Check target parent exists and belongs to the same tenant
        parent_stmt = select(Account).where(
            Account.id == parent_id,
            Account.tenant_id == tenant_id,
            Account.deleted_at.is_(None)
        )
        res = await db.execute(parent_stmt)
        target_parent = res.scalar_one_or_none()
        if not target_parent:
            raise ValidationException("Specified parent account does not exist in this organization.")

        # Traverse upwards from target_parent to ensure account_id is not already an ancestor
        curr_parent_id: Optional[uuid.UUID] = target_parent.parent_id
        visited: Set[uuid.UUID] = {account_id, parent_id}

        while curr_parent_id is not None:
            if curr_parent_id == account_id:
                raise ValidationException(
                    "Cyclic parent reference detected: target parent is already a descendant of this account."
                )
            if curr_parent_id in visited:
                break
            visited.add(curr_parent_id)

            ancestor_stmt = select(Account.parent_id).where(
                Account.id == curr_parent_id,
                Account.tenant_id == tenant_id,
                Account.deleted_at.is_(None)
            )
            curr_parent_id = (await db.execute(ancestor_stmt)).scalar_one_or_none()

    @staticmethod
    async def get_account_hierarchy(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        account_id: uuid.UUID
    ) -> AccountHierarchyResponse:
        """Retrieve full hierarchy tree starting from root ancestor down to all descendants, with rollup metrics."""
        # 1. Fetch current account
        curr_stmt = select(Account).where(
            Account.id == account_id,
            Account.tenant_id == tenant_id,
            Account.deleted_at.is_(None)
        )
        curr_acc = (await db.execute(curr_stmt)).scalar_one_or_none()
        if not curr_acc:
            raise NotFoundException("Account not found.")

        # 2. Traverse upwards to find root ancestor
        root_id = curr_acc.id
        current_step_id = curr_acc.parent_id
        visited_up: Set[uuid.UUID] = {root_id}

        while current_step_id is not None:
            if current_step_id in visited_up:
                break
            visited_up.add(current_step_id)

            up_stmt = select(Account).where(
                Account.id == current_step_id,
                Account.tenant_id == tenant_id,
                Account.deleted_at.is_(None)
            )
            ancestor = (await db.execute(up_stmt)).scalar_one_or_none()
            if not ancestor:
                break
            root_id = ancestor.id
            current_step_id = ancestor.parent_id

        # 3. Load all active accounts for this tenant to build tree in memory efficiently
        all_accounts_stmt = select(Account).where(
            Account.tenant_id == tenant_id,
            Account.deleted_at.is_(None)
        ).options(
            selectinload(Account.contacts),
            selectinload(Account.opportunities)
        )
        all_res = await db.execute(all_accounts_stmt)
        accounts_map: Dict[uuid.UUID, Account] = {a.id: a for a in all_res.scalars().all()}

        if root_id not in accounts_map:
            raise NotFoundException("Root account for hierarchy not found.")

        # Group children by parent_id
        children_map: Dict[uuid.UUID, List[uuid.UUID]] = {}
        for acc in accounts_map.values():
            if acc.parent_id:
                children_map.setdefault(acc.parent_id, []).append(acc.id)

        # 4. Recursively construct tree nodes and roll up metrics
        total_accounts = 0
        total_contacts = 0
        total_opportunities = 0
        total_pipeline_val = Decimal("0.00")
        max_tree_depth = 0

        def build_node(node_id: uuid.UUID, current_depth: int) -> AccountHierarchyNode:
            nonlocal total_accounts, total_contacts, total_opportunities, total_pipeline_val, max_tree_depth
            total_accounts += 1
            if current_depth > max_tree_depth:
                max_tree_depth = current_depth

            acc_obj = accounts_map[node_id]
            direct_contacts = [c for c in (acc_obj.contacts or []) if not c.is_deleted]
            direct_opps = [o for o in (acc_obj.opportunities or []) if not o.is_deleted]
            direct_pipe = sum(
                (Decimal(str(o.amount)) for o in direct_opps),
                Decimal("0.00")
            )

            total_contacts += len(direct_contacts)
            total_opportunities += len(direct_opps)
            total_pipeline_val += direct_pipe

            child_ids = children_map.get(node_id, [])
            child_nodes = []
            for cid in child_ids:
                if cid in accounts_map:
                    child_nodes.append(build_node(cid, current_depth + 1))

            return AccountHierarchyNode(
                id=acc_obj.id,
                ref=acc_obj.ref,
                name=acc_obj.name,
                account_type=acc_obj.account_type,
                status=acc_obj.status,
                owner_name=acc_obj.owner_name,
                industry=acc_obj.industry,
                credit_limit=acc_obj.credit_limit,
                depth=current_depth,
                direct_contacts_count=len(direct_contacts),
                direct_opportunities_count=len(direct_opps),
                direct_pipeline_value=direct_pipe,
                children=child_nodes
            )

        root_node = build_node(root_id, 0)

        return AccountHierarchyResponse(
            root=root_node,
            current_account_id=curr_acc.id,
            total_hierarchy_accounts=total_accounts,
            total_hierarchy_contacts=total_contacts,
            total_hierarchy_opportunities=total_opportunities,
            total_hierarchy_pipeline_value=total_pipeline_val,
            max_depth=max_tree_depth
        )
