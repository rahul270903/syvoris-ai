import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, BadgeCheck, Bot, Brain, Check,
  CirclePause, CirclePlay, ClipboardCheck, Cpu,
  Plus, ShieldCheck, Sparkles, Target, Users, X, RefreshCw
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { makeId, money, type CRMRecord } from '../../data/models';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import {
  api,
  AIAgentItem,
  AIProposalItem,
  RevenueTwinSimulateResult
} from '../../services/api';

const agentTemplates = [
  ['Negotiation Agent', 'Commercial negotiation', 'Proposes pricing and term options within approved commercial guardrails.', 'Revenue Operations'],
  ['Pricing Agent', 'Pricing intelligence', 'Recommends discounts based on margin, deal context and prior outcomes.', 'Commercial Operations'],
  ['Forecast Agent', 'Forecast intelligence', 'Explains win-probability and forecast movement.', 'Sales Operations'],
  ['Inventory Agent', 'Inventory intelligence', 'Highlights stock-out risk and suggests availability checks.', 'Operations'],
  ['Data Steward', 'Data quality', 'Finds duplicate, incomplete and conflicting records for steward review.', 'Data Governance'],
  ['Meeting Agent', 'Meeting intelligence', 'Summarizes meeting notes and proposes follow-up tasks.', 'Sales Operations'],
  ['Knowledge Agent', 'Knowledge operations', 'Drafts knowledge articles from approved case resolutions.', 'Service Operations'],
  ['CRM Administrator Agent', 'Configuration copilot', 'Turns natural-language configuration requests into reviewable proposals.', 'Platform Administration']
];

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  links?: { label: string; path: string }[];
  sources?: any[];
};

export function AIWorkspace({ path, title, description }: { path: string; title: string; description: string }) {
  const { records, create, update, data, addAudit } = useCRM();
  const navigate = useNavigate();

  // Local store fallbacks
  const deals = records('opportunities');
  const accounts = records('organizations');

  // Live Backend State
  const [liveAgents, setLiveAgents] = useState<AIAgentItem[]>([]);
  const [liveProposals, setLiveProposals] = useState<AIProposalItem[]>([]);
  const [liveSimResult, setLiveSimResult] = useState<RevenueTwinSimulateResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [chatProvider, setChatProvider] = useState<string>('Claude 3.5 Sonnet');

  const [chat, setChat] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello. I am SYVORIS Ai Copilot, grounded in your live tenant records. Ask me about pipeline forecasts, account health, service queues or next-best actions.'
    }
  ]);
  const [prompt, setPrompt] = useState('');
  const [toast, setToast] = useState('');
  const [scenario, setScenario] = useState({ probability: 5, delay: 0, discount: 0 });

  const notify = (s: string) => {
    setToast(s);
    window.setTimeout(() => setToast(''), 3500);
  };

  // Fetch live AI data
  const fetchAIData = async () => {
    setLoading(true);
    try {
      const [agentsRes, proposalsRes] = await Promise.all([
        api.listAIAgents().catch(() => []),
        api.listAIProposals().catch(() => [])
      ]);
      if (agentsRes && agentsRes.length > 0) setLiveAgents(agentsRes);
      if (proposalsRes && proposalsRes.length > 0) setLiveProposals(proposalsRes);
    } catch {
      // Gracefully retain store data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, [path]);

  // Real-time Revenue Digital Twin calculation
  useEffect(() => {
    let active = true;
    api.simulateRevenueTwin({
      probability_uplift: scenario.probability,
      launch_delay_days: scenario.delay,
      discount_pct: scenario.discount
    })
      .then(res => {
        if (active) setLiveSimResult(res);
      })
      .catch(() => {
        // use local math fallback
      });
    return () => {
      active = false;
    };
  }, [scenario.probability, scenario.delay, scenario.discount]);

  const activeAgentsCount = liveAgents.length > 0
    ? liveAgents.filter(a => a.status === 'Active').length
    : records('agents').filter(a => a.status === 'Active').length;

  const pendingProposalsCount = liveProposals.length > 0
    ? liveProposals.filter(p => p.status === 'Pending Approval').length
    : records('decisions').filter(d => d.status === 'Pending Approval').length;

  // Weighted pipeline calculations
  const weighted = liveSimResult?.baseline_weighted_value ??
    deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.status))
      .reduce((s, d) => s + d.amount * (Number(d.probability ?? d.fields.probability ?? 0) / 100), 0);

  const scenarioValue = liveSimResult?.simulated_weighted_value ??
    deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.status))
      .reduce((s, d) => {
        const p = Math.min(100, Math.max(0, Number(d.probability ?? d.fields.probability ?? 0) + scenario.probability));
        return s + d.amount * (p / 100);
      }, 0) * (1 - scenario.discount / 100);

  // Send Copilot query to Live Gateway
  const send = async () => {
    if (!prompt.trim()) return;
    const userMsg: ChatMessage = { id: makeId(), role: 'user', text: prompt.trim() };
    setChat(old => [...old, userMsg]);
    const currentPrompt = prompt.trim();
    setPrompt('');

    try {
      const res = await api.chatWithCopilot({
        message: currentPrompt,
        provider: chatProvider
      });
      const assistantMsg: ChatMessage = {
        id: res.reply.id,
        role: 'assistant',
        text: res.reply.content,
        links: res.reply.suggested_links,
        sources: res.reply.grounding_sources
      };
      setChat(old => [...old, assistantMsg]);
    } catch {
      // Deterministic local simulation fallback
      const q = currentPrompt.toLowerCase();
      let text = 'I processed your inquiry against active CRM records. Please review linked workspaces for detailed execution.';
      let links: { label: string; path: string }[] = [{ label: 'Open CRM dashboard', path: '/dashboard' }];
      if (q.includes('pipeline') || q.includes('forecast')) {
        text = `Current open pipeline is ${money(deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.status)).reduce((s, d) => s + d.amount, 0))}, with a weighted value of ${money(weighted)}.`;
        links = [{ label: 'Open Sales Pipeline', path: '/sales/pipeline' }, { label: 'Explore Revenue Digital Twin', path: '/ai/revenue-twin' }];
      } else if (q.includes('customer') || q.includes('account')) {
        text = `The system tracks ${accounts.length} organization records with live Customer 360 relationship graphs.`;
        links = [{ label: 'Customer 360', path: '/customers/360' }];
      }
      setChat(old => [...old, { id: makeId(), role: 'assistant', text, links }]);
    }
  };

  const toggleAgent = async (agent: AIAgentItem | CRMRecord) => {
    const isLive = 'persona' in agent;
    const nextStatus = agent.status === 'Active' ? 'Paused' : 'Active';

    if (isLive) {
      setLiveAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: nextStatus } : a));
      try {
        await api.updateAIAgent(agent.id, { status: nextStatus });
        addAudit('AI Agent Status Toggled', 'User', `${agent.name}: ${nextStatus}`);
        notify(`${agent.name} ${nextStatus.toLowerCase()}.`);
      } catch {
        notify(`${agent.name} status updated locally.`);
      }
    } else {
      update('agents', agent.id, { status: nextStatus }, `Agent ${nextStatus.toLowerCase()}`);
      notify(`${agent.title} ${nextStatus.toLowerCase()}.`);
    }
  };

  const handleAutonomyChange = async (agent: AIAgentItem | CRMRecord, level: string) => {
    const isLive = 'persona' in agent;
    if (isLive) {
      setLiveAgents(prev => prev.map(a => a.id === agent.id ? { ...a, autonomy_level: level } : a));
      try {
        await api.updateAIAgent(agent.id, { autonomy_level: level });
        addAudit('AI Autonomy Level Changed', 'User', `${agent.name}: ${level}`);
        notify(`${agent.name} autonomy set to ${level}.`);
      } catch {
        notify(`Autonomy updated locally.`);
      }
    } else {
      update('agents', agent.id, { fields: { autonomy: level } }, 'Agent autonomy configuration changed');
      notify(`${agent.title} autonomy updated.`);
    }
  };

  const approveProposal = async (proposalId: string, approved: boolean) => {
    try {
      await api.decideAIProposal(proposalId, {
        approved,
        notes: approved ? 'Approved by commercial reviewer' : 'Rejected by commercial reviewer'
      });
      setLiveProposals(prev =>
        prev.map(p => p.id === proposalId ? { ...p, status: approved ? 'Approved' : 'Rejected' } : p)
      );
      addAudit(approved ? 'AI Proposal Approved' : 'AI Proposal Rejected', 'User', proposalId);
      notify(`Proposal ${approved ? 'approved' : 'rejected'} in PostgreSQL.`);
    } catch {
      // fallback to store
      const decision = records('decisions').find(d => d.id === proposalId);
      if (decision) {
        update('decisions', decision.id, { status: approved ? 'Approved' : 'Rejected' }, approved ? 'Human approval granted' : 'Human approval rejected');
        addAudit(approved ? 'AI proposal approved' : 'AI proposal rejected', 'Arjun Mehta', decision.ref);
        notify(`${decision.ref} ${approved ? 'approved' : 'rejected'}.`);
      }
    }
  };

  const handleSaveScenario = async () => {
    try {
      const saved = await api.saveRevenueScenario({
        name: `Pipeline Scenario · ${new Date().toLocaleDateString()}`,
        description: `Probability +${scenario.probability}pts, Delay ${scenario.delay}d, Discount ${scenario.discount}%`,
        probability_uplift: scenario.probability,
        launch_delay_days: scenario.delay,
        discount_pct: scenario.discount,
        assumptions: {
          probability: scenario.probability,
          delay: scenario.delay,
          discount: scenario.discount
        }
      });
      notify(`Scenario ${saved.ref} saved into PostgreSQL.`);
    } catch {
      const x = create(
        'scenarios',
        {
          name: `Pipeline scenario · ${new Date().toLocaleDateString()}`,
          probabilityUplift: String(scenario.probability),
          launchDelay: String(scenario.delay),
          discount: String(scenario.discount),
          outcome: money(scenarioValue),
          description: 'Illustrative revenue digital twin scenario.'
        },
        { status: 'Simulated', amount: scenarioValue }
      );
      notify(`Scenario ${x.ref} saved.`);
    }
  };

  // 1. CONVERSATIONAL COPILOT VIEW
  if (path === '/ai/copilot') {
    return (
      <div className="ai-workspace">
        <SectionHeading
          eyebrow="AI INTELLIGENCE / CONVERSATIONAL INTERFACE"
          title="Conversational Copilot"
          subtitle="Explore customer and sales context, generate grounded summaries and prepare controlled action proposals."
          action={
            <div className="flex items-center gap-2">
              <select
                value={chatProvider}
                onChange={e => setChatProvider(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium"
              >
                <option>Claude 3.5 Sonnet</option>
                <option>GPT-4o</option>
                <option>Gemini 1.5 Pro</option>
              </select>
              <span className="ai-mode-pill"><i /> Grounded AI</span>
            </div>
          }
        />
        <div className="ai-chat-layout">
          <section className="panel copilot-panel">
            <div className="copilot-top">
              <div className="copilot-symbol"><Sparkles size={18} /></div>
              <div>
                <strong>SYVORIS Ai Copilot</strong>
                <small>Grounded in PostgreSQL CRM context · {chatProvider}</small>
              </div>
              <StatusPill status="Live Gateway" />
            </div>
            <div className="chat-stream">
              {chat.map(m => (
                <div className={`chat-message ${m.role}`} key={m.id}>
                  <span className="chat-avatar">
                    {m.role === 'assistant' ? <Bot size={15} /> : <span>DU</span>}
                  </span>
                  <div>
                    <small>{m.role === 'assistant' ? `SYVORIS Ai (${chatProvider})` : 'You'}</small>
                    <p>{m.text}</p>
                    {m.links && m.links.length > 0 && (
                      <div className="chat-links">
                        {m.links.map(l => (
                          <button key={l.path} onClick={() => navigate(l.path)}>
                            {l.label} <ArrowRight size={13} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input-area">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask about pipeline forecasts, accounts, deals or customer cases…"
                rows={2}
              />
              <button className="btn primary" onClick={send}>
                <Sparkles size={15} /> Ask Copilot
              </button>
            </div>
            <div className="copilot-footnote">
              Grounded in live tenant data via PostgreSQL RLS. Action proposals require explicit human approval.
            </div>
          </section>

          <aside className="panel copilot-context">
            <h3>Available context</h3>
            <div className="context-stat">
              <Users size={16} />
              <span>Organizations</span>
              <b>{accounts.length}</b>
            </div>
            <div className="context-stat">
              <Target size={16} />
              <span>Open opportunities</span>
              <b>{deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.status)).length}</b>
            </div>
            <div className="context-stat">
              <ClipboardCheck size={16} />
              <span>Pending approvals</span>
              <b>{pendingProposalsCount}</b>
            </div>
            <div className="context-stat">
              <HeadphoneIcon />
              <span>Open cases</span>
              <b>{records('cases').filter(c => !['Resolved', 'Closed'].includes(c.status)).length}</b>
            </div>
            <div className="context-policy">
              <ShieldCheck size={16} />
              <span>Three-tier governance active. Advisory insights staged; database writes require approval.</span>
            </div>

            <h3>Suggested prompts</h3>
            {[
              'Summarize the current sales pipeline',
              'Which leads need qualification?',
              'Show open customer support cases',
              'Summarize customer account health'
            ].map(p => (
              <button className="suggested-prompt" key={p} onClick={() => setPrompt(p)}>
                {p} <ArrowRight size={13} />
              </button>
            ))}
          </aside>
        </div>
      </div>
    );
  }

  // 2. REVENUE DIGITAL TWIN
  if (path === '/ai/revenue-twin') {
    return (
      <div className="ai-workspace">
        <SectionHeading
          eyebrow="AI INTELLIGENCE / SCENARIO SIMULATION"
          title="Revenue Digital Twin"
          subtitle="Explore pipeline what-if scenarios using real-time deal models. Scenarios never modify production CRM records."
          action={<StatusPill status="PostgreSQL Engine" />}
        />
        <div className="demo-strip">
          <span className="demo-strip-icon"><ShieldCheck size={16} /></span>
          <div>
            <strong>Interactive Revenue Sandbox</strong>
            <p>
              {liveSimResult?.summary_commentary ||
                'Projections are calculated server-side from your tenant’s active pipeline. What-if modeling preserves audit baseline.'}
            </p>
          </div>
        </div>

        <div className="scenario-grid">
          <section className="panel scenario-controls">
            <h2>Scenario variables</h2>
            <p>Adjust variables to calculate simulated pipeline outcomes in real time.</p>
            <label>
              Win probability uplift <strong>+{scenario.probability} pts</strong>
              <input
                type="range"
                min="0"
                max="25"
                value={scenario.probability}
                onChange={e => setScenario({ ...scenario, probability: Number(e.target.value) })}
              />
            </label>
            <label>
              Launch delay <strong>{scenario.delay} days</strong>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={scenario.delay}
                onChange={e => setScenario({ ...scenario, delay: Number(e.target.value) })}
              />
            </label>
            <label>
              Commercial discount <strong>{scenario.discount}%</strong>
              <input
                type="range"
                min="0"
                max="25"
                value={scenario.discount}
                onChange={e => setScenario({ ...scenario, discount: Number(e.target.value) })}
              />
            </label>
            <button className="btn primary" onClick={handleSaveScenario}>
              <Plus size={15} /> Save scenario
            </button>
          </section>

          <section className="panel scenario-results">
            <span className="eyebrow">SIMULATED WEIGHTED PIPELINE</span>
            <strong className="scenario-big-value">{money(scenarioValue)}</strong>
            <div className="scenario-delta">
              {money(scenarioValue - weighted)} vs current weighted pipeline
            </div>
            <div className="scenario-bars">
              <div>
                <span>Current weighted</span>
                <i>
                  <b style={{ width: `${weighted ? (weighted / Math.max(scenarioValue, weighted)) * 100 : 0}%` }} />
                </i>
                <strong>{money(weighted)}</strong>
              </div>
              <div>
                <span>Scenario</span>
                <i>
                  <b
                    className="scenario-fill"
                    style={{ width: `${scenarioValue ? (scenarioValue / Math.max(scenarioValue, weighted)) * 100 : 0}%` }}
                  />
                </i>
                <strong>{money(scenarioValue)}</strong>
              </div>
            </div>
            <div className="scenario-assumptions">
              <b>Assumptions</b>
              <span>
                Probability +{scenario.probability} points · Delay {scenario.delay} days · Discount {scenario.discount}%
              </span>
              <small>Simulations operate in sandbox memory; opportunity records remain untouched.</small>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // 3. CUSTOMER INTELLIGENCE
  if (path === '/ai/customer-intelligence') {
    const interactions = records('interactions');
    const memoryEntries = [
      ...interactions.map(x => ({ id: x.id, ref: x.ref, title: x.title, kind: x.fields.type || 'Interaction', date: x.date, summary: x.description })),
      ...records('cases').map(x => ({ id: x.id, ref: x.ref, title: x.title, kind: 'Service case', date: x.date, summary: x.description })),
      ...records('opportunities').map(x => ({ id: x.id, ref: x.ref, title: x.title, kind: 'Commercial event', date: x.date, summary: x.description }))
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
    const possibleDuplicates = records('duplicates');

    return (
      <div className="ai-workspace">
        <SectionHeading
          eyebrow="MEMORY & CONTEXT LAYER / CUSTOMER INTELLIGENCE"
          title="Customer Intelligence"
          subtitle="Permission-aware customer memory, relationship context, entity resolution and recent interaction retrieval."
          action={<StatusPill status="PostgreSQL Active" />}
        />
        <div className="demo-strip">
          <span className="demo-strip-icon"><ShieldCheck size={16} /></span>
          <div>
            <strong>Grounded Customer Memory</strong>
            <p>Customer context is indexed across accounts, contacts, open deals, support tickets and touchpoints.</p>
          </div>
        </div>

        <div className="ai-metrics">
          <div className="panel">
            <span>Organizations</span>
            <strong>{accounts.length}</strong>
            <small>Canonical account records</small>
          </div>
          <div className="panel">
            <span>Contacts</span>
            <strong>{records('contacts').length}</strong>
            <small>Linked people records</small>
          </div>
          <div className="panel">
            <span>Interactions</span>
            <strong>{interactions.length}</strong>
            <small>Timeline entries</small>
          </div>
          <div className="panel">
            <span>Duplicate reviews</span>
            <strong>{possibleDuplicates.length}</strong>
            <small>Steward review queue</small>
          </div>
        </div>

        <div className="memory-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Customer relationship graph</h2>
                <p>Organizations and their linked contacts, deals and cases.</p>
              </div>
              <Brain size={18} />
            </div>
            <div className="memory-account-list">
              {accounts.map(account => (
                <button key={account.id} onClick={() => navigate('/customers/360', { state: { openRecordId: account.id } })}>
                  <span className="memory-account-icon"><Users size={16} /></span>
                  <span>
                    <strong>{account.title}</strong>
                    <small>{account.fields.segment || 'Enterprise'} · {account.fields.industry || 'Technology'}</small>
                    <em>
                      {(account.links.contacts || []).length} contacts · {(account.links.opportunities || []).length} deals · {(account.links.cases || []).length} cases
                    </em>
                  </span>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Recent customer memory</h2>
                <p>Chronological context retrieved from local interactions.</p>
              </div>
              <Activity size={18} />
            </div>
            <div className="memory-timeline">
              {memoryEntries.map(entry => (
                <div key={entry.id}>
                  <i />
                  <span>
                    <strong>{entry.title}</strong>
                    <small>{entry.ref} · {entry.kind} · {entry.date}</small>
                    <p>{entry.summary}</p>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Entity resolution & data stewardship</h2>
              <p>Potential duplicates and conflicting attributes awaiting human review.</p>
            </div>
            <StatusPill status="Human review" />
          </div>
          {possibleDuplicates.length ? (
            possibleDuplicates.map(d => (
              <div className="decision-card" key={d.id}>
                <div className="decision-main">
                  <strong>{d.title}</strong>
                  <p>{d.description}</p>
                  <small>{d.ref} · {d.owner}</small>
                </div>
                <StatusPill status={d.status} />
              </div>
            ))
          ) : (
            <div className="empty-inline">
              No duplicate candidates detected. Use Trigram Deduplication to analyze account records.
            </div>
          )}
        </section>
      </div>
    );
  }

  // 4. AGENT ORGANISATION CHART
  if (path === '/ai/org-chart') {
    const displayAgents = liveAgents.length > 0 ? liveAgents : records('agents');
    return (
      <div className="ai-workspace">
        <SectionHeading
          eyebrow="AI INTELLIGENCE / WORKFORCE STRUCTURE"
          title="Agent Organisation Chart"
          subtitle="Digital employee roles, ownership, autonomy and reporting relationships."
        />
        <section className="panel org-chart-panel">
          <div className="org-root">
            <span><Brain size={19} /></span>
            <strong>SYVORIS Ai Agent Workforce</strong>
            <small>14 Specialist Personas · Governed Digital Organization</small>
          </div>
          <div className="org-connect" />
          <div className="agent-org-grid">
            {displayAgents.map((a: any) => (
              <button className="agent-org-card" key={a.id} onClick={() => navigate('/ai/agents')}>
                <span className="agent-avatar"><Bot size={17} /></span>
                <strong>{a.name || a.title}</strong>
                <small>{a.persona || a.fields?.role}</small>
                <StatusPill status={a.status} />
                <em>{a.owner_name || a.fields?.owner || 'System'}</em>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // 5. AGENT MARKETPLACE
  if (path === '/ai/marketplace') {
    return (
      <div className="ai-workspace">
        <SectionHeading
          eyebrow="AI INTELLIGENCE / AGENT ECOSYSTEM"
          title="Agent Marketplace"
          subtitle="Discover specialist agent templates and configure them for your workforce."
        />
        <div className="marketplace-grid">
          {agentTemplates.map(([name, role, purpose, owner]) => (
            <div className="panel marketplace-card" key={name}>
              <span className="marketplace-icon"><Bot size={19} /></span>
              <h3>{name}</h3>
              <span className="eyebrow">{role}</span>
              <p>{purpose}</p>
              <div>
                <small>Suggested owner · {owner}</small>
                <button
                  className="btn secondary"
                  onClick={() => notify(`${name} template selected. Active in workforce.`)}
                >
                  <Plus size={14} /> Add agent
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="prototype-note">
          <ShieldCheck size={16} />
          <span>All specialist personas adhere to three-tier governance limits.</span>
        </div>
      </div>
    );
  }

  // 6. DEFAULT WORKFORCE & ACTIVITY / PROPOSALS VIEW
  const isGovernance = path === '/ai/governance';
  const isDecisions = path === '/ai/activity' || path === '/ai/recommendations';
  const displayAgents = liveAgents.length > 0 ? liveAgents : records('agents');
  const displayProposals = liveProposals.length > 0 ? liveProposals : records('decisions');

  return (
    <div className="ai-workspace">
      <SectionHeading
        eyebrow="AI INTELLIGENCE / AGENTIC OPERATIONS"
        title={title}
        subtitle={description}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAIData}
              disabled={loading}
              className="btn secondary text-xs py-1 px-2.5 flex items-center gap-1"
              title="Refresh AI engine telemetry"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <span className="ai-mode-pill"><i /> Governed Engine</span>
          </div>
        }
      />

      <div className="demo-strip">
        <span className="demo-strip-icon"><ShieldCheck size={16} /></span>
        <div>
          <strong>Three-Tier Governance Active</strong>
          <p>
            Agent autonomy, tool permissions and decision thresholds are enforced server-side.
            High-risk proposals require explicit human approval before execution.
          </p>
        </div>
      </div>

      <div className="ai-metrics">
        <div className="panel">
          <span>Configured agents</span>
          <strong>{displayAgents.length}</strong>
          <small>Specialist personas</small>
        </div>
        <div className="panel">
          <span>Active agents</span>
          <strong>{activeAgentsCount}</strong>
          <small>Online & monitoring</small>
        </div>
        <div className="panel">
          <span>Pending decisions</span>
          <strong>{pendingProposalsCount}</strong>
          <small>Human review required</small>
        </div>
        <div className="panel">
          <span>Open opportunities</span>
          <strong>{deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.status)).length}</strong>
          <small>Connected context</small>
        </div>
      </div>

      {isDecisions ? (
        <section className="panel ai-table-panel">
          <div className="panel-heading">
            <div>
              <h2>{path === '/ai/activity' ? 'Agent activity queue' : 'AI recommendations & proposals'}</h2>
              <p>Review evidence, rationale and approval requirements.</p>
            </div>
            <span className="phase-chip">Human review</span>
          </div>
          <div className="decision-list">
            {displayProposals.map((d: any) => (
              <div className="decision-card" key={d.id}>
                <div className="decision-icon"><Sparkles size={18} /></div>
                <div className="decision-main">
                  <strong>{d.action || d.title}</strong>
                  <p>{d.reasoning || d.fields?.action || d.description}</p>
                  <small>
                    {d.ref} · {d.agent_name || d.fields?.agent || 'Specialist Agent'} · Confidence {d.confidence || d.fields?.confidence || '0.92'}
                  </small>
                  <div className="decision-evidence">
                    <span><b>Policy:</b> {d.policy_check || d.fields?.policy || 'Compliant'}</span>
                    {d.evidence && <span><b>Evidence:</b> {d.evidence}</span>}
                  </div>
                </div>
                <div className="decision-right">
                  <StatusPill status={d.status} />
                  {d.status === 'Pending Approval' && (
                    <div className="flex items-center gap-1.5">
                      <button className="btn primary small" onClick={() => approveProposal(d.id, true)}>
                        <BadgeCheck size={14} /> Approve
                      </button>
                      <button className="btn secondary small" onClick={() => approveProposal(d.id, false)}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel agent-list-panel">
          <div className="panel-heading">
            <div>
              <h2>
                {isGovernance ? 'Agent autonomy & governance' : path === '/ai/agents' ? 'Agent workforce' : 'Agent command centre'}
              </h2>
              <p>Agent mission, KPI, owner, permissions and autonomy configuration.</p>
            </div>
            <button className="btn secondary" onClick={() => navigate('/ai/marketplace')}>
              <Plus size={15} /> Browse marketplace
            </button>
          </div>
          <div className="agent-table">
            {displayAgents.map((a: any) => {
              const name = a.name || a.title;
              const role = a.role_description || a.fields?.role || a.persona;
              const moduleName = a.module || a.fields?.module || 'CRM';
              const kpi = a.primary_kpi || a.fields?.kpi || 'Efficiency';
              const autonomy = a.autonomy_level || a.fields?.autonomy || 'Suggest Only';

              return (
                <div className="agent-table-row" key={a.id}>
                  <span className="agent-avatar"><Bot size={16} /></span>
                  <div className="agent-info">
                    <strong>{name}</strong>
                    <small>{role} · {moduleName}</small>
                  </div>
                  <div className="agent-kpi">
                    <small>Primary KPI</small>
                    <span>{kpi}</span>
                  </div>
                  <div className="agent-autonomy">
                    <small>Autonomy</small>
                    {isGovernance ? (
                      <select
                        value={autonomy}
                        onChange={e => handleAutonomyChange(a, e.target.value)}
                      >
                        <option>Suggest Only</option>
                        <option>Act with Approval</option>
                        <option>Act Autonomously</option>
                      </select>
                    ) : (
                      <span>{autonomy}</span>
                    )}
                  </div>
                  <StatusPill status={a.status} />
                  <button className="btn secondary small" onClick={() => toggleAgent(a)}>
                    {a.status === 'Active' ? (
                      <><CirclePause size={14} /> Pause</>
                    ) : (
                      <><CirclePlay size={14} /> Resume</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="ai-bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Governance guardrails</h2>
              <p>Three-tier architectural governance model</p>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="guardrail-list">
            <div>
              <strong>Suggest Only</strong>
              <span>Propose recommendations; no operational action permitted.</span>
            </div>
            <div>
              <strong>Act with Approval</strong>
              <span>Prepare actions; execution blocked until human signs off.</span>
            </div>
            <div>
              <strong>Act Autonomously</strong>
              <span>Allowed only within configured policies and audit bounds.</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Architecture readiness</h2>
              <p>Seven-layer target architecture</p>
            </div>
            <Cpu size={18} />
          </div>
          <div className="layer-list">
            {[
              'Experience Layer',
              'CRM Transaction Layer',
              'Memory & Context Layer',
              'Agentic Orchestration Layer',
              'Knowledge & Intelligence Layer',
              'Integration & Event Layer',
              'Trust & Governance Layer'
            ].map((x, i) => (
              <div key={x}>
                <b>{String(i + 1).padStart(2, '0')}</b>
                <span>{x}</span>
                <StatusPill status="Active" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {toast && (
        <div className="inline-toast">
          <Check size={15} />
          {toast}
          <button onClick={() => setToast('')}><X size={13} /></button>
        </div>
      )}
    </div>
  );
}

function HeadphoneIcon() {
  return <Activity size={16} />;
}
