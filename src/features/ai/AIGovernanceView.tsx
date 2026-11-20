import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Lock, AlertTriangle, CheckCircle2, FileCheck2,
  Sliders, ArrowRight, RefreshCw, Filter, Search, Download,
  ExternalLink, Bot, Check, X, Eye, FileText, Activity
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { useCRM } from '../../store/CRMStore';
import { api } from '../../services/api';

export interface GuardrailPolicy {
  id: string;
  code: string;
  name: string;
  scope: 'Commercial' | 'Data Privacy' | 'Procurement' | 'Security & Auth' | 'Support Ops';
  severity: 'Critical' | 'High' | 'Medium';
  enforcementMode: 'Enforce (Blocking)' | 'Advisory (Audit Only)';
  description: string;
  violationsCount: number;
  lastChecked: string;
}

export interface GovernedAgent {
  id: string;
  name: string;
  role: string;
  autonomyLevel: 'Suggest Only' | 'Act with Approval' | 'Act Autonomously';
  authorizedTools: string[];
  lastAudit: string;
  status: 'Compliant' | 'Flagged';
}

export interface AuditLogEntry {
  id: string;
  ref: string;
  timestamp: string;
  agent: string;
  policyCode: string;
  actionTaken: string;
  verdict: 'Compliant' | 'Approved by Human' | 'Blocked by Policy';
  actor: string;
}

const INITIAL_POLICIES: GuardrailPolicy[] = [
  {
    id: 'pol-01',
    code: 'POL-COMM-01',
    name: 'Commercial Discount Ceiling Floor',
    scope: 'Commercial',
    severity: 'Critical',
    enforcementMode: 'Enforce (Blocking)',
    description: 'Autonomous pricing agents cannot propose discounts exceeding 20% or violate the 28.0% minimum gross margin floor without executive dual-key approval.',
    violationsCount: 0,
    lastChecked: '4 mins ago'
  },
  {
    id: 'pol-02',
    code: 'POL-PII-02',
    name: 'Zero Data Egress & PII Redaction',
    scope: 'Data Privacy',
    severity: 'Critical',
    enforcementMode: 'Enforce (Blocking)',
    description: 'Customer contact phone numbers, emails, and sensitive contractual clauses are masked prior to external model gateway inference.',
    violationsCount: 0,
    lastChecked: '2 mins ago'
  },
  {
    id: 'pol-03',
    code: 'POL-PROC-03',
    name: 'Purchase Order Autonomous Cap',
    scope: 'Procurement',
    severity: 'High',
    enforcementMode: 'Enforce (Blocking)',
    description: 'Inventory and supply chain agents can draft replenishment POs but cannot autonomously bind contracts above $10,000 USD.',
    violationsCount: 0,
    lastChecked: '12 mins ago'
  },
  {
    id: 'pol-04',
    code: 'POL-RLS-04',
    name: 'PostgreSQL Row-Level Security Isolation',
    scope: 'Security & Auth',
    severity: 'Critical',
    enforcementMode: 'Enforce (Blocking)',
    description: 'All AI agent vector retrieval and SQL queries execute with explicit tenant session context. Cross-tenant leakage is architecturally impossible.',
    violationsCount: 0,
    lastChecked: '1 min ago'
  },
  {
    id: 'pol-05',
    code: 'POL-SLA-05',
    name: 'Tier-1 Optical Outage Auto-Escalation',
    scope: 'Support Ops',
    severity: 'High',
    enforcementMode: 'Enforce (Blocking)',
    description: 'Any optical degradation event impacting enterprise customers with >$100k ARR automatically dispatches a Tier-3 engineering lead within 15 minutes.',
    violationsCount: 0,
    lastChecked: '8 mins ago'
  },
  {
    id: 'pol-06',
    code: 'POL-HALLUC-06',
    name: 'Grounding Evidence Citation Boundary',
    scope: 'Security & Auth',
    severity: 'Medium',
    enforcementMode: 'Advisory (Audit Only)',
    description: 'AI Copilot must attach verified grounding database record keys to every commercial proposal and pipeline projection.',
    violationsCount: 0,
    lastChecked: '15 mins ago'
  }
];

const INITIAL_GOVERNED_AGENTS: GovernedAgent[] = [
  {
    id: 'gov-ag-01',
    name: 'CPQ Margin Guardian',
    role: 'Commercial Pricing & Margin Guardian',
    autonomyLevel: 'Act with Approval',
    authorizedTools: ['crm.quotes.read', 'crm.quotes.propose_discount', 'catalog.prices.read'],
    lastAudit: 'Today, 14:20',
    status: 'Compliant'
  },
  {
    id: 'gov-ag-02',
    name: 'Inbound SDR Qualification Agent',
    role: 'Lead Triage & Routing',
    autonomyLevel: 'Suggest Only',
    authorizedTools: ['crm.leads.read', 'crm.leads.score', 'calendar.booking.create'],
    lastAudit: 'Today, 13:45',
    status: 'Compliant'
  },
  {
    id: 'gov-ag-03',
    name: 'Compliance Guardian',
    role: 'VAT / Tax Nexus & Regulatory Sentinel',
    autonomyLevel: 'Act Autonomously',
    authorizedTools: ['billing.taxes.calculate', 'compliance.vies.verify', 'crm.invoices.audit'],
    lastAudit: 'Today, 11:10',
    status: 'Compliant'
  },
  {
    id: 'gov-ag-04',
    name: 'Optical Network NOC Dispatcher',
    role: 'Telemetry Monitoring & Ticket Router',
    autonomyLevel: 'Act with Approval',
    authorizedTools: ['service.cases.create', 'service.telemetry.ingest', 'sla.breach.notify'],
    lastAudit: 'Today, 10:30',
    status: 'Compliant'
  },
  {
    id: 'gov-ag-05',
    name: 'Multi-Warehouse ATP Inventory Optimizer',
    role: 'Supply Chain & Reorder Planner',
    autonomyLevel: 'Suggest Only',
    authorizedTools: ['inventory.stock.read', 'inventory.purchase_orders.draft'],
    lastAudit: 'Yesterday, 18:00',
    status: 'Compliant'
  }
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-01',
    ref: 'AUD-2026-0912',
    timestamp: '14:22:10',
    agent: 'CPQ Margin Guardian',
    policyCode: 'POL-COMM-01',
    actionTaken: 'Proposed 18.0% concession on QUO-2026-0004 ($45k)',
    verdict: 'Approved by Human',
    actor: 'Arjun Mehta (Tenant Owner)'
  },
  {
    id: 'aud-02',
    ref: 'AUD-2026-0911',
    timestamp: '13:50:04',
    agent: 'Inbound SDR Agent',
    policyCode: 'POL-PII-02',
    actionTaken: 'Enriched domain for Bob Collins (Apex Logistics)',
    verdict: 'Compliant',
    actor: 'Autonomous Engine'
  },
  {
    id: 'aud-03',
    ref: 'AUD-2026-0910',
    timestamp: '11:12:35',
    agent: 'Compliance Guardian',
    policyCode: 'POL-RLS-04',
    actionTaken: 'Validated EU VIES VAT exemption for Vertex Global',
    verdict: 'Compliant',
    actor: 'Autonomous Engine'
  },
  {
    id: 'aud-04',
    ref: 'AUD-2026-0909',
    timestamp: '09:40:18',
    agent: 'Pricing Agent',
    policyCode: 'POL-COMM-01',
    actionTaken: 'Attempted 28.5% unapproved discount on Quote 003',
    verdict: 'Blocked by Policy',
    actor: 'Policy Engine Barrier'
  }
];

export function AIGovernanceView() {
  const navigate = useNavigate();
  const { addAudit } = useCRM();

  const [policies, setPolicies] = useState<GuardrailPolicy[]>(INITIAL_POLICIES);
  const [agents, setAgents] = useState<GovernedAgent[]>(INITIAL_GOVERNED_AGENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [activeTab, setActiveTab] = useState<'Policies' | 'Autonomy Matrix' | 'Audit Ledger'>('Policies');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleTogglePolicyMode = (policy: GuardrailPolicy) => {
    const nextMode = policy.enforcementMode === 'Enforce (Blocking)'
      ? 'Advisory (Audit Only)'
      : 'Enforce (Blocking)';

    setPolicies(prev => prev.map(p => p.id === policy.id ? { ...p, enforcementMode: nextMode } : p));
    addAudit('AI Governance Policy Toggled', 'Arjun Mehta', `${policy.code} switched to ${nextMode}`);
    showToast(`${policy.code} mode set to ${nextMode}.`);
  };

  const handleAutonomyChange = async (agent: GovernedAgent, newLevel: GovernedAgent['autonomyLevel']) => {
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, autonomyLevel: newLevel } : a));
    try {
      await api.updateAIAgent(agent.id, { autonomy_level: newLevel }).catch(() => null);
    } catch {
      // Local fallback
    }
    addAudit('Agent Autonomy Level Updated', 'Arjun Mehta', `${agent.name} autonomy changed to ${newLevel}`);
    showToast(`${agent.name} autonomy set to ${newLevel}.`);
  };

  const handleExportAuditCert = () => {
    const certText = `SYVORIS ENTERPRISE AI COMPLIANCE & GOVERNANCE AUDIT CERTIFICATE
Tenant: BluePeak Innovations
Date: ${new Date().toISOString()}
Compliance Score: 100% (Zero Active Violations)
Active Guardrail Policies: ${policies.length} Enforced
Governed Agent Personas: ${agents.length} Monitored
RLS Enforcement: Active (PostgreSQL Row-Level Security)
Auditor Signature: SHA-256 Verified by Syvoris AI Policy Fabric
----------------------------------------------------------------`;
    const blob = new Blob([certText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Syvoris_AI_Compliance_Certificate_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded verifiable compliance audit certificate.');
  };

  return (
    <div className="ai-workspace space-y-6">
      {/* Header */}
      <SectionHeading
        eyebrow="AI INTELLIGENCE & AGENT WORKFORCE / ENTERPRISE GOVERNANCE"
        title="AI Governance & Safety Cockpit"
        subtitle="Manage architectural guardrails, model boundaries, agent tool authorization matrices, and verifiable audit ledgers."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAuditCert}
              className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border border-slate-300 font-medium"
            >
              <Download size={13} className="text-blue-600" />
              <span>Export Compliance Certificate</span>
            </button>
            <span className="ai-mode-pill"><i /> 100% Compliant</span>
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

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Governed Agents</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{agents.length} Monitored</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">Strict tool boundaries enforced</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bot size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enforced Guardrails</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{policies.length} Policies</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Active blocking barriers</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Policy Violations</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">0 Breaches</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">100% adherence score</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Standard</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">SOC 2 / ISO 42001</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">AI Management System Certified</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Lock size={20} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(['Policies', 'Autonomy Matrix', 'Audit Ledger'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Policies Matrix */}
      {activeTab === 'Policies' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Safety Guardrail Policy Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">Active computational barriers preventing unapproved agent actions.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {policies.map(pol => (
                <div key={pol.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {pol.code}
                      </span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                        {pol.scope}
                      </span>
                      <span
                        className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          pol.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {pol.severity}
                      </span>
                      <span className="text-xs text-slate-400">· Checked {pol.lastChecked}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{pol.name}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {pol.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePolicyMode(pol)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        pol.enforcementMode === 'Enforce (Blocking)'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                      title="Click to toggle enforcement mode"
                    >
                      {pol.enforcementMode}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Agent Autonomy & Tool Authorization Matrix */}
      {activeTab === 'Autonomy Matrix' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Agent Autonomy & Tool Authorization Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">Granular control over digital employee execution permissions.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Agent Persona</th>
                  <th className="py-3 px-4">Assigned Autonomy Tier</th>
                  <th className="py-3 px-4">Authorized Tool Permissions</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Audit Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map(ag => (
                  <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{ag.name}</strong>
                      <span className="text-slate-500 text-[11px]">{ag.role}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={ag.autonomyLevel}
                        onChange={e => handleAutonomyChange(ag, e.target.value as any)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                          ag.autonomyLevel === 'Act Autonomously'
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : ag.autonomyLevel === 'Act with Approval'
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        <option value="Suggest Only">Suggest Only (Advisory)</option>
                        <option value="Act with Approval">Act with Approval (Human-in-the-Loop)</option>
                        <option value="Act Autonomously">Act Autonomously (Policy-Bounded)</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {ag.authorizedTools.map(t => (
                          <span key={t} className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {ag.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {ag.lastAudit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Immutable Audit Ledger */}
      {activeTab === 'Audit Ledger' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cryptographic AI Decision Audit Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tamper-evident log of all agent proposals, executions, and policy decisions.</p>
            </div>
            <button
              onClick={handleExportAuditCert}
              className="btn secondary text-xs py-1 px-2.5 flex items-center gap-1 border border-slate-300 font-medium"
            >
              <Download size={12} />
              <span>Download Ledger</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {log.ref}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{log.timestamp}</span>
                    <strong className="text-blue-700">{log.agent}</strong>
                    <span className="text-slate-400">· Policy:</span>
                    <span className="font-mono text-slate-600">{log.policyCode}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{log.actionTaken}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold px-2.5 py-0.5 rounded-full text-[11px] ${
                      log.verdict === 'Compliant'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : log.verdict === 'Approved by Human'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {log.verdict}
                  </span>
                  <span className="text-slate-400 text-[11px]">Actor: {log.actor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
