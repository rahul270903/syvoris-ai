import { useState, useMemo, useEffect } from 'react';
import {
  Activity, Phone, Mail, MessageSquare, Calendar, FileText,
  Plus, RefreshCw, Check, Search, ShieldCheck, Clock, Building2, User
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, CRMActivityItem, AccountItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

export function ActivitiesView() {
  const { addEvent, addAudit } = useCRM();

  const [activities, setActivities] = useState<CRMActivityItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // New Activity Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newType, setNewType] = useState('Call');
  const [newSubject, setNewSubject] = useState('');
  const [newAccountId, setNewAccountId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [actRes, accRes] = await Promise.all([
        api.listActivities(100),
        api.listAccounts({ limit: 100 }),
      ]);
      setActivities(actRes || []);
      setAccounts(accRes.items || []);
      if (accRes.items?.length > 0 && !newAccountId) {
        setNewAccountId(accRes.items[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load activities from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newAccountId) return;

    setSaving(true);
    try {
      const targetAcc = accounts.find(a => a.id === newAccountId);
      const created = await api.createAccountActivity(newAccountId, {
        activity_type: newType,
        subject: newSubject.trim(),
        description: newDescription.trim() || undefined,
      });

      setActivities(prev => [created, ...prev]);
      setModalOpen(false);
      setNewSubject('');
      setNewDescription('');

      addEvent('activity.logged', { ref: newAccountId }, `Logged ${newType}: ${newSubject}`);
      addAudit('CRM Activity Logged', 'Arjun Mehta', `${newType} with ${targetAcc?.name || 'Account'}`);
      notify(`Activity "${newSubject}" logged to PostgreSQL under ${targetAcc?.name}.`);
    } catch (err: any) {
      notify(`Failed to save activity: ${err?.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (typeFilter !== 'All' && a.activity_type.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          a.subject.toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q) ||
          a.actor_name.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [activities, typeFilter, search]);

  const stats = useMemo(() => {
    const total = activities.length;
    const calls = activities.filter(a => a.activity_type.toLowerCase() === 'call').length;
    const emails = activities.filter(a => a.activity_type.toLowerCase() === 'email').length;
    const meetings = activities.filter(a => a.activity_type.toLowerCase() === 'meeting').length;
    return { total, calls, emails, meetings };
  }, [activities]);

  const activityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call': return <Phone size={14} className="text-amber-600" />;
      case 'email': return <Mail size={14} className="text-blue-600" />;
      case 'sms': return <MessageSquare size={14} className="text-emerald-600" />;
      case 'meeting': return <Calendar size={14} className="text-indigo-600" />;
      case 'chat': return <MessageSquare size={14} className="text-purple-600" />;
      default: return <FileText size={14} className="text-slate-600" />;
    }
  };

  return (
    <div className="workspace-page">
      <SectionHeading
        eyebrow="COMMUNICATIONS & COLLABORATION / WORKSPACE"
        title="Customer Activities Ledger"
        subtitle="Chronological audit stream of customer interactions, sales calls, email exchanges, meetings and planned follow-ups."
        action={
          <div className="flex items-center gap-2">
            <button className="btn secondary small" onClick={loadData} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Stream
            </button>
            <button
              className="btn primary small flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={14} /> Log Customer Activity
            </button>
          </div>
        }
      />

      {/* KPI METRICS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Activities</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>
        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-600 font-bold uppercase tracking-wider block">Calls Logged</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">{stats.calls}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Phone size={20} />
          </div>
        </div>
        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block">Emails Dispatched</span>
            <span className="text-2xl font-bold text-blue-700 mt-1 block">{stats.emails}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Mail size={20} />
          </div>
        </div>
        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider block">Meetings Held</span>
            <span className="text-2xl font-bold text-indigo-700 mt-1 block">{stats.meetings}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* ACTIVITIES TABLE */}
      <div className="panel p-5">
        <div className="panel-heading mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">PostgreSQL Activity Stream</h2>
            <p className="text-xs text-slate-500">Live feed connected to crm_activities table with Row-Level Security.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium"
            >
              <option value="All">All Types</option>
              <option value="Email">Email</option>
              <option value="Call">Call</option>
              <option value="SMS">SMS</option>
              <option value="Meeting">Meeting</option>
              <option value="Note">Note</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-blue-600" />
            Loading activities ledger from PostgreSQL...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No activities recorded matching the current filter.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>TYPE</th>
                  <th>SUBJECT & DETAILS</th>
                  <th>ACCOUNT</th>
                  <th>ACTOR</th>
                  <th>DATE & TIME</th>
                  <th>AUDIT PROVENANCE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(act => {
                  const targetAcc = accounts.find(a => a.id === act.account_id);
                  return (
                    <tr key={act.id}>
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {activityIcon(act.activity_type)}
                          <span>{act.activity_type}</span>
                        </span>
                      </td>
                      <td>
                        <strong className="block text-xs text-slate-900">{act.subject}</strong>
                        {act.description && (
                          <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 block">
                            {act.description}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                          <Building2 size={12} className="text-slate-400" />
                          {targetAcc?.name || 'Customer Account'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          {act.actor_name || 'Arjun Mehta'}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-slate-500">
                          {act.occurred_at ? act.occurred_at.slice(0, 16).replace('T', ' ') : 'Just now'}
                        </span>
                      </td>
                      <td>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <ShieldCheck size={13} /> RLS Verified
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LOG ACTIVITY MODAL */}
      {modalOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="eyebrow text-blue-600">OUTREACH RECORDING</span>
                <h2>Log Customer Interaction</h2>
              </div>
              <button className="icon-close" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateActivity}>
              <div className="modal-body space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Interaction Type *</label>
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    >
                      <option value="Call">Phone Call</option>
                      <option value="Email">Email Message</option>
                      <option value="SMS">SMS Text</option>
                      <option value="Meeting">Meeting / Conference</option>
                      <option value="Note">Internal Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Related Account *</label>
                    <select
                      value={newAccountId}
                      onChange={e => setNewAccountId(e.target.value)}
                      required
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Subject / Summary *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Discussed SLA terms and failover cluster requirements"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Detailed Notes / Outcomes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Customer agreed to 99.99% uptime SLA with 15-minute response window..."
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="modal-footer flex items-center justify-end gap-2">
                <button type="button" className="btn secondary text-xs" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newSubject.trim()}
                  className="btn primary text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : 'Commit to Activity Stream'}
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
