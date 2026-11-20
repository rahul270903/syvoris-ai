import { useState, useEffect } from 'react';
import {
  Play, Pause, Plus, Check, X,
  ShieldCheck, Zap, CheckCircle2,
  RefreshCw, FastForward, ArrowRight,
  Workflow, Layers, Sparkles, Filter
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, WorkflowItem } from '../../services/api';

interface AutomationRule {
  id: string;
  ref?: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  status: 'Active' | 'Paused';
  executionsThisWeek: number;
  lastRun: string;
  category: 'Sales' | 'CPQ' | 'Service' | 'Delivery' | 'Marketing';
}

const defaultRules: AutomationRule[] = [
  {
    id: 'wf-1',
    ref: 'WF-DEF-001',
    name: 'Strategic Lead Auto-Assignment',
    category: 'Sales',
    trigger: 'Event: lead.created',
    condition: 'Filter: Company revenue > $10M OR employee count > 250',
    action: 'Action: Route to Strategic Enterprise Queue & notify Territory Director',
    status: 'Active',
    executionsThisWeek: 48,
    lastRun: '15 mins ago',
  },
  {
    id: 'wf-2',
    ref: 'WF-DEF-002',
    name: 'Discount Governance & Approval Escalation',
    category: 'CPQ',
    trigger: 'Event: quote.submitted',
    condition: 'Filter: Line item discount > 15% OR margin < 40%',
    action: 'Action: Require VP Sales approval before client dispatch',
    status: 'Active',
    executionsThisWeek: 14,
    lastRun: '2 hours ago',
  },
  {
    id: 'wf-3',
    ref: 'WF-DEF-003',
    name: 'P1 Severity Case Instant Notification & Escalation',
    category: 'Service',
    trigger: 'Event: case.priority_changed',
    condition: 'Filter: priority == "Critical" AND account.tier == "Enterprise"',
    action: 'Action: Page On-Call Support Lead & start 15-min SLA Countdown',
    status: 'Active',
    executionsThisWeek: 6,
    lastRun: 'Yesterday',
  },
  {
    id: 'wf-4',
    ref: 'WF-DEF-004',
    name: 'Closed Won Handover to Project Delivery',
    category: 'Delivery',
    trigger: 'Event: deal.won',
    condition: 'Filter: contract_signed == true AND amount >= $25k',
    action: 'Action: Auto-provision Project Workspace, Milestones & assign Field Lead',
    status: 'Active',
    executionsThisWeek: 3,
    lastRun: '3 days ago',
  },
  {
    id: 'wf-5',
    ref: 'WF-DEF-005',
    name: 'Commercial Invoicing & Stripe Reconcile on Fulfillment',
    category: 'CPQ',
    trigger: 'Event: order.fulfilled',
    condition: 'Filter: warehouse_pick_verified == true',
    action: 'Action: Generate Tax Invoice & trigger Stripe automated charge',
    status: 'Active',
    executionsThisWeek: 21,
    lastRun: '4 hours ago',
  }
];

export function WorkflowDesignerView() {
  const { addEvent, addAudit } = useCRM();
  const [rules, setRules] = useState<AutomationRule[]>(defaultRules);
  const [filter, setFilter] = useState<string>('All');
  const [activeView, setActiveView] = useState<'rules' | 'bpmn'>('rules');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toast, setToast] = useState('');

  const [newRule, setNewRule] = useState<{
    name: string;
    category: AutomationRule['category'];
    trigger: string;
    condition: string;
    action: string;
  }>({
    name: '',
    category: 'Sales',
    trigger: 'Event: lead.created',
    condition: 'Filter: score > 80',
    action: 'Action: Assign to SDR Team',
  });

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleToggleStatus = (id: string) => {
    setRules(prev =>
      prev.map(r => {
        if (r.id === id) {
          const nextStatus = r.status === 'Active' ? 'Paused' : 'Active';
          notify(`Workflow rule "${r.name}" is now ${nextStatus}.`);
          addAudit?.('Workflow Automation', `Toggled rule ${r.name} to ${nextStatus}`, 'Process Designer');
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const handleSimulateExecution = (rule: AutomationRule) => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setRules(prev =>
        prev.map(r =>
          r.id === rule.id
            ? { ...r, executionsThisWeek: r.executionsThisWeek + 1, lastRun: 'Just now' }
            : r
        )
      );
      addEvent('workflow.triggered', { ref: rule.ref || rule.id }, `Executed rule: ${rule.name}`);
      notify(`Simulated event matched! Executed rule: "${rule.name}". Action completed.`);
    }, 600);
  };

  const handleCreateRule = () => {
    if (!newRule.name.trim()) return;

    const created: AutomationRule = {
      id: `wf-${Date.now()}`,
      ref: `WF-DEF-${String(rules.length + 1).padStart(3, '0')}`,
      name: newRule.name.trim(),
      category: newRule.category,
      trigger: newRule.trigger,
      condition: newRule.condition,
      action: newRule.action,
      status: 'Active',
      executionsThisWeek: 0,
      lastRun: 'Never',
    };

    setRules(prev => [created, ...prev]);
    setShowAddModal(false);
    setNewRule({
      name: '',
      category: 'Sales',
      trigger: 'Event: lead.created',
      condition: 'Filter: score > 80',
      action: 'Action: Assign to SDR Team',
    });
    notify(`Published workflow automation: "${created.name}".`);
    addAudit?.('Workflow Automation Created', `Created automation rule ${created.name}`, 'Process Designer');
  };

  const filteredRules = rules.filter(r => filter === 'All' || r.category === filter);

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
        eyebrow="ADMINISTRATION / PROCESS DESIGNER"
        title="Business Process & Automation Designer"
        subtitle="Visual business process maps, real-time event triggers, conditional decision gates, and autonomous downstream actions."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Automation Rule</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Configured Automations</span>
            <Workflow className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{rules.length} Rules</div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-domain triggers</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Weekly Executions</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {rules.reduce((a, b) => a + b.executionsThisWeek, 0)} Fires
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Real-time event fabric</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Execution Latency</span>
            <FastForward className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">&lt; 18 ms</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero-delay event bus</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Safety & Rollback Guard</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">100% Audited</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Transaction rollback active</div>
        </div>
      </div>

      {/* View Switcher: Rules Cards vs Visual BPMN Flow */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('rules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeView === 'rules'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rule Execution Cards</span>
          </button>
          <button
            onClick={() => setActiveView('bpmn')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeView === 'bpmn'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Visual BPMN Flow Map</span>
          </button>
        </div>

        {activeView === 'rules' && (
          <div className="flex items-center gap-1.5">
            {['All', 'Sales', 'CPQ', 'Service', 'Delivery'].map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  filter === c
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeView === 'rules' ? (
        /* RULES CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map(rule => (
            <div
              key={rule.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded">
                      {rule.ref || 'WF-AUTO'}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{rule.name}</h3>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    rule.status === 'Active'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                      : 'bg-slate-950 text-slate-500'
                  }`}>
                    {rule.status}
                  </span>
                </div>

                {/* 3 Step Workflow Progression */}
                <div className="mt-4 space-y-2 text-xs">
                  {/* Step 1: Trigger */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>1. TRIGGER EVENT</span>
                    </div>
                    <div className="font-mono text-slate-200 text-[11px]">{rule.trigger}</div>
                  </div>

                  {/* Step 2: Condition */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      <span>2. EVALUATION FILTER</span>
                    </div>
                    <div className="font-mono text-slate-300 text-[11px]">{rule.condition}</div>
                  </div>

                  {/* Step 3: Action */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>3. AUTOMATED ACTION</span>
                    </div>
                    <div className="text-slate-200 text-[11px] font-medium">{rule.action}</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Last run: {rule.lastRun} ({rule.executionsThisWeek} fires)</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimulateExecution(rule)}
                    disabled={isSimulating}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <FastForward className="w-3 h-3" />
                    <span>Test Fire</span>
                  </button>
                  <button
                    onClick={() => handleToggleStatus(rule.id)}
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                    title={rule.status === 'Active' ? 'Pause Rule' : 'Activate Rule'}
                  >
                    {rule.status === 'Active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* BPMN VISUAL FLOW MAP */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Visual End-to-End Enterprise Lifecycle Sequence (BPMN)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforced automated event pipeline routing records from initial lead capture through project delivery and recurring billing.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 overflow-x-auto py-4">
            {[
              { step: '1. Inbound Lead', desc: 'SCIM / Webform intake', badge: 'Event: lead.created' },
              { step: '2. Territory Routing', desc: 'Lead Dealer assigns AE', badge: 'Rule: California / NY' },
              { step: '3. CPQ Quotation', desc: 'Discount check < 15%', badge: 'Rule: Discount Gate' },
              { step: '4. Deal Closed Won', desc: 'Auto-Project provision', badge: 'Handover Trigger' },
              { step: '5. Order Fulfillment', desc: 'Stock reserved & picked', badge: 'ATP Multi-Depot' },
              { step: '6. Stripe Billing', desc: 'Automated invoice charge', badge: 'PCI-DSS Hook' }
            ].map((node, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-slate-950 border border-cyan-500/50 p-3.5 rounded-xl text-center min-w-[150px] shadow-lg">
                  <div className="text-xs font-bold text-white">{node.step}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{node.desc}</div>
                  <div className="text-[9px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/40 px-1.5 py-0.5 rounded mt-2">
                    {node.badge}
                  </div>
                </div>
                {i < 5 && <ArrowRight className="w-4 h-4 text-cyan-500 shrink-0 hidden md:block" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Configure New Workflow Automation</span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Rule Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Inbound Enterprise Lead Fast-Track"
                  value={newRule.name}
                  onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Domain</label>
                  <select
                    value={newRule.category}
                    onChange={e => setNewRule({ ...newRule, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option>Sales</option>
                    <option>CPQ</option>
                    <option>Service</option>
                    <option>Delivery</option>
                    <option>Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Trigger Event</label>
                  <input
                    type="text"
                    value={newRule.trigger}
                    onChange={e => setNewRule({ ...newRule, trigger: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Condition Filter</label>
                <input
                  type="text"
                  value={newRule.condition}
                  onChange={e => setNewRule({ ...newRule, condition: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Automated Action</label>
                <input
                  type="text"
                  value={newRule.action}
                  onChange={e => setNewRule({ ...newRule, action: e.target.value })}
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
                  type="button"
                  onClick={handleCreateRule}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Save & Enable Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
