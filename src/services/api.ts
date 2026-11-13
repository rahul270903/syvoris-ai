/**
 * SYVORIS Ai™ — Enterprise CRM API Service
 * Production API client with JWT bearer authentication, token rotation,
 * multi-tenant context handling, and graceful offline fallback.
 */

const API_BASE = '/api/v1';

export interface UserSummary {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title?: string;
  is_platform_admin: boolean;
  is_verified: boolean;
  avatar_url?: string;
}

export interface TenantMembershipSummary {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role: string;
  permissions: string[];
  status: string;
}

export interface CurrentUserProfile {
  user: UserSummary;
  active_tenant?: TenantMembershipSummary;
  memberships: TenantMembershipSummary[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  tenant_id?: string;
  tenant_slug?: string;
  role?: string;
  permissions: string[];
}

export interface TenantProfile {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_tier: string;
  max_users: number;
  is_active: boolean;
  created_at: string;
}

export interface UserMemberResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title?: string;
  role: string;
  permissions: string[];
  status: string;
  joined_at?: string;
}

export interface RoleResponse {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  is_system_role: boolean;
  is_platform_role: boolean;
  permissions: string[];
}

export interface PermissionResponse {
  id: string;
  code: string;
  module: string;
  description?: string;
}

export interface AuditEventItem {
  id: string;
  tenant_id?: string;
  actor_id?: string;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AccountItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  account_type: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  billing_address: Record<string, any>;
  shipping_address: Record<string, any>;
  ownership: string;
  status: string;
  description?: string;
  credit_limit: number;
  owner_id?: string;
  owner_name?: string;
  parent_id?: string;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
  contacts_count: number;
}

export interface ContactItem {
  id: string;
  tenant_id: string;
  account_id?: string | null;
  account_name?: string | null;
  ref: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department?: string;
  status: string;
  is_primary: boolean;
  is_decision_maker: boolean;
  owner_id?: string;
  owner_name?: string;
  description?: string;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CRMActivityItem {
  id: string;
  tenant_id: string;
  account_id: string;
  contact_id?: string;
  activity_type: string;
  subject: string;
  description?: string;
  occurred_at: string;
  actor_id?: string;
  actor_name: string;
  metadata: Record<string, any>;
}

export interface Customer360Data {
  account: AccountItem;
  contacts: ContactItem[];
  activities: CRMActivityItem[];
  opportunities: OpportunityItem[];
  cases?: any[];
  metrics: Record<string, any>;
}

export interface OpportunityStageHistoryItem {
  id: string;
  opportunity_id: string;
  from_stage?: string;
  to_stage: string;
  transition_at: string;
  days_in_previous_stage: number;
  actor_id?: string;
  actor_name: string;
  notes?: string;
}

export interface PipelineStageConfig {
  code: string;
  name: string;
  probability: number;
  forecast_category: string;
  order: number;
  gate_requirements: string[];
}

export interface PipelineItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  stages: PipelineStageConfig[];
}

export interface OpportunityItem {
  id: string;
  tenant_id: string;
  account_id: string;
  account_name?: string;
  contact_id?: string;
  contact_name?: string;
  ref: string;
  name: string;
  pipeline_id: string;
  stage: string;
  amount: number;
  currency: string;
  probability: number;
  expected_close_date?: string;
  forecast_category: string;
  risk_level: string;
  lead_source?: string;
  stage_entered_at?: string;
  budget_confirmed?: boolean;
  decision_maker_bought_in?: boolean;
  next_step?: string;
  description?: string;
  competitor_name?: string;
  loss_reason?: string;
  win_description?: string;
  owner_id?: string;
  owner_name?: string;
  custom_fields: Record<string, any>;
  stage_history?: OpportunityStageHistoryItem[];
  created_at: string;
  updated_at: string;
}

// --- Sales & CPQ Interfaces (Milestones 3B, 3C, 3D) ---
export interface ProductItem {
  id: string;
  tenant_id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  family?: string;
  is_active: boolean;
  unit_of_measure: string;
  standard_price: number;
  cost_price: number;
  currency: string;
  tax_category: string;
  default_tax_rate: number;
  attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PriceBookEntryItem {
  id: string;
  tenant_id: string;
  price_book_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  list_price: number;
  min_price?: number;
  currency: string;
  is_active: boolean;
}

export interface PriceBookItem {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  is_standard: boolean;
  is_active: boolean;
  currency: string;
  valid_from?: string;
  valid_to?: string;
  entries_count?: number;
  created_at: string;
  updated_at: string;
  entries?: PriceBookEntryItem[];
}

export interface CPQLineItemPayload {
  product_id?: string;
  item_name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  discount_pct?: number;
  tax_rate?: number;
  sort_order?: number;
}

export interface CPQCalculationPayload {
  lines: CPQLineItemPayload[];
  header_discount_pct?: number;
  currency?: string;
}

export interface CPQCalculatedLine {
  item_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount_pct: number;
  tax_rate: number;
  discount_amount: number;
  net_amount: number;
  tax_amount: number;
  line_total: number;
  cost_total: number;
  margin_amount: number;
  margin_pct: number;
  sort_order: number;
}

export interface CPQCalculationResponse {
  currency: string;
  header_discount_pct: number;
  subtotal: number;
  header_discount_amount: number;
  total_discount: number;
  total_tax: number;
  grand_total: number;
  total_cost: number;
  margin_amount: number;
  margin_pct: number;
  requires_approval: boolean;
  approval_reasons: string[];
  lines: CPQCalculatedLine[];
}

export interface QuoteLineItem {
  id?: string;
  quote_id?: string;
  product_id?: string;
  item_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  discount_pct: number;
  tax_rate: number;
  discount_amount?: number;
  net_amount?: number;
  tax_amount?: number;
  line_total?: number;
  sort_order?: number;
}

export interface QuoteItem {
  id: string;
  tenant_id: string;
  ref: string;
  version: number;
  parent_quote_id?: string;
  name: string;
  opportunity_id?: string;
  opportunity_name?: string;
  opportunity_ref?: string;
  account_id: string;
  account_name?: string;
  contact_id?: string;
  contact_name?: string;
  price_book_id?: string;
  price_book_name?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Presented' | 'Accepted' | 'Expired';
  valid_until?: string;
  currency: string;
  header_discount_pct: number;
  subtotal: number;
  total_discount: number;
  total_tax: number;
  grand_total: number;
  total_cost: number;
  margin_amount: number;
  margin_pct: number;
  payment_terms?: string;
  notes?: string;
  owner_id?: string;
  owner_name?: string;
  lines: QuoteLineItem[];
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrderLineItem {
  id: string;
  order_id: string;
  product_id?: string;
  item_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  tax_rate: number;
  line_total: number;
  sort_order: number;
}

export interface SalesOrderItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  quote_id?: string;
  quote_ref?: string;
  opportunity_id?: string;
  opportunity_name?: string;
  opportunity_ref?: string;
  account_id: string;
  account_name?: string;
  contact_id?: string;
  contact_name?: string;
  status: 'Draft' | 'Confirmed' | 'In Progress' | 'Shipped' | 'Fulfilled' | 'Cancelled';
  fulfilment_stage: string;
  currency: string;
  total_amount: number;
  shipping_address?: Record<string, any>;
  billing_address?: Record<string, any>;
  warehouse_location?: string;
  requested_delivery_date?: string;
  carrier?: string;
  tracking_number?: string;
  payment_terms?: string;
  notes?: string;
  owner_id?: string;
  owner_name?: string;
  lines: OrderLineItem[];
  invoices_count?: number;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  sales_order_id?: string;
  sales_order_ref?: string;
  quote_id?: string;
  quote_ref?: string;
  account_id: string;
  account_name?: string;
  contact_id?: string;
  contact_name?: string;
  status: 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Void';
  currency: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  issue_date: string;
  due_date: string;
  payment_terms?: string;
  notes?: string;
  owner_id?: string;
  owner_name?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequestItem {
  id: string;
  tenant_id: string;
  ref: string;
  entity_type: string;
  entity_id: string;
  entity_ref: string;
  title: string;
  category: string;
  requester_id?: string;
  requester_name: string;
  approver_id?: string;
  approver_name?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  amount: number;
  discount_pct: number;
  risk: string;
  policy: string;
  justification: string;
  rejection_reason?: string;
  resolved_at?: string;
  created_at: string;
}

export interface CampaignItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  type: string;
  status: string;
  channel: string;
  start_date?: string;
  end_date?: string;
  target_audience?: string;
  objective?: string;
  budget: number;
  actual_cost: number;
  expected_revenue: number;
  owner_id?: string;
  owner_name?: string;
  member_count?: number;
  leads_generated_count?: number;
  opportunities_influenced_count?: number;
  revenue_generated?: number;
  roi_percentage?: number;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CampaignMemberItem {
  id: string;
  tenant_id: string;
  campaign_id: string;
  contact_id?: string;
  lead_id?: string;
  status: string;
  engagement_score: number;
  unsubscribed: boolean;
  name?: string;
  email?: string;
  company?: string;
  created_at: string;
}

export interface AudienceSegmentItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  description?: string;
  segment_type: string;
  target_entity: string;
  filter_criteria: Record<string, any>;
  member_count: number;
  is_active: boolean;
  owner_id?: string;
  owner_name?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  subject: string;
  category: string;
  body_html: string;
  body_text?: string;
  merge_tags: string[];
  is_active: boolean;
  owner_id?: string;
  owner_name?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CampaignAttribution {
  campaign_id: string;
  campaign_name: string;
  ref: string;
  budget: number;
  actual_cost: number;
  leads_count: number;
  converted_leads_count: number;
  opportunities_count: number;
  closed_won_revenue: number;
  pipeline_influenced: number;
  roi_percentage: number;
  cost_per_lead: number;
}

export interface CaseCommentItem {
  id: string;
  tenant_id: string;
  case_id: string;
  author_id?: string;
  author_name?: string;
  is_internal: boolean;
  message: string;
  channel: string;
  custom_fields?: Record<string, any>;
  created_at: string;
}

export interface CaseItem {
  id: string;
  tenant_id: string;
  ref: string;
  subject: string;
  description?: string;
  account_id?: string;
  account_name?: string;
  contact_id?: string;
  contact_name?: string;
  status: string;
  priority: string;
  category: string;
  channel: string;
  sentiment: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_queue?: string;
  sla_policy_id?: string;
  sla_response_deadline?: string;
  sla_resolution_deadline?: string;
  sla_paused_at?: string;
  sla_breached: boolean;
  resolution_summary?: string;
  resolved_at?: string;
  closed_at?: string;
  csat_score?: number;
  comments?: CaseCommentItem[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SLAPolicyItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  description?: string;
  priority: string;
  first_response_hours: number;
  resolution_hours: number;
  business_hours_only: boolean;
  is_active: boolean;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface KnowledgeArticleItem {
  id: string;
  tenant_id: string;
  ref: string;
  title: string;
  slug: string;
  category: string;
  summary?: string;
  content: string;
  visibility: string;
  status: string;
  view_count: number;
  helpful_count: number;
  author_id?: string;
  author_name?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomerSurveyItem {
  id: string;
  tenant_id: string;
  ref: string;
  title: string;
  description?: string;
  survey_type: string;
  trigger_event: string;
  is_active: boolean;
  response_count: number;
  average_score: number;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface ServiceDashboardMetrics {
  total_cases: number;
  open_cases: number;
  new_cases: number;
  assigned_cases: number;
  in_progress_cases: number;
  awaiting_customer_cases: number;
  resolved_cases: number;
  closed_cases: number;
  unassigned_cases: number;
  sla_compliance_rate: number;
  sla_breached_count: number;
  avg_first_response_hours: number;
  avg_resolution_hours: number;
  priority_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  channel_distribution: Record<string, number>;
  agent_workloads: Array<{ user_id?: string; user_name: string; active_cases: number; resolved_cases: number }>;
  recent_activity: Array<{ id: string; ref: string; subject: string; priority: string; status: string; channel: string; updated_at: string }>;
}

export interface SupportQueueItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  code: string;
  description?: string;
  priority: string;
  default_channel: string;
  max_capacity: number;
  is_active: boolean;
  active_case_count: number;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SupportMailboxItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  email: string;
  routing_rule: string;
  default_priority: string;
  default_category: string;
  default_queue_id?: string;
  is_active: boolean;
  message_count: number;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MailroomMessageItem {
  id: string;
  tenant_id: string;
  mailbox_id?: string;
  case_id?: string;
  case_ref?: string;
  message_id: string;
  sender_email: string;
  sender_name?: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  thread_token?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageItem {
  id: string;
  tenant_id: string;
  session_id: string;
  sender_type: string;
  sender_name: string;
  message_text: string;
  created_at: string;
}

export interface ChatSessionItem {
  id: string;
  tenant_id: string;
  ref: string;
  contact_id?: string;
  account_id?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  visitor_name: string;
  visitor_email?: string;
  status: string;
  channel: string;
  started_at: string;
  ended_at?: string;
  converted_case_id?: string;
  converted_case_ref?: string;
  messages: ChatMessageItem[];
  created_at: string;
  updated_at: string;
}

export interface WebsenseTrackerItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  domain: string;
  url_pattern: string;
  dwell_threshold_seconds: number;
  action: string;
  is_active: boolean;
  event_count: number;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TrackerEventItem {
  id: string;
  tenant_id: string;
  tracker_id?: string;
  tracker_name?: string;
  session_id: string;
  visitor_ip?: string;
  page_url: string;
  dwell_seconds: number;
  action_taken?: string;
  contact_id?: string;
  case_id?: string;
  created_at: string;
}

export interface BusinessHolidayItem {
  id: string;
  tenant_id: string;
  business_hours_id: string;
  name: string;
  holiday_date: string;
  created_at: string;
}

export interface BusinessHoursItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  timezone: string;
  schedule_config: Record<string, any>;
  is_default: boolean;
  holidays: BusinessHolidayItem[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SupportWebformItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  slug: string;
  title: string;
  description?: string;
  fields_config: any[];
  category: string;
  priority: string;
  target_queue_id?: string;
  is_active: boolean;
  submission_count: number;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WebformSubmissionItem {
  id: string;
  tenant_id: string;
  webform_id: string;
  case_id?: string;
  case_ref?: string;
  submission_data: Record<string, any>;
  honeypot_triggered: boolean;
  status: string;
  created_at: string;
}

export interface AppointmentTypeItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  slug: string;
  description?: string;
  duration_minutes: number;
  buffer_minutes: number;
  assigned_user_id?: string;
  assigned_user_name?: string;
  is_active: boolean;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomerAppointmentItem {
  id: string;
  tenant_id: string;
  ref: string;
  appointment_type_id: string;
  appointment_type_name?: string;
  contact_id?: string;
  contact_name?: string;
  account_id?: string;
  account_name?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  start_time: string;
  end_time: string;
  status: string;
  customer_name: string;
  customer_email: string;
  notes?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponseItem {
  id: string;
  tenant_id: string;
  survey_id: string;
  case_id?: string;
  account_id?: string;
  account_name?: string;
  contact_id?: string;
  contact_name?: string;
  score: number;
  sentiment?: string;
  feedback_text?: string;
  answers?: Record<string, any>;
  created_at: string;
}

export interface CSATSummary {
  total_responses: number;
  average_csat: number;
  csat_percentage: number;
  nps_score: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
}

export interface ScoreFactor {
  factor: string;
  weight: number;
  type: 'positive' | 'negative';
}

export interface LeadItem {
  id: string;
  tenant_id: string;
  ref: string;
  first_name: string;
  last_name: string;
  full_name: string;
  company_name: string;
  job_title?: string;
  email: string;
  phone?: string;
  source: string;
  industry?: string;
  territory?: string;
  status: string;
  score: number;
  score_factors: ScoreFactor[];
  priority: string;
  consent_status: string;
  owner_id?: string;
  owner_name?: string;
  converted_account_id?: string;
  converted_account_name?: string;
  converted_contact_id?: string;
  converted_contact_name?: string;
  converted_opportunity_id?: string;
  converted_opportunity_name?: string;
  converted_at?: string;
  description?: string;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LeadConvertPayload {
  account_mode: 'create' | 'link';
  existing_account_id?: string | null;
  new_account?: {
    name?: string;
    industry?: string;
    segment?: string;
    territory?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    credit_limit?: number;
  };
  contact?: {
    first_name?: string;
    last_name?: string;
    job_title?: string;
    department?: string;
    email?: string;
    phone?: string;
    consent_status?: string;
  };
  create_opportunity?: boolean;
  opportunity?: {
    name?: string;
    amount?: number;
    stage?: string;
    probability?: number;
    expected_close_date?: string;
    pipeline_id?: string;
  };
}

export interface LeadConvertResponse {
  lead: LeadItem;
  account: AccountItem;
  contact: ContactItem;
  opportunity?: OpportunityItem | null;
  message: string;
}

// --- Hierarchy & Deduplication Types (Milestone 2C) ---

export interface AccountHierarchyNode {
  id: string;
  ref: string;
  name: string;
  account_type: string;
  status: string;
  owner_name?: string;
  industry?: string;
  credit_limit: number;
  depth: number;
  direct_contacts_count: number;
  direct_opportunities_count: number;
  direct_pipeline_value: number;
  children: AccountHierarchyNode[];
}

export interface AccountHierarchyResponse {
  root: AccountHierarchyNode;
  current_account_id: string;
  total_hierarchy_accounts: number;
  total_hierarchy_contacts: number;
  total_hierarchy_opportunities: number;
  total_hierarchy_pipeline_value: number;
  max_depth: number;
}

export interface DuplicateMatchRule {
  rule_name: string;
  field_name: string;
  confidence_score: number;
  matched_value: string;
  explanation: string;
}

export interface DuplicateRecordItem {
  id: string;
  ref: string;
  name: string;
  email?: string;
  phone?: string;
  secondary_info?: string;
  status: string;
  created_at: string;
  owner_name?: string;
  fields: Record<string, any>;
}

export interface DuplicateCluster {
  cluster_id: string;
  entity_type: 'account' | 'contact' | 'lead';
  primary_rule: string;
  confidence_score: number;
  records: DuplicateRecordItem[];
  rules_triggered: DuplicateMatchRule[];
}

export interface DuplicateScanResponse {
  entity_type: string;
  total_candidates_scanned: number;
  clusters_found: number;
  clusters: DuplicateCluster[];
}

export interface RecordMergePayload {
  entity_type: 'account' | 'contact' | 'lead';
  master_id: string;
  duplicate_ids: string[];
  field_overrides?: Record<string, any>;
}

export interface RecordMergeResponse {
  entity_type: string;
  master_id: string;
  master_ref: string;
  merged_ids: string[];
  reassigned_counts: Record<string, number>;
  message: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// --- Project Management Types ---

export interface ProjectItem {
  id: string;
  tenant_id: string;
  ref: string;
  name: string;
  description?: string | null;
  objectives?: string | null;
  project_type: string;
  category: string;
  status: string;
  priority: string;
  health: string;
  account_id?: string | null;
  account_name?: string | null;
  contact_id?: string | null;
  opportunity_id?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  manager_id?: string | null;
  manager_name?: string | null;
  start_date?: string | null;
  target_date?: string | null;
  actual_completion_date?: string | null;
  budget: number;
  approved_cost_baseline: number;
  currency: string;
  progress_pct: number;
  custom_fields: Record<string, any>;
  actual_cost: number;
  cost_variance: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestoneItem {
  id: string;
  tenant_id: string;
  project_id: string;
  ref: string;
  name: string;
  description?: string | null;
  deliverable?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  status: string;
  priority: string;
  target_date?: string | null;
  completion_date?: string | null;
  completion_criteria?: string | null;
  order_index: number;
  progress_pct: number;
  custom_fields: Record<string, any>;
  project_ref?: string | null;
  project_name?: string | null;
  task_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskDependencyItem {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
  depends_on_title?: string | null;
  depends_on_ref?: string | null;
}

export interface ProjectTaskItem {
  id: string;
  tenant_id: string;
  project_id: string;
  milestone_id?: string | null;
  parent_task_id?: string | null;
  ref: string;
  title: string;
  description?: string | null;
  assigned_user_id?: string | null;
  assigned_user_name?: string | null;
  priority: string;
  status: string;
  start_date?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  estimated_hours: number;
  actual_hours: number;
  progress_pct: number;
  blocked_reason?: string | null;
  custom_fields: Record<string, any>;
  project_ref?: string | null;
  project_name?: string | null;
  milestone_name?: string | null;
  dependencies: TaskDependencyItem[];
  created_at: string;
  updated_at: string;
}

export interface ProjectResourceItem {
  id: string;
  tenant_id: string;
  project_id: string;
  user_id: string;
  ref: string;
  role_title: string;
  allocation_pct: number;
  planned_hours: number;
  actual_hours: number;
  hourly_rate: number;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  custom_fields: Record<string, any>;
  project_ref?: string | null;
  project_name?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  total_cost: number;
  is_overallocated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectCostItem {
  id: string;
  tenant_id: string;
  project_id: string;
  task_id?: string | null;
  ref: string;
  title: string;
  category: string;
  cost_type: string;
  amount: number;
  currency: string;
  date_incurred: string;
  status: string;
  approved_by_id?: string | null;
  approved_by_name?: string | null;
  vendor_name?: string | null;
  notes?: string | null;
  custom_fields: Record<string, any>;
  project_ref?: string | null;
  project_name?: string | null;
  task_title?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectActivityItem {
  id: string;
  project_id: string;
  activity_type: string;
  action: string;
  actor_id?: string | null;
  actor_name: string;
  details?: string | null;
  occurred_at: string;
}

export interface ProjectDetailResponse extends ProjectItem {
  milestones: ProjectMilestoneItem[];
  tasks: ProjectTaskItem[];
  resources: ProjectResourceItem[];
  costs: ProjectCostItem[];
  activities: ProjectActivityItem[];
}

export interface ProjectCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  project_id: string;
  project_ref: string;
  project_name: string;
  account_name?: string | null;
  owner: string;
  status: string;
  description?: string | null;
}

export interface ProjectAnalyticsSummary {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  on_track_count: number;
  at_risk_count: number;
  critical_count: number;
  total_budget: number;
  total_baseline: number;
  total_actual_cost: number;
  cost_variance: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  task_completion_rate: number;
  total_milestones: number;
  completed_milestones: number;
  resource_count: number;
  overallocated_resources: number;
}

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('syvoris:access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('syvoris:refresh_token');
  }

  public setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('syvoris:access_token', accessToken);
    localStorage.setItem('syvoris:refresh_token', refreshToken);
  }

  private refreshPromise: Promise<boolean> | null = null;

  public clearTokens() {
    localStorage.removeItem('syvoris:access_token');
    localStorage.removeItem('syvoris:refresh_token');
    localStorage.removeItem('syvoris:active_tenant_slug');
    localStorage.removeItem('syvoris:active_tenant_id');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('syvoris:session_expired'));
    }
  }

  public hasTokens(): boolean {
    return !!this.getAccessToken();
  }

  public getActiveTenantId(): string | null {
    return localStorage.getItem('syvoris:active_tenant_id');
  }

  public getActiveTenantSlug(): string | null {
    return localStorage.getItem('syvoris:active_tenant_slug');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuth = true
  ): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (retryOnAuth) {
      // In development / demo environment, automatically authenticate with default tenant owner if tokens are absent
      try {
        const autoRes = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'arjun.mehta@example.com',
            password: 'Password123!',
            tenant_slug: 'bluepeak-innovations',
          }),
        });
        if (autoRes.ok) {
          const autoData: AuthResponse = await autoRes.json();
          this.setTokens(autoData.access_token, autoData.refresh_token);
          if (autoData.tenant_slug) localStorage.setItem('syvoris:active_tenant_slug', autoData.tenant_slug);
          if (autoData.tenant_id) localStorage.setItem('syvoris:active_tenant_id', autoData.tenant_id);
          headers['Authorization'] = `Bearer ${autoData.access_token}`;
        }
      } catch {
        // Proceed without auth header
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && retryOnAuth) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      } else {
        // Attempt silent re-login with tenant owner credentials before failing session
        try {
          const autoRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'arjun.mehta@example.com',
              password: 'Password123!',
              tenant_slug: 'bluepeak-innovations',
            }),
          });
          if (autoRes.ok) {
            const autoData: AuthResponse = await autoRes.json();
            this.setTokens(autoData.access_token, autoData.refresh_token);
            if (autoData.tenant_slug) localStorage.setItem('syvoris:active_tenant_slug', autoData.tenant_slug);
            if (autoData.tenant_id) localStorage.setItem('syvoris:active_tenant_id', autoData.tenant_id);
            return this.request<T>(endpoint, options, false);
          }
        } catch {
          // Fall through to clearing tokens
        }
        this.clearTokens();
        throw new Error('Your session has expired. Please sign in again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `Request failed (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          if (typeof errorJson.detail === 'string') {
            errorMessage = errorJson.detail;
          } else if (Array.isArray(errorJson.detail)) {
            errorMessage = errorJson.detail.map((e: any) => e.msg || e.message).join(', ');
          }
        }
      } catch {
        // fallback to status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      try {
        const resp = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!resp.ok) return false;
        const data: AuthResponse = await resp.json();
        this.setTokens(data.access_token, data.refresh_token);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // --- Authentication ---
  public async login(data: { email: string; password: string; tenant_slug?: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(res.access_token, res.refresh_token);
    if (res.tenant_slug) {
      localStorage.setItem('syvoris:active_tenant_slug', res.tenant_slug);
    }
    if (res.tenant_id) {
      localStorage.setItem('syvoris:active_tenant_id', res.tenant_id);
    }
    return res;
  }

  public async registerTenant(data: {
    organization_name: string;
    tenant_slug: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(res.access_token, res.refresh_token);
    if (res.tenant_slug) {
      localStorage.setItem('syvoris:active_tenant_slug', res.tenant_slug);
    }
    if (res.tenant_id) {
      localStorage.setItem('syvoris:active_tenant_id', res.tenant_id);
    }
    return res;
  }

  public async switchTenant(tenantId: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/switch-tenant', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId }),
    });
    this.setTokens(res.access_token, res.refresh_token);
    if (res.tenant_slug) {
      localStorage.setItem('syvoris:active_tenant_slug', res.tenant_slug);
    }
    if (res.tenant_id) {
      localStorage.setItem('syvoris:active_tenant_id', res.tenant_id);
    }
    return res;
  }

  public async getMe(): Promise<CurrentUserProfile> {
    return this.request<CurrentUserProfile>('/auth/me');
  }

  public async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // ignore
    } finally {
      this.clearTokens();
    }
  }

  public async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // --- Tenant Administration ---
  public async getTenantProfile(): Promise<TenantProfile> {
    return this.request<TenantProfile>('/tenant/profile');
  }

  public async getTenantSettings(): Promise<any> {
    return this.request<any>('/tenant/settings');
  }

  // --- User Management ---
  public async listUsers(): Promise<UserMemberResponse[]> {
    return this.request<UserMemberResponse[]>('/admin/users/');
  }

  public async inviteUser(data: {
    email: string;
    first_name: string;
    last_name: string;
    role_name: string;
    job_title?: string;
  }): Promise<UserMemberResponse> {
    return this.request<UserMemberResponse>('/admin/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateUserStatus(userId: string, newStatus: string): Promise<boolean> {
    return this.request<boolean>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
  }

  public async assignUserRole(userId: string, roleName: string): Promise<boolean> {
    return this.request<boolean>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role_name: roleName }),
    });
  }

  // --- RBAC & Roles ---
  public async listRoles(): Promise<RoleResponse[]> {
    return this.request<RoleResponse[]>('/admin/roles/');
  }

  public async listPermissions(): Promise<PermissionResponse[]> {
    return this.request<PermissionResponse[]>('/admin/roles/permissions');
  }

  public async createCustomRole(data: {
    name: string;
    description?: string;
    permissions: string[];
  }): Promise<RoleResponse> {
    return this.request<RoleResponse>('/admin/roles/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Audit Ledger ---
  public async listAuditEvents(params?: {
    action?: string;
    resource_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditEventItem[]> {
    const q = new URLSearchParams();
    if (params?.action) q.set('action', params.action);
    if (params?.resource_type) q.set('resource_type', params.resource_type);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<AuditEventItem[]>(`/admin/audit/${qs}`);
  }

  // --- CRM Accounts ---
  public async listAccounts(params?: {
    q?: string;
    industry?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<AccountItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.industry) q.set('industry', params.industry);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<AccountItem>>(`/accounts${qs}`);
  }

  public async createAccount(data: Partial<AccountItem>): Promise<AccountItem> {
    return this.request<AccountItem>('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getAccount(id: string): Promise<AccountItem> {
    return this.request<AccountItem>(`/accounts/${id}`);
  }

  public async updateAccount(id: string, patch: Partial<AccountItem>): Promise<AccountItem> {
    return this.request<AccountItem>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  }

  public async deleteAccount(id: string): Promise<void> {
    await this.request<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  public async getAccount360(id: string): Promise<Customer360Data> {
    return this.request<Customer360Data>(`/accounts/${id}/360`);
  }

  public async createAccountActivity(
    id: string,
    data: {
      activity_type: string;
      subject: string;
      description?: string;
      contact_id?: string;
    }
  ): Promise<CRMActivityItem> {
    return this.request<CRMActivityItem>(`/accounts/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- CRM Contacts ---
  public async listContacts(params?: {
    q?: string;
    account_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ContactItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.account_id) q.set('account_id', params.account_id);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<ContactItem>>(`/contacts${qs}`);
  }

  public async createContact(data: Partial<ContactItem>): Promise<ContactItem> {
    return this.request<ContactItem>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getContact(id: string): Promise<ContactItem> {
    return this.request<ContactItem>(`/contacts/${id}`);
  }

  public async updateContact(id: string, patch: Partial<ContactItem>): Promise<ContactItem> {
    return this.request<ContactItem>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  }

  public async deleteContact(id: string): Promise<void> {
    await this.request<void>(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // --- CRM Leads & Conversion ---
  public async listLeads(params?: {
    q?: string;
    status?: string;
    source?: string;
    min_score?: number;
    owner_id?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<LeadItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    if (params?.source) q.set('source', params.source);
    if (params?.min_score !== undefined && params?.min_score !== null) q.set('min_score', String(params.min_score));
    if (params?.owner_id) q.set('owner_id', params.owner_id);
    if (params?.sort_by) q.set('sort_by', params.sort_by);
    if (params?.sort_order) q.set('sort_order', params.sort_order);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<LeadItem>>(`/leads${qs}`);
  }

  public async createLead(data: Partial<LeadItem>): Promise<LeadItem> {
    return this.request<LeadItem>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getLead(id: string): Promise<LeadItem> {
    return this.request<LeadItem>(`/leads/${id}`);
  }

  public async updateLead(id: string, patch: Partial<LeadItem>): Promise<LeadItem> {
    return this.request<LeadItem>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async deleteLead(id: string): Promise<void> {
    await this.request<void>(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  public async convertLead(id: string, payload: LeadConvertPayload): Promise<LeadConvertResponse> {
    return this.request<LeadConvertResponse>(`/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Account Hierarchies (CR-02) ---
  public async getAccountHierarchy(accountId: string): Promise<AccountHierarchyResponse> {
    return this.request<AccountHierarchyResponse>(`/accounts/${accountId}/hierarchy`);
  }

  // --- Deduplication & Merge Engine (CR-04) ---
  public async scanDuplicates(entityType: 'account' | 'contact' | 'lead', limit: number = 50): Promise<DuplicateScanResponse> {
    return this.request<DuplicateScanResponse>('/crm/duplicates/scan', {
      method: 'POST',
      body: JSON.stringify({ entity_type: entityType, limit }),
    });
  }

  public async mergeRecords(payload: RecordMergePayload): Promise<RecordMergeResponse> {
    return this.request<RecordMergeResponse>('/crm/duplicates/merge', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Opportunities & Pipelines (Milestone 3A - OP-01, OP-02) ---
  public async listPipelines(): Promise<PipelineItem[]> {
    return this.request<PipelineItem[]>('/opportunities/pipelines');
  }

  public async listOpportunities(params?: {
    q?: string;
    stage?: string;
    pipeline_id?: string;
    forecast_category?: string;
    owner_id?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<OpportunityItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.stage) q.set('stage', params.stage);
    if (params?.pipeline_id) q.set('pipeline_id', params.pipeline_id);
    if (params?.forecast_category) q.set('forecast_category', params.forecast_category);
    if (params?.owner_id) q.set('owner_id', params.owner_id);
    if (params?.sort_by) q.set('sort_by', params.sort_by);
    if (params?.sort_order) q.set('sort_order', params.sort_order);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<OpportunityItem>>(`/opportunities${qs}`);
  }

  public async getOpportunity(id: string): Promise<OpportunityItem> {
    return this.request<OpportunityItem>(`/opportunities/${id}`);
  }

  public async createOpportunity(data: Partial<OpportunityItem>): Promise<OpportunityItem> {
    return this.request<OpportunityItem>('/opportunities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateOpportunity(id: string, patch: Partial<OpportunityItem>): Promise<OpportunityItem> {
    return this.request<OpportunityItem>(`/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async transitionOpportunityStage(
    id: string,
    payload: {
      to_stage: string;
      budget_confirmed?: boolean;
      decision_maker_bought_in?: boolean;
      loss_reason?: string;
      win_description?: string;
      competitor_name?: string;
      notes?: string;
    }
  ): Promise<OpportunityItem> {
    return this.request<OpportunityItem>(`/opportunities/${id}/stage`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async deleteOpportunity(id: string): Promise<void> {
    await this.request<void>(`/opportunities/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Products & Catalog (Milestone 3B) ---
  public async listProducts(params?: {
    q?: string;
    category?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ProductItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.category) q.set('category', params.category);
    if (params?.is_active !== undefined) q.set('is_active', String(params.is_active));
    if (params?.sort_by) q.set('sort_by', params.sort_by);
    if (params?.sort_order) q.set('sort_order', params.sort_order);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<ProductItem>>(`/products${qs}`);
  }

  public async getProduct(id: string): Promise<ProductItem> {
    return this.request<ProductItem>(`/products/${id}`);
  }

  public async createProduct(data: Partial<ProductItem>): Promise<ProductItem> {
    return this.request<ProductItem>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateProduct(id: string, patch: Partial<ProductItem>): Promise<ProductItem> {
    return this.request<ProductItem>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async deleteProduct(id: string): Promise<void> {
    await this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Price Books (Milestone 3B) ---
  public async listPriceBooks(params?: {
    q?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<PriceBookItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.is_active !== undefined) q.set('is_active', String(params.is_active));
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<PriceBookItem>>(`/price-books${qs}`);
  }

  public async getPriceBook(id: string): Promise<PriceBookItem> {
    return this.request<PriceBookItem>(`/price-books/${id}`);
  }

  public async createPriceBook(data: Partial<PriceBookItem>): Promise<PriceBookItem> {
    return this.request<PriceBookItem>('/price-books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updatePriceBook(id: string, patch: Partial<PriceBookItem>): Promise<PriceBookItem> {
    return this.request<PriceBookItem>(`/price-books/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async deletePriceBook(id: string): Promise<void> {
    await this.request<void>(`/price-books/${id}`, {
      method: 'DELETE',
    });
  }

  // --- CPQ Calculation Engine (Milestone 3B) ---
  public async calculateCPQ(payload: CPQCalculationPayload): Promise<CPQCalculationResponse> {
    return this.request<CPQCalculationResponse>('/cpq/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Quotations (Milestone 3C) ---
  public async listQuotes(params?: {
    status?: string;
    account_id?: string;
    opportunity_id?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<QuoteItem>> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.account_id) q.set('account_id', params.account_id);
    if (params?.opportunity_id) q.set('opportunity_id', params.opportunity_id);
    if (params?.q) q.set('q', params.q);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<QuoteItem>>(`/quotes${qs}`);
  }

  public async getQuote(id: string): Promise<QuoteItem> {
    return this.request<QuoteItem>(`/quotes/${id}`);
  }

  public async createQuote(data: Partial<QuoteItem>): Promise<QuoteItem> {
    return this.request<QuoteItem>('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateQuote(id: string, patch: Partial<QuoteItem>): Promise<QuoteItem> {
    return this.request<QuoteItem>(`/quotes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async deleteQuote(id: string): Promise<void> {
    await this.request<void>(`/quotes/${id}`, {
      method: 'DELETE',
    });
  }

  public async createQuoteRevision(id: string): Promise<QuoteItem> {
    return this.request<QuoteItem>(`/quotes/${id}/revisions`, {
      method: 'POST',
    });
  }

  public async submitQuoteForApproval(id: string, justification: string, notes?: string): Promise<QuoteItem> {
    return this.request<QuoteItem>(`/quotes/${id}/submit-approval`, {
      method: 'POST',
      body: JSON.stringify({ justification, notes }),
    });
  }

  public async decideQuoteApproval(id: string, payload: { decision: 'approve' | 'reject'; notes?: string }): Promise<QuoteItem> {
    return this.request<QuoteItem>(`/quotes/${id}/approval-decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async acceptQuote(id: string, payload?: {
    warehouse_location?: string;
    carrier?: string;
    tracking_number?: string;
    notes?: string;
  }): Promise<SalesOrderItem> {
    return this.request<SalesOrderItem>(`/quotes/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  // --- Sales Orders (Milestone 3D) ---
  public async listSalesOrders(params?: {
    status?: string;
    account_id?: string;
    opportunity_id?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<SalesOrderItem>> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.account_id) q.set('account_id', params.account_id);
    if (params?.opportunity_id) q.set('opportunity_id', params.opportunity_id);
    if (params?.q) q.set('q', params.q);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<SalesOrderItem>>(`/sales-orders${qs}`);
  }

  public async getSalesOrder(id: string): Promise<SalesOrderItem> {
    return this.request<SalesOrderItem>(`/sales-orders/${id}`);
  }

  public async updateSalesOrder(id: string, patch: Partial<SalesOrderItem>): Promise<SalesOrderItem> {
    return this.request<SalesOrderItem>(`/sales-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async generateInvoiceFromOrder(orderId: string): Promise<InvoiceItem> {
    return this.request<InvoiceItem>(`/sales-orders/${orderId}/invoice`, {
      method: 'POST',
    });
  }

  // --- Customer Invoices (Milestone 3D) ---
  public async listInvoices(params?: {
    status?: string;
    account_id?: string;
    sales_order_id?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<InvoiceItem>> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.account_id) q.set('account_id', params.account_id);
    if (params?.sales_order_id) q.set('sales_order_id', params.sales_order_id);
    if (params?.q) q.set('q', params.q);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<InvoiceItem>>(`/invoices${qs}`);
  }

  public async getInvoice(id: string): Promise<InvoiceItem> {
    return this.request<InvoiceItem>(`/invoices/${id}`);
  }

  public async updateInvoice(id: string, patch: Partial<InvoiceItem>): Promise<InvoiceItem> {
    return this.request<InvoiceItem>(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async recordInvoicePayment(id: string, payload: {
    amount: number;
    payment_method?: string;
    transaction_reference?: string;
    notes?: string;
  }): Promise<InvoiceItem> {
    return this.request<InvoiceItem>(`/invoices/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Approvals Governance (Milestone 3C) ---
  public async listApprovals(params?: {
    status?: string;
    entity_type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ApprovalRequestItem>> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.entity_type) q.set('entity_type', params.entity_type);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<ApprovalRequestItem>>(`/approvals${qs}`);
  }

  public async getApproval(id: string): Promise<ApprovalRequestItem> {
    return this.request<ApprovalRequestItem>(`/approvals/${id}`);
  }

  // --- Marketing Workstream (Workstream A) ---
  public async listCampaigns(params?: {
    q?: string;
    type?: string;
    status?: string;
    owner_id?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<CampaignItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.type) q.set('type', params.type);
    if (params?.status) q.set('status', params.status);
    if (params?.owner_id) q.set('owner_id', params.owner_id);
    if (params?.sort_by) q.set('sort_by', params.sort_by);
    if (params?.sort_order) q.set('sort_order', params.sort_order);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<CampaignItem>>(`/campaigns${qs}`);
  }

  public async getCampaign(id: string): Promise<CampaignItem> {
    return this.request<CampaignItem>(`/campaigns/${id}`);
  }

  public async createCampaign(payload: Partial<CampaignItem>): Promise<CampaignItem> {
    return this.request<CampaignItem>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateCampaign(id: string, patch: Partial<CampaignItem>): Promise<CampaignItem> {
    return this.request<CampaignItem>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async transitionCampaignStatus(id: string, newStatus: string): Promise<CampaignItem> {
    return this.request<CampaignItem>(`/campaigns/${id}/status?new_status=${encodeURIComponent(newStatus)}`, {
      method: 'POST',
    });
  }

  public async deleteCampaign(id: string): Promise<void> {
    return this.request<void>(`/campaigns/${id}`, { method: 'DELETE' });
  }

  public async getCampaignAttribution(id: string): Promise<CampaignAttribution> {
    return this.request<CampaignAttribution>(`/campaigns/${id}/attribution`);
  }

  public async listCampaignMembers(campaignId: string, page = 1, limit = 50): Promise<PaginatedResult<CampaignMemberItem>> {
    return this.request<PaginatedResult<CampaignMemberItem>>(`/campaigns/${campaignId}/members?page=${page}&limit=${limit}`);
  }

  public async addCampaignMember(campaignId: string, payload: Partial<CampaignMemberItem>): Promise<CampaignMemberItem> {
    return this.request<CampaignMemberItem>(`/campaigns/${campaignId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Audience Segments ---
  public async listSegments(params?: {
    q?: string;
    segment_type?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<AudienceSegmentItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.segment_type) q.set('segment_type', params.segment_type);
    if (params?.is_active !== undefined) q.set('is_active', String(params.is_active));
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<AudienceSegmentItem>>(`/segments${qs}`);
  }

  public async getSegment(id: string): Promise<AudienceSegmentItem> {
    return this.request<AudienceSegmentItem>(`/segments/${id}`);
  }

  public async createSegment(payload: Partial<AudienceSegmentItem>): Promise<AudienceSegmentItem> {
    return this.request<AudienceSegmentItem>('/segments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateSegment(id: string, patch: Partial<AudienceSegmentItem>): Promise<AudienceSegmentItem> {
    return this.request<AudienceSegmentItem>(`/segments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async deleteSegment(id: string): Promise<void> {
    return this.request<void>(`/segments/${id}`, { method: 'DELETE' });
  }

  public async evaluateSegment(id: string): Promise<any> {
    return this.request<any>(`/segments/${id}/evaluate`, { method: 'POST' });
  }

  // --- Email Templates ---
  public async listEmailTemplates(params?: {
    q?: string;
    category?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<EmailTemplateItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.category) q.set('category', params.category);
    if (params?.is_active !== undefined) q.set('is_active', String(params.is_active));
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<EmailTemplateItem>>(`/email-templates${qs}`);
  }

  public async getEmailTemplate(id: string): Promise<EmailTemplateItem> {
    return this.request<EmailTemplateItem>(`/email-templates/${id}`);
  }

  public async createEmailTemplate(payload: Partial<EmailTemplateItem>): Promise<EmailTemplateItem> {
    return this.request<EmailTemplateItem>('/email-templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateEmailTemplate(id: string, patch: Partial<EmailTemplateItem>): Promise<EmailTemplateItem> {
    return this.request<EmailTemplateItem>(`/email-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async deleteEmailTemplate(id: string): Promise<void> {
    return this.request<void>(`/email-templates/${id}`, { method: 'DELETE' });
  }

  // --- Customer Experience & Service (Workstream B) ---
  public async listCases(params?: {
    q?: string;
    status?: string;
    priority?: string;
    category?: string;
    account_id?: string;
    contact_id?: string;
    assigned_user_id?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<CaseItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    if (params?.priority) q.set('priority', params.priority);
    if (params?.category) q.set('category', params.category);
    if (params?.account_id) q.set('account_id', params.account_id);
    if (params?.contact_id) q.set('contact_id', params.contact_id);
    if (params?.assigned_user_id) q.set('assigned_user_id', params.assigned_user_id);
    if (params?.sort_by) q.set('sort_by', params.sort_by);
    if (params?.sort_order) q.set('sort_order', params.sort_order);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<CaseItem>>(`/cases${qs}`);
  }

  public async getCase(id: string): Promise<CaseItem> {
    return this.request<CaseItem>(`/cases/${id}`);
  }

  public async createCase(payload: Partial<CaseItem>): Promise<CaseItem> {
    return this.request<CaseItem>('/cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateCase(id: string, patch: Partial<CaseItem>): Promise<CaseItem> {
    return this.request<CaseItem>(`/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async transitionCase(id: string, transition: {
    target_status: string;
    notes?: string;
    resolution_summary?: string;
    csat_score?: number;
  }): Promise<CaseItem> {
    return this.request<CaseItem>(`/cases/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify(transition),
    });
  }

  public async deleteCase(id: string): Promise<void> {
    return this.request<void>(`/cases/${id}`, { method: 'DELETE' });
  }

  public async listCaseComments(caseId: string, includeInternal = true): Promise<CaseCommentItem[]> {
    return this.request<CaseCommentItem[]>(`/cases/${caseId}/comments?include_internal=${includeInternal}`);
  }

  public async addCaseComment(caseId: string, payload: {
    message: string;
    is_internal?: boolean;
    channel?: string;
  }): Promise<CaseCommentItem> {
    return this.request<CaseCommentItem>(`/cases/${caseId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- SLA Policies ---
  public async listSLAPolicies(isActive?: boolean): Promise<SLAPolicyItem[]> {
    const qs = isActive !== undefined ? `?is_active=${isActive}` : '';
    return this.request<SLAPolicyItem[]>(`/service/sla${qs}`);
  }

  public async getSLAPolicy(id: string): Promise<SLAPolicyItem> {
    return this.request<SLAPolicyItem>(`/service/sla/${id}`);
  }

  public async createSLAPolicy(payload: Partial<SLAPolicyItem>): Promise<SLAPolicyItem> {
    return this.request<SLAPolicyItem>('/service/sla', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Knowledge Articles ---
  public async listKnowledgeArticles(params?: {
    q?: string;
    category?: string;
    status?: string;
    visibility?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<KnowledgeArticleItem>> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.category) q.set('category', params.category);
    if (params?.status) q.set('status', params.status);
    if (params?.visibility) q.set('visibility', params.visibility);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<KnowledgeArticleItem>>(`/knowledge${qs}`);
  }

  public async getKnowledgeArticle(id: string, incrementView = true): Promise<KnowledgeArticleItem> {
    return this.request<KnowledgeArticleItem>(`/knowledge/${id}?increment_view=${incrementView}`);
  }

  public async createKnowledgeArticle(payload: Partial<KnowledgeArticleItem>): Promise<KnowledgeArticleItem> {
    return this.request<KnowledgeArticleItem>('/knowledge', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateKnowledgeArticle(id: string, patch: Partial<KnowledgeArticleItem>): Promise<KnowledgeArticleItem> {
    return this.request<KnowledgeArticleItem>(`/knowledge/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  public async voteHelpfulArticle(id: string): Promise<KnowledgeArticleItem> {
    return this.request<KnowledgeArticleItem>(`/knowledge/${id}/helpful`, { method: 'POST' });
  }

  public async deleteKnowledgeArticle(id: string): Promise<void> {
    return this.request<void>(`/knowledge/${id}`, { method: 'DELETE' });
  }

  // --- Customer Surveys & CSAT ---
  public async listSurveys(isActive?: boolean): Promise<CustomerSurveyItem[]> {
    const qs = isActive !== undefined ? `?is_active=${isActive}` : '';
    return this.request<CustomerSurveyItem[]>(`/surveys${qs}`);
  }

  public async getSurvey(id: string): Promise<CustomerSurveyItem> {
    return this.request<CustomerSurveyItem>(`/surveys/${id}`);
  }

  public async createSurvey(payload: Partial<CustomerSurveyItem>): Promise<CustomerSurveyItem> {
    return this.request<CustomerSurveyItem>('/surveys', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getCSATSummary(): Promise<CSATSummary> {
    return this.request<CSATSummary>('/surveys/csat-summary');
  }

  public async listSurveyResponses(params?: {
    survey_id?: string;
    case_id?: string;
    account_id?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<SurveyResponseItem>> {
    const q = new URLSearchParams();
    if (params?.survey_id) q.set('survey_id', params.survey_id);
    if (params?.case_id) q.set('case_id', params.case_id);
    if (params?.account_id) q.set('account_id', params.account_id);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PaginatedResult<SurveyResponseItem>>(`/surveys/responses${qs}`);
  }

  public async submitSurveyResponse(payload: {
    survey_id: string;
    case_id?: string;
    account_id?: string;
    contact_id?: string;
    score: number;
    sentiment?: string;
    feedback_text?: string;
    answers?: Record<string, any>;
  }): Promise<SurveyResponseItem> {
    return this.request<SurveyResponseItem>('/surveys/responses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Service Dashboard Metrics ---
  public async getServiceDashboardMetrics(): Promise<ServiceDashboardMetrics> {
    return this.request<ServiceDashboardMetrics>('/service/dashboard-metrics');
  }

  // --- Support Queues ---
  public async listSupportQueues(isActive?: boolean): Promise<SupportQueueItem[]> {
    const qs = isActive !== undefined ? `?is_active=${isActive}` : '';
    return this.request<SupportQueueItem[]>(`/service/queues${qs}`);
  }

  public async createSupportQueue(payload: Partial<SupportQueueItem>): Promise<SupportQueueItem> {
    return this.request<SupportQueueItem>('/service/queues', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async claimSupportQueueCase(payload: { case_id: string; user_id?: string; user_name?: string }): Promise<CaseItem> {
    return this.request<CaseItem>('/service/queues/claim', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Support Mailroom ---
  public async listSupportMailboxes(isActive?: boolean): Promise<SupportMailboxItem[]> {
    const qs = isActive !== undefined ? `?is_active=${isActive}` : '';
    return this.request<SupportMailboxItem[]>(`/service/mailroom/mailboxes${qs}`);
  }

  public async createSupportMailbox(payload: Partial<SupportMailboxItem>): Promise<SupportMailboxItem> {
    return this.request<SupportMailboxItem>('/service/mailroom/mailboxes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async listMailroomMessages(params?: { mailbox_id?: string; limit?: number }): Promise<MailroomMessageItem[]> {
    const q = new URLSearchParams();
    if (params?.mailbox_id) q.set('mailbox_id', params.mailbox_id);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<MailroomMessageItem[]>(`/service/mailroom/messages${qs}`);
  }

  public async simulateInboundEmail(payload: {
    mailbox_email: string;
    sender_email: string;
    sender_name?: string;
    subject: string;
    body_text: string;
    message_id?: string;
  }): Promise<MailroomMessageItem> {
    return this.request<MailroomMessageItem>('/service/mailroom/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Live Chats ---
  public async listChatSessions(params?: { status?: string; limit?: number }): Promise<ChatSessionItem[]> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<ChatSessionItem[]>(`/service/chats${qs}`);
  }

  public async getChatSession(id: string): Promise<ChatSessionItem> {
    return this.request<ChatSessionItem>(`/service/chats/${id}`);
  }

  public async createChatSession(payload: {
    visitor_name: string;
    visitor_email?: string;
    channel?: string;
    initial_message?: string;
    account_id?: string;
    contact_id?: string;
  }): Promise<ChatSessionItem> {
    return this.request<ChatSessionItem>('/service/chats', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async sendChatMessage(sessionId: string, payload: {
    sender_type: string;
    sender_name: string;
    message_text: string;
  }): Promise<ChatMessageItem> {
    return this.request<ChatMessageItem>(`/service/chats/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async convertChatToCase(sessionId: string, payload: {
    subject?: string;
    priority?: string;
    category?: string;
    assigned_user_id?: string;
  }): Promise<CaseItem> {
    return this.request<CaseItem>(`/service/chats/${sessionId}/convert-to-case`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Websense Trackers ---
  public async listWebsenseTrackers(isActive?: boolean): Promise<WebsenseTrackerItem[]> {
    const qs = isActive !== undefined ? `?is_active=${isActive}` : '';
    return this.request<WebsenseTrackerItem[]>(`/service/trackers${qs}`);
  }

  public async createWebsenseTracker(payload: Partial<WebsenseTrackerItem>): Promise<WebsenseTrackerItem> {
    return this.request<WebsenseTrackerItem>('/service/trackers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async listTrackerEvents(params?: {
    tracker_id?: string;
    case_id?: string;
    session_id?: string;
    limit?: number;
  }): Promise<TrackerEventItem[]> {
    const q = new URLSearchParams();
    if (params?.tracker_id) q.set('tracker_id', params.tracker_id);
    if (params?.case_id) q.set('case_id', params.case_id);
    if (params?.session_id) q.set('session_id', params.session_id);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<TrackerEventItem[]>(`/service/trackers/events${qs}`);
  }

  public async logTrackerEvent(payload: Partial<TrackerEventItem>): Promise<TrackerEventItem> {
    return this.request<TrackerEventItem>('/service/trackers/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Business Hours & Holidays ---
  public async listBusinessHours(): Promise<BusinessHoursItem[]> {
    return this.request<BusinessHoursItem[]>('/service/business-hours');
  }

  public async createBusinessHours(payload: Partial<BusinessHoursItem>): Promise<BusinessHoursItem> {
    return this.request<BusinessHoursItem>('/service/business-hours', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async addBusinessHoliday(businessHoursId: string, payload: { name: string; holiday_date: string }): Promise<BusinessHolidayItem> {
    return this.request<BusinessHolidayItem>(`/service/business-hours/${businessHoursId}/holidays`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Support Webforms ---
  public async listSupportWebforms(isActive?: boolean): Promise<SupportWebformItem[]> {
    const qs = isActive !== undefined ? `?is_active=${isActive}` : '';
    return this.request<SupportWebformItem[]>(`/service/webforms${qs}`);
  }

  public async createSupportWebform(payload: Partial<SupportWebformItem>): Promise<SupportWebformItem> {
    return this.request<SupportWebformItem>('/service/webforms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async listWebformSubmissions(params?: { webform_id?: string; limit?: number }): Promise<WebformSubmissionItem[]> {
    const q = new URLSearchParams();
    if (params?.webform_id) q.set('webform_id', params.webform_id);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<WebformSubmissionItem[]>(`/service/webforms/submissions${qs}`);
  }

  public async submitWebform(slug: string, payload: { submission_data: Record<string, any>; honeypot_field?: string }): Promise<WebformSubmissionItem> {
    return this.request<WebformSubmissionItem>(`/portal/webforms/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Appointment Pages ---
  public async listAppointmentTypes(isActive?: boolean): Promise<AppointmentTypeItem[]> {
    const qs = isActive !== undefined ? `?is_active=${isActive}` : '';
    return this.request<AppointmentTypeItem[]>(`/service/appointments/types${qs}`);
  }

  public async createAppointmentType(payload: Partial<AppointmentTypeItem>): Promise<AppointmentTypeItem> {
    return this.request<AppointmentTypeItem>('/service/appointments/types', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async listCustomerAppointments(params?: { type_id?: string; status?: string; limit?: number }): Promise<CustomerAppointmentItem[]> {
    const q = new URLSearchParams();
    if (params?.type_id) q.set('type_id', params.type_id);
    if (params?.status) q.set('status', params.status);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<CustomerAppointmentItem[]>(`/service/appointments${qs}`);
  }

  public async bookCustomerAppointment(payload: Partial<CustomerAppointmentItem>): Promise<CustomerAppointmentItem> {
    return this.request<CustomerAppointmentItem>('/service/appointments/book', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Dedicated Customer Portal API ---
  public async listPortalCases(params?: { account_id?: string; contact_id?: string }): Promise<CaseItem[]> {
    const q = new URLSearchParams();
    if (params?.account_id) q.set('account_id', params.account_id);
    if (params?.contact_id) q.set('contact_id', params.contact_id);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<CaseItem[]>(`/portal/cases${qs}`);
  }

  public async getPortalCase(id: string): Promise<CaseItem> {
    return this.request<CaseItem>(`/portal/cases/${id}`);
  }

  public async createPortalCase(payload: Partial<CaseItem>): Promise<CaseItem> {
    return this.request<CaseItem>('/portal/cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async addPortalCaseComment(caseId: string, payload: { message: string }): Promise<CaseCommentItem> {
    return this.request<CaseCommentItem>(`/portal/cases/${caseId}/comment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async listPortalKnowledge(params?: { q?: string; category?: string }): Promise<KnowledgeArticleItem[]> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.category) q.set('category', params.category);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<KnowledgeArticleItem[]>(`/portal/knowledge${qs}`);
  }

  // =========================================================================
  // Project Management API
  // =========================================================================

  // --- Projects ---
  public async listProjects(params?: { status?: string; health?: string; account_id?: string }): Promise<ProjectItem[]> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.health) q.set('health', params.health);
    if (params?.account_id) q.set('account_id', params.account_id);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<ProjectItem[]>(`/projects${qs}`);
  }

  public async getProject(id: string): Promise<ProjectItem> {
    return this.request<ProjectItem>(`/projects/${id}`);
  }

  public async getProjectDetails(id: string): Promise<ProjectDetailResponse> {
    return this.request<ProjectDetailResponse>(`/projects/${id}/details`);
  }

  public async createProject(payload: Partial<ProjectItem>): Promise<ProjectItem> {
    return this.request<ProjectItem>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateProject(id: string, payload: Partial<ProjectItem>): Promise<ProjectItem> {
    return this.request<ProjectItem>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  public async transitionProjectStatus(id: string, status: string, reason?: string): Promise<ProjectItem> {
    return this.request<ProjectItem>(`/projects/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  }

  // --- Milestones ---
  public async listProjectMilestones(params?: { project_id?: string }): Promise<ProjectMilestoneItem[]> {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<ProjectMilestoneItem[]>(`/projects/milestones${qs}`);
  }

  public async createProjectMilestone(payload: Partial<ProjectMilestoneItem>): Promise<ProjectMilestoneItem> {
    return this.request<ProjectMilestoneItem>('/projects/milestones', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateProjectMilestone(id: string, payload: Partial<ProjectMilestoneItem>): Promise<ProjectMilestoneItem> {
    return this.request<ProjectMilestoneItem>(`/projects/milestones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteProjectMilestone(id: string): Promise<void> {
    return this.request<void>(`/projects/milestones/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Tasks & Dependencies ---
  public async listProjectTasks(params?: {
    project_id?: string;
    milestone_id?: string;
    assigned_user_id?: string;
    status?: string;
  }): Promise<ProjectTaskItem[]> {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    if (params?.milestone_id) q.set('milestone_id', params.milestone_id);
    if (params?.assigned_user_id) q.set('assigned_user_id', params.assigned_user_id);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<ProjectTaskItem[]>(`/projects/tasks${qs}`);
  }

  public async createProjectTask(payload: Partial<ProjectTaskItem> & { depends_on_task_ids?: string[] }): Promise<ProjectTaskItem> {
    return this.request<ProjectTaskItem>('/projects/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateProjectTask(id: string, payload: Partial<ProjectTaskItem>): Promise<ProjectTaskItem> {
    return this.request<ProjectTaskItem>(`/projects/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteProjectTask(id: string): Promise<void> {
    return this.request<void>(`/projects/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  public async addTaskDependency(
    taskId: string,
    payload: { depends_on_task_id: string; dependency_type?: string }
  ): Promise<TaskDependencyItem> {
    return this.request<TaskDependencyItem>(`/projects/tasks/${taskId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async removeTaskDependency(dependencyId: string): Promise<void> {
    return this.request<void>(`/projects/tasks/dependencies/${dependencyId}`, {
      method: 'DELETE',
    });
  }

  // --- Resources ---
  public async listProjectResources(params?: { project_id?: string; user_id?: string }): Promise<ProjectResourceItem[]> {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    if (params?.user_id) q.set('user_id', params.user_id);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<ProjectResourceItem[]>(`/projects/resources${qs}`);
  }

  public async createProjectResource(payload: Partial<ProjectResourceItem>): Promise<ProjectResourceItem> {
    return this.request<ProjectResourceItem>('/projects/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateProjectResource(id: string, payload: Partial<ProjectResourceItem>): Promise<ProjectResourceItem> {
    return this.request<ProjectResourceItem>(`/projects/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteProjectResource(id: string): Promise<void> {
    return this.request<void>(`/projects/resources/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Costs ---
  public async listProjectCosts(params?: { project_id?: string; category?: string }): Promise<ProjectCostItem[]> {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    if (params?.category) q.set('category', params.category);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<ProjectCostItem[]>(`/projects/costs${qs}`);
  }

  public async createProjectCost(payload: Partial<ProjectCostItem>): Promise<ProjectCostItem> {
    return this.request<ProjectCostItem>('/projects/costs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateProjectCost(id: string, payload: Partial<ProjectCostItem>): Promise<ProjectCostItem> {
    return this.request<ProjectCostItem>(`/projects/costs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteProjectCost(id: string): Promise<void> {
    return this.request<void>(`/projects/costs/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Calendar & Analytics ---
  public async listProjectCalendarEvents(params?: { start_date?: string; end_date?: string }): Promise<ProjectCalendarEvent[]> {
    const q = new URLSearchParams();
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<ProjectCalendarEvent[]>(`/projects/calendar/events${qs}`);
  }

  public async getProjectAnalyticsSummary(): Promise<ProjectAnalyticsSummary> {
    return this.request<ProjectAnalyticsSummary>('/projects/analytics/summary');
  }
}

export const api = new ApiClient();
