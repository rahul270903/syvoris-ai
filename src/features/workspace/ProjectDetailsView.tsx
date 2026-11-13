import { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban, Briefcase, CalendarDays, CheckCircle2, AlertTriangle,
  Clock, DollarSign, Users, Plus, ChevronRight, Activity, ArrowRight,
  TrendingUp, Shield, BarChart3, Tag, FileText, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { api, ProjectItem, ProjectDetailResponse, ProjectMilestoneItem, ProjectTaskItem, ProjectResourceItem, ProjectCostItem } from '../../services/api';
import { StatusPill } from '../../components/StatusPill';

export function ProjectDetailsView({
  initialProjectId,
  onNavigateTo,
}: {
  initialProjectId?: string;
  onNavigateTo?: (path: string, state?: any) => void;
}) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [projectDetail, setProjectDetail] = useState<ProjectDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'tasks' | 'resources' | 'costs' | 'activity'>('overview');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Quick Create Modal States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskHours, setNewTaskHours] = useState('20');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDeliverable, setNewMilestoneDeliverable] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  const [showCostModal, setShowCostModal] = useState(false);
  const [newCostTitle, setNewCostTitle] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('5000');
  const [newCostCategory, setNewCostCategory] = useState('Labor');

  // Load Projects
  const loadProjects = async () => {
    try {
      setLoading(true);
      const list = await api.listProjects();
      setProjects(list);
      if (list.length > 0) {
        const targetId = selectedProjectId && list.some(p => p.id === selectedProjectId)
          ? selectedProjectId
          : list[0].id;
        setSelectedProjectId(targetId);
        loadProjectDetail(targetId);
      } else {
        setProjectDetail(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setLoading(false);
    }
  };

  const loadProjectDetail = async (id: string) => {
    try {
      setLoading(true);
      const detail = await api.getProjectDetails(id);
      setProjectDetail(detail);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    loadProjectDetail(id);
  };

  const handleStatusTransition = async (newStatus: string) => {
    if (!projectDetail) return;
    try {
      setIsTransitioning(true);
      await api.transitionProjectStatus(projectDetail.id, newStatus, `Manual status change to ${newStatus}`);
      await loadProjectDetail(projectDetail.id);
      const updatedList = await api.listProjects();
      setProjects(updatedList);
    } catch (err) {
      console.error('Failed to transition status:', err);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDetail || !newTaskTitle.trim()) return;
    try {
      await api.createProjectTask({
        project_id: projectDetail.id,
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        estimated_hours: Number(newTaskHours) || 0,
        due_date: newTaskDueDate || undefined,
        status: 'Not Started',
      });
      setShowTaskModal(false);
      setNewTaskTitle('');
      await loadProjectDetail(projectDetail.id);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDetail || !newMilestoneName.trim()) return;
    try {
      await api.createProjectMilestone({
        project_id: projectDetail.id,
        name: newMilestoneName.trim(),
        deliverable: newMilestoneDeliverable.trim() || undefined,
        target_date: newMilestoneDate || undefined,
        status: 'Pending',
        priority: 'Medium',
      });
      setShowMilestoneModal(false);
      setNewMilestoneName('');
      setNewMilestoneDeliverable('');
      await loadProjectDetail(projectDetail.id);
    } catch (err) {
      console.error('Failed to create milestone:', err);
    }
  };

  const handleCreateCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDetail || !newCostTitle.trim()) return;
    try {
      await api.createProjectCost({
        project_id: projectDetail.id,
        title: newCostTitle.trim(),
        amount: Number(newCostAmount) || 0,
        category: newCostCategory,
        cost_type: 'Actual',
        date_incurred: new Date().toISOString().slice(0, 10),
        status: 'Approved',
      });
      setShowCostModal(false);
      setNewCostTitle('');
      await loadProjectDetail(projectDetail.id);
    } catch (err) {
      console.error('Failed to create cost entry:', err);
    }
  };

  const budgetConsumptionPct = useMemo(() => {
    if (!projectDetail || projectDetail.budget <= 0) return 0;
    return Math.min(100, Math.round((projectDetail.actual_cost / projectDetail.budget) * 100));
  }, [projectDetail]);

  if (loading && !projectDetail) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <RefreshCw className="animate-spin mb-3 text-cyan-400" size={28} />
        <p className="text-sm">Loading project delivery details from PostgreSQL...</p>
      </div>
    );
  }

  if (!projectDetail) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl m-6">
        <FolderKanban className="mx-auto text-slate-500 mb-3" size={40} />
        <h3 className="text-lg font-semibold text-slate-200">No Projects Found</h3>
        <p className="text-slate-400 text-sm mt-1">Create an enterprise implementation project to inspect baseline, tasks and deliverables.</p>
      </div>
    );
  }

  return (
    <div className="project-details-view space-y-6 p-6">
      {/* Top Banner / Project Selector & Quick Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400">
              <FolderKanban size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-100 font-bold text-lg rounded-md px-3 py-1 focus:outline-none focus:border-cyan-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.ref} · {p.name}
                    </option>
                  ))}
                </select>
                <StatusPill status={projectDetail.status} />
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    projectDetail.health === 'On Track'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : projectDetail.health === 'At Risk'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {projectDetail.health}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Account: <span className="text-slate-200 font-medium">{projectDetail.account_name || 'Enterprise Client'}</span> · Lead Manager: <span className="text-slate-200 font-medium">{projectDetail.manager_name || 'Project Lead'}</span> · Target: <span className="text-slate-200 font-medium">{projectDetail.target_date || 'TBD'}</span>
              </p>
            </div>
          </div>

          {/* Status Transitions */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Status:</span>
            {['Planning', 'In Progress', 'In Review', 'Completed'].map((st) => (
              <button
                key={st}
                disabled={isTransitioning || projectDetail.status === st}
                onClick={() => handleStatusTransition(st)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  projectDetail.status === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* High Level Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Total Budget</div>
            <div className="text-base font-bold text-slate-100 mt-0.5">
              ${Number(projectDetail.budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Approved baseline</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Actual Cost</div>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              ${Number(projectDetail.actual_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{budgetConsumptionPct}% consumed</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Variance</div>
            <div className={`text-base font-bold mt-0.5 ${projectDetail.cost_variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${Number(projectDetail.cost_variance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{projectDetail.cost_variance >= 0 ? 'Under budget' : 'Overrun'}</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Progress</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">{projectDetail.progress_pct}%</div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${projectDetail.progress_pct}%` }} />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Milestones</div>
            <div className="text-base font-bold text-purple-300 mt-0.5">
              {projectDetail.milestones.filter(m => m.status === 'Completed').length} / {projectDetail.milestones.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Deliverables verified</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Tasks</div>
            <div className="text-base font-bold text-blue-300 mt-0.5">
              {projectDetail.tasks.filter(t => t.status === 'Completed').length} / {projectDetail.tasks.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Completed items</div>
          </div>
        </div>
      </div>

      {/* Workspace Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-1 bg-slate-900/40 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview & Objectives', icon: FileText, count: null },
          { key: 'milestones', label: 'Milestones & Roadmap', icon: CheckCircle2, count: projectDetail.milestones.length },
          { key: 'tasks', label: 'Tasks & Dependencies', icon: Check, count: projectDetail.tasks.length },
          { key: 'resources', label: 'Team & Allocations', icon: Users, count: projectDetail.resources.length },
          { key: 'costs', label: 'Financial Baseline & Costs', icon: DollarSign, count: projectDetail.costs.length },
          { key: 'activity', label: 'Audit Timeline', icon: Activity, count: projectDetail.activities.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & OBJECTIVES */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <FileText size={16} className="text-cyan-400" /> Executive Description & Scope
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {projectDetail.description || 'No description provided.'}
              </p>

              <h4 className="text-sm font-semibold text-slate-200 mt-5 mb-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" /> Commercial & Operational Objectives
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                {projectDetail.objectives || 'No specific objectives chartered.'}
              </p>
            </div>

            {/* Custom Metadata */}
            {projectDetail.custom_fields && Object.keys(projectDetail.custom_fields).length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-purple-400" /> Technical & Governance Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(projectDetail.custom_fields).map(([k, v]) => (
                    <div key={k} className="bg-slate-950/50 p-2.5 rounded border border-slate-800 text-xs">
                      <span className="text-slate-400 block uppercase tracking-wider text-[10px]">{k.replace('_', ' ')}</span>
                      <span className="text-slate-200 font-mono font-medium mt-0.5 block">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Stakeholder & Timeline Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Briefcase size={16} className="text-indigo-400" /> Commercial Sponsorship
              </h4>

              <div className="text-xs space-y-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Client Organization</span>
                  <span className="text-slate-100 font-medium text-sm">{projectDetail.account_name || 'Direct Enterprise Client'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Project Manager</span>
                  <span className="text-slate-100 font-medium">{projectDetail.manager_name || 'Project Lead'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Executive Sponsor</span>
                  <span className="text-slate-100 font-medium">{projectDetail.owner_name || 'Executive Stakeholder'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Charter Dates</span>
                  <span className="text-slate-300">
                    {projectDetail.start_date || 'Start'} → {projectDetail.target_date || 'Ongoing'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Category & Type</span>
                  <span className="text-slate-300">{projectDetail.category} · {projectDetail.project_type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MILESTONES & ROADMAP */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Delivery milestones define formal client sign-off gates, verification criteria, and target deadlines.
            </p>
            <button
              onClick={() => setShowMilestoneModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-medium shadow"
            >
              <Plus size={14} /> Schedule Milestone
            </button>
          </div>

          <div className="space-y-3">
            {projectDetail.milestones.map((m, idx) => (
              <div
                key={m.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-start justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`mt-0.5 p-2 rounded-lg ${
                    m.status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  }`}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{m.ref}</span>
                      <h5 className="text-sm font-semibold text-slate-100">{m.name}</h5>
                      <StatusPill status={m.status} />
                    </div>
                    {m.description && <p className="text-xs text-slate-300 mt-1">{m.description}</p>}
                    {m.deliverable && (
                      <div className="mt-2 text-xs bg-slate-950/60 p-2 rounded border border-slate-800/80 text-cyan-300">
                        <span className="text-slate-400 font-medium">Deliverable: </span>
                        {m.deliverable}
                      </div>
                    )}
                    {m.completion_criteria && (
                      <div className="mt-1 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-400">Criteria: </span>
                        {m.completion_criteria}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-medium text-slate-200">
                    Target: {m.target_date || 'TBD'}
                  </div>
                  {m.completion_date && (
                    <div className="text-[11px] text-emerald-400 mt-0.5">
                      Completed: {m.completion_date}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 mt-1">
                    Progress: <span className="font-bold text-slate-200">{m.progress_pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TASKS & DEPENDENCIES */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Granular project work packages, owner assignments, effort estimates, and critical-path dependencies.
            </p>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-medium shadow"
            >
              <Plus size={14} /> Add Task
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Task Ref & Title</th>
                  <th className="p-3">Assignee</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Hours (Est / Act)</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Dependencies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {projectDetail.tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-[11px] text-cyan-400 font-bold">{t.ref}</div>
                      <div className="font-medium text-slate-100">{t.title}</div>
                      {t.milestone_name && (
                        <div className="text-[10px] text-slate-400 mt-0.5">↳ {t.milestone_name}</div>
                      )}
                    </td>
                    <td className="p-3 text-slate-200">{t.assigned_user_name || 'Unassigned'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                        t.priority === 'High' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3"><StatusPill status={t.status} /></td>
                    <td className="p-3">{t.due_date || '—'}</td>
                    <td className="p-3 font-mono">
                      {Number(t.estimated_hours).toFixed(1)}h / <span className="text-amber-300">{Number(t.actual_hours).toFixed(1)}h</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px]">{t.progress_pct}%</span>
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-cyan-400 h-1.5" style={{ width: `${t.progress_pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {t.dependencies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.dependencies.map(d => (
                            <span key={d.id} className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-indigo-300 border border-slate-700">
                              Depends on {d.depends_on_ref || 'Task'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RESOURCES & ALLOCATIONS */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Project team members, role responsibilities, capacity commitment %, and billable hourly rate tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectDetail.resources.map((r) => (
              <div key={r.id} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{r.ref}</span>
                    <h5 className="text-sm font-semibold text-slate-100">{r.role_title}</h5>
                    {r.is_overallocated && (
                      <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 py-0.5 rounded font-semibold border border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle size={10} /> Overallocated
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Assigned: <span className="font-medium text-slate-100">{r.user_name || 'Team Specialist'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Rate: ${Number(r.hourly_rate).toFixed(2)}/hr · Total Cost: <span className="text-amber-300 font-mono font-medium">${Number(r.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-cyan-400">{r.allocation_pct}%</div>
                  <div className="text-[10px] text-slate-400">Capacity allocated</div>
                  <div className="text-xs text-slate-300 mt-1 font-mono">
                    {Number(r.actual_hours).toFixed(0)} / {Number(r.planned_hours).toFixed(0)} hrs
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIAL BASELINE & COSTS */}
      {activeTab === 'costs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Audit log of incurred commercial expenses, labor charges, software subscriptions, and variance against baseline.
            </p>
            <button
              onClick={() => setShowCostModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-medium shadow"
            >
              <Plus size={14} /> Record Expense
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Cost Ref & Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Incurred Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {projectDetail.costs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-[11px] text-amber-400 font-bold">{c.ref}</div>
                      <div className="font-medium text-slate-100">{c.title}</div>
                      {c.notes && <div className="text-[10px] text-slate-400 mt-0.5">{c.notes}</div>}
                    </td>
                    <td className="p-3"><span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">{c.category}</span></td>
                    <td className="p-3">{c.date_incurred}</td>
                    <td className="p-3 font-mono font-bold text-amber-300">
                      ${Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-slate-300">{c.vendor_name || 'Internal'}</td>
                    <td className="p-3"><StatusPill status={c.status} /></td>
                    <td className="p-3 text-slate-400">{c.approved_by_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TIMELINE */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 mb-2">
            Immutable operational and governance audit stream for project governance compliance.
          </p>

          <div className="border-l-2 border-slate-800 ml-4 pl-4 space-y-4">
            {projectDetail.activities.map((a) => (
              <div key={a.id} className="relative group">
                <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-950" />
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-100">{a.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{a.occurred_at.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                  {a.details && <p className="text-xs text-slate-300 mt-1">{a.details}</p>}
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    Actor: <span className="text-slate-300">{a.actor_name}</span> · Type: <span className="text-cyan-400">{a.activity_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Task */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Check size={16} className="text-cyan-400" /> Create Work Package / Task
            </h4>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Ingress Controller SSL Hardening"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded shadow"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Milestone */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-cyan-400" /> Schedule Milestone Gate
            </h4>
            <form onSubmit={handleCreateMilestone} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Milestone Name *</label>
                <input
                  type="text"
                  required
                  value={newMilestoneName}
                  onChange={(e) => setNewMilestoneName(e.target.value)}
                  placeholder="e.g. UAT Sign-off & Security Baseline"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Deliverable Specification</label>
                <input
                  type="text"
                  value={newMilestoneDeliverable}
                  onChange={(e) => setNewMilestoneDeliverable(e.target.value)}
                  placeholder="e.g. Signed UAT Test Run & Certificate"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Target Date</label>
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded shadow"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Cost */}
      {showCostModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-amber-400" /> Record Financial Expense
            </h4>
            <form onSubmit={handleCreateCost} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={newCostTitle}
                  onChange={(e) => setNewCostTitle(e.target.value)}
                  placeholder="e.g. Dedicated AWS Transit Gateway Allocation"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newCostAmount}
                    onChange={(e) => setNewCostAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={newCostCategory}
                    onChange={(e) => setNewCostCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Labor">Labor</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Software">Software</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Overhead">Overhead</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCostModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded shadow"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
