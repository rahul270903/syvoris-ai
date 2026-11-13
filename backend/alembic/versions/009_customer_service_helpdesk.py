"""009_customer_service_helpdesk

Revision ID: 009_customer_service_helpdesk
Revises: 008_marketing_and_cx
Create Date: 2026-11-14 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '009_customer_service_helpdesk'
down_revision: Union[str, None] = '008_marketing_and_cx'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Business Hours table
    op.create_table(
        'business_hours',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('timezone', sa.String(length=100), server_default='UTC', nullable=False),
        sa.Column('schedule_config', sa.JSON(), nullable=False),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_business_hours_tenant_id'), 'business_hours', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_business_hours_ref'), 'business_hours', ['ref'], unique=False)
    op.create_index(op.f('ix_business_hours_name'), 'business_hours', ['name'], unique=False)

    # 2. Business Holidays table
    op.create_table(
        'business_holidays',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('business_hours_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('holiday_date', sa.Date(), nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_hours_id'], ['business_hours.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_business_holidays_tenant_id'), 'business_holidays', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_business_holidays_business_hours_id'), 'business_holidays', ['business_hours_id'], unique=False)

    # 3. Support Queues table
    op.create_table(
        'support_queues',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(length=32), server_default='Normal', nullable=False),
        sa.Column('default_channel', sa.String(length=50), server_default='Email', nullable=False),
        sa.Column('max_capacity', sa.Integer(), server_default='50', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_support_queues_tenant_id'), 'support_queues', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_support_queues_ref'), 'support_queues', ['ref'], unique=False)
    op.create_index(op.f('ix_support_queues_name'), 'support_queues', ['name'], unique=False)
    op.create_index(op.f('ix_support_queues_code'), 'support_queues', ['code'], unique=False)

    # 4. Support Mailboxes table
    op.create_table(
        'support_mailboxes',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('routing_rule', sa.String(length=100), server_default='Round-Robin', nullable=False),
        sa.Column('default_priority', sa.String(length=32), server_default='Normal', nullable=False),
        sa.Column('default_category', sa.String(length=100), server_default='Technical Support', nullable=False),
        sa.Column('default_queue_id', sa.Uuid(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['default_queue_id'], ['support_queues.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_support_mailboxes_tenant_id'), 'support_mailboxes', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_support_mailboxes_ref'), 'support_mailboxes', ['ref'], unique=False)
    op.create_index(op.f('ix_support_mailboxes_email'), 'support_mailboxes', ['email'], unique=False)

    # 5. Mailroom Messages table
    op.create_table(
        'mailroom_messages',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('mailbox_id', sa.Uuid(), nullable=True),
        sa.Column('case_id', sa.Uuid(), nullable=True),
        sa.Column('message_id', sa.String(length=255), nullable=False),
        sa.Column('sender_email', sa.String(length=255), nullable=False),
        sa.Column('sender_name', sa.String(length=255), nullable=True),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('body_text', sa.Text(), nullable=True),
        sa.Column('body_html', sa.Text(), nullable=True),
        sa.Column('thread_token', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Processed', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['mailbox_id'], ['support_mailboxes.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mailroom_messages_tenant_id'), 'mailroom_messages', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_mailroom_messages_message_id'), 'mailroom_messages', ['message_id'], unique=False)
    op.create_index(op.f('ix_mailroom_messages_thread_token'), 'mailroom_messages', ['thread_token'], unique=False)
    op.create_index(op.f('ix_mailroom_messages_case_id'), 'mailroom_messages', ['case_id'], unique=False)

    # 6. Chat Sessions table
    op.create_table(
        'chat_sessions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('account_id', sa.Uuid(), nullable=True),
        sa.Column('assigned_user_id', sa.Uuid(), nullable=True),
        sa.Column('assigned_user_name', sa.String(length=255), nullable=True),
        sa.Column('visitor_name', sa.String(length=255), nullable=False),
        sa.Column('visitor_email', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
        sa.Column('channel', sa.String(length=50), server_default='Website', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('converted_case_id', sa.Uuid(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['assigned_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['converted_case_id'], ['cases.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_sessions_tenant_id'), 'chat_sessions', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_chat_sessions_ref'), 'chat_sessions', ['ref'], unique=False)
    op.create_index(op.f('ix_chat_sessions_status'), 'chat_sessions', ['status'], unique=False)

    # 7. Chat Messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('session_id', sa.Uuid(), nullable=False),
        sa.Column('sender_type', sa.String(length=32), server_default='visitor', nullable=False),
        sa.Column('sender_name', sa.String(length=255), nullable=False),
        sa.Column('message_text', sa.Text(), nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_tenant_id'), 'chat_messages', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_chat_messages_session_id'), 'chat_messages', ['session_id'], unique=False)

    # 8. Websense Trackers table
    op.create_table(
        'websense_trackers',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('domain', sa.String(length=255), nullable=False),
        sa.Column('url_pattern', sa.String(length=255), server_default='/*', nullable=False),
        sa.Column('dwell_threshold_seconds', sa.Integer(), server_default='45', nullable=False),
        sa.Column('action', sa.String(length=100), server_default='Trigger Live Chat Prompt', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_websense_trackers_tenant_id'), 'websense_trackers', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_websense_trackers_ref'), 'websense_trackers', ['ref'], unique=False)
    op.create_index(op.f('ix_websense_trackers_name'), 'websense_trackers', ['name'], unique=False)

    # 9. Tracker Events table
    op.create_table(
        'tracker_events',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('tracker_id', sa.Uuid(), nullable=True),
        sa.Column('session_id', sa.String(length=100), nullable=False),
        sa.Column('visitor_ip', sa.String(length=64), nullable=True),
        sa.Column('page_url', sa.String(length=512), nullable=False),
        sa.Column('dwell_seconds', sa.Integer(), server_default='0', nullable=False),
        sa.Column('action_taken', sa.String(length=100), nullable=True),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('case_id', sa.Uuid(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tracker_id'], ['websense_trackers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tracker_events_tenant_id'), 'tracker_events', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_tracker_events_tracker_id'), 'tracker_events', ['tracker_id'], unique=False)
    op.create_index(op.f('ix_tracker_events_session_id'), 'tracker_events', ['session_id'], unique=False)

    # 10. Support Webforms table
    op.create_table(
        'support_webforms',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('fields_config', sa.JSON(), nullable=False),
        sa.Column('category', sa.String(length=100), server_default='Customer Support', nullable=False),
        sa.Column('priority', sa.String(length=32), server_default='Normal', nullable=False),
        sa.Column('target_queue_id', sa.Uuid(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['target_queue_id'], ['support_queues.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_support_webforms_tenant_id'), 'support_webforms', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_support_webforms_ref'), 'support_webforms', ['ref'], unique=False)
    op.create_index(op.f('ix_support_webforms_slug'), 'support_webforms', ['slug'], unique=False)

    # 11. Webform Submissions table
    op.create_table(
        'webform_submissions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('webform_id', sa.Uuid(), nullable=False),
        sa.Column('case_id', sa.Uuid(), nullable=True),
        sa.Column('submission_data', sa.JSON(), nullable=False),
        sa.Column('honeypot_triggered', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('ip_address', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Accepted', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['webform_id'], ['support_webforms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_webform_submissions_tenant_id'), 'webform_submissions', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_webform_submissions_webform_id'), 'webform_submissions', ['webform_id'], unique=False)

    # 12. Appointment Types table
    op.create_table(
        'appointment_types',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), server_default='30', nullable=False),
        sa.Column('buffer_minutes', sa.Integer(), server_default='15', nullable=False),
        sa.Column('assigned_user_id', sa.Uuid(), nullable=True),
        sa.Column('assigned_user_name', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assigned_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_appointment_types_tenant_id'), 'appointment_types', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_appointment_types_ref'), 'appointment_types', ['ref'], unique=False)
    op.create_index(op.f('ix_appointment_types_slug'), 'appointment_types', ['slug'], unique=False)

    # 13. Customer Appointments table
    op.create_table(
        'customer_appointments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('appointment_type_id', sa.Uuid(), nullable=False),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('account_id', sa.Uuid(), nullable=True),
        sa.Column('assigned_user_id', sa.Uuid(), nullable=True),
        sa.Column('assigned_user_name', sa.String(length=255), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Scheduled', nullable=False),
        sa.Column('customer_name', sa.String(length=255), nullable=False),
        sa.Column('customer_email', sa.String(length=255), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['appointment_type_id'], ['appointment_types.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customer_appointments_tenant_id'), 'customer_appointments', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_customer_appointments_ref'), 'customer_appointments', ['ref'], unique=False)
    op.create_index(op.f('ix_customer_appointments_start_time'), 'customer_appointments', ['start_time'], unique=False)

    # 14. Enable and force RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        tables = [
            'business_hours', 'business_holidays', 'support_queues',
            'support_mailboxes', 'mailroom_messages', 'chat_sessions',
            'chat_messages', 'websense_trackers', 'tracker_events',
            'support_webforms', 'webform_submissions', 'appointment_types',
            'customer_appointments'
        ]
        for table in tables:
            op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
            op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
            op.execute(f"""
                CREATE POLICY {table}_tenant_isolation ON {table}
                AS RESTRICTIVE
                USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
            """)

def downgrade() -> None:
    tables = [
        'customer_appointments', 'appointment_types', 'webform_submissions',
        'support_webforms', 'tracker_events', 'websense_trackers',
        'chat_messages', 'chat_sessions', 'mailroom_messages',
        'support_mailboxes', 'support_queues', 'business_holidays',
        'business_hours'
    ]
    for table in tables:
        op.drop_table(table)
