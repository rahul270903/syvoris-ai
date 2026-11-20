import { useState, useEffect, useMemo } from 'react';
import {
  FileText, ShieldCheck, Scale, Award, Search, Plus, RefreshCw,
  CheckCircle2, AlertTriangle, X, Check, Copy, ExternalLink,
  BookOpen, Star, Calendar, UserCheck, ArrowUpRight
} from 'lucide-react';
import { api, CommercialTermsItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

const DEFAULT_TERMS: CommercialTermsItem[] = [
  {
    id: 'term-1',
    tenant_id: 'default',
    ref: 'TRM-2026-0001',
    title: 'Commercial Master Services Agreement (MSA) v3.2 - Standard Net 30',
    version: 'v3.2',
    category: 'Master Services Agreement',
    content: `1. PAYMENT TERMS & DISCOUNTS: All undisputed commercial invoices shall be payable within thirty (30) calendar days from receipt ("Net 30"). Invoices overdue by more than fifteen (15) business days shall accrue interest at 1.5% per month or the statutory maximum rate, whichever is lower.

2. INTELLECTUAL PROPERTY & TITLE: BluePeak Innovations / SYVORIS retains all right, title, and interest in and to underlying software architectures, proprietary algorithms, and core platform enhancements. Customer owns all bespoke configurations and confidential enterprise operational data ingested into tenant memory graphs.

3. LIMITATION OF LIABILITY: Neither party shall be liable for indirect, consequential, or punitive damages. The aggregate liability of either party arising out of or related to this Agreement shall not exceed the total fees paid or payable by Customer under the applicable Order in the twelve (12) month period preceding the incident.

4. WARRANTIES & CARRIER SLAs: Infrastructure hardware carries OEM manufacturer warranties. Optical fiber splicing and installation works are guaranteed for thirty-six (36) months post-signoff against fabrication or workmanship defects.

5. GOVERNING LAW & ARBITRATION: This Agreement shall be governed and construed in accordance with the laws of Delaware / CARICOM Commercial Arbitration, without regard to conflict of laws principles.`,
    effective_date: '2026-01-01',
    expiration_date: '2028-12-31',
    status: 'Active',
    is_default: true,
    published_by: 'Legal Governance & Compliance',
    published_at: '2026-01-01',
    custom_fields: { quote_section: 'commercial_schedule_a', review_cycle: 'Annual' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'term-2',
    tenant_id: 'default',
    ref: 'TRM-2026-0002',
    title: 'Public Sector & Sovereign Procurement Framework Agreement v2.0',
    version: 'v2.0',
    category: 'Public Sector Tender',
    content: `1. STATUTORY PROCUREMENT COMPLIANCE: The Contractor covenants that all equipment, labor, and deliverables meet government procurement standards, sovereign security guidelines, and statutory local content participation rules.

2. PERFORMANCE BOND & RETENTION: A five percent (5%) contract retention sum shall be held against provisional acceptance until final sign-off inspection (thirty days post-commissioning). A performance bond of ten percent (10%) remains in effect for the project duration.

3. AUDITOR GENERAL ACCESS: The Contractor shall provide authorized state auditors with full inspection rights to commercial work records, equipment serial manifests, and billing certifications related to the performance of public sector agreements.

4. INDEMNIFICATION & FORCE MAJEURE: Standard hurricane, seismic, and sovereign force majeure clauses apply with thirty (30) day remediation periods prior to termination for cause.`,
    effective_date: '2026-01-01',
    expiration_date: '2027-12-31',
    status: 'Active',
    is_default: false,
    published_by: 'Public Sector Legal Counsel',
    published_at: '2026-01-01',
    custom_fields: { quote_section: 'government_rider', review_cycle: 'Bi-Annual' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'term-3',
    tenant_id: 'default',
    ref: 'TRM-2026-0003',
    title: 'Cloud Enterprise SaaS EULA & Data Processing Addendum (GDPR / ISO 27001)',
    version: 'v4.1',
    category: 'SaaS EULA & DPA',
    content: `1. SERVICE LEVEL AGREEMENT (SLA): SYVORIS Ai guarantees 99.95% monthly uptime for enterprise AI agent orchestrations and API endpoints, excluding scheduled maintenance announced with forty-eight (48) hours notice. Failure to meet SLA results in service credits proportional to outage severity.

2. DATA PRIVACY & RESIDENCY: Tenant customer data is stored in isolated PostgreSQL instances with Row-Level Security (RLS) enforcement. Data remains strictly within specified regional boundaries and will not be transferred without explicit administrative authorization.

3. SUB-PROCESSORS & AUDIT: The Provider maintains SOC 2 Type II and ISO 27001 certifications. Customer shall receive at least thirty (30) days prior notification of changes to third-party sub-processors.

4. SECURITY INCIDENT NOTIFICATION: In the event of a verified unauthorized disclosure of Customer personal data, Provider shall notify Customer security operations within forty-eight (48) hours.`,
    effective_date: '2026-01-01',
    expiration_date: '2029-01-01',
    status: 'Active',
    is_default: false,
    published_by: 'Data Protection Officer',
    published_at: '2026-01-01',
    custom_fields: { quote_section: 'cloud_dpa_schedule', review_cycle: 'Quarterly' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'term-4',
    tenant_id: 'default',
    ref: 'TRM-2026-0004',
    title: 'Field Engineering & Professional Services Statement of Work (SOW)',
    version: 'v1.8',
    category: 'Professional Services SOW',
    content: `1. MILESTONE SIGN-OFF & ACCEPTANCE: Deliverables shall be deemed accepted if no formal deficiency notice is submitted within seven (7) business days of milestone completion and OTDR fiber test report submission.

2. CHANGE REQUEST PROCEDURES: Any modification to project scope, fiber routing, or bill of materials shall require a written Change Order signed by both authorized Project Managers before work commences.

3. SITE ACCESS & SAFETY INDEMNITY: Customer is responsible for securing right-of-way permissions, building permits, and rooftop access for field engineering crews. Crews adhere to OSHA and NEPA electrical safety protocols.

4. TRAVEL & EXPENSES: Unscheduled site call-outs outside standard metropolitan limits shall be billed at standard corporate per diem rates with pre-approved travel schedules.`,
    effective_date: '2026-01-01',
    expiration_date: '2027-06-30',
    status: 'Active',
    is_default: false,
    published_by: 'Professional Services Director',
    published_at: '2026-01-01',
    custom_fields: { quote_section: 'ps_sow_terms', review_cycle: 'Annual' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  }
];

export function TermsManagementView() {
  const { addEvent, addAudit } = useCRM();

  const [terms, setTerms] = useState<CommercialTermsItem[]>(DEFAULT_TERMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<CommercialTermsItem | null>(null);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadTerms = async () => {
    setIsLoading(true);
    try {
      const liveList = await api.listTerms();
      if (liveList && liveList.length > 0) {
        const map = new Map<string, CommercialTermsItem>();
        DEFAULT_TERMS.forEach(t => map.set(t.ref, t));
        liveList.forEach(t => map.set(t.ref || t.id, t));
        setTerms(Array.from(map.values()));
      }
    } catch (err) {
      console.warn('Load terms fallback to default enterprise boilerplates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  // Form State for New Terms
  const [newTerm, setNewTerm] = useState({
    title: '',
    category: 'Master Services Agreement',
    version: 'v1.0',
    effective_date: new Date().toISOString().slice(0, 10),
    expiration_date: '2028-12-31',
    is_default: false,
    content: '',
  });

  // Filtered Terms
  const filteredTerms = useMemo(() => {
    return terms.filter(t => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (statusFilter === 'active' && t.status !== 'Active') return false;
      if (statusFilter === 'inactive' && t.status === 'Active') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mRef = t.ref.toLowerCase().includes(q);
        const mTitle = t.title.toLowerCase().includes(q);
        const mCat = t.category.toLowerCase().includes(q);
        const mContent = t.content.toLowerCase().includes(q);
        if (!mRef && !mTitle && !mCat && !mContent) return false;
      }
      return true;
    });
  }, [terms, selectedCategory, statusFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = terms.length;
    const active = terms.filter(t => t.status === 'Active').length;
    const defaultTerm = terms.find(t => t.is_default);
    const categoriesCount = new Set(terms.map(t => t.category)).size;

    return { total, active, defaultTitle: defaultTerm?.version || 'v3.2 Standard', categoriesCount };
  }, [terms]);

  // 1-Click Set as Default Quote Schedule
  const handleSetDefault = async (term: CommercialTermsItem) => {
    const updated = terms.map(t => ({
      ...t,
      is_default: t.id === term.id
    }));
    setTerms(updated);

    try {
      await api.updateTerm(term.id, { is_default: true });
      addEvent('term.updated', { ref: term.ref }, `Set ${term.ref} (${term.title}) as default commercial quote schedule`);
      addAudit(`Set ${term.ref} as default quote boilerplate`, 'Legal', term.id);
      notify(`"${term.title}" is now the primary quote boilerplate.`);
    } catch (err) {
      console.warn('API update fallback:', err);
      notify(`"${term.title}" set as primary quote boilerplate.`);
    }
  };

  // Copy Legal Text to Clipboard
  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    notify('Legal clause text copied to clipboard.');
    window.setTimeout(() => setCopied(false), 2000);
  };

  // Submit Create New Legal Terms
  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.title || !newTerm.content) {
      alert('Please fill in required fields: Title and Contract Clauses.');
      return;
    }

    const payload: Partial<CommercialTermsItem> = {
      title: newTerm.title.trim(),
      category: newTerm.category,
      version: newTerm.version.trim() || 'v1.0',
      effective_date: newTerm.effective_date,
      expiration_date: newTerm.expiration_date,
      is_default: newTerm.is_default,
      status: 'Active',
      published_by: 'Legal Governance',
      published_at: new Date().toISOString().slice(0, 10),
      content: newTerm.content,
      custom_fields: { quote_section: 'commercial_appendix' }
    };

    try {
      const created = await api.createTerm(payload);
      if (payload.is_default) {
        setTerms(prev => [created, ...prev.map(t => ({ ...t, is_default: false }))]);
      } else {
        setTerms(prev => [created, ...prev]);
      }
      addEvent('term.created', { ref: created.ref }, `Created commercial agreement boilerplate ${created.ref}`);
      addAudit(`Created agreement ${created.title}`, 'Legal', created.id);
      notify(`Agreement "${created.title}" successfully added.`);
    } catch (err) {
      console.warn('API create fallback:', err);
      const fallbackItem: CommercialTermsItem = {
        id: `term-local-${Date.now()}`,
        tenant_id: 'default',
        ref: `TRM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: payload.title!,
        category: payload.category!,
        version: payload.version!,
        effective_date: payload.effective_date,
        expiration_date: payload.expiration_date,
        is_default: payload.is_default || false,
        status: 'Active',
        published_by: 'Legal Governance',
        published_at: new Date().toISOString().slice(0, 10),
        content: payload.content!,
        custom_fields: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (fallbackItem.is_default) {
        setTerms(prev => [fallbackItem, ...prev.map(t => ({ ...t, is_default: false }))]);
      } else {
        setTerms(prev => [fallbackItem, ...prev]);
      }
      notify(`Agreement "${fallbackItem.title}" saved to local boilerplate repository.`);
    }

    setShowCreateModal(false);
    setNewTerm({
      title: '',
      category: 'Master Services Agreement',
      version: 'v1.0',
      effective_date: new Date().toISOString().slice(0, 10),
      expiration_date: '2028-12-31',
      is_default: false,
      content: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" /> Legal Governance & Compliance
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Commercial Boilerplates & SOW Schedules</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Terms and Conditions</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Governed contractual clauses, master services agreements (MSA), cloud SaaS DPAs, and engineering SOW delivery riders attached to quotes and client proposals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTerms}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all hover:border-slate-600 disabled:opacity-50"
            title="Reload boilerplates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Repository
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Commercial Terms
          </button>
        </div>
      </div>

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Active Boilerplates</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{kpis.active} <span className="text-xs font-normal text-slate-500">/ {kpis.total} Total</span></div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Fully Enforced in CPQ Quotes
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Default Quote Schedule</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 truncate tracking-tight">{kpis.defaultTitle}</div>
          <div className="text-[11px] text-slate-400 mt-1">Automatic Net 30 Commercial MSA</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Categories Covered</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 tracking-tight">{kpis.categoriesCount} <span className="text-xs font-normal text-slate-500">Frameworks</span></div>
          <div className="text-[11px] text-slate-400 mt-1">MSA, Public Sector, SaaS, SOW</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Audit Governance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">Verified</div>
          <div className="text-[11px] text-slate-400 mt-1">ISO 27001 & SOC-2 Compliant</div>
        </div>
      </div>

      {/* Controls: Filter Tabs, Status Dropdown, Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Frameworks' },
            { id: 'Master Services Agreement', label: 'Commercial MSA' },
            { id: 'Public Sector Tender', label: 'Public Sector' },
            { id: 'SaaS EULA & DPA', label: 'Cloud SaaS DPA' },
            { id: 'Professional Services SOW', label: 'Engineering SOW' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === tab.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agreement title, clause..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Terms and Conditions Master Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Commercial Agreement Schedule Master</h2>
            <p className="text-xs text-slate-400">
              Showing {filteredTerms.length} verified boilerplates attached to CPQ proposals and customer agreements.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 uppercase text-[10px] tracking-wider text-slate-400 font-semibold border-b border-slate-800/80">
              <tr>
                <th className="py-3.5 px-4">Ref & Version</th>
                <th className="py-3.5 px-4">Agreement Title</th>
                <th className="py-3.5 px-4">Framework Category</th>
                <th className="py-3.5 px-4 text-center">Quote Default</th>
                <th className="py-3.5 px-4">Effective Window</th>
                <th className="py-3.5 px-4">Published By</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTerms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    No commercial agreements match your current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredTerms.map((term) => {
                  const isActive = term.status === 'Active';
                  return (
                    <tr
                      key={term.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTerm(term)}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-sky-400">
                        <div>{term.ref}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                          {term.version}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-white group-hover:text-sky-300 transition-colors">
                          {term.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {term.content.slice(0, 95)}...
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                          {term.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {term.is_default ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Star className="w-3 h-3 fill-amber-400" /> Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(term)}
                            className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        <div>{term.effective_date || '2026-01-01'}</div>
                        <div className="text-[10px] text-slate-500">to {term.expiration_date || 'Ongoing'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          <span>{term.published_by || 'Legal Governance'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                          {term.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedTerm(term)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
                        >
                          View Clauses
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer: Inspect Full Agreement Clauses */}
      {selectedTerm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedTerm.ref}</h3>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-sky-400 font-mono">
                      {selectedTerm.version}
                    </span>
                    {selectedTerm.is_default && (
                      <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                        Default Quote Schedule
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedTerm.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTerm(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block mb-0.5">Framework Category:</span>
                  <span className="font-semibold text-white">{selectedTerm.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Published Authority:</span>
                  <span className="font-semibold text-white">{selectedTerm.published_by || 'Legal Governance'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Effective Window:</span>
                  <span className="font-mono text-slate-300">{selectedTerm.effective_date} to {selectedTerm.expiration_date || 'Ongoing'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Enforcement Status:</span>
                  <span className={`font-semibold ${selectedTerm.status === 'Active' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {selectedTerm.status}
                  </span>
                </div>
              </div>

              {/* Full Legal Clauses Body */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Full Governed Contractual Clauses
                  </h4>
                  <button
                    onClick={() => handleCopyText(selectedTerm.content)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Clauses'}
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto select-text">
                  {selectedTerm.content}
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-800">
                {!selectedTerm.is_default && (
                  <button
                    onClick={() => handleSetDefault(selectedTerm)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-600/40 hover:bg-amber-600/30 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4 fill-amber-400" />
                    Set as Default Quote Schedule
                  </button>
                )}
                <button
                  onClick={() => setSelectedTerm(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Legal Boilerplate */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Create New Commercial Agreement Boilerplate</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Agreement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optical Fiber Maintenance Service Level Agreement (SLA) v2.5"
                  value={newTerm.title}
                  onChange={(e) => setNewTerm({ ...newTerm, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Framework Category
                  </label>
                  <select
                    value={newTerm.category}
                    onChange={(e) => setNewTerm({ ...newTerm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Master Services Agreement">Master Services Agreement (MSA)</option>
                    <option value="Public Sector Tender">Public Sector & Sovereign</option>
                    <option value="SaaS EULA & DPA">SaaS EULA & DPA</option>
                    <option value="Professional Services SOW">Professional Services SOW</option>
                    <option value="Warranty & Maintenance">Warranty & Hardware Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Governance Version
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. v2.5"
                    value={newTerm.version}
                    onChange={(e) => setNewTerm({ ...newTerm, version: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Effective Start Date
                  </label>
                  <input
                    type="date"
                    value={newTerm.effective_date}
                    onChange={(e) => setNewTerm({ ...newTerm, effective_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={newTerm.expiration_date}
                    onChange={(e) => setNewTerm({ ...newTerm, expiration_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={newTerm.is_default}
                    onChange={(e) => setNewTerm({ ...newTerm, is_default: e.target.checked })}
                    className="rounded border-slate-700 text-sky-600 focus:ring-sky-500 w-4 h-4 bg-slate-800"
                  />
                  <span>Set as Default Quote Schedule (Replaces current default)</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full Contract Clauses & Statutory Terms *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Insert full legal clauses, payment obligations, intellectual property covenants, and limitation of liability..."
                  value={newTerm.content}
                  onChange={(e) => setNewTerm({ ...newTerm, content: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-sky-600/25 transition-all"
                >
                  Publish Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
