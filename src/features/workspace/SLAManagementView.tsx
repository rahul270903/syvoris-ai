import React, { useState, useEffect } from 'react';
import {
  Clock, Gauge, ShieldCheck, AlertTriangle, CheckCircle2,
  Plus, RefreshCw, Edit3, X, Check, ArrowRight, Calendar, Power
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, SLAPolicyItem, CaseItem } from '../../services/api';

export function SLAManagementView() {
  const [policies, setPolicies] = useState<SLAPolicyItem[]>([]);
  const [activeCases, setActiveCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Policy Modal
  const [editingPolicy, setEditingPolicy] = useState<SLAPolicyItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editResponseHours, setEditResponseHours] = useState('1');
  const [editResolutionHours, setEditResolutionHours] = useState('4');
  const [editBusinessHoursOnly, setEditBusinessHoursOnly] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Create Policy Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPriority, setCreatePriority] = useState('High');
  const [createResponseHours, setCreateResponseHours] = useState('2');
  const [createResolutionHours, setCreateResolutionHours] = useState('8');
  const [createBusinessHoursOnly, setCreateBusinessHoursOnly] = useState(true);
  const [createDescription, setCreateDescription] = useState('');
  const [creatingPolicy, setCreatingPolicy] = useState(false);

  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [policiesRes, casesRes] = await Promise.all([
        api.listSLAPolicies(),
        api.listCases({ limit: 50 })
      ]);
      setPolicies(Array.isArray(policiesRes) ? policiesRes : (policiesRes as any)?.items || []);
      setActiveCases(Array.isArray(casesRes) ? casesRes : (casesRes as any)?.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load SLA policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePolicyStatus = async (policy: SLAPolicyItem) => {
    try {
      const updated = await api.updateSLAPolicy(policy.id, {
        is_active: !policy.is_active
      });
      setPolicies(prev => prev.map(p => p.id === policy.id ? updated : p));
      notify(`SLA policy ${policy.name} is now ${updated.is_active ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      notify(`Status update failed: ${err?.message || 'Error'}`);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    setSavingPolicy(true);
    try {
      const updated = await api.updateSLAPolicy(editingPolicy.id, {
        name: editName,
        first_response_hours: Number(editResponseHours) || 1,
        resolution_hours: Number(editResolutionHours) || 4,
        business_hours_only: editBusinessHoursOnly
      });
      setPolicies(prev => prev.map(p => p.id === editingPolicy.id ? updated : p));
      setEditingPolicy(null);
      notify(`Policy ${updated.name} updated successfully.`);
    } catch (err: any) {
      notify(`Failed to update policy: ${err?.message || 'Error'}`);
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreatingPolicy(true);
    try {
      const newPolicy = await api.createSLAPolicy({
        name: createName.trim(),
        priority: createPriority,
        first_response_hours: Number(createResponseHours) || 2,
        resolution_hours: Number(createResolutionHours) || 8,
        business_hours_only: createBusinessHoursOnly,
        description: createDescription.trim() || undefined,
        is_active: true
      });
      setPolicies(prev => [...prev, newPolicy]);
      setShowCreateModal(false);
      setCreateName('');
      setCreateDescription('');
      notify(`New policy ${newPolicy.name} created.`);
    } catch (err: any) {
      notify(`Failed to create policy: ${err?.message || 'Error'}`);
    } finally {
      setCreatingPolicy(false);
    }
  };

  const breachedCases = activeCases.filter(c => c.sla_breached);
  const activeTrackedCases = activeCases.filter(c => c.status !== 'Closed');

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <SectionHeading
        eyebrow="SERVICE ADMINISTRATION / COMPLIANCE ENGINE"
        title="SLA Management & Target Governance"
        subtitle="Configure first-response and resolution commitments, escalation triggers, and business hour calendars."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="btn secondary flex items-center gap-1.5 text-xs py-2 px-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn primary bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm rounded-lg"
            >
              <Plus size={14} />
              <span>New SLA Policy</span>
            </button>
          </div>
        }
      />

      {/* SLA Health Dashboard KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall SLA Compliance</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">96.8%</span>
            <span className="text-xs text-emerald-700 font-semibold">meets SLA</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Benchmark target &ge; 95.0%</div>
        </div>

        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Policy Rules</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Gauge size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{policies.filter(p => p.is_active).length}</span>
            <span className="text-xs text-slate-500">of {policies.length} configured</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Tiered by severity and business hours</div>
        </div>

        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Breached Deadlines</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{breachedCases.length}</span>
            <span className="text-xs text-rose-700 font-semibold">incidents breached</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Requires executive escalation</div>
        </div>

        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Target Close Cycle</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">4.2h</span>
            <span className="text-xs text-slate-500">mean commitment</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">First-response commitment avg: 1.4h</div>
        </div>
      </div>

      {/* Standard SLA Policies Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Enforced SLA Policy Rules</h3>
            <p className="text-xs text-slate-500">Response and resolution target thresholds configured for production support.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {policies.map(p => {
            const isCritical = p.priority === 'Critical';
            const isHigh = p.priority === 'High';
            return (
              <div
                key={p.id}
                className="panel p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCritical ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      isHigh ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {p.priority} Severity
                    </span>
                    <button
                      onClick={() => handleTogglePolicyStatus(p)}
                      title={p.is_active ? 'Click to Pause' : 'Click to Activate'}
                      className={`p-1 rounded-md transition-colors ${
                        p.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <Power size={15} />
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {p.description || `Production SLA policy for ${p.priority} priority cases.`}
                  </p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">First Response:</span>
                    <span className="font-bold text-slate-900">{p.first_response_hours} hour{p.first_response_hours !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Full Resolution:</span>
                    <span className="font-bold text-slate-900">{p.resolution_hours} hour{p.resolution_hours !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Schedule:</span>
                    <span className="font-semibold text-slate-700">
                      {p.business_hours_only ? 'Business Hours' : '24x7 Continuous'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                    p.is_active ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>{p.is_active ? 'ACTIVE' : 'PAUSED'}</span>
                  </span>

                  <button
                    onClick={() => {
                      setEditingPolicy(p);
                      setEditName(p.name);
                      setEditResponseHours(String(p.first_response_hours));
                      setEditResolutionHours(String(p.resolution_hours));
                      setEditBusinessHoursOnly(p.business_hours_only);
                    }}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active SLA Watchlist Table */}
      <div className="panel bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden space-y-3">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active SLA Incident Compliance Ledger</h3>
            <p className="text-xs text-slate-500">Real-time tracking of active cases against SLA deadlines.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {activeTrackedCases.length} active cases tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Case Ref</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Resolution Deadline</th>
                <th className="py-3 px-4">SLA State</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTrackedCases.length > 0 ? (
                activeTrackedCases.map(c => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600">{c.ref}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">{c.subject}</td>
                      <td className="py-3 px-4 text-slate-700">{c.account_name || 'Standard Account'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          c.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                          c.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {c.sla_resolution_deadline ? `${c.sla_resolution_deadline.slice(0, 16)} UTC` : 'Standard SLA Window'}
                      </td>
                      <td className="py-3 px-4">
                        {c.sla_breached ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertTriangle size={12} /> BREACHED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 size={12} /> WITHIN TARGET
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <StatusPill status={c.status} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active cases currently tracked under SLA timers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">Configure SLA Policy Targets</h3>
              <button onClick={() => setEditingPolicy(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Response (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.25"
                    required
                    value={editResponseHours}
                    onChange={e => setEditResponseHours(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Resolution (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={editResolutionHours}
                    onChange={e => setEditResolutionHours(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editBusinessHoursOnly}
                    onChange={e => setEditBusinessHoursOnly(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-0"
                  />
                  <span>Pause clock outside business hours (Mon-Fri 09:00-17:00 UTC)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                  className="btn secondary py-1.5 px-3 text-slate-700 bg-white border border-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPolicy}
                  className="btn primary py-1.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded"
                >
                  {savingPolicy ? 'Saving...' : 'Save Targets'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Policy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">Create New SLA Policy</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Policy Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Enterprise Infrastructure SLA"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Priority Tier</label>
                <select
                  value={createPriority}
                  onChange={e => setCreatePriority(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Critical">Critical (P1)</option>
                  <option value="High">High (P2)</option>
                  <option value="Normal">Normal (P3)</option>
                  <option value="Low">Low (P4)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Response (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.25"
                    required
                    value={createResponseHours}
                    onChange={e => setCreateResponseHours(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Resolution (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={createResolutionHours}
                    onChange={e => setCreateResolutionHours(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={createBusinessHoursOnly}
                    onChange={e => setCreateBusinessHoursOnly(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-0"
                  />
                  <span>Restrict to business hours schedule</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Policy Contract</label>
                <textarea
                  rows={2}
                  placeholder="Explain contractual SLA obligations and escalation pathways..."
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn secondary py-1.5 px-3 text-slate-700 bg-white border border-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPolicy}
                  className="btn primary py-1.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded"
                >
                  {creatingPolicy ? 'Creating...' : 'Create SLA Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}