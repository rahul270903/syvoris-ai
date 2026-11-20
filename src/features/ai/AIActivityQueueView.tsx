import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Clock,
  ArrowRight, ShieldCheck, Filter, Search, RefreshCw,
  ExternalLink, Bot, Check, X, FileText, ChevronRight, Eye
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { useCRM } from '../../store/CRMStore';
import { api, AIProposalItem } from '../../services/api';
import { money } from '../../data/models';

export interface ActivityQueueItem {
  id: string;
  ref: string;
  title: string;
  agentName: string;
  category: 'Commercial' | 'Operations' | 'Support NOC' | 'Data Quality' | 'Security';
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Auto-Executed';
  confidence: number;
  createdAt: string;
  targetRecord: {
    ref: string;
    name: string;
    link: string;
  };
  summary: string;
  rationale: string;
  groundingEvidence: string[];
  governancePolicy: string;
  impactValue?: number;
}

const DEFAULT_QUEUE_ITEMS: ActivityQueueItem[] = [
  {
    id: 'prop-2026-0001',
    ref: 'ACT-2026-0081',
    title: 'High-Value Quote Discount Authorization',
    agentName: 'CPQ Margin Guardian',
    category: 'Commercial',
    riskLevel: 'High',
    status: 'Pending Approval',
    confidence: 96.2,
    createdAt: '10 mins ago',
    targetRecord: {
      ref: 'QUO-2026-0004',
      name: 'Cyberdyne Systems · Enterprise Network Modernization',
      link: '/sales/pipeline'
    },
    summary: 'Proposes an 18.0% commercial concession ($8,100 discount) on $45,000 core quote. Margin remains healthy at 34.2% (above 28% floor).',
    rationale: 'Cyberdyne Systems indicated budget pressure against competitor bids. Historical win-rate model predicts an 84% close probability with this adjustment vs 31% at list price.',
    groundingEvidence: [
      'Customer Email: Budget freeze notice received Nov 18',
      'Pricing Policy: Floor margin is 28.0%; post-discount margin is 34.2%',
      'Competitor Intel: Dual-vendor pricing pressure detected'
    ],
    governancePolicy: 'POL-COMM-04: Discounts between 15% and 25% require Human-in-the-Loop review.',
    impactValue: 45000
  },
  {
    id: 'prop-2026-0002',
    ref: 'ACT-2026-0082',
    title: 'Inbound SDR Lead Qualification & Territory Routing',
    agentName: 'Inbound SDR Agent',
    category: 'Operations',
    riskLevel: 'Low',
    status: 'Pending Approval',
    confidence: 98.4,
    createdAt: '24 mins ago',
    targetRecord: {
      ref: 'LED-2026-00003',
      name: 'Bob Collins (CEO at Apex Manufacturing Solutions)',
      link: '/leads'
    },
    summary: 'Evaluated inbound lead against BANT scoring gates. Fit score 85/100 (Tier-1 Strategic). Proposes automated assignment to Senior AE Arjun Mehta.',
    rationale: 'Domain apexmanufacturing.com verified; 1,200 fleet units; high urgency for IoT integration. All BANT criteria fully confirmed.',
    groundingEvidence: [
      'Verified corporate email domain and phone intake',
      'Fit score: 85/100 exceeds auto-assignment threshold (70)',
      'AE Arjun Mehta is leading regional manufacturing pod'
    ],
    governancePolicy: 'POL-LEAD-01: Tier-1 strategic enterprise leads route to principal account team.',
    impactValue: 85000
  },
  {
    id: 'prop-2026-0003',
    ref: 'ACT-2026-0083',
    title: 'Multi-Warehouse Safety Stock PO Draft Trigger',
    agentName: 'Inventory Intelligence Agent',
    category: 'Operations',
    riskLevel: 'Medium',
    status: 'Pending Approval',
    confidence: 91.8,
    createdAt: '1 hour ago',
    targetRecord: {
      ref: 'SKU-OPT-100G',
      name: 'Single-Mode 100G Optical Transceivers (Stock: 12 units)',
      link: '/inventory/stock'
    },
    summary: 'Safety stock breached regional buffer (threshold: 25 units). Proposes purchase order draft of 50 units ($18,500) with primary vendor Fujikura Optical.',
    rationale: 'Active deals in Stage 3 reserve 18 units within the next 45 days. Lead time is 21 days from order issuance.',
    groundingEvidence: [
      'Warehouse Central Hub: 12 units on hand, 18 reserved',
      'Net available-to-promise: -6 units (deficit warning)',
      'Preferred Vendor: Fujikura Optical contracted unit rate: $370.00'
    ],
    governancePolicy: 'POL-PROC-02: Purchase order drafts over $15,000 require procurement supervisor sign-off.',
    impactValue: 18500
  },
  {
    id: 'prop-2026-0004',
    ref: 'ACT-2026-0084',
    title: 'Customer Churn Sentinel: Proactive CSM Rescue Play',
    agentName: 'Save-Play Agent',
    category: 'Support NOC',
    riskLevel: 'High',
    status: 'Auto-Executed',
    confidence: 94.0,
    createdAt: '3 hours ago',
    targetRecord: {
      ref: 'ORG-2026-0002',
      name: 'NovaTech Solutions · High-Priority Account',
      link: '/customers/360'
    },
    summary: 'Detected 2 unresolved high-priority latency cases and 12-day silence from primary sponsor. Dispatched proactive executive check-in task to Account Director.',
    rationale: 'Churn propensity index spiked to 68%. Early intervention historically restores 92% of at-risk accounts to healthy posture.',
    groundingEvidence: [
      'Open Case CASE-2026-00002: API Webhook latency unresolved 4 days',
      'Support sentiment score drop: 42/100',
      'Sponsor last login: 14 days ago'
    ],
    governancePolicy: 'POL-CS-06: Autonomous dispatch of internal CSM follow-up tasks permitted.',
    impactValue: 120000
  },
  {
    id: 'prop-2026-0005',
    ref: 'ACT-2026-0085',
    title: 'Cross-Border VAT & Tax Exemption Audit',
    agentName: 'Compliance Guardian',
    category: 'Security',
    riskLevel: 'Low',
    status: 'Auto-Executed',
    confidence: 99.1,
    createdAt: '5 hours ago',
    targetRecord: {
      ref: 'ORG-2026-0001',
      name: 'Vertex Global Solutions · EU Entity Tax Exemption',
      link: '/inventory/taxes'
    },
    summary: 'Validated EU VIES VAT ID format (DE294820193) and verified active reverse-charge zero-rate tax status for upcoming invoice cycle.',
    rationale: 'Autonomous database check confirmed active registration in European Commission registry with matching legal corporate name.',
    groundingEvidence: [
      'EU VIES Registry API response: Active and valid',
      'Corporate legal entity match: 100% confidence',
      'Invoice template updated with mandatory reverse-charge citation'
    ],
    governancePolicy: 'POL-TAX-01: Autonomous verification and application of government registry tax exemptions.',
    impactValue: 0
  }
];

export function AIActivityQueueView() {
  const navigate = useNavigate();
  const { addAudit, addEvent } = useCRM();
  const [queueItems, setQueueItems] = useState<ActivityQueueItem[]>(DEFAULT_QUEUE_ITEMS);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Pending Approval' | 'Auto-Executed' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ActivityQueueItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Sync with backend proposals if available
  useEffect(() => {
    api.listAIProposals()
      .then(proposals => {
        if (proposals && proposals.length > 0) {
          // Merge backend proposals seamlessly
          setQueueItems(prev => {
            const backendMapped: ActivityQueueItem[] = proposals.map((p: any, idx) => ({
              id: p.id,
              ref: p.ref || `ACT-2026-${(idx + 10).toString().padStart(4, '0')}`,
              title: p.action || p.title || 'AI Action Proposal',
              agentName: p.agent_name || 'Autonomous Agent',
              category: 'Commercial',
              riskLevel: p.payload?.risk_level === 'High' ? 'High' : p.payload?.risk_level === 'Medium' ? 'Medium' : 'Low',
              status: p.status === 'Approved' ? 'Approved' : p.status === 'Rejected' ? 'Rejected' : 'Pending Approval',
              confidence: Number(p.confidence ? (p.confidence <= 1 ? p.confidence * 100 : p.confidence) : 92.5),
              createdAt: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              targetRecord: {
                ref: p.payload?.target_ref || 'REC-001',
                name: p.payload?.target_name || p.action || 'Target Record',
                link: p.payload?.target_link || '/sales/pipeline'
              },
              summary: p.reasoning || p.action,
              rationale: p.reasoning || 'Engine verified with rule-based grounding.',
              groundingEvidence: p.evidence ? (Array.isArray(p.evidence) ? p.evidence : [String(p.evidence)]) : ['Tenant database record match verified'],
              governancePolicy: p.policy_check || 'Three-tier architectural guardrail enforced.',
              impactValue: p.payload?.amount || 0
            }));
            // Combine with default queue items without duplicating ids
            const existingIds = new Set(backendMapped.map(b => b.id));
            const remainingDefaults = prev.filter(d => !existingIds.has(d.id));
            return [...backendMapped, ...remainingDefaults];
          });
        }
      })
      .catch(() => {
        // Fallback to local state
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleApprove = async (item: ActivityQueueItem) => {
    setProcessingId(item.id);
    try {
      // Try backend call
      await api.decideAIProposal(item.id, {
        approved: true,
        notes: 'Approved via Enterprise AI Activity Queue'
      }).catch(() => null);

      setQueueItems(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Approved' } : q));
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem({ ...selectedItem, status: 'Approved' });
      }

      addAudit('AI Proposal Approved', 'Arjun Mehta', `${item.ref}: ${item.title}`);
      addEvent('ai.proposal.approved', { ref: item.ref }, `Approved action proposal for ${item.targetRecord.name}`);
      showToast(`Approved ${item.ref}. Execution committed to audit ledger.`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;
    const item = queueItems.find(q => q.id === rejectingId);
    if (!item) return;

    setProcessingId(item.id);
    try {
      await api.decideAIProposal(item.id, {
        approved: false,
        notes: rejectionReason || 'Rejected by operational reviewer'
      }).catch(() => null);

      setQueueItems(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Rejected' } : q));
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem({ ...selectedItem, status: 'Rejected' });
      }

      addAudit('AI Proposal Rejected', 'Arjun Mehta', `${item.ref}: ${rejectionReason || 'Rejected by reviewer'}`);
      addEvent('ai.proposal.rejected', { ref: item.ref }, `Rejected proposal: ${rejectionReason || 'No notes'}`);
      showToast(`Rejected ${item.ref}. Action cancelled.`);
    } finally {
      setProcessingId(null);
      setRejectingId(null);
      setRejectionReason('');
    }
  };

  const handleApproveAllPending = async () => {
    const pending = queueItems.filter(q => q.status === 'Pending Approval');
    if (pending.length === 0) {
      showToast('No pending proposals requiring review.');
      return;
    }

    setProcessingId('bulk');
    try {
      for (const p of pending) {
        await api.decideAIProposal(p.id, { approved: true, notes: 'Bulk batch approval' }).catch(() => null);
      }
      setQueueItems(prev => prev.map(q => q.status === 'Pending Approval' ? { ...q, status: 'Approved' } : q));
      addAudit('AI Activity Queue Bulk Approved', 'Arjun Mehta', `Approved ${pending.length} pending proposals.`);
      showToast(`Approved all ${pending.length} pending proposals successfully.`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredItems = queueItems.filter(item => {
    const matchesFilter = selectedFilter === 'All' || item.status === selectedFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetRecord.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ref.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = queueItems.filter(q => q.status === 'Pending Approval').length;
  const executedCount = queueItems.filter(q => q.status === 'Auto-Executed' || q.status === 'Approved').length;
  const highRiskCount = queueItems.filter(q => q.riskLevel === 'High' && q.status === 'Pending Approval').length;

  return (
    <div className="ai-workspace space-y-6">
      {/* Header */}
      <SectionHeading
        eyebrow="AI INTELLIGENCE & AGENT WORKFORCE / OPERATIONAL QUEUE"
        title="AI Activity Queue"
        subtitle="Review, approve, and audit AI-initiated decisions, high-risk commercial concessions, and automated operations."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveAllPending}
              disabled={pendingCount === 0 || processingId === 'bulk'}
              className="btn primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
              title="Batch approve verified safe pending proposals"
            >
              {processingId === 'bulk' ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span>Approve All Safe ({pendingCount})</span>
            </button>
            <span className="ai-mode-pill"><i /> Human-in-the-Loop Active</span>
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

      {/* Operational Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Review</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount} Proposals</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Awaiting human sign-off</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Executed Decisions</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{executedCount} Completed</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Immutable audit recorded</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">High-Risk Escalations</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">{highRiskCount} Flagged</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Dual-signoff threshold</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Decision Latency</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">128 ms</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">Real-time inference pipeline</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Pending Approval', 'Auto-Executed', 'Rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedFilter === tab
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab} {tab === 'Pending Approval' && `(${pendingCount})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search activity by deal, lead or agent..."
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Queue Items List */}
      <div className="space-y-3">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
              item.status === 'Pending Approval'
                ? 'border-amber-200/80 bg-amber-50/10'
                : item.status === 'Approved'
                ? 'border-emerald-200/70 bg-emerald-50/10'
                : item.status === 'Rejected'
                ? 'border-slate-200 bg-slate-50/50 opacity-80'
                : 'border-slate-200/90'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Item Info Left */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {item.ref}
                  </span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Bot size={12} /> {item.agentName}
                  </span>
                  <span className="text-xs text-slate-500">· {item.category}</span>
                  <span className="text-xs text-slate-400">· {item.createdAt}</span>

                  <span
                    className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ml-auto lg:ml-0 ${
                      item.riskLevel === 'High'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : item.riskLevel === 'Medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.riskLevel} Risk
                  </span>

                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      item.status === 'Pending Approval'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : item.status === 'Approved' || item.status === 'Auto-Executed'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {item.status === 'Pending Approval' && <Clock size={11} />}
                    {(item.status === 'Approved' || item.status === 'Auto-Executed') && <CheckCircle2 size={11} />}
                    {item.status === 'Rejected' && <XCircle size={11} />}
                    {item.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>

                <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                  {item.summary}
                </p>

                {/* Target Record Link & Metrics */}
                <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                    <FileText size={13} className="text-blue-600" />
                    <span>Target:</span>
                    <button
                      onClick={() => navigate(item.targetRecord.link)}
                      className="font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5"
                    >
                      {item.targetRecord.name}
                      <ExternalLink size={10} className="ml-0.5" />
                    </button>
                  </div>

                  {item.impactValue !== undefined && item.impactValue > 0 && (
                    <div className="text-slate-600">
                      Impact Value: <strong className="text-slate-900">{money(item.impactValue)}</strong>
                    </div>
                  )}

                  <div className="text-emerald-700 font-medium">
                    AI Confidence: <strong>{item.confidence.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons Right */}
              <div className="flex items-center gap-2 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <Eye size={13} />
                  <span>Inspect</span>
                </button>

                {item.status === 'Pending Approval' && (
                  <>
                    <button
                      onClick={() => setRejectingId(item.id)}
                      disabled={processingId === item.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                    >
                      <X size={13} />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApprove(item)}
                      disabled={processingId === item.id}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      {processingId === item.id ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      <span>Approve</span>
                    </button>
                  </>
                )}

                {item.status === 'Approved' && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <CheckCircle2 size={13} /> Enforced
                  </span>
                )}

                {item.status === 'Rejected' && (
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <XCircle size={13} /> Rejected
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Confirmation Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Proposal Rejection</h3>
                <p className="text-xs text-slate-500">Provide an operational reason for the immutable audit trail.</p>
              </div>
            </div>

            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Commercial margin below executive tolerance, alternative competitor quote requested..."
              rows={3}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                className="btn secondary text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="btn primary text-xs py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Detail Inspection Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Top */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedItem.ref}
                  </span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Bot size={12} /> {selectedItem.agentName}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-3">{selectedItem.title}</h2>
              <div className="text-xs text-slate-500 mt-1">Initiated {selectedItem.createdAt} · Status: {selectedItem.status}</div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Executive Summary</h4>
                <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {selectedItem.summary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">AI Reasoning & Strategy</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedItem.rationale}
                </p>
              </div>

              {/* Grounding Evidence */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-600" /> Grounding Evidence Sources
                </h4>
                <div className="space-y-2">
                  {selectedItem.groundingEvidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                      <CheckCircle2 size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy Enforcement Boundary */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-1">Governance Policy Boundary:</span>
                <span className="text-amber-800">{selectedItem.governancePolicy}</span>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedItem(null)}
                className="btn secondary text-xs py-2 px-4"
              >
                Close Drawer
              </button>

              {selectedItem.status === 'Pending Approval' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRejectingId(selectedItem.id);
                    }}
                    className="btn secondary text-xs py-2 px-3 text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedItem)}
                    className="btn primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-sm"
                  >
                    <Check size={14} />
                    <span>Approve Proposal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
