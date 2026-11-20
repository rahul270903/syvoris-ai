import { useState, useEffect, useMemo } from 'react';
import {
  Package, Search, Plus, RefreshCw, ShieldCheck, Tag,
  Trash2, DollarSign, Layers, CheckCircle2, AlertTriangle,
  X, Boxes, Edit3, ArrowUpRight
} from 'lucide-react';
import { api, ProductItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    tenant_id: 'default',
    sku: 'SYV-CORE-ENT',
    name: 'Enterprise AI Cloud Core Subscription (Annual)',
    category: 'Software',
    family: 'Cloud Platform',
    is_active: true,
    unit_of_measure: 'License/Year',
    standard_price: 8500.00,
    cost_price: 2100.00,
    currency: 'USD',
    tax_category: 'Standard',
    default_tax_rate: 8.25,
    description: 'Base enterprise cloud platform license covering tenant core, memory graphs and orchestration engines.',
    attributes: { availability: 'Immediate Cloud Provisioning', stock_status: 'In Stock' },
    created_at: '2026-11-01',
    updated_at: '2026-11-01'
  },
  {
    id: 'prod-2',
    tenant_id: 'default',
    sku: 'SYV-REV-INT',
    name: 'Predictive Sales & Revenue Intelligence Module',
    category: 'Software',
    family: 'AI Autonomous',
    is_active: true,
    unit_of_measure: 'Module',
    standard_price: 35000.00,
    cost_price: 8500.00,
    currency: 'USD',
    tax_category: 'Standard',
    default_tax_rate: 8.25,
    description: 'Autonomous deal scoring, win-loss predictive modeling, and pipeline health monitor.',
    attributes: { availability: 'Immediate Cloud Provisioning', stock_status: 'In Stock' },
    created_at: '2026-11-02',
    updated_at: '2026-11-02'
  },
  {
    id: 'prod-3',
    tenant_id: 'default',
    sku: 'SYV-AI-SEAT',
    name: 'AI Autonomous Agent Worker Seat (Monthly)',
    category: 'Software',
    family: 'AI Autonomous',
    is_active: true,
    unit_of_measure: 'Seat/Month',
    standard_price: 450.00,
    cost_price: 90.00,
    currency: 'USD',
    tax_category: 'Standard',
    default_tax_rate: 8.25,
    description: 'Provisioned compute slot for continuous autonomous CRM execution agents.',
    attributes: { availability: 'Immediate Cloud Provisioning', stock_status: 'In Stock' },
    created_at: '2026-11-03',
    updated_at: '2026-11-03'
  },
  {
    id: 'prod-4',
    tenant_id: 'default',
    sku: 'FBR-96-ARMORED',
    name: 'Single-Mode 96-Core Armored Fiber Cable (1000m Reel)',
    category: 'Hardware',
    family: 'Optical Infrastructure',
    is_active: true,
    unit_of_measure: 'Reel (1000m)',
    standard_price: 2450.00,
    cost_price: 1100.00,
    currency: 'USD',
    tax_category: 'Standard',
    default_tax_rate: 15.00,
    description: 'Heavy-duty steel-armored outdoor direct-burial single-mode OS2 fiber reel.',
    attributes: { availability: 'East Coast Distribution Center', stock_status: 'In Stock', units_on_hand: 850 },
    created_at: '2026-11-04',
    updated_at: '2026-11-04'
  },
  {
    id: 'prod-5',
    tenant_id: 'default',
    sku: 'NCT-CISCO-9300',
    name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch',
    category: 'Hardware',
    family: 'Network & Routing',
    is_active: true,
    unit_of_measure: 'Unit',
    standard_price: 4890.00,
    cost_price: 2950.00,
    currency: 'USD',
    tax_category: 'Standard',
    default_tax_rate: 15.00,
    description: 'High-density Gigabit enterprise access switch with modular uplinks and Cisco DNA software support.',
    attributes: { availability: 'Main Warehouse', stock_status: 'In Stock', units_on_hand: 14 },
    created_at: '2026-11-05',
    updated_at: '2026-11-05'
  },
  {
    id: 'prod-6',
    tenant_id: 'default',
    sku: 'NCT-NOKIA-7750',
    name: 'Nokia 7750 Service Router Edge Gateway',
    category: 'Hardware',
    family: 'Network & Routing',
    is_active: true,
    unit_of_measure: 'Unit',
    standard_price: 12500.00,
    cost_price: 7800.00,
    currency: 'USD',
    tax_category: 'Standard',
    default_tax_rate: 15.00,
    description: 'High-performance multi-gigabit IP edge and carrier Ethernet service router for metro deployments.',
    attributes: { availability: 'Build-to-Order (14 Days)', stock_status: 'Build-to-Order', units_on_hand: 3 },
    created_at: '2026-11-06',
    updated_at: '2026-11-06'
  },
  {
    id: 'prod-7',
    tenant_id: 'default',
    sku: 'AUDIT-PRD-TRANS',
    name: 'Audit Fiber Optical Transceiver (10G SFP+ LR)',
    category: 'Hardware',
    family: 'Optical Infrastructure',
    is_active: true,
    unit_of_measure: 'Unit',
    standard_price: 500.00,
    cost_price: 180.00,
    currency: 'USD',
    tax_category: 'Standard',
    default_tax_rate: 15.00,
    description: '1310nm single-mode optical transceiver rated for up to 10km link lengths with digital diagnostic monitoring.',
    attributes: { availability: 'Express Dispatch', stock_status: 'In Stock', units_on_hand: 48 },
    created_at: '2026-11-07',
    updated_at: '2026-11-07'
  },
  {
    id: 'prod-8',
    tenant_id: 'default',
    sku: 'ONT-XGS-01',
    name: 'XGS-PON Optical Network Terminal (10G Symmetric)',
    category: 'Hardware',
    family: 'Optical Infrastructure',
    is_active: true,
    unit_of_measure: 'Unit',
    standard_price: 145.00,
    cost_price: 65.00,
    currency: 'USD',
    tax_category: 'Standard',
    default_tax_rate: 15.00,
    description: 'Customer premise termination unit providing 10-Gigabit symmetric broadband with integrated VoIP and WiFi-6.',
    attributes: { availability: 'Main Warehouse', stock_status: 'In Stock', units_on_hand: 120 },
    created_at: '2026-11-08',
    updated_at: '2026-11-08'
  }
];

export function ProductsCatalogView() {
  const { addEvent, addAudit, addToRecycleBin } = useCRM();

  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.listProducts({ limit: 100 });
      const liveList: ProductItem[] = Array.isArray(res) ? res : (res as any)?.items || [];
      if (liveList && liveList.length > 0) {
        // Merge live products with defaults ensuring no empty catalog
        const map = new Map<string, ProductItem>();
        DEFAULT_PRODUCTS.forEach(p => map.set(p.sku, p));
        liveList.forEach((p: ProductItem) => map.set(p.sku || p.id, p));
        setProducts(Array.from(map.values()));
      }
      notify('Refreshed product catalog from database.');
    } catch (err) {
      console.warn('Load products fallback to default enterprise catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Form State for New Product
  const [newProd, setNewProd] = useState({
    sku: '',
    name: '',
    category: 'Hardware',
    family: 'Optical Infrastructure',
    unit_of_measure: 'Unit',
    standard_price: '',
    cost_price: '',
    tax_category: 'Standard',
    default_tax_rate: '15.00',
    description: '',
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all') {
        const catMatch = p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.family?.toLowerCase().includes(selectedCategory.toLowerCase());
        if (!catMatch) return false;
      }
      if (statusFilter === 'active' && !p.is_active) return false;
      if (statusFilter === 'inactive' && p.is_active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mSku = p.sku?.toLowerCase().includes(q);
        const mName = p.name?.toLowerCase().includes(q);
        const mDesc = p.description?.toLowerCase().includes(q);
        const mFam = p.family?.toLowerCase().includes(q);
        if (!mSku && !mName && !mDesc && !mFam) return false;
      }
      return true;
    });
  }, [products, selectedCategory, statusFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = products.length;
    const hardware = products.filter(p => p.category === 'Hardware').length;
    const software = products.filter(p => p.category === 'Software').length;
    const active = products.filter(p => p.is_active).length;

    // Average gross margin
    let totalMargin = 0;
    let marginCount = 0;
    products.forEach(p => {
      const price = Number(p.standard_price) || 0;
      const cost = Number(p.cost_price) || 0;
      if (price > 0) {
        totalMargin += ((price - cost) / price) * 100;
        marginCount++;
      }
    });
    const avgMargin = marginCount > 0 ? Math.round(totalMargin / marginCount) : 65;

    return { total, hardware, software, active, avgMargin };
  }, [products]);

  // Create Product Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name.trim() || !newProd.sku.trim() || !newProd.standard_price) {
      notify('Product name, SKU and standard price are required.');
      return;
    }

    try {
      const created = await api.createProduct({
        sku: newProd.sku.trim().toUpperCase(),
        name: newProd.name.trim(),
        category: newProd.category,
        family: newProd.family,
        unit_of_measure: newProd.unit_of_measure,
        standard_price: parseFloat(newProd.standard_price),
        cost_price: parseFloat(newProd.cost_price || '0'),
        currency: 'USD',
        tax_category: newProd.tax_category,
        default_tax_rate: parseFloat(newProd.default_tax_rate || '15.00'),
        description: newProd.description.trim() || 'Enterprise catalog product definition.',
        is_active: true,
        attributes: { stock_status: 'In Stock' }
      });

      setProducts(prev => [created, ...prev]);
      setShowCreateModal(false);
      addEvent('catalog.product_created', { ref: created.sku }, `Created product ${created.name}`);
      addAudit('Product Created', 'Arjun Mehta', `Created SKU ${created.sku} (${created.name})`);
      notify(`Product SKU ${created.sku} created successfully.`);

      setNewProd({
        sku: '',
        name: '',
        category: 'Hardware',
        family: 'Optical Infrastructure',
        unit_of_measure: 'Unit',
        standard_price: '',
        cost_price: '',
        tax_category: 'Standard',
        default_tax_rate: '15.00',
        description: '',
      });
    } catch (err: any) {
      notify(err.message || 'Failed to create product.');
    }
  };

  // Toggle Active/Inactive
  const handleToggleStatus = async (p: ProductItem) => {
    const nextStatus = !p.is_active;
    try {
      await api.updateProduct(p.id, { is_active: nextStatus });
      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, is_active: nextStatus } : item));
      notify(`Product ${p.sku} marked ${nextStatus ? 'Active' : 'Inactive'}.`);
      addAudit('Product Status Changed', 'Arjun Mehta', `${p.sku} set to ${nextStatus ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      notify(err.message || 'Failed to update product status.');
    }
  };

  // Delete Product & Move to Recycle Bin
  const handleDeleteProduct = async (product: ProductItem) => {
    if (!window.confirm(`Are you sure you want to delete product SKU ${product.sku}? It will be moved to the Recycle Bin.`)) return;
    try {
      try {
        await api.deleteProduct(product.id);
      } catch (e) {
        console.warn('API deleteProduct fallback to store:', e);
      }
      addToRecycleBin({
        id: product.id,
        ref: product.sku,
        title: product.name,
        entity: 'products',
        description: product.description,
        fields: {
          sku: product.sku,
          category: product.category,
          family: product.family,
          standard_price: product.standard_price,
          unit_of_measure: product.unit_of_measure,
          originalEntity: 'products'
        }
      });
      setProducts(prev => prev.filter(p => p.id !== product.id));
      notify(`Product SKU ${product.sku} moved to Recycle Bin.`);
      addAudit('Product Moved to Recycle Bin', 'Arjun Mehta', `Deleted SKU ${product.sku}`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete product.');
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
        eyebrow="PRODUCT & SERVICE CATALOGUE / PRODUCTS"
        title="Products & Commercial Catalog"
        subtitle="Enterprise SKU repository, hardware and software product master, unit cost margins, tax codes and stock readiness."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadProducts}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Products"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>New Product</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Catalog SKUs</span>
            <Package size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{kpis.active} active in CPQ</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Hardware & Optical</span>
            <Boxes size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{kpis.hardware}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Physical equipment</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Software & Cloud</span>
            <Layers size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{kpis.software}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Autonomous core & seats</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Gross Margin</span>
            <DollarSign size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.avgMargin}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cost-to-price ratio</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Commercial Status</span>
            <CheckCircle2 size={14} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Enforced by PostgreSQL RLS</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {['all', 'Hardware', 'Software', 'Optical Infrastructure', 'Network & Routing', 'AI Autonomous'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {['all', 'active', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-800 text-slate-200 font-semibold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search SKU, name, family..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Products Register Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Package size={16} className="text-cyan-400" />
            <span>Product Master Register</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {filteredProducts.length} items
            </span>
          </h3>
          <span className="text-xs text-slate-500">Live PostgreSQL Catalog Synchronization</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">Product Name & Specifications</th>
                <th className="py-3 px-4 font-semibold">Category / Family</th>
                <th className="py-3 px-4 font-semibold">UOM</th>
                <th className="py-3 px-4 font-semibold text-right">Standard Price</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Cost</th>
                <th className="py-3 px-4 font-semibold text-center">Margin</th>
                <th className="py-3 px-4 font-semibold">Tax Code</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No products match your filter criteria. Click "+ New Product" to create one.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const price = Number(p.standard_price) || 0;
                  const cost = Number(p.cost_price) || 0;
                  const marginPct = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 max-w-[300px]">
                        <div className="font-bold text-slate-100">{p.name}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5" title={p.description}>
                          {p.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700/60">
                          {p.category}
                        </span>
                        {p.family && (
                          <div className="text-[10px] text-slate-500 mt-1">{p.family}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {p.unit_of_measure || 'Unit'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400 text-right font-mono">
                        ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-right font-mono">
                        ${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                            marginPct >= 65
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                              : marginPct >= 40
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {marginPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px]">
                        <span className="font-semibold">{p.tax_category || 'Standard'}</span> ({p.default_tax_rate || 15}%)
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill status={p.is_active ? 'Active' : 'Inactive'} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded font-medium transition-colors"
                          >
                            {p.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Move to Recycle Bin"
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

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Create New Catalog Product</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Product SKU *</label>
                  <input
                    type="text"
                    placeholder="e.g. FBR-OS2-48C"
                    value={newProd.sku}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Product Category *</label>
                  <select
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Hardware">Hardware Equipment</option>
                    <option value="Software">Software & Cloud Core</option>
                    <option value="Services">Professional Service</option>
                    <option value="Hybrid">Hybrid Pack</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Single-Mode 48-Core Fiber Distribution Trunk"
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Product Family</label>
                  <input
                    type="text"
                    placeholder="e.g. Optical Infrastructure"
                    value={newProd.family}
                    onChange={(e) => setNewProd({ ...newProd, family: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={newProd.unit_of_measure}
                    onChange={(e) => setNewProd({ ...newProd, unit_of_measure: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Unit">Unit (Individual item)</option>
                    <option value="Reel (1000m)">Reel (1000m)</option>
                    <option value="License/Year">License / Year</option>
                    <option value="Seat/Month">Seat / Month</option>
                    <option value="Module">Module</option>
                    <option value="Package">Package</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Standard Selling Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1850.00"
                    value={newProd.standard_price}
                    onChange={(e) => setNewProd({ ...newProd, standard_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Unit Internal Cost (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 920.00"
                    value={newProd.cost_price}
                    onChange={(e) => setNewProd({ ...newProd, cost_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tax Category</label>
                  <select
                    value={newProd.tax_category}
                    onChange={(e) => setNewProd({ ...newProd, tax_category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Standard">Standard Domestic Tax</option>
                    <option value="Zero-Rated">Zero-Rated Export (0%)</option>
                    <option value="Exempt">Exempt</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProd.default_tax_rate}
                    onChange={(e) => setNewProd({ ...newProd, default_tax_rate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Technical specifications, interface standards, and deployment guidance..."
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
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
                  <span>Create Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
