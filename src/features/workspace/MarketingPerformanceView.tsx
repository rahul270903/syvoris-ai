import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, BarChart3, PieChart, DollarSign,
  ArrowRight, Filter, Download, CheckCircle2,
  Share2, Target, Award, RefreshCw
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { money } from '../../data/models';
import { api, CampaignItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

interface ChannelMetric {
  channel: string;
  spend: number;
  leads: number;
  pipelineInfluenced: number;
  closedWon: number;
  cpl: number;
  roi: number;
}

const CHANNEL_METRICS: ChannelMetric[] = [
  { channel: 'Email Marketing Drips', spend: 4500, leads: 114, pipelineInfluenced: 120000, closedWon: 75000, cpl: 39, roi: 833 },
  { channel: 'LinkedIn Enterprise B2B', spend: 18500, leads: 92, pipelineInfluenced: 180000, closedWon: 65000, cpl: 201, roi: 351 },
  { channel: 'Organic Search & Product SEO', spend: 6000, leads: 88, pipelineInfluenced: 95000, closedWon: 45000, cpl: 68, roi: 750 },
  { channel: 'Executive Industry Summits', spend: 14000, leads: 32, pipelineInfluenced: 150000, closedWon: 85000, cpl: 437, roi: 607 },
  { channel: 'Inbound Referral Partner', spend: 5000, leads: 16, pipelineInfluenced: 40000, closedWon: 21000, cpl: 312, roi: 420 },
];

export function MarketingPerformanceView() {
  const { addAudit } = useCRM();
  const [attributionModel, setAttributionModel] = useState<'first_touch' | 'last_touch' | 'linear'>('linear');
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<string>('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.listCampaigns({ limit: 50 });
      if (res?.items && res.items.length > 0) {
        setCampaigns(res.items);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSpend = useMemo(() => CHANNEL_METRICS.reduce((s, c) => s + c.spend, 0), []);
  const totalPipeline = useMemo(() => CHANNEL_METRICS.reduce((s, c) => s + c.pipelineInfluenced, 0), []);
  const totalWon = useMemo(() => CHANNEL_METRICS.reduce((s, c) => s + c.closedWon, 0), []);
  const overallROI = Math.round(((totalWon - totalSpend) / totalSpend) * 100);

  const handleExportCSV = () => {
    const rows = [
      ['Channel', 'Marketing Spend', 'Leads Generated', 'Pipeline Influenced', 'Closed Won Revenue', 'Cost Per Lead', 'ROI %'],
      ...CHANNEL_METRICS.map(c => [
        c.channel,
        c.spend,
        c.leads,
        c.pipelineInfluenced,
        c.closedWon,
        c.cpl,
        `${c.roi}%`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SYVORIS_Marketing_Performance_${attributionModel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Marketing performance report exported to CSV');
    addAudit('Marketing Performance Exported', 'Arjun Mehta', `Model: ${attributionModel}`);
  };

  return (
    <div className="workspace-page space-y-4">
      {/* Header */}
      <SectionHeading
        eyebrow="MARKETING & CUSTOMER EXPERIENCE / ATTRIBUTION ENGINE"
        title="Marketing Performance & Revenue Attribution Intelligence"
        subtitle="Measure multichannel pipeline influence, attribution models, conversion funnels, and true marketing ROI."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Download size={13} />
              <span>Export Performance Report</span>
            </button>
          </div>
        }
      />

      {/* Attribution Model Switcher */}
      <div className="panel p-3 bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Attribution Methodology:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setAttributionModel('first_touch')}
              className={`px-3 py-1 rounded font-semibold transition-all ${
                attributionModel === 'first_touch'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              First Touch (Acquisition)
            </button>
            <button
              onClick={() => setAttributionModel('linear')}
              className={`px-3 py-1 rounded font-semibold transition-all ${
                attributionModel === 'linear'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Linear Multi-Touch (Even Split)
            </button>
            <button
              onClick={() => setAttributionModel('last_touch')}
              className={`px-3 py-1 rounded font-semibold transition-all ${
                attributionModel === 'last_touch'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last Touch (Opportunity Creation)
            </button>
          </div>
        </div>
        <span className="text-[11px] text-slate-500">
          Model: <strong className="text-slate-800">{attributionModel.replace('_', ' ').toUpperCase()}</strong>
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Marketing Spend</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {money(totalSpend)}
          </strong>
          <small className="text-xs text-slate-400 block mt-1">Across 5 primary channels</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Pipeline Influenced</span>
          <strong className="text-xl font-bold text-blue-600 font-manrope block mt-1">
            {money(totalPipeline)}
          </strong>
          <small className="text-xs text-blue-700 font-semibold block mt-1">Active pipeline touchpoints</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Attributed Booked Revenue</span>
          <strong className="text-xl font-bold text-emerald-600 font-manrope block mt-1">
            {money(totalWon)}
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">Closed won deals</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Blended Marketing ROI</span>
          <strong className="text-xl font-bold text-purple-700 font-manrope block mt-1">
            +{overallROI}% Net ROI
          </strong>
          <small className="text-xs text-purple-700 font-semibold block mt-1">6.0x Revenue multiple</small>
        </div>
      </div>

      {/* Conversion Funnel Bar */}
      <div className="panel p-5 bg-white border border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Enterprise Multichannel Conversion Funnel
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">1. Impressions</span>
            <strong className="text-base font-extrabold text-slate-800 font-manrope">124,500</strong>
            <small className="text-[10px] text-slate-400 block mt-0.5">Top of Funnel</small>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">2. Clicks & Visits</span>
            <strong className="text-base font-extrabold text-slate-800 font-manrope">8,420</strong>
            <small className="text-[10px] text-blue-600 block mt-0.5">6.8% CTR</small>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">3. Inbound MQLs</span>
            <strong className="text-base font-extrabold text-slate-800 font-manrope">342</strong>
            <small className="text-[10px] text-blue-600 block mt-0.5">4.1% Conv.</small>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">4. Sales Qualified</span>
            <strong className="text-base font-extrabold text-indigo-700 font-manrope">128</strong>
            <small className="text-[10px] text-indigo-600 block mt-0.5">37.4% MQL→SQL</small>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">5. Pipeline Deals</span>
            <strong className="text-base font-extrabold text-blue-700 font-manrope">42 Deals</strong>
            <small className="text-[10px] text-blue-600 block mt-0.5">32.8% Opp Rate</small>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-300">
            <span className="text-[10px] font-bold text-emerald-800 block uppercase">6. Closed Won</span>
            <strong className="text-base font-extrabold text-emerald-700 font-manrope">18 Accounts</strong>
            <small className="text-[10px] text-emerald-800 font-bold block mt-0.5">42.9% Win Rate</small>
          </div>
        </div>
      </div>

      {/* Channel Attribution Matrix */}
      <section className="panel p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 font-manrope">
              Channel Attribution & Cost Efficiency Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Breakdown of marketing expenditure, lead volume, attributed pipeline, and net return on ad spend.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="crm-table w-full">
            <thead>
              <tr>
                <th>MARKETING CHANNEL</th>
                <th>EXPENDITURE</th>
                <th>LEADS GENERATED</th>
                <th>COST PER LEAD (CPL)</th>
                <th>PIPELINE INFLUENCED</th>
                <th>ATTRIBUTED REVENUE</th>
                <th>CHANNEL ROI</th>
              </tr>
            </thead>
            <tbody>
              {CHANNEL_METRICS.map(ch => (
                <tr key={ch.channel} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <strong className="text-xs text-slate-800">{ch.channel}</strong>
                  </td>
                  <td>
                    <span className="text-xs font-mono font-semibold text-slate-700">{money(ch.spend)}</span>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-slate-900">{ch.leads}</span>
                  </td>
                  <td>
                    <span className="text-xs font-mono text-slate-600">${ch.cpl}</span>
                  </td>
                  <td>
                    <strong className="text-xs font-mono text-blue-700">{money(ch.pipelineInfluenced)}</strong>
                  </td>
                  <td>
                    <strong className="text-xs font-mono text-emerald-700">{money(ch.closedWon)}</strong>
                  </td>
                  <td>
                    <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      +{ch.roi}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="inline-toast">
          <CheckCircle2 size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
