import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network, Bot, Brain, ShieldCheck, ChevronDown, ChevronRight,
  ExternalLink, CheckCircle2, User, Lock, Activity, ArrowRight,
  Sparkles, Layers, Sliders, X
} from 'lucide-react';

interface OrgNode {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'Paused';
  autonomy: 'Suggest Only' | 'Act with Approval' | 'Act Autonomously';
  supervisor: string;
  runs_today: number;
  kpi: string;
  tools: string[];
}

interface DepartmentGroup {
  id: string;
  title: string;
  lead: string;
  leadRole: string;
  color: string;
  agents: OrgNode[];
}

const ORG_DEPARTMENTS: DepartmentGroup[] = [
  {
    id: 'rev-ops',
    title: 'Revenue Operations & Commercial Architecture',
    lead: 'Executive Revenue Orchestrator',
    leadRole: 'Commercial Pipeline Controller',
    color: 'from-blue-600/20 to-sky-600/20 border-sky-500/40 text-sky-400',
    agents: [
      {
        id: 'agt-1',
        name: 'SDR Inbound Qualification Agent',
        role: 'Inbound SDR Lead Qualifier',
        department: 'Revenue Operations',
        status: 'Active',
        autonomy: 'Act with Approval',
        supervisor: 'Arjun Mehta (Tenant Owner)',
        runs_today: 142,
        kpi: 'Qualification Velocity < 2h',
        tools: ['crm:leads:read', 'crm:leads:qualify', 'email:send_intro']
      },
      {
        id: 'agt-2',
        name: 'Deal Health & Win Predictor Agent',
        role: 'Predictive Deal Scorer',
        department: 'Revenue Operations',
        status: 'Active',
        autonomy: 'Suggest Only',
        supervisor: 'Executive Revenue Orchestrator',
        runs_today: 320,
        kpi: 'Win Prediction Accuracy >= 94%',
        tools: ['crm:deals:read', 'ai:predict_win_loss']
      },
      {
        id: 'agt-3',
        name: 'CPQ Margin Guardian & Pricing Auditor',
        role: 'Quote Margin Compliance Officer',
        department: 'Revenue Operations',
        status: 'Active',
        autonomy: 'Act with Approval',
        supervisor: 'Chief Commercial Officer',
        runs_today: 88,
        kpi: 'Margin Compliance >= 98%',
        tools: ['catalog:price_check', 'quote:margin_verify', 'approval:request']
      },
      {
        id: 'agt-7',
        name: 'Dynamic Commercial Negotiation Agent',
        role: 'Deal Terms & Discount Negotiator',
        department: 'Revenue Operations',
        status: 'Active',
        autonomy: 'Suggest Only',
        supervisor: 'Executive Revenue Orchestrator',
        runs_today: 94,
        kpi: 'Discount Containment < 10%',
        tools: ['quote:counter_offer_model', 'deal:read']
      },
      {
        id: 'agt-10',
        name: 'Executive Revenue Forecast Intelligence',
        role: 'Revenue Twin & Monte Carlo Analyst',
        department: 'Revenue Operations',
        status: 'Active',
        autonomy: 'Suggest Only',
        supervisor: 'Arjun Mehta (Tenant Owner)',
        runs_today: 78,
        kpi: 'Forecast Accuracy +-3%',
        tools: ['revenue_twin:simulate', 'forecast:run_monte_carlo']
      }
    ]
  },
  {
    id: 'cust-ops',
    title: 'Customer Operations & 24/7 Service NOC',
    lead: 'Service Operations Controller',
    leadRole: 'Tier-1 Service & Retention Lead',
    color: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/40 text-emerald-400',
    agents: [
      {
        id: 'agt-4',
        name: '24/7 Optical NOC Diagnostic & Support Agent',
        role: 'Tier-1 Technical Support Specialist',
        department: 'Customer Service NOC',
        status: 'Active',
        autonomy: 'Suggest Only',
        supervisor: 'Service Operations Controller',
        runs_today: 215,
        kpi: 'First-Contact Resolution >= 80%',
        tools: ['knowledge:search', 'service:case:diagnose', 'case:draft_response']
      },
      {
        id: 'agt-5',
        name: 'SaaS Retention & Churn Interceptor',
        role: 'Customer Success Retention Sentinel',
        department: 'Customer Success',
        status: 'Active',
        autonomy: 'Act with Approval',
        supervisor: 'VP Customer Success',
        runs_today: 64,
        kpi: 'Net Revenue Retention >= 115%',
        tools: ['usage:telemetry_read', 'crm:account:health_score']
      },
      {
        id: 'agt-11',
        name: 'Meeting Intelligence & Follow-up Agent',
        role: 'Executive Briefing & Task Author',
        department: 'Customer Operations',
        status: 'Active',
        autonomy: 'Act with Approval',
        supervisor: 'Service Operations Controller',
        runs_today: 110,
        kpi: 'Post-Meeting Task Velocity < 15m',
        tools: ['calendar:read', 'task:create', 'email:draft']
      },
      {
        id: 'agt-12',
        name: 'Knowledge Base Solution Drafter',
        role: 'Technical Documentation Author',
        department: 'Customer Operations',
        status: 'Active',
        autonomy: 'Suggest Only',
        supervisor: 'Service Operations Controller',
        runs_today: 45,
        kpi: 'Knowledge Article Acceptance 92%',
        tools: ['knowledge:create_draft', 'case:read_resolved']
      }
    ]
  },
  {
    id: 'supply-ops',
    title: 'Supply Chain Operations & Inventory Logistics',
    lead: 'Supply Chain Logistics Controller',
    leadRole: 'ATP Warehouse & Supplier Director',
    color: 'from-amber-600/20 to-orange-600/20 border-amber-500/40 text-amber-400',
    agents: [
      {
        id: 'agt-8',
        name: 'Multi-Warehouse ATP Inventory Optimizer',
        role: 'Supply Chain Replenishment Sentinel',
        department: 'Supply Chain Operations',
        status: 'Active',
        autonomy: 'Suggest Only',
        supervisor: 'Supply Chain Logistics Controller',
        runs_today: 180,
        kpi: 'Order Fulfillment Rate >= 99%',
        tools: ['inventory:stock_read', 'atp:calculate', 'po:suggest_reorder']
      },
      {
        id: 'agt-13',
        name: 'Supplier Delivery & PO Fulfillment Monitor',
        role: 'Inbound PO Lead-Time Auditor',
        department: 'Supply Chain Operations',
        status: 'Active',
        autonomy: 'Act with Approval',
        supervisor: 'Supply Chain Logistics Controller',
        runs_today: 82,
        kpi: 'On-Time PO Delivery 98%',
        tools: ['vendor:read', 'po:track_eta', 'erp:radium:sync']
      }
    ]
  },
  {
    id: 'gov-ops',
    title: 'Trust, Governance, Risk & Compliance',
    lead: 'Chief AI Ethics & Compliance Controller',
    leadRole: 'Statutory Nexus & Security Authority',
    color: 'from-purple-600/20 to-indigo-600/20 border-purple-500/40 text-purple-400',
    agents: [
      {
        id: 'agt-6',
        name: 'Cross-Border Tax Nexus & Export Guardian',
        role: 'Trade Compliance & Tax Auditor',
        department: 'Governance & Risk',
        status: 'Active',
        autonomy: 'Act Autonomously',
        supervisor: 'Legal Governance Council',
        runs_today: 412,
        kpi: 'Zero Non-Compliance Incidents',
        tools: ['tax:jurisdiction_validate', 'export:check_sanctions', 'audit:log']
      },
      {
        id: 'agt-9',
        name: 'Trigram Master Data Deduplication Steward',
        role: 'Entity Resolution & Data Cleaner',
        department: 'Data Governance',
        status: 'Active',
        autonomy: 'Act with Approval',
        supervisor: 'Chief AI Ethics & Compliance Controller',
        runs_today: 156,
        kpi: 'Data Health Score >= 95%',
        tools: ['crm:trigram_match', 'crm:merge_candidate_propose']
      },
      {
        id: 'agt-14',
        name: 'Platform Audit Trail & Policy Enforcer',
        role: 'Immutable Security Ledger Sentinel',
        department: 'Data Governance',
        status: 'Active',
        autonomy: 'Act Autonomously',
        supervisor: 'Chief AI Ethics & Compliance Controller',
        runs_today: 520,
        kpi: '100% Policy Conformity',
        tools: ['audit:write_hash', 'security:policy_check']
      }
    ]
  }
];

export function AgentOrgChartView() {
  const navigate = useNavigate();

  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

  const toggleCollapse = (deptId: string) => {
    setCollapsedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const dynamicDepts = useMemo(() => {
    try {
      const raw = localStorage.getItem('syvoris:ai_workforce_agents');
      if (raw) {
        const liveWorkforce = JSON.parse(raw);
        if (Array.isArray(liveWorkforce)) {
          const statusMap = new Map(liveWorkforce.map((w: any) => [w.name, w]));
          return ORG_DEPARTMENTS.map(dept => {
            const updatedAgents = dept.agents.map(ag => {
              const live = statusMap.get(ag.name);
              if (live) {
                return {
                  ...ag,
                  status: (live.status === 'Active' || live.status === 'Paused') ? live.status : ag.status,
                  autonomy: (live.autonomy_level as any) || ag.autonomy,
                  runs_today: live.daily_executions || ag.runs_today,
                  kpi: live.primary_kpi || ag.kpi
                };
              }
              return ag;
            });
            return { ...dept, agents: updatedAgents };
          });
        }
      }
    } catch {}
    return ORG_DEPARTMENTS;
  }, []);

  const filteredDepts = useMemo(() => {
    if (selectedDept === 'all') return dynamicDepts;
    return dynamicDepts.filter(d => d.id === selectedDept);
  }, [selectedDept, dynamicDepts]);

  const totalAgentsCount = dynamicDepts.reduce((sum, d) => sum + d.agents.length, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5" /> AI Intelligence & Agent Workforce
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Hierarchical Workforce Structure & Reporting Lines</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Agent Organisation Chart</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Interactive organizational hierarchy showing reporting relationships, supervisor oversight, autonomous tier permissions, and departmental alignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ai/agents')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all hover:border-slate-600"
          >
            <Bot className="w-3.5 h-3.5 text-sky-400" />
            Agent Workforce
          </button>
        </div>
      </div>

      {/* Filter Tabs by Department */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 p-2 rounded-xl border border-slate-800/60">
        <button
          onClick={() => setSelectedDept('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedDept === 'all'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Departments ({totalAgentsCount} Agents)
        </button>
        {ORG_DEPARTMENTS.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDept(d.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedDept === d.id
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {d.title.split('&')[0].trim()} ({d.agents.length})
          </button>
        ))}
      </div>

      {/* Hierarchical Org Tree Visualizer */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-8 overflow-x-auto">
        {/* Level 0: Enterprise Chief AI Orchestrator */}
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-2 border-sky-500/50 rounded-2xl p-4 shadow-xl shadow-sky-600/10 flex items-center gap-4 max-w-md w-full">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-sky-600/30 flex-shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">SYVORIS Core AI Orchestrator</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Online v2.4
                </span>
              </div>
              <p className="text-[11px] text-sky-300 mt-0.5">Autonomous Enterprise Brain & Governance Gateway</p>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                <span>Supervisor: Arjun Mehta (Owner)</span>
                <span>•</span>
                <span>{totalAgentsCount} Governed Personas</span>
              </div>
            </div>
          </div>

          {/* Central Stem Line */}
          <div className="w-0.5 h-8 bg-sky-500/40 my-1" />
        </div>

        {/* Level 1: Department Clusters */}
        <div className="space-y-6">
          {filteredDepts.map((dept) => {
            const isCollapsed = collapsedDepts[dept.id];
            return (
              <div
                key={dept.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4"
              >
                {/* Department Header Node */}
                <div
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => toggleCollapse(dept.id)}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 group-hover:text-white p-1">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div className={`p-2 rounded-xl bg-gradient-to-r border ${dept.color} flex items-center justify-center`}>
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                          {dept.title}
                        </h3>
                        <span className="text-[11px] text-slate-400">({dept.agents.length} Specialist Agents)</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Tier-1 Controller: <span className="font-semibold text-slate-200">{dept.lead}</span> ({dept.leadRole})
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-sky-400 font-medium">
                    {isCollapsed ? 'Expand Cluster' : 'Collapse'}
                  </span>
                </div>

                {/* Child Agent Cards */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2 pl-7 border-l-2 border-slate-800 ml-5">
                    {dept.agents.map((agent) => (
                      <div
                        key={agent.id}
                        onClick={() => setSelectedNode(agent)}
                        className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-sky-400">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs group-hover:text-sky-300 transition-colors">
                                {agent.name}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                {agent.role}
                              </div>
                            </div>
                          </div>
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold ${
                            agent.autonomy === 'Act Autonomously' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' :
                            agent.autonomy === 'Act with Approval' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                            'bg-slate-700/50 text-slate-300'
                          }`}>
                            {agent.autonomy.replace('Act ', '')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                          <span>Supervisor: {agent.supervisor.split('(')[0].trim()}</span>
                          <span className="text-emerald-400">{agent.runs_today} runs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedNode.name}</h3>
                  <p className="text-xs text-slate-400">{selectedNode.department}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Direct Supervisor:</span>
                  <span className="font-semibold text-white">{selectedNode.supervisor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Autonomy Guardrail:</span>
                  <span className="font-mono text-sky-400 font-semibold">{selectedNode.autonomy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Executions:</span>
                  <span className="font-mono text-white font-bold">{selectedNode.runs_today} invocations</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary KPI Target:</span>
                  <span className="font-medium text-emerald-400">{selectedNode.kpi}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Permitted Tool Scopes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.tools.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-800 text-sky-300 border border-slate-700/80 flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3 text-sky-400" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    navigate('/ai/agents');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  View in Workforce
                </button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
