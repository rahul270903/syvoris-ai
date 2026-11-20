import { useState, useMemo } from 'react';
import {
  Ticket, Plus, Search, Filter, CheckCircle2, AlertTriangle,
  Clock, Shield, User, Building2, MessageSquare, ArrowRight,
  MoreVertical, Check, X, RefreshCw, Layers, Sparkles, Send, FileText
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface InternalTicket {
  id: string;
  ref: string;
  subject: string;
  category: 'Network & Infrastructure' | 'ERP & Billing' | 'Software & Access' | 'Hardware & Depot' | 'Workstation IT';
  priority: 'Critical' | 'High' | 'Normal' | 'Low';
  department: string;
  requesterName: string;
  requesterEmail: string;
  assignedTo: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdDate: string;
  slaRemaining: string;
  description: string;
  resolutionNotes?: string;
  comments: { author: string; time: string; text: string }[];
}

const INITIAL_INTERNAL_TICKETS: InternalTicket[] = [
  {
    id: 'tkt-1',
    ref: 'TKT-INT-1042',
    subject: 'VPN Gateway Handshake Timeout for Kingston Field Splicing Team',
    category: 'Network & Infrastructure',
    priority: 'High',
    department: 'Field Engineering & Splicing',
    requesterName: 'Marcus Vance',
    requesterEmail: 'marcus.v@bluepeak.internal',
    assignedTo: 'David Sterling (IT Security)',
    status: 'In Progress',
    createdDate: 'Today 09:15',
    slaRemaining: '2h 15m remaining',
    description: 'Field technicians unable to establish WireGuard IPSec tunnel from mobile tablets while at Spanish Town splice enclosures. Subnet 10.240.8.0/24 is rejecting handshake.',
    comments: [
      { author: 'David Sterling', time: '09:40', text: 'Inspecting firewall NAT rules on edge gateway. MTU size was clamped to 1420; deploying patch.' },
      { author: 'Marcus Vance', time: '10:05', text: 'Confirmed 2 technicians reconnected successfully. Awaiting test from third crew.' }
    ]
  },
  {
    id: 'tkt-2',
    ref: 'TKT-INT-1041',
    subject: 'Radium ERP General Ledger Double-Posting Sync Exception',
    category: 'ERP & Billing',
    priority: 'Critical',
    department: 'Commercial Compliance & Billing',
    requesterName: 'Aisha Patel',
    requesterEmail: 'aisha.p@bluepeak.internal',
    assignedTo: 'Michael Chen (Integration Architect)',
    status: 'In Progress',
    createdDate: 'Today 08:30',
    slaRemaining: '45m remaining',
    description: 'Invoice INV-2026-0819 for Cyberdyne Systems returned duplicate idempotency token during nightly sync. General ledger batch halted pending reconciliation.',
    comments: [
      { author: 'Michael Chen', time: '08:50', text: 'Isolated Radium webhook payload. Sync queue locked for safety; executing transaction rollback on ledger entry #8491.' }
    ]
  },
  {
    id: 'tkt-3',
    ref: 'TKT-INT-1040',
    subject: 'Figma Enterprise Seat Provisioning & SSO Link for Commercial AE Team',
    category: 'Software & Access',
    priority: 'Normal',
    department: 'Sales & Business Development',
    requesterName: 'Maya Lin',
    requesterEmail: 'maya.l@bluepeak.internal',
    assignedTo: 'Tariq Mansour (IT Support)',
    status: 'Resolved',
    createdDate: 'Yesterday 14:20',
    slaRemaining: 'Met SLA (Resolved in 1.2h)',
    description: 'Need Figma Organization license assigned to maya.l@bluepeak.internal and linked to Okta SAML 2.0 tenant for CPQ slide deck presentations.',
    resolutionNotes: 'SCIM group membership updated in Azure AD. User logged in and verified license access.',
    comments: [
      { author: 'Tariq Mansour', time: '15:30', text: 'Assigned license seat from BluePeak enterprise pool. Verified SAML claims.' }
    ]
  },
  {
    id: 'tkt-4',
    ref: 'TKT-INT-1039',
    subject: 'Replacement OTDR Optical Fiber Fusion Splicer Battery Pack',
    category: 'Hardware & Depot',
    priority: 'Normal',
    department: 'Network Infrastructure',
    requesterName: 'Carlos Ortiz',
    requesterEmail: 'carlos.o@bluepeak.internal',
    assignedTo: 'Marcus Vance (Depot Lead)',
    status: 'Open',
    createdDate: 'Yesterday 11:00',
    slaRemaining: '6h remaining',
    description: 'Fujikura 90S+ battery pack BTR-15 is failing to hold charge past 40 arc cycles. Need backup pack from Kingston Logistics Hub before highway backbone deployment.',
    comments: []
  },
  {
    id: 'tkt-5',
    ref: 'TKT-INT-1038',
    subject: 'Multi-Factor Hardware FIDO2 Security Key Replacement',
    category: 'Software & Access',
    priority: 'High',
    department: 'Commercial Operations',
    requesterName: 'Sarah Jenkins',
    requesterEmail: 'sarah.j@bluepeak.internal',
    assignedTo: 'David Sterling (IT Security)',
    status: 'Resolved',
    createdDate: 'Nov 18, 2026',
    slaRemaining: 'Met SLA (Resolved in 45m)',
    description: 'Hardware YubiKey 5C NFC USB-C token was physically damaged during transit. Require new key registered to global admin IAM profile.',
    resolutionNotes: 'Enrolled new YubiKey 5C token via hardware verification protocol. Revoked previous token certificate.',
    comments: []
  },
  {
    id: 'tkt-6',
    ref: 'TKT-INT-1037',
    subject: 'Workstation Ubuntu 24.04 LTS Docker Environment Configuration',
    category: 'Workstation IT',
    priority: 'Low',
    department: 'AI Architecture',
    requesterName: 'Arjun Mehta',
    requesterEmail: 'arjun.mehta@bluepeak.internal',
    assignedTo: 'Michael Chen (DevOps)',
    status: 'Closed',
    createdDate: 'Nov 17, 2026',
    slaRemaining: 'Completed',
    description: 'Configure NVIDIA CUDA 12.4 container toolkit and local Llama 3 70B test environment on engineering workstation #04.',
    resolutionNotes: 'NVIDIA container runtime configured. Docker compose environment verified.',
    comments: []
  }
];

export function InternalTicketsView() {
  const { addAudit, addEvent } = useCRM();
  const [tickets, setTickets] = useState<InternalTicket[]>(INITIAL_INTERNAL_TICKETS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<InternalTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [toast, setToast] = useState('');

  // Form states
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<InternalTicket['category']>('Network & Infrastructure');
  const [priority, setPriority] = useState<InternalTicket['priority']>('High');
  const [department, setDepartment] = useState('Field Engineering & Splicing');
  const [description, setDescription] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch =
        t.ref.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.requesterName.toLowerCase().includes(search.toLowerCase()) ||
        t.assignedTo.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const openCount = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' || t.priority === 'High').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  const handleUpdateStatus = (ticketId: string, nextStatus: InternalTicket['status']) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: nextStatus };
      }
      return t;
    }));

    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: nextStatus } : null);
    }

    notify(`Ticket ${ticketId} status updated to ${nextStatus}.`);
    addAudit?.('Service Desk Ticket Updated', `Updated ticket status to ${nextStatus}`, 'Internal Service Desk');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTicket) return;

    const comment = {
      author: 'Arjun Mehta (Tenant Owner)',
      time: 'Just now',
      text: newCommentText.trim()
    };

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return { ...t, comments: [...t.comments, comment] };
      }
      return t;
    }));

    setSelectedTicket(prev => prev ? { ...prev, comments: [...prev.comments, comment] } : null);
    setNewCommentText('');
    notify('Comment added to internal ticket thread.');
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const newTicket: InternalTicket = {
      id: `tkt-${Date.now().toString().slice(-4)}`,
      ref: `TKT-INT-${Math.floor(1043 + Math.random() * 50)}`,
      subject: subject.trim(),
      category: category,
      priority: priority,
      department: department,
      requesterName: 'Arjun Mehta',
      requesterEmail: 'arjun.mehta@bluepeak.internal',
      assignedTo: 'IT Help Desk (Tariq Mansour)',
      status: 'Open',
      createdDate: 'Just now',
      slaRemaining: priority === 'Critical' ? '1h remaining' : '4h remaining',
      description: description || 'Operational incident reported by staff.',
      comments: []
    };

    setTickets(prev => [newTicket, ...prev]);
    setShowCreateModal(false);
    setSubject('');
    setDescription('');
    notify(`Ticket ${newTicket.ref} logged and dispatched to IT Help Desk queue.`);
    addAudit?.('Internal Ticket Created', `Created ${newTicket.ref}: ${newTicket.subject}`, 'Internal Service Desk');
  };

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
        eyebrow="SERVICE DESK / INTERNAL OPERATIONS"
        title="Internal Tickets & Operational Incident Center"
        subtitle="Manage employee-reported technical incidents, workstation provisioning, ERP sync exceptions, and internal infrastructure requests."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Raise Internal Ticket</span>
            </button>
          </div>
        }
      />

      {/* 5-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Total Tickets</span>
            <Ticket className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{tickets.length} Incidents</div>
          <div className="text-[11px] text-slate-500 mt-1">Operational registry</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Open & In-Flight</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{openCount} Active</div>
          <div className="text-[11px] text-amber-500/80 mt-1">Awaiting resolution</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Critical / High Severity</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">{criticalCount} High Risk</div>
          <div className="text-[11px] text-rose-500/80 mt-1">Priority SLA timers active</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Resolved This Cycle</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{resolvedCount} Completed</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">98.6% within target SLA</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Average Resolution</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">1.8 Hours</div>
          <div className="text-[11px] text-purple-400/80 mt-1">First-response: 12 mins</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tickets by ID, subject, requester, or assignee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Tickets Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Ticket ID & Subject</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-4">Requester & Dept</th>
                <th className="py-3 px-4">Assigned Engineer</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">SLA Countdown</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTickets.map(t => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                    selectedTicket?.id === t.id ? 'bg-slate-800/50' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-cyan-400 font-bold text-xs">{t.ref}</span>
                    <div className="font-semibold text-white mt-0.5 line-clamp-1 max-w-sm">{t.subject}</div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded">
                      {t.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      t.priority === 'Critical'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        : t.priority === 'High'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                        : t.priority === 'Normal'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}>
                      {t.priority}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{t.requesterName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{t.department}</div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {t.assignedTo}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      t.status === 'Resolved' || t.status === 'Closed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : t.status === 'In Progress'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                        : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                    }`}>
                      {t.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-[11px]">
                    <span className="text-slate-300 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {t.slaRemaining}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT TICKET SLIDE-OVER DRAWER */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full shadow-2xl flex flex-col justify-between overflow-hidden">
            <div>
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold text-sm">{selectedTicket.ref}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      selectedTicket.priority === 'Critical'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                    }`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5">{selectedTicket.subject}</h3>
                </div>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-220px)]">
                {/* Status Switcher Bar */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Current Lifecycle Status:</span>
                  <div className="flex items-center gap-1.5">
                    {(['Open', 'In Progress', 'Resolved', 'Closed'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          selectedTicket.status === st
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Requester Identity</span>
                    <span className="font-semibold text-white mt-0.5 block">{selectedTicket.requesterName}</span>
                    <span className="text-slate-400 text-[10px]">{selectedTicket.requesterEmail}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block">Assigned Engineer</span>
                    <span className="font-semibold text-cyan-400 mt-0.5 block">{selectedTicket.assignedTo}</span>
                    <span className="text-slate-400 text-[10px]">Tier-2 Engineering Escalation</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500 text-[11px] block">Department</span>
                    <span className="font-medium text-slate-300 mt-0.5 block">{selectedTicket.department}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500 text-[11px] block">SLA Commitment</span>
                    <span className="font-mono text-amber-400 mt-0.5 block">{selectedTicket.slaRemaining}</span>
                  </div>
                </div>

                {/* Incident Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Technical Scope & Reproduction Notes
                  </label>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Resolution Notes if any */}
                {selectedTicket.resolutionNotes && (
                  <div className="bg-emerald-950/30 border border-emerald-800/50 p-3.5 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolution Verification Sign-off:
                    </span>
                    <p className="text-emerald-200/90">{selectedTicket.resolutionNotes}</p>
                  </div>
                )}

                {/* Comments / Activity Feed */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Engineering Handover Notes & Thread ({selectedTicket.comments.length})</span>
                  </div>

                  <div className="space-y-2">
                    {selectedTicket.comments.map((c, i) => (
                      <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white">{c.author}</span>
                          <span className="text-slate-500">{c.time}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Comment Form Input */}
            <form onSubmit={handleAddComment} className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2">
              <input
                type="text"
                placeholder="Post engineering update or resolution note..."
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Ticket className="w-5 h-5 text-cyan-400" />
              <span>Raise Internal Operational Incident</span>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Incident Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fiber splice OTDR reflection out of spec on Line 4"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Network & Infrastructure">Network & Infrastructure</option>
                    <option value="ERP & Billing">ERP & Billing</option>
                    <option value="Software & Access">Software & Access</option>
                    <option value="Hardware & Depot">Hardware & Depot</option>
                    <option value="Workstation IT">Workstation IT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical (1h SLA)</option>
                    <option value="High">High (4h SLA)</option>
                    <option value="Normal">Normal (8h SLA)</option>
                    <option value="Low">Low (24h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Affected Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Field Engineering & Splicing">Field Engineering & Splicing</option>
                  <option value="Commercial Compliance & Billing">Commercial Compliance & Billing</option>
                  <option value="Sales & Business Development">Sales & Business Development</option>
                  <option value="Customer Care & Support">Customer Care & Support</option>
                  <option value="IT Security & IAM">IT Security & IAM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Detailed Technical Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide error codes, affected hostnames, IP subnets, or hardware serials..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Submit Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
