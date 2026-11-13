"""008_marketing_and_customer_experience

Revision ID: 008_marketing_and_cx
Revises: 007_sales_and_revenue_cpq
Create Date: 2026-11-13 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '008_marketing_and_cx'
down_revision: Union[str, None] = '007_sales_and_revenue_cpq'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Campaigns table
    op.create_table(
        'campaigns',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=50), server_default='Email', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Planning', nullable=False),
        sa.Column('channel', sa.String(length=50), server_default='Email', nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('target_audience', sa.String(length=255), nullable=True),
        sa.Column('objective', sa.Text(), nullable=True),
        sa.Column('budget', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('actual_cost', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('expected_revenue', sa.Numeric(precision=15, scale=2), server_default='0.00', nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_campaigns_tenant_id'), 'campaigns', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_campaigns_ref'), 'campaigns', ['ref'], unique=False)
    op.create_index(op.f('ix_campaigns_name'), 'campaigns', ['name'], unique=False)
    op.create_index(op.f('ix_campaigns_status'), 'campaigns', ['status'], unique=False)
    op.create_index(op.f('ix_campaigns_type'), 'campaigns', ['type'], unique=False)

    # 2. Audience Segments table
    op.create_table(
        'audience_segments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('segment_type', sa.String(length=50), server_default='Dynamic', nullable=False),
        sa.Column('target_entity', sa.String(length=50), server_default='contacts', nullable=False),
        sa.Column('filter_criteria', sa.JSON(), nullable=False),
        sa.Column('member_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audience_segments_tenant_id'), 'audience_segments', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_audience_segments_ref'), 'audience_segments', ['ref'], unique=False)
    op.create_index(op.f('ix_audience_segments_name'), 'audience_segments', ['name'], unique=False)

    # 3. Campaign Members table
    op.create_table(
        'campaign_members',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('campaign_id', sa.Uuid(), nullable=False),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('lead_id', sa.Uuid(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Added', nullable=False),
        sa.Column('engagement_score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('unsubscribed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_campaign_members_tenant_id'), 'campaign_members', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_campaign_members_campaign_id'), 'campaign_members', ['campaign_id'], unique=False)
    op.create_index(op.f('ix_campaign_members_contact_id'), 'campaign_members', ['contact_id'], unique=False)
    op.create_index(op.f('ix_campaign_members_lead_id'), 'campaign_members', ['lead_id'], unique=False)

    # 4. Email Templates table
    op.create_table(
        'email_templates',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=50), server_default='Promotional', nullable=False),
        sa.Column('body_html', sa.Text(), nullable=False),
        sa.Column('body_text', sa.Text(), nullable=True),
        sa.Column('merge_tags', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('owner_name', sa.String(length=255), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_templates_tenant_id'), 'email_templates', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_email_templates_ref'), 'email_templates', ['ref'], unique=False)
    op.create_index(op.f('ix_email_templates_name'), 'email_templates', ['name'], unique=False)

    # 5. Marketing Workflows table
    op.create_table(
        'marketing_workflows',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('trigger_type', sa.String(length=50), server_default='lead.created', nullable=False),
        sa.Column('trigger_config', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
        sa.Column('steps', sa.JSON(), nullable=False),
        sa.Column('execution_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_marketing_workflows_tenant_id'), 'marketing_workflows', ['tenant_id'], unique=False)

    # 6. SLA Policies table
    op.create_table(
        'sla_policies',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(length=32), server_default='Normal', nullable=False),
        sa.Column('first_response_hours', sa.Integer(), server_default='4', nullable=False),
        sa.Column('resolution_hours', sa.Integer(), server_default='24', nullable=False),
        sa.Column('business_hours_only', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sla_policies_tenant_id'), 'sla_policies', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_sla_policies_priority'), 'sla_policies', ['priority'], unique=False)

    # 7. Cases table
    op.create_table(
        'cases',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('account_id', sa.Uuid(), nullable=True),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='New', nullable=False),
        sa.Column('priority', sa.String(length=32), server_default='Normal', nullable=False),
        sa.Column('category', sa.String(length=100), server_default='Technical Support', nullable=False),
        sa.Column('channel', sa.String(length=50), server_default='Email', nullable=False),
        sa.Column('sentiment', sa.String(length=32), server_default='Neutral', nullable=False),
        sa.Column('assigned_user_id', sa.Uuid(), nullable=True),
        sa.Column('assigned_user_name', sa.String(length=255), nullable=True),
        sa.Column('assigned_queue', sa.String(length=100), server_default='Tier-1 Support', nullable=True),
        sa.Column('sla_policy_id', sa.Uuid(), nullable=True),
        sa.Column('sla_response_deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sla_resolution_deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sla_paused_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sla_breached', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('resolution_summary', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('csat_score', sa.Integer(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['assigned_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['sla_policy_id'], ['sla_policies.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cases_tenant_id'), 'cases', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_cases_ref'), 'cases', ['ref'], unique=False)
    op.create_index(op.f('ix_cases_subject'), 'cases', ['subject'], unique=False)
    op.create_index(op.f('ix_cases_status'), 'cases', ['status'], unique=False)
    op.create_index(op.f('ix_cases_priority'), 'cases', ['priority'], unique=False)
    op.create_index(op.f('ix_cases_category'), 'cases', ['category'], unique=False)
    op.create_index(op.f('ix_cases_account_id'), 'cases', ['account_id'], unique=False)
    op.create_index(op.f('ix_cases_contact_id'), 'cases', ['contact_id'], unique=False)

    # 8. Case Comments table
    op.create_table(
        'case_comments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('case_id', sa.Uuid(), nullable=False),
        sa.Column('author_id', sa.Uuid(), nullable=True),
        sa.Column('author_name', sa.String(length=255), nullable=True),
        sa.Column('is_internal', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('channel', sa.String(length=50), server_default='Portal', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_case_comments_tenant_id'), 'case_comments', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_case_comments_case_id'), 'case_comments', ['case_id'], unique=False)

    # 9. Knowledge Articles table
    op.create_table(
        'knowledge_articles',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), server_default='Troubleshooting', nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('visibility', sa.String(length=50), server_default='Customer-facing', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Published', nullable=False),
        sa.Column('view_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('helpful_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('author_id', sa.Uuid(), nullable=True),
        sa.Column('author_name', sa.String(length=255), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_knowledge_articles_tenant_id'), 'knowledge_articles', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_knowledge_articles_ref'), 'knowledge_articles', ['ref'], unique=False)
    op.create_index(op.f('ix_knowledge_articles_category'), 'knowledge_articles', ['category'], unique=False)

    # 10. Customer Surveys table
    op.create_table(
        'customer_surveys',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('ref', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('survey_type', sa.String(length=50), server_default='CSAT', nullable=False),
        sa.Column('trigger_event', sa.String(length=50), server_default='case.resolved', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customer_surveys_tenant_id'), 'customer_surveys', ['tenant_id'], unique=False)

    # 11. Survey Responses table
    op.create_table(
        'survey_responses',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('survey_id', sa.Uuid(), nullable=True),
        sa.Column('case_id', sa.Uuid(), nullable=True),
        sa.Column('account_id', sa.Uuid(), nullable=True),
        sa.Column('contact_id', sa.Uuid(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('sentiment', sa.String(length=32), server_default='Neutral', nullable=False),
        sa.Column('feedback_text', sa.Text(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['survey_id'], ['customer_surveys.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_survey_responses_tenant_id'), 'survey_responses', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_survey_responses_case_id'), 'survey_responses', ['case_id'], unique=False)

    # 12. Enable and force RLS for PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        tables = [
            'campaigns', 'audience_segments', 'campaign_members',
            'email_templates', 'marketing_workflows',
            'sla_policies', 'cases', 'case_comments',
            'knowledge_articles', 'customer_surveys', 'survey_responses'
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
        'survey_responses', 'customer_surveys', 'knowledge_articles',
        'case_comments', 'cases', 'sla_policies',
        'marketing_workflows', 'email_templates', 'campaign_members',
        'audience_segments', 'campaigns'
    ]
    for table in tables:
        op.drop_table(table)
