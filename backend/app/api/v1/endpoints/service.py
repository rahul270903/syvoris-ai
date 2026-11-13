import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_tenant_id,
    require_permission
)
from app.models.user import User
from app.schemas.service import (
    ServiceDashboardMetrics,
    SupportQueueCreate,
    SupportQueueUpdate,
    SupportQueueResponse,
    QueueClaimRequest,
    SupportMailboxCreate,
    SupportMailboxUpdate,
    SupportMailboxResponse,
    MailroomMessageResponse,
    InboundEmailSimulation,
    ChatSessionCreate,
    ChatSessionUpdate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ConvertChatToCaseRequest,
    WebsenseTrackerCreate,
    WebsenseTrackerUpdate,
    WebsenseTrackerResponse,
    TrackerEventCreate,
    TrackerEventResponse,
    BusinessHoursCreate,
    BusinessHoursUpdate,
    BusinessHoursResponse,
    BusinessHolidayCreate,
    BusinessHolidayResponse,
    SupportWebformCreate,
    SupportWebformUpdate,
    SupportWebformResponse,
    WebformSubmissionCreate,
    WebformSubmissionResponse,
    AppointmentTypeCreate,
    AppointmentTypeUpdate,
    AppointmentTypeResponse,
    CustomerAppointmentCreate,
    CustomerAppointmentResponse,
    CaseResponse
)
from app.services.case_service import CaseService
from app.services.queue_service import QueueService
from app.services.mailroom_service import MailroomService
from app.services.chat_service import ChatService
from app.services.tracker_service import TrackerService
from app.services.business_hours_service import BusinessHoursService
from app.services.webform_service import WebformService
from app.services.appointment_service import AppointmentService
from app.core.errors import ValidationException

router = APIRouter()

# --- 1. Service Dashboard Metrics ---

@router.get("/dashboard-metrics", response_model=ServiceDashboardMetrics)
async def get_service_dashboard_metrics(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve operational service dashboard metrics computed from live database records."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await CaseService.get_service_dashboard_metrics(db=db, tenant_id=tenant_id)

# --- 2. Support Queues ---

@router.get("/queues", response_model=List[SupportQueueResponse])
async def list_support_queues(
    is_active: Optional[bool] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List configured support queues and their current active ticket workload."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await QueueService.list_queues(db=db, tenant_id=tenant_id, is_active=is_active)

@router.post("/queues", response_model=SupportQueueResponse, status_code=status.HTTP_201_CREATED)
async def create_support_queue(
    queue_in: SupportQueueCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new support routing queue."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await QueueService.create_queue(
        db=db,
        queue_in=queue_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/queues/claim", response_model=CaseResponse)
async def claim_queue_case(
    claim_in: QueueClaimRequest,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Claim a case from a support queue, assigning it to the agent."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    target_user_id = claim_in.user_id or current_user.id
    target_user_name = claim_in.user_name or current_user.full_name
    return await QueueService.claim_case(
        db=db,
        case_id=claim_in.case_id,
        user_id=target_user_id,
        user_name=target_user_name,
        tenant_id=tenant_id
    )

# --- 3. Support Mailroom ---

@router.get("/mailroom/mailboxes", response_model=List[SupportMailboxResponse])
async def list_mailboxes(
    is_active: Optional[bool] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List configured inbound support mailboxes."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await MailroomService.list_mailboxes(db=db, tenant_id=tenant_id, is_active=is_active)

@router.post("/mailroom/mailboxes", response_model=SupportMailboxResponse, status_code=status.HTTP_201_CREATED)
async def create_mailbox(
    mailbox_in: SupportMailboxCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new support mailbox scanner."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await MailroomService.create_mailbox(
        db=db,
        mailbox_in=mailbox_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/mailroom/messages", response_model=List[MailroomMessageResponse])
async def list_mailroom_messages(
    mailbox_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List ingested email messages and their linked support tickets."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await MailroomService.list_messages(db=db, tenant_id=tenant_id, mailbox_id=mailbox_id, limit=limit)

@router.post("/mailroom/simulate", response_model=MailroomMessageResponse)
async def simulate_inbound_email(
    payload: InboundEmailSimulation,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Ingest an inbound email message with thread token parsing and auto-case creation."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await MailroomService.process_inbound_email(db=db, payload=payload, tenant_id=tenant_id)

# --- 4. Live Chats ---

@router.get("/chats", response_model=List[ChatSessionResponse])
async def list_chat_sessions(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List live chat sessions and their status."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await ChatService.list_sessions(db=db, tenant_id=tenant_id, status=status_filter, limit=limit)

@router.post("/chats", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    session_in: ChatSessionCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Initiate a new live chat session."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await ChatService.create_session(db=db, session_in=session_in, tenant_id=tenant_id)

@router.get("/chats/{id}", response_model=ChatSessionResponse)
async def get_chat_session(
    id: uuid.UUID,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """Get chat session transcript."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await ChatService.get_session(db=db, session_id=id, tenant_id=tenant_id)

@router.post("/chats/{id}/messages", response_model=ChatMessageResponse)
async def send_chat_message(
    id: uuid.UUID,
    message_in: ChatMessageCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Send a message in a live chat session."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await ChatService.send_message(db=db, session_id=id, message_in=message_in, tenant_id=tenant_id)

@router.post("/chats/{id}/convert-to-case", response_model=CaseResponse)
async def convert_chat_to_case(
    id: uuid.UUID,
    convert_in: ConvertChatToCaseRequest,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Convert a live chat conversation into a formal customer service case."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await ChatService.convert_chat_to_case(
        db=db,
        session_id=id,
        convert_in=convert_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

# --- 5. Websense Trackers ---

@router.get("/trackers", response_model=List[WebsenseTrackerResponse])
async def list_websense_trackers(
    is_active: Optional[bool] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List website digital behavior and intent trackers."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await TrackerService.list_trackers(db=db, tenant_id=tenant_id, is_active=is_active)

@router.post("/trackers", response_model=WebsenseTrackerResponse, status_code=status.HTTP_201_CREATED)
async def create_websense_tracker(
    tracker_in: WebsenseTrackerCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new Websense tracking configuration."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await TrackerService.create_tracker(
        db=db,
        tracker_in=tracker_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/trackers/events", response_model=List[TrackerEventResponse])
async def list_tracker_events(
    tracker_id: Optional[uuid.UUID] = Query(None),
    case_id: Optional[uuid.UUID] = Query(None),
    session_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """Inspect visitor digital footprints and pre-case website navigation history."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await TrackerService.list_events(
        db=db,
        tenant_id=tenant_id,
        tracker_id=tracker_id,
        case_id=case_id,
        session_id=session_id,
        limit=limit
    )

@router.post("/trackers/events", response_model=TrackerEventResponse)
async def log_tracker_event(
    event_in: TrackerEventCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Log a website navigation or high-intent dwell event."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await TrackerService.log_event(db=db, event_in=event_in, tenant_id=tenant_id)

# --- 6. Business Hours ---

@router.get("/business-hours", response_model=List[BusinessHoursResponse])
async def list_business_hours(
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List configured business hours calendars and holiday schedules."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await BusinessHoursService.list_business_hours(db=db, tenant_id=tenant_id)

@router.post("/business-hours", response_model=BusinessHoursResponse, status_code=status.HTTP_201_CREATED)
async def create_business_hours(
    bh_in: BusinessHoursCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new business hours operating calendar."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await BusinessHoursService.create_business_hours(
        db=db,
        bh_in=bh_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.post("/business-hours/{id}/holidays", response_model=BusinessHolidayResponse)
async def add_business_holiday(
    id: uuid.UUID,
    holiday_in: BusinessHolidayCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Add a holiday date exception to a business calendar."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await BusinessHoursService.add_holiday(
        db=db,
        business_hours_id=id,
        holiday_in=holiday_in,
        tenant_id=tenant_id
    )

# --- 7. Support Webforms ---

@router.get("/webforms", response_model=List[SupportWebformResponse])
async def list_support_webforms(
    is_active: Optional[bool] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List customer intake webforms."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await WebformService.list_webforms(db=db, tenant_id=tenant_id, is_active=is_active)

@router.post("/webforms", response_model=SupportWebformResponse, status_code=status.HTTP_201_CREATED)
async def create_support_webform(
    webform_in: SupportWebformCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new published support intake form."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await WebformService.create_webform(
        db=db,
        webform_in=webform_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/webforms/submissions", response_model=List[WebformSubmissionResponse])
async def list_webform_submissions(
    webform_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List intake form submissions and their generated support cases."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await WebformService.list_submissions(db=db, tenant_id=tenant_id, webform_id=webform_id, limit=limit)

# --- 8. Appointment Pages ---

@router.get("/appointments/types", response_model=List[AppointmentTypeResponse])
async def list_appointment_types(
    is_active: Optional[bool] = Query(None),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List customer appointment scheduling types."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await AppointmentService.list_types(db=db, tenant_id=tenant_id, is_active=is_active)

@router.post("/appointments/types", response_model=AppointmentTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment_type(
    type_in: AppointmentTypeCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new service appointment booking type."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await AppointmentService.create_type(
        db=db,
        type_in=type_in,
        tenant_id=tenant_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )

@router.get("/appointments", response_model=List[CustomerAppointmentResponse])
async def list_customer_appointments(
    type_id: Optional[uuid.UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db)
):
    """List scheduled customer service appointments."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await AppointmentService.list_appointments(
        db=db,
        tenant_id=tenant_id,
        type_id=type_id,
        status=status_filter,
        limit=limit
    )

@router.post("/appointments/book", response_model=CustomerAppointmentResponse, status_code=status.HTTP_201_CREATED)
async def book_customer_appointment(
    appt_in: CustomerAppointmentCreate,
    tenant_id: Optional[uuid.UUID] = Depends(get_current_active_tenant_id),
    _: None = Depends(require_permission("cases:write")),
    db: AsyncSession = Depends(get_db)
):
    """Book a new customer appointment with transactional overlap protection."""
    if not tenant_id:
        raise ValidationException("No active organization context.")
    return await AppointmentService.book_appointment(db=db, appt_in=appt_in, tenant_id=tenant_id)
