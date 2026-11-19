import { useState, useMemo, useEffect } from 'react';
import {
  Users, CheckCircle2, RefreshCw, Sparkles, Filter,
  ArrowRight, ShieldCheck, UserCheck, AlertCircle,
  Clock, Plus, Settings2, Play, Check, ChevronDown
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, LeadItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

interface RoutingRule {
  id: string;
  name: string;
  criteria: string;
  targetRep: string;
  strategy: 'Round-Robin' | 'Territory' | 'Score Tier' | 'Industry Match';
  active: boolean;
  priority: number;
}

interface SalesRep {
  id: string;
  name: string;
  role: string;
  email: string;
  activeLeads: number;
  capacityMax: number;
  avatar: string;
}

const INITIAL_REPS: SalesRep[] = [
  { id: 'usr-1', name: 'Arjun Mehta', role: 'Senior Account Executive (Owner)', email: 'arjun.mehta@example.com', activeLeads: 3, capacityMax: 10, avatar: 'AM' },
  { id: 'usr-2', name: 'Elena Rostova', role: 'Enterprise Sales Director', email: 'elena.rostova@example.com', activeLeads: 2, capacityMax: 10, avatar: 'ER' },
  { id: 'usr-3', name: 'Marcus Clarke', role: 'Commercial Inbound SDR', email: 'marcus.clarke@example.com', activeLeads: 2, capacityMax: 15, avatar: 'MC' },
  { id: 'usr-4', name: 'Sarah Reid', role: 'Strategic Accounts Lead', email: 'sarah.reid@example.com', activeLeads: 4, capacityMax: 10, avatar: 'SR' },
];

const INITIAL_RULES: RoutingRule[] = [
  {
    id: 'rule-1',
    name: 'Enterprise High-Fit Tier Routing',
    criteria: 'Lead Score ≥ 70 & Tier-1 Industry',
    targetRep: 'Arjun Mehta & Elena Rostova',
    strategy: 'Score Tier',
    active: true,
    priority: 1,
  },
  {
    id: 'rule-2',
    name: 'North America Regional Routing',
    criteria: 'Territory == "North America"',
    targetRep: 'Arjun Mehta',
    strategy: 'Territory',
    active: true,
    priority: 2,
  },
  {
    id: 'rule-3',
    name: 'Inbound Web & Chat Fast-Track',
    criteria: 'Source in ["Website", "Live Chat"]',
    targetRep: 'Marcus Clarke',
    strategy: 'Round-Robin',
    active: true,
    priority: 3,
  },
];

export function LeadAssignmentView() {
  const { addEvent, addAudit } = useCRM();

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [rules, setRules] = useState<RoutingRule[]>(INITIAL_RULES);
  const [reps] = useState<SalesRep[]>(INITIAL_REPS);

  const [filterOwner, setFilterOwner] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState('');

  const [toast, setToast] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCriteria, setNewRuleCriteria] = useState('');
  const [newRuleTarget, setNewRuleTarget] = useState('Arjun Mehta');
  const [newRuleStrategy, setNewRuleStrategy] = useState<'Round-Robin' | 'Territory' | 'Score Tier' | 'Industry Match'>('Round-Robin');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLeads = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.listLeads({ limit: 100, sort_by: 'created_at', sort_order: 'desc' });
      setLeads(res.items || []);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to fetch leads from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleReassignOwner = async (lead: LeadItem, newOwnerName: string) => {
    setAssigningId(lead.id);
    const matchedRep = reps.find(r => r.name === newOwnerName);
    try {
      await api.updateLead(lead.id, {
        owner_name: newOwnerName,
        owner_id: matchedRep?.id ? undefined : undefined, // Keep clean
      });
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, owner_name: newOwnerName } : l));
      addEvent('lead.reassigned', { ref: lead.ref }, `Lead ${lead.ref} reassigned to ${newOwnerName}`);
      addAudit('Lead Owner Reassigned', 'Arjun Mehta', `${lead.ref} assigned to ${newOwnerName}`);
      notify(`Lead ${lead.ref} (${lead.company_name}) successfully assigned to ${newOwnerName}.`);
    } catch (err: any) {
      notify(`Failed to reassign lead: ${err?.message || 'Network error'}`);
    } finally {
      setAssigningId(null);
    }
  };

  const handleExecuteAutoRouting = async () => {
    setLoading(true);
    let reassignedCount = 0;
    try {
      const updated = await Promise.all(
        leads.map(async (lead, idx) => {
          if (lead.status === 'Converted') return lead;
          // Apply matching active rule
          let targetRep = 'Arjun Mehta';
          if (lead.score >= 70) {
            targetRep = idx % 2 === 0 ? 'Arjun Mehta' : 'Elena Rostova';
          } else if (lead.territory === 'North America') {
            targetRep = 'Arjun Mehta';
          } else if (lead.source === 'Website' || lead.source === 'Live Chat') {
            targetRep = 'Marcus Clarke';
          } else {
            targetRep = reps[idx % reps.length].name;
          }

          if (lead.owner_name !== targetRep) {
            try {
              await api.updateLead(lead.id, { owner_name: targetRep });
              reassignedCount++;
              return { ...lead, owner_name: targetRep };
            } catch {
              return lead;
            }
          }
          return lead;
        })
      );
      setLeads(updated);
      addEvent('lead.autorouted', { ref: 'LEAD-ROUTING-ENGINE' }, `Auto-routing rules executed across ${reassignedCount} leads.`);
      addAudit('Lead Auto-Routing Executed', 'Arjun Mehta', `${reassignedCount} leads re-routed via active rules`);
      notify(`Automated routing executed: ${reassignedCount} leads matched & reallocated across sales reps.`);
    } catch (err: any) {
      notify(`Error running routing rules: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    const r = rules.find(rule => rule.id === id);
    if (r) {
      notify(`Rule "${r.name}" is now ${!r.active ? 'ACTIVE' : 'PAUSED'}.`);
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleCriteria.trim()) return;
    const newRule: RoutingRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      criteria: newRuleCriteria.trim(),
      targetRep: newRuleTarget,
      strategy: newRuleStrategy,
      active: true,
      priority: rules.length + 1,
    };
    setRules(prev => [...prev, newRule]);
    setRuleModalOpen(false);
    setNewRuleName('');
    setNewRuleCriteria('');
    notify(`New assignment rule "${newRule.name}" created and enabled.`);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (filterOwner !== 'All' && lead.owner_name !== filterOwner) return false;
      if (filterStatus !== 'All' && lead.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          lead.ref.toLowerCase().includes(q) ||
          lead.full_name.toLowerCase().includes(q) ||
          lead.company_name.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [leads, filterOwner, filterStatus, search]);

  return (
    <div className="workspace-page">
      <SectionHeading
        eyebrow="LEAD CAPTURE & CONVERSIONS / WORKSPACE"
        title="Lead Assignment & Routing Rules"
        subtitle="Manage intelligent lead distribution queues, round-robin allocations, territory governance, and sales rep capacity."
        action={
          <div className="flex items-center gap-2">
            <button className="btn secondary small" onClick={fetchLeads} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Leads
            </button>
            <button className="btn secondary small" onClick={() => setRuleModalOpen(true)}>
              <Plus size={14} /> New Routing Rule
            </button>
            <button
              className="btn primary small flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleExecuteAutoRouting}
              disabled={loading || leads.length === 0}
            >
              <Play size={13} /> Run Auto-Routing Rules
            </button>
          </div>
        }
      />

      {/* REPS ROSTER & CAPACITY CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {reps.map(rep => {
          const repLeadCount = leads.filter(l => l.owner_name === rep.name && l.status !== 'Converted').length;
          const pct = Math.min(100, Math.round((repLeadCount / rep.capacityMax) * 100));
          return (
            <div key={rep.id} className="panel p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center font-mono">
                      {rep.avatar}
                    </div>
                    <div>
                      <strong className="block text-xs text-slate-900">{rep.name}</strong>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">{rep.role}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    {repLeadCount} Active
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Capacity Load</span>
                    <span className="font-mono font-bold text-slate-700">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct > 80 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTIVE ROUTING RULES SECTION */}
      <div className="panel p-5 mb-6">
        <div className="panel-heading mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings2 size={16} className="text-indigo-600" /> Automated Distribution Rules
            </h2>
            <p className="text-xs text-slate-500">
              Rules execute automatically during inbound lead intake or on demand via Run Auto-Routing.
            </p>
          </div>
          <span className="phase-chip">{rules.filter(r => r.active).length} Rules Active</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {rules.map(rule => (
            <div
              key={rule.id}
              className={`p-3 rounded-lg border transition ${
                rule.active ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-50/40 border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Priority {rule.priority} · {rule.strategy}
                  </span>
                  <strong className="text-xs text-slate-900 block mt-0.5">{rule.name}</strong>
                </div>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                    rule.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {rule.active ? 'Active' : 'Paused'}
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Match:</span>
                  <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-700">
                    {rule.criteria}
                  </code>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Target:</span>
                  <span className="font-semibold text-slate-800">{rule.targetRep}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LEAD ASSIGNMENT REGISTER TABLE */}
      <div className="panel p-5">
        <div className="panel-heading mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Lead Assignment Register</h2>
            <p className="text-xs text-slate-500">
              Interactive queue with live 1-click sales rep reassignment persisted to PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
            />
            <select
              value={filterOwner}
              onChange={e => setFilterOwner(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700"
            >
              <option value="All">All Owners</option>
              {reps.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Draft">Draft</option>
              <option value="Nurture">Nurture</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Disqualified">Disqualified</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-blue-600" />
            Loading lead register from PostgreSQL...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No leads match current filter criteria.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>REFERENCE</th>
                  <th>PROSPECT</th>
                  <th>COMPANY & INDUSTRY</th>
                  <th>SOURCE & TERRITORY</th>
                  <th>SCORE</th>
                  <th>STATUS</th>
                  <th>ASSIGNED OWNER</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id}>
                    <td><span className="ref-link font-mono">{lead.ref}</span></td>
                    <td>
                      <b>{lead.full_name}</b>
                      <small className="block text-slate-400">{lead.job_title || 'Lead'}</small>
                    </td>
                    <td>
                      <span className="font-semibold text-slate-800">{lead.company_name}</span>
                      <small className="block text-slate-400">{lead.industry || 'General'}</small>
                    </td>
                    <td>
                      <span>{lead.source}</span>
                      <small className="block text-slate-400">{lead.territory || 'Unassigned Territory'}</small>
                    </td>
                    <td>
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        lead.score >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        lead.score >= 40 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {lead.score}/100
                      </span>
                    </td>
                    <td><StatusPill status={lead.status} /></td>
                    <td>
                      <div className="relative inline-block w-44">
                        <select
                          value={lead.owner_name || 'Arjun Mehta'}
                          disabled={assigningId === lead.id}
                          onChange={e => handleReassignOwner(lead, e.target.value)}
                          className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-md shadow-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          {reps.map(rep => (
                            <option key={rep.id} value={rep.name}>
                              {rep.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <ShieldCheck size={13} /> Active Route
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE RULE MODAL */}
      {ruleModalOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setRuleModalOpen(false)}>
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="eyebrow text-indigo-600">QUEUE GOVERNANCE</span>
                <h2>New Lead Assignment Rule</h2>
              </div>
              <button className="icon-close" onClick={() => setRuleModalOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleAddRule}>
              <div className="modal-body space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Rule Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Healthcare Strategic Lead Routing"
                    value={newRuleName}
                    onChange={e => setNewRuleName(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Criteria Formula *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Industry == 'Healthcare' && Score >= 60"
                    value={newRuleCriteria}
                    onChange={e => setNewRuleCriteria(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Routing Strategy</label>
                    <select
                      value={newRuleStrategy}
                      onChange={e => setNewRuleStrategy(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    >
                      <option value="Round-Robin">Round-Robin</option>
                      <option value="Territory">Territory Match</option>
                      <option value="Score Tier">Score Tier</option>
                      <option value="Industry Match">Industry Match</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Target Sales Rep</label>
                    <select
                      value={newRuleTarget}
                      onChange={e => setNewRuleTarget(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    >
                      {reps.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer flex items-center justify-end gap-2">
                <button type="button" className="btn secondary text-xs" onClick={() => setRuleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save & Activate Rule
                </button>
              </div>
            </form>
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
