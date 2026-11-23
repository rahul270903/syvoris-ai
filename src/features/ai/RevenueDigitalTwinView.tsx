import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Sliders, ShieldCheck, Download,
  Plus, RefreshCw, CheckCircle2, ArrowRight, Save, Trash2,
  FolderOpen, DollarSign, Target, Percent, Clock, AlertCircle, X
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { useCRM } from '../../store/CRMStore';
import { api, RevenueTwinSimulateResult } from '../../services/api';
import { money } from '../../data/models';

export interface SavedScenarioItem {
  id: string;
  name: string;
  ref: string;
  probabilityUplift: number;
  launchDelay: number;
  discountPct: number;
  dealSizeExpansion: number;
  simulatedValue: number;
  savedAt: string;
  notes: string;
}

const DEFAULT_SAVED_SCENARIOS: SavedScenarioItem[] = [
  {
    id: 'scen-01',
    ref: 'SCN-2026-001',
    name: 'Aggressive Q1 Optical Expansion',
    probabilityUplift: 15,
    launchDelay: 0,
    discountPct: 5,
    dealSizeExpansion: 15,
    simulatedValue: 345000,
    savedAt: '2 days ago',
    notes: 'Models 15% deal expansion across enterprise optical transceivers with aggressive close plan.'
  },
  {
    id: 'scen-02',
    ref: 'SCN-2026-002',
    name: 'Conservative Supply Chain Buffer',
    probabilityUplift: 0,
    launchDelay: 30,
    discountPct: 0,
    dealSizeExpansion: 0,
    simulatedValue: 182000,
    savedAt: 'Last week',
    notes: 'Stress tests pipeline against 30-day shipment delay from Tier-1 optical vendors.'
  }
];

export function RevenueDigitalTwinView() {
  const navigate = useNavigate();
  const { records, addAudit, addEvent } = useCRM();

  // Active Deals from CRM Store
  const opportunities = records('opportunities');

  // Simulation Sliders State
  const [probabilityUplift, setProbabilityUplift] = useState<number>(10);
  const [launchDelay, setLaunchDelay] = useState<number>(0);
  const [discountPct, setDiscountPct] = useState<number>(5);
  const [dealSizeExpansion, setDealSizeExpansion] = useState<number>(10);

  // Risk filter for table
  const [riskFilter, setRiskFilter] = useState<'All' | 'High Risk' | 'Medium Risk' | 'Low Risk'>('All');

  // Backend Live Result
  const [backendResult, setBackendResult] = useState<RevenueTwinSimulateResult | null>(null);
  const [loadingBackend, setLoadingBackend] = useState<boolean>(false);

  // Saved Scenarios Drawer
  const [savedScenarios, setSavedScenarios] = useState<SavedScenarioItem[]>(() => {
    try {
      const raw = localStorage.getItem('syvoris:revenue_twin:scenarios');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SAVED_SCENARIOS;
  });
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [newScenarioName, setNewScenarioName] = useState<string>('');
  const [newScenarioNotes, setNewScenarioNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Synchronize with backend API simulation
  useEffect(() => {
    let active = true;
    setLoadingBackend(true);
    api.simulateRevenueTwin({
      probability_uplift: probabilityUplift,
      launch_delay_days: launchDelay,
      discount_pct: discountPct
    })
      .then(res => {
        if (active) setBackendResult(res);
      })
      .catch(() => {
        // Fallback to local calculation
      })
      .finally(() => {
        if (active) setLoadingBackend(false);
      });

    return () => { active = false; };
  }, [probabilityUplift, launchDelay, discountPct]);

  // Deal-by-deal pipeline calculations
  const dealBreakdowns = useMemo(() => {
    const activeDeals = opportunities.filter(d => !['Closed Won', 'Closed Lost'].includes(d.status));
    
    return activeDeals.map(deal => {
      const baseAmount = Number(deal.amount) || 0;
      const baseProb = Math.min(100, Math.max(0, Number(deal.probability ?? deal.fields?.probability ?? 25)));
      const baseWeighted = baseAmount * (baseProb / 100);

      // Simulation factors
      const simProb = Math.min(100, Math.max(0, baseProb + probabilityUplift));
      const expandedAmount = baseAmount * (1 + dealSizeExpansion / 100);
      const discountedAmount = expandedAmount * (1 - discountPct / 100);
      const simWeighted = discountedAmount * (simProb / 100);

      const delta = simWeighted - baseWeighted;
      const riskCategory = simProb < 40 ? 'High Risk' : simProb < 75 ? 'Medium Risk' : 'Low Risk';

      return {
        id: deal.id,
        ref: deal.ref,
        title: deal.title,
        customer: deal.fields?.customer || 'Enterprise Account',
        baseAmount,
        baseProb,
        baseWeighted,
        simProb,
        discountedAmount,
        simWeighted,
        delta,
        riskCategory
      };
    });
  }, [opportunities, probabilityUplift, discountPct, dealSizeExpansion]);

  // Overall totals
  const totalBaseWeighted = useMemo(() => {
    return dealBreakdowns.reduce((sum, d) => sum + d.baseWeighted, 0) || 165000;
  }, [dealBreakdowns]);

  const totalSimulatedWeighted = useMemo(() => {
    if (backendResult?.simulated_weighted_value && backendResult.simulated_weighted_value > 0) {
      return backendResult.simulated_weighted_value * (1 + dealSizeExpansion / 100);
    }
    return dealBreakdowns.reduce((sum, d) => sum + d.simWeighted, 0) || 248000;
  }, [backendResult, dealBreakdowns, dealSizeExpansion]);

  const netVariance = totalSimulatedWeighted - totalBaseWeighted;
  const variancePct = totalBaseWeighted > 0 ? ((netVariance / totalBaseWeighted) * 100) : 0;
  const quarterlyQuota = 300000;
  const attainmentPct = Math.round((totalSimulatedWeighted / quarterlyQuota) * 100);

  // Waterfall component breakdown
  const upliftDelta = totalBaseWeighted * (probabilityUplift / 100);
  const expansionDelta = totalBaseWeighted * (dealSizeExpansion / 100);
  const discountErosion = (totalBaseWeighted + upliftDelta + expansionDelta) * (discountPct / 100);

  const handleSaveScenarioConfirm = () => {
    if (!newScenarioName.trim()) return;
    const newId = `scen-${Date.now()}`;
    const newRef = `SCN-2026-${(savedScenarios.length + 1).toString().padStart(3, '0')}`;
    const newItem: SavedScenarioItem = {
      id: newId,
      ref: newRef,
      name: newScenarioName.trim(),
      probabilityUplift,
      launchDelay,
      discountPct,
      dealSizeExpansion,
      simulatedValue: Math.round(totalSimulatedWeighted),
      savedAt: 'Just now',
      notes: newScenarioNotes.trim() || 'Simulated what-if scenario'
    };

    setSavedScenarios(prev => {
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem('syvoris:revenue_twin:scenarios', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addAudit('Revenue Twin Scenario Saved', 'Arjun Mehta', `${newRef}: ${newScenarioName}`);
    addEvent('ai.scenario.saved', { ref: newRef }, `Saved revenue twin scenario ${newRef}`);
    setSaveModalOpen(false);
    setNewScenarioName('');
    setNewScenarioNotes('');
    showToast(`Scenario ${newRef} saved successfully.`);
  };

  const handleLoadScenario = (scen: SavedScenarioItem) => {
    setProbabilityUplift(scen.probabilityUplift);
    setLaunchDelay(scen.launchDelay);
    setDiscountPct(scen.discountPct);
    setDealSizeExpansion(scen.dealSizeExpansion);
    setDrawerOpen(false);
    showToast(`Loaded scenario: ${scen.name}`);
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedScenarios(prev => {
      const updated = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('syvoris:revenue_twin:scenarios', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Deleted saved scenario.');
  };

  const handleExportCSV = () => {
    const headers = ['Ref', 'Title', 'Customer', 'Base Amount', 'Base Prob %', 'Base Weighted', 'Sim Prob %', 'Sim Weighted', 'Net Delta'];
    const rows = dealBreakdowns.map(d => [
      d.ref,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.customer.replace(/"/g, '""')}"`,
      d.baseAmount,
      d.baseProb,
      Math.round(d.baseWeighted),
      d.simProb,
      Math.round(d.simWeighted),
      Math.round(d.delta)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Revenue_Twin_Simulation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported simulation forecast to CSV.');
  };

  const filteredDeals = dealBreakdowns.filter(d => {
    if (riskFilter === 'All') return true;
    return d.riskCategory === riskFilter;
  });

  return (
    <div className="ai-workspace space-y-6">
      {/* Header */}
      <SectionHeading
        eyebrow="AI INTELLIGENCE & AGENT WORKFORCE / SCENARIO SIMULATION"
        title="Revenue Digital Twin"
        subtitle="Real-time stochastic sandbox. Run what-if simulations across win probabilities, commercial discounting, and launch timelines without touching production CRM records."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border border-slate-300 font-medium"
            >
              <FolderOpen size={14} className="text-blue-600" />
              <span>Saved Scenarios ({savedScenarios.length})</span>
            </button>

            <button
              onClick={() => setSaveModalOpen(true)}
              className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border border-slate-300 font-medium"
            >
              <Save size={14} className="text-emerald-600" />
              <span>Save Scenario</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border border-slate-300 font-medium"
            >
              <Download size={14} className="text-slate-600" />
              <span>Export CSV</span>
            </button>

            <span className="ai-mode-pill"><i /> Sandbox Isolated</span>
          </div>
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Baseline Weighted</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{money(totalBaseWeighted)}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Historical stage model</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Simulated Outcome</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{money(totalSimulatedWeighted)}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">Projected revenue realization</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Scenario Delta</span>
            <div className={`text-2xl font-bold mt-1 ${netVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netVariance >= 0 ? '+' : ''}{money(netVariance)}
            </div>
            <div className={`text-[11px] font-medium mt-0.5 ${variancePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {variancePct >= 0 ? '+' : ''}{variancePct.toFixed(1)}% vs baseline
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${netVariance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <Percent size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Attainment</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">{attainmentPct}% of Quota</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Quota: {money(quarterlyQuota)}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Target size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Controls & Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel Left */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Scenario Variables</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tweak variables to recalculate outcomes in real time.</p>
            </div>
            <Sliders size={18} className="text-blue-600" />
          </div>

          {/* Slider 1: Probability Uplift */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Win Probability Uplift:</span>
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                +{probabilityUplift}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={probabilityUplift}
              onChange={e => setProbabilityUplift(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Neutral)</span>
              <span>+12% (Moderate)</span>
              <span>+25% (Aggressive)</span>
            </div>
          </div>

          {/* Slider 2: Deal Size Expansion */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Deal Size Expansion (Upsell):</span>
              <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +{dealSizeExpansion}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="5"
              value={dealSizeExpansion}
              onChange={e => setDealSizeExpansion(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (List SKU)</span>
              <span>+15% (Bundles)</span>
              <span>+35% (Enterprise Pack)</span>
            </div>
          </div>

          {/* Slider 3: Commercial Discount Concession */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Commercial Concession (Discount):</span>
              <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                -{discountPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={discountPct}
              onChange={e => setDiscountPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Zero Concession)</span>
              <span>10% (Floor Limit)</span>
              <span>25% (CEO Exception)</span>
            </div>
          </div>

          {/* Slider 4: Launch Delay */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Shipment / Launch Lead Delay:</span>
              <span className="font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {launchDelay} Days
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={launchDelay}
              onChange={e => setLaunchDelay(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0d (On Time)</span>
              <span>30d (1 Month)</span>
              <span>90d (Quarter Delay)</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => {
                setProbabilityUplift(0);
                setDealSizeExpansion(0);
                setDiscountPct(0);
                setLaunchDelay(0);
                showToast('Reset all scenario sliders to baseline.');
              }}
              className="btn secondary text-xs py-2 px-3 w-full border border-slate-300"
            >
              Reset to Zero
            </button>
            <button
              onClick={() => setSaveModalOpen(true)}
              className="btn primary text-xs py-2 px-3 w-full flex items-center justify-center gap-1.5"
            >
              <Save size={13} />
              <span>Save Scenario</span>
            </button>
          </div>
        </div>

        {/* Waterfall & Visual Realization Right */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Revenue Realization Waterfall</h3>
                <p className="text-xs text-slate-500 mt-0.5">Component attribution explaining the bridge between baseline and simulated revenue.</p>
              </div>
              <BarChart3 size={18} className="text-blue-600" />
            </div>

            {/* Waterfall Steps */}
            <div className="mt-5 space-y-3.5">
              {/* 1. Baseline */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">1. Baseline Weighted Pipeline</span>
                  <strong className="text-slate-900">{money(totalBaseWeighted)}</strong>
                </div>
                <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              {/* 2. Win Rate Uplift */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-blue-700">+ Win Probability Uplift (+{probabilityUplift}%)</span>
                  <strong className="text-blue-700">+{money(upliftDelta)}</strong>
                </div>
                <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (upliftDelta / totalBaseWeighted) * 100 * 2)}%` }} />
                </div>
              </div>

              {/* 3. Deal Size Expansion */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-emerald-700">+ Deal Size Upsell (+{dealSizeExpansion}%)</span>
                  <strong className="text-emerald-700">+{money(expansionDelta)}</strong>
                </div>
                <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (expansionDelta / totalBaseWeighted) * 100 * 2)}%` }} />
                </div>
              </div>

              {/* 4. Discount Erosion */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-rose-700">- Commercial Discount Erosion (-{discountPct}%)</span>
                  <strong className="text-rose-700">-{money(discountErosion)}</strong>
                </div>
                <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (discountErosion / totalBaseWeighted) * 100 * 2)}%` }} />
                </div>
              </div>

              {/* 5. Net Simulated */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-900">= Net Simulated Pipeline Realization</span>
                  <span className="text-blue-600 font-mono text-base">{money(totalSimulatedWeighted)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Twin Commentary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-600" /> Revenue Digital Twin Synthesis:
            </div>
            <p className="leading-relaxed">
              At +{probabilityUplift}% win-rate acceleration and +{dealSizeExpansion}% bundle expansion, net revenue realization expands by {money(netVariance)} (+{variancePct.toFixed(1)}%). The {discountPct}% price concession is offset by accelerated deal conversion velocity.
            </p>
          </div>
        </div>
      </div>

      {/* Deal-by-Deal Impact Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Simulated Deal-by-Deal Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time inspection of active pipeline opportunities under the current simulation model.</p>
          </div>

          <div className="flex items-center gap-1.5">
            {(['All', 'Low Risk', 'Medium Risk', 'High Risk'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRiskFilter(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  riskFilter === tab
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Deal Reference</th>
                <th className="py-3 px-4">Opportunity & Customer</th>
                <th className="py-3 px-4 text-right">Base Amount</th>
                <th className="py-3 px-4 text-center">Base Prob</th>
                <th className="py-3 px-4 text-center">Sim Prob</th>
                <th className="py-3 px-4 text-right">Base Weighted</th>
                <th className="py-3 px-4 text-right">Sim Weighted</th>
                <th className="py-3 px-4 text-right">Net Delta</th>
                <th className="py-3 px-4 text-center">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeals.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{d.ref}</td>
                  <td className="py-3 px-4">
                    <strong className="text-slate-900 block">{d.title}</strong>
                    <span className="text-slate-500 text-[11px]">{d.customer}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{money(d.baseAmount)}</td>
                  <td className="py-3 px-4 text-center font-mono">{d.baseProb}%</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                    {d.simProb}%
                  </td>
                  <td className="py-3 px-4 text-right">{money(d.baseWeighted)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{money(d.simWeighted)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${d.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {d.delta >= 0 ? '+' : ''}{money(d.delta)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        d.riskCategory === 'Low Risk'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : d.riskCategory === 'Medium Risk'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {d.riskCategory}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved Scenarios Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen size={18} className="text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Saved Scenarios</h2>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Select any saved scenario to reload its simulation variables.</p>
            </div>

            <div className="p-6 space-y-4 flex-1">
              {savedScenarios.map(scen => (
                <div
                  key={scen.id}
                  onClick={() => handleLoadScenario(scen)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10.5px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {scen.ref}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">
                        {scen.name}
                      </h4>
                    </div>
                    <button
                      onClick={e => handleDeleteScenario(scen.id, e)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete Scenario"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{scen.notes}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-blue-600">{money(scen.simulatedValue)}</span>
                    <span className="text-slate-400 text-[11px]">{scen.savedAt}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn secondary text-xs py-2 w-full"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Current Scenario Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Save size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Save Revenue Scenario</h3>
                <p className="text-xs text-slate-500">Capture current simulation variables into the scenario catalog.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Scenario Name *</label>
                <input
                  type="text"
                  value={newScenarioName}
                  onChange={e => setNewScenarioName(e.target.value)}
                  placeholder="e.g. Q2 Expansion Plan with 10% Discount"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Assumptions & Commentary</label>
                <textarea
                  value={newScenarioNotes}
                  onChange={e => setNewScenarioNotes(e.target.value)}
                  placeholder="Briefly describe the strategy or commercial trigger..."
                  rows={3}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600 border border-slate-200/60">
                <div>Probability Uplift: <strong className="text-slate-900">+{probabilityUplift}%</strong></div>
                <div>Deal Size Expansion: <strong className="text-slate-900">+{dealSizeExpansion}%</strong></div>
                <div>Commercial Discount: <strong className="text-slate-900">-{discountPct}%</strong></div>
                <div>Simulated Value: <strong className="text-blue-600">{money(totalSimulatedWeighted)}</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="btn secondary text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenarioConfirm}
                disabled={!newScenarioName.trim()}
                className="btn primary text-xs py-2 px-4 shadow-sm"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
