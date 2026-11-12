import re
import uuid
from typing import List, Dict, Any, Optional, Tuple, Set
from datetime import datetime, timezone
from difflib import SequenceMatcher
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.models.crm import Account, Contact, Lead, Opportunity, CRMActivity
from app.schemas.crm import (
    DuplicateScanResponse,
    DuplicateCluster,
    DuplicateRecordItem,
    DuplicateMatchRule,
    RecordMergeRequest,
    RecordMergeResponse
)
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

def normalize_email(email: Optional[str]) -> Optional[str]:
    if not email or not email.strip():
        return None
    return email.strip().lower()

def normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone or not phone.strip():
        return None
    # Strip everything except digits and leading +
    cleaned = re.sub(r"[^\d+]", "", phone.strip())
    return cleaned if len(cleaned) >= 7 else None

def normalize_string(val: Optional[str]) -> Optional[str]:
    if not val or not val.strip():
        return None
    cleaned = re.sub(r"[^\w\s]", "", val.strip().lower())
    cleaned = " ".join(cleaned.split())
    # Strip common corporate suffixes for account comparisons
    for suffix in [" inc", " corp", " llc", " ltd", " co", " company", " limited", " gmbh", " pvt"]:
        if cleaned.endswith(suffix):
            cleaned = cleaned[:-len(suffix)].strip()
    return cleaned if cleaned else None

def string_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()

class DuplicateService:
    """Enterprise Deduplication Engine supporting Accounts, Contacts, and Leads (CR-04)."""

    @staticmethod
    async def scan_duplicates(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        entity_type: str,
        limit: int = 50
    ) -> DuplicateScanResponse:
        """Scan active records for potential duplicates using deterministic matching and fuzzy heuristics."""
        if entity_type == "account":
            return await DuplicateService._scan_accounts(db, tenant_id, limit)
        elif entity_type == "contact":
            return await DuplicateService._scan_contacts(db, tenant_id, limit)
        elif entity_type == "lead":
            return await DuplicateService._scan_leads(db, tenant_id, limit)
        else:
            raise ValidationException(f"Unsupported entity type for deduplication: {entity_type}")

    @staticmethod
    async def _scan_accounts(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        limit: int
    ) -> DuplicateScanResponse:
        stmt = select(Account).where(
            Account.tenant_id == tenant_id,
            Account.deleted_at.is_(None)
        ).order_by(Account.created_at.desc()).limit(200)

        res = await db.execute(stmt)
        accounts: List[Account] = res.scalars().all()

        clusters: List[DuplicateCluster] = []
        matched_pairs: Set[Tuple[uuid.UUID, uuid.UUID]] = set()

        for i in range(len(accounts)):
            for j in range(i + 1, len(accounts)):
                a1 = accounts[i]
                a2 = accounts[j]
                pair_key = (min(a1.id, a2.id), max(a1.id, a2.id))
                if pair_key in matched_pairs:
                    continue

                rules_triggered: List[DuplicateMatchRule] = []
                best_score = 0
                primary_rule = ""

                # Rule 1: Exact Email Match (if present)
                em1, em2 = normalize_email(a1.email), normalize_email(a2.email)
                if em1 and em2 and em1 == em2:
                    rules_triggered.append(DuplicateMatchRule(
                        rule_name="exact_email_match",
                        field_name="email",
                        confidence_score=100,
                        matched_value=em1,
                        explanation=f"Exact match on company email: {em1}"
                    ))
                    best_score = max(best_score, 100)
                    primary_rule = "Exact Email"

                # Rule 2: Exact Phone Match (if present)
                ph1, ph2 = normalize_phone(a1.phone), normalize_phone(a2.phone)
                if ph1 and ph2 and ph1 == ph2:
                    rules_triggered.append(DuplicateMatchRule(
                        rule_name="exact_phone_match",
                        field_name="phone",
                        confidence_score=90,
                        matched_value=ph1,
                        explanation=f"Exact match on phone number: {ph1}"
                    ))
                    best_score = max(best_score, 90)
                    if not primary_rule:
                        primary_rule = "Exact Phone"

                # Rule 3: Fuzzy Company Name Match
                n1, n2 = normalize_string(a1.name), normalize_string(a2.name)
                if n1 and n2:
                    if n1 == n2:
                        rules_triggered.append(DuplicateMatchRule(
                            rule_name="exact_normalized_name_match",
                            field_name="name",
                            confidence_score=95,
                            matched_value=a1.name,
                            explanation=f"Normalized names are identical: '{a1.name}' and '{a2.name}'"
                        ))
                        best_score = max(best_score, 95)
                        if not primary_rule:
                            primary_rule = "Identical Name"
                    else:
                        sim = string_similarity(n1, n2)
                        if sim >= 0.75:
                            score = int(sim * 100)
                            rules_triggered.append(DuplicateMatchRule(
                                rule_name="fuzzy_name_similarity",
                                field_name="name",
                                confidence_score=score,
                                matched_value=f"{a1.name} ~ {a2.name}",
                                explanation=f"Fuzzy name similarity of {score}%: '{a1.name}' and '{a2.name}'"
                            ))
                            best_score = max(best_score, score)
                            if not primary_rule:
                                primary_rule = f"Fuzzy Name ({score}%)"

                # Rule 4: Matching Website Domain
                w1, w2 = normalize_string(a1.website), normalize_string(a2.website)
                if w1 and w2 and len(w1) > 4 and len(w2) > 4:
                    if w1 == w2:
                        rules_triggered.append(DuplicateMatchRule(
                            rule_name="exact_website_domain_match",
                            field_name="website",
                            confidence_score=85,
                            matched_value=a1.website or "",
                            explanation=f"Matching company website: {a1.website}"
                        ))
                        best_score = max(best_score, 85)
                        if not primary_rule:
                            primary_rule = "Matching Website"

                if rules_triggered and best_score >= 70:
                    matched_pairs.add(pair_key)
                    rec1 = DuplicateRecordItem(
                        id=a1.id,
                        ref=a1.ref,
                        name=a1.name,
                        email=a1.email,
                        phone=a1.phone,
                        secondary_info=a1.industry or a1.website,
                        status=a1.status,
                        created_at=a1.created_at,
                        owner_name=a1.owner_name,
                        fields={"website": a1.website, "industry": a1.industry, "address": a1.address, "credit_limit": str(a1.credit_limit)}
                    )
                    rec2 = DuplicateRecordItem(
                        id=a2.id,
                        ref=a2.ref,
                        name=a2.name,
                        email=a2.email,
                        phone=a2.phone,
                        secondary_info=a2.industry or a2.website,
                        status=a2.status,
                        created_at=a2.created_at,
                        owner_name=a2.owner_name,
                        fields={"website": a2.website, "industry": a2.industry, "address": a2.address, "credit_limit": str(a2.credit_limit)}
                    )
                    cluster_id = f"CLU-ACC-{a1.ref}-{a2.ref}"
                    clusters.append(DuplicateCluster(
                        cluster_id=cluster_id,
                        entity_type="account",
                        primary_rule=primary_rule,
                        confidence_score=best_score,
                        records=[rec1, rec2],
                        rules_triggered=rules_triggered
                    ))
                    if len(clusters) >= limit:
                        break
            if len(clusters) >= limit:
                break

        return DuplicateScanResponse(
            entity_type="account",
            total_candidates_scanned=len(accounts),
            clusters_found=len(clusters),
            clusters=clusters
        )

    @staticmethod
    async def _scan_contacts(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        limit: int
    ) -> DuplicateScanResponse:
        stmt = select(Contact).where(
            Contact.tenant_id == tenant_id,
            Contact.deleted_at.is_(None)
        ).order_by(Contact.created_at.desc()).limit(200)

        res = await db.execute(stmt)
        contacts: List[Contact] = res.scalars().all()

        clusters: List[DuplicateCluster] = []
        matched_pairs: Set[Tuple[uuid.UUID, uuid.UUID]] = set()

        for i in range(len(contacts)):
            for j in range(i + 1, len(contacts)):
                c1 = contacts[i]
                c2 = contacts[j]
                pair_key = (min(c1.id, c2.id), max(c1.id, c2.id))
                if pair_key in matched_pairs:
                    continue

                rules_triggered: List[DuplicateMatchRule] = []
                best_score = 0
                primary_rule = ""

                # Rule 1: Exact Email Match
                em1, em2 = normalize_email(c1.email), normalize_email(c2.email)
                if em1 and em2 and em1 == em2:
                    rules_triggered.append(DuplicateMatchRule(
                        rule_name="exact_email_match",
                        field_name="email",
                        confidence_score=100,
                        matched_value=em1,
                        explanation=f"Exact match on email: {em1}"
                    ))
                    best_score = max(best_score, 100)
                    primary_rule = "Exact Email"

                # Rule 2: Exact Phone Match
                ph1, ph2 = normalize_phone(c1.phone), normalize_phone(c2.phone)
                if ph1 and ph2 and ph1 == ph2:
                    rules_triggered.append(DuplicateMatchRule(
                        rule_name="exact_phone_match",
                        field_name="phone",
                        confidence_score=90,
                        matched_value=ph1,
                        explanation=f"Exact match on phone: {ph1}"
                    ))
                    best_score = max(best_score, 90)
                    if not primary_rule:
                        primary_rule = "Exact Phone"

                # Rule 3: Fuzzy Full Name Match
                n1, n2 = normalize_string(c1.full_name), normalize_string(c2.full_name)
                if n1 and n2:
                    if n1 == n2:
                        # Full name identical with same organization or no organization
                        same_org = (c1.account_id == c2.account_id and c1.account_id is not None)
                        score = 95 if same_org else 80
                        rules_triggered.append(DuplicateMatchRule(
                            rule_name="identical_name_match",
                            field_name="full_name",
                            confidence_score=score,
                            matched_value=c1.full_name,
                            explanation=f"Names are identical: '{c1.full_name}'" + (" (Same Organization)" if same_org else "")
                        ))
                        best_score = max(best_score, score)
                        if not primary_rule:
                            primary_rule = "Identical Contact Name"
                    else:
                        sim = string_similarity(n1, n2)
                        if sim >= 0.85:
                            score = int(sim * 100)
                            rules_triggered.append(DuplicateMatchRule(
                                rule_name="fuzzy_name_similarity",
                                field_name="full_name",
                                confidence_score=score,
                                matched_value=f"{c1.full_name} ~ {c2.full_name}",
                                explanation=f"Fuzzy name similarity of {score}%: '{c1.full_name}' and '{c2.full_name}'"
                            ))
                            best_score = max(best_score, score)
                            if not primary_rule:
                                primary_rule = f"Fuzzy Name ({score}%)"

                if rules_triggered and best_score >= 75:
                    matched_pairs.add(pair_key)
                    rec1 = DuplicateRecordItem(
                        id=c1.id,
                        ref=c1.ref,
                        name=c1.full_name,
                        email=c1.email,
                        phone=c1.phone,
                        secondary_info=c1.job_title or c1.department,
                        status=c1.status,
                        created_at=c1.created_at,
                        owner_name=c1.owner_name,
                        fields={"job_title": c1.job_title, "department": c1.department, "account_id": str(c1.account_id) if c1.account_id else None}
                    )
                    rec2 = DuplicateRecordItem(
                        id=c2.id,
                        ref=c2.ref,
                        name=c2.full_name,
                        email=c2.email,
                        phone=c2.phone,
                        secondary_info=c2.job_title or c2.department,
                        status=c2.status,
                        created_at=c2.created_at,
                        owner_name=c2.owner_name,
                        fields={"job_title": c2.job_title, "department": c2.department, "account_id": str(c2.account_id) if c2.account_id else None}
                    )
                    cluster_id = f"CLU-CON-{c1.ref}-{c2.ref}"
                    clusters.append(DuplicateCluster(
                        cluster_id=cluster_id,
                        entity_type="contact",
                        primary_rule=primary_rule,
                        confidence_score=best_score,
                        records=[rec1, rec2],
                        rules_triggered=rules_triggered
                    ))
                    if len(clusters) >= limit:
                        break
            if len(clusters) >= limit:
                break

        return DuplicateScanResponse(
            entity_type="contact",
            total_candidates_scanned=len(contacts),
            clusters_found=len(clusters),
            clusters=clusters
        )

    @staticmethod
    async def _scan_leads(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        limit: int
    ) -> DuplicateScanResponse:
        stmt = select(Lead).where(
            Lead.tenant_id == tenant_id,
            Lead.deleted_at.is_(None),
            Lead.status != "Converted"
        ).order_by(Lead.created_at.desc()).limit(200)

        res = await db.execute(stmt)
        leads: List[Lead] = res.scalars().all()

        clusters: List[DuplicateCluster] = []
        matched_pairs: Set[Tuple[uuid.UUID, uuid.UUID]] = set()

        for i in range(len(leads)):
            for j in range(i + 1, len(leads)):
                l1 = leads[i]
                l2 = leads[j]
                pair_key = (min(l1.id, l2.id), max(l1.id, l2.id))
                if pair_key in matched_pairs:
                    continue

                rules_triggered: List[DuplicateMatchRule] = []
                best_score = 0
                primary_rule = ""

                # Rule 1: Exact Email Match
                em1, em2 = normalize_email(l1.email), normalize_email(l2.email)
                if em1 and em2 and em1 == em2:
                    rules_triggered.append(DuplicateMatchRule(
                        rule_name="exact_email_match",
                        field_name="email",
                        confidence_score=100,
                        matched_value=em1,
                        explanation=f"Exact match on lead email: {em1}"
                    ))
                    best_score = max(best_score, 100)
                    primary_rule = "Exact Email"

                # Rule 2: Exact Phone Match
                ph1, ph2 = normalize_phone(l1.phone), normalize_phone(l2.phone)
                if ph1 and ph2 and ph1 == ph2:
                    rules_triggered.append(DuplicateMatchRule(
                        rule_name="exact_phone_match",
                        field_name="phone",
                        confidence_score=90,
                        matched_value=ph1,
                        explanation=f"Exact match on lead phone: {ph1}"
                    ))
                    best_score = max(best_score, 90)
                    if not primary_rule:
                        primary_rule = "Exact Phone"

                # Rule 3: Matching Company + Full Name
                c_norm1, c_norm2 = normalize_string(l1.company_name), normalize_string(l2.company_name)
                n_norm1, n_norm2 = normalize_string(l1.full_name), normalize_string(l2.full_name)

                if c_norm1 and c_norm2 and c_norm1 == c_norm2:
                    if n_norm1 and n_norm2 and n_norm1 == n_norm2:
                        rules_triggered.append(DuplicateMatchRule(
                            rule_name="identical_lead_person_and_company",
                            field_name="company_and_name",
                            confidence_score=95,
                            matched_value=f"{l1.company_name} / {l1.full_name}",
                            explanation=f"Identical lead contact and company: {l1.full_name} at {l1.company_name}"
                        ))
                        best_score = max(best_score, 95)
                        if not primary_rule:
                            primary_rule = "Identical Contact & Company"

                if rules_triggered and best_score >= 75:
                    matched_pairs.add(pair_key)
                    rec1 = DuplicateRecordItem(
                        id=l1.id,
                        ref=l1.ref,
                        name=f"{l1.full_name} ({l1.company_name})",
                        email=l1.email,
                        phone=l1.phone,
                        secondary_info=l1.source or l1.status,
                        status=l1.status,
                        created_at=l1.created_at,
                        owner_name=l1.owner_name,
                        fields={"company_name": l1.company_name, "source": l1.source, "score": l1.score, "priority": l1.priority}
                    )
                    rec2 = DuplicateRecordItem(
                        id=l2.id,
                        ref=l2.ref,
                        name=f"{l2.full_name} ({l2.company_name})",
                        email=l2.email,
                        phone=l2.phone,
                        secondary_info=l2.source or l2.status,
                        status=l2.status,
                        created_at=l2.created_at,
                        owner_name=l2.owner_name,
                        fields={"company_name": l2.company_name, "source": l2.source, "score": l2.score, "priority": l2.priority}
                    )
                    cluster_id = f"CLU-LED-{l1.ref}-{l2.ref}"
                    clusters.append(DuplicateCluster(
                        cluster_id=cluster_id,
                        entity_type="lead",
                        primary_rule=primary_rule,
                        confidence_score=best_score,
                        records=[rec1, rec2],
                        rules_triggered=rules_triggered
                    ))
                    if len(clusters) >= limit:
                        break
            if len(clusters) >= limit:
                break

        return DuplicateScanResponse(
            entity_type="lead",
            total_candidates_scanned=len(leads),
            clusters_found=len(clusters),
            clusters=clusters
        )

    # ==============================================================================
    # Atomic Record Merge Engine (CR-04)
    # ==============================================================================

    @staticmethod
    async def merge_records(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        req: RecordMergeRequest,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: str = "User"
    ) -> RecordMergeResponse:
        """Atomic, entity-specific merge engine for Accounts, Contacts, and Leads."""
        # 1. Validation guards: self-merge, duplicates check
        if req.master_id in req.duplicate_ids:
            raise ValidationException("Master record cannot be included in duplicate IDs to merge.")

        unique_dup_ids = list(set(req.duplicate_ids))
        if not unique_dup_ids:
            raise ValidationException("At least one distinct duplicate record ID must be specified.")

        if req.entity_type == "account":
            return await DuplicateService._merge_accounts(db, tenant_id, req.master_id, unique_dup_ids, req.field_overrides or {}, actor_id, actor_name)
        elif req.entity_type == "contact":
            return await DuplicateService._merge_contacts(db, tenant_id, req.master_id, unique_dup_ids, req.field_overrides or {}, actor_id, actor_name)
        elif req.entity_type == "lead":
            return await DuplicateService._merge_leads(db, tenant_id, req.master_id, unique_dup_ids, req.field_overrides or {}, actor_id, actor_name)
        else:
            raise ValidationException(f"Unsupported entity type for merging: {req.entity_type}")

    @staticmethod
    async def _merge_accounts(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        master_id: uuid.UUID,
        duplicate_ids: List[uuid.UUID],
        field_overrides: Dict[str, Any],
        actor_id: Optional[uuid.UUID],
        actor_name: str
    ) -> RecordMergeResponse:
        # Load master account
        master_res = await db.execute(
            select(Account).where(
                Account.id == master_id,
                Account.tenant_id == tenant_id,
                Account.deleted_at.is_(None)
            )
        )
        master = master_res.scalar_one_or_none()
        if not master:
            raise NotFoundException("Master account not found or has been deleted.")

        # Load duplicate accounts
        dup_res = await db.execute(
            select(Account).where(
                Account.id.in_(duplicate_ids),
                Account.tenant_id == tenant_id,
                Account.deleted_at.is_(None)
            )
        )
        duplicates: List[Account] = dup_res.scalars().all()
        if len(duplicates) != len(duplicate_ids):
            found_ids = {d.id for d in duplicates}
            missing = [str(did) for did in duplicate_ids if did not in found_ids]
            raise ValidationException(f"One or more duplicate accounts do not exist in this organization: {', '.join(missing)}")

        # Verify none of duplicates are already merged
        for d in duplicates:
            if d.merged_into_id is not None:
                raise ValidationException(f"Account {d.ref} is already merged into another account.")

        now = datetime.now(timezone.utc)

        # 1. Reassign child Contacts
        contact_reassign_res = await db.execute(
            update(Contact)
            .where(
                Contact.account_id.in_(duplicate_ids),
                Contact.tenant_id == tenant_id,
                Contact.deleted_at.is_(None)
            )
            .values(account_id=master.id, updated_at=now, updated_by=actor_id)
        )
        reassigned_contacts = contact_reassign_res.rowcount

        # 2. Reassign child Opportunities
        opp_reassign_res = await db.execute(
            update(Opportunity)
            .where(
                Opportunity.account_id.in_(duplicate_ids),
                Opportunity.tenant_id == tenant_id,
                Opportunity.deleted_at.is_(None)
            )
            .values(account_id=master.id, updated_at=now, updated_by=actor_id)
        )
        reassigned_opps = opp_reassign_res.rowcount

        # 3. Reassign child CRM Activities
        act_reassign_res = await db.execute(
            update(CRMActivity)
            .where(
                CRMActivity.account_id.in_(duplicate_ids),
                CRMActivity.tenant_id == tenant_id,
                CRMActivity.deleted_at.is_(None)
            )
            .values(account_id=master.id)
        )
        reassigned_acts = act_reassign_res.rowcount

        # 4. Reassign child Accounts pointing to duplicate as parent_id
        parent_reassign_res = await db.execute(
            update(Account)
            .where(
                Account.parent_id.in_(duplicate_ids),
                Account.tenant_id == tenant_id,
                Account.id != master.id,
                Account.deleted_at.is_(None)
            )
            .values(parent_id=master.id, updated_at=now, updated_by=actor_id)
        )
        reassigned_child_accounts = parent_reassign_res.rowcount

        # 5. Apply validated field overrides to master
        allowed_fields = {"name", "website", "phone", "email", "industry", "address", "ownership", "description"}
        for k, v in field_overrides.items():
            if k in allowed_fields and v is not None:
                setattr(master, k, v)

        master.updated_at = now
        master.updated_by = actor_id

        # 6. Soft-delete duplicates with merge pointer
        for d in duplicates:
            d.deleted_at = now
            d.merged_into_id = master.id
            d.updated_at = now
            d.updated_by = actor_id

        # 7. Create activity log on master
        merge_activity = CRMActivity(
            tenant_id=tenant_id,
            account_id=master.id,
            activity_type="System",
            subject=f"Merged {len(duplicates)} duplicate account(s) into master",
            description=f"Duplicate accounts {[d.ref for d in duplicates]} merged into master {master.ref}. Reassigned {reassigned_contacts} contacts, {reassigned_opps} opportunities, {reassigned_acts} activities.",
            occurred_at=now,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata_json={
                "duplicate_ids": [str(d.id) for d in duplicates],
                "duplicate_refs": [d.ref for d in duplicates],
                "reassigned_contacts": reassigned_contacts,
                "reassigned_opps": reassigned_opps,
                "reassigned_activities": reassigned_acts,
                "reassigned_child_accounts": reassigned_child_accounts
            }
        )
        db.add(merge_activity)

        # 8. Audit ledger logging
        await audit_service.log_event(
            db,
            action="crm.account.merged",
            resource_type="account",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(master.id),
            metadata={
                "master_ref": master.ref,
                "merged_accounts": [d.ref for d in duplicates],
                "merged_account_ids": [str(d.id) for d in duplicates],
                "contacts_reassigned": reassigned_contacts,
                "opportunities_reassigned": reassigned_opps
            }
        )

        await db.commit()
        await db.refresh(master)

        return RecordMergeResponse(
            entity_type="account",
            master_id=master.id,
            master_ref=master.ref,
            merged_ids=[d.id for d in duplicates],
            reassigned_counts={
                "contacts": reassigned_contacts,
                "opportunities": reassigned_opps,
                "activities": reassigned_acts,
                "child_accounts": reassigned_child_accounts
            },
            message=f"Successfully merged {len(duplicates)} account(s) into master {master.ref}."
        )

    @staticmethod
    async def _merge_contacts(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        master_id: uuid.UUID,
        duplicate_ids: List[uuid.UUID],
        field_overrides: Dict[str, Any],
        actor_id: Optional[uuid.UUID],
        actor_name: str
    ) -> RecordMergeResponse:
        master_res = await db.execute(
            select(Contact).where(
                Contact.id == master_id,
                Contact.tenant_id == tenant_id,
                Contact.deleted_at.is_(None)
            )
        )
        master = master_res.scalar_one_or_none()
        if not master:
            raise NotFoundException("Master contact not found or has been deleted.")

        dup_res = await db.execute(
            select(Contact).where(
                Contact.id.in_(duplicate_ids),
                Contact.tenant_id == tenant_id,
                Contact.deleted_at.is_(None)
            )
        )
        duplicates: List[Contact] = dup_res.scalars().all()
        if len(duplicates) != len(duplicate_ids):
            found_ids = {d.id for d in duplicates}
            missing = [str(did) for did in duplicate_ids if did not in found_ids]
            raise ValidationException(f"One or more duplicate contacts do not exist in this organization: {', '.join(missing)}")

        for d in duplicates:
            if d.merged_into_id is not None:
                raise ValidationException(f"Contact {d.ref} is already merged into another contact.")

        now = datetime.now(timezone.utc)

        # 1. Reassign child Opportunities
        opp_reassign_res = await db.execute(
            update(Opportunity)
            .where(
                Opportunity.contact_id.in_(duplicate_ids),
                Opportunity.tenant_id == tenant_id,
                Opportunity.deleted_at.is_(None)
            )
            .values(contact_id=master.id, updated_at=now, updated_by=actor_id)
        )
        reassigned_opps = opp_reassign_res.rowcount

        # 2. Reassign child Activities
        act_reassign_res = await db.execute(
            update(CRMActivity)
            .where(
                CRMActivity.contact_id.in_(duplicate_ids),
                CRMActivity.tenant_id == tenant_id,
                CRMActivity.deleted_at.is_(None)
            )
            .values(contact_id=master.id)
        )
        reassigned_acts = act_reassign_res.rowcount

        # 3. Apply field overrides
        allowed_fields = {"first_name", "last_name", "email", "phone", "job_title", "department", "description"}
        for k, v in field_overrides.items():
            if k in allowed_fields and v is not None:
                setattr(master, k, v)

        master.updated_at = now
        master.updated_by = actor_id

        # 4. Soft-delete duplicates
        for d in duplicates:
            d.deleted_at = now
            d.merged_into_id = master.id
            d.updated_at = now
            d.updated_by = actor_id

        # 5. Activity & Audit logging
        if master.account_id:
            act = CRMActivity(
                tenant_id=tenant_id,
                account_id=master.account_id,
                contact_id=master.id,
                activity_type="System",
                subject=f"Merged {len(duplicates)} duplicate contact(s) into master",
                description=f"Duplicate contacts {[d.ref for d in duplicates]} merged into master {master.ref}. Reassigned {reassigned_opps} opportunities, {reassigned_acts} activities.",
                occurred_at=now,
                actor_id=actor_id,
                actor_name=actor_name,
                metadata_json={"duplicate_refs": [d.ref for d in duplicates], "master_ref": master.ref}
            )
            db.add(act)

        await audit_service.log_event(
            db,
            action="crm.contact.merged",
            resource_type="contact",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(master.id),
            metadata={
                "master_ref": master.ref,
                "merged_contacts": [d.ref for d in duplicates],
                "opportunities_reassigned": reassigned_opps,
                "activities_reassigned": reassigned_acts
            }
        )

        await db.commit()
        await db.refresh(master)

        return RecordMergeResponse(
            entity_type="contact",
            master_id=master.id,
            master_ref=master.ref,
            merged_ids=[d.id for d in duplicates],
            reassigned_counts={
                "opportunities": reassigned_opps,
                "activities": reassigned_acts
            },
            message=f"Successfully merged {len(duplicates)} contact(s) into master {master.ref}."
        )

    @staticmethod
    async def _merge_leads(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        master_id: uuid.UUID,
        duplicate_ids: List[uuid.UUID],
        field_overrides: Dict[str, Any],
        actor_id: Optional[uuid.UUID],
        actor_name: str
    ) -> RecordMergeResponse:
        master_res = await db.execute(
            select(Lead).where(
                Lead.id == master_id,
                Lead.tenant_id == tenant_id,
                Lead.deleted_at.is_(None)
            )
        )
        master = master_res.scalar_one_or_none()
        if not master:
            raise NotFoundException("Master lead not found or has been deleted.")

        if master.status == "Converted":
            raise ValidationException("Cannot merge into an already converted lead.")

        dup_res = await db.execute(
            select(Lead).where(
                Lead.id.in_(duplicate_ids),
                Lead.tenant_id == tenant_id,
                Lead.deleted_at.is_(None)
            )
        )
        duplicates: List[Lead] = dup_res.scalars().all()
        if len(duplicates) != len(duplicate_ids):
            found_ids = {d.id for d in duplicates}
            missing = [str(did) for did in duplicate_ids if did not in found_ids]
            raise ValidationException(f"One or more duplicate leads do not exist in this organization: {', '.join(missing)}")

        for d in duplicates:
            if d.merged_into_id is not None:
                raise ValidationException(f"Lead {d.ref} is already merged into another lead.")
            if d.status == "Converted":
                raise ValidationException(f"Cannot merge already converted lead {d.ref}.")

        now = datetime.now(timezone.utc)

        # Apply field overrides to master lead
        allowed_fields = {"first_name", "last_name", "company_name", "job_title", "email", "phone", "source", "industry", "territory", "priority", "description"}
        for k, v in field_overrides.items():
            if k in allowed_fields and v is not None:
                setattr(master, k, v)

        # Consolidate highest score among duplicates
        highest_score = max([master.score] + [d.score for d in duplicates])
        master.score = highest_score
        master.updated_at = now
        master.updated_by = actor_id

        # Soft delete duplicates
        for d in duplicates:
            d.deleted_at = now
            d.merged_into_id = master.id
            d.updated_at = now
            d.updated_by = actor_id

        await audit_service.log_event(
            db,
            action="crm.lead.merged",
            resource_type="lead",
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            resource_id=str(master.id),
            metadata={
                "master_ref": master.ref,
                "merged_leads": [d.ref for d in duplicates],
                "consolidated_score": highest_score
            }
        )

        await db.commit()
        await db.refresh(master)

        return RecordMergeResponse(
            entity_type="lead",
            master_id=master.id,
            master_ref=master.ref,
            merged_ids=[d.id for d in duplicates],
            reassigned_counts={"consolidated_score": highest_score},
            message=f"Successfully merged {len(duplicates)} lead(s) into master {master.ref}."
        )
