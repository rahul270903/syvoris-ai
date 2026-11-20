import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, ShieldCheck, Award, Star, Search, Plus, RefreshCw,
  CheckCircle2, AlertTriangle, X, Phone, Mail, FileText,
  DollarSign, PackageCheck, Truck, ExternalLink, ArrowUpRight,
  Layers, ShoppingCart
} from 'lucide-react';
import { api, VendorProfileItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

interface VendorExtended {
  id: string;
  tenant_id: string;
  ref: string;
  account_id: string;
  account_name?: string;
  account_email?: string;
  account_phone?: string;
  account_city?: string;
  vendor_code: string;
  vendor_category: string;
  payment_terms: string;
  tax_id?: string;
  rating: number;
  status: string;
  compliance_notes?: string;
  contact_person: string;
  sourced_skus: { sku: string; name: string; unit_cost: number }[];
  active_po_value: number;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_VENDORS: VendorExtended[] = [
  {
    id: 'vnd-1',
    tenant_id: 'default',
    ref: 'VND-2026-0001',
    account_id: 'acc-vnd-0001',
    account_name: 'Cisco Systems Commercial Latin America & Caribbean',
    account_email: 'mvance@cisco.partner.com',
    account_phone: '+1 (305) 555-0199',
    account_city: 'Miami, FL / Caribbean Region',
    vendor_code: 'VND-CISCO-01',
    vendor_category: 'Hardware OEM',
    payment_terms: 'Net 30 Commercial',
    tax_id: 'US-EIN-77-0123984',
    rating: 4.9,
    status: 'Preferred Tier-1',
    compliance_notes: 'ISO 9001:2015, SOC 2 Type II, TAA Compliant Enterprise Hardware Distribution Agreement.',
    contact_person: 'Marcus Vance · Enterprise Partner Director',
    sourced_skus: [
      { sku: 'NCT-CISCO-9300', name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch', unit_cost: 2950.00 }
    ],
    active_po_value: 68400.00,
  },
  {
    id: 'vnd-2',
    tenant_id: 'default',
    ref: 'VND-2026-0002',
    account_id: 'acc-vnd-0002',
    account_name: 'Nokia Networks Enterprise & Carrier Core',
    account_email: 'erostova@nokia.com',
    account_phone: '+358 10 4488 000',
    account_city: 'Espoo / Miami Regional Office',
    vendor_code: 'VND-NOKIA-02',
    vendor_category: 'Carrier Routing Core',
    payment_terms: 'Net 45 Commercial',
    tax_id: 'FI-VAT-0112038-9',
    rating: 4.8,
    status: 'Preferred Tier-1',
    compliance_notes: 'NEBS Level 3, MEF 3.0 Certified, Carrier-Grade Reliability Master Agreement.',
    contact_person: 'Elena Rostova · VP Carrier Accounts',
    sourced_skus: [
      { sku: 'NCT-NOKIA-7750', name: 'Nokia 7750 Service Router Edge Gateway', unit_cost: 8200.00 }
    ],
    active_po_value: 45000.00,
  },
  {
    id: 'vnd-3',
    tenant_id: 'default',
    ref: 'VND-2026-0003',
    account_id: 'acc-vnd-0003',
    account_name: 'Corning Optical Communications Ltd',
    account_email: 'dsterling@corning.com',
    account_phone: '+1 (828) 901-5000',
    account_city: 'Charlotte, NC / Caribbean Depot',
    vendor_code: 'VND-CORNING-03',
    vendor_category: 'Optical Fiber Infrastructure',
    payment_terms: '2/10 Net 30',
    tax_id: 'US-EIN-16-0393410',
    rating: 4.9,
    status: 'Preferred Tier-1',
    compliance_notes: 'Telcordia GR-20 Single-Mode Fiber Standards, RoHS Compliant, Direct Master Supply Agreement.',
    contact_person: 'David Sterling · Regional Director Telecom Infrastructure',
    sourced_skus: [
      { sku: 'FBR-96-ARMORED', name: 'Single-Mode 96-Core Armored Fiber Cable (1000m Reel)', unit_cost: 1100.00 },
      { sku: 'OPT-SFP-100G', name: '100G QSFP28 LR4 Optical Transceiver (10km)', unit_cost: 210.00 }
    ],
    active_po_value: 29100.00,
  },
  {
    id: 'vnd-4',
    tenant_id: 'default',
    ref: 'VND-2026-0004',
    account_id: 'acc-vnd-0004',
    account_name: 'Fujikura Optical Technologies Inc',
    account_email: 'ktanaka@fujikura.co.jp',
    account_phone: '+81 3 5606 1112',
    account_city: 'Tokyo / Regional Americas',
    vendor_code: 'VND-FUJIKURA-04',
    vendor_category: 'Test & Measurement Equipment',
    payment_terms: 'Net 30 Commercial',
    tax_id: 'JP-CORP-9010001034',
    rating: 4.7,
    status: 'Active',
    compliance_notes: 'JIS C 5961, CE Mark, Precision Fiber Optic Splicing Master Licensee.',
    contact_person: 'Kenji Tanaka · Field Systems Lead',
    sourced_skus: [
      { sku: 'OPT-FUSION-KIT', name: 'Precision Core-Alignment Optical Fusion Splicer Kit', unit_cost: 3400.00 }
    ],
    active_po_value: 0.00,
  }
];

export function VendorsCatalogView() {
  const navigate = useNavigate();
  const { addEvent, addAudit } = useCRM();

  const [vendors, setVendors] = useState<VendorExtended[]>(DEFAULT_VENDORS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorExtended | null>(null);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const liveList = await api.listVendors();
      if (liveList && liveList.length > 0) {
        const map = new Map<string, VendorExtended>();
        DEFAULT_VENDORS.forEach(v => map.set(v.vendor_code || v.ref, v));
        liveList.forEach(v => {
          const key = v.vendor_code || v.ref || v.id;
          const existing = map.get(key) || ({} as VendorExtended);
          const parsedRating = typeof v.rating === 'number' && !isNaN(v.rating)
            ? v.rating
            : parseFloat(String(v.rating || '4.8')) || 4.8;
          map.set(key, {
            ...existing,
            ...v,
            rating: parsedRating,
            contact_person: existing.contact_person || v.account_email || 'Assigned Vendor Rep',
            sourced_skus: existing.sourced_skus || [],
            active_po_value: Number(existing.active_po_value || (v as any).active_po_value || 0)
          });
        });
        setVendors(Array.from(map.values()));
      }
    } catch (err) {
      console.warn('Load vendors fallback to default catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  // Form State for New Vendor
  const [newVendor, setNewVendor] = useState({
    account_name: '',
    vendor_code: '',
    vendor_category: 'Hardware OEM',
    payment_terms: 'Net 30 Commercial',
    account_email: '',
    account_phone: '',
    account_city: 'Kingston / Miami Logistics Hub',
    tax_id: '',
    rating: '4.8',
    status: 'Active',
    compliance_notes: 'Standard enterprise supplier verification passed.',
  });

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      if (selectedCategory !== 'all' && v.vendor_category !== selectedCategory) return false;
      if (statusFilter === 'preferred' && !v.status.includes('Preferred')) return false;
      if (statusFilter === 'active' && !v.status.includes('Active')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = (v.account_name || '').toLowerCase().includes(q);
        const mCode = (v.vendor_code || '').toLowerCase().includes(q);
        const mCat = (v.vendor_category || '').toLowerCase().includes(q);
        const mContact = (v.contact_person || '').toLowerCase().includes(q);
        const mSkus = (v.sourced_skus || []).some(s => s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
        if (!mName && !mCode && !mCat && !mContact && !mSkus) return false;
      }
      return true;
    });
  }, [vendors, selectedCategory, statusFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = vendors.length;
    const preferred = vendors.filter(v => v.status.includes('Preferred')).length;
    const avgRating = (vendors.reduce((acc, v) => acc + (Number(v.rating) || 4.5), 0) / (vendors.length || 1)).toFixed(1);
    const totalPOValue = vendors.reduce((acc, v) => acc + (Number(v.active_po_value) || 0), 0);
    const totalSourcedSKUs = vendors.reduce((acc, v) => acc + (v.sourced_skus || []).length, 0);

    return { total, preferred, avgRating, totalPOValue, totalSourcedSKUs };
  }, [vendors]);

  // Submit Create New Vendor
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.account_name || !newVendor.vendor_code) {
      alert('Please fill in Company Name and Vendor Code.');
      return;
    }

    const payload: Partial<VendorProfileItem> = {
      account_name: newVendor.account_name.trim(),
      vendor_code: newVendor.vendor_code.toUpperCase().trim(),
      vendor_category: newVendor.vendor_category,
      payment_terms: newVendor.payment_terms,
      account_email: newVendor.account_email.trim(),
      account_phone: newVendor.account_phone.trim(),
      account_city: newVendor.account_city,
      tax_id: newVendor.tax_id.trim(),
      rating: parseFloat(newVendor.rating) || 4.5,
      status: newVendor.status,
      compliance_notes: newVendor.compliance_notes,
    };

    try {
      const created = await api.createVendor(payload);
      const newExt: VendorExtended = {
        ...created,
        contact_person: created.account_email || 'Commercial Supplier Lead',
        sourced_skus: [],
        active_po_value: 0
      };
      setVendors(prev => [newExt, ...prev]);
      addEvent('vendor.created', { ref: newExt.vendor_code }, `Registered new commercial supplier ${newExt.account_name}`);
      addAudit(`Created supplier ${newExt.vendor_code}`, 'Procurement', created.id);
      notify(`Vendor "${newExt.account_name}" successfully registered.`);
    } catch (err) {
      console.warn('API create fallback:', err);
      const fallbackExt: VendorExtended = {
        id: `vnd-local-${Date.now()}`,
        tenant_id: 'default',
        ref: `VND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        account_id: `acc-vnd-${Date.now()}`,
        account_name: payload.account_name!,
        vendor_code: payload.vendor_code!,
        vendor_category: payload.vendor_category!,
        payment_terms: payload.payment_terms!,
        account_email: payload.account_email,
        account_phone: payload.account_phone,
        account_city: payload.account_city,
        tax_id: payload.tax_id,
        rating: payload.rating || 4.5,
        status: payload.status || 'Active',
        compliance_notes: payload.compliance_notes,
        contact_person: payload.account_email || 'Commercial Supplier Lead',
        sourced_skus: [],
        active_po_value: 0,
      };
      setVendors(prev => [fallbackExt, ...prev]);
      notify(`Vendor "${fallbackExt.account_name}" saved to local directory.`);
    }

    setShowCreateModal(false);
    setNewVendor({
      account_name: '',
      vendor_code: '',
      vendor_category: 'Hardware OEM',
      payment_terms: 'Net 30 Commercial',
      account_email: '',
      account_phone: '',
      account_city: 'Kingston / Miami Logistics Hub',
      tax_id: '',
      rating: '4.8',
      status: 'Active',
      compliance_notes: 'Standard enterprise supplier verification passed.',
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
              <Building2 className="w-3.5 h-3.5" /> Procurement & Supplier Governance
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Approved Hardware OEMs & Fiber Suppliers</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Vendors & Suppliers</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Directory of certified OEM manufacturers, optical cable distributors, commercial payment terms, and open purchase order commitments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all hover:border-slate-600"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-sky-400" />
            Purchase Orders
          </button>
          <button
            onClick={loadVendors}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all hover:border-slate-600 disabled:opacity-50"
            title="Reload vendors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Suppliers
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
        </div>
      </div>

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Active Suppliers</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{kpis.total} <span className="text-xs font-normal text-slate-500">Qualified</span></div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Master Agreements Enforced
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Preferred Tier-1</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{kpis.preferred} <span className="text-xs font-normal text-slate-500">Suppliers</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Direct OEM Strategic Contracts</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Supplier Quality</span>
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{kpis.avgRating} <span className="text-xs font-normal text-slate-500">/ 5.0</span></div>
          <div className="text-[11px] text-emerald-400 mt-1">99.2% On-Time Delivery SLA</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Sourced Hardware SKUs</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 tracking-tight">{kpis.totalSourcedSKUs}</div>
          <div className="text-[11px] text-slate-400 mt-1">Products in Catalog Master</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Active PO Commitments</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">${(kpis.totalPOValue / 1000).toFixed(1)}k</div>
          <div className="text-[11px] text-slate-400 mt-1">Open Inbound Orders</div>
        </div>
      </div>

      {/* Controls: Category Tabs, Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'Hardware OEM', label: 'Hardware OEM' },
            { id: 'Carrier Routing Core', label: 'Carrier Routing' },
            { id: 'Optical Fiber Infrastructure', label: 'Fiber Infrastructure' },
            { id: 'Test & Measurement Equipment', label: 'Test Equipment' },
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
            <option value="all">All Supplier Tiers</option>
            <option value="preferred">Preferred Tier-1</option>
            <option value="active">Active Suppliers</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor name, code, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Vendors Master Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Certified Supplier Master Directory</h2>
            <p className="text-xs text-slate-400">
              Showing {filteredVendors.length} qualified hardware OEMs, optical fiber distributors, and measurement partners.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 uppercase text-[10px] tracking-wider text-slate-400 font-semibold border-b border-slate-800/80">
              <tr>
                <th className="py-3.5 px-4">Vendor Code & Ref</th>
                <th className="py-3.5 px-4">Company Name</th>
                <th className="py-3.5 px-4">Supply Category</th>
                <th className="py-3.5 px-4">Primary Contact & Rep</th>
                <th className="py-3.5 px-4">Commercial Terms</th>
                <th className="py-3.5 px-4 text-center">Quality Rating</th>
                <th className="py-3.5 px-4 text-right">Active PO Commitments</th>
                <th className="py-3.5 px-4">Tier Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    No qualified vendors match your current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  return (
                    <tr
                      key={vendor.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedVendor(vendor)}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-sky-400">
                        <div>{vendor.vendor_code}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{vendor.ref}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-white group-hover:text-sky-300 transition-colors">
                          {vendor.account_name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Tax ID: {vendor.tax_id || 'On File'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                          {vendor.vendor_category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="font-medium text-white">{vendor.contact_person}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{vendor.account_email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {vendor.payment_terms}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {(Number(vendor.rating) || 4.5).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                        {(Number(vendor.active_po_value) || 0) > 0 ? (
                          `$${(Number(vendor.active_po_value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-slate-500">$0.00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          vendor.status.includes('Preferred')
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${vendor.status.includes('Preferred') ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          {vendor.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedVendor(vendor)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
                        >
                          Profile & SKUs
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

      {/* Drawer: Vendor Details & Sourced SKUs */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedVendor.vendor_code}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {selectedVendor.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedVendor.account_name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Commercial Category:</span>
                  <span className="font-semibold text-white">{selectedVendor.vendor_category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Terms:</span>
                  <span className="font-mono text-sky-400 font-semibold">{selectedVendor.payment_terms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statutory Tax ID:</span>
                  <span className="font-mono text-slate-300">{selectedVendor.tax_id || 'US-EIN-77-0123984'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Regional Depot / City:</span>
                  <span className="font-medium text-white">{selectedVendor.account_city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quality Performance Rating:</span>
                  <span className="font-semibold text-amber-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {(Number(selectedVendor.rating) || 4.5).toFixed(1)} / 5.0
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Commercial Rep & Contacts</h4>
                <div className="font-medium text-white text-sm">{selectedVendor.contact_person}</div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>{selectedVendor.account_email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedVendor.account_phone}</span>
                </div>
              </div>

              {/* Sourced Hardware SKUs */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Sourced Catalog SKUs ({(selectedVendor.sourced_skus || []).length})
                </h4>
                {(selectedVendor.sourced_skus || []).length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-500 text-center">
                    No individual hardware SKUs currently assigned to this supplier.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                    {(selectedVendor.sourced_skus || []).map((sku, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-mono font-medium text-sky-400">{sku.sku}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{sku.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-white">${sku.unit_cost.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-500">Unit Cost</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compliance & Certification Notes */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Compliance & Master Agreement</h4>
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-slate-300 text-xs leading-relaxed">
                  {selectedVendor.compliance_notes || 'Full enterprise ISO 9001 and vendor qualification documentation on file.'}
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    navigate('/purchase-orders', { state: { vendorId: selectedVendor.id, vendorName: selectedVendor.account_name } });
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Create Purchase Order
                </button>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Vendor */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Register Commercial Supplier / Vendor</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cisco Systems Commercial"
                    value={newVendor.account_name}
                    onChange={(e) => setNewVendor({ ...newVendor, account_name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Vendor Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VND-CISCO-01"
                    value={newVendor.vendor_code}
                    onChange={(e) => setNewVendor({ ...newVendor, vendor_code: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Supply Category
                  </label>
                  <select
                    value={newVendor.vendor_category}
                    onChange={(e) => setNewVendor({ ...newVendor, vendor_category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Hardware OEM">Hardware OEM</option>
                    <option value="Carrier Routing Core">Carrier Routing Core</option>
                    <option value="Optical Fiber Infrastructure">Optical Fiber Infrastructure</option>
                    <option value="Test & Measurement Equipment">Test & Measurement Equipment</option>
                    <option value="Subcontract Engineering">Subcontract Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={newVendor.payment_terms}
                    onChange={(e) => setNewVendor({ ...newVendor, payment_terms: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Net 30 Commercial">Net 30 Commercial</option>
                    <option value="2/10 Net 30">2/10 Net 30 (2% Discount)</option>
                    <option value="Net 45 Commercial">Net 45 Commercial</option>
                    <option value="Net 60 Sovereign">Net 60 Sovereign</option>
                    <option value="Advance Deposit 50%">Advance Deposit 50%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="rep@supplier.com"
                    value={newVendor.account_email}
                    onChange={(e) => setNewVendor({ ...newVendor, account_email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={newVendor.account_phone}
                    onChange={(e) => setNewVendor({ ...newVendor, account_phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Statutory Tax ID / EIN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. US-EIN-77-0123984"
                    value={newVendor.tax_id}
                    onChange={(e) => setNewVendor({ ...newVendor, tax_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Tier Status
                  </label>
                  <select
                    value={newVendor.status}
                    onChange={(e) => setNewVendor({ ...newVendor, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Preferred Tier-1">Preferred Tier-1</option>
                    <option value="Active">Active Supplier</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Compliance Certification & Notes
                </label>
                <textarea
                  rows={2}
                  value={newVendor.compliance_notes}
                  onChange={(e) => setNewVendor({ ...newVendor, compliance_notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
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
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
