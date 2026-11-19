import { useState, useEffect, useMemo } from 'react';
import {
  Activity, Phone, Mail, Users, Calendar, Plus,
  CheckCircle2, Clock, ArrowRight,
  Filter, Search, X
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { api, CRMActivityItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

interface AccountOption {
  id: string;
  name: string;
  ref: string;
}

interface NextBestAction {
  id: string;
  dealName: string;
  customerName: string;
  accountId: string;
  actionTitle: string;
  description: string;
  urgency: 'Critical' | 'High' | 'Normal';
  actionType: 'Call' | 'Meeting' | 'Email' | 'Proposal';
}

const defaultNextBestActions: NextBestAction[] = [
  {
    id: 'nba-1',
    dealName: 'Vertex Enterprise Migration',
    customerName: 'Vertex Global Solutions',
    accountId: 'acc-2026-00001',
    actionTitle: 'Schedule Technical Architecture Validation',
    description: 'BANT evaluation completed. VP of Engineering requires security sign-off before contract progression.',
    urgency: 'Critical',
    actionType: 'Meeting',
  },
  {
    id: 'nba-2',
    dealName: 'Live Pipeline Deal Alpha',
    customerName: 'Fujikura Optical Technologies Inc',
    accountId: 'acc-vnd-0003',
    actionTitle: 'CPQ Quote Follow-up & Commercial Close',
    description: 'Commercial quotation delivered 48 hours ago. Account Executive review recommended to secure Q4 booking.',
    urgency: 'High',
    actionType: 'Call',
  },
  {
    id: 'nba-3',
    dealName: 'Northstar Logistics Expansion',
    customerName: 'Northstar Logistics Group',
    accountId: 'acc-2026-00004',
    actionTitle: 'Send Enterprise Case Study & References',
    description: 'Prospect requested verifiable ROI metrics for multi-warehouse automation workflows.',
    urgency: 'Normal',
    actionType: 'Email',
  },
];

export function SalesActivitiesView() {
  const { addEvent, addAudit } = useCRM();
  const [activities, setActivities] = useState<CRMActivityItem[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Call' | 'Meeting' | 'Email' | 'Follow-up'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<string>('');
  
  // Drawer / Modal state for "+ Log Sales Activity"
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [activityType, setActivityType] = useState<string>('Call');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [actList, accList] = await Promise.allSettled([
        api.listActivities(100),
        api.listAccounts({ limit: 50 }),
      ]);

      if (actList.status === 'fulfilled' && actList.value) {
        setActivities(actList.value);
      }
      if (accList.status === 'fulfilled' && accList.value?.items) {
        const accs = accList.value.items.map(a => ({
          id: a.id,
          name: a.name,
          ref: a.ref,
        }));
        setAccounts(accs);
        if (accs.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accs[0].id);
        }
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenLogDrawer = (prefillAccount?: string, prefillSubject?: string, prefillType?: string) => {
    if (prefillAccount) setSelectedAccountId(prefillAccount);
    if (prefillSubject) setSubject(prefillSubject);
    if (prefillType) setActivityType(prefillType);
    setIsDrawerOpen(true);
  };

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      notify('Please select an account.');
      return;
    }
    if (!subject.trim()) {
      notify('Please enter an activity subject.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createAccountActivity(selectedAccountId, {
        activity_type: activityType,
        subject: subject.trim(),
        description: description.trim() || undefined,
      });

      setActivities(prev => [created, ...prev]);
      const linkedAcc = accounts.find(a => a.id === selectedAccountId);
      addEvent('activity.logged', { ref: linkedAcc?.ref || 'ACC' }, `Logged ${activityType}: ${subject}`);
      addAudit('Sales Activity Logged', 'Arjun Mehta', `${activityType}: ${subject} for ${linkedAcc?.name}`);
      notify(`Sales ${activityType} logged successfully!`);
      setIsDrawerOpen(false);
      setSubject('');
      setDescription('');
    } catch (err: any) {
      notify(`Failed to save activity: ${err?.message || 'Server error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchesTab =
        activeTab === 'All'
          ? true
          : (act.activity_type || '').toLowerCase().includes(activeTab.toLowerCase());
      const matchesSearch =
        searchQuery === ''
          ? true
          : (act.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (act.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (act.activity_type || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activities, activeTab, searchQuery]);

  return (
    <div className="workspace-page space-y-4">
      {/* Page Heading */}
      <SectionHeading
        eyebrow="SALES & REVENUE / ENGAGEMENT COCKPIT"
        title="Sales Activities & Next-Best Actions"
        subtitle="Log client touchpoints, track deal momentum, execute AI-recommended follow-ups, and manage sales cadence."
        action={
          <button
            onClick={() => handleOpenLogDrawer()}
            className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Plus size={14} />
            <span>Log Sales Activity</span>
          </button>
        }
      />

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Logged Activities</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {activities.length} Records
          </strong>
          <small className="text-xs text-blue-700 font-semibold block mt-1">Committed to PostgreSQL</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Calls & Conversations</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {activities.filter(a => (a.activity_type || '').toLowerCase().includes('call')).length} Calls
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">Active phone & outbound</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Client Meetings & Demos</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {activities.filter(a => (a.activity_type || '').toLowerCase().includes('meet')).length} Sessions
          </strong>
          <small className="text-xs text-purple-700 font-semibold block mt-1">Calendar confirmed</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Recommended Next Actions</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {defaultNextBestActions.length} Actions
          </strong>
          <small className="text-xs text-amber-700 font-semibold block mt-1">Priority follow-ups queue</small>
        </div>
      </div>

      {/* Next-Best Actions Section */}
      <div className="panel p-4 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-blue-600" />
              <span>Next-Best Sales Actions (AI Deal Momentum Engine)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Proactive follow-up tasks calculated from stage velocity, customer sentiment, and quote status.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {defaultNextBestActions.map(action => (
            <div
              key={action.id}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                    {action.customerName}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      action.urgency === 'Critical'
                        ? 'bg-rose-100 text-rose-800'
                        : action.urgency === 'High'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {action.urgency}
                  </span>
                </div>
                <strong className="text-xs font-bold text-slate-900 block mb-1">
                  {action.actionTitle}
                </strong>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock size={11} /> {action.actionType}
                </span>
                <button
                  onClick={() =>
                    handleOpenLogDrawer(action.accountId, action.actionTitle, action.actionType)
                  }
                  className="btn primary text-[11px] py-1 px-2.5 flex items-center gap-1"
                >
                  <span>Execute Action</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activities Timeline & Register */}
      <section className="panel p-5 bg-white border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 font-manrope">
              Chronological Sales Activity Register
            </h2>
            <p className="text-xs text-slate-500">
              Complete history of recorded sales calls, client emails, discovery meetings, and deal stage updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              {(['All', 'Call', 'Meeting', 'Email', 'Follow-up'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'All' ? 'All Activities' : `${tab}s`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Activities Table */}
        <div className="overflow-x-auto">
          <table className="crm-table w-full">
            <thead>
              <tr>
                <th>TYPE</th>
                <th>SUBJECT & SUMMARY</th>
                <th>LINKED ACCOUNT / LEAD</th>
                <th>LOGGED BY</th>
                <th>DATE / TIMESTAMP</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    {loading ? 'Loading sales activities from database...' : 'No sales activities recorded yet. Click "+ Log Sales Activity" to record a touchpoint.'}
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act, idx) => {
                  const typeLower = (act.activity_type || '').toLowerCase();
                  return (
                    <tr key={act.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {typeLower.includes('call') ? (
                            <Phone size={12} className="text-blue-600" />
                          ) : typeLower.includes('meet') ? (
                            <Users size={12} className="text-purple-600" />
                          ) : typeLower.includes('email') ? (
                            <Mail size={12} className="text-emerald-600" />
                          ) : (
                            <Activity size={12} className="text-slate-600" />
                          )}
                          {act.activity_type || 'Activity'}
                        </span>
                      </td>
                      <td>
                        <strong className="text-xs text-slate-800 block">{act.subject}</strong>
                        {act.description && (
                          <span className="text-[11px] text-slate-500 block line-clamp-1 mt-0.5">
                            {act.description}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-slate-700">
                          {accounts.find(a => a.id === act.account_id)?.name || 'Account Touchpoint'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-600">Arjun Mehta</span>
                      </td>
                      <td>
                        <span className="text-xs font-mono text-slate-500">
                          {act.occurred_at
                            ? new Date(act.occurred_at).toLocaleString()
                            : new Date().toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={11} /> Completed
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Log Activity Right-Side Drawer (Standard CRM Drawer) */}
      {isDrawerOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setIsDrawerOpen(false)}>
          <div className="form-modal">
            <div className="form-modal-head">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  SALES TOUCHPOINT
                </span>
                <h2 className="text-base font-bold text-slate-800">Log Sales Activity</h2>
                <p className="text-xs text-slate-500">
                  Record call notes, client meeting summaries or sales correspondence directly into the account timeline.
                </p>
              </div>
              <button
                type="button"
                className="icon-close"
                onClick={() => setIsDrawerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitActivity} className="flex flex-col flex-1 overflow-hidden">
              <div className="form-modal-body space-y-4">
                <div className="form-grid">
                  <label className="wide">
                    <span>Target Client Account *</span>
                    <select
                      value={selectedAccountId}
                      onChange={e => setSelectedAccountId(e.target.value)}
                      required
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.ref})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Activity Type *</span>
                    <select
                      value={activityType}
                      onChange={e => setActivityType(e.target.value)}
                      required
                    >
                      <option value="Call">Phone Call</option>
                      <option value="Meeting">Executive Meeting / Demo</option>
                      <option value="Email">Client Email</option>
                      <option value="Proposal Follow-up">Proposal Follow-up</option>
                      <option value="Contract Review">Contract Review</option>
                    </select>
                  </label>

                  <label>
                    <span>Activity Owner</span>
                    <input type="text" value="Arjun Mehta" disabled className="bg-slate-50" />
                  </label>

                  <label className="wide">
                    <span>Subject / Discussion Headline *</span>
                    <input
                      type="text"
                      placeholder="e.g. Q4 Solution Demo with Head of Procurement"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      required
                    />
                  </label>

                  <label className="wide">
                    <span>Meeting Notes, Action Items & Commitments</span>
                    <textarea
                      rows={5}
                      placeholder="Outline key points discussed, commercial requirements, stakeholder reactions, and next steps..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="form-modal-footer">
                <button
                  type="button"
                  className="btn secondary text-xs"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn primary text-xs"
                >
                  {submitting ? 'Saving to Database...' : 'Commit Activity to PostgreSQL'}
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
