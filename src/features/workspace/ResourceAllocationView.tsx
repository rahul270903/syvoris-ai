import { useState, useEffect, useMemo } from 'react';
import {
  Users, UserCheck, AlertTriangle, Clock, Plus, Search,
  Filter, CheckCircle2, ShieldCheck, DollarSign, Trash2,
  X, RefreshCw, BarChart2, Activity
} from 'lucide-react';
import { api, ProjectResourceItem, ProjectItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

export function ResourceAllocationView() {
  const { addEvent, addAudit } = useCRM();

  const [resources, setResources] = useState<ProjectResourceItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
      const [projList, resList] = await Promise.all([
        api.listProjects(),
        api.listProjectResources()
      ]);
      setProjects(projList || []);
      setResources(resList || []);
    } catch (err) {
      console.error('Failed to load project resources:', err);
      notify('Failed to load team allocation matrix.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form State for Allocating New Resource
  const [newRes, setNewRes] = useState({
    project_id: '',
    user_name: 'Elena Rostova',
    user_email: 'elena.rostova@bluepeak.example',
    role_title: 'Lead Solutions Architect',
    allocation_pct: 100,
    planned_hours: 120,
    hourly_rate: 165,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
  });

  // Filtered Resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (selectedProjectId !== 'all' && r.project_id !== selectedProjectId) return false;
      if (statusFilter === 'overallocated' && !r.is_overallocated && (r.allocation_pct || 0) <= 100) return false;
      if (statusFilter === 'active' && r.status.toLowerCase() !== 'active') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.user_name?.toLowerCase().includes(q);
        const matchRole = r.role_title?.toLowerCase().includes(q);
        const matchRef = r.ref?.toLowerCase().includes(q);
        const matchProj = r.project_name?.toLowerCase().includes(q) || r.project_ref?.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchRef && !matchProj) return false;
      }
      return true;
    });
  }, [resources, selectedProjectId, statusFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const totalStaff = resources.length;
    const overallocatedCount = resources.filter(r => r.is_overallocated || (r.allocation_pct || 0) > 100).length;
    const totalPlannedHours = resources.reduce((acc, r) => acc + (Number(r.planned_hours) || 0), 0);
    const totalActualHours = resources.reduce((acc, r) => acc + (Number(r.actual_hours) || 0), 0);
    const totalBillableCost = resources.reduce((acc, r) => acc + (Number(r.total_cost) || (Number(r.planned_hours) * Number(r.hourly_rate))), 0);
    const avgRate = totalStaff > 0
      ? Math.round(resources.reduce((acc, r) => acc + (Number(r.hourly_rate) || 0), 0) / totalStaff)
      : 150;

    return { totalStaff, overallocatedCount, totalPlannedHours, totalActualHours, totalBillableCost, avgRate };
  }, [resources]);

  // Handle Allocate Resource
  const handleAllocateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRes.role_title.trim() || !newRes.user_name) {
      notify('Role title and user name are required.');
      return;
    }
    const pid = newRes.project_id || (projects.length > 0 ? projects[0].id : '');
    if (!pid) {
      notify('Please select a project for this resource assignment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createProjectResource({
        project_id: pid,
        role_title: newRes.role_title.trim(),
        allocation_pct: Number(newRes.allocation_pct),
        planned_hours: Number(newRes.planned_hours),
        actual_hours: 0,
        hourly_rate: Number(newRes.hourly_rate),
        status: 'Active',
        start_date: newRes.start_date,
        end_date: newRes.end_date,
        custom_fields: {
          user_name: newRes.user_name,
          user_email: newRes.user_email,
        }
      });

      // Augment with friendly fields
      const enriched: ProjectResourceItem = {
        ...created,
        user_name: newRes.user_name,
        user_email: newRes.user_email,
        project_name: projects.find(p => p.id === pid)?.name || 'Enterprise Project',
        total_cost: Number(newRes.planned_hours) * Number(newRes.hourly_rate),
        is_overallocated: Number(newRes.allocation_pct) > 100,
      };

      setResources(prev => [enriched, ...prev]);
      setShowCreateModal(false);
      addEvent('project.resource_allocated', { ref: created.ref }, `Allocated ${newRes.user_name} to ${enriched.project_name}`);
      addAudit('Project Resource Allocated', 'Arjun Mehta', `Allocated ${newRes.user_name} (${newRes.role_title})`);
      notify(`Resource "${newRes.user_name}" allocated to ${enriched.project_name}.`);
    } catch (err: any) {
      console.error('Failed to create resource allocation:', err);
      notify(err.message || 'Error saving resource allocation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rebalance Workload Action
  const handleRebalance = async (r: ProjectResourceItem) => {
    try {
      const newPct = Math.max(50, (r.allocation_pct || 100) - 20);
      const updated = await api.updateProjectResource(r.id, {
        allocation_pct: newPct,
      });
      setResources(prev => prev.map(item => item.id === r.id ? { ...item, ...updated, allocation_pct: newPct, is_overallocated: newPct > 100 } : item));
      notify(`Rebalanced workload for ${r.user_name} to ${newPct}%.`);
      addAudit('Resource Rebalanced', 'Arjun Mehta', `Rebalanced ${r.user_name} to ${newPct}%`);
    } catch (err: any) {
      notify(err.message || 'Failed to rebalance allocation.');
    }
  };

  // Delete Resource Allocation
  const handleDeleteResource = async (id: string, ref: string, name: string) => {
    if (!window.confirm(`Are you sure you want to release allocation ${ref} for ${name}?`)) return;
    try {
      await api.deleteProjectResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
      notify(`Allocation ${ref} released.`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete resource allocation.');
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
        eyebrow="PROJECT MANAGEMENT / TEAM CAPACITY"
        title="Resource Capacity & Team Allocation Engine"
        subtitle="Real-time capacity utilization meters, project workload matrix, billable rate baseline, and overallocation guardrails."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Team Matrix"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                if (projects.length > 0 && !newRes.project_id) {
                  setNewRes(prev => ({ ...prev, project_id: projects[0].id }));
                }
                setShowCreateModal(true);
              }}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>Allocate Resource</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Allocated Headcount</span>
            <Users size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{kpis.totalStaff}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active team members</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Overallocation Alert</span>
            <AlertTriangle size={14} className={kpis.overallocatedCount > 0 ? 'text-rose-400' : 'text-slate-500'} />
          </div>
          <div className={`text-2xl font-bold mt-1 ${kpis.overallocatedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {kpis.overallocatedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {kpis.overallocatedCount > 0 ? 'Exceeds 100% capacity' : 'Workloads balanced'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Planned Delivery Hours</span>
            <Clock size={14} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            {kpis.totalPlannedHours} hrs
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Actual: {kpis.totalActualHours} hrs logged
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Billable Rate</span>
            <DollarSign size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">${kpis.avgRate}/hr</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Standard contractor rate</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Billable Commitment</span>
            <Activity size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            ${Math.round(kpis.totalBillableCost).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Planned labor value</div>
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

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {['all', 'active', 'overallocated'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {st === 'all' ? 'All Resources' : st === 'active' ? 'Active Only' : 'Overallocation Risk'}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search member, role, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Resource Allocation Matrix Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users size={16} className="text-cyan-400" />
            <span>Team Capacity Allocation Matrix</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {filteredResources.length} assignments
            </span>
          </h3>
          <span className="text-xs text-slate-500">PostgreSQL RLS Secured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Ref</th>
                <th className="py-3 px-4 font-semibold">Team Member</th>
                <th className="py-3 px-4 font-semibold">Project</th>
                <th className="py-3 px-4 font-semibold">Role & Title</th>
                <th className="py-3 px-4 font-semibold">Workload Utilization</th>
                <th className="py-3 px-4 font-semibold text-center">Planned Hours</th>
                <th className="py-3 px-4 font-semibold text-center">Actual Hours</th>
                <th className="py-3 px-4 font-semibold text-right">Rate ($/hr)</th>
                <th className="py-3 px-4 font-semibold text-right">Projected Value</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No resource assignments match your filters. Click "+ Allocate Resource" to assign engineers.
                  </td>
                </tr>
              ) : (
                filteredResources.map((r) => {
                  const pct = r.allocation_pct || 100;
                  const isOver = r.is_overallocated || pct > 100;
                  const projectedCost = r.total_cost || (Number(r.planned_hours) * Number(r.hourly_rate));

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.ref}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{r.user_name || 'Staff Member'}</div>
                        <div className="text-[11px] text-slate-500">{r.user_email || 'staff@bluepeak.example'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="font-mono text-slate-400">{r.project_ref || 'PRJ'}</span> {r.project_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700/60">
                          {r.role_title}
                        </span>
                      </td>
                      <td className="py-3 px-4 min-w-[150px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={`font-bold ${isOver ? 'text-rose-400' : pct > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {pct}% {isOver && '(Overallocated)'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">{r.planned_hours} hrs</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{r.actual_hours} hrs</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">${r.hourly_rate}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        ${Number(projectedCost).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isOver && (
                            <button
                              onClick={() => handleRebalance(r)}
                              className="text-xs px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded font-semibold transition-colors flex items-center gap-1"
                              title="Rebalance workload (-20%)"
                            >
                              Rebalance
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteResource(r.id, r.ref, r.user_name || 'Staff')}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Release Assignment"
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

      {/* Allocate Resource Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Allocate Project Team Resource</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAllocateResource} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Project *</label>
                <select
                  value={newRes.project_id}
                  onChange={(e) => setNewRes({ ...newRes, project_id: e.target.value })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Team Member *</label>
                  <select
                    value={newRes.user_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const emailMap: Record<string, string> = {
                        'Elena Rostova': 'elena.rostova@bluepeak.example',
                        'Arjun Mehta': 'arjun.mehta@bluepeak.example',
                        'Devon Wright': 'devon.wright@bluepeak.example',
                        'Sarah Jenkins': 'sarah.jenkins@bluepeak.example',
                        'Vikram Mehta': 'vikram.mehta@bluepeak.example',
                        'Marcus Vance': 'marcus.vance@novatech.example',
                      };
                      setNewRes({ ...newRes, user_name: name, user_email: emailMap[name] || 'staff@bluepeak.example' });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Elena Rostova">Elena Rostova</option>
                    <option value="Arjun Mehta">Arjun Mehta</option>
                    <option value="Devon Wright">Devon Wright</option>
                    <option value="Sarah Jenkins">Sarah Jenkins</option>
                    <option value="Vikram Mehta">Vikram Mehta</option>
                    <option value="Marcus Vance">Marcus Vance</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Role Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Solutions Architect"
                    value={newRes.role_title}
                    onChange={(e) => setNewRes({ ...newRes, role_title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Allocation % *</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    step="5"
                    value={newRes.allocation_pct}
                    onChange={(e) => setNewRes({ ...newRes, allocation_pct: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Planned Hours *</label>
                  <input
                    type="number"
                    min="1"
                    value={newRes.planned_hours}
                    onChange={(e) => setNewRes({ ...newRes, planned_hours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Hourly Rate ($) *</label>
                  <input
                    type="number"
                    min="20"
                    value={newRes.hourly_rate}
                    onChange={(e) => setNewRes({ ...newRes, hourly_rate: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newRes.start_date}
                    onChange={(e) => setNewRes({ ...newRes, start_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">End Date</label>
                  <input
                    type="date"
                    value={newRes.end_date}
                    onChange={(e) => setNewRes({ ...newRes, end_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
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
                  <span>{isSubmitting ? 'Allocating...' : 'Confirm Allocation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
