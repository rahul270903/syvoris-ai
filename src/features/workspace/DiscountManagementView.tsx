import { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Plus, Check, X,
  Percent, ArrowRight, ShieldAlert,
  CheckCircle2, FileText
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { money } from '../../data/models';
import { useCRM } from '../../store/CRMStore';

interface AuthorityTier {
  role: string;
  maxDiscount: number;
  marginFloor: string;
  authorization: string;
  badgeColor: string;
}

const DEFAULT_TIERS: AuthorityTier[] = [
  {
    role: 'Account Executive (Standard Rep)',
    maxDiscount: 10,
    marginFloor: '65% Software / 35% Hardware',
    authorization: 'Auto-Approved in CPQ',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    role: 'Sales Director / Regional Manager',
    maxDiscount: 20,
    marginFloor: '55% Software / 30% Hardware',
    authorization: 'Regional Sales Director Sign-off',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    role: 'VP of Enterprise Sales',
    maxDiscount: 30,
    marginFloor: '45% Software / 25% Hardware',
    authorization: 'VP Commercial Authorization',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    role: 'CFO & Executive Pricing Committee',
    maxDiscount: 50,
    marginFloor: 'Requires Board Concession Review',
    authorization: 'Executive Committee Dual-Signature',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
];

interface MarginFloorRule {
  id: string;
  category: string;
  minGrossMargin: number;
  maxDiscountAllowed: number;
  policyType: 'Hard Block' | 'Executive Escalation' | 'Soft Warning';
}

const DEFAULT_MARGIN_RULES: MarginFloorRule[] = [
  { id: '1', category: 'Enterprise Cloud AI Subscriptions', minGrossMargin: 70, maxDiscountAllowed: 25, policyType: 'Hard Block' },
  { id: '2', category: 'Optical Networking & Hardware Equipment', minGrossMargin: 35, maxDiscountAllowed: 18, policyType: 'Hard Block' },
  { id: '3', category: 'Professional Implementation & Training', minGrossMargin: 45, maxDiscountAllowed: 20, policyType: 'Executive Escalation' },
  { id: '4', category: 'Custom Integration Engineering', minGrossMargin: 50, maxDiscountAllowed: 15, policyType: 'Executive Escalation' },
];

interface DiscountRequest {
  id: string;
  ref: string;
  quoteRef: string;
  customer: string;
  amount: number;
  requestedDiscount: number;
  projectedMargin: number;
  requester: string;
  justification: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const DEFAULT_REQUESTS: DiscountRequest[] = [
  {
    id: 'disc-1',
    ref: 'DISC-2026-001',
    quoteRef: 'QTE-2026-081',
    customer: 'Apex Global Logistics',
    amount: 148500,
    requestedDiscount: 22,
    projectedMargin: 52,
    requester: 'Marcus Vance',
    justification: '3-year enterprise commit with upfront payment in full against competing vendor proposal.',
    status: 'Pending',
  },
  {
    id: 'disc-2',
    ref: 'DISC-2026-002',
    quoteRef: 'QTE-2026-088',
    customer: 'Fujikura Optical Technologies Inc',
    amount: 75000,
    requestedDiscount: 15,
    projectedMargin: 58,
    requester: 'Arjun Mehta',
    justification: 'Volume hardware pack replenishment for Latin America regional hub.',
    status: 'Pending',
  },
  {
    id: 'disc-3',
    ref: 'DISC-2026-003',
    quoteRef: 'QTE-2026-074',
    customer: 'Vertex Global Solutions',
    amount: 120000,
    requestedDiscount: 12,
    projectedMargin: 64,
    requester: 'Sarah Reid',
    justification: 'Multi-seat cloud platform licensing for 250 enterprise operators.',
    status: 'Approved',
  },
];

export function DiscountManagementView() {
  const { addEvent, addAudit } = useCRM();
  const [requests, setRequests] = useState<DiscountRequest[]>(DEFAULT_REQUESTS);
  const [tiers] = useState<AuthorityTier[]>(DEFAULT_TIERS);
  const [marginRules] = useState<MarginFloorRule[]>(DEFAULT_MARGIN_RULES);
  const [toast, setToast] = useState<string>('');
  const [isRuleDrawerOpen, setIsRuleDrawerOpen] = useState<boolean>(false);
  const [newRuleCategory, setNewRuleCategory] = useState<string>('');
  const [newRuleMinMargin, setNewRuleMinMargin] = useState<number>(50);
  const [newRuleMaxDiscount, setNewRuleMaxDiscount] = useState<number>(20);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const handleApprove = (req: DiscountRequest) => {
    setRequests(prev =>
      prev.map(r => (r.id === req.id ? { ...r, status: 'Approved' } : r))
    );
    addEvent('discount.approved', { ref: req.ref }, `Approved ${req.requestedDiscount}% discount for ${req.customer}`);
    addAudit('Commercial Discount Approved', 'Arjun Mehta', `${req.ref}: ${req.requestedDiscount}% on ${req.quoteRef}`);
    notify(`Approved discount ${req.ref} for ${req.customer}`);
  };

  const handleReject = (req: DiscountRequest) => {
    setRequests(prev =>
      prev.map(r => (r.id === req.id ? { ...r, status: 'Rejected' } : r))
    );
    addEvent('discount.rejected', { ref: req.ref }, `Rejected discount request for ${req.customer}`);
    addAudit('Commercial Discount Declined', 'Arjun Mehta', `${req.ref} declined for ${req.customer}`);
    notify(`Rejected discount request ${req.ref}`);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleCategory.trim()) {
      notify('Please enter a product category.');
      return;
    }
    marginRules.push({
      id: String(Date.now()),
      category: newRuleCategory.trim(),
      minGrossMargin: Number(newRuleMinMargin),
      maxDiscountAllowed: Number(newRuleMaxDiscount),
      policyType: 'Hard Block',
    });
    notify(`Added commercial margin rule for "${newRuleCategory}"`);
    setIsRuleDrawerOpen(false);
    setNewRuleCategory('');
  };

  return (
    <div className="workspace-page space-y-4">
      {/* Page Heading */}
      <SectionHeading
        eyebrow="QUOTES & CPQ / PRICING GOVERNANCE"
        title="Commercial Discount Management & Margin Floor Governance"
        subtitle="Enforce discount delegation authority matrices, gross margin floors, product-line rules, and exception approval workflows."
        action={
          <button
            onClick={() => setIsRuleDrawerOpen(true)}
            className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Plus size={14} />
            <span>Add Margin Floor Rule</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Pending Discount Requests</span>
          <strong className="text-xl font-bold text-amber-600 font-manrope block mt-1">
            {requests.filter(r => r.status === 'Pending').length} Pending Review
          </strong>
          <small className="text-xs text-slate-400 block mt-1">Requires authority sign-off</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Value at Exception</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {money(requests.reduce((s, r) => s + r.amount, 0))}
          </strong>
          <small className="text-xs text-blue-700 font-semibold block mt-1">Across 3 commercial quotes</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Avg Approved Discount</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            14.2%
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">Well within 18% target ceiling</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Margin Floor Compliance</span>
          <strong className="text-xl font-bold text-emerald-600 font-manrope block mt-1">
            99.4%
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">Enforced by CPQ engine</small>
        </div>
      </div>

      {/* Discount Delegation Authority Matrix */}
      <div className="panel p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>Commercial Discount Delegation Authority Matrix</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Commercial delegations defining maximum discount percentages authorized by organizational role.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between"
            >
              <div>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mb-2 ${tier.badgeColor}`}>
                  Tier {idx + 1} Authority
                </span>
                <strong className="text-xs font-bold text-slate-900 block mb-1">
                  {tier.role}
                </strong>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-2xl font-extrabold text-blue-600 font-manrope">
                    ≤ {tier.maxDiscount}%
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">Max Concession</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 text-[10px] space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Margin Floor:</span>
                  <strong className="text-slate-800">{tier.marginFloor}</strong>
                </div>
                <div className="text-slate-500 italic">
                  {tier.authorization}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Discount Exceptions Queue */}
      <section className="panel p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 font-manrope">
              Active Commercial Discount Exception Requests
            </h2>
            <p className="text-xs text-slate-500">
              Review deal discount requests exceeding standard representative thresholds.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="crm-table w-full">
            <thead>
              <tr>
                <th>REQUEST REF</th>
                <th>QUOTE & CUSTOMER</th>
                <th>QUOTE VALUE</th>
                <th>REQUESTED DISCOUNT</th>
                <th>MARGIN IMPACT</th>
                <th>JUSTIFICATION</th>
                <th>STATUS</th>
                <th>GOVERNANCE ACTION</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <span className="ref-link font-mono text-xs">{req.ref}</span>
                  </td>
                  <td>
                    <strong className="text-xs text-slate-800 block">{req.customer}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">{req.quoteRef} · By {req.requester}</span>
                  </td>
                  <td>
                    <strong className="text-xs text-slate-900 font-manrope">{money(req.amount)}</strong>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 font-bold text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <Percent size={11} />
                      {req.requestedDiscount}%
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-slate-700">
                      {req.projectedMargin}% Gross
                    </span>
                  </td>
                  <td>
                    <span className="text-[11px] text-slate-600 line-clamp-2 max-w-xs">
                      {req.justification}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        req.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : req.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {req.status === 'Pending' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(req)}
                          className="btn primary text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                        >
                          <Check size={11} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          className="btn secondary text-[11px] py-1 px-2 text-rose-600 hover:bg-rose-50 border-rose-200 flex items-center gap-1"
                        >
                          <X size={11} /> Decline
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Margin Floor Rules Table */}
      <section className="panel p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 font-manrope">
              Product Category Margin Floors & Guardrail Policies
            </h2>
            <p className="text-xs text-slate-500">
              System-enforced pricing thresholds preventing non-profitable quote issuance.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="crm-table w-full">
            <thead>
              <tr>
                <th>PRODUCT FAMILY / CATEGORY</th>
                <th>MINIMUM GROSS MARGIN FLOOR</th>
                <th>MAX ALLOWABLE DISCOUNT</th>
                <th>ENFORCEMENT POLICY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {marginRules.map(rule => (
                <tr key={rule.id}>
                  <td>
                    <strong className="text-xs text-slate-800">{rule.category}</strong>
                  </td>
                  <td>
                    <strong className="text-xs text-emerald-700">{rule.minGrossMargin}% Gross Margin</strong>
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-slate-700">≤ {rule.maxDiscountAllowed}%</span>
                  </td>
                  <td>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {rule.policyType}
                    </span>
                  </td>
                  <td>
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Active in CPQ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Margin Floor Rule Drawer */}
      {isRuleDrawerOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setIsRuleDrawerOpen(false)}>
          <div className="form-modal">
            <div className="form-modal-head">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  PRICING GOVERNANCE
                </span>
                <h2 className="text-base font-bold text-slate-800">Add Margin Floor Rule</h2>
                <p className="text-xs text-slate-500">
                  Define gross margin baseline guardrails for product or service categories.
                </p>
              </div>
              <button
                type="button"
                className="icon-close"
                onClick={() => setIsRuleDrawerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="flex flex-col flex-1 overflow-hidden">
              <div className="form-modal-body space-y-4">
                <div className="form-grid">
                  <label className="wide">
                    <span>Product Family or Category Name *</span>
                    <input
                      type="text"
                      placeholder="e.g. Optical Transceivers & Fiber Hardware"
                      value={newRuleCategory}
                      onChange={e => setNewRuleCategory(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    <span>Minimum Gross Margin Floor (%) *</span>
                    <input
                      type="number"
                      min="10"
                      max="95"
                      value={newRuleMinMargin}
                      onChange={e => setNewRuleMinMargin(Number(e.target.value))}
                      required
                    />
                  </label>

                  <label>
                    <span>Maximum Allowable Concession (%) *</span>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={newRuleMaxDiscount}
                      onChange={e => setNewRuleMaxDiscount(Number(e.target.value))}
                      required
                    />
                  </label>

                  <label className="wide">
                    <span>Enforcement Action</span>
                    <select>
                      <option value="hard">Hard Block (Quote cannot be issued below floor)</option>
                      <option value="executive">Executive Escalation (Requires VP / CFO sign-off)</option>
                      <option value="warning">Soft Warning (Notify Sales Ops)</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="form-modal-footer">
                <button
                  type="button"
                  className="btn secondary text-xs"
                  onClick={() => setIsRuleDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary text-xs">
                  Save Margin Guardrail Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="inline-toast">
          <CheckCircle2 size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
