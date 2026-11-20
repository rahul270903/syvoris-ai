import { useState } from 'react';
import {
  Workflow, ArrowRight, UserCheck, Users, CheckCircle2,
  AlertCircle, Plus, Edit2, Trash2, ArrowUp, ArrowDown,
  Sparkles, Check, X, Shield, RefreshCw, Layers, Compass
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface AssignmentRule {
  id: string;
  name: string;
  entity: 'leads' | 'cases';
  order: number;
  conditionDescription: string;
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'greater_than';
  value: string;
  assignedTo: string;
  assigneeType: 'User' | 'Team Queue' | 'Round-Robin Pool';
  active: boolean;
  executionsCount: number;
}

const INITIAL_RULES: AssignmentRule[] = [
  // LEAD RULES ("The Lead Dealer")
  {
    id: 'rule-lead-1',
    name: 'California & West Coast Regional Routing',
    entity: 'leads',
    order: 1,
    conditionDescription: 'State IN ("CA", "WA", "OR")',
    field: 'state',
    operator: 'in',
    value: 'CA, WA, OR',
    assignedTo: 'Mike Ross (West Territory AE)',
    assigneeType: 'User',
    active: true,
    executionsCount: 52
  },
  {
    id: 'rule-lead-2',
    name: 'New York & East Coast Strategic Enterprise',
    entity: 'leads',
    order: 2,
    conditionDescription: 'State IN ("NY", "NJ", "MA") AND Annual Revenue > $5M',
    field: 'state',
    operator: 'in',
    value: 'NY, NJ, MA',
    assignedTo: 'Sarah Jenkins (VP Commercials)',
    assigneeType: 'User',
    active: true,
    executionsCount: 38
  },
  {
    id: 'rule-lead-3',
    name: 'Caribbean Telecom & Carrier Accounts',
    entity: 'leads',
    order: 3,
    conditionDescription: 'Country IN ("Jamaica", "Trinidad", "Barbados", "Bahamas")',
    field: 'country',
    operator: 'in',
    value: 'Jamaica, Trinidad, Barbados, Bahamas',
    assignedTo: 'Arjun Mehta (Tenant Owner)',
    assigneeType: 'User',
    active: true,
    executionsCount: 64
  },
  {
    id: 'rule-lead-4',
    name: 'Inbound Web & SMB General Distribution',
    entity: 'leads',
    order: 4,
    conditionDescription: 'Fallback for all remaining unassigned inbound leads',
    field: 'lead_source',
    operator: 'equals',
    value: 'Website Inbound',
    assignedTo: 'Inbound SDR Pool (Maya Lin / Liam Brody)',
    assigneeType: 'Round-Robin Pool',
    active: true,
    executionsCount: 110
  },

  // CASE RULES ("The Ticket Sorter")
  {
    id: 'rule-case-1',
    name: 'Billing, Invoicing & Tax Dispute Sorter',
    entity: 'cases',
    order: 1,
    conditionDescription: 'Category = "Billing" OR Subject contains "Invoice / VAT"',
    field: 'category',
    operator: 'equals',
    value: 'Billing',
    assignedTo: 'Commercial Compliance & Billing Queue',
    assigneeType: 'Team Queue',
    active: true,
    executionsCount: 44
  },
  {
    id: 'rule-case-2',
    name: 'SAML SSO & Identity Access Escalation',
    entity: 'cases',
    order: 2,
    conditionDescription: 'Category = "Security" OR Subject contains "Login / SAML / MFA"',
    field: 'category',
    operator: 'equals',
    value: 'Security',
    assignedTo: 'IT Security & IAM Team',
    assigneeType: 'Team Queue',
    active: true,
    executionsCount: 29
  },
  {
    id: 'rule-case-3',
    name: 'Fiber Infrastructure & OTDR Outages',
    entity: 'cases',
    order: 3,
    conditionDescription: 'Category = "Hardware" OR Subject contains "Fiber / Splicing"',
    field: 'category',
    operator: 'equals',
    value: 'Hardware',
    assignedTo: 'Field Engineering & Splicing Queue',
    assigneeType: 'Team Queue',
    active: true,
    executionsCount: 31
  },
  {
    id: 'rule-case-4',
    name: 'Critical P1 VIP Customer Escalation',
    entity: 'cases',
    order: 4,
    conditionDescription: 'Priority = "Critical" AND SLA = "Platinum VIP"',
    field: 'priority',
    operator: 'equals',
    value: 'Critical',
    assignedTo: 'Elena Rostova (Support Manager)',
    assigneeType: 'User',
    active: true,
    executionsCount: 18
  }
];

export function AssignmentRulesView() {
  const { addAudit } = useCRM();
  const [activeTab, setActiveTab] = useState<'leads' | 'cases'>('leads');
  const [rules, setRules] = useState<AssignmentRule[]>(INITIAL_RULES);
  const [toast, setToast] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Rule Form
  const [ruleName, setRuleName] = useState('');
  const [conditionDesc, setConditionDesc] = useState('');
  const [targetField, setTargetField] = useState('state');
  const [targetVal, setTargetVal] = useState('CA');
  const [assignedTo, setAssignedTo] = useState('Mike Ross (West Territory AE)');
  const [assigneeType, setAssigneeType] = useState<'User' | 'Team Queue' | 'Round-Robin Pool'>('User');

  // Simulator
  const [simLeadState, setSimLeadState] = useState('CA');
  const [simLeadCountry, setSimLeadCountry] = useState('United States');
  const [simCaseCategory, setSimCaseCategory] = useState('Billing');
  const [simResult, setSimResult] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const currentRules = rules
    .filter(r => r.entity === activeTab)
    .sort((a, b) => a.order - b.order);

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, active: !r.active } : r));
    notify('Rule status updated.');
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const list = [...currentRules];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    list.forEach((r, idx) => { r.order = idx + 1; });

    setRules(prev => [
      ...prev.filter(r => r.entity !== activeTab),
      ...list
    ]);
    notify('Rule evaluation priority updated.');
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    notify('Assignment rule deleted.');
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) return;

    const newRule: AssignmentRule = {
      id: `rule-${activeTab}-${Date.now().toString().slice(-4)}`,
      name: ruleName,
      entity: activeTab,
      order: currentRules.length + 1,
      conditionDescription: conditionDesc || `${targetField} = "${targetVal}"`,
      field: targetField,
      operator: 'equals',
      value: targetVal,
      assignedTo: assignedTo,
      assigneeType: assigneeType,
      active: true,
      executionsCount: 0
    };

    setRules(prev => [...prev, newRule]);
    setShowAddModal(false);
    setRuleName('');
    setConditionDesc('');
    notify(`Assignment rule "${newRule.name}" added to ${activeTab} engine.`);
    addAudit?.('Assignment Rules', `Created rule ${newRule.name} for ${activeTab}`, 'Workflow Engine');
  };

  const runSimulator = () => {
    if (activeTab === 'leads') {
      if (['CA', 'WA', 'OR'].includes(simLeadState.toUpperCase())) {
        setSimResult(`Matched Rule #1: "California & West Coast Regional Routing" ➔ Assigned to: Mike Ross (West Territory AE)`);
      } else if (['NY', 'NJ', 'MA'].includes(simLeadState.toUpperCase())) {
        setSimResult(`Matched Rule #2: "New York & East Coast Strategic Enterprise" ➔ Assigned to: Sarah Jenkins (VP Commercials)`);
      } else if (['JAMAICA', 'TRINIDAD', 'BAHAMAS', 'BARBADOS'].includes(simLeadCountry.toUpperCase())) {
        setSimResult(`Matched Rule #3: "Caribbean Telecom & Carrier Accounts" ➔ Assigned to: Arjun Mehta (Tenant Owner)`);
      } else {
        setSimResult(`Matched Rule #4: "Inbound Web & SMB General Distribution" ➔ Assigned via Round-Robin Pool to: Maya Lin / Liam Brody`);
      }
    } else {
      if (simCaseCategory.toLowerCase().includes('bill')) {
        setSimResult(`Matched Rule #1: "Billing, Invoicing & Tax Dispute Sorter" ➔ Dispatched to Queue: Commercial Compliance & Billing Queue`);
      } else if (simCaseCategory.toLowerCase().includes('sec') || simCaseCategory.toLowerCase().includes('saml') || simCaseCategory.toLowerCase().includes('login')) {
        setSimResult(`Matched Rule #2: "SAML SSO & Identity Access Escalation" ➔ Dispatched to Queue: IT Security & IAM Team`);
      } else if (simCaseCategory.toLowerCase().includes('hard') || simCaseCategory.toLowerCase().includes('fiber')) {
        setSimResult(`Matched Rule #3: "Fiber Infrastructure & OTDR Outages" ➔ Dispatched to Queue: Field Engineering & Splicing Queue`);
      } else {
        setSimResult(`Matched Rule #4: "Critical P1 VIP Customer Escalation" ➔ Dispatched to Lead: Elena Rostova (Support Manager)`);
      }
    }
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
        eyebrow="ADMINISTRATION / ASSIGNMENT RULES"
        title="Assignment & Territory Routing Rules"
        subtitle='Configure automated lead dealer logic ("California to Mike, New York to Sarah") and support case ticket sorting ("Billing to Finance, Login to IT").'
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create {activeTab === 'leads' ? 'Lead' : 'Case'} Rule</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Configured Rules</span>
            <Workflow className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{rules.length} Rules</div>
          <div className="text-[11px] text-slate-500 mt-1">Dual-engine evaluation</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Leads Routed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">264 Leads</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Territory rules matched</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Cases Dispatched</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">122 Tickets</div>
          <div className="text-[11px] text-slate-500 mt-1">Direct to specialized queues</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Evaluation Latency</span>
            <Compass className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">&lt; 15 ms</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Real-time event trigger</div>
        </div>
      </div>

      {/* Tabs Switcher: Leads ("Lead Dealer") vs Cases ("Ticket Sorter") */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => { setActiveTab('leads'); setSimResult(null); }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'leads'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Lead Assignment Rules ("The Lead Dealer")</span>
        </button>

        <button
          onClick={() => { setActiveTab('cases'); setSimResult(null); }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'cases'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Support Ticket Assignment ("The Ticket Sorter")</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              {activeTab === 'leads' ? 'Inbound Lead Distribution Hierarchy' : 'Support Ticket Queuing Rules'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rules execute in strict numerical priority. The first matching rule immediately assigns the record.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">Pri</th>
                <th className="py-3 px-4">Rule Title</th>
                <th className="py-3 px-4">Matching Filter Criteria</th>
                <th className="py-3 px-4">Target Assignee</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-center">Executions</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {currentRules.map((rule, idx) => (
                <tr key={rule.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-cyan-400">
                    #{rule.order}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-white">
                    {rule.name}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {rule.conditionDescription}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      {rule.assignedTo}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-mono">
                      {rule.assigneeType}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center text-slate-300 font-mono">
                    {rule.executionsCount}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                        rule.active
                          ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}
                    >
                      {rule.active ? 'Active' : 'Paused'}
                    </button>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveOrder(idx, 'up')}
                        className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded border border-slate-700"
                        title="Increase Priority"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={idx === currentRules.length - 1}
                        onClick={() => handleMoveOrder(idx, 'down')}
                        className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded border border-slate-700"
                        title="Decrease Priority"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded border border-slate-700"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Rule Simulator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Interactive Assignment Engine Tester</span>
        </div>
        <p className="text-xs text-slate-400">
          Simulate an inbound {activeTab === 'leads' ? 'Lead record' : 'Support Case'} to verify which rule matches and who receives assignment.
        </p>

        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-4">
          {activeTab === 'leads' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lead State Code</label>
                <input
                  type="text"
                  placeholder="e.g. CA, NY, or FL"
                  value={simLeadState}
                  onChange={e => setSimLeadState(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lead Country</label>
                <input
                  type="text"
                  placeholder="e.g. United States or Jamaica"
                  value={simLeadCountry}
                  onChange={e => setSimLeadCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Case Category / Topic</label>
              <select
                value={simCaseCategory}
                onChange={e => setSimCaseCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Billing">Billing & Invoice Dispute</option>
                <option value="Security">SAML SSO Login Error</option>
                <option value="Hardware">Fiber Patch Port Outage</option>
                <option value="Critical VIP">Urgent Carrier Outage (P1 VIP)</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={runSimulator}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Evaluate Routing Engine</span>
            </button>

            {simResult && (
              <div className="text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
                {simResult}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE RULE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Create New {activeTab === 'leads' ? 'Lead Routing' : 'Case Sorter'} Rule</span>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Rule Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Florida & Southeast Territory"
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Filter Criteria Description</label>
                <input
                  type="text"
                  placeholder='e.g. State IN ("FL", "GA", "NC")'
                  value={conditionDesc}
                  onChange={e => setConditionDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Target Field</label>
                  <select
                    value={targetField}
                    onChange={e => setTargetField(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="state">State Code</option>
                    <option value="country">Country</option>
                    <option value="category">Category</option>
                    <option value="annual_revenue">Annual Revenue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Match Value</label>
                  <input
                    type="text"
                    value={targetVal}
                    onChange={e => setTargetVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Assigned Representative / Queue</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins or Tier-2 Technical Queue"
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Assignment Mechanism</label>
                <select
                  value={assigneeType}
                  onChange={e => setAssigneeType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="User">Direct User Assignment</option>
                  <option value="Team Queue">Team Shared Queue</option>
                  <option value="Round-Robin Pool">Round-Robin Pool</option>
                </select>
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
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
