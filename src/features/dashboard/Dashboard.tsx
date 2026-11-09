import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight,
  Award, Box, Briefcase, Check, ChevronDown, Clock,
  CreditCard, FileCheck2, FileText, HeartHandshake, Layers,
  MoreHorizontal, Package, RefreshCw, ShieldCheck,
  ShoppingCart, Sparkles, Target, TrendingDown, TrendingUp,
  Users, Wallet, Activity
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Area, AreaChart
} from 'recharts';
import { useCRM } from '../../store/CRMStore';
import { money, shortDate } from '../../data/models';
import { StatusPill } from '../../components/StatusPill';

// Exact Financial Performance Data from Redem ERP screenshot
const financialPerformanceData = [
  { month: 'Jun', revenue: 260, expenses: 140 },
  { month: 'Jul', revenue: 340, expenses: 190 },
  { month: 'Aug', revenue: 410, expenses: 220 },
  { month: 'Sep', revenue: 470, expenses: 250 },
  { month: 'Oct', revenue: 530, expenses: 280 },
  { month: 'Nov', revenue: 580, expenses: 310 },
];

// Exact Cash Flow Overview Trend Data from Redem ERP screenshot
const cashFlowTrendData = [
  { month: 'Jun', value: 450 },
  { month: 'Jul', value: 475 },
  { month: 'Aug', value: 520 },
  { month: 'Sep', value: 610 },
  { month: 'Oct', value: 710 },
  { month: 'Nov', value: 760 },
];

const stages = ['New Opportunity', 'Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won'];

export function Dashboard() {
  const { records, update, addAudit } = useCRM();
  const navigate = useNavigate();

  const leads = records('leads');
  const deals = records('opportunities');
  const accounts = records('organizations');
  const cases = records('cases');
  const decisions = records('decisions');

  const [timeframe, setTimeframe] = useState('Last 6 months');
  const [activeTab, setActiveTab] = useState<'enterprise' | 'crm' | 'ai'>('enterprise');
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const pipeline = deals.filter(x => !['Closed Won', 'Closed Lost'].includes(x.status));
  const pipelineValue = pipeline.reduce((s, x) => s + x.amount, 0);
  const weighted = pipeline.reduce((s, x) => s + x.amount * (Number(x.probability ?? x.fields.probability ?? 0) / 100), 0);
  const won = deals.filter(x => x.status === 'Closed Won').reduce((s, x) => s + x.amount, 0);
  const pending = decisions.filter(x => x.status === 'Pending Approval').length;

  const quick = (path: string) => navigate(path);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 1. OVERVIEW / ENTERPRISE WORKSPACE HEADER (Exact Redem ERP text & layout) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            OVERVIEW / ENTERPRISE WORKSPACE
          </div>
          <h1 className="text-3xl md:text-[32px] font-bold text-slate-900 tracking-tight font-manrope">
            Good morning
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 font-normal">
            Saturday, November 7, 2026 · Here&apos;s what&apos;s happening across your business.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => notify('Dashboard synchronized with live enterprise platform telemetry.')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw size={14} className="text-slate-500" />
            <span>Refresh data</span>
          </button>
        </div>
      </div>

      {/* 2. DEMONSTRATION WORKSPACE NOTICE BANNER (Exact Redem ERP styling) */}
      <div className="bg-[#FEF9EE] border border-[#FDE68A] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-6 h-6 rounded-full border border-amber-500/50 flex items-center justify-center text-amber-700 flex-none mt-0.5 sm:mt-0 font-bold text-xs">
            i
          </div>
          <div>
            <span className="font-bold text-[13px] text-[#78350F] block">
              Demonstration workspace
            </span>
            <span className="text-[12px] text-[#92400E] leading-relaxed">
              All figures, transactions and operational updates on this screen are illustrative demo data. No live ERP or accounting system is connected.
            </span>
          </div>
        </div>
        <div className="flex-none">
          <span className="bg-[#FDF0D5] text-[#92400E] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            DEMO DATA
          </span>
        </div>
      </div>

      {/* 3. ROW 1: FOUR PRIMARY TOP KPI CARDS (Exact Redem ERP metrics & text) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total revenue */}
        <div
          onClick={() => quick('/sales-orders')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-slate-500">Total revenue</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Wallet size={19} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[28px] font-bold text-slate-900 tracking-tight font-manrope">
              $2.48M
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[12px] font-semibold text-emerald-600">
              <ArrowUpRight size={15} />
              <span>+5.2% vs previous period</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
            Recognised and operational revenue
          </div>
        </div>

        {/* Card 2: Total expenses */}
        <div
          onClick={() => quick('/analytics/pipeline')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-slate-500">Total expenses</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers size={19} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[28px] font-bold text-slate-900 tracking-tight font-manrope">
              $1.12M
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[12px] font-semibold text-amber-600">
              <ArrowDownRight size={15} />
              <span>+3.1% vs previous period</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
            Operating and business expenses
          </div>
        </div>

        {/* Card 3: Accounts receivable */}
        <div
          onClick={() => quick('/invoices')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-slate-500">Accounts receivable</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText size={19} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[28px] font-bold text-slate-900 tracking-tight font-manrope">
              $428.6K
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[12px] font-semibold text-amber-600">
              <ArrowDownRight size={15} />
              <span>-4.5% vs previous period</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
            Outstanding customer balances
          </div>
        </div>

        {/* Card 4: Accounts payable */}
        <div
          onClick={() => quick('/purchase-orders')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-slate-500">Accounts payable</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingCart size={19} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[28px] font-bold text-slate-900 tracking-tight font-manrope">
              $286.3K
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[12px] font-semibold text-emerald-600">
              <ArrowUpRight size={15} />
              <span>+2.4% vs previous period</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
            Open supplier obligations
          </div>
        </div>
      </div>

      {/* 4. ROW 2: FOUR SECONDARY MINI METRIC CARDS (Exact Redem ERP layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mini Card 1: Cash position */}
        <div
          onClick={() => quick('/invoices')}
          className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-none">
              <Wallet size={19} />
            </div>
            <div>
              <div className="text-[12px] text-slate-500 font-medium">Cash position</div>
              <div className="text-[18px] font-bold text-slate-900 font-manrope leading-tight">
                $1.84M
              </div>
              <div className="text-[10.5px] text-slate-400">Available cash demo</div>
            </div>
          </div>
          <div className="text-[12px] font-bold text-emerald-600">
            +6.8%
          </div>
        </div>

        {/* Mini Card 2: Open purchase orders */}
        <div
          onClick={() => quick('/purchase-orders')}
          className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-none">
              <ShoppingCart size={19} />
            </div>
            <div>
              <div className="text-[12px] text-slate-500 font-medium">Open purchase orders</div>
              <div className="text-[18px] font-bold text-slate-900 font-manrope leading-tight">
                42
              </div>
              <div className="text-[10.5px] text-slate-400">11 awaiting receipt</div>
            </div>
          </div>
          <button className="text-[12px] font-semibold text-sky-600 hover:underline">
            View
          </button>
        </div>

        {/* Mini Card 3: Pending approvals */}
        <div
          onClick={() => quick('/approvals')}
          className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-none">
              <Clock size={19} />
            </div>
            <div>
              <div className="text-[12px] text-slate-500 font-medium">Pending approvals</div>
              <div className="text-[18px] font-bold text-slate-900 font-manrope leading-tight">
                18
              </div>
              <div className="text-[10.5px] text-slate-400">Across 6 business areas</div>
            </div>
          </div>
          <span className="bg-amber-100 text-amber-800 text-[10.5px] font-semibold px-2 py-0.5 rounded">
            Needs review
          </span>
        </div>

        {/* Mini Card 4: Inventory valuation */}
        <div
          onClick={() => quick('/inventory/stock')}
          className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-none">
              <Box size={19} />
            </div>
            <div>
              <div className="text-[12px] text-slate-500 font-medium">Inventory valuation</div>
              <div className="text-[18px] font-bold text-slate-900 font-manrope leading-tight">
                $3.62M
              </div>
              <div className="text-[10.5px] text-slate-400">Across 8 locations</div>
            </div>
          </div>
          <div className="text-[12px] font-bold text-emerald-600">
            +2.8%
          </div>
        </div>
      </div>

      {/* 5. ROW 3: TWO MAIN CHARTS (Exact Redem ERP layout) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Chart: Financial performance (~60% width) */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight font-manrope">
                  Financial performance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revenue and expenses · monthly comparison
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={timeframe}
                  onChange={e => setTimeframe(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
                >
                  <option>Last 6 months</option>
                  <option>Last 12 months</option>
                  <option>This fiscal year</option>
                </select>
              </div>
            </div>

            {/* Legend row */}
            <div className="flex items-center justify-between py-2 text-xs text-slate-500 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                  <span>Revenue</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" />
                  <span>Expenses</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">USD - thousands</span>
            </div>

            {/* Dual Bar Chart */}
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialPerformanceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={v => `$${v}`}
                    domain={[0, 600]}
                    ticks={[150, 300, 450, 600]}
                  />
                  <Tooltip
                    formatter={(val: number) => [`$${val}K`, '']}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expenses" fill="#CBD5E1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Chart: Cash flow overview (~40% width) */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight font-manrope">
                  Cash flow overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inflow and outflow trend · monthly
                </p>
              </div>

              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreHorizontal size={18} />
              </button>
            </div>

            {/* Stat Callout */}
            <div className="mt-2 mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] font-bold text-slate-900 font-manrope tracking-tight">
                  $159K
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUpRight size={14} /> 6.4%
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Net cash flow - November</div>
            </div>

            {/* Smooth Area Curve Chart */}
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashFlowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={v => `$${v}`}
                    domain={[350, 850]}
                    ticks={[400, 600, 800]}
                  />
                  <Tooltip
                    formatter={(val: number) => [`$${val}K`, 'Net Inflow']}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cashFlowGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 6. EXTENDED CRM COCKPIT & OPERATIONS (Interactive Tabs for Deep Sales & Governance) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              CRM Deep Dive:
            </span>
            <div className="flex items-center gap-1">
              {[
                { id: 'enterprise', label: 'Overview Metrics' },
                { id: 'crm', label: 'Sales Funnel & Deals' },
                { id: 'ai', label: 'AI Action Queue' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => quick('/customers/360')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>Open Customer 360</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {activeTab === 'crm' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Open Pipeline Value</span>
              <span className="text-2xl font-bold text-slate-900 block mt-1">{money(pipelineValue)}</span>
              <span className="text-xs text-slate-500 mt-1 block">Weighted: {money(weighted)} across {pipeline.length} active deals</span>
              <button onClick={() => quick('/sales/pipeline')} className="btn primary small mt-3 w-full">
                Open Kanban Pipeline
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Lead Qualification Velocity</span>
              <span className="text-2xl font-bold text-slate-900 block mt-1">{leads.length} Leads</span>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">{leads.filter(l => l.status === 'Qualified').length} ready for conversion wizard</span>
              <button onClick={() => quick('/lead-conversion')} className="btn secondary small mt-3 w-full">
                Launch Conversion Wizard
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Service SLA & Support Health</span>
              <span className="text-2xl font-bold text-slate-900 block mt-1">{cases.filter(c => !['Resolved', 'Closed'].includes(c.status)).length} Open Cases</span>
              <span className="text-xs text-sky-600 font-semibold mt-1 block">99.4% SLA resolution compliance</span>
              <button onClick={() => quick('/cases')} className="btn secondary small mt-3 w-full">
                Inspect Support Queues
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-3 pt-1">
            <div className="text-xs text-slate-500">
              Human-in-the-loop proposals waiting for executive authorization:
            </div>
            {decisions.slice(0, 3).map(d => (
              <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{d.title}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{d.fields?.reason || d.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={d.status} />
                  <button onClick={() => quick('/approvals')} className="btn primary small">
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'enterprise' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Primary Workspace</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">Seiretsu Enterprise</strong>
              <span className="text-slate-500 text-[10px]">Cloud Multi-tenant Zone 1</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px]">ERP Bridge Status</span>
              <strong className="text-emerald-600 text-sm mt-0.5 block">Connected (38ms)</strong>
              <span className="text-slate-500 text-[10px]">Radium ERP Bridge active</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Active AI Agents</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">14 Autonomous Agents</strong>
              <span className="text-slate-500 text-[10px]">Suggest Only & Governed</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Security Governance</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">SOC2 Type II / GDPR</strong>
              <span className="text-slate-500 text-[10px]">Immutable audit logging</span>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="inline-toast">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
