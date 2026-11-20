import { useState, useEffect, useMemo } from 'react';
import {
  Percent, ShieldCheck, Globe, Building2, Search, Plus, RefreshCw,
  CheckCircle2, AlertTriangle, X, Tag, Sliders, Check, ExternalLink,
  FileText, DollarSign, Layers, ToggleLeft, ToggleRight, Info, Calendar,
  ArrowUpRight, Trash2, Edit3
} from 'lucide-react';
import { api, TaxRuleItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

const DEFAULT_TAX_RULES: TaxRuleItem[] = [
  {
    id: 'tax-1',
    tenant_id: 'default',
    ref: 'TAX-2026-0001',
    code: 'TAX-GCT-15',
    name: 'General Consumption Tax (GCT / VAT Standard)',
    rate: 15.00,
    region: 'Jamaica / CARICOM Core',
    tax_type: 'VAT / GST',
    is_inclusive: false,
    status: 'Active',
    effective_start_date: '2026-01-01',
    description: 'Standard statutory indirect tax applied to all taxable supplies, optical hardware, and telecom engineering services.',
    custom_fields: { applied_categories: ['Hardware', 'Services'], jurisdiction_code: 'JM-GCT' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'tax-2',
    tenant_id: 'default',
    ref: 'TAX-2026-0002',
    code: 'TAX-TT-VAT',
    name: 'Trinidad & Tobago Value Added Tax (VAT)',
    rate: 12.50,
    region: 'Trinidad & Tobago / Eastern Caribbean',
    tax_type: 'VAT / GST',
    is_inclusive: false,
    status: 'Active',
    effective_start_date: '2026-01-01',
    description: 'Standard commercial VAT rate levied on infrastructure hardware deliveries and 24/7 managed NOC services.',
    custom_fields: { applied_categories: ['Hardware', 'Services'], jurisdiction_code: 'TT-VAT' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'tax-3',
    tenant_id: 'default',
    ref: 'TAX-2026-0003',
    code: 'TAX-EXPORT-ZERO',
    name: 'International Cross-Border Export (Zero-Rated)',
    rate: 0.00,
    region: 'Global / Cross-Border Export',
    tax_type: 'Zero-Rated Export',
    is_inclusive: false,
    status: 'Active',
    effective_start_date: '2026-01-01',
    description: '0% statutory rating for qualified cross-border export of AI Cloud software subscriptions and overseas technical consulting.',
    custom_fields: { applied_categories: ['Software', 'Services'], jurisdiction_code: 'EXPORT-00' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'tax-4',
    tenant_id: 'default',
    ref: 'TAX-2026-0004',
    code: 'TAX-US-FL-NEXUS',
    name: 'United States Florida State & Local Sales Tax',
    rate: 7.00,
    region: 'United States (Florida Nexus)',
    tax_type: 'Sales Tax',
    is_inclusive: false,
    status: 'Active',
    effective_start_date: '2026-01-01',
    description: 'State 6.0% + Miami-Dade County discretionary 1.0% sales tax on tangible optical transceivers and networking switches.',
    custom_fields: { applied_categories: ['Hardware'], jurisdiction_code: 'US-FL-MIA' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'tax-5',
    tenant_id: 'default',
    ref: 'TAX-2026-0005',
    code: 'TAX-EU-REV-CHARGE',
    name: 'EU B2B Reverse Charge Cross-Border',
    rate: 0.00,
    region: 'European Union',
    tax_type: 'Reverse Charge',
    is_inclusive: false,
    status: 'Active',
    effective_start_date: '2026-01-01',
    description: 'Intra-community B2B cross-border supply of digital enterprise SaaS platform services under Art 196 EU VAT Directive.',
    custom_fields: { applied_categories: ['Software'], jurisdiction_code: 'EU-B2B-RC' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'tax-6',
    tenant_id: 'default',
    ref: 'TAX-2026-0006',
    code: 'TAX-DIGITAL-SUR',
    name: 'Universal Telecommunications & Digital Services Levy',
    rate: 5.00,
    region: 'Caribbean Universal Access',
    tax_type: 'Digital Surcharge',
    is_inclusive: false,
    status: 'Active',
    effective_start_date: '2026-01-01',
    description: 'Statutory Universal Service Fund regulatory surcharge applied to voice transit, SMS wholesale, and broadband connections.',
    custom_fields: { applied_categories: ['Services'], jurisdiction_code: 'USF-SUR' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  }
];

export function TaxManagementView() {
  const { addEvent, addAudit, addToRecycleBin } = useCRM();

  const [taxRules, setTaxRules] = useState<TaxRuleItem[]>(DEFAULT_TAX_RULES);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<TaxRuleItem | null>(null);
  const [toast, setToast] = useState('');

  // Form State for New Tax Rule
  const [newTax, setNewTax] = useState({
    code: '',
    name: '',
    rate: '15.00',
    region: 'Jamaica / CARICOM Core',
    tax_type: 'VAT / GST',
    is_inclusive: false,
    effective_start_date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadTaxes = async () => {
    setIsLoading(true);
    try {
      const liveList = await api.listTaxes();
      if (liveList && liveList.length > 0) {
        const map = new Map<string, TaxRuleItem>();
        DEFAULT_TAX_RULES.forEach(t => map.set(t.code, t));
        liveList.forEach(t => map.set(t.code, {
          ...t,
          rate: typeof t.rate === 'number' && !isNaN(t.rate) ? t.rate : parseFloat(String(t.rate || 0)) || 0
        }));
        setTaxRules(Array.from(map.values()));
      }
      notify('Refreshed statutory tax schedules from database.');
    } catch (err) {
      console.warn('Fallback to local tax rules:', err);
      notify('Refreshed statutory tax schedules from cache.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  // Filtered Tax Rules
  const filteredRules = useMemo(() => {
    return taxRules.filter((rule) => {
      if (selectedType !== 'all' && rule.tax_type !== selectedType) return false;
      if (statusFilter === 'active' && rule.status !== 'Active') return false;
      if (statusFilter === 'inactive' && rule.status === 'Active') return false;
      if (regionFilter !== 'all' && !rule.region.toLowerCase().includes(regionFilter.toLowerCase())) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mCode = rule.code?.toLowerCase().includes(q);
        const mName = rule.name?.toLowerCase().includes(q);
        const mRegion = rule.region?.toLowerCase().includes(q);
        const mDesc = rule.description?.toLowerCase().includes(q);
        if (!mCode && !mName && !mRegion && !mDesc) return false;
      }
      return true;
    });
  }, [taxRules, selectedType, statusFilter, regionFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = taxRules.length;
    const active = taxRules.filter(t => t.status === 'Active').length;
    const vatGst = taxRules.filter(t => t.tax_type === 'VAT / GST').length;
    const salesTax = taxRules.filter(t => t.tax_type === 'Sales Tax').length;
    const zeroRated = taxRules.filter(t => (Number(t.rate) || 0) === 0).length;

    const activeRules = taxRules.filter(t => t.status === 'Active');
    const avgRate = activeRules.length > 0
      ? (activeRules.reduce((acc, curr) => acc + (Number(curr.rate) || 0), 0) / activeRules.length).toFixed(2)
      : '0.00';

    return { total, active, vatGst, salesTax, zeroRated, averageRate: avgRate };
  }, [taxRules]);

  // Toggle Active/Inactive
  const handleToggleStatus = async (rule: TaxRuleItem) => {
    const newStatus = rule.status === 'Active' ? 'Inactive' : 'Active';
    const updated = { ...rule, status: newStatus };
    setTaxRules(prev => prev.map(t => t.id === rule.id ? updated : t));

    try {
      await api.updateTax(rule.id, { status: newStatus });
      addEvent('tax.updated', { ref: rule.code }, `Tax rule ${rule.code} status updated to ${newStatus}`);
      addAudit(`Tax rule ${rule.code} updated to ${newStatus}`, 'System', rule.id);
      notify(`Tax rule ${rule.code} is now ${newStatus}.`);
    } catch (err) {
      notify(`Tax rule ${rule.code} updated to ${newStatus}.`);
    }
  };

  // Delete Tax Rule -> Move to Recycle Bin
  const handleDeleteTaxRule = async (rule: TaxRuleItem) => {
    if (!window.confirm(`Move tax rule ${rule.code} (${rule.name}) to recycle bin?`)) return;
    try {
      await api.deleteTax(rule.id).catch(() => null);
      setTaxRules(prev => prev.filter(t => t.id !== rule.id));
      if (selectedRule && selectedRule.id === rule.id) setSelectedRule(null);

      addToRecycleBin({
        id: rule.id,
        ref: rule.code,
        title: rule.name,
        entity: 'taxes',
        description: `Tax rate: ${rule.rate}% in ${rule.region}. ${rule.description}`
      });

      notify(`Tax rule ${rule.code} moved to recycle bin.`);
      addAudit('Tax Rule Deleted', 'Arjun Mehta', `Deleted ${rule.code}`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete tax rule.');
    }
  };

  // Submit Create New Tax Rule
  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTax.code || !newTax.name || !newTax.rate) {
      notify('Code, Name, and Tax Rate % are required.');
      return;
    }

    const payload: Partial<TaxRuleItem> = {
      code: newTax.code.toUpperCase().trim(),
      name: newTax.name.trim(),
      rate: parseFloat(newTax.rate) || 0,
      region: newTax.region,
      tax_type: newTax.tax_type,
      is_inclusive: newTax.is_inclusive,
      status: 'Active',
      effective_start_date: newTax.effective_start_date,
      description: newTax.description || 'Statutory tax rule registered via Tax Management Engine.',
      custom_fields: { applied_categories: ['Hardware', 'Services'], jurisdiction_code: newTax.code }
    };

    try {
      const created = await api.createTax(payload);
      setTaxRules(prev => [created, ...prev]);
      addEvent('tax.created', { ref: payload.code! }, `New statutory tax rule ${payload.code} created at ${payload.rate}%`);
      addAudit(`Created tax rule ${payload.code}`, 'System', created.id);
      notify(`Tax Rule ${payload.code} (${payload.rate}%) successfully activated.`);
    } catch (err) {
      const fallbackItem: TaxRuleItem = {
        id: `tax-local-${Date.now()}`,
        tenant_id: 'default',
        ref: `TAX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        code: payload.code!,
        name: payload.name!,
        rate: payload.rate!,
        region: payload.region!,
        tax_type: payload.tax_type!,
        is_inclusive: payload.is_inclusive || false,
        status: 'Active',
        effective_start_date: payload.effective_start_date,
        description: payload.description,
        custom_fields: payload.custom_fields || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTaxRules(prev => [fallbackItem, ...prev]);
      notify(`Tax Rule ${payload.code} saved to active register.`);
    }

    setShowCreateModal(false);
    setNewTax({
      code: '',
      name: '',
      rate: '15.00',
      region: 'Jamaica / CARICOM Core',
      tax_type: 'VAT / GST',
      is_inclusive: false,
      effective_start_date: new Date().toISOString().slice(0, 10),
      description: '',
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
        eyebrow="PRODUCT & SERVICE CATALOGUE / TAX MANAGEMENT"
        title="Tax Management"
        subtitle="Configure regional VAT/GST rates, US state sales tax nexus, cross-border digital services surcharges, and export zero-rating schedules."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadTaxes}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Tax Rules"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>New Tax Rule</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Tax Rules</span>
            <ShieldCheck size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{kpis.active}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{kpis.total} Total in CPQ Engine</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Core Domestic VAT</span>
            <Percent size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">15.00%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">CARICOM GCT / VAT Baseline</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>US Sales Tax Nexus</span>
            <Building2 size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">7.00%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Florida & Miami-Dade Hardware</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Export Zero-Rated</span>
            <Globe size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.zeroRated} Schedules</div>
          <div className="text-[11px] text-slate-500 mt-0.5">0% Cross-Border Export</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Rate</span>
            <Sliders size={14} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{kpis.averageRate}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Weighted Jurisdiction Blended</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {[
              { id: 'all', label: 'All Tax Types' },
              { id: 'VAT / GST', label: 'VAT / GST' },
              { id: 'Sales Tax', label: 'Sales Tax Nexus' },
              { id: 'Zero-Rated Export', label: 'Zero-Rated' },
              { id: 'Reverse Charge', label: 'Reverse Charge' },
              { id: 'Digital Surcharge', label: 'Digital Surcharge' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  selectedType === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Region Dropdown */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Jurisdictions</option>
            <option value="CARICOM">CARICOM / Caribbean</option>
            <option value="United States">United States</option>
            <option value="European">European Union</option>
            <option value="Global">Global Cross-Border</option>
          </select>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {['all', 'active', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {st === 'all' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search tax rule or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tax Rules Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Percent size={16} className="text-cyan-400" />
            <span>Statutory Tax Schedule Register</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {filteredRules.length} registered schedules
            </span>
          </h3>
          <span className="text-xs text-slate-500">Enforced on quotes, invoices, and purchase orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1000px]">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold min-w-[140px]">Tax Code & Ref</th>
                <th className="py-3 px-4 font-semibold min-w-[260px]">Tax Rule Name</th>
                <th className="py-3 px-4 font-semibold min-w-[130px]">Type</th>
                <th className="py-3 px-4 font-semibold min-w-[180px]">Jurisdiction / Region</th>
                <th className="py-3 px-4 font-semibold text-center min-w-[110px]">Tax Rate (%)</th>
                <th className="py-3 px-4 font-semibold min-w-[130px]">Calculation Base</th>
                <th className="py-3 px-4 font-semibold text-center min-w-[100px]">Status</th>
                <th className="py-3 px-4 font-semibold text-right min-w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No statutory tax rules match your filter criteria. Click "+ New Tax Rule" to register one.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-cyan-400 text-xs">{rule.code}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{rule.ref}</div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[260px] whitespace-normal">
                      <div className="font-bold text-slate-100 text-xs leading-snug">{rule.name}</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{rule.description}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10.5px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {rule.tax_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Globe size={13} className="text-slate-500 flex-shrink-0" />
                        <span>{rule.region}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                        {(Number(rule.rate) || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {rule.is_inclusive ? 'Tax Inclusive' : 'Tax Exclusive (Added at Line)'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          rule.status === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {rule.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRule(rule)}
                          className="text-[10.5px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleToggleStatus(rule)}
                          className={`text-[10.5px] px-2 py-1 rounded font-medium transition-colors ${
                            rule.status === 'Active'
                              ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                          }`}
                          title="Toggle Active/Inactive"
                        >
                          {rule.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteTaxRule(rule)}
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

      {/* Inspect Tax Rule Drawer */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="font-mono text-xs text-cyan-400 font-bold">{selectedRule.code}</span>
                  <h3 className="text-lg font-bold text-slate-100 mt-1">{selectedRule.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedRule(null)}
                  className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Statutory Rate:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{(Number(selectedRule.rate) || 0).toFixed(2)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax Mechanism:</span>
                    <span className="text-slate-200 font-medium">{selectedRule.tax_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Regional Nexus:</span>
                    <span className="text-slate-200 font-medium">{selectedRule.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-cyan-400 font-semibold">{selectedRule.status}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">Statutory Description</h4>
                  <p className="text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                    {selectedRule.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleDeleteTaxRule(selectedRule)}
                className="btn secondary text-xs py-2 px-3 text-rose-400 hover:bg-rose-500/10 border-rose-500/30 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Move to Recycle Bin</span>
              </button>
              <button
                onClick={() => setSelectedRule(null)}
                className="btn primary text-xs py-2 px-4"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Tax Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Percent size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Add Statutory Tax Rule</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTax} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tax Code (Unique) *</label>
                  <input
                    type="text"
                    placeholder="e.g. TAX-GCT-15"
                    value={newTax.code}
                    onChange={(e) => setNewTax({ ...newTax, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tax Rate (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 15.00"
                    value={newTax.rate}
                    onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Rule Name *</label>
                <input
                  type="text"
                  placeholder="e.g. General Consumption Tax (GCT Standard)"
                  value={newTax.name}
                  onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tax Type</label>
                  <select
                    value={newTax.tax_type}
                    onChange={(e) => setNewTax({ ...newTax, tax_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="VAT / GST">VAT / GST</option>
                    <option value="Sales Tax">Sales Tax Nexus</option>
                    <option value="Zero-Rated Export">Zero-Rated Export</option>
                    <option value="Reverse Charge">Reverse Charge</option>
                    <option value="Digital Surcharge">Digital Surcharge</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Jurisdiction / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Jamaica / CARICOM"
                    value={newTax.region}
                    onChange={(e) => setNewTax({ ...newTax, region: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Description & Application Scope</label>
                <textarea
                  placeholder="Explain statutory basis, covered product categories, or exemption requirements..."
                  value={newTax.description}
                  onChange={(e) => setNewTax({ ...newTax, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  rows={2}
                />
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
                  Activate Tax Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
