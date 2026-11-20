import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Search, Sparkles, BookOpen, ShieldCheck, Database,
  Cpu, Activity, ChevronRight, ChevronDown, Check,
  Send, Ticket, RefreshCw, Key, Layers, ArrowUpRight,
  HelpCircle, CheckCircle2, Clock
} from 'lucide-react';
import { useCRM } from '../store/CRMStore';

interface Props {
  onClose: () => void;
}

type TabType = 'guides' | 'faqs' | 'shortcuts' | 'diagnostics' | 'tickets';

export function HelpCenterDrawer({ onClose }: Props) {
  const navigate = useNavigate();
  const { create, addAudit, addEvent, records } = useCRM();

  const [activeTab, setActiveTab] = useState<TabType>('guides');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');

  // Diagnostics test state
  const [runningDiag, setRunningDiag] = useState(false);
  const [diagTimestamp, setDiagTimestamp] = useState<string>('Just now');
  const [diagResults, setDiagResults] = useState<{
    db: { status: string; latency: string };
    erp: { status: string; latency: string };
    agents: { status: string; count: number };
    events: { status: string; throughput: string };
  }>({
    db: { status: 'Healthy', latency: '4ms' },
    erp: { status: 'Connected', latency: '38ms' },
    agents: { status: 'Operational', count: 14 },
    events: { status: 'Active', throughput: '124 evt/min' }
  });

  // Ticket creation form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Access & Permissions');
  const [ticketPriority, setTicketPriority] = useState('Normal');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  const existingTickets = records('internalTickets');

  // 1. Guides Data
  const guides = [
    {
      id: 'g-sales',
      title: 'Sales Pipeline, CPQ & Quote Approvals',
      category: 'Commercial',
      path: '/sales/pipeline',
      badge: 'Revenue Operations',
      summary: 'Manage end-to-end deal flow, automated CPQ quote calculations, and two-tier discount governance.',
      steps: [
        'Move qualified leads into opportunities from the Sales Pipeline Kanban.',
        'Use Quote Builder to pull catalog items with currency and tax rules.',
        'Discounts exceeding 15% automatically route to Commercial Operations for approval.',
        'Accepted quotes automatically generate downstream sales orders and invoices.'
      ]
    },
    {
      id: 'g-agents',
      title: 'Governed AI Specialist Workforce',
      category: 'AI Intelligence',
      path: '/ai/agents',
      badge: 'AI Governance',
      summary: 'Collaborate with 14 autonomous specialist agents operating under three-tier governance boundaries.',
      steps: [
        'Tier 1 (Suggest Only): Generates draft proposals without changing operational state.',
        'Tier 2 (Governed Action): Emits structured approval requests to designated team leads.',
        'Tier 3 (Autonomous Execution): Executes routine tasks within strict policy limits.',
        'Every decision and agent proposal is recorded in the immutable audit trail.'
      ]
    },
    {
      id: 'g-erp',
      title: 'Radium ERP Integration & Live ATP Inventory',
      category: 'Integration',
      path: '/integrations/radium',
      badge: 'Core Bridge',
      summary: 'Bidirectional synchronization of general ledger, inventory stocks, and customer orders.',
      steps: [
        'Available-to-Promise (ATP) stock checks occur in real time via secure mTLS 1.3.',
        'Safety buffer stock policies prevent negative warehouse stock commitments.',
        'Fulfillment milestones update both Radium ERP and CRM records atomically.',
        'Inspect sync throughput and trigger full ledger reconciliations anytime.'
      ]
    },
    {
      id: 'g-customer360',
      title: 'Customer 360 & Account Hierarchies',
      category: 'Essentials',
      path: '/customer/360',
      badge: 'Customer Memory',
      summary: 'Synthesized intelligence across communications, open quotes, orders, and tickets.',
      steps: [
        'View unified activity history, sentiment scores, and expansion propensities.',
        'Manage parent/subsidiary corporate trees with automatic cycle-prevention.',
        'Track GDPR/CCPA consent states and multi-channel preferences in real time.',
        'Log phone calls, customer emails, meetings, and SMS messages directly.'
      ]
    },
    {
      id: 'g-workflows',
      title: 'Event-Driven Workflow Automation',
      category: 'Automation',
      path: '/workflows/lifecycle',
      badge: 'Event Fabric',
      summary: 'Configurable event triggers and rules connecting departments across lifecycle handoffs.',
      steps: [
        'Standard domain events (lead.qualified, quote.approved) trigger automated task dispatch.',
        'Territory assignment rules automatically allocate accounts based on region.',
        'SLA policy timers track first-response and resolution deadlines for support cases.',
        'Test and trace workflow executions inside the interactive Workflow Navigator.'
      ]
    }
  ];

  // 2. FAQs Data
  const faqs = [
    {
      id: 'faq-1',
      question: 'How are multi-tenant boundaries and data isolation enforced?',
      category: 'Security & Tenancy',
      answer: 'Tenancy isolation is enforced at the kernel level via PostgreSQL 16 Row-Level Security (RLS) policies scoped strictly to your organization tenant ID. All API queries, Redis cache partitions, and AI agent memory graphs are tenant-isolated.'
    },
    {
      id: 'faq-2',
      question: 'What triggers an approval requirement on a commercial quote?',
      category: 'Sales & CPQ',
      answer: 'Any quote with a line-level or total contract discount exceeding 15%, or a total value exceeding $100,000, automatically triggers a "quote.approval_requested" event. The quote enters "Pending Approval" and routes to Commercial Operations.'
    },
    {
      id: 'faq-3',
      question: 'How does Available-to-Promise (ATP) inventory validation work?',
      category: 'Radium ERP',
      answer: 'Before confirming a sales order, the inventory service performs an mTLS handshake with Radium ERP to verify warehouse stock against safety buffer policies. If stock is insufficient, the system warns the user and alerts the Inventory Agent.'
    },
    {
      id: 'faq-4',
      question: 'Can I reparent an organization or change its holding entity?',
      category: 'Account Hierarchy',
      answer: 'Yes. Open the Account Hierarchies workspace, select the account, and choose "Configure Parent Organization". The system performs acyclic graph checks to prevent recursive loops or assigning a subsidiary as its own parent.'
    },
    {
      id: 'faq-5',
      question: 'Where can I inspect immutable security and compliance audit logs?',
      category: 'Governance & Audit',
      answer: 'Every state transition, quote dispatch, commercial approval, and AI proposal decision is recorded in the tamper-evident audit trail accessible under Administration & Security > Audit Trail (/admin/audit).'
    },
    {
      id: 'faq-6',
      question: 'How do I query or chat with the SYVORIS AI Copilot?',
      category: 'AI Copilot',
      answer: 'Click "Ask AI" in the top header or press Alt+A to open the Copilot workspace (/ai/copilot). The Copilot has full contextual awareness of your active workspace records, deals, pipeline value, and open approval requests.'
    }
  ];

  // 3. Keyboard Shortcuts Data
  const shortcuts = [
    { key: 'Ctrl + K', action: 'Global Omnibox Search', desc: 'Search records, modules & navigation' },
    { key: 'Esc', action: 'Dismiss Overlays', desc: 'Close open drawers, modals & dropdowns' },
    { key: 'Alt + D', action: 'Executive Dashboard', path: '/dashboard', desc: 'Command cockpit & executive metrics' },
    { key: 'Alt + S', action: 'Sales Pipeline', path: '/sales/pipeline', desc: 'Kanban view of active opportunities' },
    { key: 'Alt + Q', action: 'CPQ Quote Builder', path: '/quotes/builder', desc: 'Construct commercial proposals' },
    { key: 'Alt + C', action: 'Customer 360', path: '/customer/360', desc: 'Holistic customer intelligence view' },
    { key: 'Alt + A', action: 'AI Copilot Workspace', path: '/ai/copilot', desc: 'Direct assistant chat & insights' },
    { key: 'Alt + W', action: 'Workflow Navigator', path: '/workflows/lifecycle', desc: 'Visual lifecycle map & handoffs' }
  ];

  // Search Filtering
  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) return guides;
    const q = searchQuery.toLowerCase();
    return guides.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter(f =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handle Diagnostics Ping Test
  const runDiagnostics = () => {
    setRunningDiag(true);
    setTimeout(() => {
      setDiagResults({
        db: { status: 'Healthy', latency: `${Math.floor(Math.random() * 3 + 3)}ms` },
        erp: { status: 'Connected', latency: `${Math.floor(Math.random() * 8 + 32)}ms` },
        agents: { status: 'Operational', count: 14 },
        events: { status: 'Active', throughput: `${Math.floor(Math.random() * 30 + 110)} evt/min` }
      });
      setDiagTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setRunningDiag(false);
    }, 800);
  };

  // Handle Ticket Submission
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;

    const newTicket = create('internalTickets', {
      subject: ticketSubject,
      requester: 'Arjun Mehta',
      category: ticketCategory,
      priority: ticketPriority,
      description: ticketDesc || 'Logged via Enterprise Help Center.',
      status: 'Open'
    }, {
      title: ticketSubject,
      owner: 'IT Support Desk',
      status: 'Open',
      description: ticketDesc || 'Logged via Enterprise Help Center.'
    });

    addAudit('Internal Support Ticket Created', 'Arjun Mehta', `${newTicket.ref}: ${ticketSubject}`);
    addEvent('ticket.created', newTicket, `Support ticket ${newTicket.ref} logged via Help Center.`);

    setTicketSuccess(newTicket.ref);
    setTicketSubject('');
    setTicketDesc('');
  };

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <aside className="help-drawer">
        {/* DRAWER HEADER */}
        <div className="help-drawer-head">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 flex items-center justify-center flex-none">
              <HelpCircle size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">
                SYVORIS AI ENTERPRISE SUPPORT
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight m-0">
                Help & Operations Center
              </h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Operational guides, diagnostics, FAQs & support desk
              </p>
            </div>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="Close Help Centre">
            <X size={18} />
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 bg-slate-50/70">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search guides, FAQs, keyboard shortcuts..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="help-tab-strip">
          {[
            { id: 'guides', label: 'Guides & Workflows', icon: BookOpen },
            { id: 'faqs', label: 'Interactive FAQs', icon: Sparkles },
            { id: 'shortcuts', label: 'Shortcuts', icon: Key },
            { id: 'diagnostics', label: 'Live Diagnostics', icon: Activity },
            { id: 'tickets', label: 'Support Desk', icon: Ticket },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`help-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* DRAWER BODY */}
        <div className="help-drawer-body">
          {/* TAB 1: GUIDES */}
          {activeTab === 'guides' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Operational Guides ({filteredGuides.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Select a workflow to view step-by-step guidance
                </span>
              </div>

              {filteredGuides.map(guide => (
                <div key={guide.id} className="help-guide-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide">
                          {guide.badge}
                        </span>
                        <span className="text-[11px] text-slate-400">· {guide.category}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 m-0">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 mb-2.5 leading-relaxed">
                        {guide.summary}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 text-xs space-y-1.5 mb-3">
                    {guide.steps.map((st, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-600 text-[11.5px] leading-snug">
                        <span className="w-4 h-4 rounded-full bg-white border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center flex-none mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      navigate(guide.path);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>Launch {guide.title.split(',')[0]}</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              ))}

              {filteredGuides.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No operational guides matching &ldquo;{searchQuery}&rdquo;.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FAQS */}
          {activeTab === 'faqs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Frequently Asked Questions ({filteredFaqs.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Click question to expand answer
                </span>
              </div>

              {filteredFaqs.map(faq => {
                const isOpen = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white transition-all shadow-2xs"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 pr-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 flex-none">
                          {faq.category}
                        </span>
                        <span className="text-xs font-bold text-slate-800 leading-snug">
                          {faq.question}
                        </span>
                      </div>
                      <ChevronDown
                        size={15}
                        className={`text-slate-400 transition-transform flex-none ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="p-3.5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredFaqs.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No FAQs matching &ldquo;{searchQuery}&rdquo;.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Enterprise Power Shortcuts
                </span>
                <span className="text-[11px] text-slate-400">
                  Global keyboard navigation
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white divide-y divide-slate-100">
                {shortcuts.map(sc => (
                  <div
                    key={sc.key}
                    onClick={() => {
                      if (sc.path) {
                        onClose();
                        navigate(sc.path);
                      }
                    }}
                    className={`flex items-center justify-between p-3 hover:bg-slate-50 transition-colors ${
                      sc.path ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div>
                      <b className="text-xs font-semibold text-slate-800 block">
                        {sc.action}
                      </b>
                      <small className="text-[11px] text-slate-500">{sc.desc}</small>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-700 font-mono text-[11px] font-bold shadow-2xs flex-none">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Telemetry & Subsystem Health
                  </span>
                  <small className="text-[10px] text-slate-400">
                    Last tested: {diagTimestamp}
                  </small>
                </div>
                <button
                  onClick={runDiagnostics}
                  disabled={runningDiag}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={runningDiag ? 'animate-spin' : ''} />
                  <span>{runningDiag ? 'Testing...' : 'Run Live Test'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Database size={14} className="text-blue-600" /> PostgreSQL 16 RLS
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <b className="text-sm text-slate-900 block">{diagResults.db.status}</b>
                  <small className="text-[11px] text-slate-400">Response latency: {diagResults.db.latency}</small>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Layers size={14} className="text-indigo-600" /> Radium ERP Sync
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <b className="text-sm text-slate-900 block">{diagResults.erp.status}</b>
                  <small className="text-[11px] text-slate-400">Bridge latency: {diagResults.erp.latency}</small>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Cpu size={14} className="text-purple-600" /> Agent Workforce
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <b className="text-sm text-slate-900 block">{diagResults.agents.status}</b>
                  <small className="text-[11px] text-slate-400">{diagResults.agents.count} Autonomous Agents Active</small>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Activity size={14} className="text-emerald-600" /> Event Fabric
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <b className="text-sm text-slate-900 block">{diagResults.events.status}</b>
                  <small className="text-[11px] text-slate-400">{diagResults.events.throughput}</small>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-600 flex-none mt-0.5" />
                <div>
                  <b className="block font-semibold">SOC2 Type II & RLS Security Verified</b>
                  <p className="m-0 mt-0.5 text-[11.5px] text-emerald-800 leading-relaxed">
                    Tenant isolation guarantees active. Transactions and API mutations verify cryptographic signatures and audit trail lineage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SUPPORT TICKETING */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Raise Operational Support Request
                </span>
                <small className="text-[11px] text-slate-500">
                  Directly dispatched to the internal engineering & IT service desk
                </small>
              </div>

              {ticketSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Ticket Logged Successfully: {ticketSuccess}</span>
                  </div>
                  <p className="text-[11.5px] text-emerald-700 m-0">
                    Your request has been recorded into multi-tenant storage and assigned to the support triage queue.
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/internal/tickets');
                      }}
                      className="text-xs font-bold text-emerald-800 underline hover:text-emerald-900"
                    >
                      View in Internal Tickets Workspace &rarr;
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitTicket} className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Request Title / Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                    placeholder="e.g. Radium ERP sync reconciliation error on SKU-881"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Category
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={e => setTicketCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
                    >
                      <option value="Access & Permissions">Access & Permissions</option>
                      <option value="Sales & CPQ">Sales & CPQ</option>
                      <option value="ERP Connector">ERP Connector</option>
                      <option value="AI Intelligence">AI Intelligence</option>
                      <option value="Billing & Invoicing">Billing & Invoicing</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Priority Level
                    </label>
                    <select
                      value={ticketPriority}
                      onChange={e => setTicketPriority(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
                    >
                      <option value="Normal">Normal (24h SLA)</option>
                      <option value="High">High (4h SLA)</option>
                      <option value="Critical">Critical (30m SLA)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Details & Steps to Reproduce
                  </label>
                  <textarea
                    rows={3}
                    value={ticketDesc}
                    onChange={e => setTicketDesc(e.target.value)}
                    placeholder="Provide relevant record IDs, error messages, or context..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  <Send size={14} />
                  <span>Submit Support Request</span>
                </button>
              </form>

              {/* RECENT TICKETS LIST */}
              {existingTickets.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Recent Organization Tickets
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white divide-y divide-slate-100">
                    {existingTickets.slice(0, 3).map(tk => (
                      <div
                        key={tk.id}
                        onClick={() => {
                          onClose();
                          navigate('/internal/tickets');
                        }}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <div>
                          <b className="text-slate-800 block text-xs">{tk.title}</b>
                          <small className="text-[10px] text-slate-400 font-mono">{tk.ref} · {tk.fields.category || 'General'}</small>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {tk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DRAWER FOOTER QUICK LINKS */}
        <div className="help-drawer-footer">
          <button
            onClick={() => {
              onClose();
              navigate('/ai/copilot');
            }}
            className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors"
          >
            <Sparkles size={14} className="text-blue-500" />
            <span>Ask AI Copilot</span>
          </button>

          <button
            onClick={() => {
              onClose();
              navigate('/knowledge');
            }}
            className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold hover:text-slate-800 transition-colors"
          >
            <BookOpen size={14} className="text-slate-500" />
            <span>Knowledge Base</span>
          </button>

          <button
            onClick={() => {
              onClose();
              navigate('/workflows/lifecycle');
            }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <span>Workflows</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </aside>
    </div>
  );
}
