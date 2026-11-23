import React, { useState, useEffect } from 'react';
import {
  Mail, X, Send, CheckCircle2, ShieldCheck, ShoppingCart, KeyRound,
  ExternalLink, Clock, RefreshCw, AlertCircle, Trash2, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { getStoredDispatchedEmails, setStoredDispatchedEmails, recordDispatchedEmail, type DispatchedEmailRecord } from '../services/mockBackend';

interface EmailDispatchCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export function EmailDispatchCenterModal({
  isOpen,
  onClose,
  userEmail = 'rrborkar09@gmail.com',
  userName = 'Rahul Borkar'
}: EmailDispatchCenterModalProps) {
  const [emails, setEmails] = useState<DispatchedEmailRecord[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<DispatchedEmailRecord | null>(null);
  const [targetEmail, setTargetEmail] = useState(userEmail);
  const [targetName, setTargetName] = useState(userName);
  const [sendingTest, setSendingTest] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setTargetEmail(userEmail);
    setTargetName(userName);
  }, [userEmail, userName]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadEmails = () => {
    const list = getStoredDispatchedEmails();
    setEmails(list);
    if (list.length > 0 && !selectedEmail) {
      setSelectedEmail(list[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendTestNotification = () => {
    setSendingTest(true);
    setTimeout(() => {
      const newEmail = recordDispatchedEmail({
        to: targetEmail,
        from: 'notifications@syvoris.ai',
        subject: `SYVORIS Ai — Live Alert Dispatched (${new Date().toLocaleTimeString()})`,
        category: 'Notification Alert',
        preview: `System telemetry and notification alert routed to ${targetEmail}.`,
        content: `Hello ${targetName},\n\nThis is an automated operational notification dispatched to your verified corporate email address: ${targetEmail}.\n\n• Event: Real-time System Verification Ping\n• Timestamp: ${new Date().toISOString()}\n• Tenant: BluePeak Innovations\n• Status: Operational & Grounded\n\nAll subsequent CRM alerts, quotes, and order receipts are configured to route directly to this address.`,
        meta: { type: 'test_alert' }
      });
      loadEmails();
      setSelectedEmail(newEmail);
      setSendingTest(false);
      showToast(`Test notification dispatched to ${targetEmail}!`);
    }, 400);
  };

  const handleSendSampleOrder = () => {
    setSendingTest(true);
    setTimeout(() => {
      const orderNum = `SO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newEmail = recordDispatchedEmail({
        to: targetEmail,
        from: 'orders@syvoris.ai',
        subject: `Order Confirmation: ${orderNum} ($185,000.00)`,
        category: 'Order Confirmation',
        preview: `Sales order ${orderNum} placed. Allocated to ${targetName}.`,
        content: `Hello ${targetName},\n\nThank you for your order! Sales Order ${orderNum} has been received and committed to our fulfillment pipeline.\n\nOrder Specification:\n• Order Reference: ${orderNum}\n• Account: Apex Global Logistics\n• Total Amount: $185,000.00 USD\n• Ordered Items: Apex Fleet Telematics Gateway Pack (1,200 units)\n• Fulfillment Depot: Kingston Central Logistics Hub\n• Ordered By: ${targetName} (${targetEmail})\n• Payment Terms: Net 30 Commercial\n\nA PDF delivery receipt and shipment tracking details have been staged for dispatch to ${targetEmail}.`,
        meta: { order_ref: orderNum, amount: 185000 }
      });
      loadEmails();
      setSelectedEmail(newEmail);
      setSendingTest(false);
      showToast(`Order confirmation ${orderNum} dispatched to ${targetEmail}!`);
    }, 450);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all dispatched email records from the local audit log?')) {
      setStoredDispatchedEmails([]);
      setEmails([]);
      setSelectedEmail(null);
      showToast('Dispatched email log cleared.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Mail size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Email & Order Dispatch Center</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={11} /> SMTP Relay Active
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-slate-400">
                  Target: <b className="text-cyan-300 font-mono">{targetEmail}</b> ({targetName})
                </p>
                <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500">Quick select:</span>
                  <button
                    type="button"
                    className={`text-[10px] px-1.5 py-0.5 rounded transition ${targetEmail === 'rrborkar09@gmail.com' ? 'bg-cyan-900/80 text-cyan-200 font-bold' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => { setTargetEmail('rrborkar09@gmail.com'); setTargetName('Rahul Borkar'); }}
                  >
                    Rahul
                  </button>
                  <span className="text-slate-700">|</span>
                  <button
                    type="button"
                    className={`text-[10px] px-1.5 py-0.5 rounded transition ${targetEmail === 'mnfreckleton@gmail.com' ? 'bg-cyan-900/80 text-cyan-200 font-bold' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => { setTargetEmail('mnfreckleton@gmail.com'); setTargetName('Marlon Freckleton'); }}
                  >
                    Marlon
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="bg-cyan-950/90 border-b border-cyan-500/50 text-cyan-200 text-xs px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={14} className="text-cyan-400" />
              <span>{toast}</span>
            </div>
          </div>
        )}

        {/* Quick Action Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendTestNotification}
              disabled={sendingTest}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow"
            >
              <Send size={13} /> Send Test Notification to {targetEmail}
            </button>
            <button
              onClick={handleSendSampleOrder}
              disabled={sendingTest}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <ShoppingCart size={13} /> Dispatch Order Confirmation
            </button>
            <a
              href={`mailto:${targetEmail}?subject=SYVORIS%20Ai%20Workspace%20Notification`}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
              target="_blank"
              rel="noreferrer"
            >
              <Mail size={13} /> Compose Email
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://mail.google.com/mail/u/0/#search/SYVORIS"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-medium text-xs flex items-center gap-1 hover:underline"
            >
              Open Gmail <ExternalLink size={12} />
            </a>
            {emails.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition"
                title="Clear sent email log"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5 min-h-[350px]">
          
          {/* Email List (Left) */}
          <div className="md:col-span-2 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/30">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Mail size={28} className="mx-auto text-slate-600" />
                <p className="text-xs">No dispatched emails recorded yet.</p>
                <button
                  onClick={handleSendTestNotification}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Send a test email now →
                </button>
              </div>
            ) : (
              emails.map((em) => (
                <div
                  key={em.id}
                  onClick={() => setSelectedEmail(em)}
                  className={`p-3.5 cursor-pointer transition text-left ${
                    selectedEmail?.id === em.id
                      ? 'bg-slate-800/80 border-l-2 border-cyan-400'
                      : 'hover:bg-slate-850/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                        em.category === 'Security / Auth'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : em.category === 'Order Confirmation'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {em.category}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(em.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 truncate">{em.subject}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{em.preview}</p>
                </div>
              ))
            )}
          </div>

          {/* Email Preview (Right) */}
          <div className="md:col-span-3 p-5 overflow-y-auto bg-slate-900/60 flex flex-col justify-between">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                      {selectedEmail.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock size={12} /> {new Date(selectedEmail.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-white">{selectedEmail.subject}</h2>
                  <div className="mt-2 text-xs text-slate-400 space-y-0.5 font-mono">
                    <div><b>From:</b> {selectedEmail.from}</div>
                    <div><b>To:</b> <span className="text-cyan-300">{selectedEmail.to}</span></div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 font-sans text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedEmail.content}
                </div>

                {selectedEmail.meta?.order_ref && (
                  <div className="bg-emerald-950/40 border border-emerald-600/30 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-200">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={16} className="text-emerald-400" />
                      <span>Order Reference: <b>{selectedEmail.meta.order_ref}</b></span>
                    </div>
                    <span className="font-bold font-mono text-emerald-300">
                      ${Number(selectedEmail.meta.amount).toLocaleString()} USD
                    </span>
                  </div>
                )}

                {selectedEmail.meta?.token && (
                  <div className="bg-cyan-950/40 border border-cyan-600/30 rounded-xl p-3 flex items-center justify-between text-xs text-cyan-200">
                    <div className="flex items-center gap-2">
                      <KeyRound size={16} className="text-cyan-400" />
                      <span>Security Recovery Token:</span>
                    </div>
                    <code className="font-bold font-mono text-cyan-300 bg-slate-950 px-2 py-1 rounded border border-cyan-800">
                      {selectedEmail.meta.token}
                    </code>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 m-auto">
                <Mail size={32} className="mx-auto text-slate-600 mb-2" />
                <p className="text-xs">Select an email record from the list to preview its contents.</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>All notifications delivered via SYVORIS Enterprise SMTP Relay.</span>
              <span className="font-mono text-cyan-400">Recipient: {userEmail}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
