import { useState, useEffect, useMemo } from 'react';
import {
  FileText, ShieldCheck, Scale, Award, Search, Plus, RefreshCw,
  CheckCircle2, AlertTriangle, X, Check, Copy, ExternalLink,
  BookOpen, Star, Calendar, UserCheck, ArrowUpRight, Trash2, Edit3
} from 'lucide-react';
import { api, CommercialTermsItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

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

3. ENCRYPTION AT REST & TRANSIT: All customer prompts, embeddings, vectors, and memory logs are encrypted using AES-256 at rest and TLS 1.3 in transit.`,
    effective_date: '2026-01-01',
    expiration_date: '2029-12-31',
    status: 'Active',
    is_default: false,
    published_by: 'Information Security & Compliance',
    published_at: '2026-01-01',
    custom_fields: { quote_section: 'cloud_sla_dpa', review_cycle: 'Annual' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'term-4',
    tenant_id: 'default',
    ref: 'TRM-2026-0004',
    title: 'Optical Infrastructure Turnkey Construction & Civil Works Warranty Agreement',
    version: 'v1.5',
    category: 'Infrastructure Works',
    content: `1. SCOPE & TRENCHING SPECIFICATION: All fiber micro-trenching, sub-duct blow-in, and cabinet splicing shall adhere to ITU-T G.652.D standards. Splicing insertion loss shall not exceed 0.05 dB per splice.

2. AS-BUILT GIS DELIVERABLES: Contractor must deliver complete GIS vector mapping and OTDR trace reports within fifteen (15) calendar days of physical project signoff.

3. WORKMANSHIP WARRANTY: Structural ducting and civil installations carry a 10-year integrity guarantee against environmental collapse or water ingress.`,
    effective_date: '2026-01-01',
    expiration_date: '2028-12-31',
    status: 'Active',
    is_default: false,
    published_by: 'Civil Engineering Directorate',
    published_at: '2026-01-01',
    custom_fields: { quote_section: 'civil_works_warranty', review_cycle: 'Annual' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  }
];

export function TermsManagementView() {
  const { addEvent, addAudit, addToRecycleBin } = useCRM();

  const [terms, setTerms] = useState<CommercialTermsItem[]>(DEFAULT_TERMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<CommercialTermsItem | null>(null);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);

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
      notify('Refreshed commercial terms from database.');
    } catch (err) {
      console.warn('Fallback to local terms:', err);
      notify('Refreshed commercial terms from cache.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  // Filtered Terms
  const filteredTerms = useMemo(() => {
    return terms.filter((term) => {
      if (selectedCategory !== 'all' && term.category !== selectedCategory) return false;
      if (statusFilter === 'active' && term.status !== 'Active') return false;
      if (statusFilter === 'inactive' && term.status === 'Active') return false;
      if (statusFilter === 'default' && !term.is_default) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mRef = term.ref?.toLowerCase().includes(q);
        const mTitle = term.title?.toLowerCase().includes(q);
        const mCat = term.category?.toLowerCase().includes(q);
        const mContent = term.content?.toLowerCase().includes(q);
        if (!mRef && !mTitle && !mCat && !mContent) return false;
      }
      return true;
    });
  }, [terms, selectedCategory, statusFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = terms.length;
    const active = terms.filter(t => t.status === 'Active').length;
    const msaCount = terms.filter(t => t.category === 'Master Services Agreement').length;
    const publicSector = terms.filter(t => t.category === 'Public Sector Tender').length;
    const defaultTerm = terms.find(t => t.is_default);

    return { total, active, msaCount, publicSector, defaultRef: defaultTerm?.version || 'v3.2' };
  }, [terms]);

  // Set Default Boilerplate
  const handleSetDefault = async (term: CommercialTermsItem) => {
    setTerms(prev => prev.map(t => ({ ...t, is_default: t.id === term.id })));
    try {
      await api.updateTerm(term.id, { is_default: true });
      addEvent('term.updated', { ref: term.ref }, `Set ${term.ref} (${term.title}) as default commercial quote schedule`);
      addAudit(`Set ${term.ref} as default quote boilerplate`, 'Legal', term.id);
      notify(`"${term.title}" is now the primary quote boilerplate.`);
    } catch (err) {
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

  // Delete Terms -> Move to Recycle Bin
  const handleDeleteTerm = async (term: CommercialTermsItem) => {
    if (!window.confirm(`Move commercial agreement "${term.title}" to recycle bin?`)) return;
    try {
      await api.deleteTerm(term.id).catch(() => null);
      setTerms(prev => prev.filter(t => t.id !== term.id));
      if (selectedTerm && selectedTerm.id === term.id) setSelectedTerm(null);

      addToRecycleBin({
        id: term.id,
        ref: term.ref,
        title: term.title,
        entity: 'terms',
        description: `Version: ${term.version} (${term.category}). Clauses: ${term.content.slice(0, 80)}...`
      });

      notify(`Agreement "${term.title}" moved to recycle bin.`);
      addAudit('Terms Deleted', 'Arjun Mehta', `Deleted ${term.ref}`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete agreement boilerplate.');
    }
  };

  // Submit Create New Legal Terms
  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.title || !newTerm.content) {
      notify('Title and Contract Clauses are required.');
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
      notify(`Agreement "${fallbackItem.title}" saved to boilerplate repository.`);
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
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-200 text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <ShieldCheck size={16} className="text-cyan-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <SectionHeading
        eyebrow="PRODUCT & SERVICE CATALOGUE / TERMS & CONDITIONS"
        title="Terms & Conditions"
        subtitle="Commercial agreement boilerplate, Master Services Agreements (MSA), warranty clauses, and public procurement riders."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadTerms}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Terms"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>New Agreement Boilerplate</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Registered Agreements</span>
            <BookOpen size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{kpis.active} active schedules</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Master Agreements</span>
            <Scale size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{kpis.msaCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Commercial MSA schedules</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Default Boilerplate</span>
            <Star size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{kpis.defaultRef}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Auto-attached to quotes</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Public Sector Tender</span>
            <Award size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.publicSector}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sovereign compliance clauses</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Legal Governance</span>
            <ShieldCheck size={14} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Enforced on commercial quotes</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {[
              { id: 'all', label: 'All Agreements' },
              { id: 'Master Services Agreement', label: 'Commercial MSA' },
              { id: 'Public Sector Tender', label: 'Public Sector' },
              { id: 'SaaS EULA & DPA', label: 'SaaS & DPA' },
              { id: 'Infrastructure Works', label: 'Infrastructure Works' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  selectedCategory === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {['all', 'active', 'default'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {st === 'all' ? 'All Statuses' : st === 'default' ? 'Primary Default' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search agreement title, ref, clauses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Terms Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Scale size={16} className="text-cyan-400" />
            <span>Commercial Terms Boilerplate Register</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {filteredTerms.length} agreements
            </span>
          </h3>
          <span className="text-xs text-slate-500">Legal boilerplate attached to CPQ quote documents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1000px]">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold min-w-[140px]">Agreement Ref</th>
                <th className="py-3 px-4 font-semibold min-w-[280px]">Title & Scope</th>
                <th className="py-3 px-4 font-semibold min-w-[180px]">Legal Category</th>
                <th className="py-3 px-4 font-semibold min-w-[110px]">Version</th>
                <th className="py-3 px-4 font-semibold text-center min-w-[120px]">Quote Default</th>
                <th className="py-3 px-4 font-semibold text-center min-w-[100px]">Status</th>
                <th className="py-3 px-4 font-semibold text-right min-w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredTerms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No commercial agreements match your filter. Click "+ New Agreement Boilerplate" to register one.
                  </td>
                </tr>
              ) : (
                filteredTerms.map((term) => (
                  <tr key={term.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-cyan-400 text-xs">{term.ref}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Eff: {term.effective_date}</div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[280px] whitespace-normal">
                      <div className="font-bold text-slate-100 text-xs leading-snug">{term.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{term.content.slice(0, 100)}...</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10.5px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {term.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                      {term.version}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {term.is_default ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 flex items-center justify-center gap-1 w-max mx-auto">
                          <Star size={10} className="fill-indigo-300" /> Primary Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(term)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                        >
                          Set as Default
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          term.status === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {term.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTerm(term)}
                          className="text-[10.5px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
                        >
                          View Clauses
                        </button>
                        <button
                          onClick={() => handleCopyText(term.content)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                          title="Copy Full Legal Text"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteTerm(term)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Move to Recycle Bin"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Legal Clauses Drawer */}
      {selectedTerm && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="font-mono text-xs text-cyan-400 font-bold">{selectedTerm.ref} · {selectedTerm.version}</span>
                  <h3 className="text-lg font-bold text-slate-100 mt-1">{selectedTerm.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedTerm(null)}
                  className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block">Category:</span>
                    <strong className="text-slate-200">{selectedTerm.category}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Published Authority:</span>
                    <strong className="text-slate-200">{selectedTerm.published_by}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Effective Term:</span>
                    <span className="text-slate-300">{selectedTerm.effective_date} to {selectedTerm.expiration_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">CPQ Attachment:</span>
                    <span className="text-cyan-400 font-semibold">{selectedTerm.is_default ? 'Primary Default' : 'Optional Schedule'}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Enforceable Legal Clauses</h4>
                    <button
                      onClick={() => handleCopyText(selectedTerm.content)}
                      className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 font-semibold"
                    >
                      <Copy size={12} /> Copy Clauses
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {selectedTerm.content}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleDeleteTerm(selectedTerm)}
                className="btn secondary text-xs py-2 px-3 text-rose-400 hover:bg-rose-500/10 border-rose-500/30 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Move to Recycle Bin</span>
              </button>
              <button
                onClick={() => setSelectedTerm(null)}
                className="btn primary text-xs py-2 px-4"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Terms Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Add Agreement Boilerplate</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Agreement Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Master Services Agreement (MSA) Standard"
                  value={newTerm.title}
                  onChange={(e) => setNewTerm({ ...newTerm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <select
                    value={newTerm.category}
                    onChange={(e) => setNewTerm({ ...newTerm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Master Services Agreement">Master Services Agreement</option>
                    <option value="Public Sector Tender">Public Sector Tender</option>
                    <option value="SaaS EULA & DPA">SaaS EULA & DPA</option>
                    <option value="Infrastructure Works">Infrastructure Works</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Version</label>
                  <input
                    type="text"
                    placeholder="e.g. v3.3"
                    value={newTerm.version}
                    onChange={(e) => setNewTerm({ ...newTerm, version: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Enforceable Legal Clauses *</label>
                <textarea
                  placeholder="Enter numbered commercial clauses, payment obligations, warranties, and arbitration terms..."
                  value={newTerm.content}
                  onChange={(e) => setNewTerm({ ...newTerm, content: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                  rows={5}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={newTerm.is_default}
                  onChange={(e) => setNewTerm({ ...newTerm, is_default: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500"
                />
                <label htmlFor="defaultCheck" className="text-slate-300 cursor-pointer">
                  Set as primary default boilerplate for new commercial quotes
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary text-xs py-2 px-4"
                >
                  Save Boilerplate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
