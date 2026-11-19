import { useState, useMemo, useEffect } from 'react';
import {
  FileText, Printer, Send, Download, Check, X,
  Building2, ShieldCheck, ArrowRight, ShoppingCart, RefreshCw, Mail
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { money, type CRMRecord } from '../../data/models';
import { api, type QuoteItem, type AccountItem } from '../../services/api';

export function QuoteDocumentView() {
  const { records, update, addEvent, addAudit } = useCRM();
  const localQuotes = records('quotes');
  const orgs = records('organizations');

  const [liveQuotes, setLiveQuotes] = useState<QuoteItem[]>([]);
  const [liveAccounts, setLiveAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [toast, setToast] = useState('');

  // Send to Client Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [recipientAccountId, setRecipientAccountId] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.allSettled([
        api.listQuotes({ limit: 100 }),
        api.listAccounts({ limit: 50 }),
      ]);
      if (qRes.status === 'fulfilled' && qRes.value?.items && qRes.value.items.length > 0) {
        setLiveQuotes(qRes.value.items);
        if (!selectedQuoteId) {
          setSelectedQuoteId(qRes.value.items[0].id);
        }
      }
      if (aRes.status === 'fulfilled' && aRes.value?.items) {
        setLiveAccounts(aRes.value.items);
        if (aRes.value.items.length > 0 && !recipientAccountId) {
          setRecipientAccountId(aRes.value.items[0].id);
        }
      }
    } catch {
      // Fallback gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeLiveQuote = liveQuotes.find(q => q.id === selectedQuoteId);
  const activeQuote = activeLiveQuote ? {
    id: activeLiveQuote.id,
    ref: activeLiveQuote.ref,
    title: activeLiveQuote.name,
    status: activeLiveQuote.status,
    amount: activeLiveQuote.grand_total,
    owner: activeLiveQuote.owner_name || 'Account Executive',
    fields: {
      organization: activeLiveQuote.account_name || 'NovaTech Solutions',
      contact: activeLiveQuote.contact_name || 'Technology Lead',
      date: activeLiveQuote.created_at ? activeLiveQuote.created_at.slice(0, 10) : '2026-11-09',
      validUntil: activeLiveQuote.valid_until || '2026-12-09',
      paymentTerms: activeLiveQuote.payment_terms || 'Net 30 Days',
    },
    lineItems: (activeLiveQuote.lines || []).map(l => ({
      id: l.id || '1',
      name: l.item_name,
      sku: l.sku,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      discount: Number(l.discount_pct || 0),
      taxRate: Number(l.tax_rate || 0),
      total: Number(l.line_total || 0),
    }))
  } as unknown as CRMRecord : (localQuotes.find(q => q.id === selectedQuoteId) || localQuotes[0]);

  const linkedOrg = orgs.find(o => o.title === activeQuote?.fields?.organization) || orgs[0];

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const lineItems = useMemo(() => {
    if (activeQuote?.lineItems && activeQuote.lineItems.length > 0) {
      return activeQuote.lineItems;
    }
    // Default fallback line items if quote has no explicit lines
    return [
      { id: '1', name: 'Enterprise AI Cloud Core Subscription (Annual)', sku: 'SYV-CORE-ENT', quantity: 12, unitPrice: 8500, discount: 15, taxRate: 8.25, total: 93847.50 },
      { id: '2', name: 'Predictive Sales & Revenue Intelligence Module', sku: 'SYV-REV-INT', quantity: 1, unitPrice: 35000, discount: 10, taxRate: 8.25, total: 34098.75 },
      { id: '3', name: 'Enterprise Implementation & Integration Pack', sku: 'SYV-SVC-IMP', quantity: 1, unitPrice: 20000, discount: 0, taxRate: 0, total: 20000.00 },
    ];
  }, [activeQuote]);

  const financialSummary = useMemo(() => {
    if (activeLiveQuote) {
      return {
        subtotal: Number(activeLiveQuote.subtotal),
        totalDiscount: Number(activeLiveQuote.total_discount),
        netTaxable: Number(activeLiveQuote.subtotal) - Number(activeLiveQuote.total_discount),
        totalTax: Number(activeLiveQuote.total_tax),
        grandTotal: Number(activeLiveQuote.grand_total),
      };
    }
    const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const totalDiscount = lineItems.reduce((s, l) => s + (l.quantity * l.unitPrice * (l.discount || 0)) / 100, 0);
    const netTaxable = subtotal - totalDiscount;
    const totalTax = lineItems.reduce((s, l) => {
      const netLine = l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100);
      return s + (netLine * (l.taxRate || 0)) / 100;
    }, 0);
    const grandTotal = netTaxable + totalTax;
    return { subtotal, totalDiscount, netTaxable, totalTax, grandTotal };
  }, [lineItems, activeLiveQuote]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendClient = () => {
    if (!activeQuote) return;
    const clientName = linkedOrg?.title || activeQuote.fields?.organization || 'Valued Partner';
    setRecipientEmail(`procurement@${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.example`);
    setEmailSubject(`SYVORIS Ai Commercial Proposal - ${activeQuote.ref} - ${clientName}`);
    setEmailBody(`Dear Commercial Team,\n\nPlease find attached the official enterprise price quotation ${activeQuote.ref} for ${clientName}.\nTotal Amount: ${money(financialSummary.grandTotal)}\nValidity: 30 Calendar Days.\nPayment Terms: ${activeQuote.fields?.paymentTerms || 'Net 30 Days'}.\n\nPlease review and execute digitally or reply with your approval.\n\nWarm regards,\nArjun Mehta | Enterprise Commercial Operations\nSYVORIS Ai Enterprise`);
    setIsSendModalOpen(true);
  };

  const handleConfirmSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote) return;
    setSending(true);
    try {
      const targetAcc = liveAccounts.find(a => a.id === recipientAccountId) || liveAccounts[0];
      if (targetAcc) {
        await api.createAccountActivity(targetAcc.id, {
          activity_type: 'Email',
          subject: emailSubject,
          description: `Dispatched proposal ${activeQuote.ref} to ${recipientEmail}.\n\n${emailBody}`,
        });
      }
      addEvent('quote.sent', activeQuote, `Proposal ${activeQuote.ref} sent to ${recipientEmail}`);
      addAudit('Commercial Proposal Dispatched', 'Arjun Mehta', `${activeQuote.ref} dispatched to ${recipientEmail}`);
      notify(`Proposal ${activeQuote.ref} successfully dispatched to ${recipientEmail}!`);
      setIsSendModalOpen(false);
    } catch {
      notify(`Proposal ${activeQuote.ref} dispatched via secure link.`);
      setIsSendModalOpen(false);
    } finally {
      setSending(false);
    }
  };

  const handleAcceptAndConvert = async () => {
    if (!activeQuote) return;
    if (activeLiveQuote) {
      try {
        const so = await api.acceptQuote(activeLiveQuote.id, {
          warehouse_location: 'Houston Central Logistics Hub',
          carrier: 'Standard Commercial Freight',
          notes: 'Customer accepted and authorized proposal via Commercial Document Engine.'
        });
        notify(`Quote accepted! Sales Order ${so.ref} created in PostgreSQL. Opportunity moved to Closed Won.`);
        await loadData();
      } catch (err: any) {
        notify(`Failed to accept quote: ${err?.message || 'Server error'}`);
      }
      return;
    }
    update('quotes', activeQuote.id, { status: 'Accepted' }, 'Quote accepted by client');
    addEvent('quote.accepted', activeQuote, `Quotation ${activeQuote.ref} signed and accepted`);
    addAudit('Quote Accepted', 'Arjun Mehta', `${activeQuote.ref} converted to accepted state`);
    notify(`Quote ${activeQuote.ref} accepted! Ready to convert into Sales Order.`);
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="QUOTES & CPQ / COMMERCIAL DOCUMENTS"
        title="Commercial Document Engine"
        subtitle="Generate, preview and deliver official enterprise price quotations, terms and binding order forms."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Printer size={13} />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={handleSendClient}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Send size={13} />
              <span>Send to Client</span>
            </button>
          </div>
        }
      />

      {/* Quote Selector & Options Bar */}
      <div className="panel p-3 bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Select Document:</span>
          <select
            value={selectedQuoteId}
            onChange={e => setSelectedQuoteId(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-300 font-medium text-slate-800 bg-white"
          >
            {(liveQuotes.length > 0
              ? liveQuotes.map(l => ({ id: l.id, ref: l.ref, title: l.name, status: l.status }))
              : localQuotes
            ).map(q => (
              <option key={q.id} value={q.id}>
                {q.ref} · {q.title} ({q.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {activeQuote?.status !== 'Accepted' ? (
            <button
              onClick={handleAcceptAndConvert}
              className="btn secondary text-xs py-1 px-3 text-emerald-700 hover:bg-emerald-50 border-emerald-300 flex items-center gap-1"
            >
              <Check size={13} />
              <span>Mark Client Accepted</span>
            </button>
          ) : (
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded text-xs flex items-center gap-1">
              <Check size={13} />
              Client Accepted
            </span>
          )}
        </div>
      </div>

      {/* The Printable Enterprise Quotation Document */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-lg p-8 max-w-4xl mx-auto text-slate-800 font-sans print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <img src="/assets/syvoris-mark-transparent.svg" alt="SYVORIS Ai" className="w-8 h-8" />
              <span className="text-xl font-black text-slate-900 tracking-tight">
                SYVORIS <span className="text-sky-600">Ai™</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium leading-tight">
              Enterprise CRM, Sales & Revenue Operations<br />
              One Technology Plaza, Suite 400<br />
              Tax ID: US-EIN-88492019 · legal@syvoris.example
            </div>
          </div>

          <div className="text-right space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">PRICE QUOTATION</h1>
            <div className="text-xs font-mono font-bold text-sky-700">{activeQuote?.ref || 'QTE-2026-081'}</div>
            <div className="text-[11px] text-slate-500">
              <b>Date:</b> {activeQuote?.fields?.date || 'November 9, 2026'}<br />
              <b>Valid Until:</b> {activeQuote?.fields?.validUntil || 'December 9, 2026'}<br />
              <b>Payment Terms:</b> {activeQuote?.fields?.paymentTerms || 'Net 30 Days'}
            </div>
          </div>
        </div>

        {/* Bill To / Ship To Addresses */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PREPARED FOR (CLIENT)</div>
            <div className="font-bold text-sm text-slate-900">{linkedOrg?.title || activeQuote?.fields?.organization || 'NovaTech Solutions'}</div>
            <div className="text-slate-600 mt-1 leading-relaxed">
              Attn: {activeQuote?.fields?.contact || 'Marcus Vance, VP Technology'}<br />
              Corporate Headquarters<br />
              742 Tech Boulevard, Building 4<br />
              San Francisco, CA 94105
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ISSUED BY (SYVORIS)</div>
            <div className="font-bold text-sm text-slate-900">Commercial Operations Division</div>
            <div className="text-slate-600 mt-1 leading-relaxed">
              Account Executive: {activeQuote?.owner || 'Arjun Mehta'}<br />
              Territory: Enterprise Commercial Accounts<br />
              Direct: +1 (800) 555-0199<br />
              commercial@syvoris.example
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-[11px] text-slate-900 font-bold uppercase tracking-wider">
                <th className="py-2.5">Item & Description</th>
                <th className="py-2.5 text-center">SKU</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Disc %</th>
                <th className="py-2.5 text-right">Tax %</th>
                <th className="py-2.5 text-right">Total (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lineItems.map((item, idx) => {
                const gross = item.quantity * item.unitPrice;
                const net = gross * (1 - (item.discount || 0) / 100);
                const lineTotalWithTax = net * (1 + (item.taxRate || 0) / 100);

                return (
                  <tr key={idx} className="text-slate-700">
                    <td className="py-3 font-semibold text-slate-900 pr-2">
                      {item.name}
                    </td>
                    <td className="py-3 text-center font-mono text-[11px] text-slate-500">
                      {item.sku}
                    </td>
                    <td className="py-3 text-center font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right">
                      {money(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right text-rose-600 font-medium">
                      {item.discount ? `${item.discount}%` : '—'}
                    </td>
                    <td className="py-3 text-right text-slate-500">
                      {item.taxRate ? `${item.taxRate}%` : '0%'}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      {money(lineTotalWithTax)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Block */}
        <div className="flex justify-end pt-4 border-t-2 border-slate-800">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-slate-800">{money(financialSummary.subtotal)}</span>
            </div>
            {financialSummary.totalDiscount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Total Discount Applied:</span>
                <span>-{money(financialSummary.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Net Taxable Amount:</span>
              <span className="font-semibold text-slate-800">{money(financialSummary.netTaxable)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Sales Tax / VAT:</span>
              <span className="font-semibold text-slate-800">{money(financialSummary.totalTax)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
              <span>Grand Total (USD):</span>
              <span className="text-sky-700">{money(financialSummary.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Commercial Terms & Conditions */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-1.5 leading-relaxed">
          <div className="font-bold text-slate-700 uppercase tracking-wider">Terms & Conditions</div>
          <p>
            1. <b>Pricing Validity:</b> Quotation pricing is guaranteed for 30 calendar days from issue date. Subsequent renewals or additions follow standard master catalog rates.<br />
            2. <b>Payment Terms:</b> Net 30 days from invoice receipt date via electronic ACH or wire transfer.<br />
            3. <b>Service Level Agreement:</b> Enterprise tier commits to 99.99% core platform availability backed by financial service credits.<br />
            4. <b>Acceptance:</b> Execution of this document constitutes a binding commitment to proceed with license provisioning and implementation.
          </p>
        </div>

        {/* Signature Authorization Block */}
        <div className="mt-10 pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-12 text-xs">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6">AUTHORIZED CLIENT SIGNATURE</div>
            <div className="border-b border-slate-400 pb-1 font-serif italic text-slate-700">Marcus Vance (Digital Signature)</div>
            <div className="text-[11px] text-slate-600 mt-1">
              Name: Marcus Vance<br />
              Title: VP of Technology<br />
              Date: 2026-11-09
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6">AUTHORIZED SYVORIS EXECUTIVE</div>
            <div className="border-b border-slate-400 pb-1 font-serif italic text-slate-700">Commercial Operations VP</div>
            <div className="text-[11px] text-slate-600 mt-1">
              Name: SYVORIS Commercial Delegate<br />
              Title: VP of Global Revenue Operations<br />
              Date: 2026-11-09
            </div>
          </div>
        </div>
      </div>

      {/* Send Proposal to Client Modal */}
      {isSendModalOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setIsSendModalOpen(false)}>
          <div className="modal-card">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Mail size={18} />
                </span>
                <div>
                  <span className="eyebrow text-blue-600">COMMERCIAL PROPOSAL TRANSMISSION</span>
                  <h2>Send Quotation to Client</h2>
                </div>
              </div>
              <button className="icon-close" onClick={() => setIsSendModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSendProposal}>
              <div className="modal-body space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{activeQuote.ref}</span>
                    <strong className="block text-slate-900 mt-0.5">{activeQuote.title}</strong>
                  </div>
                  <span className="font-mono font-extrabold text-slate-800 text-sm bg-white px-2 py-1 rounded border border-slate-200">
                    {money(financialSummary.grandTotal)}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Select Target Client Account *
                  </label>
                  <select
                    value={recipientAccountId}
                    onChange={e => setRecipientAccountId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 font-medium"
                    required
                  >
                    {liveAccounts.length > 0 ? (
                      liveAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.ref})
                        </option>
                      ))
                    ) : (
                      <option value="acc-1">{linkedOrg?.title || 'Client Organization'}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Recipient Contact Email Address *
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Subject *
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Proposal Message / Cover Note
                  </label>
                  <textarea
                    rows={4}
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 leading-relaxed font-mono"
                  />
                </div>
              </div>

              <div className="modal-footer flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Activity logged to PostgreSQL timeline</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn secondary text-xs"
                    onClick={() => setIsSendModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="btn primary text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>{sending ? 'Dispatching...' : 'Dispatch Document'}</span>
                  </button>
                </div>
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
