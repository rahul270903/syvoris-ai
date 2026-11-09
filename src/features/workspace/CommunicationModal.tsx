import { useState, useMemo } from 'react';
import {
  Activity, CalendarDays, Check, CheckCircle2, Clock3, Globe2, Mail, MessageCircle,
  Phone, Send, ShieldAlert, ShieldCheck, Sparkles, User, Users, X
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { makeId, type CRMRecord } from '../../data/models';

export type CommType = 'email' | 'call' | 'sms' | 'chat' | 'meeting';

export function CommunicationModal({
  type,
  prefillTo,
  prefillContact,
  onClose,
  onLogged,
}: {
  type: CommType;
  prefillTo?: string;
  prefillContact?: string;
  onClose: () => void;
  onLogged: (msg: string) => void;
}) {
  const { records, create, update, addAudit, addEvent } = useCRM();
  const contacts = records('contacts');
  const orgs = records('organizations');

  // Active contact selection
  const [selectedContactEmail, setSelectedContactEmail] = useState(prefillTo || contacts[0]?.fields.email || '');
  const selectedContact = useMemo(() => {
    return contacts.find(c => c.fields.email === selectedContactEmail || c.title === prefillContact) || contacts[0];
  }, [contacts, selectedContactEmail, prefillContact]);

  // Email State
  const [emailSubject, setEmailSubject] = useState('Follow-up regarding Enterprise Fiber Connectivity Proposal');
  const [emailTemplate, setEmailTemplate] = useState('custom');
  const [emailBody, setEmailBody] = useState(
    `Hi ${selectedContact?.fields.firstName || 'there'},\n\nThank you for taking the time to discuss your regional connectivity requirements. I've prepared our initial proposal and would welcome 15 minutes this week to review the fiber build timeline.\n\nBest regards,\nDemo User · SYVORIS Ai`
  );

  // Call State
  const [callDirection, setCallDirection] = useState<'Inbound' | 'Outbound'>('Outbound');
  const [callDuration, setCallDuration] = useState('04:45');
  const [callOutcome, setCallOutcome] = useState('Connected · Discussed Proposal');
  const [callNotes, setCallNotes] = useState('Customer confirmed budget allocation for Q4. Requested revised quote with SLA guarantee.');
  const [recordingUrl, setRecordingUrl] = useState(`https://voice.syvoris.internal/rec/${Date.now().toString().slice(-6)}.wav`);

  // SMS State
  const [smsBody, setSmsBody] = useState(
    `SYVORIS Ai: Hi ${selectedContact?.fields.firstName || 'Customer'}, your regional fiber survey report has been generated. View summary at portal.syvoris.example`
  );

  // Live Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'visitor' | 'agent'; text: string; time: string }>>([
    { sender: 'visitor', text: 'Hi, we are evaluating 10Gbps dedicated fiber for our Montego Bay office. Can someone assist with pricing?', time: '10:41 AM' },
    { sender: 'agent', text: 'Hello! I can certainly connect you with our connectivity specialist. Could you confirm your organization name?', time: '10:42 AM' },
    { sender: 'visitor', text: 'Caribbean Fiber Solutions regional operations.', time: '10:42 AM' },
  ]);
  const [chatReply, setChatReply] = useState('');

  // Meeting State
  const [meetingTitle, setMeetingTitle] = useState('Technical Scope & Quote Review');
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [meetingAgenda, setMeetingAgenda] = useState('1. Fiber routing verification\n2. Equipment delivery milestones\n3. SLA and maintenance terms review');

  // Consent Check
  const consentStatus = selectedContact?.fields.consent || 'Pending';
  const hasVoiceConsent = consentStatus.toLowerCase().includes('phone') || consentStatus.toLowerCase().includes('voice');
  const hasSMSConsent = consentStatus.toLowerCase().includes('sms') || consentStatus.toLowerCase().includes('phone');
  const hasEmailConsent = consentStatus.toLowerCase().includes('email') && !consentStatus.toLowerCase().includes('opted out');

  const handleSendEmail = () => {
    const targetOrg = orgs.find(o => o.title.toLowerCase() === selectedContact?.fields.organization?.toLowerCase());
    const interaction = create('interactions', {
      subject: emailSubject,
      type: 'Email',
      channel: 'Email',
      relatedTo: selectedContact?.fields.organization || selectedContact?.title || 'Customer',
      date: new Date().toISOString().slice(0, 10),
      summary: emailBody,
      consent: selectedContact?.fields.consent || 'Verified',
    }, {
      status: 'Completed',
      links: {
        contacts: selectedContact ? [selectedContact.id] : [],
        organizations: targetOrg ? [targetOrg.id] : [],
      },
    });

    if (targetOrg) {
      update('organizations', targetOrg.id, {
        links: { interactions: [...new Set([...(targetOrg.links.interactions || []), interaction.id])] },
      }, 'Logged sent email to customer timeline');
    }

    addAudit('Simulated email logged', 'Demo User', `To: ${selectedContact?.fields.email} · ${emailSubject}`);
    addEvent('communication.email_sent', interaction, `Email sent to ${selectedContact?.fields.email}`);
    onLogged(`Email to ${selectedContact?.fields.email} recorded in customer timeline.`);
    onClose();
  };

  const handleLogCall = () => {
    const targetOrg = orgs.find(o => o.title.toLowerCase() === selectedContact?.fields.organization?.toLowerCase());
    const interaction = create('interactions', {
      subject: `${callDirection} call with ${selectedContact?.title || 'Customer'}`,
      type: 'Call',
      channel: 'Phone',
      relatedTo: selectedContact?.fields.organization || selectedContact?.title || 'Customer',
      date: new Date().toISOString().slice(0, 10),
      duration: callDuration,
      outcome: callOutcome,
      recordingUrl,
      summary: callNotes,
      consent: 'Voice contact verified',
    }, {
      status: 'Completed',
      links: {
        contacts: selectedContact ? [selectedContact.id] : [],
        organizations: targetOrg ? [targetOrg.id] : [],
      },
    });

    if (targetOrg) {
      update('organizations', targetOrg.id, {
        links: { interactions: [...new Set([...(targetOrg.links.interactions || []), interaction.id])] },
      }, 'Logged telephone call to customer timeline');
    }

    addAudit('Telephone call logged', 'Demo User', `${callDirection} · ${selectedContact?.title} · ${callOutcome}`);
    addEvent('communication.call_logged', interaction, `${callDirection} call with ${selectedContact?.title}`);
    onLogged(`Call with ${selectedContact?.title} logged to activity history.`);
    onClose();
  };

  const handleSendSMS = () => {
    if (!hasSMSConsent) {
      alert('Cannot send SMS: Contact communication preference does not permit SMS messaging under current consent rules.');
      return;
    }
    const targetOrg = orgs.find(o => o.title.toLowerCase() === selectedContact?.fields.organization?.toLowerCase());
    const interaction = create('interactions', {
      subject: `SMS to ${selectedContact?.fields.phone || 'Customer'}`,
      type: 'SMS',
      channel: 'SMS Gateway',
      relatedTo: selectedContact?.fields.organization || selectedContact?.title || 'Customer',
      date: new Date().toISOString().slice(0, 10),
      summary: smsBody,
      consent: selectedContact?.fields.consent || 'SMS Permitted',
    }, {
      status: 'Completed',
      links: {
        contacts: selectedContact ? [selectedContact.id] : [],
        organizations: targetOrg ? [targetOrg.id] : [],
      },
    });

    addAudit('SMS message logged', 'Demo User', `To: ${selectedContact?.fields.phone}`);
    addEvent('communication.sms_sent', interaction, `SMS dispatched to ${selectedContact?.fields.phone}`);
    onLogged(`SMS to ${selectedContact?.fields.phone} recorded in customer timeline.`);
    onClose();
  };

  const handleScheduleMeeting = () => {
    const targetOrg = orgs.find(o => o.title.toLowerCase() === selectedContact?.fields.organization?.toLowerCase());
    const interaction = create('interactions', {
      subject: meetingTitle,
      type: 'Meeting',
      channel: 'Calendar Sync (Outlook/Google)',
      date: meetingDate,
      time: meetingTime,
      relatedTo: selectedContact?.fields.organization || selectedContact?.title || 'Customer',
      summary: `Scheduled meeting with ${selectedContact?.title}.\nAgenda:\n${meetingAgenda}`,
    }, {
      status: 'Scheduled',
      links: {
        contacts: selectedContact ? [selectedContact.id] : [],
        organizations: targetOrg ? [targetOrg.id] : [],
      },
    });

    addAudit('Customer meeting scheduled', 'Demo User', `${meetingTitle} on ${meetingDate}`);
    addEvent('meeting.scheduled', interaction, `Meeting scheduled for ${meetingDate}`);
    onLogged(`Meeting scheduled with ${selectedContact?.title}.`);
    onClose();
  };

  const handleConvertChatToLead = () => {
    const lead = create('leads', {
      firstName: 'Webchat',
      lastName: 'Visitor',
      company: 'Caribbean Fiber Inquirer',
      email: 'visitor@chat.example',
      source: 'Website Live Chat',
      industry: 'Technology',
      score: '75',
      priority: 'High',
      consent: 'Chat contact permitted',
      nextActivity: 'Follow up on 10Gbps inquiry',
      description: 'Lead converted from website live chat session: 10Gbps dedicated fiber request.',
    }, { status: 'New', score: 75 });

    addAudit('Chat converted to lead', 'Demo User', lead.ref);
    addEvent('chat.converted_to_lead', lead, `Live chat converted to lead ${lead.ref}`);
    onLogged(`Live chat converted into qualified lead ${lead.ref}!`);
    onClose();
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="comm-modal panel">
        {/* Modal Header */}
        <div className="form-modal-head">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              {type === 'email' ? <Mail size={20}/> :
               type === 'call' ? <Phone size={20}/> :
               type === 'sms' ? <MessageCircle size={20}/> :
               type === 'chat' ? <Globe2 size={20}/> :
               <CalendarDays size={20}/>}
            </span>
            <div>
              <span className="eyebrow">COMMUNICATIONS & COLLABORATION SIMULATOR</span>
              <h2>
                {type === 'email' ? 'Compose Customer Email' :
                 type === 'call' ? 'Log Telephone Call & Audio Reference' :
                 type === 'sms' ? 'Send Customer SMS' :
                 type === 'chat' ? 'Website Live Chat Session' :
                 'Schedule Customer Meeting'}
              </h2>
              <p>Simulated channel interface. Events and interactions auto-post to customer memory timeline.</p>
            </div>
          </div>
          <button className="icon-close" onClick={onClose}><X size={18}/></button>
        </div>

        {/* Modal Body */}
        <div className="form-modal-body space-y-4">
          {/* Recipient Selector (for email, call, sms, meeting) */}
          {type !== 'chat' && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-400"/>
                <label className="text-xs font-bold text-slate-700">Recipient / Contact:</label>
                <select
                  className="text-xs p-1.5 rounded border border-slate-300 bg-white"
                  value={selectedContactEmail}
                  onChange={(e) => setSelectedContactEmail(e.target.value)}
                >
                  {contacts.map(c => (
                    <option key={c.id} value={c.fields.email}>
                      {c.title} — {c.fields.organization} ({c.fields.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <ShieldCheck size={14} className="text-emerald-600"/>
                <span className="text-slate-600 font-semibold">{consentStatus}</span>
              </div>
            </div>
          )}

          {/* EMAIL COMPOSER */}
          {type === 'email' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 text-xs p-2.5 rounded border border-slate-300"
                  placeholder="Subject line"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
                <select
                  className="text-xs p-2 rounded border border-slate-300 bg-white"
                  value={emailTemplate}
                  onChange={(e) => {
                    setEmailTemplate(e.target.value);
                    if (e.target.value === 'quote') {
                      setEmailSubject('Commercial Proposal: Regional Fiber Infrastructure Deployment');
                      setEmailBody(`Hi ${selectedContact?.fields.firstName},\n\nPlease find attached the official commercial quote QT-2026-00112 for your review. We have reflected the 8% volume incentive as agreed.\n\nBest regards,\nDemo User`);
                    }
                  }}
                >
                  <option value="custom">Custom Email</option>
                  <option value="quote">Template: Quote Delivery</option>
                  <option value="sla">Template: SLA Case Update</option>
                </select>
              </div>
              <textarea
                rows={7}
                className="w-full text-xs p-3 rounded border border-slate-300 font-sans"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck size={14} className="text-slate-400"/>
                <span>Simulated delivery. Message is attached to the contact's timeline and domain events fabric.</span>
              </div>
            </div>
          )}

          {/* CALL LOGGER */}
          {type === 'call' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Direction
                  <select
                    className="p-2 border border-slate-300 rounded text-xs bg-white"
                    value={callDirection}
                    onChange={(e) => setCallDirection(e.target.value as any)}
                  >
                    <option>Outbound</option>
                    <option>Inbound</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Duration
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={callDuration}
                    onChange={(e) => setCallDuration(e.target.value)}
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Call Outcome
                  <select
                    className="p-2 border border-slate-300 rounded text-xs bg-white"
                    value={callOutcome}
                    onChange={(e) => setCallOutcome(e.target.value)}
                  >
                    <option>Connected · Discussed Proposal</option>
                    <option>Left Voicemail</option>
                    <option>Gatekeeper Refusal</option>
                    <option>Busy / No Answer</option>
                  </select>
                </label>
              </div>
              <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                AI Call Summary & Discussion Notes
                <textarea
                  rows={4}
                  className="p-2.5 border border-slate-300 rounded text-xs"
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                />
              </label>
              <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                Recording URL Reference (Simulated Cloud Telephony)
                <input
                  className="p-2 border border-slate-300 rounded text-xs font-mono text-slate-600 bg-slate-50"
                  value={recordingUrl}
                  readOnly
                />
              </label>
            </div>
          )}

          {/* SMS SENDER */}
          {type === 'sms' && (
            <div className="space-y-3">
              {!hasSMSConsent && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                  <ShieldAlert size={16}/>
                  <b>Consent Warning:</b> Contact consent does not permit commercial SMS messaging. Sending will be restricted.
                </div>
              )}
              <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                Recipient Phone
                <input
                  className="p-2 border border-slate-300 rounded text-xs font-mono"
                  value={selectedContact?.fields.phone || '+1 876 555 0182'}
                  readOnly
                />
              </label>
              <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                SMS Text Body ({smsBody.length} / 160 chars)
                <textarea
                  rows={4}
                  className="p-2.5 border border-slate-300 rounded text-xs"
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                />
              </label>
            </div>
          )}

          {/* WEBSITE LIVE CHAT */}
          {type === 'chat' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div><b>Visitor IP:</b> 190.83.42.10 (Kingston, JM)</div>
                <div><b>Active Page:</b> /solutions/enterprise-fiber</div>
                <div><b>Session Duration:</b> 04:12</div>
              </div>
              <div className="h-48 overflow-y-auto p-3 bg-white rounded border border-slate-200 space-y-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === 'visitor' ? 'items-start' : 'items-end'}`}>
                    <div className={`p-2 rounded-lg text-xs max-w-sm ${msg.sender === 'visitor' ? 'bg-slate-100 text-slate-800' : 'bg-blue-600 text-white'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">{msg.time}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 text-xs p-2 border border-slate-300 rounded"
                  placeholder="Type simulated agent reply..."
                  value={chatReply}
                  onChange={(e) => setChatReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatReply.trim()) {
                      setChatMessages([...chatMessages, { sender: 'agent', text: chatReply, time: 'Just now' }]);
                      setChatReply('');
                    }
                  }}
                />
                <button
                  className="btn secondary"
                  onClick={() => {
                    if (chatReply.trim()) {
                      setChatMessages([...chatMessages, { sender: 'agent', text: chatReply, time: 'Just now' }]);
                      setChatReply('');
                    }
                  }}
                >
                  Send
                </button>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button className="btn primary small" onClick={handleConvertChatToLead}>
                  <Sparkles size={13}/> Convert Chat to Lead
                </button>
                <span className="text-xs text-slate-400">Websocket session mock connected</span>
              </div>
            </div>
          )}

          {/* MEETING SCHEDULER */}
          {type === 'meeting' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                Meeting Title *
                <input
                  className="p-2 border border-slate-300 rounded text-xs"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Scheduled Date *
                  <input
                    type="date"
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Start Time
                  <input
                    type="time"
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                  />
                </label>
              </div>
              <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                Agenda & AI Notes Protocol
                <textarea
                  rows={4}
                  className="p-2.5 border border-slate-300 rounded text-xs"
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="form-modal-footer flex justify-between items-center">
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <div className="flex gap-2">
            {type === 'email' && (
              <button className="btn primary" onClick={handleSendEmail}>
                <Send size={15}/> Send Email & Log Timeline
              </button>
            )}
            {type === 'call' && (
              <button className="btn primary" onClick={handleLogCall}>
                <Phone size={15}/> Log Call & Attach Recording
              </button>
            )}
            {type === 'sms' && (
              <button className="btn primary" onClick={handleSendSMS} disabled={!hasSMSConsent}>
                <MessageCircle size={15}/> Send SMS
              </button>
            )}
            {type === 'meeting' && (
              <button className="btn primary" onClick={handleScheduleMeeting}>
                <CalendarDays size={15}/> Confirm Meeting & Sync Calendar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
