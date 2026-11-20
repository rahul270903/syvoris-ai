import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Target, TrendingUp, AlertTriangle, CheckCircle2,
  ArrowRight, ShieldCheck, Filter, Search, RefreshCw,
  ExternalLink, Bot, Check, X, Building2, Calendar, FileText,
  DollarSign, ChevronRight, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { useCRM } from '../../store/CRMStore';
import { money } from '../../data/models';

export interface RecommendationItem {
  id: string;
  ref: string;
  title: string;
  category: 'Deal Acceleration' | 'Upsell & Cross-sell' | 'Churn Mitigation' | 'Operational Safety';
  priority: 'Critical' | 'High' | 'Medium';
  status: 'Active' | 'Applied' | 'Dismissed';
  confidence: number;
  potentialValue: number;
  target: {
    name: string;
    ref: string;
    link: string;
    type: 'Opportunity' | 'Organization' | 'Lead' | 'Inventory';
  };
  triggerSignal: string;
  prescribedAction: string;
  expectedOutcome: string;
  featureWeights: { feature: string; weight: number }[];
}

const DEFAULT_RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: 'rec-2026-001',
    ref: 'NBA-2026-0041',
    title: 'Offer Multi-Year Expansion Concession on Cyberdyne Systems',
    category: 'Deal Acceleration',
    priority: 'Critical',
    status: 'Active',
    confidence: 94.2,
    potentialValue: 135000,
    target: {
      name: 'Cyberdyne Systems · Enterprise Network Modernization',
      ref: 'OPP-2026-00004',
      link: '/sales/pipeline',
      type: 'Opportunity'
    },
    triggerSignal: 'Competitor vendor pricing proposal received by VP Engineering. Deal has lingered in Proposal stage for 18 days.',
    prescribedAction: 'Structure a 3-year term agreement with a 12% multi-year concession, bundling premium 24/7 Optical NOC SLA.',
    expectedOutcome: 'Increases win probability from 42% to 88% and secures $135k multi-year Total Contract Value (TCV).',
    featureWeights: [
      { feature: 'Competitor Intel Signal', weight: 40 },
      { feature: 'Stage Stagnation (>14d)', weight: 30 },
      { feature: 'Historical Multi-Year Win Rate', weight: 30 }
    ]
  },
  {
    id: 'rec-2026-002',
    ref: 'NBA-2026-0042',
    title: 'Cross-Sell 100G Transceiver Bundle to Fujikura Optical',
    category: 'Upsell & Cross-sell',
    priority: 'High',
    status: 'Active',
    confidence: 91.5,
    potentialValue: 48000,
    target: {
      name: 'Fujikura Optical Technologies Inc · Core Production',
      ref: 'ORG-2026-0003',
      link: '/customers/360',
      type: 'Organization'
    },
    triggerSignal: 'Customer increased fiber chassis bandwidth utilization to 88% over past 30 days based on telemetry sync.',
    prescribedAction: 'Propose automated SKU upgrade pack: Single-Mode 96-Core Armored Fiber + 100G Transceivers with volume discount.',
    expectedOutcome: 'Generates $48,000 in immediate hardware expansion ARR with zero sales friction.',
    featureWeights: [
      { feature: 'Bandwidth Utilization (>85%)', weight: 45 },
      { feature: 'Contract Renewal Proximity (60d)', weight: 35 },
      { feature: 'Clean Payment History', weight: 20 }
    ]
  },
  {
    id: 'rec-2026-003',
    ref: 'NBA-2026-0043',
    title: 'Executive Sponsor Re-engagement at NovaTech Solutions',
    category: 'Churn Mitigation',
    priority: 'Critical',
    status: 'Active',
    confidence: 96.0,
    potentialValue: 95000,
    target: {
      name: 'NovaTech Solutions · Enterprise SLA Tier',
      ref: 'ORG-2026-0002',
      link: '/customers/360',
      type: 'Organization'
    },
    triggerSignal: 'Primary buyer contact Elena Rostova transitioned to new role; 2 open high-priority webhook latency tickets.',
    prescribedAction: 'Schedule technical post-mortem review with incoming VP of Infrastructure and dispatch Tier-3 NOC Lead.',
    expectedOutcome: 'Averts estimated $95k annual contract churn risk and restores account sentiment score from 42 to >80.',
    featureWeights: [
      { feature: 'Key Contact Role Transition', weight: 50 },
      { feature: 'Open High-Priority Tickets (>3d)', weight: 35 },
      { feature: 'Support Sentiment Drop', weight: 15 }
    ]
  },
  {
    id: 'rec-2026-004',
    ref: 'NBA-2026-0044',
    title: 'Fast-Track BANT Qualification for Bob Collins (Apex Logistics)',
    category: 'Deal Acceleration',
    priority: 'High',
    status: 'Active',
    confidence: 89.4,
    potentialValue: 85000,
    target: {
      name: 'Bob Collins · Apex Manufacturing Solutions',
      ref: 'LED-2026-00003',
      link: '/leads',
      type: 'Lead'
    },
    triggerSignal: 'CEO direct phone intake completed; fit score calculated at 85/100; budget confirmed for Q1 rollout.',
    prescribedAction: 'Convert prospect directly to Active Account + Opportunity and schedule enterprise CPQ demo.',
    expectedOutcome: 'Accelerates sales velocity by 14 days, preventing lead cooling.',
    featureWeights: [
      { feature: 'C-Level Inbound Intake', weight: 40 },
      { feature: 'Confirmed Commercial Budget', weight: 35 },
      { feature: 'Immediate Need Horizon (Q1)', weight: 25 }
    ]
  },
  {
    id: 'rec-2026-005',
    ref: 'NBA-2026-0045',
    title: 'Rebalance Optical Transceiver Inventory Between Regional Hubs',
    category: 'Operational Safety',
    priority: 'Medium',
    status: 'Active',
    confidence: 93.1,
    potentialValue: 22000,
    target: {
      name: 'Central Warehouse to Northern Regional Hub Transfer',
      ref: 'SKU-OPT-100G',
      link: '/inventory/stock',
      type: 'Inventory'
    },
    triggerSignal: 'Northern Hub at -6 ATP deficit while Central Hub maintains 38 surplus units above safety buffer.',
    prescribedAction: 'Execute intra-warehouse transfer order of 20 units via scheduled ground logistics courier.',
    expectedOutcome: 'Eliminates $22,000 project delay penalty without issuing expensive emergency vendor PO.',
    featureWeights: [
      { feature: 'Regional Buffer Deficit', weight: 50 },
      { feature: 'Intra-hub Transit Lead Time (2d)', weight: 30 },
      { feature: 'Emergency PO Premium Cost Avoidance', weight: 20 }
    ]
  }
];

export function AIRecommendationsView() {
  const navigate = useNavigate();
  const { addAudit, addEvent } = useCRM();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(DEFAULT_RECOMMENDATIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRec, setSelectedRec] = useState<RecommendationItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const categories = ['All', 'Deal Acceleration', 'Upsell & Cross-sell', 'Churn Mitigation', 'Operational Safety'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleApply = async (rec: RecommendationItem) => {
    setApplyingId(rec.id);
    try {
      await new Promise(r => setTimeout(r, 500));
      setRecommendations(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'Applied' } : r));
      if (selectedRec && selectedRec.id === rec.id) {
        setSelectedRec({ ...selectedRec, status: 'Applied' });
      }

      addAudit('AI Recommendation Executed', 'Arjun Mehta', `${rec.ref}: ${rec.title}`);
      addEvent('ai.recommendation.applied', { ref: rec.ref }, `Executed recommendation: ${rec.prescribedAction}`);
      showToast(`Executed: ${rec.title}. Action initiated.`);
    } finally {
      setApplyingId(null);
    }
  };

  const handleDismiss = async (rec: RecommendationItem) => {
    setRecommendations(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'Dismissed' } : r));
    if (selectedRec && selectedRec.id === rec.id) {
      setSelectedRec({ ...selectedRec, status: 'Dismissed' });
    }
    addAudit('AI Recommendation Dismissed', 'Arjun Mehta', `${rec.ref}`);
    showToast(`Dismissed recommendation ${rec.ref}.`);
  };

  const filteredRecs = recommendations.filter(rec => {
    const matchesCategory = selectedCategory === 'All' || rec.category === selectedCategory;
    const matchesSearch = rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.prescribedAction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.target.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.ref.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCount = recommendations.filter(r => r.status === 'Active').length;
  const totalPipelineImpact = recommendations
    .filter(r => r.status === 'Active')
    .reduce((sum, r) => sum + r.potentialValue, 0);

  return (
    <div className="ai-workspace space-y-6">
      {/* Header */}
      <SectionHeading
        eyebrow="AI INTELLIGENCE & AGENT WORKFORCE / PRESCRIPTIVE INTELLIGENCE"
        title="AI Recommendations"
        subtitle="Next-Best-Action (NBA) engine powered by continuous CRM pattern analysis, win-rate models, and churn risk detection."
        action={
          <div className="flex items-center gap-2">
            <span className="ai-mode-pill"><i /> Real-Time Scoring</span>
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

      {/* Telemetry KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actionable Insights</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{activeCount} Ready</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">High-confidence triggers</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pipeline Impact</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{money(totalPipelineImpact)}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Unweighted potential value</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Model Confidence</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">92.8%</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Calibrated across 1,200 deals</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Target size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Historical Win Uplift</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">+24.6%</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">When actions accepted in &lt;48h</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search recommendations or accounts..."
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {filteredRecs.map(rec => (
          <div
            key={rec.id}
            className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
              rec.status === 'Applied'
                ? 'border-emerald-200 bg-emerald-50/10'
                : rec.status === 'Dismissed'
                ? 'border-slate-200 bg-slate-50 opacity-60'
                : 'border-slate-200/90'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {rec.ref}
                  </span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                    {rec.category}
                  </span>
                  <span
                    className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      rec.priority === 'Critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : rec.priority === 'High'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {rec.priority} Priority
                  </span>

                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 ml-auto lg:ml-0">
                    {rec.confidence.toFixed(1)}% Confidence
                  </span>

                  {rec.status === 'Applied' && (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} /> Applied
                    </span>
                  )}
                  {rec.status === 'Dismissed' && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full">
                      Dismissed
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{rec.title}</h3>

                {/* Target context */}
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <Building2 size={14} className="text-blue-600 flex-shrink-0" />
                  <span className="text-slate-500 font-medium">Target Context:</span>
                  <button
                    onClick={() => navigate(rec.target.link)}
                    className="font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                  >
                    {rec.target.name}
                    <ExternalLink size={10} />
                  </button>
                  <span className="text-slate-400 font-mono">({rec.target.ref})</span>
                </div>

                {/* Signal Driver */}
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Trigger Signal: </span>
                  {rec.triggerSignal}
                </div>

                {/* Prescribed Next-Best-Action Box */}
                <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-600" /> Prescribed Next-Best-Action:
                  </div>
                  <p className="text-xs text-blue-950 font-medium leading-relaxed">
                    {rec.prescribedAction}
                  </p>
                  <div className="text-[11px] text-emerald-700 font-semibold pt-1">
                    Expected Outcome: {rec.expectedOutcome}
                  </div>
                </div>
              </div>

              {/* Action Column Right */}
              <div className="flex flex-col items-end justify-between self-stretch gap-4 flex-shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Potential Value</span>
                  <div className="text-xl font-bold text-slate-900">{money(rec.potentialValue)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRec(rec)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    Explain Model
                  </button>

                  {rec.status === 'Active' && (
                    <>
                      <button
                        onClick={() => handleDismiss(rec)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                        title="Dismiss Recommendation"
                      >
                        <X size={15} />
                      </button>

                      <button
                        onClick={() => handleApply(rec)}
                        disabled={applyingId === rec.id}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        {applyingId === rec.id ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        <span>Execute NBA</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Model Explainability Drawer */}
      {selectedRec && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedRec.ref}
                </span>
                <button
                  onClick={() => setSelectedRec(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-3">{selectedRec.title}</h2>
              <div className="text-xs text-slate-500 mt-1">Prescriptive Intelligence Explanation</div>
            </div>

            <div className="p-6 space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Prescription Action Plan</h4>
                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-950 font-medium">
                  {selectedRec.prescribedAction}
                </div>
              </div>

              {/* Feature Attribution Weights */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Target size={14} className="text-blue-600" /> Feature Attribution & Weight Factors
                </h4>
                <div className="space-y-3">
                  {selectedRec.featureWeights.map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{f.feature}</span>
                        <strong className="text-slate-900">{f.weight}% attribution</strong>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${f.weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grounding Context */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-900 block">Grounding Telemetry:</span>
                <p className="text-slate-600">{selectedRec.triggerSignal}</p>
                <div className="pt-2 text-emerald-700 font-semibold">
                  Expected Impact: {selectedRec.expectedOutcome}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedRec(null)}
                className="btn secondary text-xs py-2 px-4"
              >
                Close Inspector
              </button>

              {selectedRec.status === 'Active' && (
                <button
                  onClick={() => handleApply(selectedRec)}
                  className="btn primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={14} />
                  <span>Execute Next-Best-Action</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
