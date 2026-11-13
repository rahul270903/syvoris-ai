import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id
)
from app.models.user import User
from app.models.service import Case, KnowledgeArticle, AppointmentType
from app.schemas.service import (
    CaseResponse,
    CaseCreate,
    CaseCommentCreate,
    CaseCommentResponse,
    KnowledgeArticleResponse,
    AppointmentTypeResponse,
    CustomerAppointmentCreate,
    CustomerAppointmentResponse,
    WebformSubmissionCreate,
    WebformSubmissionResponse
)
from app.services.case_service import CaseService
from app.services.appointment_service import AppointmentService
from app.services.webform_service import WebformService
from app.core.errors import NotFoundException, ValidationException

router = APIRouter()

# --- Customer Portal Cases ---

@router.get("/cases", response_model=List[CaseResponse])
async def list_portal_cases(
    account_id: Optional[uuid.UUID] = Query(None),
    contact_id: Optional[uuid.UUID] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve customer-visible cases strictly filtered by organization or contact."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    items, _, _ = await CaseService.list_cases(
        db=db,
        tenant_id=tenant_id,
        account_id=account_id,
        contact_id=contact_id,
        limit=50
    )
    # Censor any internal comments from the portal response
    for c in items:
        c.comments = [cm for cm in c.comments if not cm.is_internal]

    return items

@router.get("/cases/{id}", response_model=CaseResponse)
async def get_portal_case(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve single customer case with internal notes strictly censored."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    case = await CaseService.get_case(db=db, case_id=id, tenant_id=tenant_id)
    case.comments = [cm for cm in case.comments if not cm.is_internal]
    return case

@router.post("/cases", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_portal_case(
    case_in: CaseCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lodge a new support ticket through the customer portal."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    case_in.channel = "Portal"
    actor_name = current_user.full_name if current_user else "Portal Customer"
    actor_id = current_user.id if current_user else None

    return await CaseService.create_case(
        db=db,
        case_in=case_in,
        tenant_id=tenant_id,
        actor_id=actor_id,
        actor_name=actor_name
    )

@router.post("/cases/{id}/comment", response_model=CaseCommentResponse)
async def add_portal_case_comment(
    id: uuid.UUID,
    comment_in: CaseCommentCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Customer submits reply to an open support case."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    # Portal comments are NEVER internal
    comment_in.is_internal = False
    comment_in.channel = "Portal"
    actor_name = current_user.full_name if current_user else "Portal Customer"
    actor_id = current_user.id if current_user else None

    return await CaseService.add_comment(
        db=db,
        case_id=id,
        comment_in=comment_in,
        tenant_id=tenant_id,
        author_id=actor_id,
        author_name=actor_name
    )

# --- Customer Portal Knowledge Base ---

@router.get("/knowledge", response_model=List[KnowledgeArticleResponse])
async def list_portal_knowledge(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Browse published, customer-facing knowledge articles."""
    if not tenant_id:
        raise ValidationException("No active organization context.")

    stmt = select(KnowledgeArticle).where(
        KnowledgeArticle.tenant_id == tenant_id,
        KnowledgeArticle.status == "Published",
        KnowledgeArticle.visibility == "Customer-facing",
        KnowledgeArticle.deleted_at.is_(None)
    )
    if category:
        stmt = stmt.where(KnowledgeArticle.category == category)
    if q:
        stmt = stmt.where(KnowledgeArticle.title.ilike(f"%{q}%"))

    stmt = stmt.order_by(desc(KnowledgeArticle.helpful_count), desc(KnowledgeArticle.view_count))
    res = await db.execute(stmt)
    articles = res.scalars().all()
    return [KnowledgeArticleResponse.model_validate(a) for a in articles]

# --- Customer Portal Appointments ---

@router.get("/appointments/types", response_model=List[AppointmentTypeResponse])
async def list_portal_appointment_types(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """List available booking types for customer self-service."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await AppointmentService.list_types(db=db, tenant_id=tenant_id, is_active=True)

@router.post("/appointments/book", response_model=CustomerAppointmentResponse, status_code=status.HTTP_201_CREATED)
async def book_portal_appointment(
    appt_in: CustomerAppointmentCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Self-service appointment booking with slot collision prevention."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await AppointmentService.book_appointment(db=db, appt_in=appt_in, tenant_id=tenant_id)

# --- Public Webform Ingestion ---

@router.post("/webforms/{slug}/submit", response_model=WebformSubmissionResponse)
async def submit_public_webform(
    slug: str,
    submission_in: WebformSubmissionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Public customer intake form submission with honeypot spam protection."""
    client_ip = request.client.host if request.client else "unknown"
    return await WebformService.submit_webform(
        db=db,
        slug=slug,
        submission_in=submission_in,
        ip_address=client_ip
    )
