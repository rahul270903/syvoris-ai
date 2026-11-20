import { useState, useEffect, useMemo } from 'react';
import {
  PackageCheck, Search, Plus, RefreshCw, ShieldCheck, Tag,
  Trash2, DollarSign, Layers, CheckCircle2, ChevronDown, ChevronRight,
  X, Boxes, Sparkles, Percent, FileCheck
} from 'lucide-react';
import { api, ProductBundleItem, BundleComponentItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

const DEFAULT_BUNDLES: ProductBundleItem[] = [
  {
    id: 'bnd-1',
    tenant_id: 'default',
    ref: 'BND-001',
    bundle_code: 'BND-AI-ENTERPRISE',
    name: 'Enterprise AI & Autonomous Operations Suite',
    description: 'Complete autonomous CRM intelligence stack, core platform licensing, 5x agent worker seats, and dedicated implementation onboarding pack.',
    pricing_model: 'Fixed Package',
    bundle_price: 55887.50,
    discount_pct: 15.00,
    currency: 'USD',
    status: 'Active',
    is_active: true,
    custom_fields: {},
    created_at: '2026-11-01',
    updated_at: '2026-11-01',
    components: [
      {
        id: 'cmp-1',
        tenant_id: 'default',
        bundle_id: 'bnd-1',
        component_type: 'Product',
        item_name: 'Enterprise AI Cloud Core Subscription (Annual)',
        sku_or_code: 'SYV-CORE-ENT',
        quantity: 1,
        unit_price: 8500.00,
        discount_pct: 15.00,
        is_optional: false,
        sort_order: 1,
        created_at: '2026-11-01',
        updated_at: '2026-11-01'
      },
      {
        id: 'cmp-2',
        tenant_id: 'default',
        bundle_id: 'bnd-1',
        component_type: 'Product',
        item_name: 'Predictive Sales & Revenue Intelligence Module',
        sku_or_code: 'SYV-REV-INT',
        quantity: 1,
        unit_price: 35000.00,
        discount_pct: 15.00,
        is_optional: false,
        sort_order: 2,
        created_at: '2026-11-01',
        updated_at: '2026-11-01'
      },
      {
        id: 'cmp-3',
        tenant_id: 'default',
        bundle_id: 'bnd-1',
        component_type: 'Product',
        item_name: 'AI Autonomous Agent Worker Seat (Monthly)',
        sku_or_code: 'SYV-AI-SEAT',
        quantity: 5,
        unit_price: 450.00,
        discount_pct: 15.00,
        is_optional: false,
        sort_order: 3,
        created_at: '2026-11-01',
        updated_at: '2026-11-01'
      },
      {
        id: 'cmp-4',
        tenant_id: 'default',
        bundle_id: 'bnd-1',
        component_type: 'Service',
        item_name: 'Enterprise Implementation & Integration Pack',
        sku_or_code: 'SYV-SVC-IMP',
        quantity: 1,
        unit_price: 20000.00,
        discount_pct: 15.00,
        is_optional: false,
        sort_order: 4,
        created_at: '2026-11-01',
        updated_at: '2026-11-01'
      }
    ]
  },
  {
    id: 'bnd-2',
    tenant_id: 'default',
    ref: 'BND-002',
    bundle_code: 'BND-METRO-FIBER',
    name: 'High-Capacity Metro Optical & Routing Kit',
    description: 'Turnkey carrier-grade metro ring kit with armored fiber reel, core routing gateway, high-density access switch, and full OTDR splicing.',
    pricing_model: 'Fixed Package',
    bundle_price: 109836.00,
    discount_pct: 10.00,
    currency: 'USD',
    status: 'Active',
    is_active: true,
    custom_fields: {},
    created_at: '2026-11-02',
    updated_at: '2026-11-02',
    components: [
      {
        id: 'cmp-5',
        tenant_id: 'default',
        bundle_id: 'bnd-2',
        component_type: 'Product',
        item_name: 'Single-Mode 96-Core Armored Fiber Cable (1000m)',
        sku_or_code: 'FBR-96-ARMORED',
        quantity: 1,
        unit_price: 2450.00,
        discount_pct: 10.00,
        is_optional: false,
        sort_order: 1,
        created_at: '2026-11-02',
        updated_at: '2026-11-02'
      },
      {
        id: 'cmp-6',
        tenant_id: 'default',
        bundle_id: 'bnd-2',
        component_type: 'Product',
        item_name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch',
        sku_or_code: 'NCT-CISCO-9300',
        quantity: 1,
        unit_price: 4890.00,
        discount_pct: 10.00,
        is_optional: false,
        sort_order: 2,
        created_at: '2026-11-02',
        updated_at: '2026-11-02'
      },
      {
        id: 'cmp-7',
        tenant_id: 'default',
        bundle_id: 'bnd-2',
        component_type: 'Product',
        item_name: 'Nokia 7750 Service Router Edge Gateway',
        sku_or_code: 'NCT-NOKIA-7750',
        quantity: 1,
        unit_price: 12500.00,
        discount_pct: 10.00,
        is_optional: false,
        sort_order: 3,
        created_at: '2026-11-02',
        updated_at: '2026-11-02'
      },
      {
        id: 'cmp-8',
        tenant_id: 'default',
        bundle_id: 'bnd-2',
        component_type: 'Service',
        item_name: 'Fiber Installation, Splicing & OTDR Testing',
        sku_or_code: 'SVC-INSTALL',
        quantity: 1,
        unit_price: 102200.00,
        discount_pct: 10.00,
        is_optional: false,
        sort_order: 4,
        created_at: '2026-11-02',
        updated_at: '2026-11-02'
      }
    ]
  },
  {
    id: 'bnd-3',
    tenant_id: 'default',
    ref: 'BND-003',
    bundle_code: 'BND-CYBER-NOC',
    name: 'Turnkey Zero-Trust & 24/7 Managed NOC Security',
    description: 'Proactive cybersecurity monitoring, encrypted optical transceivers, enterprise architecture design, and 24/7 incident response SLA.',
    pricing_model: 'Fixed Package',
    bundle_price: 19360.00,
    discount_pct: 12.00,
    currency: 'USD',
    status: 'Active',
    is_active: true,
    custom_fields: {},
    created_at: '2026-11-03',
    updated_at: '2026-11-03',
    components: [
      {
        id: 'cmp-9',
        tenant_id: 'default',
        bundle_id: 'bnd-3',
        component_type: 'Product',
        item_name: 'Audit Fiber Optical Transceiver (10G SFP+ LR)',
        sku_or_code: 'AUDIT-PRD-TRANS',
        quantity: 4,
        unit_price: 500.00,
        discount_pct: 12.00,
        is_optional: false,
        sort_order: 1,
        created_at: '2026-11-03',
        updated_at: '2026-11-03'
      },
      {
        id: 'cmp-10',
        tenant_id: 'default',
        bundle_id: 'bnd-3',
        component_type: 'Service',
        item_name: 'Enterprise Cloud & Network Architecture Design',
        sku_or_code: 'SVC-ARCH',
        quantity: 40,
        unit_price: 220.00,
        discount_pct: 12.00,
        is_optional: false,
        sort_order: 2,
        created_at: '2026-11-03',
        updated_at: '2026-11-03'
      },
      {
        id: 'cmp-11',
        tenant_id: 'default',
        bundle_id: 'bnd-3',
        component_type: 'Service',
        item_name: '24/7 Managed NOC & Incident Response Retainer',
        sku_or_code: 'SVC-NOC-247',
        quantity: 1,
        unit_price: 8500.00,
        discount_pct: 12.00,
        is_optional: false,
        sort_order: 3,
        created_at: '2026-11-03',
        updated_at: '2026-11-03'
      }
    ]
  },
  {
    id: 'bnd-4',
    tenant_id: 'default',
    ref: 'BND-004',
    bundle_code: 'BND-SMART-FLEET',
    name: 'IoT Logistics Telematics & Cloud Connector Pack',
    description: 'Hardware telematics gateway integration, SAP ERP connector synchronization, and on-site driver portal setup.',
    pricing_model: 'Fixed Package',
    bundle_price: 48500.00,
    discount_pct: 11.80,
    currency: 'USD',
    status: 'Active',
    is_active: true,
    custom_fields: {},
    created_at: '2026-11-04',
    updated_at: '2026-11-04',
    components: [
      {
        id: 'cmp-12',
        tenant_id: 'default',
        bundle_id: 'bnd-4',
        component_type: 'Product',
        item_name: 'Nokia 7750 Service Router Edge Gateway',
        sku_or_code: 'NCT-NOKIA-7750',
        quantity: 1,
        unit_price: 12500.00,
        discount_pct: 11.80,
        is_optional: false,
        sort_order: 1,
        created_at: '2026-11-04',
        updated_at: '2026-11-04'
      },
      {
        id: 'cmp-13',
        tenant_id: 'default',
        bundle_id: 'bnd-4',
        component_type: 'Service',
        item_name: 'Database & Workload Zero-Downtime Migration Pack',
        sku_or_code: 'SVC-MIG-ZERO',
        quantity: 1,
        unit_price: 25000.00,
        discount_pct: 11.80,
        is_optional: false,
        sort_order: 2,
        created_at: '2026-11-04',
        updated_at: '2026-11-04'
      }
    ]
  }
];

export function BundlesCatalogView() {
  const { addEvent, addAudit, addToRecycleBin } = useCRM();

  const [bundles, setBundles] = useState<ProductBundleItem[]>(DEFAULT_BUNDLES);
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>('bnd-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadBundles = async () => {
    setIsLoading(true);
    try {
      const liveList = await api.listBundles();
      if (liveList && liveList.length > 0) {
        const map = new Map<string, ProductBundleItem>();
        DEFAULT_BUNDLES.forEach(b => map.set(b.bundle_code, b));
        liveList.forEach(b => map.set(b.bundle_code || b.id, b));
        setBundles(Array.from(map.values()));
      }
      notify('Refreshed commercial bundles from database.');
    } catch (err) {
      console.warn('Fallback to default bundles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBundles();
  }, []);

  // Form State for New Bundle
  const [newBnd, setNewBnd] = useState({
    bundle_code: '',
    name: '',
    description: '',
    bundle_price: '',
    discount_pct: '12.0',
    pricing_model: 'Fixed Package',
  });

  // Filtered Bundles
  const filteredBundles = useMemo(() => {
    return bundles.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mCode = b.bundle_code?.toLowerCase().includes(q);
        const mName = b.name?.toLowerCase().includes(q);
        const mDesc = b.description?.toLowerCase().includes(q);
        const mRef = b.ref?.toLowerCase().includes(q);
        if (!mCode && !mName && !mDesc && !mRef) return false;
      }
      return true;
    });
  }, [bundles, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = bundles.length;
    const active = bundles.filter(b => b.is_active).length;
    const totalRevenuePipeline = bundles.reduce((acc, b) => acc + (Number(b.bundle_price) || 0), 0);
    const avgDiscount = total > 0
      ? Math.round(bundles.reduce((acc, b) => acc + (Number(b.discount_pct) || 0), 0) / total)
      : 13;
    const totalComponents = bundles.reduce((acc, b) => acc + (b.components?.length || 0), 0);

    return { total, active, totalRevenuePipeline, avgDiscount, totalComponents };
  }, [bundles]);

  // Create Bundle Handler
  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBnd.name.trim() || !newBnd.bundle_code.trim() || !newBnd.bundle_price) {
      notify('Bundle name, code and bundle price are required.');
      return;
    }

    try {
      const created = await api.createBundle({
        bundle_code: newBnd.bundle_code.trim().toUpperCase(),
        name: newBnd.name.trim(),
        description: newBnd.description.trim() || 'Pre-packaged commercial solution bundle.',
        bundle_price: parseFloat(newBnd.bundle_price),
        discount_pct: parseFloat(newBnd.discount_pct || '12.0'),
        pricing_model: newBnd.pricing_model,
        currency: 'USD',
        status: 'Active',
        is_active: true,
        custom_fields: {},
      });

      const enriched: ProductBundleItem = {
        ...created,
        components: [
          {
            id: `cmp-${Date.now()}`,
            tenant_id: 'default',
            bundle_id: created.id,
            component_type: 'Product',
            item_name: 'Enterprise AI Cloud Core Subscription (Annual)',
            sku_or_code: 'SYV-CORE-ENT',
            quantity: 1,
            unit_price: 8500.00,
            discount_pct: 12.00,
            is_optional: false,
            sort_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      };

      setBundles(prev => [enriched, ...prev]);
      setShowCreateModal(false);
      addEvent('catalog.bundle_created', { ref: created.bundle_code }, `Created bundle ${created.name}`);
      addAudit('Bundle Created', 'Arjun Mehta', `Created bundle ${created.bundle_code} (${created.name})`);
      notify(`Bundle "${created.name}" created successfully.`);

      setNewBnd({
        bundle_code: '',
        name: '',
        description: '',
        bundle_price: '',
        discount_pct: '12.0',
        pricing_model: 'Fixed Package',
      });
    } catch (err: any) {
      notify(err.message || 'Failed to create bundle.');
    }
  };

  // Toggle Active/Inactive
  const handleToggleStatus = async (b: ProductBundleItem) => {
    const nextStatus = b.is_active ? 'Draft' : 'Active';
    try {
      await api.updateBundle(b.id, {
        status: nextStatus,
        is_active: !b.is_active
      });
      setBundles(prev => prev.map(item => item.id === b.id ? { ...item, status: nextStatus, is_active: !b.is_active } : item));
      notify(`Bundle ${b.bundle_code} set to ${nextStatus}.`);
      addAudit('Bundle Status Changed', 'Arjun Mehta', `${b.bundle_code} marked ${nextStatus}`);
    } catch (err: any) {
      notify(err.message || 'Failed to update bundle status.');
    }
  };

  // Delete Bundle & Move to Recycle Bin
  const handleDeleteBundle = async (bundle: ProductBundleItem) => {
    if (!window.confirm(`Are you sure you want to delete bundle ${bundle.bundle_code}? It will be moved to the Recycle Bin.`)) return;
    try {
      try {
        await api.deleteBundle(bundle.id);
      } catch (e) {
        console.warn('API deleteBundle fallback to store:', e);
      }
      addToRecycleBin({
        id: bundle.id,
        ref: bundle.bundle_code || bundle.ref,
        title: bundle.name,
        entity: 'bundles',
        description: bundle.description,
        fields: {
          code: bundle.bundle_code,
          price: bundle.bundle_price,
          discount_pct: bundle.discount_pct,
          pricing_model: bundle.pricing_model,
          originalEntity: 'bundles'
        }
      });
      setBundles(prev => prev.filter(b => b.id !== bundle.id));
      notify(`Bundle ${bundle.bundle_code} moved to Recycle Bin.`);
      addAudit('Bundle Moved to Recycle Bin', 'Arjun Mehta', `Deleted bundle ${bundle.bundle_code}`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete bundle.');
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
        eyebrow="PRODUCT & SERVICE CATALOGUE / BUNDLES"
        title="Commercial Solution Bundles"
        subtitle="Pre-packaged multi-product bundles, packaged solutions, combined hardware + service kits, and automated discount rollups."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadBundles}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Bundles"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>New Bundle</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Commercial Bundles</span>
            <PackageCheck size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{kpis.active} active for quotes</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Bundle Savings</span>
            <Percent size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.avgDiscount}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Automated discount</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Packaged Pipeline</span>
            <DollarSign size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            ${Math.round(kpis.totalRevenuePipeline).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Combined bundle value</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Component SKUs</span>
            <Boxes size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{kpis.totalComponents}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Products & services</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>CPQ Engine Ready</span>
            <CheckCircle2 size={14} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-1">Active</div>
          <div className="text-[11px] text-slate-500 mt-0.5">1-click quote injection</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="text-xs text-slate-400">
          Click any bundle card to expand the complete list of bundled hardware, software, and services with individual price rollups.
        </div>
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search bundle code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Bundles List */}
      <div className="space-y-4">
        {filteredBundles.map((b) => {
          const isExpanded = expandedBundleId === b.id;
          const componentTotal = (b.components || []).reduce((acc, c) => acc + (Number(c.unit_price) * (c.quantity || 1)), 0);
          const savings = componentTotal - Number(b.bundle_price);

          return (
            <div
              key={b.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all"
            >
              {/* Bundle Header */}
              <div
                onClick={() => setExpandedBundleId(isExpanded ? null : b.id)}
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 mt-0.5">
                    <PackageCheck size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{b.bundle_code}</span>
                      <span className="text-slate-600">·</span>
                      <h4 className="text-base font-bold text-slate-100">{b.name}</h4>
                      <StatusPill status={b.status} />
                      <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                        {b.discount_pct}% Discount
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500">Package Price</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      ${Number(b.bundle_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {componentTotal > 0 && (
                      <div className="text-[10px] text-slate-400">
                        List: <span className="line-through">${componentTotal.toLocaleString()}</span> (Save ${Math.round(savings).toLocaleString()})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(b)}
                      className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded font-medium transition-colors"
                    >
                      {b.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteBundle(b)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      title="Move to Recycle Bin"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setExpandedBundleId(isExpanded ? null : b.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-200"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Components Accordion */}
              {isExpanded && (
                <div className="bg-slate-950/70 border-t border-slate-800/80 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Boxes size={14} className="text-cyan-400" />
                      Bundled Components ({b.components?.length || 0} items)
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Configured in SYVORIS CPQ Calculation Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-1 divide-y divide-slate-800/60 bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
                    {(b.components || []).map((cmp) => (
                      <div key={cmp.id} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-cyan-400 font-bold w-32 truncate">
                            {cmp.sku_or_code}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-200">{cmp.item_name}</div>
                            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700/60">
                              {cmp.component_type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 font-mono">
                          <span className="text-slate-400 text-xs">Qty: <strong className="text-slate-200">{cmp.quantity}</strong></span>
                          <span className="text-slate-400 text-xs">Unit: ${Number(cmp.unit_price).toLocaleString()}</span>
                          <span className="text-emerald-400 font-bold text-xs">
                            Total: ${(Number(cmp.unit_price) * cmp.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Bundle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Create Solution Bundle</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBundle} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Bundle Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. BND-AI-SECURE"
                    value={newBnd.bundle_code}
                    onChange={(e) => setNewBnd({ ...newBnd, bundle_code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Pricing Model *</label>
                  <select
                    value={newBnd.pricing_model}
                    onChange={(e) => setNewBnd({ ...newBnd, pricing_model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Fixed Package">Fixed Package Price</option>
                    <option value="Component-based">Component-based Sum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Bundle Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Autonomous Security Operations Bundle"
                  value={newBnd.name}
                  onChange={(e) => setNewBnd({ ...newBnd, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Package Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45000.00"
                    value={newBnd.bundle_price}
                    onChange={(e) => setNewBnd({ ...newBnd, bundle_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Discount %</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.0"
                    value={newBnd.discount_pct}
                    onChange={(e) => setNewBnd({ ...newBnd, discount_pct: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Commercial Scope & Target Accounts</label>
                <textarea
                  rows={2}
                  placeholder="Describe value proposition, included hardware, software licenses and services..."
                  value={newBnd.description}
                  onChange={(e) => setNewBnd({ ...newBnd, description: e.target.value })}
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
                  <span>Create Bundle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
