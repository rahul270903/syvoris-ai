import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox, Mail, MessageSquare, Phone, Send, Search,
  ArrowRight, Check, Star, Paperclip, Building2,
  Sparkles, RefreshCw
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

type Channel = 'all' | 'email' | 'chat' | 'sms' | 'call';

interface Message {
  id: string;
  sender: string;
  email: string;
  phone?: string;
  org: string;
  channel: 'email' | 'chat' | 'sms' | 'call';
  subject: string;
  snippet: string;
  body: string;
  time: string;
  unread: boolean;
  starred: boolean;
  replies?: Array<{ sender: string; time: string; body: string; isUser: boolean }>;
}

const initialMessages: Message[] = [
  {
    id: 'msg-1',
    sender: 'Marcus Vance',
    email: 'm.vance@novatech.example',
    phone: '+1 (555) 019-2831',
    org: 'NovaTech Solutions',
    channel: 'email',
    subject: 'Proposal Review - Enterprise AI Cloud Migration',
    snippet: 'We reviewed the draft proposal and have two minor questions regarding the 99.99% SLA commitment...',
    body: 'Hi Team,\n\nWe reviewed the draft proposal (QTE-2026-081) and have two minor questions regarding the 99.99% SLA commitment and the secondary failover latency guarantees.\n\nCould we schedule a 15-minute sync with your solutions architect tomorrow afternoon?\n\nBest regards,\nMarcus Vance\nVP of Technology, NovaTech Solutions',
    time: '10:24 AM',
    unread: true,
    starred: true,
    replies: [
      {
        sender: 'Demo User (SYVORIS)',
        time: '10:45 AM',
        body: 'Hi Marcus, thanks for reaching out. Our principal architect is available tomorrow at 2:30 PM EST. I will send over a calendar invite shortly.',
        isUser: true,
      }
    ]
  },
  {
    id: 'msg-2',
    sender: 'Elena Rostova',
    email: 'elena.rostova@apexglobal.example',
    phone: '+1 (555) 482-9102',
    org: 'Apex Global Logistics',
    channel: 'chat',
    subject: 'Website Live Chat: API Rate Limits Question',
    snippet: 'Visitor initiated chat on /pricing page. Asking about enterprise tier webhook limits...',
    body: '[Chat Session #CS-8921]\nVisitor Elena Rostova on pricing page:\n"Hello, does the Enterprise plan support real-time Kafka event streaming, or is it REST webhook callbacks only?"\n\nAI Agent answered with docs snippet. Visitor requested contact with enterprise rep.',
    time: '09:15 AM',
    unread: true,
    starred: false,
  },
  {
    id: 'msg-3',
    sender: 'Devon Wright',
    email: 'dwright@horizonhealth.example',
    phone: '+1 (555) 773-1049',
    org: 'Horizon Healthtech',
    channel: 'call',
    subject: 'Call Log: Contractual Procurement Review',
    snippet: 'Outbound call 14m 22s. Customer confirmed BAA compliance annex was signed by legal...',
    body: 'Call Details:\nDirection: Outbound\nDuration: 14 mins 22 secs\nDisposition: Connected / Positive\n\nSummary:\nDevon confirmed that the HIPAA Business Associate Agreement (BAA) has been countersigned by their General Counsel. Awaiting final purchase order PO-2026-992 from procurement by Friday.',
    time: 'Yesterday',
    unread: false,
    starred: true,
  },
  {
    id: 'msg-4',
    sender: 'Sarah Jenkins',
    email: 'sjenkins@aerodynamics.example',
    phone: '+1 (555) 839-4420',
    org: 'AeroDynamics Ltd',
    channel: 'sms',
    subject: 'SMS: Scheduled Quarterly Business Review Confirmation',
    snippet: 'Opt-in confirmed. Replying "YES" to confirm QBR on Thursday at 10 AM EST...',
    body: '[SMS Thread]\nSYVORIS: "Hi Sarah, confirming your QBR with AeroDynamics on Thursday at 10:00 AM EST. Reply YES to confirm or RESCHEDULE to adjust."\n\nSarah Jenkins: "YES, confirmed. Looking forward to reviewing our expansion metrics."',
    time: 'Nov 7',
    unread: false,
    starred: false,
  },
  {
    id: 'msg-5',
    sender: 'Vikram Mehta',
    email: 'vmehta@quantumcore.example',
    phone: '+1 (555) 601-3829',
    org: 'QuantumCore Systems',
    channel: 'email',
    subject: 'Renewal Notice & 3-Year Multi-Year Lock Inquire',
    snippet: 'Our current subscription expires in 65 days. Could you provide 3-year multi-year discounting options?...',
    body: 'Dear Account Team,\n\nOur current subscription expires in 65 days. We are preparing our 2027 fiscal budget and would like to lock in pricing for 3 years if an additional 12-15% multi-year discount is feasible.\n\nPlease share revised pricing proposals.\n\nRegards,\nVikram Mehta\nChief Procurement Officer',
    time: 'Nov 6',
    unread: false,
    starred: true,
  }
];

export function UnifiedInboxView() {
  const { addEvent, addAudit } = useCRM();
  const navigate = useNavigate();

  const [channel, setChannel] = useState<Channel>('all');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedId, setSelectedId] = useState<string>(initialMessages[0].id);
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const filtered = useMemo(() => {
    return messages.filter(m => {
      const matchChannel = channel === 'all' || m.channel === channel;
      const matchQuery = [m.sender, m.email, m.org, m.subject, m.snippet, m.body]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchChannel && matchQuery;
    });
  }, [messages, channel, search]);

  const active = messages.find(m => m.id === selectedId) || messages[0];

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, starred: !m.starred } : m))
    );
  };

  const markRead = (id: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, unread: false } : m))
    );
    setSelectedId(id);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !active) return;
    const newReply = {
      sender: 'Demo User (SYVORIS Rep)',
      time: 'Just now',
      body: replyText.trim(),
      isUser: true,
    };
    setMessages(prev =>
      prev.map(m =>
        m.id === active.id
          ? { ...m, replies: [...(m.replies || []), newReply] }
          : m
      )
    );
    addEvent(
      'communication.replied',
      { ref: active.id },
      `Simulated ${active.channel.toUpperCase()} response sent to ${active.sender} (${active.org})`
    );
    addAudit(
      'Simulated Message Dispatched',
      'Demo User',
      `${active.channel.toUpperCase()} to ${active.email}`
    );
    notify(`Simulated response dispatched to ${active.sender} via ${active.channel.toUpperCase()}.`);
    setReplyText('');
  };

  const channelIcon = (c: Channel | 'chat' | 'call') => {
    switch (c) {
      case 'email': return <Mail size={15} />;
      case 'chat': return <MessageSquare size={15} />;
      case 'sms': return <MessageSquare size={15} className="text-emerald-500" />;
      case 'call': return <Phone size={15} className="text-amber-500" />;
      default: return <Inbox size={15} />;
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="COMMUNICATIONS & COLLABORATION / UNIFIED INBOX"
        title="Unified Customer Inbox"
        subtitle="Manage omni-channel customer communications across Email, Live Chat, SMS and Call Logs in one synchronized console."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => notify('Inbox synchronized with local simulation stream.')}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <RefreshCw size={13} />
              <span>Sync Channels</span>
            </button>
            <span className="ai-mode-pill">
              <i />
              <span>Omni-Channel Stream</span>
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[640px]">
        {/* Left Side Channels Column */}
        <div className="col-span-12 md:col-span-4 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3 border-b border-slate-200 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages, senders, accounts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {(['all', 'email', 'chat', 'sms', 'call'] as Channel[]).map(c => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                    channel === c
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No communications found for this filter.
              </div>
            ) : (
              filtered.map(m => {
                const isSelected = m.id === active?.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => markRead(m.id)}
                    className={`p-3 cursor-pointer transition-colors relative ${
                      isSelected ? 'bg-sky-50/80 border-l-4 border-l-sky-600' : 'hover:bg-slate-100/70'
                    } ${m.unread ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded bg-white shadow-2xs border border-slate-100">
                          {channelIcon(m.channel)}
                        </span>
                        <span className="font-medium text-slate-800">{m.sender}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{m.time}</span>
                        <button
                          onClick={e => toggleStar(m.id, e)}
                          className="text-slate-300 hover:text-amber-400"
                        >
                          <Star
                            size={13}
                            className={m.starred ? 'fill-amber-400 text-amber-400' : ''}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-700 truncate font-medium">{m.subject}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{m.snippet}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded">
                        <Building2 size={10} />
                        {m.org}
                      </span>
                      {m.unread && (
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side Message Reader & Composer */}
        <div className="col-span-12 md:col-span-8 lg:col-span-8 flex flex-col bg-white">
          {active ? (
            <>
              {/* Message Header */}
              <div className="p-4 border-b border-slate-200 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                      {channelIcon(active.channel)}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{active.subject}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                    <span>
                      <b>From:</b> {active.sender} &lt;{active.email}&gt;
                    </span>
                    {active.phone && <span>· {active.phone}</span>}
                    <button
                      onClick={() => navigate('/customers/360')}
                      className="text-sky-600 hover:underline flex items-center gap-0.5"
                    >
                      <Building2 size={11} />
                      {active.org}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <StatusPill status={active.channel.toUpperCase()} />
                  <div className="text-[11px] text-slate-400 mt-1">{active.time}</div>
                </div>
              </div>

              {/* Message Body Stream */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {active.body}
                </div>

                {/* Simulated Thread Replies */}
                {active.replies?.map((reply, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 ml-6 text-xs text-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>{reply.sender}</span>
                      <span className="text-[10px]">{reply.time}</span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{reply.body}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Reply via {active.channel.toUpperCase()}</span>
                    <span className="text-[10px] text-slate-400">Consent verified · Encrypted local log</span>
                  </div>
                  <button
                    onClick={() => setReplyText('Thank you for reaching out. We have logged this request and our specialist team is reviewing the specifics.')}
                    className="text-[11px] text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <Sparkles size={11} />
                    Insert AI Quick Reply
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder={`Compose ${active.channel} reply to ${active.sender}...`}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white shadow-2xs"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <button className="hover:text-slate-600 p-1 rounded" title="Attach file">
                        <Paperclip size={14} />
                      </button>
                    </div>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-4 disabled:opacity-50"
                    >
                      <Send size={13} />
                      <span>Send Response</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a message to view conversation thread.
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="inline-toast">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
