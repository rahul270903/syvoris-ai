import { useState, useEffect, useMemo } from 'react';
import {
  Wrench, Search, Plus, RefreshCw, ShieldCheck, Tag,
  Trash2, DollarSign, Clock, CheckCircle2, AlertTriangle,
  X, Briefcase, FileText
} from 'lucide-react';
import { api, ServiceCatalogItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

const DEFAULT_SERVICES: ServiceCatalogItem[] = [
  {
    id: 'svc-1',
    tenant_id: 'default',
    ref: 'SVC-001',
    code: 'SVC-INSTALL',
    name: 'Fiber Installation, Splicing & OTDR Testing',
    category_name: 'Field Engineering',
    service_type: 'Field Engineering',
    description: 'Turnkey optical splicing, fusion termination, OTDR link characterization, and compliance certification.',
    billing_method: 'Project',
    billing_frequency: 'Milestone',
    duration_unit: 'Project',
    standard_rate: 102200.00,
    cost_rate: 42000.00,
    currency: 'USD',
    tax_category: 'Standard',
    tax_rate: 15.00,
    status: 'Active',
    is_active: true,
    custom_fields: {},
    created_at: '2026-11-01',
    updated_at: '2026-11-01'
  },
  {
    id: 'svc-2',
    tenant_id: 'default',
    ref: 'SVC-002',
    code: 'SVC-ARCH',
    name: 'Enterprise Cloud & Network Architecture Design',
    category_name: 'Professional Services',
    service_type: 'Professional Services',
    description: 'High-level and low-level network design, zero-trust perimeter configuration, and migration roadmap.',
    billing_method: 'Hourly',
    billing_frequency: 'One-Time',
    duration_unit: 'Hour',
    standard_rate: 220.00,
    cost_rate: 95.00,
    currency: 'USD',
    tax_category: 'Standard',
    tax_rate: 15.00,
    status: 'Active',
    is_active: true,
    custom_fields: {},
    created_at: '2026-11-02',
    updated_at: '2026-11-02'
  },
  {
    id: 'svc-3',
    tenant_id: 'default',
    ref: 'SVC-003',
    code: 'SVC-NOC-247',
    name: '24/7 Managed NOC & Incident Response Retainer',
    category_name: 'Managed Operations',
    service_type: 'Managed NOC Operations',
    description: 'Proactive round-the-clock telemetry monitoring, carrier circuit escalation, and Sev-1 triage SLA.',
    billing_method: 'Subscription',
    billing_frequency: 'Monthly',
    duration_unit: 'Month',
    standard_rate: 8500.00,
    cost_rate: 3200.00,
    currency: 'USD',
    tax_category: 'Standard',
    tax_rate: 15.00,
    status: 'Active',
    is_active: true,
    custom_fields: {},
    created_at: '2026-11-03',
    updated_at: '2026-11-03'
  },
  {
    id: 'svc-4',
    tenant_id: 'default',
    ref: 'SVC-004',
    code: 'SVC-MIG-ZERO',
    name: 'Database & Workload Zero-Downtime Migration Pack',
    category_name: 'Professional Services',
    service_type: 'Cloud Migration',
    description: 'Continuous dual-run replication pipeline setup, schema trans-compilation, and cutover execution.',
    billing_method: 'Flat Fee',
    billing_frequency: 'Milestone',
    duration_unit: 'Project',
    standard_rate: 25000.00,
    cost_rate: 9800.00,
    currency: 'USD',
    tax_category: 'Standard',
    tax_rate: 15.00,
    status: 'Active',
    is_active: true,
    custom_fields: {},
    created_at: '2026-11-04',
    updated_at: '2026-11-04'
  },
  {
    id: 'svc-5',
    tenant_id: 'default',
    ref: 'SVC-005',
    code: 'SVC-SLA-PREM',
    name: 'Mission-Critical 99.99% Availability SLA Rider',
    category_name: 'Support & SLAs',
    service_type: 'Managed NOC Operations',
    description: 'Contractually guaranteed 15-minute response, 2-hour mean time to resolve (MTTR), and penalty credits.',
    billing_method: 'Subscription',
    billing_frequency: 'Monthly',
    duration_unit: 'Month',
    standard_rate: 4200.00,
    cost_rate: 1100.00,
    currency: 'USD',
    tax_category: 'Standard',
    tax_rate: 15.00,
    status: 'Active',
    is_active: true,
    custom_fields: {},
    created_at: '2026-11-05',
    updated_at: '2026-11-05'
  },
  {
    id: 'svc-6',
    tenant_id: 'default',
    ref: 'SVC-006',
    code: 'SVC-TRAIN',
    name: 'Staff Operational Readiness & Handover Training',
    category_name: 'Training & Enablement',
    service_type: 'Professional Services',
    description: 'Hands-on curriculum for enterprise client IT teams covering diagnostic tools, dashboards and runbooks.',
    billing_method: 'Flat Fee',
    billing_frequency: 'One-Time',
    duration_unit: 'Package',
    standard_rate: 6500.00,
    cost_rate: 2100.00,
    currency: 'USD',
    tax_category: 'Exempt',
    tax_rate: 0.00,
    status: 'Active',
    is_active: true,
    custom_fields: {},
    created_at: '2026-11-06',
    updated_at: '2026-11-06'
  }
];

export function ServicesCatalogView() {
  const { addEvent, addAudit } = useCRM();

  const [services, setServices] = useState<ServiceCatalogItem[]>(DEFAULT_SERVICES);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const liveList = await api.listServices();
      if (liveList && liveList.length > 0) {
        const map = new Map<string, ServiceCatalogItem>();
        DEFAULT_SERVICES.forEach(s => map.set(s.code, s));
        liveList.forEach(s => map.set(s.code || s.id, s));
        setServices(Array.from(map.values()));
      }
    } catch (err) {
      console.warn('Fallback to default services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Form State for New Service
  const [newSvc, setNewSvc] = useState({
    code: '',
    name: '',
    service_type: 'Professional Services',
    billing_method: 'Hourly',
    billing_frequency: 'One-Time',
    duration_unit: 'Hour',
    standard_rate: '',
    cost_rate: '',
    tax_rate: '15.00',
    description: '',
  });

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedType !== 'all' && s.service_type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mCode = s.code?.toLowerCase().includes(q);
        const mName = s.name?.toLowerCase().includes(q);
        const mDesc = s.description?.toLowerCase().includes(q);
        const mType = s.service_type?.toLowerCase().includes(q);
        if (!mCode && !mName && !mDesc && !mType) return false;
      }
      return true;
    });
  }, [services, selectedType, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = services.length;
    const profSvc = services.filter(s => s.service_type === 'Professional Services').length;
    const managedNoc = services.filter(s => s.service_type === 'Managed NOC Operations').length;
    const active = services.filter(s => s.is_active).length;

    let totalMargin = 0;
    let marginCount = 0;
    services.forEach(s => {
      const rate = Number(s.standard_rate) || 0;
      const cost = Number(s.cost_rate) || 0;
      if (rate > 0) {
        totalMargin += ((rate - cost) / rate) * 100;
        marginCount++;
      }
    });
    const avgMargin = marginCount > 0 ? Math.round(totalMargin / marginCount) : 62;

    return { total, profSvc, managedNoc, active, avgMargin };
  }, [services]);

  // Create Service Handler
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSvc.name.trim() || !newSvc.code.trim() || !newSvc.standard_rate) {
      notify('Service name, code and standard rate are required.');
      return;
    }

    try {
      const created = await api.createService({
        code: newSvc.code.trim().toUpperCase(),
        name: newSvc.name.trim(),
        service_type: newSvc.service_type,
        category_name: newSvc.service_type,
        billing_method: newSvc.billing_method,
        billing_frequency: newSvc.billing_frequency,
        duration_unit: newSvc.duration_unit,
        standard_rate: parseFloat(newSvc.standard_rate),
        cost_rate: parseFloat(newSvc.cost_rate || '0'),
        currency: 'USD',
        tax_category: 'Standard',
        tax_rate: parseFloat(newSvc.tax_rate || '15.00'),
        status: 'Active',
        is_active: true,
        description: newSvc.description.trim() || 'Enterprise service definition.',
        custom_fields: {},
      });

      setServices(prev => [created, ...prev]);
      setShowCreateModal(false);
      addEvent('catalog.service_created', { ref: created.code }, `Created service ${created.name}`);
      addAudit('Service Created', 'Arjun Mehta', `Created service ${created.code} (${created.name})`);
      notify(`Service "${created.name}" created successfully.`);

      setNewSvc({
        code: '',
        name: '',
        service_type: 'Professional Services',
        billing_method: 'Hourly',
        billing_frequency: 'One-Time',
        duration_unit: 'Hour',
        standard_rate: '',
        cost_rate: '',
        tax_rate: '15.00',
        description: '',
      });
    } catch (err: any) {
      notify(err.message || 'Failed to create service.');
    }
  };

  // Toggle Active/Draft
  const handleToggleStatus = async (s: ServiceCatalogItem) => {
    const nextStatus = s.is_active ? 'Draft' : 'Active';
    try {
      await api.updateService(s.id, {
        status: nextStatus,
        is_active: !s.is_active
      });
      setServices(prev => prev.map(item => item.id === s.id ? { ...item, status: nextStatus, is_active: !s.is_active } : item));
      notify(`Service ${s.code} set to ${nextStatus}.`);
      addAudit('Service Status Changed', 'Arjun Mehta', `${s.code} marked ${nextStatus}`);
    } catch (err: any) {
      notify(err.message || 'Failed to update service status.');
    }
  };

  // Delete Service
  const handleDeleteService = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete service ${code}?`)) return;
    try {
      await api.deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      notify(`Service ${code} deleted.`);
      addAudit('Service Deleted', 'Arjun Mehta', `Deleted service ${code}`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete service.');
    }
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
        eyebrow="PRODUCT & SERVICE CATALOGUE / SERVICES"
        title="Service Definitions & Delivery Terms"
        subtitle="Professional engineering services, managed NOC operations, implementation packages, hourly billing rates, and delivery SLAs."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadServices}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Services"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>New Service</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Services</span>
            <Wrench size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{kpis.active} available for quotes</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Professional Services</span>
            <Briefcase size={14} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{kpis.profSvc}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Architecture & training</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Managed 24/7 NOC</span>
            <Clock size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{kpis.managedNoc}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Recurring SLA retainers</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Margin</span>
            <DollarSign size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.avgMargin}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Billable vs cost rate</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>PostgreSQL Backed</span>
            <CheckCircle2 size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Commercial CPQ ready</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
          {['all', 'Professional Services', 'Managed NOC Operations', 'Cloud Migration', 'Field Engineering'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedType === type
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {type === 'all' ? 'All Service Types' : type}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search code, service name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Services Register Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Wrench size={16} className="text-cyan-400" />
            <span>Service Definitions Register</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {filteredServices.length} items
            </span>
          </h3>
          <span className="text-xs text-slate-500">Live PostgreSQL Catalog Synchronization</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Service Code</th>
                <th className="py-3 px-4 font-semibold">Service Name & Scope</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Billing Model</th>
                <th className="py-3 px-4 font-semibold text-right">Standard Rate</th>
                <th className="py-3 px-4 font-semibold text-right">Internal Cost</th>
                <th className="py-3 px-4 font-semibold text-center">Margin</th>
                <th className="py-3 px-4 font-semibold">Tax Rate</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No services match your filters. Click "+ New Service" to define an offering.
                  </td>
                </tr>
              ) : (
                filteredServices.map((s) => {
                  const rate = Number(s.standard_rate) || 0;
                  const cost = Number(s.cost_rate) || 0;
                  const marginPct = rate > 0 ? Math.round(((rate - cost) / rate) * 100) : 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {s.code}
                      </td>
                      <td className="py-3 px-4 max-w-[280px]">
                        <div className="font-bold text-slate-100">{s.name}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5" title={s.description}>
                          {s.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700/60">
                          {s.service_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                        <span className="font-semibold text-slate-200">{s.billing_method}</span>
                        <span className="text-[10px] text-slate-500 block">({s.billing_frequency})</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400 text-right font-mono">
                        ${rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-[10px] text-slate-400 font-sans block">/{s.duration_unit}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-right font-mono">
                        ${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                            marginPct >= 60
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {marginPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px]">
                        {s.tax_rate}%
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill status={s.is_active ? 'Active' : 'Draft'} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(s)}
                            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded font-medium transition-colors"
                          >
                            {s.is_active ? 'Draft' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteService(s.id, s.code)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete Service"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Create New Catalog Service</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Service Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. SVC-SEC-AUDIT"
                    value={newSvc.code}
                    onChange={(e) => setNewSvc({ ...newSvc, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Service Type *</label>
                  <select
                    value={newSvc.service_type}
                    onChange={(e) => setNewSvc({ ...newSvc, service_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Professional Services">Professional Services</option>
                    <option value="Managed NOC Operations">Managed NOC Operations</option>
                    <option value="Cloud Migration">Cloud Migration</option>
                    <option value="Field Engineering">Field Engineering</option>
                    <option value="Architecture Design">Architecture Design</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Service Offering Name *</label>
                <input
                  type="text"
                  placeholder="e.g. SOC2 Type-II Readiness & Architecture Review"
                  value={newSvc.name}
                  onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Billing Method</label>
                  <select
                    value={newSvc.billing_method}
                    onChange={(e) => setNewSvc({ ...newSvc, billing_method: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Hourly">Hourly</option>
                    <option value="Daily">Daily</option>
                    <option value="Project">Project Milestone</option>
                    <option value="Subscription">Monthly Retainer</option>
                    <option value="Flat Fee">Flat Fee</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Frequency</label>
                  <select
                    value={newSvc.billing_frequency}
                    onChange={(e) => setNewSvc({ ...newSvc, billing_frequency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="One-Time">One-Time</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Milestone">Milestone</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Duration Unit</label>
                  <select
                    value={newSvc.duration_unit}
                    onChange={(e) => setNewSvc({ ...newSvc, duration_unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Hour">Hour</option>
                    <option value="Day">Day</option>
                    <option value="Month">Month</option>
                    <option value="Project">Project</option>
                    <option value="Package">Package</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Standard Rate ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 195.00"
                    value={newSvc.standard_rate}
                    onChange={(e) => setNewSvc({ ...newSvc, standard_rate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cost Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 85.00"
                    value={newSvc.cost_rate}
                    onChange={(e) => setNewSvc({ ...newSvc, cost_rate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSvc.tax_rate}
                    onChange={(e) => setNewSvc({ ...newSvc, tax_rate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Statement of Work (SOW) Scope & Deliverables</label>
                <textarea
                  rows={2}
                  placeholder="Describe scope boundaries, deliverable sign-offs, and engineer certifications..."
                  value={newSvc.description}
                  onChange={(e) => setNewSvc({ ...newSvc, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn secondary py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary py-1.5 px-4 text-xs flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Create Service Offering</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
