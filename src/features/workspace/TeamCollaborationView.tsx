import { useState } from 'react';
import {
  Users, MessageSquare, Send, Hash, Sparkles, Pin,
  Check, Paperclip, AtSign, Building2, Smile, ArrowRight,
  ShieldCheck, Clock
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { useCRM } from '../../store/CRMStore';

interface TeamMessage {
  id: string;
  channel: string;
  author: string;
  authorRole: string;
  avatar: string;
  time: string;
  text: string;
  dealTag?: string;
  likes: number;
  likedByMe?: boolean;
}

const INITIAL_MESSAGES: TeamMessage[] = [
  {
    id: 'tmsg-1',
    channel: '#deal-desk',
    author: 'Elena Rostova',
    authorRole: 'Enterprise Sales Director',
    avatar: 'ER',
    time: '10:32 AM',
    text: 'Flagging @Arjun Mehta for the NovaTech Solutions cloud expansion. Customer treasury agreed to standard Net 30 terms if we can provide a 15% 3-year commitment discount. Margin floor is protected at 68.4%.',
    dealTag: 'NovaTech Solutions (QTE-2026-081)',
    likes: 3,
  },
  {
    id: 'tmsg-2',
    channel: '#deal-desk',
    author: 'Arjun Mehta',
    authorRole: 'Senior Account Executive (Tenant Owner)',
    avatar: 'AM',
    time: '10:48 AM',
    text: 'Approved from commercial governance. I have updated the Quote discount table and submitted the formal CPQ proposal via the Governance center.',
    dealTag: 'NovaTech Solutions (QTE-2026-081)',
    likes: 4,
    likedByMe: true,
  },
  {
    id: 'tmsg-3',
    channel: '#customer-success',
    author: 'Marcus Clarke',
    authorRole: 'Commercial Inbound SDR',
    avatar: 'MC',
    time: '09:15 AM',
    text: 'Apex Global Logistics completed their second telematics pilot cycle. Fleet director confirmed zero dropped packets across 1,200 connected trucks. Implementation team is ready for production onboarding next Monday.',
    dealTag: 'Apex Global Logistics',
    likes: 5,
  },
  {
    id: 'tmsg-4',
    channel: '#general-deals',
    author: 'Sarah Reid',
    authorRole: 'Strategic Accounts Lead',
    avatar: 'SR',
    time: 'Yesterday at 4:20 PM',
    text: 'Big milestone! The Seiretsu Enterprise Group parent hierarchy review is officially completed in Customer 360. All subsidiary purchasing limits now aggregate cleanly to the root master agreement.',
    dealTag: 'Seiretsu Enterprise Group',
    likes: 7,
  },
];

const CHANNELS = [
  { id: '#general-deals', name: 'general-deals', desc: 'Platform-wide revenue updates and team announcements' },
  { id: '#deal-desk', name: 'deal-desk', desc: 'Pricing approvals, custom commercial terms and CPQ negotiation' },
  { id: '#customer-success', name: 'customer-success', desc: 'Implementation handoffs, onboarding milestones and NPS' },
  { id: '#executive-approvals', name: 'executive-approvals', desc: 'High-risk discounts, legal amendments and SLA riders' },
];

export function TeamCollaborationView() {
  const { addEvent, addAudit } = useCRM();

  const [activeChannel, setActiveChannel] = useState('#deal-desk');
  const [messages, setMessages] = useState<TeamMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [dealTag, setDealTag] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentChannelInfo = CHANNELS.find(c => c.id === activeChannel) || CHANNELS[0];
  const channelMessages = messages.filter(m => m.channel === activeChannel);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: TeamMessage = {
      id: `tmsg-${Date.now()}`,
      channel: activeChannel,
      author: 'Arjun Mehta',
      authorRole: 'Senior Account Executive (Tenant Owner)',
      avatar: 'AM',
      time: 'Just now',
      text: inputText.trim(),
      dealTag: dealTag.trim() || undefined,
      likes: 0,
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setDealTag('');

    addEvent('collaboration.message_posted', { ref: activeChannel }, `Posted update in ${activeChannel}`);
    addAudit('Team Collaboration Post', 'Arjun Mehta', `${activeChannel}: ${newMsg.text.slice(0, 60)}...`);
    notify(`Message posted to ${activeChannel}.`);
  };

  const handleLike = (id: string) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.id === id) {
          const liked = !m.likedByMe;
          return {
            ...m,
            likedByMe: liked,
            likes: liked ? m.likes + 1 : m.likes - 1,
          };
        }
        return m;
      })
    );
  };

  return (
    <div className="workspace-page">
      <SectionHeading
        eyebrow="COMMUNICATIONS & COLLABORATION / WORKSPACE"
        title="Team Collaboration & Deal Workspace"
        subtitle="Internal team messaging, cross-functional deal discussions, handoff notes, and executive collaboration."
        action={
          <span className="ai-mode-pill">
            <i />
            <span>Encrypted Internal Channel</span>
          </span>
        }
      />

      <div className="grid grid-cols-12 gap-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[640px]">
        {/* Left Side Channel Directory */}
        <div className="col-span-3 border-r border-slate-200 bg-slate-50/70 p-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2">
              Team Channels
            </span>
            <div className="space-y-1">
              {CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                    activeChannel === ch.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <Hash size={14} className={activeChannel === ch.id ? 'text-white' : 'text-slate-400'} />
                  <span>{ch.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2">
                Active Team Roster
              </span>
              <div className="space-y-2 px-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">AM</div>
                  <div>
                    <strong className="block text-slate-800 text-[11px]">Arjun Mehta</strong>
                    <span className="text-[9px] text-emerald-600 font-medium">● Online · Tenant Owner</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center">ER</div>
                  <div>
                    <strong className="block text-slate-800 text-[11px]">Elena Rostova</strong>
                    <span className="text-[9px] text-emerald-600 font-medium">● Online · Enterprise Sales</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center justify-center">MC</div>
                  <div>
                    <strong className="block text-slate-800 text-[11px]">Marcus Clarke</strong>
                    <span className="text-[9px] text-slate-400 font-medium">○ Away · SDR Lead</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 font-bold text-[10px] flex items-center justify-center">SR</div>
                  <div>
                    <strong className="block text-slate-800 text-[11px]">Sarah Reid</strong>
                    <span className="text-[9px] text-emerald-600 font-medium">● Online · Strategic Deals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-800 flex items-start gap-1.5">
            <ShieldCheck size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Tenant RLS enforced: Internal conversations are strictly isolated to BluePeak Innovations.</span>
          </div>
        </div>

        {/* Center / Right Messages Stream */}
        <div className="col-span-9 flex flex-col justify-between bg-white">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash size={18} className="text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{currentChannelInfo.name}</h3>
                <p className="text-[11px] text-slate-400">{currentChannelInfo.desc}</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {channelMessages.length} Messages
            </span>
          </div>

          {/* Messages Scroll */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {channelMessages.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No messages in this channel yet. Start the conversation below!
              </div>
            ) : (
              channelMessages.map(msg => (
                <div key={msg.id} className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center font-mono flex-shrink-0">
                    {msg.avatar}
                  </div>
                  <div className="flex-1 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900">{msg.author}</strong>
                        <span className="text-[10px] text-slate-400">· {msg.authorRole}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock size={11} /> {msg.time}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {msg.dealTag && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                        <Building2 size={11} /> {msg.dealTag}
                      </div>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => handleLike(msg.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                          msg.likedByMe
                            ? 'bg-blue-100 text-blue-700 font-bold'
                            : 'text-slate-500 hover:bg-slate-200/60'
                        }`}
                      >
                        👍 <span>{msg.likes}</span>
                      </button>
                      <button
                        onClick={() => notify(`Reply thread opened for ${msg.author}'s comment.`)}
                        className="text-slate-400 hover:text-blue-600 text-[10px] font-semibold"
                      >
                        Reply in thread
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Composer */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50/50">
            <div className="mb-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Tag deal / account (e.g. NovaTech Solutions)..."
                value={dealTag}
                onChange={e => setDealTag(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400">Optional deal context tag</span>
            </div>

            <div className="relative">
              <textarea
                rows={2}
                placeholder={`Post message to ${activeChannel}... Use @name to mention colleagues.`}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <button
                    type="button"
                    onClick={() => setInputText(prev => prev + ' @Elena Rostova ')}
                    className="hover:text-blue-600 px-1.5 py-0.5 rounded text-[11px] bg-white border border-slate-200"
                  >
                    @mention
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="btn primary small text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  <Send size={13} /> Post Message
                </button>
              </div>
            </div>
          </form>
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
