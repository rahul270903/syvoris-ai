import { useState, useEffect } from 'react';
import {
  Play, Pause, Plus, Check, X,
  ShieldCheck, Zap, CheckCircle2,
  RefreshCw, FastForward
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
    name: 'Closed-Won Deal Delivery Handover',
    category: 'Delivery',
    trigger: 'Event: deal.stage_changed (Closed Won)',
    condition: 'Filter: Commercial contract executed = true',
    action: 'Action: Create post-sales Implementation Project & assign Customer Success Manager',
    status: 'Active',
    executionsThisWeek: 6,
    lastRun: 'Yesterday',
  },
  {
    id: 'wf-4',
    ref: 'WF-DEF-004',
    name: 'High-Priority Case SLA Escalation',
    category: 'Service',
    trigger: 'Timer: case.inactivity > 3 hours',
    condition: 'Filter: Priority == High AND Status != Resolved',
    action: 'Action: Escalate to Support Engineering Director & dispatch SMS alert',
    status: 'Active',
    executionsThisWeek: 3,
    lastRun: 'Nov 6',
  },
  {
    id: 'wf-5',
    ref: 'WF-DEF-005',
    name: 'New Client Onboarding Journey Enrollment',
    category: 'Marketing',
    trigger: 'Event: order.fulfilled',
    condition: 'Filter: Customer order count == 1 (New Logo)',
    action: 'Action: Enroll Primary Contact in 14-Day Welcome Email Sequence',
    status: 'Active',
    executionsThisWeek: 12,
    lastRun: 'Nov 7',
  }
];

export function WorkflowDesignerView() {
  const { addEvent, addAudit } = useCRM();

  const [rules, setRules] = useState<AutomationRule[]>(defaultRules);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    category: 'Sales' as AutomationRule['category'],
    trigger: 'Event: lead.created',
    condition: 'Filter: Lead score > 80',
    action: 'Action: Send instant notification to rep',
  });
  const [toast, setToast] = useState('');
  const [executingId, setExecutingId] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const transformApiWorkflow = (w: WorkflowItem): AutomationRule => ({
    id: w.id,
    ref: w.ref,
    name: w.name,
    category: (['Sales', 'CPQ', 'Service', 'Delivery', 'Marketing'].includes(w.category)
      ? w.category
      : 'Sales') as AutomationRule['category'],
    trigger: w.trigger_type === 'event' ? `Event: ${w.trigger_event}` : `${w.trigger_type}: ${w.trigger_event}`,
    condition: w.condition_expression ? `Filter: ${w.condition_expression}` : 'Filter: Default evaluate',
    action: w.action_summary ? `Action: ${w.action_summary}` : 'Action: Standard automated sequence',
    status: w.status === 'Active' ? 'Active' : 'Paused',
    executionsThisWeek: w.executions_count || 0,
    lastRun: w.last_executed_at ? new Date(w.last_executed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never',
  });

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.listWorkflows({ limit: 100 });
      if (res && res.items && res.items.length > 0) {
        setRules(res.items.map(transformApiWorkflow));
      }
    } catch {
      // Gracefully preserve current rules if offline or mock environment
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const toggleStatus = async (id: string) => {
    const target = rules.find(r => r.id === id);
    const nextStatus = target?.status === 'Active' ? 'Paused' : 'Active';

    // Optimistic UI update
    setRules(prev =>
      prev.map(r => (r.id === id ? { ...r, status: nextStatus } : r))
    );

    try {
      await api.toggleWorkflowStatus(id);
      addAudit('Workflow Rule Toggled', 'User', `${target?.name}: ${nextStatus}`);
      notify(`Workflow "${target?.name || id}" set to ${nextStatus}.`);
    } catch {
      // If API error or offline mode, keep state and log audit
      addAudit('Workflow Rule Toggled', 'Demo User', `${target?.name}: ${nextStatus}`);
      notify(`Workflow "${target?.name || id}" set to ${nextStatus} (local state).`);
    }
  };

  const handleTestExecute = async (rule: AutomationRule) => {
    setExecutingId(rule.id);
    try {
      const simPayload = {
        payload: {
          lead_score: 95,
          company_revenue: 15000000,
          employee_count: 350,
          discount_pct: 18,
          priority: 'High'
        }
      };
      const exec = await api.executeWorkflow(rule.id, simPayload);
      notify(`Execution triggered: ${exec.status} in ${exec.duration_ms}ms (${exec.execution_log.length} steps).`);
      setRules(prev =>
        prev.map(r => (r.id === rule.id ? { ...r, executionsThisWeek: r.executionsThisWeek + 1, lastRun: 'Just now' } : r))
      );
    } catch {
      notify(`Simulated execution recorded for "${rule.name}".`);
      setRules(prev =>
        prev.map(r => (r.id === rule.id ? { ...r, executionsThisWeek: r.executionsThisWeek + 1, lastRun: 'Just now' } : r))
      );
    } finally {
      setExecutingId(null);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) {
      notify('Workflow name is required.');
      return;
    }

    const cleanTrigger = newRule.trigger.replace(/^Event:\s*/i, '').trim();
    const cleanCondition = newRule.condition.replace(/^Filter:\s*/i, '').trim();
    const cleanAction = newRule.action.replace(/^Action:\s*/i, '').trim();

    try {
      const createdItem = await api.createWorkflow({
        name: newRule.name.trim(),
        category: newRule.category,
        trigger_type: 'event',
        trigger_event: cleanTrigger || 'lead.created',
        condition_expression: cleanCondition,
        action_summary: cleanAction,
        status: 'Active',
        actions: [{ type: 'notification', description: cleanAction }]
      });

      const transformed = transformApiWorkflow(createdItem);
      setRules(prev => [transformed, ...prev]);
      notify(`Workflow "${transformed.name}" created and deployed.`);
    } catch {
      const fallbackRule: AutomationRule = {
        id: `wf-${Date.now()}`,
        name: newRule.name.trim(),
        category: newRule.category,
        trigger: newRule.trigger,
        condition: newRule.condition,
        action: newRule.action,
        status: 'Active',
        executionsThisWeek: 0,
        lastRun: 'Never',
      };
      setRules(prev => [fallbackRule, ...prev]);
      notify(`Workflow "${fallbackRule.name}" created and activated.`);
    }

    setShowAddModal(false);
    addEvent('workflow.created', { ref: newRule.name }, `Created automation workflow: ${newRule.name}`);
    addAudit('Workflow Automation Created', 'User', newRule.name);
    setNewRule({
      name: '',
      category: 'Sales',
      trigger: 'Event: lead.created',
      condition: 'Filter: Lead score > 80',
      action: 'Action: Send instant notification to rep',
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="ADMINISTRATION & AUTOMATION / WORKFLOW DESIGNER"
        title="Business Process & Automation Designer"
        subtitle="Configure event-driven business rules, automated task handoffs and customer journey triggers."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadWorkflows}
              disabled={loading}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh workflows from live engine"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>Create Automation Rule</span>
            </button>
          </div>
        }
      />

      {/* Rules Grid */}
      <div className="space-y-3">
        {rules.map(rule => (
          <div
            key={rule.id}
            className={`panel p-4 border transition-all ${
              rule.status === 'Active'
                ? 'border-slate-200 bg-white hover:border-sky-300'
                : 'border-slate-200 bg-slate-50 opacity-70'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{rule.name}</span>
                  {rule.ref && (
                    <span className="text-[10px] bg-sky-50 text-sky-700 font-mono px-1.5 py-0.5 rounded border border-sky-100">
                      {rule.ref}
                    </span>
                  )}
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                    {rule.category}
                  </span>
                  <StatusPill status={rule.status} />
                </div>
                <div className="text-xs text-slate-500">
                  {rule.executionsThisWeek} executions this week · Last executed: {rule.lastRun}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestExecute(rule)}
                  disabled={executingId === rule.id || rule.status !== 'Active'}
                  className="btn secondary text-xs py-1 px-2.5 flex items-center gap-1 hover:bg-slate-100"
                  title="Test-run this workflow with synthetic payload"
                >
                  <FastForward size={13} className={executingId === rule.id ? 'animate-pulse text-sky-600' : ''} />
                  <span>Test Run</span>
                </button>
                <button
                  onClick={() => toggleStatus(rule.id)}
                  className={`btn text-xs py-1 px-3 flex items-center gap-1 ${
                    rule.status === 'Active'
                      ? 'secondary hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                      : 'primary'
                  }`}
                >
                  {rule.status === 'Active' ? (
                    <>
                      <Pause size={13} />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} />
                      <span>Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Visual BPMN Trigger -> Condition -> Action Flow */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-100">
                <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Zap size={11} />
                  <span>1. TRIGGER EVENT</span>
                </div>
                <div className="font-medium text-slate-800">{rule.trigger}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100">
                <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ShieldCheck size={11} />
                  <span>2. EVALUATION CONDITION</span>
                </div>
                <div className="font-medium text-slate-800">{rule.condition}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>3. AUTOMATED ACTION</span>
                </div>
                <div className="font-medium text-slate-800">{rule.action}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Automation Modal */}
      {showAddModal && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal-card wide">
            <div className="modal-header">
              <div>
                <span className="eyebrow">AUTOMATION STUDIO</span>
                <h2>Configure New Workflow Automation</h2>
              </div>
              <button className="icon-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Workflow Rule Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Inbound Enterprise Lead Fast-Track Notification"
                  value={newRule.name}
                  onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Functional Domain</label>
                  <select
                    value={newRule.category}
                    onChange={e => setNewRule({ ...newRule, category: e.target.value as AutomationRule['category'] })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  >
                    <option>Sales</option>
                    <option>CPQ</option>
                    <option>Service</option>
                    <option>Delivery</option>
                    <option>Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Trigger Event</label>
                  <input
                    type="text"
                    value={newRule.trigger}
                    onChange={e => setNewRule({ ...newRule, trigger: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Evaluation Condition / Filter</label>
                <input
                  type="text"
                  value={newRule.condition}
                  onChange={e => setNewRule({ ...newRule, condition: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Automated Execution Action</label>
                <input
                  type="text"
                  value={newRule.action}
                  onChange={e => setNewRule({ ...newRule, action: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="modal-footer flex items-center justify-end gap-2">
              <button className="btn secondary text-xs" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn primary text-xs" onClick={handleCreateRule}>
                Save & Enable Rule
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
