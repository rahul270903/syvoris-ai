import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Cloud, Search, ShieldCheck, Check, Plus, ArrowRight,
  Star, Sparkles, Filter, ExternalLink, X, Cpu, CheckCircle2,
  AlertTriangle, RefreshCw, Layers, Lock, Sliders
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { useCRM } from '../../store/CRMStore';
import { api } from '../../services/api';

export interface AgentPackage {
  id: string;
  name: string;
  category: 'Revenue & Sales' | 'Customer Support & NOC' | 'Supply Chain & ERP' | 'Security & Compliance' | 'Data Governance';
  version: string;
  badge: 'Certified Core' | 'Enterprise Verified' | 'Community Partner';
  rating: number;
  reviewsCount: number;
  installs: number;
  model: string;
  autonomyDefault: 'Suggest Only' | 'Act with Approval' | 'Act Autonomously';
  description: string;
  highlights: string[];
  requiredTools: string[];
  guardrails: string[];
  latencySla: string;
  author: string;
  installed: boolean;
}

const INITIAL_PACKAGES: AgentPackage[] = [
  {
    id: 'pkg-sdr-inbound',
    name: 'Inbound SDR Qualification Agent',
    category: 'Revenue & Sales',
    version: 'v3.2.0',
    badge: 'Certified Core',
    rating: 4.9,
    reviewsCount: 148,
    installs: 1420,
    model: 'GPT-4o + Tool Use',
    autonomyDefault: 'Suggest Only',
    description: 'Autonomous inbound prospect intake, corporate domain enrichment, explainable BANT score calculation, and sales rep meeting calendar assignment.',
    highlights: ['Sub-second lead qualification', 'Auto-syncs BANT checklist to CRM', 'Direct Google Calendar / Outlook routing'],
    requiredTools: ['crm.leads.read', 'crm.leads.score', 'calendar.booking.create'],
    guardrails: ['Cannot change lead owner without approval', 'Rate-limited to 50 intakes/min'],
    latencySla: '420ms',
    author: 'Syvoris AI Labs',
    installed: true
  },
  {
    id: 'pkg-cpq-margin',
    name: 'CPQ Margin & Discount Guardian',
    category: 'Revenue & Sales',
    version: 'v2.8.4',
    badge: 'Certified Core',
    rating: 4.95,
    reviewsCount: 312,
    installs: 2850,
    model: 'Claude 3.5 Sonnet + RAG',
    autonomyDefault: 'Act with Approval',
    description: 'Real-time multi-currency commercial pricing intelligence. Analyzes historical gross margins, customer tier volume brackets, and flags unapproved line-item discounts.',
    highlights: ['Strict margin floor enforcement (>28%)', 'Auto-generates executive approval briefs', 'Validates ERP pricing books'],
    requiredTools: ['crm.quotes.read', 'crm.quotes.propose_discount', 'catalog.prices.read'],
    guardrails: ['Hard ceiling at 25% discount', 'Dual-key sign-off required for >$100k ARR deals'],
    latencySla: '185ms',
    author: 'Syvoris AI Labs',
    installed: true
  },
  {
    id: 'pkg-noc-optical',
    name: '24/7 Optical Network NOC Dispatcher',
    category: 'Customer Support & NOC',
    version: 'v4.1.2',
    badge: 'Certified Core',
    rating: 4.88,
    reviewsCount: 94,
    installs: 890,
    model: 'Gemini 1.5 Pro + Telemetry RAG',
    autonomyDefault: 'Act with Approval',
    description: 'In-flight optical transceiver telemetry monitor and auto-ticket generator. Correlates dBm power drops, fiber degradation spikes, and routes Tier-3 engineering dispatches.',
    highlights: ['Zero-lag incident triage', 'Calculates SLA breach countdowns', 'Drafts customer impact bulletins'],
    requiredTools: ['service.cases.create', 'service.telemetry.ingest', 'sla.breach.notify'],
    guardrails: ['Customer-facing outage bulletins require human approval', 'Read-only access to customer switches'],
    latencySla: '240ms',
    author: 'Syvoris Infrastructure Ops',
    installed: true
  },
  {
    id: 'pkg-atp-inventory',
    name: 'Multi-Warehouse ATP Inventory Optimizer',
    category: 'Supply Chain & ERP',
    version: 'v1.9.0',
    badge: 'Enterprise Verified',
    rating: 4.82,
    reviewsCount: 67,
    installs: 610,
    model: 'DeepSeek R1 + Linear Solver',
    autonomyDefault: 'Suggest Only',
    description: 'Dynamic available-to-promise calculation across regional logistics hubs. Prevents stock-outs, calculates transit lead times, and recommends purchase reorder triggers.',
    highlights: ['Considers active sales reservations', 'Automates safety stock replenishment alerts', 'Calculates transit carbon optimization'],
    requiredTools: ['inventory.stock.read', 'inventory.purchase_orders.draft', 'logistics.carriers.quote'],
    guardrails: ['Cannot execute binding Purchase Orders autonomously', 'Budget capped at $50k per PO draft'],
    latencySla: '510ms',
    author: 'SupplyChain Intelligent Systems',
    installed: false
  },
  {
    id: 'pkg-tax-nexus',
    name: 'Cross-Border VAT & Tax Nexus Steward',
    category: 'Security & Compliance',
    version: 'v2.1.0',
    badge: 'Certified Core',
    rating: 4.91,
    reviewsCount: 184,
    installs: 1730,
    model: 'Claude 3.5 Sonnet',
    autonomyDefault: 'Act Autonomously',
    description: 'Monitors international tax compliance, state economic nexus thresholds, and validates VAT/GST exemptions against EU VIES and state registries prior to invoice issuance.',
    highlights: ['Continuous 50-state nexus tracking', 'Automated VAT certificate OCR verification', 'Zero-fault invoice tax calculation'],
    requiredTools: ['billing.taxes.calculate', 'compliance.vies.verify', 'crm.invoices.audit'],
    guardrails: ['Immutable audit trail recorded for all tax adjustments', 'Flagged mismatches escalate to Finance Director'],
    latencySla: '95ms',
    author: 'FinGov Compliance Labs',
    installed: false
  },
  {
    id: 'pkg-saas-retention',
    name: 'Enterprise Customer Retention & Churn Sentinel',
    category: 'Revenue & Sales',
    version: 'v3.0.5',
    badge: 'Enterprise Verified',
    rating: 4.87,
    reviewsCount: 112,
    installs: 940,
    model: 'GPT-4o + Sentiment Neural Net',
    autonomyDefault: 'Act with Approval',
    description: 'Continuous health monitoring of customer workspace usage, support ticket sentiment, and sponsor turnover. Triggers automated proactive CSM rescue plays.',
    highlights: ['Predicts renewal risk 90 days in advance', 'Drafts executive sponsor alignment briefs', 'Generates tailored retention concession proposals'],
    requiredTools: ['crm.customer360.read', 'service.sentiment.analyze', 'crm.tasks.create'],
    guardrails: ['All outreach emails require Account Executive sign-off', 'No autonomous discounting'],
    latencySla: '310ms',
    author: 'Syvoris AI Labs',
    installed: false
  },
  {
    id: 'pkg-trigram-dedup',
    name: 'Trigram Entity Resolution & Deduplication Steward',
    category: 'Data Governance',
    version: 'v2.4.1',
    badge: 'Certified Core',
    rating: 4.96,
    reviewsCount: 220,
    installs: 2190,
    model: 'PostgreSQL pg_trgm + Embedding Vector',
    autonomyDefault: 'Act with Approval',
    description: 'Scans account names, domains, and contact identities using phonetic and trigram distance algorithms. Reconciles duplicate CRM records with conflict resolution.',
    highlights: ['99.4% precision entity resolution', 'Preserves child record foreign-key linkages', 'Generates visual merge comparison diffs'],
    requiredTools: ['crm.records.scan_duplicates', 'crm.records.merge', 'audit.ledger.append'],
    guardrails: ['Requires steward approval for merge operations affecting >20 linked records', 'Complete rollback snapshot archived'],
    latencySla: '120ms',
    author: 'Syvoris Data Governance Core',
    installed: true
  },
  {
    id: 'pkg-rev-twin-forecast',
    name: 'Executive Revenue Digital Twin & Monte Carlo Engine',
    category: 'Revenue & Sales',
    version: 'v4.0.0',
    badge: 'Certified Core',
    rating: 4.98,
    reviewsCount: 405,
    installs: 3400,
    model: 'Syvoris Twin AI + Fast Stochastic Math',
    autonomyDefault: 'Suggest Only',
    description: 'Real-time revenue simulation sandbox. Runs 10,000 Monte Carlo iterations over sales pipeline, stage transitions, discount sensitivity, and market launch delays.',
    highlights: ['Real-time what-if scenario sliders', 'Explains win-probability variance drivers', 'Directly exports board-ready revenue projections'],
    requiredTools: ['crm.pipeline.simulate', 'crm.forecast.export', 'ai.scenarios.save'],
    guardrails: ['Read-only sandbox memory; does not alter production CRM deals', 'Audit logged per export'],
    latencySla: '65ms',
    author: 'Syvoris AI Labs',
    installed: true
  }
];

export function AgentMarketplaceView() {
  const navigate = useNavigate();
  const { addAudit } = useCRM();
  const [packages, setPackages] = useState<AgentPackage[]>(INITIAL_PACKAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPackage, setSelectedPackage] = useState<AgentPackage | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = ['All', 'Revenue & Sales', 'Customer Support & NOC', 'Supply Chain & ERP', 'Security & Compliance', 'Data Governance'];

  const filteredPackages = packages.filter(pkg => {
    const matchesCategory = selectedCategory === 'All' || pkg.category === selectedCategory;
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeploy = async (pkg: AgentPackage) => {
    setInstallingId(pkg.id);
    try {
      // Simulate real deployment handshake
      await new Promise(r => setTimeout(r, 650));
      
      // Update local state
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, installed: true } : p));
      if (selectedPackage && selectedPackage.id === pkg.id) {
        setSelectedPackage({ ...selectedPackage, installed: true });
      }

      addAudit('AI Agent Package Deployed', 'Arjun Mehta', `Deployed ${pkg.name} (${pkg.version}) to Workforce`);
      showToast(`Successfully deployed ${pkg.name} into live agent workforce.`);
    } catch {
      showToast(`Failed to deploy agent package. Please verify network.`);
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstall = async (pkg: AgentPackage) => {
    setInstallingId(pkg.id);
    try {
      await new Promise(r => setTimeout(r, 400));
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, installed: false } : p));
      if (selectedPackage && selectedPackage.id === pkg.id) {
        setSelectedPackage({ ...selectedPackage, installed: false });
      }
      addAudit('AI Agent Package Removed', 'Arjun Mehta', `Removed ${pkg.name} from Workforce`);
      showToast(`Removed ${pkg.name} from active workforce.`);
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="ai-workspace space-y-6">
      {/* Header */}
      <SectionHeading
        eyebrow="AI INTELLIGENCE & AGENT WORKFORCE / AGENT ECOSYSTEM"
        title="Agent Marketplace"
        subtitle="Discover, inspect, and deploy verified specialist AI agents with strict enterprise governance and tool boundary isolation."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/ai/agents')}
              className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border border-slate-300 font-medium"
            >
              <Bot size={14} className="text-blue-600" />
              <span>View Active Workforce</span>
              <ArrowRight size={13} className="text-slate-400" />
            </button>
            <span className="ai-mode-pill"><i /> Certified Registry</span>
          </div>
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => navigate('/ai/agents')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline ml-2"
          >
            Go to Workforce →
          </button>
        </div>
      )}

      {/* Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available Packages</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{packages.length} Packages</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">100% Certified Enterprise Grade</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Cloud size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Installed in Tenant</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {packages.filter(p => p.installed).length} Active
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">Governed by 3-tier boundary</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Safety & Audit Rating</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">4.94 / 5.0</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Based on 1,540+ enterprise audits</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fast Deployment</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">&lt; 1 Second</div>
            <div className="text-[11px] text-purple-600 font-medium mt-0.5">Hot-pluggable tool sandboxes</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <ZapIcon />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
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

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search agents, skills, or models..."
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPackages.map(pkg => (
          <div
            key={pkg.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
          >
            {/* Card Top */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/20 border border-blue-200/60 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Bot size={22} />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={11} /> {pkg.badge}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{pkg.version}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {pkg.name}
              </h3>
              <div className="text-xs font-semibold text-blue-600 mt-0.5">{pkg.category}</div>

              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-3">
                {pkg.description}
              </p>

              {/* Highlights */}
              <div className="mt-4 space-y-1.5">
                {pkg.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600">
                    <Check size={12} className="text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{h}</span>
                  </div>
                ))}
              </div>

              {/* Specs & Model badge */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px] text-slate-700">
                  {pkg.model}
                </span>
                <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded text-[10px] font-medium">
                  {pkg.autonomyDefault}
                </span>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Star size={13} className="text-amber-500 fill-amber-500" />
                <span className="font-bold text-slate-800">{pkg.rating}</span>
                <span className="text-[11px]">({pkg.installs} installs)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPackage(pkg)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                >
                  Inspect
                </button>

                {pkg.installed ? (
                  <button
                    onClick={() => handleUninstall(pkg)}
                    disabled={installingId === pkg.id}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors flex items-center gap-1 group/btn"
                    title="Click to uninstall"
                  >
                    {installingId === pkg.id ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={12} className="group-hover/btn:hidden text-emerald-600" />
                        <span className="group-hover/btn:hidden">Active</span>
                        <span className="hidden group-hover/btn:inline">Uninstall</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeploy(pkg)}
                    disabled={installingId === pkg.id}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
                  >
                    {installingId === pkg.id ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Deploying...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        <span>Deploy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Package Detail Drawer */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={12} /> {selectedPackage.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{selectedPackage.version}</span>
                </div>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-start gap-4 mt-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Bot size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedPackage.name}</h2>
                  <div className="text-xs font-semibold text-blue-600 mt-0.5">{selectedPackage.category}</div>
                  <div className="text-xs text-slate-500 mt-1">Published by {selectedPackage.author}</div>
                </div>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Package Overview</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedPackage.description}</p>
              </div>

              {/* Technical Specifications */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Cpu size={14} className="text-blue-600" /> Technical Architecture
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Base Model Architecture:</span>
                    <strong className="text-slate-800 font-mono">{selectedPackage.model}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Inference Latency SLA:</span>
                    <strong className="text-emerald-700 font-mono">{selectedPackage.latencySla}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Default Autonomy Tier:</span>
                    <strong className="text-amber-800">{selectedPackage.autonomyDefault}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Enterprise Verified Installs:</span>
                    <strong className="text-slate-800">{selectedPackage.installs.toLocaleString()} organizations</strong>
                  </div>
                </div>
              </div>

              {/* Required Tool Permissions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-500" /> Scoped Tool Permissions Required
                </h4>
                <div className="space-y-1.5">
                  {selectedPackage.requiredTools.map(tool => (
                    <div key={tool} className="flex items-center gap-2 p-2 bg-slate-100/80 rounded-lg text-xs font-mono text-slate-700 border border-slate-200/60">
                      <CheckCircle2 size={13} className="text-blue-600" />
                      <span>{tool}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guardrails */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" /> Architectural Guardrails Enforced
                </h4>
                <div className="space-y-2">
                  {selectedPackage.guardrails.map((g, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200/50">
                      <ShieldCheck size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedPackage(null)}
                className="btn secondary text-xs py-2 px-4"
              >
                Close Inspector
              </button>

              {selectedPackage.installed ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPackage(null);
                      navigate('/ai/agents');
                    }}
                    className="btn secondary text-xs py-2 px-3 border border-slate-300"
                  >
                    View in Workforce
                  </button>
                  <button
                    onClick={() => handleUninstall(selectedPackage)}
                    disabled={installingId === selectedPackage.id}
                    className="btn secondary text-xs py-2 px-3 text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    Uninstall Package
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDeploy(selectedPackage)}
                  disabled={installingId === selectedPackage.id}
                  className="btn primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-md"
                >
                  {installingId === selectedPackage.id ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Deploying to Tenant...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Deploy into Live Workforce</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ZapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}
