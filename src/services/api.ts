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
  metrics: Record<string, any>;
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
  owner_id?: string;
  owner_name?: string;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
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

  public clearTokens() {
    localStorage.removeItem('syvoris:access_token');
    localStorage.removeItem('syvoris:refresh_token');
    localStorage.removeItem('syvoris:active_tenant_slug');
    localStorage.removeItem('syvoris:active_tenant_id');
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
    }
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
}

export const api = new ApiClient();
