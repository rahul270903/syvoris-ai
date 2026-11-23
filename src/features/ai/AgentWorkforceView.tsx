import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, ShieldCheck, Sparkles, Plus, RefreshCw, CheckCircle2,
  AlertTriangle, X, Play, Pause, ExternalLink, Settings2, Sliders,
  Check, ArrowRight, Activity, Terminal, Lock, ShoppingBag, Eye
} from 'lucide-react';
import { api, AIAgentItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

interface WorkforceAgent {
  id: string;
  ref: string;
  name: string;
  persona: string;
  department: string;
  role_description: string;
  autonomy_level: 'Suggest Only' | 'Act with Approval' | 'Act Autonomously';
  status: 'Active' | 'Paused';
  primary_kpi: string;
  current_metric: string;
  success_rate: number;
  daily_executions: number;
  tool_permissions: string[];
  system_prompt: string;
}

const DEFAULT_AGENTS: WorkforceAgent[] = [
  {
    id: 'agt-1',
    ref: 'AGT-2026-0001',
    name: 'SDR Inbound Qualification Agent',
    persona: 'Inbound SDR Lead Qualifier',
    department: 'Revenue Operations',
    role_description: 'Evaluates inbound prospect submissions against BANT qualification criteria, validates corporate domains, and proposes sales assignment.',
    autonomy_level: 'Act with Approval',
    status: 'Active',
    primary_kpi: 'Qualification Velocity < 2h',
    current_metric: '1.2h Average',
    success_rate: 98.4,
    daily_executions: 142,
    tool_permissions: ['crm:leads:read', 'crm:leads:qualify', 'email:send_intro', 'slack:notify'],
    system_prompt: 'You are the Inbound SDR Agent. Evaluate all inbound prospects against BANT gates. Flag non-corporate domains and route high-fit leads to Senior AEs.'
  },
  {
    id: 'agt-2',
    ref: 'AGT-2026-0002',
    name: 'Deal Health & Win Predictor Agent',
    persona: 'Predictive Deal Scorer',
    department: 'Revenue Operations',
    role_description: 'Analyzes deal communication velocity, pricing changes, and buyer sentiment to compute win probability and flag stalled opportunities.',
    autonomy_level: 'Suggest Only',
    status: 'Active',
    primary_kpi: 'Win Prediction Accuracy >= 94%',
    current_metric: '95.8% Accuracy',
    success_rate: 99.1,
    daily_executions: 320,
    tool_permissions: ['crm:deals:read', 'ai:predict_win_loss', 'crm:notes:read'],
    system_prompt: 'Analyze deal milestones, touchpoint cadence, and competitor intelligence to assign win probability and detect at-risk pipeline deals.'
  },
  {
    id: 'agt-3',
    ref: 'AGT-2026-0003',
    name: 'CPQ Margin Guardian & Pricing Auditor',
    persona: 'Quote Margin Compliance Officer',
    department: 'Commercial Operations',
    role_description: 'Audits CPQ proposal line-item discounts against gross margin thresholds ($50k ceiling) and routes high-discount quotes to management.',
    autonomy_level: 'Act with Approval',
    status: 'Active',
    primary_kpi: 'Margin Compliance >= 98%',
    current_metric: '99.4% Compliant',
    success_rate: 100.0,
    daily_executions: 88,
    tool_permissions: ['catalog:price_check', 'quote:margin_verify', 'approval:request'],
    system_prompt: 'Audit all proposal discounts. If gross margin falls below 35% or discount exceeds 15%, halt checkout and request Executive approval.'
  },
  {
    id: 'agt-4',
    ref: 'AGT-2026-0004',
    name: '24/7 Optical NOC Diagnostic & Support Agent',
    persona: 'Tier-1 Technical Support Specialist',
    department: 'Customer Service NOC',
    role_description: 'Triages incoming technical tickets, matches error codes against fiber topology knowledge base, and drafts engineering responses.',
    autonomy_level: 'Suggest Only',
    status: 'Active',
    primary_kpi: 'First-Contact Resolution >= 80%',
    current_metric: '84.2% Resolution',
    success_rate: 97.6,
    daily_executions: 215,
    tool_permissions: ['knowledge:search', 'service:case:diagnose', 'case:draft_response'],
    system_prompt: 'Monitor customer support queues. Match network incidents against optical fiber OTDR attenuation records and propose corrective action.'
  },
  {
    id: 'agt-5',
    ref: 'AGT-2026-0005',
    name: 'SaaS Retention & Churn Interceptor',
    persona: 'Customer Success Retention Sentinel',
    department: 'Customer Success',
    role_description: 'Detects drops in platform API activity and inactivity over 30 days, generating targeted executive consultation playbooks.',
    autonomy_level: 'Act with Approval',
    status: 'Active',
    primary_kpi: 'Net Revenue Retention >= 115%',
    current_metric: '118.4% NRR',
    success_rate: 96.8,
    daily_executions: 64,
    tool_permissions: ['usage:telemetry_read', 'crm:account:health_score', 'playbook:trigger'],
    system_prompt: 'Identify accounts with declining monthly active seats or pending contract renewals within 60 days. Stage preventative retention interventions.'
  },
  {
    id: 'agt-6',
    ref: 'AGT-2026-0006',
    name: 'Cross-Border Tax Nexus & Export Guardian',
    persona: 'Trade Compliance & Tax Auditor',
    department: 'Governance & Risk',
    role_description: 'Validates multi-jurisdiction tax schedules (VAT, GCT, Florida Nexus) and enforces dual-use equipment export restrictions.',
    autonomy_level: 'Act Autonomously',
    status: 'Active',
    primary_kpi: 'Zero Non-Compliance Incidents',
    current_metric: '100% Conformity',
    success_rate: 100.0,
    daily_executions: 412,
    tool_permissions: ['tax:jurisdiction_validate', 'export:check_sanctions', 'audit:log'],
    system_prompt: 'Enforce statutory tax nexus rules and check cross-border hardware shipments against international export control databases.'
  },
  {
    id: 'agt-7',
    ref: 'AGT-2026-0007',
    name: 'Dynamic Commercial Negotiation Agent',
    persona: 'Deal Terms & Discount Negotiator',
    department: 'Revenue Operations',
    role_description: 'Evaluates competitive bidding pressure and recommends non-cash trade-offs (e.g. multi-year term or upfront payment).',
    autonomy_level: 'Suggest Only',
    status: 'Active',
    primary_kpi: 'Discount Containment < 10%',
    current_metric: '6.8% Average',
    success_rate: 98.2,
    daily_executions: 94,
    tool_permissions: ['quote:counter_offer_model', 'deal:read'],
    system_prompt: 'Model deal negotiation concession schedules. Prioritize multi-year upfront commitment over raw unit price discounting.'
  },
  {
    id: 'agt-8',
    ref: 'AGT-2026-0008',
    name: 'Multi-Warehouse ATP Inventory Optimizer',
    persona: 'Supply Chain Replenishment Sentinel',
    department: 'Supply Chain Operations',
    role_description: 'Tracks real-time Available-to-Promise physical stock across facilities, automatically proposing PO triggers on safety breaches.',
    autonomy_level: 'Suggest Only',
    status: 'Active',
    primary_kpi: 'Order Fulfillment Rate >= 99%',
    current_metric: '99.4% Fulfilled',
    success_rate: 99.8,
    daily_executions: 180,
    tool_permissions: ['inventory:stock_read', 'atp:calculate', 'po:suggest_reorder'],
    system_prompt: 'Monitor stock on-hand vs active order reservations. Alert logistics managers when ATP drops below economic safety thresholds.'
  },
  {
    id: 'agt-9',
    ref: 'AGT-2026-0009',
    name: 'Trigram Master Data Deduplication Steward',
    persona: 'Entity Resolution & Data Cleaner',
    department: 'Data Governance',
    role_description: 'Scans newly ingested accounts and contacts using n-gram phonetic matching to surface duplicate records for steward resolution.',
    autonomy_level: 'Act with Approval',
    status: 'Active',
    primary_kpi: 'Data Health Score >= 95%',
    current_metric: '97.2% Health',
    success_rate: 99.5,
    daily_executions: 156,
    tool_permissions: ['crm:trigram_match', 'crm:merge_candidate_propose'],
    system_prompt: 'Detect duplicate organization and contact records using phonetic trigram scoring. Generate side-by-side merge candidate proposals.'
  },
  {
    id: 'agt-10',
    ref: 'AGT-2026-0010',
    name: 'Executive Revenue Forecast Intelligence Agent',
    persona: 'Revenue Twin & Monte Carlo Analyst',
    department: 'Revenue Operations',
    role_description: 'Runs Monte Carlo pipeline simulations and explains pipeline delta shifts for executive board commentary.',
    autonomy_level: 'Suggest Only',
    status: 'Active',
    primary_kpi: 'Forecast Accuracy +-3%',
    current_metric: '+-1.8% Variance',
    success_rate: 99.0,
    daily_executions: 78,
    tool_permissions: ['revenue_twin:simulate', 'forecast:run_monte_carlo'],
    system_prompt: 'Calculate quarterly weighted pipeline projections. Generate variance commentary against previous baseline.'
  }
];

export function AgentWorkforceView() {
  const navigate = useNavigate();
  const { addEvent, addAudit } = useCRM();

  const [agents, setAgents] = useState<WorkforceAgent[]>(() => {
    try {
      const raw = localStorage.getItem('syvoris:ai_workforce_agents');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_AGENTS;
  });
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [autonomyFilter, setAutonomyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<WorkforceAgent | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const liveList = await api.listAIAgents();
      if (liveList && liveList.length > 0) {
        setAgents(prev => {
          const map = new Map<string, WorkforceAgent>();
          DEFAULT_AGENTS.forEach(a => map.set(a.name, a));
          prev.forEach(a => map.set(a.name, a));
          liveList.forEach(a => {
            const key = a.name || a.persona;
            const existing = map.get(key) || ({} as WorkforceAgent);
            map.set(key, {
              ...existing,
              ...a,
              department: a.module || existing.department || 'Operations',
              role_description: a.role_description || existing.role_description || 'Specialist CRM agent',
              primary_kpi: a.primary_kpi || existing.primary_kpi || 'Execution Reliability',
              current_metric: existing.current_metric || 'Active & Monitoring',
              success_rate: existing.success_rate || 99.0,
              daily_executions: existing.daily_executions || 120,
              tool_permissions: a.tool_permissions || existing.tool_permissions || ['crm:read'],
              system_prompt: a.system_prompt || existing.system_prompt || 'Adhere to platform safety policies.',
              status: (a.status === 'Active' || a.status === 'Paused') ? a.status : (existing.status || 'Active'),
              autonomy_level: (a.autonomy_level as any) || existing.autonomy_level || 'Suggest Only'
            });
          });
          const combined = Array.from(map.values());
          try {
            localStorage.setItem('syvoris:ai_workforce_agents', JSON.stringify(combined));
          } catch {}
          return combined;
        });
      }
    } catch (err) {
      console.warn('API agents fallback to default workforce:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  // Form State for Deploy New Agent
  const [newAgent, setNewAgent] = useState({
    name: '',
    persona: '',
    department: 'Revenue Operations',
    role_description: '',
    autonomy_level: 'Suggest Only' as WorkforceAgent['autonomy_level'],
    primary_kpi: '',
    system_prompt: '',
  });

  // Filtered Agents
  const filteredAgents = useMemo(() => {
    return agents.filter(a => {
      if (selectedDept !== 'all' && a.department !== selectedDept) return false;
      if (autonomyFilter !== 'all' && a.autonomy_level !== autonomyFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = a.name.toLowerCase().includes(q);
        const mPersona = a.persona.toLowerCase().includes(q);
        const mDept = a.department.toLowerCase().includes(q);
        const mDesc = a.role_description.toLowerCase().includes(q);
        if (!mName && !mPersona && !mDept && !mDesc) return false;
      }
      return true;
    });
  }, [agents, selectedDept, autonomyFilter, searchQuery]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const total = agents.length;
    const active = agents.filter(a => a.status === 'Active').length;
    const autonomous = agents.filter(a => a.autonomy_level === 'Act Autonomously').length;
    const approvalRequired = agents.filter(a => a.autonomy_level === 'Act with Approval').length;
    const totalDailyRuns = agents.reduce((acc, a) => acc + (a.daily_executions || 0), 0);
    const avgSuccess = (agents.reduce((acc, a) => acc + (a.success_rate || 99), 0) / (agents.length || 1)).toFixed(1);

    return { total, active, autonomous, approvalRequired, totalDailyRuns, avgSuccess };
  }, [agents]);

  // 1-Click Status Toggle
  const handleToggleStatus = async (agent: WorkforceAgent) => {
    const nextStatus: 'Active' | 'Paused' = agent.status === 'Active' ? 'Paused' : 'Active';
    setAgents(prev => {
      const updated = prev.map(a => a.id === agent.id ? { ...a, status: nextStatus } : a);
      try {
        localStorage.setItem('syvoris:ai_workforce_agents', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await api.updateAIAgent(agent.id, { status: nextStatus });
      addEvent('agent.status_toggled', { ref: agent.ref }, `${agent.name} is now ${nextStatus}`);
      addAudit(`Agent status changed to ${nextStatus}`, 'Arjun Mehta', agent.id);
      notify(`${agent.name} is now ${nextStatus}.`);
    } catch {
      notify(`${agent.name} updated locally to ${nextStatus}.`);
    }
  };

  // 1-Click Autonomy Change
  const handleAutonomyChange = async (agent: WorkforceAgent, level: WorkforceAgent['autonomy_level']) => {
    setAgents(prev => {
      const updated = prev.map(a => a.id === agent.id ? { ...a, autonomy_level: level } : a);
      try {
        localStorage.setItem('syvoris:ai_workforce_agents', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await api.updateAIAgent(agent.id, { autonomy_level: level });
      addEvent('agent.autonomy_updated', { ref: agent.ref }, `${agent.name} autonomy set to ${level}`);
      addAudit(`Autonomy changed to ${level}`, 'Arjun Mehta', agent.id);
      notify(`${agent.name} autonomy set to "${level}".`);
    } catch {
      notify(`${agent.name} autonomy updated locally.`);
    }
  };

  // Deploy New Custom Agent
  const handleDeployAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.name || !newAgent.role_description) {
      alert('Please fill in Agent Name and Description.');
      return;
    }

    const created: WorkforceAgent = {
      id: `agt-${Date.now()}`,
      ref: `AGT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newAgent.name.trim(),
      persona: newAgent.persona.trim() || newAgent.name.trim(),
      department: newAgent.department,
      role_description: newAgent.role_description.trim(),
      autonomy_level: newAgent.autonomy_level,
      status: 'Active',
      primary_kpi: newAgent.primary_kpi.trim() || 'Workflow Efficiency >= 95%',
      current_metric: 'Initializing Telemetry',
      success_rate: 99.5,
      daily_executions: 0,
      tool_permissions: ['crm:read', 'audit:log'],
      system_prompt: newAgent.system_prompt || 'Operate within assigned departmental boundaries.'
    };

    setAgents(prev => {
      const updated = [created, ...prev];
      try {
        localStorage.setItem('syvoris:ai_workforce_agents', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await api.createAIAgent({
        id: created.id,
        name: created.name,
        persona: created.persona,
        module: created.department,
        role_description: created.role_description,
        autonomy_level: created.autonomy_level,
        status: 'Active',
        tool_permissions: created.tool_permissions,
        primary_kpi: created.primary_kpi
      }).catch(() => null);
    } catch {}

    addEvent('agent.deployed', { ref: created.ref }, `Deployed custom agent ${created.name}`);
    addAudit(`Agent deployed: ${created.name}`, 'Arjun Mehta', created.id);
    notify(`Agent "${created.name}" successfully deployed into workforce.`);
    setShowDeployModal(false);
    setNewAgent({
      name: '',
      persona: '',
      department: 'Revenue Operations',
      role_description: '',
      autonomy_level: 'Suggest Only',
      primary_kpi: '',
      system_prompt: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> AI Intelligence & Agent Workforce
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Autonomous Workforce Operations Cockpit</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Agent Workforce</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Monitor, govern, and configure autonomous specialist agents handling lead qualification, CPQ deal margins, optical NOC diagnostics, and trade compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ai/marketplace')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/70 text-sky-400 text-xs font-medium border border-slate-700/60 transition-all hover:border-sky-500/50"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Browse Marketplace
          </button>
          <button
            onClick={loadAgents}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all hover:border-slate-600 disabled:opacity-50"
            title="Reload live workforce telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Telemetry
          </button>
          <button
            onClick={() => setShowDeployModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Deploy Agent
          </button>
        </div>
      </div>

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Active Personas</span>
            <Bot className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{kpis.active} <span className="text-xs font-normal text-slate-500">/ {kpis.total} Total</span></div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Online & Monitoring
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Daily Executions</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{kpis.totalDailyRuns.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Today's Automated Runs</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Decision Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">{kpis.avgSuccess}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Conformity to Human Audit</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Human-In-The-Loop</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{kpis.approvalRequired} <span className="text-xs font-normal text-slate-500">Gated</span></div>
          <div className="text-[11px] text-amber-400 mt-1">Require Human Approval</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Fully Autonomous</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 tracking-tight">{kpis.autonomous}</div>
          <div className="text-[11px] text-slate-400 mt-1">Direct Auto-Execution Tiers</div>
        </div>
      </div>

      {/* Controls: Department Tabs, Autonomy Dropdown, Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Departments' },
            { id: 'Revenue Operations', label: 'Revenue Operations' },
            { id: 'Commercial Operations', label: 'Commercial Operations' },
            { id: 'Customer Service NOC', label: 'Customer Care & NOC' },
            { id: 'Supply Chain Operations', label: 'Supply Chain' },
            { id: 'Governance & Risk', label: 'Governance & Risk' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedDept(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDept === tab.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Autonomy Filter */}
          <select
            value={autonomyFilter}
            onChange={(e) => setAutonomyFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Autonomy Levels</option>
            <option value="Act Autonomously">Act Autonomously</option>
            <option value="Act with Approval">Act with Approval</option>
            <option value="Suggest Only">Suggest Only</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 lg:w-64">
            <input
              type="text"
              placeholder="Search agent name, persona, tool..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-3 py-1.5 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Agents Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgents.map((agent) => {
          const isActive = agent.status === 'Active';
          return (
            <div
              key={agent.id}
              className={`bg-slate-900/60 border rounded-2xl p-5 space-y-4 backdrop-blur-md transition-all group hover:border-slate-700 ${
                isActive ? 'border-slate-800/80' : 'border-slate-800/40 opacity-70'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                        {agent.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        {agent.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {agent.department} • <span className="font-mono text-sky-400">{agent.ref}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(agent)}
                    className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                    }`}
                    title={isActive ? 'Pause Agent' : 'Resume Agent'}
                  >
                    {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    title="Inspect Agent Configuration"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Role Description */}
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {agent.role_description}
              </p>

              {/* Metrics & Autonomy Control */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">Target SLA / KPI:</div>
                  <div className="font-semibold text-white truncate" title={agent.primary_kpi}>{agent.primary_kpi}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">{agent.current_metric}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">Autonomy Guardrail:</div>
                  <select
                    value={agent.autonomy_level}
                    onChange={(e) => handleAutonomyChange(agent, e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-sky-400 text-[11px] rounded px-2 py-1 font-medium focus:outline-none focus:border-sky-500"
                  >
                    <option value="Suggest Only">Suggest Only</option>
                    <option value="Act with Approval">Act with Approval</option>
                    <option value="Act Autonomously">Act Autonomously</option>
                  </select>
                </div>
              </div>

              {/* Tool Scopes Footer */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-wrap gap-1">
                  {agent.tool_permissions.slice(0, 3).map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60"
                    >
                      {tool}
                    </span>
                  ))}
                  {agent.tool_permissions.length > 3 && (
                    <span className="text-[10px] text-slate-500 self-center">
                      +{agent.tool_permissions.length - 3} more
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  {agent.daily_executions} runs today
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer: Detailed Agent Inspector */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedAgent.name}</h3>
                  <p className="text-xs text-slate-400">{selectedAgent.persona} • {selectedAgent.ref}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-white">{selectedAgent.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Autonomy Tier:</span>
                  <span className="font-mono text-sky-400 font-semibold">{selectedAgent.autonomy_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Execution Volume:</span>
                  <span className="font-mono text-white font-bold">{selectedAgent.daily_executions} invocations</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Audit Conformity Score:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedAgent.success_rate}% Accuracy</span>
                </div>
              </div>

              {/* Tool Authorization Scopes */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Authorized Tool Permissions ({selectedAgent.tool_permissions.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.tool_permissions.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-800 text-sky-300 border border-slate-700/80 flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3 text-sky-400" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* System Prompt & Instructions */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  System Prompt & Governance Directives
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedAgent.system_prompt}
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-800">
                <button
                  onClick={() => handleToggleStatus(selectedAgent)}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                    selectedAgent.status === 'Active'
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40 hover:bg-amber-600/30'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {selectedAgent.status === 'Active' ? 'Pause Agent Execution' : 'Resume Agent Execution'}
                </button>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Deploy Custom Agent */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Deploy Custom Specialist Agent</h3>
              </div>
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeployAgent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Account Sentinel"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Department
                  </label>
                  <select
                    value={newAgent.department}
                    onChange={(e) => setNewAgent({ ...newAgent, department: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Revenue Operations">Revenue Operations</option>
                    <option value="Commercial Operations">Commercial Operations</option>
                    <option value="Customer Service NOC">Customer Care & NOC</option>
                    <option value="Supply Chain Operations">Supply Chain</option>
                    <option value="Governance & Risk">Governance & Risk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Autonomy Level
                  </label>
                  <select
                    value={newAgent.autonomy_level}
                    onChange={(e) => setNewAgent({ ...newAgent, autonomy_level: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Suggest Only">Suggest Only</option>
                    <option value="Act with Approval">Act with Approval</option>
                    <option value="Act Autonomously">Act Autonomously</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Primary KPI Target
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SLA Response < 10 mins"
                    value={newAgent.primary_kpi}
                    onChange={(e) => setNewAgent({ ...newAgent, primary_kpi: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Agent Role Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Continuously monitors top tier accounts for risk signals..."
                  value={newAgent.role_description}
                  onChange={(e) => setNewAgent({ ...newAgent, role_description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  System Prompt & Guardrails
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter system prompt, evaluation criteria, and decision boundary guidelines..."
                  value={newAgent.system_prompt}
                  onChange={(e) => setNewAgent({ ...newAgent, system_prompt: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-sky-600/25 transition-all"
                >
                  Deploy to Workforce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
