import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, Clock, Plus, Search, Filter,
  ArrowRight, ShieldCheck, FileCheck, Layers,
  Trash2, X, RefreshCw
} from 'lucide-react';
import { api, ProjectMilestoneItem, ProjectItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

export function MilestonesView() {
  const { addEvent, addAudit } = useCRM();

  const [milestones, setMilestones] = useState<ProjectMilestoneItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestoneItem | null>(null);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projList, msList] = await Promise.all([
        api.listProjects(),
        api.listProjectMilestones()
      ]);
      setProjects(projList || []);
      setMilestones(msList || []);
    } catch (err) {
      console.error('Failed to load milestones:', err);
      notify('Failed to load project milestones from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form State for New Milestone
  const [newMs, setNewMs] = useState({
    project_id: '',
    name: '',
    deliverable: '',
    target_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    priority: 'High',
    status: 'Pending',
    completion_criteria: '',
    owner_name: 'Arjun Mehta',
  });

  // Filtered Milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (selectedProjectId !== 'all' && m.project_id !== selectedProjectId) return false;
      if (statusFilter !== 'all' && m.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.name?.toLowerCase().includes(q);
        const matchRef = m.ref?.toLowerCase().includes(q);
        const matchDeliv = m.deliverable?.toLowerCase().includes(q);
        const matchProj = m.project_name?.toLowerCase().includes(q) || m.project_ref?.toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchDeliv && !matchProj) return false;
      }
      return true;
    });
  }, [milestones, selectedProjectId, statusFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter(m => m.status === 'Completed').length;
    const inProgress = milestones.filter(m => m.status === 'In Progress').length;
    const critical = milestones.filter(m => m.priority === 'Critical').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, critical, rate };
  }, [milestones]);

  // Handle Create Milestone
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMs.name.trim()) {
      notify('Milestone name is required.');
      return;
    }
    const pid = newMs.project_id || (projects.length > 0 ? projects[0].id : '');
    if (!pid) {
      notify('Please select a project for this milestone.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createProjectMilestone({
        project_id: pid,
        name: newMs.name.trim(),
        deliverable: newMs.deliverable.trim() || 'Signed contract deliverable specification',
        target_date: newMs.target_date,
        priority: newMs.priority,
        status: newMs.status,
        completion_criteria: newMs.completion_criteria.trim() || 'Validated by technical architecture lead',
        owner_name: newMs.owner_name,
        progress_pct: newMs.status === 'Completed' ? 100 : newMs.status === 'In Progress' ? 50 : 0,
      });

      setMilestones(prev => [created, ...prev]);
      setShowCreateModal(false);
      addEvent('project.milestone_created', { ref: created.ref }, `Created milestone ${created.name}`);
      addAudit('Project Milestone Created', 'Arjun Mehta', `Created ${created.ref} - ${created.name}`);
      notify(`Milestone "${created.name}" created successfully.`);
      setNewMs({
        project_id: '',
        name: '',
        deliverable: '',
        target_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        priority: 'High',
        status: 'Pending',
        completion_criteria: '',
        owner_name: 'Arjun Mehta',
      });
    } catch (err: any) {
      console.error('Failed to create milestone:', err);
      notify(err.message || 'Error creating milestone in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Status Transition
  const handleTransitionStatus = async (m: ProjectMilestoneItem, nextStatus: string) => {
    try {
      const updated = await api.updateProjectMilestone(m.id, {
        status: nextStatus,
        progress_pct: nextStatus === 'Completed' ? 100 : nextStatus === 'In Progress' ? 60 : 0,
        completion_date: nextStatus === 'Completed' ? new Date().toISOString().split('T')[0] : null,
      });
      setMilestones(prev => prev.map(item => item.id === m.id ? { ...item, ...updated, status: nextStatus } : item));
      if (selectedMilestone?.id === m.id) {
        setSelectedMilestone(prev => prev ? { ...prev, ...updated, status: nextStatus } : null);
      }
      addEvent('project.milestone_transition', { ref: m.ref }, `Milestone ${m.ref} transitioned to ${nextStatus}`);
      addAudit('Milestone Status Changed', 'Arjun Mehta', `${m.ref} marked ${nextStatus}`);
      notify(`Milestone ${m.ref} marked as ${nextStatus}.`);
    } catch (err: any) {
      console.error('Failed to update milestone status:', err);
      notify(err.message || 'Failed to update milestone status.');
    }
  };

  // Delete Milestone
  const handleDeleteMilestone = async (id: string, ref: string) => {
    if (!window.confirm(`Are you sure you want to delete milestone ${ref}?`)) return;
    try {
      await api.deleteProjectMilestone(id);
      setMilestones(prev => prev.filter(m => m.id !== id));
      if (selectedMilestone?.id === id) setSelectedMilestone(null);
      notify(`Milestone ${ref} deleted.`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete milestone.');
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
        eyebrow="PROJECT MANAGEMENT / DELIVERY ROADMAP"
        title="Project Milestones & Delivery Roadmap"
        subtitle="Enterprise phase-gate delivery schedule, contractual milestone sign-offs, and critical path verification."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Milestones"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                if (projects.length > 0 && !newMs.project_id) {
                  setNewMs(prev => ({ ...prev, project_id: projects[0].id }));
                }
                setShowCreateModal(true);
              }}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>New Milestone</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Milestones</span>
            <Layers size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across active projects</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>In Progress</span>
            <Clock size={14} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{kpis.inProgress}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active phase gates</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Completed & Signed Off</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.completed}</div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">Contractual verification</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Critical Priority</span>
            <ShieldCheck size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{kpis.critical}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">High SLA sensitivity</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Delivery Completion</span>
            <FileCheck size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{kpis.rate}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${kpis.rate}%` }} />
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

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {['all', 'In Progress', 'Completed', 'Pending'].map((st) => (
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
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search milestone or deliverable..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Roadmap & Milestones Register */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Milestones Register Table / List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Layers size={16} className="text-cyan-400" />
                <span>Phase Gates & Milestone Deliverables</span>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
                  {filteredMilestones.length}
                </span>
              </h3>
              <span className="text-xs text-slate-500">PostgreSQL Live Data Storage</span>
            </div>

            {filteredMilestones.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No milestones match your current filter. Click "+ New Milestone" to define a delivery gate.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {filteredMilestones.map((m) => {
                  const isSelected = selectedMilestone?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMilestone(m)}
                      className={`p-4 transition-colors cursor-pointer hover:bg-slate-800/40 ${
                        isSelected ? 'bg-slate-800/70 border-l-4 border-cyan-500' : ''
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-[260px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-400">{m.ref}</span>
                            <span className="text-slate-600">·</span>
                            <h4 className="text-sm font-bold text-slate-100">{m.name}</h4>
                            <StatusPill status={m.status} />
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                m.priority === 'Critical'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : m.priority === 'High'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {m.priority}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>Project: <strong className="text-slate-300">{m.project_ref || 'PRJ'}</strong> {m.project_name}</span>
                            <span>·</span>
                            <span>Target: <strong className="text-slate-300">{m.target_date || 'TBD'}</strong></span>
                          </div>

                          {m.deliverable && (
                            <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 mt-2 flex items-start gap-2">
                              <FileCheck size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-semibold text-slate-200">Contractual Deliverable: </span>
                                <span>{m.deliverable}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Quick 1-Click Status Action Buttons */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {m.status === 'Pending' && (
                            <button
                              onClick={() => handleTransitionStatus(m, 'In Progress')}
                              className="text-xs px-2.5 py-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 rounded-md font-medium transition-colors"
                            >
                              Start Phase
                            </button>
                          )}
                          {m.status === 'In Progress' && (
                            <button
                              onClick={() => handleTransitionStatus(m, 'Completed')}
                              className="text-xs px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-md font-semibold transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} />
                              Verify & Sign Off
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMilestone(m.id, m.ref)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete Milestone"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Milestone Sign-off & Details Drawer */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck size={16} className="text-cyan-400" />
              <span>Phase Gate Sign-off Verification</span>
            </h3>

            {selectedMilestone ? (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-[11px] text-slate-500">Selected Gate</div>
                  <div className="text-base font-bold text-slate-100 mt-0.5">
                    {selectedMilestone.ref} · {selectedMilestone.name}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusPill status={selectedMilestone.status} />
                    <span className="text-slate-400">Priority: <strong>{selectedMilestone.priority}</strong></span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                  <div className="text-slate-400">
                    <span className="font-semibold text-slate-300">Project:</span> {selectedMilestone.project_name || 'Enterprise Project'}
                  </div>
                  <div className="text-slate-400">
                    <span className="font-semibold text-slate-300">Target Date:</span> {selectedMilestone.target_date || 'TBD'}
                  </div>
                  {selectedMilestone.completion_date && (
                    <div className="text-emerald-400">
                      <span className="font-semibold">Sign-off Date:</span> {selectedMilestone.completion_date}
                    </div>
                  )}
                  <div className="text-slate-400">
                    <span className="font-semibold text-slate-300">Account Owner:</span> {selectedMilestone.owner_name || 'Arjun Mehta'}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-300 mb-1">Contract Deliverable Specification</div>
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-slate-300 leading-relaxed">
                    {selectedMilestone.deliverable || 'No explicit deliverable text recorded.'}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-300 mb-1">Completion Criteria & Verification Sign-off</div>
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-slate-300 leading-relaxed">
                    {selectedMilestone.completion_criteria || 'Requires mutual technical lead and client sign-off.'}
                  </div>
                </div>

                {/* Status Changer in Drawer */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-300">Update Phase Gate Status:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Pending', 'In Progress', 'Completed'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleTransitionStatus(selectedMilestone, st)}
                        className={`py-1.5 px-2 rounded-md font-semibold text-center transition-colors ${
                          selectedMilestone.status === st
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-8">
                Select a milestone from the list to inspect sign-off criteria, deliverables, and audit controls.
              </div>
            )}
          </div>

          {/* Compliance & SLA Watchlist info box */}
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 text-xs text-indigo-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-200">
              <ShieldCheck size={14} /> Enterprise Governance Rule
            </div>
            <p className="text-[11px] text-indigo-300/80 leading-relaxed">
              Phase-gate completion automatically releases downstream project tasks, unblocks billing checkpoints, and logs tamper-evident entries into the Audit Timeline.
            </p>
          </div>
        </div>
      </div>

      {/* New Milestone Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Create Project Milestone</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Project *</label>
                <select
                  value={newMs.project_id}
                  onChange={(e) => setNewMs({ ...newMs, project_id: e.target.value })}
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
                <label className="text-slate-300 font-semibold block mb-1">Milestone Name *</label>
                <input
                  type="text"
                  placeholder="e.g. UAT Sign-off & Production Cutover"
                  value={newMs.name}
                  onChange={(e) => setNewMs({ ...newMs, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Contractual Deliverable Summary *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Signed UAT sign-off certificate and zero Sev-1 defect verification"
                  value={newMs.deliverable}
                  onChange={(e) => setNewMs({ ...newMs, deliverable: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Target Due Date *</label>
                  <input
                    type="date"
                    value={newMs.target_date}
                    onChange={(e) => setNewMs({ ...newMs, target_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Priority</label>
                  <select
                    value={newMs.priority}
                    onChange={(e) => setNewMs({ ...newMs, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Completion Criteria</label>
                <input
                  type="text"
                  placeholder="e.g. Automated test pass rate > 99.5% and client sponsor written approval"
                  value={newMs.completion_criteria}
                  onChange={(e) => setNewMs({ ...newMs, completion_criteria: e.target.value })}
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
                  <span>{isSubmitting ? 'Creating...' : 'Create Milestone'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
