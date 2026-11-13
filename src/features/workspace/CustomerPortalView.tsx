import { useState, useEffect } from 'react';
import {
  Globe2, Ticket, FileText, BookOpen, Send,
  Check, ArrowRight, ShieldCheck, Clock, Plus, X, MessageSquare, Calendar
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import {
  api,
  CaseItem,
  KnowledgeArticleItem,
  AppointmentTypeItem
} from '../../services/api';

export function CustomerPortalView() {
  const [liveCases, setLiveCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Modals
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketPriority, setTicketPriority] = useState('Normal');
  const [ticketCategory, setTicketCategory] = useState('Technical Support');
  const [ticketDescription, setTicketDescription] = useState('');

  // Knowledge Base modal
  const [showKBModal, setShowKBModal] = useState(false);
  const [portalKB, setPortalKB] = useState<KnowledgeArticleItem[]>([]);
  const [kbSearch, setKbSearch] = useState('');

  // Appointment modal
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptTypes, setApptTypes] = useState<AppointmentTypeItem[]>([]);
  const [selectedApptType, setSelectedApptType] = useState<string>('');
  const [apptName, setApptName] = useState('Elena Rostova');
  const [apptEmail, setApptEmail] = useState('elena.rostova@novatech.example');
  const [apptDate, setApptDate] = useState('2026-11-20');
  const [apptTime, setApptTime] = useState('14:00');
  const [apptNotes, setApptNotes] = useState('');

  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const fetchCases = async () => {
    try {
      const res = await api.listPortalCases();
      if (res) setLiveCases(res);
    } catch {
      // Fallback
      const fallback = await api.listCases({ limit: 10 });
      if (fallback?.items) setLiveCases(fallback.items);
    }
  };

  const fetchKnowledge = async () => {
    try {
      const res = await api.listPortalKnowledge();
      if (res) setPortalKB(res);
    } catch {
      // Ignore
    }
  };

  const fetchApptTypes = async () => {
    try {
      const res = await api.listAppointmentTypes(true);
      if (res) {
        setApptTypes(res);
        if (res.length > 0) setSelectedApptType(res[0].id);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleOpenKB = () => {
    fetchKnowledge();
    setShowKBModal(true);
  };

  const handleOpenAppts = () => {
    fetchApptTypes();
    setShowApptModal(true);
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim()) {
      notify('Ticket subject is required.');
      return;
    }

    try {
      const c = await api.createPortalCase({
        subject: ticketSubject.trim(),
        description: ticketDescription || 'Issue logged via customer self-service portal.',
        priority: ticketPriority,
        category: ticketCategory,
        channel: 'Portal',
      });
      notify(`Support ticket ${c.ref} submitted to queue.`);
      await fetchCases();
    } catch (err: any) {
      notify(err?.message || 'Failed to submit ticket.');
    }

    setShowNewTicketModal(false);
    setTicketSubject('');
    setTicketDescription('');
  };

  const handleAddComment = async () => {
    if (!selectedCase || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await api.addPortalCaseComment(selectedCase.id, { message: newComment.trim() });
      notify('Reply sent to support engineers.');
      setNewComment('');
      // Refresh selected case
      const updated = await api.getPortalCase(selectedCase.id);
      setSelectedCase(updated);
      await fetchCases();
    } catch (err: any) {
      notify(err?.message || 'Failed to send comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleBookAppt = async () => {
    if (!selectedApptType) {
      notify('Please select an appointment type.');
      return;
    }
    try {
      const startTime = new Date(`${apptDate}T${apptTime}:00Z`).toISOString();
      const endTime = new Date(new Date(startTime).getTime() + 30 * 60000).toISOString();
      const appt = await api.bookCustomerAppointment({
        appointment_type_id: selectedApptType,
        customer_name: apptName,
        customer_email: apptEmail,
        start_time: startTime,
        end_time: endTime,
        notes: apptNotes || 'Booked via customer portal.'
      });
      notify(`Appointment ${appt.ref} confirmed for ${apptDate} at ${apptTime}!`);
      setShowApptModal(false);
    } catch (err: any) {
      notify(err?.message || 'Failed to book appointment.');
    }
  };

  const filteredKB = portalKB.filter(a =>
    !kbSearch || a.title.toLowerCase().includes(kbSearch.toLowerCase()) || a.category.toLowerCase().includes(kbSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="CUSTOMER EXPERIENCE / SELF-SERVICE"
        title="Customer Self-Service Portal"
        subtitle="Secure enterprise client portal for submitting tickets, reviewing SLA compliance, and browsing knowledge guides."
      />

      {/* Hero Banner */}
      <div className="panel p-6 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 text-white border-0 shadow-lg rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Globe2 size={16} />
              <span>Enterprise Client Workspace · NovaTech Solutions</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Welcome to your SYVORIS Client Workspace</h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Track open technical support cases in real-time, communicate directly with assigned engineering leads, inspect verified SLA target deadlines, and book consultations.
            </p>
          </div>

          <button
            onClick={() => setShowNewTicketModal(true)}
            className="btn primary bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs py-2.5 px-4 flex items-center gap-2 self-start md:self-center shadow-md rounded-xl transition-all"
          >
            <Plus size={15} />
            <span>Open New Support Case</span>
          </button>
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setShowNewTicketModal(true)}
          className="panel p-4 bg-white border border-slate-200 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <Ticket size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Lodge Support Case</h4>
              <p className="text-xs text-slate-500">Fast-track response with 4h SLA deadline</p>
            </div>
          </div>
        </div>

        <div
          onClick={handleOpenKB}
          className="panel p-4 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <BookOpen size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Knowledge Base</h4>
              <p className="text-xs text-slate-500">Explore API guides & troubleshooting</p>
            </div>
          </div>
        </div>

        <div
          onClick={handleOpenAppts}
          className="panel p-4 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Book Architecture Review</h4>
              <p className="text-xs text-slate-500">Schedule 1-on-1 session with Solutions Architect</p>
            </div>
          </div>
        </div>
      </div>

      {/* Open Support Cases Table */}
      <div className="panel overflow-hidden border border-slate-200 bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Support Cases</h3>
            <p className="text-xs text-slate-500">Live operational status and responses from assigned support engineers.</p>
          </div>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1"
          >
            <Plus size={13} />
            <span>New Case</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {liveCases.length > 0 ? (
            liveCases.map(c => (
              <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-600">{c.ref}</span>
                    <StatusPill status={c.status} />
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      c.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                      c.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {c.priority} Priority
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-medium">{c.category}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{c.subject}</div>
                  <div className="text-slate-500 text-[11px] flex items-center gap-2">
                    <span>Assigned: {c.assigned_user_name || c.assigned_queue || 'Tier-1 Support Team'}</span>
                    <span className="text-slate-300">·</span>
                    <span>SLA Deadline: {c.sla_resolution_deadline ? c.sla_resolution_deadline.slice(0, 16).replace('T', ' ') : 'Standard 24h'}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCase(c)}
                  className="btn secondary text-xs py-2 px-3 flex items-center gap-1.5 self-start sm:self-center font-bold text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100"
                >
                  <MessageSquare size={13} />
                  <span>View Discussion ({(c.comments || []).length})</span>
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No support tickets currently open for your account.
            </div>
          )}
        </div>
      </div>

      {/* Case Discussion Thread Slide-over / Modal */}
      {selectedCase && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setSelectedCase(null)}>
          <div className="modal-card max-w-2xl w-full">
            <div className="modal-header border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-600 text-xs">{selectedCase.ref}</span>
                  <StatusPill status={selectedCase.status} />
                  <span className="text-xs text-slate-500">[{selectedCase.priority}]</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedCase.subject}</h3>
              </div>
              <button className="icon-close" onClick={() => setSelectedCase(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                <div className="font-bold text-slate-900 mb-1">Original Issue Description:</div>
                <p className="whitespace-pre-wrap">{selectedCase.description || 'No description provided.'}</p>
              </div>

              {/* Public comments thread */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Public Updates & Engineer Replies
                </div>
                {(selectedCase.comments || []).length > 0 ? (
                  (selectedCase.comments || []).map((cm) => (
                    <div key={cm.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{cm.author_name || 'Support Staff'}</span>
                        <span className="text-slate-400 text-[11px]">{cm.created_at.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{cm.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No public comments on this ticket yet.</p>
                )}
              </div>

              {/* Reply box */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700 block">Post Client Reply</label>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Type an update or additional troubleshooting details..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="btn primary text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowNewTicketModal(false)}>
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="eyebrow">CLIENT SUPPORT</span>
                <h2>Submit Enterprise Support Request</h2>
              </div>
              <button className="icon-close" onClick={() => setShowNewTicketModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Issue Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Latency anomaly on production API endpoint /v1/events"
                  value={ticketSubject}
                  onChange={e => setTicketSubject(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={e => setTicketPriority(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  >
                    <option>Critical</option>
                    <option>High</option>
                    <option>Normal</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={e => setTicketCategory(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  >
                    <option>Cloud Infrastructure</option>
                    <option>Integration & Webhooks</option>
                    <option>Billing & Invoices</option>
                    <option>Technical Support</option>
                    <option>User Permissions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  placeholder="Include error codes, reproduction steps, or relevant timestamps..."
                  value={ticketDescription}
                  onChange={e => setTicketDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="modal-footer flex items-center justify-end gap-2">
              <button className="btn secondary text-xs" onClick={() => setShowNewTicketModal(false)}>
                Cancel
              </button>
              <button className="btn primary text-xs" onClick={handleCreateTicket}>
                Submit to Support Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Base Modal */}
      {showKBModal && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowKBModal(false)}>
          <div className="modal-card max-w-3xl w-full">
            <div className="modal-header border-b border-slate-200">
              <div>
                <span className="eyebrow">SELF-SERVICE</span>
                <h2>Knowledge Base & Documentation</h2>
              </div>
              <button className="icon-close" onClick={() => setShowKBModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-4 max-h-[60vh] overflow-y-auto">
              <input
                type="text"
                placeholder="Search articles by title or keyword..."
                value={kbSearch}
                onChange={e => setKbSearch(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />

              <div className="space-y-3">
                {filteredKB.length > 0 ? (
                  filteredKB.map(a => (
                    <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 text-sm">{a.title}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">{a.category}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{a.summary || a.content}</p>
                      <div className="text-[11px] text-slate-400">
                        {a.view_count} views · {a.helpful_count} clients found this helpful
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No matching articles found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Booking Modal */}
      {showApptModal && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowApptModal(false)}>
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="eyebrow">SELF-SERVICE</span>
                <h2>Book Specialist Consultation</h2>
              </div>
              <button className="icon-close" onClick={() => setShowApptModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Consultation Type *</label>
                <select
                  value={selectedApptType}
                  onChange={e => setSelectedApptType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                >
                  {apptTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    value={apptDate}
                    onChange={e => setApptDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Time (UTC) *</label>
                  <input
                    type="time"
                    value={apptTime}
                    onChange={e => setApptTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Your Name *</label>
                <input
                  type="text"
                  value={apptName}
                  onChange={e => setApptName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Work Email *</label>
                <input
                  type="email"
                  value={apptEmail}
                  onChange={e => setApptEmail(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Agenda / Topics</label>
                <textarea
                  rows={2}
                  value={apptNotes}
                  onChange={e => setApptNotes(e.target.value)}
                  placeholder="What topics would you like to cover?"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="modal-footer flex items-center justify-end gap-2">
              <button className="btn secondary text-xs" onClick={() => setShowApptModal(false)}>
                Cancel
              </button>
              <button className="btn primary text-xs" onClick={handleBookAppt}>
                Confirm Booking
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
