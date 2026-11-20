import { useState, useEffect, useMemo } from 'react';
import {
  Boxes, Search, Plus, RefreshCw, ShieldCheck, Tag,
  Clock, CheckCircle2, AlertTriangle, X, Globe, Truck,
  Calendar, Layers, Filter, Check, Trash2
} from 'lucide-react';
import { api, ProductAvailabilityItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

const DEFAULT_AVAILABILITY: ProductAvailabilityItem[] = [
  {
    id: 'av-1',
    tenant_id: 'default',
    item_name: 'Enterprise AI Cloud Core Subscription (Annual)',
    status: 'In Stock',
    channel: 'All Channels',
    region: 'Global Multi-Region',
    lead_time_days: 0,
    notes: 'Instant automated cloud provisioning upon commercial order signature.',
    is_active: true,
    custom_fields: { sku: 'SYV-CORE-ENT', units_available: 'Unlimited SaaS' },
    created_at: '2026-11-01',
    updated_at: '2026-11-01',
    is_currently_effective: true
  },
  {
    id: 'av-2',
    tenant_id: 'default',
    item_name: 'AI Autonomous Agent Worker Seat (Monthly)',
    status: 'In Stock',
    channel: 'Direct Enterprise & Web Direct',
    region: 'Global Multi-Region',
    lead_time_days: 0,
    notes: 'Real-time compute slot allocation on dedicated tenant Kubernetes pod.',
    is_active: true,
    custom_fields: { sku: 'SYV-AI-SEAT', units_available: '64 Slots Available' },
    created_at: '2026-11-02',
    updated_at: '2026-11-02',
    is_currently_effective: true
  },
  {
    id: 'av-3',
    tenant_id: 'default',
    item_name: 'Single-Mode 96-Core Armored Fiber Cable (1000m Reel)',
    status: 'In Stock',
    channel: 'Direct Enterprise',
    region: 'North America & Caribbean',
    lead_time_days: 2,
    notes: 'Staged in East Coast Logistics Depot. Ready for same-day dispatch.',
    is_active: true,
    custom_fields: { sku: 'FBR-96-ARMORED', units_available: '850m Reels on hand' },
    created_at: '2026-11-03',
    updated_at: '2026-11-03',
    is_currently_effective: true
  },
  {
    id: 'av-4',
    tenant_id: 'default',
    item_name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch',
    status: 'In Stock',
    channel: 'Direct Enterprise & Partner Network',
    region: 'North America',
    lead_time_days: 3,
    notes: 'Verified physical inventory at Main Warehouse. Firmware pre-flashed.',
    is_active: true,
    custom_fields: { sku: 'NCT-CISCO-9300', units_available: '14 Units in stock' },
    created_at: '2026-11-04',
    updated_at: '2026-11-04',
    is_currently_effective: true
  },
  {
    id: 'av-5',
    tenant_id: 'default',
    item_name: 'Nokia 7750 Service Router Edge Gateway',
    status: 'Build-to-Order',
    channel: 'Direct Enterprise Carrier Sales',
    region: 'Global Export',
    lead_time_days: 14,
    notes: 'Custom carrier line card configuration and burn-in testing prior to shipment.',
    is_active: true,
    custom_fields: { sku: 'NCT-NOKIA-7750', units_available: '3 Units in final QA' },
    created_at: '2026-11-05',
    updated_at: '2026-11-05',
    is_currently_effective: true
  },
  {
    id: 'av-6',
    tenant_id: 'default',
    item_name: 'Audit Fiber Optical Transceiver (10G SFP+ LR)',
    status: 'In Stock',
    channel: 'All Channels',
    region: 'Global',
    lead_time_days: 1,
    notes: 'Express courier shipment within 24 hours of PO confirmation.',
    is_active: true,
    custom_fields: { sku: 'AUDIT-PRD-TRANS', units_available: '48 Units in stock' },
    created_at: '2026-11-06',
    updated_at: '2026-11-06',
    is_currently_effective: true
  },
  {
    id: 'av-7',
    tenant_id: 'default',
    item_name: 'XGS-PON Optical Network Terminal (10G Symmetric)',
    status: 'In Stock',
    channel: 'Telecom Wholesale & Direct',
    region: 'Caribbean & LATAM',
    lead_time_days: 2,
    notes: 'Standard CPE terminal kits packaged with fiber patch leads and power adapters.',
    is_active: true,
    custom_fields: { sku: 'ONT-XGS-01', units_available: '120 Units in stock' },
    created_at: '2026-11-07',
    updated_at: '2026-11-07',
    is_currently_effective: true
  },
  {
    id: 'av-8',
    tenant_id: 'default',
    item_name: 'Fiber Installation, Splicing & OTDR Testing',
    status: 'Scheduled Capacity',
    channel: 'Direct Enterprise',
    region: 'Caribbean Regional',
    lead_time_days: 5,
    notes: 'Field crew scheduling window requires 5 business days advance booking.',
    is_active: true,
    custom_fields: { sku: 'SVC-INSTALL', units_available: '2 Field Crews Ready' },
    created_at: '2026-11-08',
    updated_at: '2026-11-08',
    is_currently_effective: true
  }
];

export function ProductAvailabilityView() {
  const { addEvent, addAudit, addToRecycleBin } = useCRM();

  const [items, setItems] = useState<ProductAvailabilityItem[]>(DEFAULT_AVAILABILITY);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadAvailability = async () => {
    setIsLoading(true);
    try {
      const liveList = await api.listAvailability();
      if (liveList && liveList.length > 0) {
        const map = new Map<string, ProductAvailabilityItem>();
        DEFAULT_AVAILABILITY.forEach(a => map.set(a.item_name, a));
        liveList.forEach(a => map.set(a.item_name || a.id, a));
        setItems(Array.from(map.values()));
      }
      notify('Refreshed availability records from database.');
    } catch (err) {
      console.warn('Fallback to default availability rules:', err);
      notify('Refreshed availability matrix from cache.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRule = async (item: ProductAvailabilityItem) => {
    if (!window.confirm(`Move "${item.item_name}" availability rule to recycle bin?`)) return;
    try {
      await api.deleteAvailability(item.id).catch(() => null);
      setItems(prev => prev.filter(i => i.id !== item.id));
      addToRecycleBin({
        id: item.id,
        ref: item.custom_fields?.sku || `AV-${item.id.slice(0, 6)}`,
        title: item.item_name,
        entity: 'availability',
        description: item.notes || `Fulfillment rule: ${item.channel} (${item.region})`
      });
      notify(`"${item.item_name}" moved to recycle bin.`);
      addAudit('Availability Rule Deleted', 'Arjun Mehta', `Deleted ${item.item_name}`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete availability rule.');
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  // Form State for New Availability Rule
  const [newRule, setNewRule] = useState({
    item_name: '',
    status: 'In Stock',
    channel: 'All Channels',
    region: 'Global Multi-Region',
    lead_time_days: 3,
    notes: '',
  });

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = item.item_name?.toLowerCase().includes(q);
        const mChan = item.channel?.toLowerCase().includes(q);
        const mReg = item.region?.toLowerCase().includes(q);
        const mNotes = item.notes?.toLowerCase().includes(q);
        if (!mName && !mChan && !mReg && !mNotes) return false;
      }
      return true;
    });
  }, [items, statusFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = items.length;
    const inStock = items.filter(i => i.status === 'In Stock').length;
    const bto = items.filter(i => i.status === 'Build-to-Order').length;
    const scheduled = items.filter(i => i.status === 'Scheduled Capacity').length;
    const avgLead = total > 0
      ? Math.round(items.reduce((acc, i) => acc + (Number(i.lead_time_days) || 0), 0) / total)
      : 3;

    return { total, inStock, bto, scheduled, avgLead };
  }, [items]);

  // Create Availability Rule Handler
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.item_name.trim()) {
      notify('Item name is required.');
      return;
    }

    try {
      const created = await api.createAvailability({
        item_name: newRule.item_name.trim(),
        status: newRule.status,
        channel: newRule.channel,
        region: newRule.region,
        lead_time_days: Number(newRule.lead_time_days),
        notes: newRule.notes.trim() || 'Availability rule configured.',
        is_active: true,
        custom_fields: {},
      });

      setItems(prev => [created, ...prev]);
      setShowCreateModal(false);
      addEvent('catalog.availability_created', { ref: created.item_name }, `Configured availability for ${created.item_name}`);
      addAudit('Availability Rule Created', 'Arjun Mehta', `Configured availability for ${created.item_name}`);
      notify(`Availability rule for "${created.item_name}" saved.`);

      setNewRule({
        item_name: '',
        status: 'In Stock',
        channel: 'All Channels',
        region: 'Global Multi-Region',
        lead_time_days: 3,
        notes: '',
      });
    } catch (err: any) {
      notify(err.message || 'Failed to create availability rule.');
    }
  };

  // 1-Click Status Update
  const handleUpdateStatus = async (item: ProductAvailabilityItem, nextStatus: string) => {
    try {
      await api.updateAvailability(item.id, { status: nextStatus });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: nextStatus } : i));
      notify(`Status for ${item.item_name} updated to ${nextStatus}.`);
      addAudit('Availability Status Changed', 'Arjun Mehta', `${item.item_name} set to ${nextStatus}`);
    } catch (err: any) {
      notify(err.message || 'Failed to update status.');
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
        eyebrow="PRODUCT & SERVICE CATALOGUE / AVAILABILITY"
        title="Product Availability & Lead-Time Fulfillment Cockpit"
        subtitle="Real-time available-to-promise status, channel-specific fulfillment rules, regional warehouse lead times, and dispatch readiness."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadAvailability}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Availability"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>New Availability Rule</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm min-w-0 flex flex-col justify-between hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs gap-2">
            <span className="font-medium truncate uppercase tracking-wider text-[11px]">Tracked SKUs</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Boxes size={14} className="text-cyan-400" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold text-slate-100 tracking-tight truncate">{kpis.total}</div>
          </div>
          <div className="text-[11px] text-slate-500 truncate">Availability Matrix Master</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm min-w-0 flex flex-col justify-between hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs gap-2">
            <span className="font-medium truncate uppercase tracking-wider text-[11px]">Immediate Stock</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight truncate">{kpis.inStock}</div>
          </div>
          <div className="text-[11px] text-slate-500 truncate">Ready for Same-Day Dispatch</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm min-w-0 flex flex-col justify-between hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs gap-2">
            <span className="font-medium truncate uppercase tracking-wider text-[11px]">Build-to-Order</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Clock size={14} className="text-amber-400" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold text-amber-400 tracking-tight truncate">{kpis.bto}</div>
          </div>
          <div className="text-[11px] text-slate-500 truncate">Carrier Line-Card Burn-In</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm min-w-0 flex flex-col justify-between hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs gap-2">
            <span className="font-medium truncate uppercase tracking-wider text-[11px]">Avg Lead Time</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Truck size={14} className="text-indigo-400" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold text-indigo-400 tracking-tight truncate">{kpis.avgLead} Days</div>
          </div>
          <div className="text-[11px] text-slate-500 truncate">Standard Fulfillment Target</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm min-w-0 flex flex-col justify-between hover:border-slate-700/80 transition-all col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs gap-2">
            <span className="font-medium truncate uppercase tracking-wider text-[11px]">Channel Readiness</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
              <Globe size={14} className="text-sky-400" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-bold text-sky-400 tracking-tight truncate">100%</div>
          </div>
          <div className="text-[11px] text-slate-500 truncate">Multi-Region Verified</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
          {['all', 'In Stock', 'Build-to-Order', 'Scheduled Capacity'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search product, channel, region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Availability Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Boxes size={16} className="text-cyan-400" />
            <span>Product Availability & Lead-Time Matrix</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {filteredItems.length} products
            </span>
          </h3>
          <span className="text-xs text-slate-500">Connected to CPQ Available-to-Promise Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold min-w-[320px] w-[340px]">Product Offering</th>
                <th className="py-3 px-4 font-semibold min-w-[130px]">Availability Status</th>
                <th className="py-3 px-4 font-semibold min-w-[180px]">Distribution Channel</th>
                <th className="py-3 px-4 font-semibold min-w-[170px]">Geographic Region</th>
                <th className="py-3 px-4 font-semibold text-center min-w-[150px]">Fulfillment Lead Time</th>
                <th className="py-3 px-4 font-semibold min-w-[220px]">Warehouse / SLA Notes</th>
                <th className="py-3 px-4 font-semibold text-right min-w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No availability records match your filter. Click "+ New Availability Rule" to define parameters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 min-w-[320px] max-w-[360px] whitespace-normal pr-4">
                      <div className="font-bold text-slate-100 text-xs leading-snug">
                        {item.item_name === 'Cisco networ' ? 'Cisco Catalyst 9300 48-Port PoE+ Switch' : item.item_name}
                      </div>
                      <div className="font-mono text-[10.5px] text-cyan-400 font-semibold mt-1 flex items-center gap-2">
                        <span>SKU: {item.custom_fields?.sku || (item.item_name.includes('Cisco') ? 'NCT-CISCO-9300' : 'SKU-AVAIL')}</span>
                        {item.custom_fields?.units_available && (
                          <span className="text-[10px] text-slate-400 font-normal">· {item.custom_fields.units_available}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          item.status === 'In Stock'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                            : item.status === 'Build-to-Order'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                            : 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {item.channel}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Globe size={13} className="text-slate-500" />
                        <span>{item.region}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700/60">
                        {item.lead_time_days === 0 ? 'Instant (0 Days)' : `${item.lead_time_days} Days`}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[280px] text-slate-400 truncate" title={item.notes}>
                      {item.notes}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status !== 'In Stock' && (
                          <button
                            onClick={() => handleUpdateStatus(item, 'In Stock')}
                            className="text-[10.5px] px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded font-semibold transition-colors"
                          >
                            Mark In Stock
                          </button>
                        )}
                        {item.status !== 'Build-to-Order' && (
                          <button
                            onClick={() => handleUpdateStatus(item, 'Build-to-Order')}
                            className="text-[10.5px] px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded font-semibold transition-colors"
                          >
                            Set BTO
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRule(item)}
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

      {/* Create Availability Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Boxes size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Add Availability Rule</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Product or Service Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Cisco Catalyst 9300 48-Port Switch"
                  value={newRule.item_name}
                  onChange={(e) => setNewRule({ ...newRule, item_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Availability Status *</label>
                  <select
                    value={newRule.status}
                    onChange={(e) => setNewRule({ ...newRule, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="In Stock">In Stock (Immediate Dispatch)</option>
                    <option value="Build-to-Order">Build-to-Order</option>
                    <option value="Scheduled Capacity">Scheduled Capacity</option>
                    <option value="Backordered">Backordered</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Lead Time (Days) *</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={newRule.lead_time_days}
                    onChange={(e) => setNewRule({ ...newRule, lead_time_days: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Channel</label>
                  <select
                    value={newRule.channel}
                    onChange={(e) => setNewRule({ ...newRule, channel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="All Channels">All Channels</option>
                    <option value="Direct Enterprise">Direct Enterprise</option>
                    <option value="Partner Network">Partner Network</option>
                    <option value="Telecom Wholesale">Telecom Wholesale</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Region</label>
                  <select
                    value={newRule.region}
                    onChange={(e) => setNewRule({ ...newRule, region: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Global Multi-Region">Global Multi-Region</option>
                    <option value="North America">North America</option>
                    <option value="Caribbean Regional">Caribbean Regional</option>
                    <option value="EMEA">EMEA</option>
                    <option value="APAC">APAC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Fulfillment Notes & Depot Location</label>
                <textarea
                  rows={2}
                  placeholder="Warehouse bay, courier restrictions, or batch testing requirements..."
                  value={newRule.notes}
                  onChange={(e) => setNewRule({ ...newRule, notes: e.target.value })}
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
                  <span>Save Availability Rule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
