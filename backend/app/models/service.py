import uuid
from datetime import datetime, date, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Text, JSON, ForeignKey, Uuid, Boolean, Numeric, DateTime, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TenantScopedModel

class Case(TenantScopedModel):
    __tablename__ = "cases"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(50), default="New", nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(32), default="Normal", nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), default="Technical Support", nullable=False, index=True)
    channel: Mapped[str] = mapped_column(String(50), default="Email", nullable=False)
    sentiment: Mapped[str] = mapped_column(String(32), default="Neutral", nullable=False)
    assigned_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    assigned_user_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    assigned_queue: Mapped[Optional[str]] = mapped_column(String(100), default="Tier-1 Support", nullable=True)
    sla_policy_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("sla_policies.id", ondelete="SET NULL"), nullable=True
    )
    sla_response_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sla_resolution_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sla_paused_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sla_breached: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    resolution_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    csat_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    comments: Mapped[List["CaseComment"]] = relationship(
        "CaseComment", back_populates="case", cascade="all, delete-orphan", lazy="select"
    )
    account: Mapped[Optional["app.models.crm.Account"]] = relationship("Account", back_populates="cases", lazy="select")
    contact: Mapped[Optional["app.models.crm.Contact"]] = relationship("Contact", back_populates="cases", lazy="select")

class CaseComment(TenantScopedModel):
    __tablename__ = "case_comments"

    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    author_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(String(50), default="Portal", nullable=False)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="comments")

class SLAPolicy(TenantScopedModel):
    __tablename__ = "sla_policies"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(32), default="Normal", nullable=False, index=True)
    first_response_hours: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    resolution_hours: Mapped[int] = mapped_column(Integer, default=24, nullable=False)
    business_hours_only: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

class KnowledgeArticle(TenantScopedModel):
    __tablename__ = "knowledge_articles"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), default="Troubleshooting", nullable=False, index=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    visibility: Mapped[str] = mapped_column(String(50), default="Customer-facing", nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="Published", nullable=False, index=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    helpful_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    author_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

class CustomerSurvey(TenantScopedModel):
    __tablename__ = "customer_surveys"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    survey_type: Mapped[str] = mapped_column(String(50), default="CSAT", nullable=False)
    trigger_event: Mapped[str] = mapped_column(String(50), default="case.resolved", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    responses: Mapped[List["SurveyResponse"]] = relationship(
        "SurveyResponse", back_populates="survey", cascade="all, delete-orphan", lazy="select"
    )

class SurveyResponse(TenantScopedModel):
    __tablename__ = "survey_responses"

    survey_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("customer_surveys.id", ondelete="CASCADE"), nullable=True, index=True
    )
    case_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True, index=True
    )
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False) # 1-5 for CSAT, 0-10 for NPS
    sentiment: Mapped[str] = mapped_column(String(32), default="Neutral", nullable=False)
    feedback_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    survey: Mapped[Optional["CustomerSurvey"]] = relationship("CustomerSurvey", back_populates="responses")
    case: Mapped[Optional["Case"]] = relationship("Case", lazy="select")

class BusinessHours(TenantScopedModel):
    __tablename__ = "business_hours"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    timezone: Mapped[str] = mapped_column(String(100), default="UTC", nullable=False)
    schedule_config: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    holidays: Mapped[List["BusinessHoliday"]] = relationship(
        "BusinessHoliday", back_populates="business_hours", cascade="all, delete-orphan", lazy="selectin"
    )

class BusinessHoliday(TenantScopedModel):
    __tablename__ = "business_holidays"

    business_hours_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("business_hours.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    holiday_date: Mapped[date] = mapped_column(Date, nullable=False)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    business_hours: Mapped["BusinessHours"] = relationship("BusinessHours", back_populates="holidays")

class SupportQueue(TenantScopedModel):
    __tablename__ = "support_queues"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(32), default="Normal", nullable=False)
    default_channel: Mapped[str] = mapped_column(String(50), default="Email", nullable=False)
    max_capacity: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

class SupportMailbox(TenantScopedModel):
    __tablename__ = "support_mailboxes"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    routing_rule: Mapped[str] = mapped_column(String(100), default="Round-Robin", nullable=False)
    default_priority: Mapped[str] = mapped_column(String(32), default="Normal", nullable=False)
    default_category: Mapped[str] = mapped_column(String(100), default="Technical Support", nullable=False)
    default_queue_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("support_queues.id", ondelete="SET NULL"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    messages: Mapped[List["MailroomMessage"]] = relationship(
        "MailroomMessage", back_populates="mailbox", cascade="all, delete-orphan", lazy="select"
    )

class MailroomMessage(TenantScopedModel):
    __tablename__ = "mailroom_messages"

    mailbox_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("support_mailboxes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    case_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True, index=True
    )
    message_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sender_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sender_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thread_token: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), default="Processed", nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    mailbox: Mapped[Optional["SupportMailbox"]] = relationship("SupportMailbox", back_populates="messages")
    case: Mapped[Optional["Case"]] = relationship("Case", lazy="select")

class ChatSession(TenantScopedModel):
    __tablename__ = "chat_sessions"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    assigned_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    assigned_user_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    visitor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    visitor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False, index=True)
    channel: Mapped[str] = mapped_column(String(50), default="Website", nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    converted_case_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True
    )
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan", lazy="selectin"
    )
    converted_case: Mapped[Optional["Case"]] = relationship("Case", lazy="select")

class ChatMessage(TenantScopedModel):
    __tablename__ = "chat_messages"

    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_type: Mapped[str] = mapped_column(String(32), default="visitor", nullable=False)
    sender_name: Mapped[str] = mapped_column(String(255), nullable=False)
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages")

class WebsenseTracker(TenantScopedModel):
    __tablename__ = "websense_trackers"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    domain: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    url_pattern: Mapped[str] = mapped_column(String(255), default="/*", nullable=False)
    dwell_threshold_seconds: Mapped[int] = mapped_column(Integer, default=45, nullable=False)
    action: Mapped[str] = mapped_column(String(100), default="Trigger Live Chat Prompt", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    events: Mapped[List["TrackerEvent"]] = relationship(
        "TrackerEvent", back_populates="tracker", cascade="all, delete-orphan", lazy="select"
    )

class TrackerEvent(TenantScopedModel):
    __tablename__ = "tracker_events"

    tracker_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("websense_trackers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    session_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    visitor_ip: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    page_url: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    dwell_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    action_taken: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True
    )
    case_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True
    )
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    tracker: Mapped[Optional["WebsenseTracker"]] = relationship("WebsenseTracker", back_populates="events")

class SupportWebform(TenantScopedModel):
    __tablename__ = "support_webforms"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fields_config: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="Customer Support", nullable=False)
    priority: Mapped[str] = mapped_column(String(32), default="Normal", nullable=False)
    target_queue_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("support_queues.id", ondelete="SET NULL"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    submissions: Mapped[List["WebformSubmission"]] = relationship(
        "WebformSubmission", back_populates="webform", cascade="all, delete-orphan", lazy="select"
    )

class WebformSubmission(TenantScopedModel):
    __tablename__ = "webform_submissions"

    webform_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("support_webforms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    case_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True, index=True
    )
    submission_data: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    honeypot_triggered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Accepted", nullable=False)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    webform: Mapped["SupportWebform"] = relationship("SupportWebform", back_populates="submissions")
    case: Mapped[Optional["Case"]] = relationship("Case", lazy="select")

class AppointmentType(TenantScopedModel):
    __tablename__ = "appointment_types"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    buffer_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    assigned_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    assigned_user_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    appointments: Mapped[List["CustomerAppointment"]] = relationship(
        "CustomerAppointment", back_populates="appointment_type", cascade="all, delete-orphan", lazy="select"
    )

class CustomerAppointment(TenantScopedModel):
    __tablename__ = "customer_appointments"

    ref: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    appointment_type_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("appointment_types.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    assigned_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    assigned_user_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="Scheduled", nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    appointment_type: Mapped["AppointmentType"] = relationship("AppointmentType", back_populates="appointments")
    account: Mapped[Optional["Account"]] = relationship("Account", lazy="select")
    contact: Mapped[Optional["Contact"]] = relationship("Contact", lazy="select")
