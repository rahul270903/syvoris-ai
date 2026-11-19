import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, Download, RefreshCw,
  CheckCircle2, AlertCircle, Sparkles, Layers,
  ChevronDown
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { money } from '../../data/models';
import { api, OpportunityItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

const FORECAST_CATEGORIES = ['Commit', 'Best Case', 'Pipeline', 'Closed Won', 'Omitted'] as const;
type ForecastCategory = typeof FORECAST_CATEGORIES[number];

interface ForecastPeriod {
  label: string;
  quota: number;
}

const PERIODS: Record<string, ForecastPeriod> = {
  'Q4 2026': { label: 'Q4 2026 (Current)', quota: 1200000 },
  'Q1 2027': { label: 'Q1 2027', quota: 1400000 },
  'FY 2026': { label: 'Full Year 2026', quota: 4800000 },
  'FY 2027': { label: 'Full Year 2027', quota: 5600000 },
};

export function SalesForecastingView() {
  const { records, addAudit } = useCRM();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Q4 2026');
  const [scenario, setScenario] = useState<'conservative' | 'most_likely' | 'optimistic'>('most_likely');
  const [deals, setDeals] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const loadDeals = async () => {
    setLoading(true);
    try {
      const res = await api.listOpportunities({ limit: 100 });
      if (res?.items && res.items.length > 0) {
        setDeals(res.items);
      } else {
        // Map local store records if API has no rows
        const local = records('opportunities').map(o => ({
          id: o.id,
          tenant_id: 'default',
          account_id: o.fields.organizationId || 'acc-1',
          account_name: o.fields.customer || o.fields.organization || 'Client Enterprise',
          ref: o.ref,
          name: o.title,
          pipeline_id: 'standard-sales',
          stage: o.fields.stage || o.status || 'Qualification',
          amount: o.amount || 50000,
          currency: 'USD',
          probability: o.probability ?? o.fields.probability ?? (o.status === 'Closed Won' ? 100 : 50),
          expected_close_date: o.fields.closeDate || '2026-12-15',
          forecast_category: o.status === 'Closed Won' ? 'Closed Won' : (o.probability && o.probability >= 80 ? 'Commit' : (o.probability && o.probability >= 50 ? 'Best Case' : 'Pipeline')),
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
        amount: o.amount || 50000,
        currency: 'USD',
        probability: o.probability ?? o.fields.probability ?? (o.status === 'Closed Won' ? 100 : 50),
        expected_close_date: o.fields.closeDate || '2026-12-15',
        forecast_category: o.status === 'Closed Won' ? 'Closed Won' : (o.probability && o.probability >= 80 ? 'Commit' : (o.probability && o.probability >= 50 ? 'Best Case' : 'Pipeline')),
        risk_level: 'Low',
        custom_fields: {},
      } as OpportunityItem));
      setDeals(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const currentQuota = PERIODS[selectedPeriod]?.quota || 1200000;

  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalPipeline = deals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const closedWon = deals
      .filter(d => d.stage === 'Closed Won' || d.forecast_category === 'Closed Won')
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const commit = deals
      .filter(d => d.forecast_category === 'Commit')
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const bestCase = deals
      .filter(d => d.forecast_category === 'Best Case')
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const pipelineOnly = deals
      .filter(d => d.forecast_category === 'Pipeline')
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    // Weighted baseline calculation
    const weightedPipeline = deals.reduce((sum, d) => {
      const prob = Number(d.probability || 0);
      return sum + (Number(d.amount || 0) * prob) / 100;
    }, 0);

    // Scenario projected values
    let projectedARR = weightedPipeline;
    if (scenario === 'conservative') {
      projectedARR = closedWon + commit * 0.85;
    } else if (scenario === 'optimistic') {
      projectedARR = closedWon + commit + bestCase * 0.8 + pipelineOnly * 0.45;
    }

    const quotaAttainmentPct = currentQuota > 0 ? Math.round((projectedARR / currentQuota) * 100) : 0;
    const coverageMultiple = currentQuota > 0 ? (totalPipeline / currentQuota).toFixed(1) : '1.0';

    return {
      totalPipeline,
      closedWon,
      commit,
      bestCase,
      pipelineOnly,
      weightedPipeline,
      projectedARR,
      quotaAttainmentPct,
      coverageMultiple,
    };
  }, [deals, scenario, currentQuota]);

  // Update a deal's forecast category
  const handleCategoryChange = async (dealId: string, newCategory: ForecastCategory) => {
    const updated = deals.map(d => (d.id === dealId ? { ...d, forecast_category: newCategory } : d));
    setDeals(updated);
    try {
      await api.updateOpportunity(dealId, { forecast_category: newCategory });
      notify(`Updated deal forecast category to ${newCategory}`);
      addAudit('Forecast Category Changed', 'Arjun Mehta', `Deal ${dealId} set to ${newCategory}`);
    } catch {
      notify(`Updated locally to ${newCategory}`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Deal Reference', 'Opportunity Name', 'Customer Account', 'Stage', 'Amount', 'Probability', 'Forecast Category', 'Weighted Value', 'Expected Close'],
      ...deals.map(d => [
        d.ref,
        `"${d.name.replace(/"/g, '""')}"`,
        `"${(d.account_name || 'Client').replace(/"/g, '""')}"`,
        d.stage,
        d.amount,
        `${d.probability}%`,
        d.forecast_category || 'Pipeline',
        Math.round((Number(d.amount) * Number(d.probability)) / 100),
        d.expected_close_date || '',
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SYVORIS_Sales_Forecast_${selectedPeriod.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Forecast data exported to CSV');
  };

  const filteredDeals = useMemo(() => {
    if (selectedCategoryFilter === 'All') return deals;
    return deals.filter(d => (d.forecast_category || 'Pipeline') === selectedCategoryFilter);
  }, [deals, selectedCategoryFilter]);

  return (
    <div className="workspace-page space-y-4">
      {/* Page Header */}
      <SectionHeading
        eyebrow="SALES & REVENUE / REVENUE INTELLIGENCE"
        title="Sales Forecasting & Revenue Projection Engine"
        subtitle="Quarterly weighted pipeline rollups, category commit governance, stage probabilities and scenario projection models."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadDeals}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh live pipeline data from database"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Download size={13} />
              <span>Export Forecast Model</span>
            </button>
          </div>
        }
      />

      {/* Control Bar: Forecast Period and Scenario Modeling */}
      <div className="panel p-3 bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Forecast Period:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {Object.keys(PERIODS).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Simulation Scenario:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setScenario('conservative')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                scenario === 'conservative'
                  ? 'bg-amber-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Conservative (70%)
            </button>
            <button
              onClick={() => setScenario('most_likely')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                scenario === 'most_likely'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Most Likely (100%)
            </button>
            <button
              onClick={() => setScenario('optimistic')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                scenario === 'optimistic'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Optimistic (130%)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="panel p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Pipeline (Gross)</span>
            <Layers size={15} className="text-blue-500" />
          </div>
          <strong className="text-xl font-bold text-slate-800 font-manrope block">
            {money(metrics.totalPipeline)}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {deals.length} active opportunities in workspace
          </span>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Projected Revenue ({scenario.replace('_', ' ')})</span>
            <TrendingUp size={15} className="text-emerald-500" />
          </div>
          <strong className="text-xl font-bold text-emerald-600 font-manrope block">
            {money(metrics.projectedARR)}
          </strong>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            {metrics.quotaAttainmentPct}% of {money(currentQuota)} Quota
          </span>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">High-Confidence Commit</span>
            <CheckCircle2 size={15} className="text-blue-600" />
          </div>
          <strong className="text-xl font-bold text-slate-800 font-manrope block">
            {money(metrics.commit + metrics.closedWon)}
          </strong>
          <span className="text-[11px] text-blue-700 font-semibold mt-1 block">
            {money(metrics.closedWon)} Closed + {money(metrics.commit)} Commit
          </span>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Quota Target & Multiple</span>
            <Sparkles size={15} className="text-purple-500" />
          </div>
          <strong className="text-xl font-bold text-slate-800 font-manrope block">
            {metrics.coverageMultiple}x Coverage
          </strong>
          <span className="text-[11px] text-purple-700 font-semibold mt-1 block">
            Target Quota: {money(currentQuota)}
          </span>
        </div>
      </div>

      {/* Forecast Category Summary Breakdown */}
      <div className="panel p-4 bg-white border border-slate-200">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Forecast Category Rollup & Allocation
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'Closed Won' ? 'All' : 'Closed Won')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedCategoryFilter === 'Closed Won'
                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-1">
              <span>Closed Won</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">100%</span>
            </div>
            <strong className="text-base font-bold text-slate-900 block font-manrope">
              {money(metrics.closedWon)}
            </strong>
            <span className="text-[10px] text-slate-500">Already booked revenue</span>
          </div>

          <div
            onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'Commit' ? 'All' : 'Commit')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedCategoryFilter === 'Commit'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-blue-800 mb-1">
              <span>Commit</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">85-90%</span>
            </div>
            <strong className="text-base font-bold text-slate-900 block font-manrope">
              {money(metrics.commit)}
            </strong>
            <span className="text-[10px] text-slate-500">High-conviction contracts</span>
          </div>

          <div
            onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'Best Case' ? 'All' : 'Best Case')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedCategoryFilter === 'Best Case'
                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-800 mb-1">
              <span>Best Case</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">50-70%</span>
            </div>
            <strong className="text-base font-bold text-slate-900 block font-manrope">
              {money(metrics.bestCase)}
            </strong>
            <span className="text-[10px] text-slate-500">Upside potential deals</span>
          </div>

          <div
            onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'Pipeline' ? 'All' : 'Pipeline')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedCategoryFilter === 'Pipeline'
                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-1">
              <span>Standard Pipeline</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">20-40%</span>
            </div>
            <strong className="text-base font-bold text-slate-900 block font-manrope">
              {money(metrics.pipelineOnly)}
            </strong>
            <span className="text-[10px] text-slate-500">Active discovery / proposals</span>
          </div>
        </div>
      </div>

      {/* Forecast Deals Register */}
      <section className="panel p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 font-manrope">
              Opportunity Forecast Register & Category Governance
            </h2>
            <p className="text-xs text-slate-500">
              Adjust forecast category tags, review probability weightings, and govern deal commitments.
              {selectedCategoryFilter !== 'All' && (
                <span className="ml-2 font-bold text-blue-600">
                  (Filtered by {selectedCategoryFilter} · {filteredDeals.length} deals)
                </span>
              )}
            </p>
          </div>
          {selectedCategoryFilter !== 'All' && (
            <button
              onClick={() => setSelectedCategoryFilter('All')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Clear Category Filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="crm-table w-full">
            <thead>
              <tr>
                <th>REF</th>
                <th>OPPORTUNITY</th>
                <th>ACCOUNT / CUSTOMER</th>
                <th>STAGE</th>
                <th>DEAL AMOUNT</th>
                <th>PROBABILITY</th>
                <th>WEIGHTED VALUE</th>
                <th>FORECAST CATEGORY</th>
                <th>CLOSE DATE</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                    No opportunities match this filter.
                  </td>
                </tr>
              ) : (
                filteredDeals.map(d => {
                  const weighted = Math.round((Number(d.amount) * Number(d.probability)) / 100);
                  const cat = d.forecast_category || 'Pipeline';
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td>
                        <span className="ref-link font-mono text-xs">{d.ref}</span>
                      </td>
                      <td>
                        <strong className="text-slate-800 text-xs block">{d.name}</strong>
                      </td>
                      <td>
                        <span className="text-xs text-slate-600">{d.account_name || 'Enterprise Client'}</span>
                      </td>
                      <td>
                        <StatusPill status={d.stage} />
                      </td>
                      <td>
                        <strong className="text-xs text-slate-900">{money(d.amount)}</strong>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${d.probability}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{d.probability}%</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-mono font-bold text-emerald-700">
                          {money(weighted)}
                        </span>
                      </td>
                      <td>
                        <div className="relative inline-block">
                          <select
                            value={cat}
                            onChange={e => handleCategoryChange(d.id, e.target.value as ForecastCategory)}
                            className={`text-[11px] font-bold py-1 px-2 pr-6 rounded border cursor-pointer appearance-none ${
                              cat === 'Closed Won'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : cat === 'Commit'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : cat === 'Best Case'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : cat === 'Omitted'
                                ? 'bg-slate-100 text-slate-500 border-slate-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {FORECAST_CATEGORIES.map(fc => (
                              <option key={fc} value={fc}>
                                {fc}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={12}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-slate-500 font-mono">
                          {d.expected_close_date || 'Q4 2026'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
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
