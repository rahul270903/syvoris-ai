import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Clock, Plus, Search,
  Filter, CheckCircle2, AlertTriangle, Building2, ShieldCheck,
  Trash2, X, RefreshCw, Receipt, PieChart
} from 'lucide-react';
import { api, ProjectCostItem, ProjectItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

export function ProjectCostsView() {
  const { addEvent, addAudit } = useCRM();

  const [costs, setCosts] = useState<ProjectCostItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projList, costList] = await Promise.all([
        api.listProjects(),
        api.listProjectCosts()
      ]);
      setProjects(projList || []);
      setCosts(costList || []);
    } catch (err) {
      console.error('Failed to load project costs:', err);
      notify('Failed to load cost ledger from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form State for Recording New Expense
  const [newCost, setNewCost] = useState({
    project_id: '',
    title: '',
    category: 'Labor / Contractors',
    cost_type: 'OpEx',
    amount: '',
    date_incurred: new Date().toISOString().split('T')[0],
    vendor_name: '',
    notes: '',
  });

  // Filtered Costs
  const filteredCosts = useMemo(() => {
    return costs.filter((c) => {
      if (selectedProjectId !== 'all' && c.project_id !== selectedProjectId) return false;
      if (categoryFilter !== 'all' && !c.category.toLowerCase().includes(categoryFilter.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title?.toLowerCase().includes(q);
        const matchRef = c.ref?.toLowerCase().includes(q);
        const matchVendor = c.vendor_name?.toLowerCase().includes(q);
        const matchProj = c.project_name?.toLowerCase().includes(q) || c.project_ref?.toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchVendor && !matchProj) return false;
      }
      return true;
    });
  }, [costs, selectedProjectId, categoryFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    // Calculate total budget of selected project or all projects
    const totalBaseline = selectedProjectId === 'all'
      ? projects.reduce((acc, p) => acc + (p.budget || 0), 0) || 315000
      : (projects.find(p => p.id === selectedProjectId)?.budget || 0);

    const actualSpend = filteredCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const variance = totalBaseline - actualSpend;
    const burnRate = totalBaseline > 0 ? Math.round((actualSpend / totalBaseline) * 100) : 0;
    const pendingCount = filteredCosts.filter(c => c.status === 'Pending Review').length;

    // Category breakdown
    const byCategory: Record<string, number> = {};
    filteredCosts.forEach(c => {
      const cat = c.category || 'General';
      byCategory[cat] = (byCategory[cat] || 0) + (Number(c.amount) || 0);
    });

    return { totalBaseline, actualSpend, variance, burnRate, pendingCount, byCategory };
  }, [projects, filteredCosts, selectedProjectId]);

  // Handle Record Expense
  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCost.title.trim() || !newCost.amount) {
      notify('Expense title and amount are required.');
      return;
    }
    const pid = newCost.project_id || (projects.length > 0 ? projects[0].id : '');
    if (!pid) {
      notify('Please select a project for this expense.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createProjectCost({
        project_id: pid,
        title: newCost.title.trim(),
        category: newCost.category,
        cost_type: newCost.cost_type,
        amount: parseFloat(newCost.amount),
        currency: 'USD',
        date_incurred: newCost.date_incurred,
        status: 'Approved',
        vendor_name: newCost.vendor_name.trim() || 'Internal Engineering Delivery',
        notes: newCost.notes.trim() || 'Disbursed against approved project baseline.',
      });

      setCosts(prev => [created, ...prev]);
      setShowCreateModal(false);
      addEvent('project.cost_recorded', { ref: created.ref }, `Recorded cost $${created.amount} for ${created.title}`);
      addAudit('Project Cost Logged', 'Arjun Mehta', `Logged ${created.ref} ($${created.amount})`);
      notify(`Expense "${created.title}" ($${created.amount.toLocaleString()}) recorded.`);
      setNewCost({
        project_id: '',
        title: '',
        category: 'Labor / Contractors',
        cost_type: 'OpEx',
        amount: '',
        date_incurred: new Date().toISOString().split('T')[0],
        vendor_name: '',
        notes: '',
      });
    } catch (err: any) {
      console.error('Failed to create project cost:', err);
      notify(err.message || 'Error recording project expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Approve Expense
  const handleApproveExpense = async (c: ProjectCostItem) => {
    try {
      const updated = await api.updateProjectCost(c.id, {
        status: 'Approved',
        approved_by_name: 'Arjun Mehta',
      });
      setCosts(prev => prev.map(item => item.id === c.id ? { ...item, ...updated, status: 'Approved' } : item));
      notify(`Cost ${c.ref} approved by Arjun Mehta.`);
      addAudit('Project Cost Approved', 'Arjun Mehta', `Approved ${c.ref}`);
    } catch (err: any) {
      notify(err.message || 'Failed to approve cost item.');
    }
  };

  // Delete Expense
  const handleDeleteCost = async (id: string, ref: string) => {
    if (!window.confirm(`Are you sure you want to delete expense ${ref}?`)) return;
    try {
      await api.deleteProjectCost(id);
      setCosts(prev => prev.filter(c => c.id !== id));
      notify(`Expense ${ref} deleted.`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete expense.');
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
        eyebrow="PROJECT MANAGEMENT / FINANCIAL CONTROLS"
        title="Project Costs & Financial Variance Cockpit"
        subtitle="Real-time financial variance analysis, CapEx/OpEx classification, expense approvals, and budget baseline burn rate."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Cost Ledger"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                if (projects.length > 0 && !newCost.project_id) {
                  setNewCost(prev => ({ ...prev, project_id: projects[0].id }));
                }
                setShowCreateModal(true);
              }}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>Record Expense</span>
            </button>
          </div>
        }
      />

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Approved Budget Baseline</span>
            <DollarSign size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            ${kpis.totalBaseline.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Chartered cap</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Actual Spend Incurred</span>
            <Receipt size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            ${kpis.actualSpend.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Disbursed invoices</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Net Budget Variance</span>
            {kpis.variance >= 0 ? (
              <TrendingUp size={14} className="text-emerald-400" />
            ) : (
              <TrendingDown size={14} className="text-rose-400" />
            )}
          </div>
          <div className={`text-2xl font-bold mt-1 ${kpis.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${Math.abs(kpis.variance).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {kpis.variance >= 0 ? 'Under budget allowance' : 'Over budget baseline'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Budget Burn Rate</span>
            <PieChart size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{kpis.burnRate}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                kpis.burnRate > 90 ? 'bg-rose-500' : kpis.burnRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(kpis.burnRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Project Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="all">All Enterprise Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.ref} · {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {['all', 'Labor', 'Infrastructure', 'Software', 'Consulting'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search expense, vendor, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Receipt size={16} className="text-cyan-400" />
            <span>Project Expense Ledger & Audit Register</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {filteredCosts.length} items
            </span>
          </h3>
          <span className="text-xs text-slate-500">PostgreSQL RLS Protected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Expense Ref</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Project</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Vendor</th>
                <th className="py-3 px-4 font-semibold text-right">Amount (USD)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No expense records found. Click "+ Record Expense" to disburse funds.
                  </td>
                </tr>
              ) : (
                filteredCosts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{c.ref}</td>
                    <td className="py-3 px-4 font-medium text-slate-100">{c.title}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="font-mono text-slate-400">{c.project_ref || 'PRJ'}</span> {c.project_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700/60">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{c.cost_type || 'OpEx'}</td>
                    <td className="py-3 px-4 text-slate-400">{c.date_incurred}</td>
                    <td className="py-3 px-4 text-slate-300">{c.vendor_name || 'Internal'}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400 text-right">
                      ${Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === 'Pending Review' && (
                          <button
                            onClick={() => handleApproveExpense(c)}
                            className="text-xs px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded font-semibold transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCost(c.id, c.ref)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Delete Expense Record"
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

      {/* Record Expense Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Record Project Expense</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Project *</label>
                <select
                  value={newCost.project_id}
                  onChange={(e) => setNewCost({ ...newCost, project_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.ref} · {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Expense Title / Invoice Reference *</label>
                <input
                  type="text"
                  placeholder="e.g. Dedicated AWS Multi-Region GPU Cluster Node"
                  value={newCost.title}
                  onChange={(e) => setNewCost({ ...newCost, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Expense Category *</label>
                  <select
                    value={newCost.category}
                    onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Labor / Contractors">Labor / Contractors</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Software Licenses">Software Licenses</option>
                    <option value="Consulting">Consulting / Advisory</option>
                    <option value="Hardware / Devices">Hardware / Devices</option>
                    <option value="Travel & Misc">Travel & Misc</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Financial Classification</label>
                  <select
                    value={newCost.cost_type}
                    onChange={(e) => setNewCost({ ...newCost, cost_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="OpEx">OpEx (Operational Expense)</option>
                    <option value="CapEx">CapEx (Capital Expenditure)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Disbursed Amount (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 14500.00"
                    value={newCost.amount}
                    onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Date Incurred *</label>
                  <input
                    type="date"
                    value={newCost.date_incurred}
                    onChange={(e) => setNewCost({ ...newCost, date_incurred: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Vendor / Payee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services Inc, Cisco Systems, etc."
                  value={newCost.vendor_name}
                  onChange={(e) => setNewCost({ ...newCost, vendor_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Billing Notes / PO Reference</label>
                <textarea
                  rows={2}
                  placeholder="PO number, quote reference, or payment milestone details..."
                  value={newCost.notes}
                  onChange={(e) => setNewCost({ ...newCost, notes: e.target.value })}
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
                  disabled={isSubmitting}
                  className="btn primary py-1.5 px-4 text-xs flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{isSubmitting ? 'Recording...' : 'Disburse Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
