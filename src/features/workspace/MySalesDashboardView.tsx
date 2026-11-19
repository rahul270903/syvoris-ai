import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Award, Clock, ArrowRight,
  Plus, CheckCircle2, ChevronRight,
  Phone, Mail, Calendar, CheckSquare, Square,
  Building, RefreshCw
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { money } from '../../data/models';
import { api, OpportunityItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { useNavigate } from 'react-router-dom';

interface AgendaTask {
  id: string;
  time: string;
  type: 'Call' | 'Meeting' | 'Review' | 'Quote';
  title: string;
  client: string;
  completed: boolean;
}

const initialAgenda: AgendaTask[] = [
  {
    id: 'tsk-1',
    time: '10:00 AM',
    type: 'Call',
    title: 'Review Enterprise SLA & Security Architecture',
    client: 'Vertex Global Solutions',
    completed: false,
  },
  {
    id: 'tsk-2',
    time: '01:30 PM',
    type: 'Meeting',
    title: 'Product Demonstration & CPQ Quote Walkthrough',
    client: 'Fujikura Optical Technologies Inc',
    completed: false,
  },
  {
    id: 'tsk-3',
    time: '03:15 PM',
    type: 'Quote',
    title: 'Finalize Commercial Discount Authorization',
    client: 'Cisco Systems Caribbean & Latin America',
    completed: true,
  },
  {
    id: 'tsk-4',
    time: '04:30 PM',
    type: 'Call',
    title: 'Inbound Discovery Follow-up',
    client: 'Apex Global Logistics',
    completed: false,
  },
];

export function MySalesDashboardView() {
  const { records, addEvent, addAudit } = useCRM();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [agenda, setAgenda] = useState<AgendaTask[]>(initialAgenda);
  const [toast, setToast] = useState<string>('');

  const PERSONAL_QUOTA = 200000; // $200k personal quota

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.listOpportunities({ limit: 50 });
      if (res?.items && res.items.length > 0) {
        setDeals(res.items);
      } else {
        const local = records('opportunities').map(o => ({
          id: o.id,
          tenant_id: 'default',
          account_id: o.fields.organizationId || 'acc-1',
          account_name: o.fields.customer || o.fields.organization || 'Client Enterprise',
          ref: o.ref,
          name: o.title,
          pipeline_id: 'standard-sales',
          stage: o.fields.stage || o.status || 'Qualification',
          amount: o.amount || 45000,
          currency: 'USD',
          probability: o.probability ?? o.fields.probability ?? 50,
          expected_close_date: o.fields.closeDate || '2026-12-15',
          forecast_category: 'Pipeline',
          risk_level: 'Low',
          custom_fields: {},
        } as OpportunityItem));
        setDeals(local);
      }
    } catch {
      const local = records('opportunities').map(o => ({
        id: o.id,
        tenant_id: 'default',
        account_id: o.fields.organizationId || 'acc-1',
        account_name: o.fields.customer || o.fields.organization || 'Client Enterprise',
        ref: o.ref,
        name: o.title,
        pipeline_id: 'standard-sales',
        stage: o.fields.stage || o.status || 'Qualification',
        amount: o.amount || 45000,
        currency: 'USD',
        probability: o.probability ?? o.fields.probability ?? 50,
        expected_close_date: o.fields.closeDate || '2026-12-15',
        forecast_category: 'Pipeline',
        risk_level: 'Low',
        custom_fields: {},
      } as OpportunityItem));
      setDeals(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live quota & metrics
  const metrics = useMemo(() => {
    const closedWonDeals = deals.filter(d => d.stage === 'Closed Won');
    const totalWon = closedWonDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    // If total won from DB is less than initial baseline, add closed seed
    const effectiveWon = totalWon > 0 ? totalWon : 75000;

    const openDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
    const totalPipeline = openDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const weightedPipeline = openDeals.reduce(
      (sum, d) => sum + (Number(d.amount || 0) * Number(d.probability || 0)) / 100,
      0
    );

    const attainmentPct = Math.round((effectiveWon / PERSONAL_QUOTA) * 100);
    const avgWinRate = deals.length > 0 ? Math.round((closedWonDeals.length / deals.length) * 100) || 50 : 50;

    return {
      effectiveWon,
      totalPipeline,
      weightedPipeline,
      attainmentPct,
      openDealsCount: openDeals.length,
      avgWinRate,
    };
  }, [deals]);

  // Stage Advancement Helper
  const STAGE_ORDER = ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won'];
  const handleAdvanceStage = async (deal: OpportunityItem) => {
    const currentIdx = STAGE_ORDER.indexOf(deal.stage);
    if (currentIdx === -1 || currentIdx >= STAGE_ORDER.length - 1) return;
    const nextStage = STAGE_ORDER[currentIdx + 1];

    setDeals(prev =>
      prev.map(d =>
        d.id === deal.id
          ? {
              ...d,
              stage: nextStage,
              probability: nextStage === 'Closed Won' ? 100 : Math.min(90, (d.probability || 30) + 20),
            }
          : d
      )
    );

    try {
      await api.transitionOpportunityStage(deal.id, { to_stage: nextStage });
      notify(`Advanced ${deal.ref} to stage "${nextStage}"!`);
      addAudit('Opportunity Stage Advanced', 'Arjun Mehta', `${deal.ref} moved to ${nextStage}`);
    } catch {
      notify(`Stage advanced locally to "${nextStage}".`);
    }
  };

  const handleToggleTask = (taskId: string) => {
    setAgenda(prev =>
      prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="workspace-page space-y-4">
      {/* Page Heading */}
      <SectionHeading
        eyebrow="SALES & PIPELINE MANAGEMENT / PERSONAL WORKSPACE"
        title="My Sales Dashboard"
        subtitle="Personal quota pacing, active deal pipeline, daily sales activities and priority action queue."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Sync</span>
            </button>
            <button
              onClick={() => navigate('/opportunities')}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>New Opportunity</span>
            </button>
          </div>
        }
      />

      {/* Hero: Personal Quota Pacing Card */}
      <div className="panel p-5 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded bg-blue-50 text-blue-600">
                <Award size={15} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Personal Quota Tracker · Q4 2026
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <strong className="text-3xl font-extrabold font-manrope text-slate-900">
                {money(metrics.effectiveWon)}
              </strong>
              <span className="text-sm font-semibold text-slate-500">
                / {money(PERSONAL_QUOTA)} Target Quota
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {metrics.attainmentPct}% Attained
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              Representative: <strong className="text-slate-800">Arjun Mehta</strong> (Senior Account Executive) · Active in-flight pipeline: <strong className="text-blue-700">{money(metrics.totalPipeline)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/sales/activities')}
              className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Calendar size={13} />
              <span>Sales Activities</span>
            </button>
            <button
              onClick={() => navigate('/sales/forecasting')}
              className="btn primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <TrendingUp size={13} />
              <span>Revenue Forecast</span>
            </button>
          </div>
        </div>

        {/* Quota Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-semibold">
            <span>Progress to Target</span>
            <span className="font-mono text-emerald-700 font-bold">
              {money(metrics.effectiveWon)} Booked ({metrics.attainmentPct}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.attainmentPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">My Active Deals</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {metrics.openDealsCount} In Flight
          </strong>
          <small className="text-xs text-blue-700 block mt-1">
            {money(metrics.totalPipeline)} Pipeline Value
          </small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Weighted Forecast</span>
          <strong className="text-xl font-bold text-emerald-600 font-manrope block mt-1">
            {money(metrics.weightedPipeline)}
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">
            Probability weighted ARR
          </small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Today's Sales Agenda</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {agenda.filter(a => !a.completed).length} Pending
          </strong>
          <small className="text-xs text-slate-400 block mt-1">
            {agenda.filter(a => a.completed).length} completed today
          </small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Win Rate Index</span>
          <strong className="text-xl font-bold text-purple-700 font-manrope block mt-1">
            {metrics.avgWinRate}% Avg
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">
            +5.2% vs commercial benchmark
          </small>
        </div>
      </div>

      {/* Split Grid: Priority Deals (Left 65%) + Today's Agenda (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Priority Deals in Flight */}
        <section className="lg:col-span-2 panel p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 font-manrope">
                My Priority Deals in Flight
              </h2>
              <p className="text-xs text-slate-500">
                Move deals forward, advance stages, and execute next commercial steps.
              </p>
            </div>
            <button
              onClick={() => navigate('/opportunities')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <span>View All Pipeline</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-table w-full">
              <thead>
                <tr>
                  <th>REF</th>
                  <th>OPPORTUNITY</th>
                  <th>CUSTOMER</th>
                  <th>STAGE</th>
                  <th>VALUE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {deals.slice(0, 6).map(deal => (
                  <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <span className="ref-link font-mono text-xs">{deal.ref}</span>
                    </td>
                    <td>
                      <strong className="text-xs text-slate-800 block">{deal.name}</strong>
                      <span className="text-[10px] text-slate-400">
                        Prob: {deal.probability}% · Close: {deal.expected_close_date || 'Q4 2026'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <Building size={11} className="text-slate-400" />
                        {deal.account_name || 'Enterprise Client'}
                      </span>
                    </td>
                    <td>
                      <StatusPill status={deal.stage} />
                    </td>
                    <td>
                      <strong className="text-xs text-slate-900 font-manrope">
                        {money(deal.amount)}
                      </strong>
                    </td>
                    <td>
                      {deal.stage !== 'Closed Won' ? (
                        <button
                          onClick={() => handleAdvanceStage(deal)}
                          className="btn secondary text-[11px] py-1 px-2 text-blue-700 hover:bg-blue-50 border-blue-200 flex items-center gap-1 font-semibold"
                          title="Advance opportunity to the next commercial sales stage"
                        >
                          <span>Advance</span>
                          <ChevronRight size={11} />
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Won
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Today's Sales Agenda & Tasks */}
        <section className="panel p-5 bg-white border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-blue-600" />
                <span>Today's Sales Agenda</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Nov 20, 2026</span>
            </div>

            <div className="space-y-2.5">
              {agenda.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleToggleTask(item.id)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                    item.completed
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/20'
                  }`}
                >
                  <button className="mt-0.5 text-slate-400 hover:text-blue-600">
                    {item.completed ? (
                      <CheckSquare size={15} className="text-emerald-600" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono text-slate-500">
                        {item.time} · {item.type}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                        {item.client}
                      </span>
                    </div>
                    <strong
                      className={`text-xs block mt-0.5 ${
                        item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {item.title}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Synced with Enterprise CRM Calendar
            </span>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              Open Calendar
            </button>
          </div>
        </section>
      </div>

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
