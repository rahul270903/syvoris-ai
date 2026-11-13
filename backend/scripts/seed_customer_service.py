import sys
import os
import uuid
import shutil
from datetime import datetime, timezone, timedelta, date

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from app.db.base import Base
from app.models.tenant import Tenant
from app.models.crm import Account, Contact
from app.models.service import (
    Case, CaseComment, SLAPolicy, KnowledgeArticle, CustomerSurvey, SurveyResponse,
    BusinessHours, BusinessHoliday, SupportQueue, SupportMailbox, MailroomMessage,
    ChatSession, ChatMessage, WebsenseTracker, TrackerEvent,
    SupportWebform, WebformSubmission, AppointmentType, CustomerAppointment
)

ROOT_DB = os.path.abspath(os.path.join(backend_dir, "..", "syvoris_dev.db"))

async def seed():
    print(f"Connecting to database at {ROOT_DB}...")
    engine = create_async_engine(f"sqlite+aiosqlite:///{ROOT_DB.replace(os.sep, '/')}")

    # Ensure all tables exist in SQLite
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # SQLite column check
        from app.db.session import _sync_sqlite_columns
        await conn.run_sync(_sync_sqlite_columns)

    async_session = async_sessionmaker(engine, class_=AsyncSession)

    async with async_session() as db:
        # Find BluePeak Innovations tenant
        t_res = await db.execute(select(Tenant).where(Tenant.slug == "bluepeak-innovations"))
        tenant = t_res.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(name="BluePeak Innovations", slug="bluepeak-innovations", status="Active")
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)
        tenant_id = tenant.id
        print(f"Seeding Customer Service for Tenant: {tenant.name} ({tenant_id})")

        # 1. Accounts & Contacts
        acc_res = await db.execute(select(Account).where(Account.tenant_id == tenant_id, Account.name == "NovaTech Solutions"))
        acc = acc_res.scalar_one_or_none()
        if not acc:
            acc = Account(
                tenant_id=tenant_id,
                ref="ACC-2026-00001",
                name="NovaTech Solutions",
                industry="Cloud Computing",
                status="Active"
            )
            db.add(acc)
            await db.commit()
            await db.refresh(acc)
        account_id = acc.id

        ct_res = await db.execute(select(Contact).where(Contact.tenant_id == tenant_id, Contact.email == "elena.rostova@novatech.example"))
        ct = ct_res.scalar_one_or_none()
        if not ct:
            ct = Contact(
                tenant_id=tenant_id,
                account_id=account_id,
                ref="CON-2026-00001",
                first_name="Elena",
                last_name="Rostova",
                email="elena.rostova@novatech.example",
                job_title="VP Engineering",
                status="Active"
            )
            db.add(ct)
            await db.commit()
            await db.refresh(ct)
        contact_id = ct.id

        now = datetime.now(timezone.utc)

        # 2. Business Hours
        bh_res = await db.execute(select(BusinessHours).where(BusinessHours.tenant_id == tenant_id))
        bh = bh_res.scalars().first()
        if not bh:
            bh = BusinessHours(
                tenant_id=tenant_id,
                ref="BHR-2026-00001",
                name="Standard Enterprise Support (UTC)",
                timezone="UTC",
                schedule_config={
                    "monday": {"active": True, "open": "09:00", "close": "17:00"},
                    "tuesday": {"active": True, "open": "09:00", "close": "17:00"},
                    "wednesday": {"active": True, "open": "09:00", "close": "17:00"},
                    "thursday": {"active": True, "open": "09:00", "close": "17:00"},
                    "friday": {"active": True, "open": "09:00", "close": "17:00"},
                    "saturday": {"active": False, "open": "00:00", "close": "00:00"},
                    "sunday": {"active": False, "open": "00:00", "close": "00:00"},
                },
                is_default=True,
                custom_fields={}
            )
            db.add(bh)
            await db.commit()
            await db.refresh(bh)

            db.add(BusinessHoliday(
                tenant_id=tenant_id,
                business_hours_id=bh.id,
                name="New Year's Day",
                holiday_date=date(2027, 1, 1),
                custom_fields={}
            ))
            await db.commit()
            print("Seeded Business Hours & Holidays")

        # 3. Support Queues
        q_res = await db.execute(select(SupportQueue).where(SupportQueue.tenant_id == tenant_id))
        queues = q_res.scalars().all()
        if not queues:
            q1 = SupportQueue(
                tenant_id=tenant_id,
                ref="QUE-2026-00001",
                name="Tier-1 General Support",
                code="tier-1-support",
                description="General incoming frontline support tickets and triage",
                priority="Normal",
                default_channel="Email",
                max_capacity=50,
                is_active=True,
                custom_fields={}
            )
            q2 = SupportQueue(
                tenant_id=tenant_id,
                ref="QUE-2026-00002",
                name="Cloud & Infrastructure Escalations",
                code="cloud-infrastructure",
                description="Critical cluster issues, uptime anomalies, and security patches",
                priority="High",
                default_channel="Portal",
                max_capacity=25,
                is_active=True,
                custom_fields={}
            )
            q3 = SupportQueue(
                tenant_id=tenant_id,
                ref="QUE-2026-00003",
                name="Commercial & Billing Queries",
                code="billing-commercial",
                description="Invoice disputes, VAT documentation, and contract renewals",
                priority="Normal",
                default_channel="Email",
                max_capacity=30,
                is_active=True,
                custom_fields={}
            )
            db.add_all([q1, q2, q3])
            await db.commit()
            print("Seeded Support Queues")

        # 4. Support Mailboxes
        mb_res = await db.execute(select(SupportMailbox).where(SupportMailbox.tenant_id == tenant_id))
        if not mb_res.scalars().first():
            mb1 = SupportMailbox(
                tenant_id=tenant_id,
                ref="MLR-2026-00001",
                name="Global Customer Care",
                email="support@bluepeak.example",
                routing_rule="Round-Robin",
                default_priority="Normal",
                default_category="Technical Support",
                is_active=True,
                custom_fields={}
            )
            mb2 = SupportMailbox(
                tenant_id=tenant_id,
                ref="MLR-2026-00002",
                name="Enterprise Escalations Desk",
                email="enterprise-desk@bluepeak.example",
                routing_rule="Skill-Based",
                default_priority="High",
                default_category="Cloud Infrastructure",
                is_active=True,
                custom_fields={}
            )
            db.add_all([mb1, mb2])
            await db.commit()
            print("Seeded Support Mailboxes")

        # 5. Cases & Comments
        case_res = await db.execute(select(Case).where(Case.tenant_id == tenant_id))
        existing_cases = case_res.scalars().all()
        if len(existing_cases) < 3:
            c2 = Case(
                tenant_id=tenant_id,
                ref="CASE-2026-00002",
                subject="API Webhook Latency Spikes during Peak Batch Ingestion",
                description="Client observed latency exceeding 1200ms on /api/v1/sync endpoints between 14:00-16:00 UTC.",
                account_id=account_id,
                contact_id=contact_id,
                status="In Progress",
                priority="High",
                category="API Integration",
                channel="Portal",
                sentiment="Neutral",
                assigned_user_name="Tier-1 Support Team",
                assigned_queue="Tier-1 General Support",
                sla_response_deadline=now + timedelta(hours=2),
                sla_resolution_deadline=now + timedelta(hours=8),
                sla_breached=False,
                custom_fields={}
            )
            c3 = Case(
                tenant_id=tenant_id,
                ref="CASE-2026-00003",
                subject="Updated VAT Exemption Certificate Verification for Q4 Invoicing",
                description="NovaTech finance submitted revised European VAT exemption certification for recurring invoice validation.",
                account_id=account_id,
                contact_id=contact_id,
                status="Resolved",
                priority="Normal",
                category="Billing & Invoicing",
                channel="Email",
                sentiment="Positive",
                assigned_user_name="Tier-1 Support Team",
                assigned_queue="Commercial & Billing Queries",
                sla_response_deadline=now - timedelta(hours=10),
                sla_resolution_deadline=now - timedelta(hours=2),
                sla_breached=False,
                resolution_summary="Certificate validated against European VIES registry and attached to Account profile.",
                resolved_at=now - timedelta(hours=2),
                csat_score=5,
                custom_fields={}
            )
            db.add_all([c2, c3])
            await db.commit()
            await db.refresh(c2)
            await db.refresh(c3)

            # Comments
            cm1 = CaseComment(
                tenant_id=tenant_id,
                case_id=c2.id,
                author_name="Elena Rostova",
                is_internal=False,
                message="We have captured APM trace IDs for the slow endpoints and uploaded them for review.",
                channel="Portal",
                custom_fields={}
            )
            cm2 = CaseComment(
                tenant_id=tenant_id,
                case_id=c2.id,
                author_name="Support Engineer",
                is_internal=True,
                message="Investigating database connection pool saturation on worker pod 3.",
                channel="Internal",
                custom_fields={}
            )
            db.add_all([cm1, cm2])
            await db.commit()
            print("Seeded Cases and Case Comments")

        # 6. Mailroom Messages
        mm_res = await db.execute(select(MailroomMessage).where(MailroomMessage.tenant_id == tenant_id))
        if not mm_res.scalars().first():
            c1_res = await db.execute(select(Case).where(Case.tenant_id == tenant_id))
            first_case = c1_res.scalars().first()
            m1 = MailroomMessage(
                tenant_id=tenant_id,
                case_id=first_case.id if first_case else None,
                message_id="msg-001@novatech.example",
                sender_email="elena.rostova@novatech.example",
                sender_name="Elena Rostova",
                subject=f"Re: [{first_case.ref if first_case else 'CASE-2026-00001'}] Certificate Status Update",
                body_text="Thank you, we have reviewed the certificate documentation and scheduled maintenance.",
                thread_token=f"[{first_case.ref if first_case else 'CASE-2026-00001'}]",
                status="Linked",
                custom_fields={}
            )
            m2 = MailroomMessage(
                tenant_id=tenant_id,
                case_id=None,
                message_id="msg-002@prospect.example",
                sender_email="admin@apexlogistics.example",
                sender_name="David Vance",
                subject="Inquiry regarding dedicated SLA terms for multi-region deployment",
                body_text="Hi Support Team, could you provide SLA commitment details for 99.99% availability?",
                thread_token=None,
                status="Processed",
                custom_fields={}
            )
            db.add_all([m1, m2])
            await db.commit()
            print("Seeded Mailroom Messages")

        # 7. Live Chats
        cs_res = await db.execute(select(ChatSession).where(ChatSession.tenant_id == tenant_id))
        if not cs_res.scalars().first():
            chat = ChatSession(
                tenant_id=tenant_id,
                ref="CHT-2026-00001",
                contact_id=contact_id,
                account_id=account_id,
                visitor_name="Elena Rostova",
                visitor_email="elena.rostova@novatech.example",
                status="Active",
                channel="Website",
                started_at=now - timedelta(minutes=18),
                assigned_user_name="Tier-1 Support Team",
                custom_fields={}
            )
            db.add(chat)
            await db.commit()
            await db.refresh(chat)

            db.add_all([
                ChatMessage(
                    tenant_id=tenant_id,
                    session_id=chat.id,
                    sender_type="visitor",
                    sender_name="Elena Rostova",
                    message_text="Hello, we are configuring SSO SAML and have a quick question about metadata endpoints.",
                    custom_fields={}
                ),
                ChatMessage(
                    tenant_id=tenant_id,
                    session_id=chat.id,
                    sender_type="agent",
                    sender_name="Tier-1 Support Team",
                    message_text="Hi Elena! You can download the XML metadata directly from /api/v1/auth/saml/metadata.",
                    custom_fields={}
                ),
                ChatMessage(
                    tenant_id=tenant_id,
                    session_id=chat.id,
                    sender_type="visitor",
                    sender_name="Elena Rostova",
                    message_text="Got it, downloading now. That worked perfectly, thank you!",
                    custom_fields={}
                ),
            ])
            await db.commit()
            print("Seeded Live Chat Session & Messages")

        # 8. Websense Trackers & Events
        wt_res = await db.execute(select(WebsenseTracker).where(WebsenseTracker.tenant_id == tenant_id))
        wt = wt_res.scalars().first()
        if not wt:
            wt = WebsenseTracker(
                tenant_id=tenant_id,
                ref="TRK-2026-00001",
                name="Enterprise Pricing & SLA Viewer Tracker",
                domain="app.bluepeak.example",
                url_pattern="/pricing/*",
                dwell_threshold_seconds=30,
                action="Trigger Live Chat Prompt",
                is_active=True,
                custom_fields={}
            )
            db.add(wt)
            await db.commit()
            await db.refresh(wt)

            db.add(TrackerEvent(
                tenant_id=tenant_id,
                tracker_id=wt.id,
                session_id="sess-nt-9482",
                visitor_ip="198.51.100.42",
                page_url="https://app.bluepeak.example/pricing/enterprise",
                dwell_seconds=52,
                action_taken="Trigger Live Chat Prompt",
                contact_id=contact_id,
                custom_fields={}
            ))
            await db.commit()
            print("Seeded Websense Tracker & Events")

        # 9. Support Webforms
        wf_res = await db.execute(select(SupportWebform).where(SupportWebform.tenant_id == tenant_id))
        if not wf_res.scalars().first():
            wf = SupportWebform(
                tenant_id=tenant_id,
                ref="WBF-2026-00001",
                name="Enterprise Incident Reporting Form",
                slug="enterprise-incident",
                title="Submit Enterprise Support Incident",
                description="24/7 dedicated intake form for critical production anomalies.",
                fields_config=[
                    {"name": "full_name", "label": "Contact Name", "type": "text", "required": True},
                    {"name": "email", "label": "Work Email", "type": "email", "required": True},
                    {"name": "subject", "label": "Brief Incident Summary", "type": "text", "required": True},
                    {"name": "description", "label": "Detailed Reproduction Steps", "type": "textarea", "required": True},
                ],
                category="Cloud Infrastructure",
                priority="High",
                is_active=True,
                custom_fields={}
            )
            db.add(wf)
            await db.commit()
            print("Seeded Support Webform")

        # 10. Appointment Types & Appointments
        at_res = await db.execute(select(AppointmentType).where(AppointmentType.tenant_id == tenant_id))
        atype = at_res.scalars().first()
        if not atype:
            atype = AppointmentType(
                tenant_id=tenant_id,
                ref="ATY-2026-00001",
                name="Technical Architecture & SLA Consultation",
                slug="tech-review",
                description="45-minute technical review with senior solutions engineering.",
                duration_minutes=45,
                buffer_minutes=15,
                assigned_user_name="Senior Solutions Architect",
                is_active=True,
                custom_fields={}
            )
            db.add(atype)
            await db.commit()
            await db.refresh(atype)

            db.add(CustomerAppointment(
                tenant_id=tenant_id,
                ref="APT-2026-00001",
                appointment_type_id=atype.id,
                contact_id=contact_id,
                account_id=account_id,
                assigned_user_name="Senior Solutions Architect",
                start_time=now + timedelta(days=2, hours=3),
                end_time=now + timedelta(days=2, hours=3, minutes=45),
                status="Scheduled",
                customer_name="Elena Rostova",
                customer_email="elena.rostova@novatech.example",
                notes="Review multi-region disaster recovery failover architecture.",
                custom_fields={}
            ))
            await db.commit()
            print("Seeded Appointment Type & Customer Appointment")

    await engine.dispose()

    # Mirror to backend/syvoris_dev.db
    backend_db = os.path.join(backend_dir, "syvoris_dev.db")
    shutil.copy2(ROOT_DB, backend_db)
    print(f"Synchronized database copy to {backend_db}")

if __name__ == "__main__":
    asyncio.run(seed())
