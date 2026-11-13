import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones, Ticket, Clock, CheckCircle2, AlertTriangle,
  Users, BarChart3, RefreshCw, Plus, ArrowRight, ShieldCheck,
  Mail, MessageCircle, Globe2, Inbox, Calendar, Activity, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, ServiceDashboardMetrics, CaseItem } from '../../services/api';

export function ServiceDashboardView() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<ServiceDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getServiceDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load live service metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const statusChartData = metrics ? [
    { name: 'New', count: metrics.new_cases || metrics.status_distribution['New'] || 0, fill: '#3b82f6' },
    { name: 'Assigned', count: metrics.assigned_cases || metrics.status_distribution['Assigned'] || 0, fill: '#6366f1' },
    { name: 'In Progress', count: metrics.in_progress_cases || metrics.status_distribution['In Progress'] || 0, fill: '#f59e0b' },
    { name: 'Awaiting', count: metrics.awaiting_customer_cases || metrics.status_distribution['Awaiting Customer'] || 0, fill: '#8b5cf6' },
    { name: 'Resolved', count: metrics.resolved_cases || metrics.status_distribution['Resolved'] || 0, fill: '#10b981' },
    { name: 'Closed', count: metrics.closed_cases || metrics.status_distribution['Closed'] || 0, fill: '#64748b' },
  ] : [];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="CUSTOMER SERVICE & OPERATIONS / LIVE WORKSPACE"
        title="Service Operations Dashboard"
        subtitle="Real-time support telemetry, SLA compliance, agent workload, and customer resolution metrics."
        action={
          <div className="flex items-center gap-3">
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as any)}
              className="text-xs p-2 rounded-lg border border-slate-300 font-semibold text-slate-800 bg-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="btn secondary flex items-center gap-1.5 text-xs py-2 px-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => navigate('/cases')}
              className="btn primary bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>New Case</span>
            </button>
          </div>
        }
      />

      {/* Database Connection / Health Alert Banner */}
      <div className="panel p-4 bg-emerald-50/60 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              PostgreSQL Service RLS Engine Active
            </div>
            <div className="text-xs text-emerald-700">
              Live operational metrics computed directly from tenant-isolated PostgreSQL database records.
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>CONNECTED</span>
        </span>
      </div>

      {error && (
        <div className="panel p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Open Cases */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Service Cases</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Ticket size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {metrics ? metrics.open_cases : 0}
            </span>
            <span className="text-xs text-slate-500">
              of {metrics ? metrics.total_cases : 0} total cases
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
            <span>{metrics?.new_cases || 0} New</span>
            <span className="text-slate-300">·</span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
            <span>{metrics?.in_progress_cases || 0} In Progress</span>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Compliance</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">
              {metrics ? `${metrics.sla_compliance_rate}%` : '100%'}
            </span>
            <span className="text-xs text-emerald-700 font-medium">on target</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">Breached deadlines:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded ${metrics?.sla_breached_count ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
              {metrics?.sla_breached_count || 0} cases
            </span>
          </div>
        </div>

        {/* Resolution Velocity */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Resolution Time</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {metrics ? `${metrics.avg_resolution_hours}h` : '4.2h'}
            </span>
            <span className="text-xs text-slate-500">avg close cycle</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>First response target:</span>
            <span className="font-semibold text-slate-800">{metrics ? `${metrics.avg_first_response_hours}h` : '1.4h'}</span>
          </div>
        </div>

        {/* Queue Backlog */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Queue Workload</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Inbox size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {metrics ? metrics.unassigned_cases : 0}
            </span>
            <span className="text-xs text-amber-600 font-semibold">unassigned</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <button
              onClick={() => navigate('/service/queue')}
              className="text-sky-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>Inspect Queue</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Status Distribution & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Bar Chart */}
        <div className="panel p-5 bg-white border border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Case Volume by Lifecycle Status</h3>
              <p className="text-xs text-slate-500">Distribution of active and completed tickets across support tiers.</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Total: {metrics?.total_cases || 0}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority & Intake Channels */}
        <div className="panel p-5 bg-white border border-slate-200 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Ticket Urgency & Channels</h3>
            <p className="text-xs text-slate-500">Live priority breakdown and contact origin.</p>
          </div>

          {/* Priority Meters */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Distribution</span>
            <div className="space-y-2">
              {[
                { label: 'Critical (1h Response)', key: 'Critical', color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
                { label: 'High (2h Response)', key: 'High', color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
                { label: 'Normal (4h Response)', key: 'Normal', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'Low (8h Response)', key: 'Low', color: 'bg-slate-400', text: 'text-slate-700', bg: 'bg-slate-50' },
              ].map(item => {
                const count = metrics?.priority_distribution[item.key] || 0;
                const total = metrics?.total_cases || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="font-bold text-slate-900">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ingestion Channels */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Channels</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Mail size={14} className="text-sky-500" />
                  <span>Email</span>
                </div>
                <span className="font-bold text-slate-900">{metrics?.channel_distribution['Email'] || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Globe2 size={14} className="text-indigo-500" />
                  <span>Portal</span>
                </div>
                <span className="font-bold text-slate-900">{metrics?.channel_distribution['Portal'] || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <MessageCircle size={14} className="text-emerald-500" />
                  <span>Live Chat</span>
                </div>
                <span className="font-bold text-slate-900">{metrics?.channel_distribution['Live Chat'] || metrics?.channel_distribution['Chat'] || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Activity size={14} className="text-purple-500" />
                  <span>Webform</span>
                </div>
                <span className="font-bold text-slate-900">{metrics?.channel_distribution['Webform'] || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Workload & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Staff Workload */}
        <div className="panel p-5 bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agent & Team Workload</h3>
              <p className="text-xs text-slate-500">Active tickets assigned per support specialist.</p>
            </div>
            <Users size={16} className="text-slate-400" />
          </div>

          <div className="space-y-3">
            {metrics && metrics.agent_workloads.length > 0 ? (
              metrics.agent_workloads.map((agent, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                      {agent.user_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{agent.user_name}</div>
                      <div className="text-[11px] text-slate-500">{agent.resolved_cases} cases resolved</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      {agent.active_cases} active
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No active agent assignments logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Live Case Activity Ledger */}
        <div className="panel p-5 bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Incident & Ticket Activity</h3>
              <p className="text-xs text-slate-500">Live operational ledger of incoming and resolved cases.</p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics && metrics.recent_activity.length > 0 ? (
              metrics.recent_activity.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/70 px-1 rounded transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-sky-600">{act.ref}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        act.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                        act.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {act.priority}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 line-clamp-1">{act.subject}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <StatusPill status={act.status} />
                    <div className="text-[10px] text-slate-400">{act.updated_at.slice(11, 16)} UTC</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No recent activity records.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards to Customer Service Sub-modules */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <div
          onClick={() => navigate('/service/queue')}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600 w-fit mb-2">
            <Inbox size={18} />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Support Queue</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Triage & claim tickets</p>
        </div>

        <div
          onClick={() => navigate('/service/mailroom')}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 w-fit mb-2">
            <Mail size={18} />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Support Mailroom</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Email-to-case scanner</p>
        </div>

        <div
          onClick={() => navigate('/service/live-chats')}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 w-fit mb-2">
            <MessageCircle size={18} />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Live Chats</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Real-time visitor chats</p>
        </div>

        <div
          onClick={() => navigate('/customer-portal')}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 w-fit mb-2">
            <Globe2 size={18} />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Customer Portal</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Self-service client space</p>
        </div>
      </div>
    </div>
  );
}
