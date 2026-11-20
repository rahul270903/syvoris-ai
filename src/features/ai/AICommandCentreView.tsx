import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Sparkles, Activity, ShieldCheck, TrendingUp, ArrowRight,
  CheckCircle2, Clock, AlertTriangle, Users, Target, Brain,
  Layers, RefreshCw, ExternalLink, Sliders, Check, ChevronRight
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { useCRM } from '../../store/CRMStore';
import { api, AIAgentItem, AIProposalItem } from '../../services/api';
import { money } from '../../data/models';

export function AICommandCentreView() {
  const navigate = useNavigate();
  const { records, addAudit } = useCRM();

  const deals = records('opportunities');
  const accounts = records('organizations');
  const cases = records('cases');

  const [liveAgents, setLiveAgents] = useState<AIAgentItem[]>([]);
  const [liveProposals, setLiveProposals] = useState<AIProposalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const [agRes, propRes] = await Promise.all([
        api.listAIAgents().catch(() => []),
        api.listAIProposals().catch(() => [])
      ]);
      if (agRes && agRes.length > 0) setLiveAgents(agRes);
      if (propRes && propRes.length > 0) setLiveProposals(propRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const activeAgentsCount = liveAgents.filter(a => a.status === 'Active').length || 13;
  const pendingCount = liveProposals.filter(p => p.status === 'Pending Approval').length || 3;
  const openDealsValue = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.status)).reduce((s, d) => s + d.amount, 0) || 291000;

  return (
    <div className="ai-workspace space-y-6">
      {/* Header */}
      <SectionHeading
        eyebrow="AI INTELLIGENCE & AGENT WORKFORCE / MISSION CONTROL"
        title="AI Command Centre"
        subtitle="Centralized operational cockpit for autonomous digital workforce monitoring, prescriptive recommendations, and governed execution."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border border-slate-300 font-medium"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Telemetry</span>
            </button>
            <span className="ai-mode-pill"><i /> 14 Agents Online</span>
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

      {/* Mission Control Top Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/ai/agents')}
          className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Workforce</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{activeAgentsCount} Agents</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 group-hover:underline flex items-center gap-0.5">
              <span>View workforce</span>
              <ArrowRight size={11} />
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bot size={20} />
          </div>
        </div>

        <div
          onClick={() => navigate('/ai/activity')}
          className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Activity Queue</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount} Pending</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5 group-hover:underline flex items-center gap-0.5">
              <span>Review decisions</span>
              <ArrowRight size={11} />
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div
          onClick={() => navigate('/ai/revenue-twin')}
          className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monitored Pipeline</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{money(openDealsValue)}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5 group-hover:underline flex items-center gap-0.5">
              <span>Open digital twin</span>
              <ArrowRight size={11} />
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        <div
          onClick={() => navigate('/ai/governance')}
          className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Policy Governance</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">100% Passed</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5 group-hover:underline flex items-center gap-0.5">
              <span>Inspect guardrails</span>
              <ArrowRight size={11} />
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Quick Launchpad to AI Intelligence Features */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">AI Intelligence Suite Modules</h3>
            <p className="text-xs text-slate-500 mt-0.5">Direct access to specialized agent operational environments.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Conversational Copilot',
              path: '/ai/copilot',
              icon: Sparkles,
              color: 'text-blue-600 bg-blue-50 border-blue-200',
              desc: 'Natural language CRM exploration, multi-model reasoning and grounded action proposal generation.'
            },
            {
              title: 'Agent Workforce',
              path: '/ai/agents',
              icon: Bot,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
              desc: 'Specialist digital employees, operational KPIs, autonomy controls and runtime telemetry.'
            },
            {
              title: 'Agent Organisation Chart',
              path: '/ai/org-chart',
              icon: Layers,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
              desc: 'Hierarchical reporting structure from Enterprise Chief Orchestrator to departmental agent clusters.'
            },
            {
              title: 'Agent Marketplace',
              path: '/ai/marketplace',
              icon: Activity,
              color: 'text-purple-600 bg-purple-50 border-purple-200',
              desc: 'Discover and 1-click deploy verified enterprise agent packages and tool integrations.'
            },
            {
              title: 'AI Recommendations',
              path: '/ai/recommendations',
              icon: Target,
              color: 'text-amber-600 bg-amber-50 border-amber-200',
              desc: 'Prescriptive Next-Best-Action (NBA) engine for deal acceleration, upsell and churn prevention.'
            },
            {
              title: 'Revenue Digital Twin',
              path: '/ai/revenue-twin',
              icon: Sliders,
              color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
              desc: 'Stochastic pipeline scenario simulation with real-time variables and waterfall attribution.'
            },
            {
              title: 'Customer Intelligence',
              path: '/ai/customer-intelligence',
              icon: Brain,
              color: 'text-rose-600 bg-rose-50 border-rose-200',
              desc: 'Customer 360 memory graphs, chronological touchpoint timeline, and trigram entity resolution.'
            },
            {
              title: 'AI Governance Cockpit',
              path: '/ai/governance',
              icon: ShieldCheck,
              color: 'text-slate-700 bg-slate-100 border-slate-300',
              desc: 'Architectural safety guardrail policies, autonomy boundary matrix, and immutable audit logs.'
            }
          ].map(mod => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.path}
                onClick={() => navigate(mod.path)}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${mod.color}`}>
                      <Icon size={18} />
                    </div>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {mod.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
