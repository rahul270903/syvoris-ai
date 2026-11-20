import { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Sliders, DollarSign, Percent,
  CheckCircle2, AlertTriangle, Lock, Eye, Bot, Plus,
  Sparkles, Save, RefreshCw, X, Check, Activity
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface AgentPolicyRule {
  id: string;
  name: string;
  category: 'Commercial Negotiation' | 'Customer Support' | 'Data Protection' | 'System Integrity';
  autonomyLevel: 'Autonomous within Ceiling' | 'Human Approval Required' | 'Suggestion Only';
  limitMetric: string;
  escalationRole: string;
  active: boolean;
  blockedCount: number;
  description: string;
}

const INITIAL_POLICIES: AgentPolicyRule[] = [
  {
    id: 'pol-1',
    name: 'Autonomous Deal Negotiation Discount Ceiling',
    category: 'Commercial Negotiation',
    autonomyLevel: 'Autonomous within Ceiling',
    limitMetric: '15.0% Max Discount',
    escalationRole: 'VP Sales (Sarah Jenkins)',
    active: true,
    blockedCount: 8,
    description: 'Autonomous negotiation agents may offer tiered discounts up to 15%. Anything above 15% requires human executive approval.'
  },
  {
    id: 'pol-2',
    name: 'Customer Service Instant Refund & Credit Authority',
    category: 'Customer Support',
    autonomyLevel: 'Autonomous within Ceiling',
    limitMetric: '$1,000 USD Max Refund',
    escalationRole: 'Finance Administrator (Aisha Patel)',
    active: true,
    blockedCount: 3,
    description: 'Support agents may issue goodwill credits up to $1,000 for verified SLA breaches without supervisor override.'
  },
  {
    id: 'pol-3',
    name: 'Commercial Payment Terms Restriction',
    category: 'Commercial Negotiation',
    autonomyLevel: 'Human Approval Required',
    limitMetric: 'Net 30 Days Standard',
    escalationRole: 'Legal & Finance Department',
    active: true,
    blockedCount: 2,
    description: 'Prohibits autonomous agents from agreeing to Net 60 or Net 90 payment terms without bilateral legal addendum.'
  },
  {
    id: 'pol-4',
    name: 'AI Compliance Guardian Real-Time Interceptor',
    category: 'Data Protection',
    autonomyLevel: 'Autonomous within Ceiling',
    limitMetric: '100% Pre-Dispatch Scanning',
    escalationRole: 'Security & Compliance Officer',
    active: true,
    blockedCount: 14,
    description: 'Meta-agent scans all outbound agent messages for customer PII, unapproved marketing claims, or competitor disparagement.'
  },
  {
    id: 'pol-5',
    name: 'Proactive Churn Save-Play Authorization',
    category: 'Commercial Negotiation',
    autonomyLevel: 'Autonomous within Ceiling',
    limitMetric: 'Churn Risk >= 75%',
    escalationRole: 'Commercial Director',
    active: true,
    blockedCount: 1,
    description: 'Permits save-play agents to offer 1-month service credit when customer churn score exceeds critical risk threshold.'
  },
  {
    id: 'pol-6',
    name: 'Zero-Prompt Schema Alteration Guardrail',
    category: 'System Integrity',
    autonomyLevel: 'Human Approval Required',
    limitMetric: 'No Table Drops / RLS Bypasses',
    escalationRole: 'Super Administrator (Arjun Mehta)',
    active: true,
    blockedCount: 0,
    description: 'Autonomous CRM builders cannot delete production tables or modify row-level security policies without manual tenant owner password.'
  }
];

export function AgentPoliciesView() {
  const { addAudit } = useCRM();
  const [policies, setPolicies] = useState<AgentPolicyRule[]>(INITIAL_POLICIES);
  const [discountCeiling, setDiscountCeiling] = useState<number>(15);
  const [refundLimit, setRefundLimit] = useState<number>(1000);
  const [toast, setToast] = useState<string>('');
  const [simInterception, setSimInterception] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [policyName, setPolicyName] = useState('');
  const [policyCategory, setPolicyCategory] = useState<'Commercial Negotiation' | 'Customer Support' | 'Data Protection' | 'System Integrity'>('Commercial Negotiation');
  const [policyAutonomy, setPolicyAutonomy] = useState<'Autonomous within Ceiling' | 'Human Approval Required' | 'Suggestion Only'>('Autonomous within Ceiling');
  const [policyLimit, setPolicyLimit] = useState('10.0% Max Cap');
  const [policyEscalation, setPolicyEscalation] = useState('VP Commercials');
  const [policyDesc, setPolicyDesc] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleTogglePolicy = (id: string) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    notify('Policy guardrail status toggled.');
  };

  const handleSimulateViolation = () => {
    setSimInterception('Intercepted by AI Compliance Guardian: Autonomous agent proposed 25% discount to Cyberdyne Systems. Blocked exceeding 15% ceiling. Routed to VP Sales approval queue.');
    notify('Simulation executed: AI Compliance Guardian auto-blocked violation.');
    addAudit?.('AI Compliance Guardian', 'Auto-blocked proposed 25% discount violating policy pol-1', 'AI Governance');
  };

  const handleSaveGuardrails = () => {
    notify(`Guardrails committed: Max Discount at ${discountCeiling}%, Refund Authority at $${refundLimit}.`);
    addAudit?.('Agent Policies Updated', `Set discount ceiling to ${discountCeiling}% and refund limit to $${refundLimit}`, 'AI Governance');
  };

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName) return;

    const newPol: AgentPolicyRule = {
      id: `pol-${Date.now().toString().slice(-4)}`,
      name: policyName,
      category: policyCategory,
      autonomyLevel: policyAutonomy,
      limitMetric: policyLimit,
      escalationRole: policyEscalation,
      active: true,
      blockedCount: 0,
      description: policyDesc || 'Autonomous agent governance guardrail.'
    };

    setPolicies(prev => [...prev, newPol]);
    setShowAddModal(false);
    setPolicyName('');
    setPolicyDesc('');
    notify(`Guardrail policy "${newPol.name}" registered and enforced.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <SectionHeading
        eyebrow="ADMINISTRATION / AGENT POLICIES & GOVERNANCE"
        title="Agent Policies, Autonomy Ceilings & Guardrails"
        subtitle="Define commercial autonomy ceilings, maximum deal negotiation discount caps, customer refund authority, and the real-time AI Compliance Guardian interceptor."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateViolation}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Simulate Violation Intercept</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Policy Guardrail</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Enforced Guardrails</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{policies.length} Policies</div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-tier safety constraints</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Max Autonomous Discount</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{discountCeiling}% Cap</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Higher requires VP signoff</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Instant Refund Authority</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">${refundLimit.toLocaleString()} USD</div>
          <div className="text-[11px] text-slate-500 mt-1">Per SLA incident resolution</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Blocked Policy Violations</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">
            {policies.reduce((a, b) => a + b.blockedCount, 0)} Interceptions
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1">AI Compliance Guardian active</div>
        </div>
      </div>

      {/* Real-Time Parameter Sliders Cockpit */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Master Commercial Guardrail Controls</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live adjustment of the commercial thresholds enforced across all AI sales and support agents.
            </p>
          </div>

          <button
            onClick={handleSaveGuardrails}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Commit Guardrails</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Discount Slider */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Autonomous Negotiation Discount Ceiling:</span>
              <span className="text-cyan-400 font-mono font-bold text-base">{discountCeiling}% Max</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="1"
              value={discountCeiling}
              onChange={e => setDiscountCeiling(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (No Autonomous Discounting)</span>
              <span>15% (Enterprise Recommended)</span>
              <span>35% (High Autonomy Risk)</span>
            </div>
          </div>

          {/* Refund Slider */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Autonomous Refund & Credit Authority Limit:</span>
              <span className="text-emerald-400 font-mono font-bold text-base">${refundLimit.toLocaleString()} USD</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={refundLimit}
              onChange={e => setRefundLimit(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>$100 (Strict Manager Signoff)</span>
              <span>$1,000 (Standard Tier)</span>
              <span>$5,000 (VIP Operations)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Banner */}
      {simInterception && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 text-xs flex items-start justify-between gap-3 animate-fade-in text-amber-200">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300 font-semibold mb-0.5">COMPLIANCE GUARDIAN INTERCEPTION TRIGGERED</strong>
              <p className="leading-relaxed">{simInterception}</p>
            </div>
          </div>
          <button
            onClick={() => setSimInterception(null)}
            className="text-amber-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Policy Register Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Active Agent Policy & Compliance Register</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            All AI autonomous executions are validated against these rules prior to customer-facing dispatch.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Policy Name</th>
                <th className="py-3 px-3">Domain Category</th>
                <th className="py-3 px-3">Autonomy Level</th>
                <th className="py-3 px-3">Limit / Rule Ceiling</th>
                <th className="py-3 px-4">Escalation Signoff</th>
                <th className="py-3 px-3 text-center">Interceptions</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {policies.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{p.description}</div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-[10px] font-mono bg-slate-950 text-cyan-400 border border-slate-800 px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      p.autonomyLevel === 'Autonomous within Ceiling'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : p.autonomyLevel === 'Human Approval Required'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                        : 'bg-blue-950 text-blue-400 border border-blue-800/50'
                    }`}>
                      {p.autonomyLevel}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-white text-[11px]">
                    {p.limitMetric}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    {p.escalationRole}
                  </td>

                  <td className="py-3.5 px-3 text-center font-mono text-cyan-400 font-bold">
                    {p.blockedCount}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => handleTogglePolicy(p.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                        p.active
                          ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}
                    >
                      {p.active ? 'Enforced' : 'Paused'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE POLICY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Add Agent Policy Guardrail</span>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Policy Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Outbound Communication Brand Tone Audit"
                  value={policyName}
                  onChange={e => setPolicyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={policyCategory}
                    onChange={e => setPolicyCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Commercial Negotiation">Commercial Negotiation</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Data Protection">Data Protection</option>
                    <option value="System Integrity">System Integrity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Autonomy Level</label>
                  <select
                    value={policyAutonomy}
                    onChange={e => setPolicyAutonomy(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Autonomous within Ceiling">Autonomous within Ceiling</option>
                    <option value="Human Approval Required">Human Approval Required</option>
                    <option value="Suggestion Only">Suggestion Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Limit Metric</label>
                  <input
                    type="text"
                    value={policyLimit}
                    onChange={e => setPolicyLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Escalation Role</label>
                  <input
                    type="text"
                    value={policyEscalation}
                    onChange={e => setPolicyEscalation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Enforcement details and parameters..."
                  value={policyDesc}
                  onChange={e => setPolicyDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
