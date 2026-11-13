import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any, Generic, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")

class PaginatedList(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int

# --- SLA Policy Schemas ---

class SLAPolicyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    priority: str = Field("Normal", max_length=32)
    first_response_hours: int = Field(4, ge=1)
    resolution_hours: int = Field(24, ge=1)
    business_hours_only: bool = True
    is_active: bool = True
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class SLAPolicyCreate(SLAPolicyBase):
    pass

class SLAPolicyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = None
    first_response_hours: Optional[int] = Field(None, ge=1)
    resolution_hours: Optional[int] = Field(None, ge=1)
    business_hours_only: Optional[bool] = None
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class SLAPolicyResponse(SLAPolicyBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Case Comment Schemas ---

class CaseCommentCreate(BaseModel):
    message: str = Field(..., min_length=1)
    is_internal: bool = False
    channel: str = Field("Portal", max_length=50)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class CaseCommentResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    case_id: uuid.UUID
    author_id: Optional[uuid.UUID] = None
    author_name: Optional[str] = None
    is_internal: bool
    message: str
    channel: str
    custom_fields: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Case Schemas ---

class CaseBase(BaseModel):
    subject: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    account_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    priority: str = Field("Normal", max_length=32)
    category: str = Field("Technical Support", max_length=100)
    channel: str = Field("Email", max_length=50)
    sentiment: str = Field("Neutral", max_length=32)
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    assigned_queue: Optional[str] = Field("Tier-1 Support", max_length=100)
    sla_policy_id: Optional[uuid.UUID] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class CaseCreate(CaseBase):
    pass

class CaseUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    account_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    channel: Optional[str] = None
    sentiment: Optional[str] = None
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    assigned_queue: Optional[str] = None
    sla_policy_id: Optional[uuid.UUID] = None
    resolution_summary: Optional[str] = None
    csat_score: Optional[int] = Field(None, ge=1, le=5)
    custom_fields: Optional[Dict[str, Any]] = None

class CaseTransitionRequest(BaseModel):
    target_status: str = Field(..., min_length=2, max_length=50)
    notes: Optional[str] = None
    resolution_summary: Optional[str] = None
    csat_score: Optional[int] = Field(None, ge=1, le=5)

class CaseResponse(CaseBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    status: str
    sla_response_deadline: Optional[datetime] = None
    sla_resolution_deadline: Optional[datetime] = None
    sla_paused_at: Optional[datetime] = None
    sla_breached: bool = False
    resolution_summary: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    csat_score: Optional[int] = None
    account_name: Optional[str] = None
    contact_name: Optional[str] = None
    comments: List[CaseCommentResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Knowledge Article Schemas ---

class KnowledgeArticleBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = None
    category: str = Field("Troubleshooting", max_length=100)
    summary: Optional[str] = None
    content: str = Field(..., min_length=1)
    visibility: str = Field("Customer-facing", max_length=50)
    status: str = Field("Published", max_length=50)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class KnowledgeArticleCreate(KnowledgeArticleBase):
    pass

class KnowledgeArticleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    visibility: Optional[str] = None
    status: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class KnowledgeArticleResponse(KnowledgeArticleBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    slug: str
    view_count: int = 0
    helpful_count: int = 0
    author_id: Optional[uuid.UUID] = None
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Customer Survey & Feedback Schemas ---

class CustomerSurveyBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    survey_type: str = Field("CSAT", max_length=50)
    trigger_event: str = Field("case.resolved", max_length=100)
    is_active: bool = True
    questions: List[Dict[str, Any]] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class CustomerSurveyCreate(CustomerSurveyBase):
    pass

class CustomerSurveyUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    survey_type: Optional[str] = None
    trigger_event: Optional[str] = None
    is_active: Optional[bool] = None
    questions: Optional[List[Dict[str, Any]]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class CustomerSurveyResponse(CustomerSurveyBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    response_count: int = 0
    average_score: Decimal = Decimal("0.00")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SurveyResponseCreate(BaseModel):
    survey_id: uuid.UUID
    case_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    score: int = Field(..., ge=1, le=10)
    sentiment: Optional[str] = "Positive"
    feedback_text: Optional[str] = None
    answers: Dict[str, Any] = Field(default_factory=dict)

class SurveyResponseItem(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    survey_id: Optional[uuid.UUID] = None
    case_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    score: int
    sentiment: Optional[str] = "Neutral"
    feedback_text: Optional[str] = None
    answers: Dict[str, Any] = Field(default_factory=dict)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    account_name: Optional[str] = None
    contact_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CSATSummaryResponse(BaseModel):
    total_responses: int
    average_csat: Decimal
    csat_percentage: Decimal
    nps_score: int
    positive_count: int
    neutral_count: int
    negative_count: int

# --- Service Dashboard Metrics ---

class ServiceDashboardMetrics(BaseModel):
    total_cases: int = 0
    open_cases: int = 0
    new_cases: int = 0
    assigned_cases: int = 0
    in_progress_cases: int = 0
    awaiting_customer_cases: int = 0
    resolved_cases: int = 0
    closed_cases: int = 0
    unassigned_cases: int = 0
    sla_compliance_rate: float = 100.0
    sla_breached_count: int = 0
    avg_first_response_hours: float = 0.0
    avg_resolution_hours: float = 0.0
    priority_distribution: Dict[str, int] = Field(default_factory=dict)
    status_distribution: Dict[str, int] = Field(default_factory=dict)
    channel_distribution: Dict[str, int] = Field(default_factory=dict)
    agent_workloads: List[Dict[str, Any]] = Field(default_factory=list)
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)

# --- Support Queue Schemas ---

class SupportQueueBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    priority: str = Field("Normal", max_length=32)
    default_channel: str = Field("Email", max_length=50)
    max_capacity: int = Field(50, ge=1)
    is_active: bool = True
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class SupportQueueCreate(SupportQueueBase):
    pass

class SupportQueueUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    default_channel: Optional[str] = None
    max_capacity: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class SupportQueueResponse(SupportQueueBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    active_case_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class QueueClaimRequest(BaseModel):
    case_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    user_name: Optional[str] = None

# --- Support Mailbox & Mailroom Schemas ---

class SupportMailboxBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    routing_rule: str = Field("Round-Robin", max_length=100)
    default_priority: str = Field("Normal", max_length=32)
    default_category: str = Field("Technical Support", max_length=100)
    default_queue_id: Optional[uuid.UUID] = None
    is_active: bool = True
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class SupportMailboxCreate(SupportMailboxBase):
    pass

class SupportMailboxUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[str] = None
    routing_rule: Optional[str] = None
    default_priority: Optional[str] = None
    default_category: Optional[str] = None
    default_queue_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class SupportMailboxResponse(SupportMailboxBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    message_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MailroomMessageBase(BaseModel):
    mailbox_id: Optional[uuid.UUID] = None
    case_id: Optional[uuid.UUID] = None
    message_id: str = Field(..., max_length=255)
    sender_email: str = Field(..., max_length=255)
    sender_name: Optional[str] = None
    subject: str = Field(..., max_length=255)
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    thread_token: Optional[str] = None
    status: str = Field("Processed", max_length=50)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class MailroomMessageCreate(MailroomMessageBase):
    pass

class MailroomMessageResponse(MailroomMessageBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    case_ref: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InboundEmailSimulation(BaseModel):
    mailbox_email: str
    sender_email: str
    sender_name: Optional[str] = None
    subject: str
    body_text: str
    message_id: Optional[str] = None

# --- Live Chat Schemas ---

class ChatMessageBase(BaseModel):
    sender_type: str = Field("visitor", max_length=32)
    sender_name: str = Field(..., max_length=255)
    message_text: str = Field(..., min_length=1)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    session_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatSessionBase(BaseModel):
    visitor_name: str = Field(..., min_length=1, max_length=255)
    visitor_email: Optional[str] = None
    channel: str = Field("Website", max_length=50)
    contact_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ChatSessionCreate(ChatSessionBase):
    initial_message: Optional[str] = None

class ChatSessionUpdate(BaseModel):
    status: Optional[str] = None
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    ended_at: Optional[datetime] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ChatSessionResponse(ChatSessionBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    converted_case_id: Optional[uuid.UUID] = None
    converted_case_ref: Optional[str] = None
    messages: List[ChatMessageResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConvertChatToCaseRequest(BaseModel):
    subject: Optional[str] = None
    category: str = Field("Technical Support", max_length=100)
    priority: str = Field("Normal", max_length=32)
    assigned_user_id: Optional[uuid.UUID] = None

# --- Websense Tracker Schemas ---

class WebsenseTrackerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    domain: str = Field(..., min_length=3, max_length=255)
    url_pattern: str = Field("/*", max_length=255)
    dwell_threshold_seconds: int = Field(45, ge=1)
    action: str = Field("Trigger Live Chat Prompt", max_length=100)
    is_active: bool = True
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class WebsenseTrackerCreate(WebsenseTrackerBase):
    pass

class WebsenseTrackerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    domain: Optional[str] = None
    url_pattern: Optional[str] = None
    dwell_threshold_seconds: Optional[int] = Field(None, ge=1)
    action: Optional[str] = None
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class WebsenseTrackerResponse(WebsenseTrackerBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    event_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TrackerEventCreate(BaseModel):
    tracker_id: Optional[uuid.UUID] = None
    session_id: str = Field(..., max_length=100)
    visitor_ip: Optional[str] = None
    page_url: str = Field(..., max_length=512)
    dwell_seconds: int = Field(0, ge=0)
    action_taken: Optional[str] = None
    contact_id: Optional[uuid.UUID] = None
    case_id: Optional[uuid.UUID] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class TrackerEventResponse(TrackerEventCreate):
    id: uuid.UUID
    tenant_id: uuid.UUID
    tracker_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Business Hours & Holiday Schemas ---

class BusinessHolidayBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    holiday_date: date
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class BusinessHolidayCreate(BusinessHolidayBase):
    pass

class BusinessHolidayResponse(BusinessHolidayBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    business_hours_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BusinessHoursBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    timezone: str = Field("UTC", max_length=100)
    schedule_config: Dict[str, Any] = Field(default_factory=dict)
    is_default: bool = False
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class BusinessHoursCreate(BusinessHoursBase):
    pass

class BusinessHoursUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    timezone: Optional[str] = None
    schedule_config: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class BusinessHoursResponse(BusinessHoursBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    holidays: List[BusinessHolidayResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Support Webform Schemas ---

class SupportWebformBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=255)
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    fields_config: List[Dict[str, Any]] = Field(default_factory=list)
    category: str = Field("Customer Support", max_length=100)
    priority: str = Field("Normal", max_length=32)
    target_queue_id: Optional[uuid.UUID] = None
    is_active: bool = True
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class SupportWebformCreate(SupportWebformBase):
    pass

class SupportWebformUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    fields_config: Optional[List[Dict[str, Any]]] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    target_queue_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class SupportWebformResponse(SupportWebformBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    submission_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WebformSubmissionCreate(BaseModel):
    submission_data: Dict[str, Any] = Field(default_factory=dict)
    honeypot_field: Optional[str] = None

class WebformSubmissionResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    webform_id: uuid.UUID
    case_id: Optional[uuid.UUID] = None
    case_ref: Optional[str] = None
    submission_data: Dict[str, Any]
    honeypot_triggered: bool
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Appointment Schemas ---

class AppointmentTypeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    duration_minutes: int = Field(30, ge=5, le=480)
    buffer_minutes: int = Field(15, ge=0, le=120)
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    is_active: bool = True
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class AppointmentTypeCreate(AppointmentTypeBase):
    pass

class AppointmentTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=480)
    buffer_minutes: Optional[int] = Field(None, ge=0, le=120)
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class AppointmentTypeResponse(AppointmentTypeBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CustomerAppointmentBase(BaseModel):
    appointment_type_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_user_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: str = Field(..., min_length=3, max_length=255)
    notes: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class CustomerAppointmentCreate(CustomerAppointmentBase):
    pass

class CustomerAppointmentUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class CustomerAppointmentResponse(CustomerAppointmentBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    ref: str
    status: str
    appointment_type_name: Optional[str] = None
    account_name: Optional[str] = None
    contact_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
