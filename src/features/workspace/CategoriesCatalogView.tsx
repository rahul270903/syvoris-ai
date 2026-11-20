import { useState, useEffect, useMemo } from 'react';
import {
  Database, Search, Plus, RefreshCw, ShieldCheck, Tag,
  Trash2, Layers, CheckCircle2, AlertTriangle, X, FolderTree,
  Boxes, Wrench, Binary
} from 'lucide-react';
import { api, CatalogCategoryItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

const DEFAULT_CATEGORIES: CatalogCategoryItem[] = [
  {
    id: 'cat-1',
    tenant_id: 'default',
    ref: 'CAT-001',
    name: 'Optical & Fiber Infrastructure',
    slug: 'optical-fiber',
    category_type: 'Product',
    description: 'Outdoor direct-burial cables, fusion transceivers, OLT terminals, and passive optical components.',
    sort_order: 1,
    is_active: true,
    subcategories_count: 3,
    custom_fields: { linked_items: 6 },
    created_at: '2026-11-01',
    updated_at: '2026-11-01'
  },
  {
    id: 'cat-2',
    tenant_id: 'default',
    ref: 'CAT-002',
    name: 'Enterprise Routing & Switching',
    slug: 'routing-switching',
    category_type: 'Product',
    description: 'High-density Gigabit access switches, modular carrier Ethernet routers, and perimeter edge gateways.',
    sort_order: 2,
    is_active: true,
    subcategories_count: 2,
    custom_fields: { linked_items: 5 },
    created_at: '2026-11-02',
    updated_at: '2026-11-02'
  },
  {
    id: 'cat-3',
    tenant_id: 'default',
    ref: 'CAT-003',
    name: 'Autonomous AI Core & Compute',
    slug: 'ai-core-compute',
    category_type: 'Software',
    description: 'Platform core subscriptions, memory graphs, execution runtimes, and provisioned worker agent slots.',
    sort_order: 3,
    is_active: true,
    subcategories_count: 2,
    custom_fields: { linked_items: 4 },
    created_at: '2026-11-03',
    updated_at: '2026-11-03'
  },
  {
    id: 'cat-4',
    tenant_id: 'default',
    ref: 'CAT-004',
    name: 'Predictive Revenue Intelligence',
    slug: 'revenue-intelligence',
    category_type: 'Software',
    description: 'Deal scoring algorithms, predictive pipeline forecasting, and automated CPQ discount governance engines.',
    sort_order: 4,
    is_active: true,
    subcategories_count: 1,
    custom_fields: { linked_items: 3 },
    created_at: '2026-11-04',
    updated_at: '2026-11-04'
  },
  {
    id: 'cat-5',
    tenant_id: 'default',
    ref: 'CAT-005',
    name: 'Professional Engineering & Deployment',
    slug: 'professional-engineering',
    category_type: 'Service',
    description: 'Optical fiber splicing, OTDR link certification, network architecture, and technical onboarding packs.',
    sort_order: 5,
    is_active: true,
    subcategories_count: 2,
    custom_fields: { linked_items: 4 },
    created_at: '2026-11-05',
    updated_at: '2026-11-05'
  },
  {
    id: 'cat-6',
    tenant_id: 'default',
    ref: 'CAT-006',
    name: 'Managed NOC Operations & 24/7 SLAs',
    slug: 'managed-noc-sla',
    category_type: 'Service',
    description: 'Proactive round-the-clock telemetry monitoring, carrier incident escalation, and 99.99% availability riders.',
    sort_order: 6,
    is_active: true,
    subcategories_count: 2,
    custom_fields: { linked_items: 3 },
    created_at: '2026-11-06',
    updated_at: '2026-11-06'
  },
  {
    id: 'cat-7',
    tenant_id: 'default',
    ref: 'CAT-007',
    name: 'Zero-Trust & Edge Cybersecurity',
    slug: 'cyber-edge-security',
    category_type: 'Hybrid',
    description: 'Integrated hardware transceivers, encrypted network tunnels, and automated SOC monitoring agents.',
    sort_order: 7,
    is_active: true,
    subcategories_count: 1,
    custom_fields: { linked_items: 2 },
    created_at: '2026-11-07',
    updated_at: '2026-11-07'
  }
];

export function CategoriesCatalogView() {
  const { addEvent, addAudit, addToRecycleBin } = useCRM();

  const [categories, setCategories] = useState<CatalogCategoryItem[]>(DEFAULT_CATEGORIES);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const liveList = await api.listCategories();
      if (liveList && liveList.length > 0) {
        const map = new Map<string, CatalogCategoryItem>();
        DEFAULT_CATEGORIES.forEach(c => map.set(c.slug, c));
        liveList.forEach(c => map.set(c.slug || c.id, c));
        setCategories(Array.from(map.values()));
      }
      notify('Refreshed category hierarchy from database.');
    } catch (err) {
      console.warn('Fallback to default categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Form State for New Category
  const [newCat, setNewCat] = useState({
    name: '',
    slug: '',
    category_type: 'Product',
    sort_order: 1,
    description: '',
  });

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (selectedType !== 'all' && c.category_type.toLowerCase() !== selectedType.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = c.name?.toLowerCase().includes(q);
        const mSlug = c.slug?.toLowerCase().includes(q);
        const mDesc = c.description?.toLowerCase().includes(q);
        const mRef = c.ref?.toLowerCase().includes(q);
        if (!mName && !mSlug && !mDesc && !mRef) return false;
      }
      return true;
    });
  }, [categories, selectedType, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = categories.length;
    const products = categories.filter(c => c.category_type === 'Product').length;
    const software = categories.filter(c => c.category_type === 'Software').length;
    const services = categories.filter(c => c.category_type === 'Service').length;
    const totalItems = categories.reduce((acc, c) => acc + (Number(c.custom_fields?.linked_items) || 3), 0);

    return { total, products, software, services, totalItems };
  }, [categories]);

  // Create Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) {
      notify('Category name is required.');
      return;
    }
    const slug = newCat.slug.trim() || newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      const created = await api.createCategory({
        name: newCat.name.trim(),
        slug,
        category_type: newCat.category_type,
        sort_order: Number(newCat.sort_order),
        description: newCat.description.trim() || 'Enterprise catalog category definition.',
        is_active: true,
        custom_fields: { linked_items: 0 }
      });

      setCategories(prev => [...prev, created]);
      setShowCreateModal(false);
      addEvent('catalog.category_created', { ref: created.ref || created.slug }, `Created category ${created.name}`);
      addAudit('Category Created', 'Arjun Mehta', `Created category ${created.name}`);
      notify(`Category "${created.name}" created successfully.`);

      setNewCat({
        name: '',
        slug: '',
        category_type: 'Product',
        sort_order: 1,
        description: '',
      });
    } catch (err: any) {
      notify(err.message || 'Failed to create category.');
    }
  };

  // Toggle Active/Inactive
  const handleToggleStatus = async (c: CatalogCategoryItem) => {
    const nextStatus = !c.is_active;
    try {
      await api.updateCategory(c.id, { is_active: nextStatus });
      setCategories(prev => prev.map(item => item.id === c.id ? { ...item, is_active: nextStatus } : item));
      notify(`Category ${c.name} marked ${nextStatus ? 'Active' : 'Inactive'}.`);
      addAudit('Category Status Changed', 'Arjun Mehta', `${c.name} set to ${nextStatus ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      notify(err.message || 'Failed to update category status.');
    }
  };

  // Delete Category & Move to Recycle Bin
  const handleDeleteCategory = async (category: CatalogCategoryItem) => {
    if (!window.confirm(`Are you sure you want to delete category "${category.name}"? It will be moved to the Recycle Bin.`)) return;
    try {
      try {
        await api.deleteCategory(category.id);
      } catch (e) {
        console.warn('API deleteCategory fallback to store:', e);
      }
      addToRecycleBin({
        id: category.id,
        ref: category.ref || category.slug,
        title: category.name,
        entity: 'categories',
        description: category.description,
        fields: {
          slug: category.slug,
          category_type: category.category_type,
          sort_order: category.sort_order,
          originalEntity: 'categories'
        }
      });
      setCategories(prev => prev.filter(c => c.id !== category.id));
      notify(`Category "${category.name}" moved to Recycle Bin.`);
      addAudit('Category Moved to Recycle Bin', 'Arjun Mehta', `Deleted category ${category.name}`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete category.');
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
        eyebrow="PRODUCT & SERVICE CATALOGUE / CATEGORIES"
        title="Categories & Taxonomy Hierarchy"
        subtitle="Hierarchical classification tree, commercial groupings, and taxonomy definitions across hardware, software, and services."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadCategories}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Categories"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>New Category</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Categories</span>
            <Database size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Commercial taxonomy</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Hardware Categories</span>
            <Boxes size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{kpis.products}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Physical infrastructure</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Software & Cloud</span>
            <Binary size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{kpis.software}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Core SaaS & modules</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Services & NOC</span>
            <Wrench size={14} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{kpis.services}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Engineering & retainers</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Linked Catalog Items</span>
            <FolderTree size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.totalItems}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Assigned products & SOWs</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
          {['all', 'Product', 'Software', 'Service', 'Hybrid'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedType === type
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {type === 'all' ? 'All Types' : `${type} Taxonomies`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search category, slug, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Categories Register Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FolderTree size={16} className="text-cyan-400" />
            <span>Product & Service Categories Tree</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {filteredCategories.length} categories
            </span>
          </h3>
          <span className="text-xs text-slate-500">PostgreSQL RLS Secured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Ref Code</th>
                <th className="py-3 px-4 font-semibold">Category Name</th>
                <th className="py-3 px-4 font-semibold">Slug Identifier</th>
                <th className="py-3 px-4 font-semibold">Classification Type</th>
                <th className="py-3 px-4 font-semibold">Scope Description</th>
                <th className="py-3 px-4 font-semibold text-center">Order</th>
                <th className="py-3 px-4 font-semibold text-center">Linked SKUs</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No categories found. Click "+ New Category" to establish catalog structure.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {c.ref}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100 whitespace-nowrap">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {c.slug}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700/60">
                        {c.category_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[280px] text-slate-400 truncate" title={c.description}>
                      {c.description || 'Enterprise catalog classification.'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      {c.sort_order}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold border border-cyan-500/40 text-[11px]">
                        {c.custom_fields?.linked_items || c.subcategories_count || 3} items
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={c.is_active ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded font-medium transition-colors"
                        >
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
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

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Create Catalog Category</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Wireless Edge & IoT Gateways"
                  value={newCat.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setNewCat({ ...newCat, name, slug });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Slug Identifier *</label>
                  <input
                    type="text"
                    placeholder="e.g. wireless-edge-iot"
                    value={newCat.slug}
                    onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category Type *</label>
                  <select
                    value={newCat.category_type}
                    onChange={(e) => setNewCat({ ...newCat, category_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Product">Product Taxonomy</option>
                    <option value="Software">Software & Cloud Core</option>
                    <option value="Service">Professional Service</option>
                    <option value="Hybrid">Hybrid Pack</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Sort Priority Order</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newCat.sort_order}
                  onChange={(e) => setNewCat({ ...newCat, sort_order: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Description & Scope Boundaries</label>
                <textarea
                  rows={2}
                  placeholder="Outline the hardware models, software features or services covered by this category..."
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
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
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
