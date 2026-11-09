import { useState } from 'react';
import {
  Globe2, Ticket, FileText, BookOpen, Send,
  Check, ArrowRight, ShieldCheck, Clock, Plus, X
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { money } from '../../data/models';

export function CustomerPortalView() {
  const { records, create, addEvent, addAudit } = useCRM();

  const cases = records('cases');
  const invoices = records('invoices');

  const [customerOrg, setCustomerOrg] = useState('NovaTech Solutions');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketPriority, setTicketPriority] = useState('Medium');
  const [ticketCategory, setTicketCategory] = useState('Cloud Infrastructure');
  const [ticketDescription, setTicketDescription] = useState('');
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const clientCases = cases.filter(c => c.fields?.organization === customerOrg || true).slice(0, 4);
  const clientInvoices = invoices.filter(i => i.fields?.customer === customerOrg || true).slice(0, 3);

  const handleCreateTicket = () => {
    if (!ticketSubject.trim()) {
      notify('Ticket subject is required.');
      return;
    }
    const created = create(
      'cases',
      {
        title: ticketSubject.trim(),
        organization: customerOrg,
        priority: ticketPriority,
        category: ticketCategory,
        slaTier: 'Enterprise 4-Hour Response',
        contact: 'Customer Portal User',
        channel: 'Customer Portal',
        description: ticketDescription || 'Issue logged via customer self-service portal.',
      },
      {
        status: 'Open',
        owner: 'Tier-1 Support Queue',
      }
    );
    addEvent('case.created_from_portal', created, `New case opened via portal by ${customerOrg}: ${created.title}`);
    addAudit('Portal Case Submitted', customerOrg, created.ref);
    setShowNewTicketModal(false);
    setTicketSubject('');
    setTicketDescription('');
    notify(`Support ticket ${created.ref} created. Assigned to Tier-1 Queue.`);
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="CUSTOMER EXPERIENCE / SELF-SERVICE"
        title="Customer Self-Service Portal"
        subtitle="Customer-facing portal preview allowing enterprise clients to lodge tickets, track SLAs and inspect invoices."
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Viewing as:</span>
            <select
              value={customerOrg}
              onChange={e => setCustomerOrg(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 font-semibold text-slate-800 bg-white"
            >
              <option>NovaTech Solutions</option>
              <option>Apex Global Logistics</option>
              <option>Horizon Healthtech</option>
            </select>
          </div>
        }
      />

      {/* Customer Hero Banner */}
      <div className="panel p-6 bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white border-0 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <Globe2 size={15} />
              <span>Enterprise Client Access · {customerOrg}</span>
            </div>
            <h2 className="text-2xl font-black">Welcome to your SYVORIS Client Workspace</h2>
            <p className="text-xs text-slate-300">
              Manage your support tickets, review contract deliverables, access billing and verify SLA commitments.
            </p>
          </div>

          <button
            onClick={() => setShowNewTicketModal(true)}
            className="btn primary bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs py-2 px-4 flex items-center gap-1.5 self-start md:self-center"
          >
            <Plus size={14} />
            <span>Submit Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel p-4 bg-white border border-slate-200 hover:border-sky-300 transition-colors cursor-pointer" onClick={() => setShowNewTicketModal(true)}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <Ticket size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Open Service Ticket</h4>
              <p className="text-xs text-slate-500">Fast-track response with 4-hour SLA</p>
            </div>
          </div>
        </div>

        <div className="panel p-4 bg-white border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => notify('Invoices download package requested.')}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Invoices & Statements</h4>
              <p className="text-xs text-slate-500">Download billing statements & VAT receipts</p>
            </div>
          </div>
        </div>

        <div className="panel p-4 bg-white border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => notify('Opening self-service knowledge base.')}>
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
      </div>

      {/* Active Support Tickets */}
      <div className="panel overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Open Support Cases</h3>
            <p className="text-xs text-slate-500">Track resolution progress and engineer updates in real-time.</p>
          </div>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1"
          >
            <Plus size={13} />
            <span>New Ticket</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {clientCases.map(c => (
            <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{c.ref}</span>
                  <StatusPill status={c.status} />
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {c.fields?.priority || 'Medium'} Priority
                  </span>
                </div>
                <div className="font-semibold text-slate-800 text-sm">{c.title}</div>
                <div className="text-slate-500 text-[11px]">
                  Assigned: {c.owner || 'Tier-1 Support Team'} · SLA Target: 4h Resolution
                </div>
              </div>

              <button
                onClick={() => notify(`Viewing ticket conversation thread for ${c.ref}.`)}
                className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <span>View Updates</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

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
                    <option>High</option>
                    <option>Medium</option>
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
                    <option>User Permissions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  placeholder="Include timestamp, error message, steps to reproduce, or affected service..."
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

      {toast && (
        <div className="inline-toast">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
