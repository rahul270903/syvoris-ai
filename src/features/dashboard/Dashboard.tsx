import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight,
  Award, Box, Briefcase, Check, ChevronDown, Clock,
  CreditCard, FileCheck2, FileText, HeartHandshake, Layers,
  MoreHorizontal, Package, RefreshCw, ShieldCheck,
  ShoppingCart, Sparkles, Target, TrendingDown, TrendingUp,
  Users, Wallet, Activity, Database, Cpu, Zap
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Area, AreaChart
} from 'recharts';
import { useCRM } from '../../store/CRMStore';
import { money, shortDate } from '../../data/models';
import { StatusPill } from '../../components/StatusPill';

// Multi-Timeframe Financial Performance Datasets
const financialPerformanceMap: Record<string, { month: string; revenue: number; expenses: number }[]> = {
  'Last 6 months': [
    { month: 'Jun', revenue: 260, expenses: 140 },
    { month: 'Jul', revenue: 340, expenses: 190 },
    { month: 'Aug', revenue: 410, expenses: 220 },
    { month: 'Sep', revenue: 470, expenses: 250 },
    { month: 'Oct', revenue: 530, expenses: 280 },
    { month: 'Nov', revenue: 580, expenses: 310 },
  ],
  'Last 12 months': [
    { month: 'Dec', revenue: 210, expenses: 120 },
    { month: 'Jan', revenue: 230, expenses: 130 },
    { month: 'Feb', revenue: 240, expenses: 135 },
    { month: 'Mar', revenue: 290, expenses: 160 },
    { month: 'Apr', revenue: 310, expenses: 170 },
    { month: 'May', revenue: 330, expenses: 180 },
    { month: 'Jun', revenue: 260, expenses: 140 },
    { month: 'Jul', revenue: 340, expenses: 190 },
    { month: 'Aug', revenue: 410, expenses: 220 },
    { month: 'Sep', revenue: 470, expenses: 250 },
    { month: 'Oct', revenue: 530, expenses: 280 },
    { month: 'Nov', revenue: 580, expenses: 310 },
  ],
  'This fiscal year': [
    { month: 'Q1 (Apr-Jun)', revenue: 910, expenses: 490 },
    { month: 'Q2 (Jul-Sep)', revenue: 1220, expenses: 660 },
    { month: 'Q3 (Oct-Dec)', revenue: 1380, expenses: 740 },
    { month: 'Q4 (Projected)', revenue: 1540, expenses: 810 },
  ],
};

// Multi-Timeframe Cash Flow Trend Datasets
const cashFlowTrendMap: Record<string, { month: string; value: number }[]> = {
  'Last 6 months': [
    { month: 'Jun', value: 450 },
    { month: 'Jul', value: 475 },
    { month: 'Aug', value: 520 },
    { month: 'Sep', value: 610 },
    { month: 'Oct', value: 710 },
    { month: 'Nov', value: 760 },
  ],
  'Last 12 months': [
    { month: 'Dec', value: 380 },
    { month: 'Jan', value: 395 },
    { month: 'Feb', value: 410 },
    { month: 'Mar', value: 430 },
    { month: 'Apr', value: 440 },
    { month: 'May', value: 445 },
    { month: 'Jun', value: 450 },
    { month: 'Jul', value: 475 },
    { month: 'Aug', value: 520 },
    { month: 'Sep', value: 610 },
    { month: 'Oct', value: 710 },
    { month: 'Nov', value: 760 },
  ],
  'This fiscal year': [
    { month: 'Q1', value: 450 },
    { month: 'Q2', value: 520 },
    { month: 'Q3', value: 710 },
    { month: 'Q4 (Est)', value: 830 },
  ],
};

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
  const [cashMenuOpen, setCashMenuOpen] = useState(false);
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

  const activeFinancialData = financialPerformanceMap[timeframe] || financialPerformanceMap['Last 6 months'];
  const activeCashFlowData = cashFlowTrendMap[timeframe] || cashFlowTrendMap['Last 6 months'];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 1. OVERVIEW / ENTERPRISE WORKSPACE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            OVERVIEW / ENTERPRISE COMMAND COCKPIT
          </div>
          <h1 className="text-3xl md:text-[32px] font-bold text-slate-900 tracking-tight font-manrope">
            Good morning
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 font-normal">
            Saturday, November 7, 2026 · Unified enterprise operations, commercial revenue & AI workforce intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => notify('Dashboard synchronized with live multi-tenant telemetry.')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw size={14} className="text-slate-500" />
            <span>Refresh data</span>
          </button>
        </div>
      </div>

      {/* 2. ENTERPRISE LIVE STATUS BAR (Replaces wireframe demonstration banner) */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0e213d] to-slate-900 border border-slate-700/80 rounded-2xl p-4 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 flex-none shadow-inner">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white font-manrope">
                Enterprise Operations Command
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Multi-tenant synchronization active: PostgreSQL kernel RLS, Radium ERP general ledger (38ms), and 14 autonomous AI agents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-none">
          <button
            onClick={() => quick('/workflows/lifecycle')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Workflow Navigator
          </button>
          <button
            onClick={() => quick('/integrations/radium')}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors shadow-2xs cursor-pointer"
          >
            Inspect ERP Bridge
          </button>
        </div>
      </div>

      {/* 3. ROW 1: FOUR PRIMARY TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total revenue */}
        <div
          onClick={() => {
            quick('/sales/performance');
            notify('Navigating to sales revenue and commercial performance breakdown.');
          }}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title="Click to view sales and revenue performance"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Total revenue</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
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
          <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span>Recognised and operational revenue</span>
            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
          </div>
        </div>

        {/* Card 2: Total expenses (FIXED: Navigates cleanly to purchase orders & operating expenses) */}
        <div
          onClick={() => {
            quick('/purchase-orders');
            notify('Navigating to operating expenses and vendor purchase orders.');
          }}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title="Click to inspect operating expenses & vendor purchase orders"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">Total expenses</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
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
          <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span>Operating and business procurement</span>
            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-indigo-600 transition-opacity" />
          </div>
        </div>

        {/* Card 3: Accounts receivable */}
        <div
          onClick={() => {
            quick('/invoices');
            notify('Navigating to accounts receivable and customer invoices.');
          }}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title="Click to view accounts receivable & invoice lifecycle"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-slate-500 group-hover:text-emerald-600 transition-colors">Accounts receivable</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
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
          <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span>Outstanding customer balances</span>
            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity" />
          </div>
        </div>

        {/* Card 4: Accounts payable */}
        <div
          onClick={() => {
            quick('/purchase-orders');
            notify('Navigating to accounts payable and vendor supplier obligations.');
          }}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          title="Click to view accounts payable & vendor commitments"
        >
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium text-slate-500 group-hover:text-purple-600 transition-colors">Accounts payable</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
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
          <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span>Open supplier obligations</span>
            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-purple-600 transition-opacity" />
          </div>
        </div>
      </div>

      {/* 4. ROW 2: FOUR SECONDARY MINI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mini Card 1: Cash position */}
        <div
          onClick={() => {
            quick('/invoices');
            notify('Navigating to available cash balances and collections ledger.');
          }}
          className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer"
          title="Click to inspect cash positions & collections"
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
              <div className="text-[10.5px] text-slate-400">Available liquidity & reserves</div>
            </div>
          </div>
          <div className="text-[12px] font-bold text-emerald-600">
            +6.8%
          </div>
        </div>

        {/* Mini Card 2: Open purchase orders */}
        <div
          onClick={() => quick('/purchase-orders')}
          className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer"
          title="Click to view open purchase orders"
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
          <span className="text-[12px] font-semibold text-sky-600 hover:underline">
            View
          </span>
        </div>

        {/* Mini Card 3: Pending approvals */}
        <div
          onClick={() => quick('/approvals')}
          className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer"
          title="Click to view commercial approvals"
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
          className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer"
          title="Click to inspect warehouse inventory valuation"
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

      {/* 5. ROW 3: TWO FUNCTIONAL MAIN CHARTS WITH WORKFLOW NAVIGATION */}
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
                  Revenue and expenses · monthly comparison & margin tracking
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => quick('/sales/performance')}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Open full commercial performance report"
                >
                  <span>Detailed Report</span>
                  <ArrowUpRight size={13} />
                </button>

                <select
                  value={timeframe}
                  onChange={e => {
                    setTimeframe(e.target.value);
                    notify(`Financial view updated for: ${e.target.value}`);
                  }}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option>Last 6 months</option>
                  <option>Last 12 months</option>
                  <option>This fiscal year</option>
                </select>
              </div>
            </div>

            {/* Legend and KPI sub-row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 text-xs text-slate-500 border-b border-slate-100 mb-3 gap-2">
              <div className="flex items-center gap-4">
                <span
                  onClick={() => quick('/sales/performance')}
                  className="flex items-center gap-1.5 font-medium cursor-pointer hover:text-blue-600"
                >
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                  <span>Revenue ($2.48M)</span>
                </span>
                <span
                  onClick={() => quick('/purchase-orders')}
                  className="flex items-center gap-1.5 font-medium cursor-pointer hover:text-indigo-600"
                >
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" />
                  <span>Expenses ($1.12M)</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-500 font-medium">Margin: <b className="text-emerald-600 font-bold">54.8%</b></span>
                <span className="text-slate-400">USD (thousands)</span>
              </div>
            </div>

            {/* Dual Bar Chart */}
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeFinancialData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={v => `$${v}`}
                  />
                  <Tooltip
                    formatter={(val: number, name: string) => [`$${val}K`, name === 'revenue' ? 'Revenue' : 'Expenses']}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    className="cursor-pointer"
                    onClick={() => quick('/sales/performance')}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="#CBD5E1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    className="cursor-pointer"
                    onClick={() => quick('/purchase-orders')}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom KPI metrics */}
            <div className="grid grid-cols-3 gap-2 pt-3 mt-1 border-t border-slate-100 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="text-slate-400 block text-[10.5px]">EBITDA</span>
                <span className="font-bold text-slate-800 text-sm">$1.36M</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="text-slate-400 block text-[10.5px]">Gross Margin</span>
                <span className="font-bold text-emerald-600 text-sm">69.4%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="text-slate-400 block text-[10.5px]">Net Growth</span>
                <span className="font-bold text-blue-600 text-sm">+8.4% YoY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Chart: Cash flow overview (~40% width) */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative">
          <div>
            <div className="flex items-start justify-between pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight font-manrope">
                  Cash flow overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inflow and outflow trend · monthly operating surplus
                </p>
              </div>

              <div className="flex items-center gap-1.5 relative">
                <button
                  onClick={() => quick('/invoices')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Open cash flow & invoice ledger"
                >
                  <span>Ledger</span>
                  <ArrowRight size={12} className="inline ml-0.5" />
                </button>

                <button
                  onClick={() => setCashMenuOpen(!cashMenuOpen)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                >
                  <MoreHorizontal size={18} />
                </button>

                {cashMenuOpen && (
                  <div className="dropdown shadow-xl border border-slate-200 rounded-xl bg-white w-52 p-1.5 z-20" style={{ right: 0, top: 'calc(100% + 4px)' }}>
                    <button
                      onClick={() => { setCashMenuOpen(false); quick('/invoices'); }}
                      className="w-full text-left p-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Customer Invoices</span>
                      <ArrowRight size={12} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => { setCashMenuOpen(false); quick('/integrations/radium'); }}
                      className="w-full text-left p-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Reconcile with Radium ERP</span>
                      <ArrowRight size={12} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => { setCashMenuOpen(false); quick('/ai/revenue-twin'); }}
                      className="w-full text-left p-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Revenue Digital Twin</span>
                      <ArrowRight size={12} className="text-slate-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stat Callout */}
            <div className="mt-2 mb-3 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[26px] font-bold text-slate-900 font-manrope tracking-tight">
                    $159K
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <ArrowUpRight size={14} /> 6.4%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Net monthly operating cash surplus</div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-slate-600 block">DSO: 32 days</span>
                <span className="text-[11px] text-emerald-600 font-medium">-3 days vs target</span>
              </div>
            </div>

            {/* Smooth Area Curve Chart */}
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeCashFlowData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashFlowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
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
                    className="cursor-pointer"
                    onClick={() => quick('/invoices')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom 90-day projection pill */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">90-Day Projected Surplus:</span>
              <span className="font-bold text-emerald-600">+$482K (Healthy Runway)</span>
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
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
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
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
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
            <div
              onClick={() => quick('/organizations')}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
              title="Click to view organizations & enterprise accounts"
            >
              <span className="text-slate-400 block text-[11px]">Primary Workspace</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">BluePeak Innovations</strong>
              <span className="text-slate-500 text-[10px]">Cloud Multi-tenant Zone 1</span>
            </div>
            <div
              onClick={() => quick('/integrations/radium')}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-300 transition-colors cursor-pointer"
              title="Click to view Radium ERP Integration bridge"
            >
              <span className="text-slate-400 block text-[11px]">ERP Bridge Status</span>
              <strong className="text-emerald-600 text-sm mt-0.5 block">Connected (38ms)</strong>
              <span className="text-slate-500 text-[10px]">Radium ERP Bridge active</span>
            </div>
            <div
              onClick={() => quick('/ai/agents')}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 transition-colors cursor-pointer"
              title="Click to inspect 14 AI specialist agents"
            >
              <span className="text-slate-400 block text-[11px]">Active AI Agents</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">14 Autonomous Agents</strong>
              <span className="text-slate-500 text-[10px]">Suggest Only & Governed</span>
            </div>
            <div
              onClick={() => quick('/admin/audit')}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-300 transition-colors cursor-pointer"
              title="Click to view immutable audit logging"
            >
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
