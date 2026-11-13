import { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck, Check, X, ShieldAlert,
  ArrowRight, ShieldCheck, UserCheck,
  TrendingDown, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { money } from '../../data/models';
import { api } from '../../services/api';

interface ApprovalItem {
  id: string;
  ref: string;
  title: string;
  category: 'Discount Override' | 'Credit Limit' | 'Commercial Terms' | 'AI Agent Proposal' | 'SLA Refund';
  entity: string;
  entityRef: string;
  requester: string;
  date: string;
  amount: number;
  discountPct?: number;
  risk: 'Low' | 'Medium' | 'High';
  policy: string;
  justification: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  resolvedBy?: string;
  resolvedAt?: string;
  rejectionReason?: string;
}

const defaultApprovals: ApprovalItem[] = [
  {
    id: 'app-1',
    ref: 'APR-2026-081',
    title: 'Quote QTE-2026-081: 22% Enterprise Volume Discount Override',
    category: 'Discount Override',
    entity: 'Quote',
    entityRef: 'QTE-2026-081',
    requester: 'Marcus Vance (Sales Director)',
    date: '2026-11-08',
    amount: 148500,
    discountPct: 22,
    risk: 'High',
    policy: 'Commercial Policy §4.2: Any discount exceeding 15% requires VP of Sales authorization.',
    justification: 'Strategic multi-year deal against competitor. Customer committed to a 3-year term with upfront annual billing if 22% discount is approved.',
    status: 'Pending',
  },
  {
    id: 'app-2',
    ref: 'APR-2026-082',
    title: 'Horizon Healthtech: Extended Net-90 Payment Terms Request',
    category: 'Commercial Terms',
    entity: 'Organization',
    entityRef: 'ORG-102',
    requester: 'Devon Wright (Account Executive)',
    date: '2026-11-07',
    amount: 88000,
    risk: 'Medium',
    policy: 'Credit & Treasury Policy §2.1: Standard payment terms are Net-30. Net-90 requires CFO or Finance Director approval.',
    justification: 'Hospital procurement process has a fixed 90-day disbursement cadence. Customer credit check score is 94/100 (Exceptional).',
    status: 'Pending',
  },
  {
    id: 'app-3',
    ref: 'APR-2026-083',
    title: 'Negotiation Agent AI-03: Proposed Multi-tier Software Bundle Discount',
    category: 'AI Agent Proposal',
    entity: 'Opportunity',
    entityRef: 'OPP-101',
    requester: 'Negotiation AI Agent',
    date: '2026-11-09',
    amount: 220000,
    discountPct: 18,
    risk: 'High',
    policy: 'Autonomous Agent Governance Rule 103: Agent proposals involving revenue variance > $25,000 require human-in-the-loop review.',
    justification: 'Predictive win model indicates deal probability increases from 42% to 78% with customized tier-2 hardware bundle.',
    status: 'Pending',
  },
  {
    id: 'app-4',
    ref: 'APR-2026-079',
    title: 'Apex Global Logistics: $12,500 SLA Credit Refund',
    category: 'SLA Refund',
    entity: 'Service Case',
    entityRef: 'CAS-2026-003',
    requester: 'Elena Rostova (Support Escalation Lead)',
    date: '2026-11-05',
    amount: 12500,
    risk: 'Medium',
    policy: 'Service Credit Authority Matrix: Refunds above $5,000 require Support VP sign-off.',
    justification: 'Calculated credit following 2.4 hour unscheduled API gateway outage during scheduled logistics peak.',
    status: 'Approved',
    resolvedBy: 'VP Customer Operations',
    resolvedAt: '2026-11-06 14:20',
  },
  {
    id: 'app-5',
    ref: 'APR-2026-075',
    title: 'AeroDynamics Ltd: Unsecured $750,000 Credit Limit Extension',
    category: 'Credit Limit',
    entity: 'Organization',
    entityRef: 'ORG-104',
    requester: 'Sarah Jenkins (Enterprise Sales Lead)',
    date: '2026-11-02',
    amount: 750000,
    risk: 'High',
    policy: 'Risk Management Rule: Credit limits > $500k require two executive sign-offs and audited financials.',
    justification: 'Customer requested 45-day credit extension for Q4 aerospace components delivery run.',
    status: 'Rejected',
    resolvedBy: 'CFO / Risk Committee',
    resolvedAt: '2026-11-03 09:10',
    rejectionReason: 'Audited financials for FY2025 have not been supplied by customer treasury yet.',
  }
];

export function ApprovalsView() {
  const { addEvent, addAudit } = useCRM();

  const [items, setItems] = useState<ApprovalItem[]>(defaultApprovals);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(defaultApprovals[0]);
  const [rejectionModal, setRejectionModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [toast, setToast] = useState('');

  const loadApprovals = async () => {
    try {
      const res = await api.listApprovals({ limit: 100 });
      if (res?.items && res.items.length > 0) {
        const mapped: ApprovalItem[] = res.items.map(a => ({
          id: a.id,
          ref: a.ref,
          title: a.title,
          category: (a.category as any) || 'Discount Override',
          entity: a.entity_type,
          entityRef: a.entity_ref,
          requester: a.requester_name,
          date: a.created_at ? a.created_at.slice(0, 10) : '2026-11-09',
          amount: Number(a.amount || 0),
          discountPct: Number(a.discount_pct || 0),
          risk: (a.risk as any) || 'Medium',
          policy: a.policy,
          justification: a.justification,
          status: a.status as any,
          resolvedBy: a.approver_name || undefined,
          resolvedAt: a.resolved_at || undefined,
          rejectionReason: a.rejection_reason || undefined,
        }));
        setItems(mapped);
        if (mapped.length > 0) {
          setSelectedItem(mapped[0]);
        }
      }
    } catch {
      // Fallback to defaultApprovals
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const filtered = useMemo(() => {
    if (filter === 'All') return items;
    return items.filter(i => i.status === filter);
  }, [items, filter]);

  const stats = useMemo(() => {
    const pending = items.filter(i => i.status === 'Pending');
    const highRisk = pending.filter(i => i.risk === 'High');
    const totalApproved = items
      .filter(i => i.status === 'Approved')
      .reduce((s, i) => s + i.amount, 0);
    return {
      pendingCount: pending.length,
      highRiskCount: highRisk.length,
      totalApproved,
    };
  }, [items]);

  const handleApprove = async (item: ApprovalItem) => {
    setItems(prev =>
      prev.map(i =>
        i.id === item.id
          ? {
              ...i,
              status: 'Approved',
              resolvedBy: 'Demo Executive User',
              resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            }
          : i
      )
    );
    if (item.entity === 'Quote') {
      try {
        await api.decideQuoteApproval(item.id, { decision: 'approve', notes: 'Approved via Governance Workspace' });
      } catch {
        // Fallback logged
      }
    }
    addEvent('approval.granted', { ref: item.ref }, `Executive approved ${item.category} for ${item.entityRef}`);
    addAudit('Commercial Approval Granted', 'Demo User', `${item.ref}: ${item.title}`);
    notify(`Approved ${item.ref} (${money(item.amount)}). Audit record logged.`);
  };

  const handleRejectClick = (item: ApprovalItem) => {
    setSelectedItem(item);
    setRejectionNote('');
    setRejectionModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedItem) return;
    const note = rejectionNote.trim() || 'Declined under governance commercial rules.';
    setItems(prev =>
      prev.map(i =>
        i.id === selectedItem.id
          ? {
              ...i,
              status: 'Rejected',
              resolvedBy: 'Demo Executive User',
              resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              rejectionReason: note,
            }
          : i
      )
    );
    if (selectedItem.entity === 'Quote') {
      try {
        await api.decideQuoteApproval(selectedItem.id, { decision: 'reject', notes: note });
      } catch {
        // Fallback logged
      }
    }
    addEvent('approval.rejected', { ref: selectedItem.ref }, `Executive rejected ${selectedItem.category} for ${selectedItem.entityRef}`);
    addAudit('Commercial Approval Rejected', 'Demo User', `${selectedItem.ref}: ${note}`);
    setRejectionModal(false);
    notify(`Rejected ${selectedItem.ref}. Record returned to requester.`);
  };

  const riskBadge = (risk: ApprovalItem['risk']) => {
    switch (risk) {
      case 'High':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">HIGH RISK</span>;
      case 'Medium':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">MEDIUM RISK</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">LOW RISK</span>;
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="GOVERNANCE & TRUST LAYER / APPROVALS"
        title="Executive Approval Center"
        subtitle="Review, audit and authorize high-value commercial discounts, payment term overrides and AI agent recommendations."
        action={
          <div className="flex items-center gap-2">
            <span className="ai-mode-pill">
              <i />
              <span>Human-In-The-Loop Active</span>
            </span>
          </div>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="panel p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <div className="text-xs text-slate-500 font-medium">Pending Decisions</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.pendingCount}</div>
            <div className="text-[11px] text-amber-600 mt-1 font-semibold">{stats.highRiskCount} High Risk Flagged</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ClipboardCheck size={24} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="text-xs text-slate-500 font-medium">Approved Value (Q4)</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{money(stats.totalApproved)}</div>
            <div className="text-[11px] text-emerald-600 mt-1 font-semibold">Authorized under governance</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between border-l-4 border-l-sky-500">
          <div>
            <div className="text-xs text-slate-500 font-medium">Policy Compliance</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">100%</div>
            <div className="text-[11px] text-sky-600 mt-1 font-semibold">Audit trail verification enabled</div>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        {(['Pending', 'Approved', 'Rejected', 'All'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === tab
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
            <span className="ml-1.5 opacity-80 text-[11px]">
              ({tab === 'All' ? items.length : items.filter(i => i.status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="panel p-8 text-center text-slate-400 text-xs">
            No approval records found for the selected filter.
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className={`panel p-4 border transition-all ${
                item.status === 'Pending'
                  ? 'border-slate-200 hover:border-sky-300 bg-white'
                  : 'border-slate-100 bg-slate-50/50 opacity-90'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{item.ref}</span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    {riskBadge(item.risk)}
                    <StatusPill status={item.status} />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span><b>Requested by:</b> {item.requester}</span>
                    <span><b>Date:</b> {item.date}</span>
                    <span><b>Linked Record:</b> {item.entity} ({item.entityRef})</span>
                    <span className="text-slate-900 font-bold"><b>Commercial Value:</b> {money(item.amount)}</span>
                    {item.discountPct && (
                      <span className="text-rose-600 font-bold flex items-center gap-0.5">
                        <TrendingDown size={13} /> {item.discountPct}% Discount
                      </span>
                    )}
                  </div>

                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700 space-y-1">
                    <div>
                      <span className="font-semibold text-slate-800">Policy Guardrail: </span>
                      {item.policy}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Justification: </span>
                      {item.justification}
                    </div>
                    {item.rejectionReason && (
                      <div className="text-rose-700 font-medium">
                        <span className="font-bold">Rejection Note: </span>
                        {item.rejectionReason}
                      </div>
                    )}
                    {item.resolvedBy && (
                      <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200 mt-1">
                        Resolved by {item.resolvedBy} on {item.resolvedAt}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex md:flex-col items-center gap-2 self-start md:min-w-[130px]">
                  {item.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(item)}
                        className="btn primary w-full flex items-center justify-center gap-1.5 text-xs py-2"
                      >
                        <Check size={14} />
                        <span>Approve Deal</span>
                      </button>
                      <button
                        onClick={() => handleRejectClick(item)}
                        className="btn secondary w-full flex items-center justify-center gap-1.5 text-xs py-2 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center w-full p-2 bg-slate-100 rounded-lg text-[11px] text-slate-600 font-medium">
                      Decision Recorded
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rejection Note Modal */}
      {rejectionModal && selectedItem && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setRejectionModal(false)}>
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="eyebrow text-rose-600">GOVERNANCE ENFORCEMENT</span>
                <h2>Reject Approval Request</h2>
              </div>
              <button className="icon-close" onClick={() => setRejectionModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-3">
              <p className="text-xs text-slate-600">
                You are rejecting approval <b>{selectedItem.ref}</b> ({selectedItem.title}). Please enter an explicit reason for the sales team and audit log:
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Rejection Reason & Required Remediation *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Discount exceeds margin floor; request customer to sign 4-year commitment or reduce discount to 12%."
                  value={rejectionNote}
                  onChange={e => setRejectionNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="modal-footer flex items-center justify-end gap-2">
              <button className="btn secondary text-xs" onClick={() => setRejectionModal(false)}>
                Cancel
              </button>
              <button
                className="btn primary text-xs bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="inline-toast">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
