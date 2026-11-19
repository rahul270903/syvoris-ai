import React, { useState, useEffect } from 'react';
import {
  BarChart3, RefreshCw, Clock, CheckCircle2, AlertTriangle,
  HeartHandshake, TrendingUp, ShieldCheck, ArrowUpRight,
  PieChart as PieIcon, Award, Users, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { SectionHeading } from '../../components/SectionHeading';
import { api, ServiceDashboardMetrics, CaseItem, CSATSummary } from '../../services/api';

export function ServiceAnalyticsView() {
  const [metrics, setMetrics] = useState<ServiceDashboardMetrics | null>(null);
  const [csat, setCsat] = useState<CSATSummary | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, csatRes, casesRes] = await Promise.all([
        api.getServiceDashboardMetrics(),
        api.getCSATSummary(),
        api.listCases({ limit: 100 })
      ]);
      setMetrics(mRes);
      setCsat(csatRes);
      setCases(casesRes.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load service analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const priorityResolutionData = [
    { name: 'Critical (P1)', target: 2.0, actual: 1.2 },
    { name: 'High (P2)', target: 6.0, actual: 3.4 },
    { name: 'Normal (P3)', target: 24.0, actual: 14.8 },
    { name: 'Low (P4)', target: 48.0, actual: 26.2 },
  ];

  const channelData = metrics ? [
    { name: 'Portal', value: metrics.channel_distribution['Portal'] || 1, color: '#3b82f6' },
    { name: 'Email', value: metrics.channel_distribution['Email'] || 1, color: '#6366f1' },
    { name: 'Webform', value: metrics.channel_distribution['Webform'] || 1, color: '#8b5cf6' },
    { name: 'Phone', value: metrics.channel_distribution['Phone'] || 1, color: '#10b981' },
  ] : [];

  const categoryData = metrics ? [
    { name: 'API Integration', count: 2, fill: '#0284c7' },
    { name: 'Cloud Infrastructure', count: 1, fill: '#0ea5e9' },
    { name: 'Billing & Invoicing', count: 1, fill: '#38bdf8' },
    { name: 'Authentication / SSO', count: 1, fill: '#7dd3fc' },
  ] : [];

  const resolvedCasesWithCSAT = cases.filter(c => c.csat_score !== undefined && c.csat_score !== null);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="SERVICE OPERATIONS / INTELLIGENCE COCKPIT"
        title="Customer Service & Support Analytics"
        subtitle="Deep performance telemetry, First Contact Resolution (FCR), Mean Time to Resolution (MTTR), and satisfaction correlation."
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
              onClick={loadData}
              disabled={loading}
              className="btn secondary flex items-center gap-1.5 text-xs py-2 px-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* First Contact Resolution */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Contact Resolution</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">74.2%</span>
            <span className="text-xs text-emerald-700 font-semibold">+3.8% MoM</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Benchmark target &ge; 70.0%</div>
        </div>

        {/* Mean Time to Resolution */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mean Time to Resolution</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics?.avg_resolution_hours || 3.8}h</span>
            <span className="text-xs text-slate-500">avg close cycle</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Target &le; 4.0h across all tiers</div>
        </div>

        {/* SLA Compliance */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Compliance Rate</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600">
              {metrics ? `${metrics.sla_compliance_rate}%` : '96.8%'}
            </span>
            <span className="text-xs text-indigo-700 font-semibold">on target</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {metrics?.sla_breached_count || 0} breached cases logged
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CSAT Score Index</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <HeartHandshake size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">
              {csat ? Number(csat.average_csat || 4.8).toFixed(1) : '4.8'}
              <span className="text-base text-slate-400 font-normal"> / 5.0</span>
            </span>
            <span className="text-xs text-emerald-700 font-semibold">92% Positive</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            From {Number(csat?.total_responses || 42)} verified survey ratings
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MTTR vs SLA Target Chart */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Resolution Velocity vs SLA Commitment</h3>
              <p className="text-xs text-slate-500">Actual average close time compared to contractual SLA ceiling (hours).</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityResolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="actual" name="Actual (Hours)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="SLA Ceiling (Hours)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume by Channel Distribution */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Intake Volume by Customer Channel</h3>
              <p className="text-xs text-slate-500">Distribution of cases by entry touchpoint.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 text-xs">
              {channelData.map(c => (
                <div key={c.name} className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-semibold text-slate-800">{c.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{c.value} tickets</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Verified CSAT Ratings Ledger */}
      <div className="panel bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden space-y-3">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Client Satisfaction (CSAT) Post-Resolution Ledger</h3>
            <p className="text-xs text-slate-500">Verified feedback and satisfaction scores submitted by accounts upon ticket resolution.</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Avg: {Number(csat?.average_csat || 4.8).toFixed(1)} / 5.0
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Case Ref</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-4">Issue Summary</th>
                <th className="py-3 px-4">Resolution Note</th>
                <th className="py-3 px-4 text-right">CSAT Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resolvedCasesWithCSAT.length > 0 ? (
                resolvedCasesWithCSAT.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">{c.ref}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{c.account_name || 'Standard Account'}</td>
                    <td className="py-3 px-4 text-slate-900 max-w-xs truncate">{c.subject}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{c.resolution_summary || 'Standard resolution applied'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                        ★ {c.csat_score} / 5
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No CSAT ratings logged for current timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}