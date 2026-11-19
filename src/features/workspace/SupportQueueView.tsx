import React, { useState, useEffect } from 'react';
import {
  Inbox, Ticket, Clock, AlertTriangle, ShieldCheck,
  UserCheck, ArrowUpRight, CheckCircle2, RefreshCw, Search,
  Users, ChevronRight, X, ArrowRight, ShieldAlert
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, CaseItem } from '../../services/api';

export function SupportQueueView() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedQueue, setSelectedQueue] = useState<'all' | 'tier1' | 'tier2' | 'vip' | 'my_tickets'>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Triage Drawer
  const [triageCase, setTriageCase] = useState<CaseItem | null>(null);
  const [assigneeName, setAssigneeName] = useState('Arjun Mehta');
  const [queueTarget, setQueueTarget] = useState('Tier-1 General Support');
  const [priorityBump, setPriorityBump] = useState('');
  const [triaging, setTriaging] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listCases({ limit: 100 });
      setCases(res.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch queue items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleClaimCase = async (c: CaseItem) => {
    try {
      const updated = await api.updateCase(c.id, {
        assigned_user_name: 'Arjun Mehta',
        status: c.status === 'New' ? 'In Progress' : c.status,
      });
      setCases(prev => prev.map(item => item.id === c.id ? updated : item));
      notify(`Case ${c.ref} claimed and assigned to Arjun Mehta.`);
    } catch (err: any) {
      notify(`Claim failed: ${err?.message || 'Error claiming ticket'}`);
    }
  };

  const handleQuickEscalate = async (c: CaseItem) => {
    try {
      const updated = await api.updateCase(c.id, {
        priority: 'High',
        assigned_queue: 'Tier-2 Escalations',
      });
      setCases(prev => prev.map(item => item.id === c.id ? updated : item));
      notify(`Case ${c.ref} escalated to Tier-2 Escalations queue.`);
    } catch (err: any) {
      notify(`Escalation failed: ${err?.message || 'Error escalating'}`);
    }
  };

  const handleApplyTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageCase) return;
    setTriaging(true);
    try {
      const updated = await api.updateCase(triageCase.id, {
        assigned_user_name: assigneeName,
        assigned_queue: queueTarget,
        priority: priorityBump || triageCase.priority,
        status: triageCase.status === 'New' ? 'In Progress' : triageCase.status,
      });
      setCases(prev => prev.map(c => c.id === triageCase.id ? updated : c));
      setTriageCase(null);
      notify(`Triage applied to ${triageCase.ref}.`);
    } catch (err: any) {
      notify(`Triage error: ${err?.message || 'Failed to update'}`);
    } finally {
      setTriaging(false);
    }
  };

  // Filter cases based on queue selection
  const filteredQueue = cases.filter(c => {
    if (selectedQueue === 'tier1' && c.assigned_queue !== 'Tier-1 General Support') return false;
    if (selectedQueue === 'tier2' && c.assigned_queue !== 'Tier-2 Escalations') return false;
    if (selectedQueue === 'vip' && c.priority !== 'Critical') return false;
    if (selectedQueue === 'my_tickets' && c.assigned_user_name !== 'Arjun Mehta') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRef = c.ref.toLowerCase().includes(q);
      const matchSub = c.subject.toLowerCase().includes(q);
      const matchAcc = (c.account_name || '').toLowerCase().includes(q);
      if (!matchRef && !matchSub && !matchAcc) return false;
    }
    return true;
  });

  const unassignedCount = cases.filter(c => !c.assigned_user_name || c.assigned_user_name === 'Tier-1 Support Team' || c.status === 'New').length;
  const criticalCount = cases.filter(c => c.priority === 'Critical' && c.status !== 'Closed').length;
  const myCount = cases.filter(c => c.assigned_user_name === 'Arjun Mehta').length;
  const tier2Count = cases.filter(c => c.assigned_queue === 'Tier-2 Escalations' && c.status !== 'Closed').length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <SectionHeading
        eyebrow="CUSTOMER SERVICE & OPERATIONS / TRIAGE ENGINE"
        title="Support Queue & Incident Triage"
        subtitle="Monitor intake queues, prevent SLA deadline breaches, claim unassigned workloads, and route critical escalations."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadQueue}
              disabled={loading}
              className="btn secondary flex items-center gap-1.5 text-xs py-2 px-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Queue</span>
            </button>
          </div>
        }
      />

      {/* Queue Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unassigned Triage Backlog</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Inbox size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{unassignedCount}</span>
            <span className="text-xs text-amber-700 font-semibold">unclaimed tickets</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Requires immediate first triage</div>
        </div>

        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">VIP SLA Critical Queue</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{criticalCount}</span>
            <span className="text-xs text-rose-700 font-semibold">imminent breach risk</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">&lt; 1 hour first-response mandate</div>
        </div>

        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tier-2 Escalations</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600">{tier2Count}</span>
            <span className="text-xs text-indigo-700 font-medium">engineering escalations</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">High severity infrastructure queries</div>
        </div>

        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Claimed by Me (Arjun)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{myCount}</span>
            <span className="text-xs text-emerald-700 font-medium">active assignments</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Directly assigned support workload</div>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="panel bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        {/* Queue Selector Bar */}
        <div className="border-b border-slate-200 px-5 pt-3 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'All Unresolved Queues', count: cases.filter(c => c.status !== 'Closed').length },
              { id: 'vip', label: 'VIP SLA Urgent', count: criticalCount },
              { id: 'tier1', label: 'Tier-1 General Support', count: cases.filter(c => c.assigned_queue === 'Tier-1 General Support').length },
              { id: 'tier2', label: 'Tier-2 Escalations', count: tier2Count },
              { id: 'my_tickets', label: 'Claimed by Me', count: myCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedQueue(tab.id as any)}
                className={`text-xs font-bold pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  selectedQueue === tab.id
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedQueue === tab.id ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative pb-2.5">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search queue..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 bg-white w-56 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Queue Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Urgency & Ref</th>
                <th className="py-3 px-4">Subject & Description</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-4">Queue Routing</th>
                <th className="py-3 px-4">SLA Deadline</th>
                <th className="py-3 px-4">Current Owner</th>
                <th className="py-3 px-4 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length > 0 ? (
                filteredQueue.map(c => {
                  const isClaimedByMe = c.assigned_user_name === 'Arjun Mehta';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-600">{c.ref}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                            c.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {c.priority}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{c.subject}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{c.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{c.account_name || 'Standard Account'}</div>
                        <div className="text-[11px] text-slate-400">{c.category || 'Technical Support'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {c.assigned_queue || 'General Support'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.sla_breached ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                            <AlertTriangle size={12} /> BREACHED
                          </span>
                        ) : c.priority === 'Critical' ? (
                          <span className="text-rose-700 font-bold flex items-center gap-1 text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <Clock size={12} className="animate-spin" /> &lt; 45m Target
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium text-[11px] flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {c.sla_resolution_deadline ? `${c.sla_resolution_deadline.slice(11, 16)} UTC` : 'On Track'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${isClaimedByMe ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {c.assigned_user_name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isClaimedByMe && (
                            <button
                              onClick={() => handleClaimCase(c)}
                              className="btn primary py-1 px-2.5 text-[11px] bg-sky-600 hover:bg-sky-500 text-white font-bold rounded shadow-none"
                            >
                              Claim Case
                            </button>
                          )}
                          {c.assigned_queue !== 'Tier-2 Escalations' && (
                            <button
                              onClick={() => handleQuickEscalate(c)}
                              className="btn secondary py-1 px-2 text-[11px] text-slate-700 bg-white border border-slate-300 font-bold rounded hover:bg-slate-50"
                            >
                              Escalate
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setTriageCase(c);
                              setAssigneeName(c.assigned_user_name || 'Arjun Mehta');
                              setQueueTarget(c.assigned_queue || 'Tier-1 General Support');
                              setPriorityBump(c.priority);
                            }}
                            className="btn secondary py-1 px-2 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded"
                          >
                            Route
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Inbox size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">All Queue Items Processed</p>
                    <p className="text-xs text-slate-400 mt-1">No pending tickets in the selected triage queue.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Triage & Route Drawer */}
      {triageCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Queue Routing & Re-assignment</span>
                <h3 className="text-sm font-black text-slate-900">Triage Ticket {triageCase.ref}</h3>
              </div>
              <button onClick={() => setTriageCase(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyTriage} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Subject</span>
                <div className="font-bold text-slate-900">{triageCase.subject}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Support Queue</label>
                <select
                  value={queueTarget}
                  onChange={e => setQueueTarget(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Tier-1 General Support">Tier-1 General Support</option>
                  <option value="Tier-2 Escalations">Tier-2 Escalations</option>
                  <option value="Commercial & Billing Queries">Commercial & Billing Queries</option>
                  <option value="Cloud Infrastructure Operations">Cloud Infrastructure Operations</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Support Specialist</label>
                <select
                  value={assigneeName}
                  onChange={e => setAssigneeName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Arjun Mehta">Arjun Mehta (Senior Account Executive / Lead)</option>
                  <option value="Tier-1 Support Team">Tier-1 Support Team</option>
                  <option value="Senior Solutions Architect">Senior Solutions Architect</option>
                  <option value="Database Engineering Group">Database Engineering Group</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority Override</label>
                <select
                  value={priorityBump}
                  onChange={e => setPriorityBump(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Critical">Critical (P1)</option>
                  <option value="High">High (P2)</option>
                  <option value="Normal">Normal (P3)</option>
                  <option value="Low">Low (P4)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTriageCase(null)}
                  className="btn secondary py-1.5 px-3 text-slate-700 bg-white border border-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triaging}
                  className="btn primary py-1.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded"
                >
                  {triaging ? 'Applying...' : 'Apply Triage Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}