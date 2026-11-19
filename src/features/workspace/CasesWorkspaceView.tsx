import React, { useState, useEffect } from 'react';
import {
  Ticket, Plus, Search, Filter, RefreshCw, AlertTriangle,
  Clock, CheckCircle2, ChevronRight, MessageSquare, ArrowRight,
  ShieldCheck, User, Building2, Send, Check, X, Tag, Inbox
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, CaseItem, AccountItem } from '../../services/api';

export function CasesWorkspaceView() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_progress' | 'awaiting' | 'resolved' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Detail Drawer
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formSubject, setFormSubject] = useState('');
  const [formAccount, setFormAccount] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formPriority, setFormPriority] = useState('Normal');
  const [formCategory, setFormCategory] = useState('Technical Support');
  const [formChannel, setFormChannel] = useState('Portal');
  const [formDescription, setFormDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, accsRes] = await Promise.all([
        api.listCases({ limit: 100 }),
        api.listAccounts({ limit: 100 })
      ]);
      setCases(casesRes.items || []);
      setAccounts(accsRes.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load live cases from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusTransition = async (caseId: string, newStatus: string, resolution?: string) => {
    try {
      const updated = await api.transitionCase(caseId, {
        target_status: newStatus,
        resolution_summary: resolution || undefined,
        notes: `Status updated to ${newStatus} via Cases Workspace`
      });
      setCases(prev => prev.map(c => c.id === caseId ? updated : c));
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase(updated);
      }
      notify(`Case transitioned to ${newStatus}.`);
    } catch (err: any) {
      notify(`Transition failed: ${err?.message || 'Error updating status'}`);
    }
  };

  const handleAddComment = async () => {
    if (!selectedCase || !newComment.trim()) return;
    setCommentSubmitting(true);
    try {
      const comm = await api.addCaseComment(selectedCase.id, {
        message: newComment.trim(),
        is_internal: isInternalComment
      });
      const updated: CaseItem = {
        ...selectedCase,
        comments: [...(selectedCase.comments || []), comm]
      };
      setCases(prev => prev.map(c => c.id === selectedCase.id ? updated : c));
      setSelectedCase(updated);
      setNewComment('');
      notify('Comment recorded.');
    } catch (err: any) {
      notify(`Comment failed: ${err?.message || 'Error posting comment'}`);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) {
      setCreateError('Subject and description are mandatory.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const selectedAcc = accounts.find(a => a.id === formAccount || a.name === formAccount);
      const newCase = await api.createCase({
        subject: formSubject.trim(),
        account_id: selectedAcc ? selectedAcc.id : undefined,
        contact_name: formContactName.trim() || undefined,
        priority: formPriority,
        category: formCategory,
        channel: formChannel,
        description: formDescription.trim(),
        status: 'New',
        assigned_user_name: 'Tier-1 Support Team'
      });
      setCases(prev => [newCase, ...prev]);
      setShowCreateModal(false);
      setFormSubject('');
      setFormAccount('');
      setFormContactName('');
      setFormContactEmail('');
      setFormPriority('Normal');
      setFormCategory('Technical Support');
      setFormDescription('');
      notify(`Case ${newCase.ref} created successfully.`);
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create case.');
    } finally {
      setCreating(false);
    }
  };

  // Filter logic
  const filteredCases = cases.filter(c => {
    if (activeTab === 'new' && c.status !== 'New') return false;
    if (activeTab === 'in_progress' && c.status !== 'In Progress') return false;
    if (activeTab === 'awaiting' && c.status !== 'Awaiting Customer') return false;
    if (activeTab === 'resolved' && c.status !== 'Resolved') return false;
    if (activeTab === 'closed' && c.status !== 'Closed') return false;

    if (priorityFilter !== 'all' && c.priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    if (categoryFilter !== 'all' && c.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRef = c.ref.toLowerCase().includes(q);
      const matchSub = c.subject.toLowerCase().includes(q);
      const matchAcc = (c.account_name || '').toLowerCase().includes(q);
      const matchCat = (c.category || '').toLowerCase().includes(q);
      if (!matchRef && !matchSub && !matchAcc && !matchCat) return false;
    }
    return true;
  });

  const countNew = cases.filter(c => c.status === 'New').length;
  const countInProgress = cases.filter(c => c.status === 'In Progress').length;
  const countAwaiting = cases.filter(c => c.status === 'Awaiting Customer').length;
  const countCritical = cases.filter(c => c.priority === 'Critical' || c.priority === 'High').length;
  const countResolved = cases.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <SectionHeading
        eyebrow="CUSTOMER SERVICE & OPERATIONS / INCIDENT WORKSPACE"
        title="Cases Management"
        subtitle="Manage end-to-end customer support incidents, SLA resolution targets, agent handoffs, and verification."
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
              <span>New Case</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active In-Flight Cases</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Ticket size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{countNew + countInProgress + countAwaiting}</span>
            <span className="text-xs text-slate-500">of {cases.length} total tickets</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span className="text-blue-600 font-semibold">{countNew} new</span> ·
            <span className="text-amber-600 font-semibold">{countInProgress} in progress</span>
          </div>
        </div>

        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">High / Critical Urgency</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{countCritical}</span>
            <span className="text-xs text-rose-700 font-semibold">elevated SLA priority</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Requires response within 1-2 hours</div>
        </div>

        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Customer</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-700">{countAwaiting}</span>
            <span className="text-xs text-purple-600 font-medium">pending verification</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">SLA clock paused</div>
        </div>

        <div className="panel p-5 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved & Closed</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{countResolved}</span>
            <span className="text-xs text-emerald-700 font-medium">successful closures</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">100% verified resolution</div>
        </div>
      </div>

      {/* Main Workspace Panel */}
      <div className="panel bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 px-5 pt-3 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'All Cases', count: cases.length },
              { id: 'new', label: 'New / Unassigned', count: countNew },
              { id: 'in_progress', label: 'In Progress', count: countInProgress },
              { id: 'awaiting', label: 'Awaiting Customer', count: countAwaiting },
              { id: 'resolved', label: 'Resolved', count: countResolved },
              { id: 'closed', label: 'Closed', count: cases.filter(c => c.status === 'Closed').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs font-bold pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2.5 pb-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cases, accounts, subjects..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 bg-white w-56 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 text-slate-800 bg-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 text-slate-800 bg-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Categories</option>
              <option value="api integration">API Integration</option>
              <option value="cloud infrastructure">Cloud Infrastructure</option>
              <option value="billing & invoicing">Billing & Invoicing</option>
              <option value="authentication / sso">Authentication / SSO</option>
              <option value="technical support">Technical Support</option>
            </select>
          </div>
        </div>

        {/* Cases Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Case Reference</th>
                <th className="py-3 px-4">Subject & Description</th>
                <th className="py-3 px-4">Account / Contact</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">SLA Deadline</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Specialist</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length > 0 ? (
                filteredCases.map(c => {
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-600">
                        {c.ref}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                          {c.subject}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {c.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{c.account_name || 'Standard Account'}</div>
                        <div className="text-[11px] text-slate-400">{c.contact_name || 'Direct User'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.priority === 'Critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          c.priority === 'High' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          c.priority === 'Normal' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.sla_breached ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                            <AlertTriangle size={12} /> Breached
                          </span>
                        ) : c.sla_resolution_deadline ? (
                          <span className="text-slate-600 font-medium text-[11px] flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {c.sla_resolution_deadline.slice(11, 16)} UTC
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Active SLA</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">
                          {c.assigned_user_name || c.assigned_queue || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        {c.status === 'New' && (
                          <button
                            onClick={() => handleStatusTransition(c.id, 'In Progress')}
                            className="btn primary py-1 px-2.5 text-[11px] bg-sky-600 hover:bg-sky-500 text-white font-bold rounded shadow-none"
                          >
                            Investigate
                          </button>
                        )}
                        {c.status === 'In Progress' && (
                          <button
                            onClick={() => handleStatusTransition(c.id, 'Resolved', 'Resolved by support engineer.')}
                            className="btn primary py-1 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-none"
                          >
                            Resolve
                          </button>
                        )}
                        {c.status === 'Awaiting Customer' && (
                          <button
                            onClick={() => handleStatusTransition(c.id, 'In Progress')}
                            className="btn secondary py-1 px-2.5 text-[11px] text-slate-700 bg-white border border-slate-300 font-bold rounded"
                          >
                            Resume
                          </button>
                        )}
                        {c.status === 'Resolved' && (
                          <button
                            onClick={() => handleStatusTransition(c.id, 'Closed')}
                            className="btn secondary py-1 px-2.5 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded"
                          >
                            Close
                          </button>
                        )}
                        {c.status === 'Closed' && (
                          <span className="text-slate-400 font-medium text-[11px]">Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Ticket size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No support cases found</p>
                    <p className="text-xs text-slate-400 mt-1">Adjust filters or create a new support case above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details Drawer */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {selectedCase.ref}
                  </span>
                  <StatusPill status={selectedCase.status} />
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    selectedCase.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                    selectedCase.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedCase.priority}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 line-clamp-1">{selectedCase.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Lifecycle Advancement Bar */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Progression</span>
                <div className="flex items-center gap-1.5">
                  {['New', 'In Progress', 'Awaiting Customer', 'Resolved', 'Closed'].map((st, i) => {
                    const isCurrent = selectedCase.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusTransition(selectedCase.id, st)}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded text-center transition-all ${
                          isCurrent
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-sky-300'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Case Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <span className="text-slate-400 font-medium">Customer Account</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedCase.account_name || 'Standard Account'}</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <span className="text-slate-400 font-medium">Contact Person</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedCase.contact_name || 'Direct Client'}</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <span className="text-slate-400 font-medium">Category</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedCase.category || 'Technical Support'}</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <span className="text-slate-400 font-medium">Intake Channel</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedCase.channel || 'Portal'}</div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Description</span>
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 text-xs text-slate-800 leading-relaxed">
                  {selectedCase.description}
                </div>
              </div>

              {/* Resolution Notes (if present or when resolving) */}
              {selectedCase.resolution_summary ? (
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Resolution Summary</span>
                  </div>
                  <p className="text-emerald-800">{selectedCase.resolution_summary}</p>
                </div>
              ) : selectedCase.status === 'In Progress' && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Record Resolution</span>
                  <textarea
                    rows={2}
                    value={resolutionSummary}
                    onChange={e => setResolutionSummary(e.target.value)}
                    placeholder="Enter root cause and resolution steps to resolve ticket..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleStatusTransition(selectedCase.id, 'Resolved', resolutionSummary)}
                    disabled={!resolutionSummary.trim()}
                    className="btn primary py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded"
                  >
                    Resolve Ticket with Summary
                  </button>
                </div>
              )}

              {/* Comment Thread */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversation & Activity History</span>
                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {selectedCase.comments && selectedCase.comments.length > 0 ? (
                    selectedCase.comments.map((cm, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg text-xs space-y-1 border ${
                          cm.is_internal
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold">{cm.author_name}</span>
                          <span className="text-slate-400">{cm.is_internal ? 'Internal Staff Note' : 'Client Message'}</span>
                        </div>
                        <p className="leading-relaxed">{cm.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic py-2">No notes or comments logged yet.</div>
                  )}
                </div>

                {/* Add Comment Input */}
                <div className="space-y-2 pt-2">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Type an internal note or reply to customer..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={e => setIsInternalComment(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-0"
                      />
                      <span>Internal staff note only</span>
                    </label>
                    <button
                      onClick={handleAddComment}
                      disabled={commentSubmitting || !newComment.trim()}
                      className="btn primary py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded flex items-center gap-1"
                    >
                      <Send size={12} />
                      <span>{commentSubmitting ? 'Posting...' : 'Post Note'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setSelectedCase(null)}
                className="btn secondary py-1.5 px-4 text-xs text-slate-700 bg-white border border-slate-300 rounded font-semibold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">New Incident</span>
                <h3 className="text-base font-black text-slate-900">Create Support Case</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-5 space-y-4 text-xs">
              {createError && (
                <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {createError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Subject / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={e => setFormSubject(e.target.value)}
                  placeholder="e.g. Ingestion Webhook 504 Gateway Timeout"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Account</label>
                  <select
                    value={formAccount}
                    onChange={e => setFormAccount(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Select Account --</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={formContactName}
                    onChange={e => setFormContactName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Critical">Critical (P1)</option>
                    <option value="High">High (P2)</option>
                    <option value="Normal">Normal (P3)</option>
                    <option value="Low">Low (P4)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Technical Support">Technical Support</option>
                    <option value="API Integration">API Integration</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Billing & Invoicing">Billing & Invoicing</option>
                    <option value="Authentication / SSO">Authentication / SSO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Channel</label>
                  <select
                    value={formChannel}
                    onChange={e => setFormChannel(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Portal">Customer Portal</option>
                    <option value="Email">Email</option>
                    <option value="Webform">Webform</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Provide complete error traces, reproduction steps, and impact..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn secondary py-2 px-3 text-slate-700 bg-white border border-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn primary py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={14} />
                  <span>{creating ? 'Creating...' : 'Create Support Case'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}