import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign,
  FolderKanban, Users, Shield, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { api, ProjectAnalyticsSummary, ProjectItem } from '../../services/api';

export function ProjectAnalyticsView({
  onNavigateTo,
}: {
  onNavigateTo?: (path: string, state?: any) => void;
}) {
  const [summary, setSummary] = useState<ProjectAnalyticsSummary | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, projList] = await Promise.all([
        api.getProjectAnalyticsSummary(),
        api.listProjects(),
      ]);
      setSummary(sumRes);
      setProjects(projList);
    } catch (err) {
      console.error('Failed to load project analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <RefreshCw className="animate-spin mb-3 text-cyan-400" size={28} />
        <p className="text-sm">Calculating portfolio metrics from PostgreSQL...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No project analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="project-analytics-view space-y-6 p-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            PROJECT MANAGEMENT / PORTFOLIO INTELLIGENCE
          </span>
          <h2 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            <BarChart3 size={22} className="text-cyan-400" /> Executive Project Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time delivery pacing, financial cost variance, milestone sign-off, and resource capacity across all enterprise projects.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium border border-slate-700/60 shadow"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-cyan-400' : ''} /> Refresh Metrics
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Portfolio Projects</span>
            <FolderKanban size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{summary.total_projects}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-400">{summary.active_projects} Active</span> ·
            <span className="text-slate-300">{summary.completed_projects} Completed</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Portfolio Budget vs Actual</span>
            <DollarSign size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            ${Number(summary.total_budget).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span>Actual: <b className="text-amber-300 font-mono">${Number(summary.total_actual_cost).toLocaleString(undefined, { minimumFractionDigits: 0 })}</b></span> ·
            <span className={summary.cost_variance >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {summary.cost_variance >= 0 ? '+$' : '-$'}{Math.abs(Number(summary.cost_variance)).toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Task Completion Rate</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {Number(summary.task_completion_rate).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>{summary.completed_tasks} / {summary.total_tasks} completed</span>
            {summary.overdue_tasks > 0 && (
              <span className="text-rose-400 font-semibold ml-1.5">({summary.overdue_tasks} overdue)</span>
            )}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Resource Capacity</span>
            <Users size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{summary.resource_count}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.overallocated_resources > 0 ? (
              <span className="text-rose-400 font-medium flex items-center gap-1">
                <AlertTriangle size={11} /> {summary.overallocated_resources} overallocated (&gt;100%)
              </span>
            ) : (
              <span className="text-emerald-400">All personnel balanced</span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Health Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Shield size={16} className="text-cyan-400" /> Delivery Health Status
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> On Track
                </span>
                <span className="font-bold text-slate-100">{summary.on_track_count} ({summary.total_projects > 0 ? Math.round((summary.on_track_count / summary.total_projects) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-400 h-2 rounded-full"
                  style={{ width: `${summary.total_projects > 0 ? (summary.on_track_count / summary.total_projects) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> At Risk
                </span>
                <span className="font-bold text-slate-100">{summary.at_risk_count} ({summary.total_projects > 0 ? Math.round((summary.at_risk_count / summary.total_projects) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-400 h-2 rounded-full"
                  style={{ width: `${summary.total_projects > 0 ? (summary.at_risk_count / summary.total_projects) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" /> Critical Overrun
                </span>
                <span className="font-bold text-slate-100">{summary.critical_count} ({summary.total_projects > 0 ? Math.round((summary.critical_count / summary.total_projects) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-rose-400 h-2 rounded-full"
                  style={{ width: `${summary.total_projects > 0 ? (summary.critical_count / summary.total_projects) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Verification Pacing */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-purple-400" /> Milestone Deliverables Sign-off
          </h4>

          <div className="flex items-center justify-around py-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-100">{summary.total_milestones}</div>
              <div className="text-xs text-slate-400 mt-1">Total Scheduled</div>
            </div>

            <div className="h-12 w-px bg-slate-800" />

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{summary.completed_milestones}</div>
              <div className="text-xs text-slate-400 mt-1">Verified &amp; Signed Off</div>
            </div>

            <div className="h-12 w-px bg-slate-800" />

            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">
                {summary.total_milestones > 0 ? Math.round((summary.completed_milestones / summary.total_milestones) * 100) : 0}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Completion Gate %</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            Milestones gate key financial billing events and contractual SLAs under PostgreSQL audit policies.
          </div>
        </div>
      </div>

      {/* Project Financial Breakdown Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <DollarSign size={16} className="text-emerald-400" /> Active Project Budgets &amp; Incurred Costs
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Project Ref &amp; Name</th>
                <th className="p-3">Client</th>
                <th className="p-3">Status</th>
                <th className="p-3">Health</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Actual Cost</th>
                <th className="p-3">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <div className="font-mono text-[11px] text-cyan-400 font-bold">{p.ref}</div>
                    <div className="font-medium text-slate-100">{p.name}</div>
                  </td>
                  <td className="p-3 text-slate-300">{p.account_name || 'Enterprise Client'}</td>
                  <td className="p-3"><span className="text-[11px] font-medium text-slate-300">{p.status}</span></td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.health === 'On Track' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      p.health === 'At Risk' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {p.health}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-cyan-400">{p.progress_pct}%</td>
                  <td className="p-3 font-mono text-slate-200">
                    ${Number(p.budget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 font-mono text-amber-300 font-bold">
                    ${Number(p.actual_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 font-mono font-bold">
                    <span className={p.cost_variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {p.cost_variance >= 0 ? '+$' : '-$'}{Math.abs(Number(p.cost_variance)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
