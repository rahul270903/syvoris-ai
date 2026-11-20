import { useState } from 'react';
import {
  FileText, Printer, Download, Eye, Plus, CheckCircle2,
  Copy, Sparkles, Sliders, Layout, Layers, ShieldCheck,
  Check, X, FileSpreadsheet, Building2
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface PrintTemplateItem {
  id: string;
  name: string;
  docType: 'Quotation' | 'Sales Order' | 'Tax Invoice' | 'SLA Certificate';
  paperSize: 'A4' | 'US Letter' | 'A4 Landscape';
  tokens: string[];
  lastModified: string;
  isDefault: boolean;
  sampleData: {
    title: string;
    ref: string;
    customer: string;
    date: string;
    items: { desc: string; qty: number; unitPrice: number; total: number }[];
    total: number;
    terms: string;
  };
}

const INITIAL_PRINT_TEMPLATES: PrintTemplateItem[] = [
  {
    id: 'pt-1',
    name: 'Executive CPQ Commercial Quotation Layout',
    docType: 'Quotation',
    paperSize: 'A4',
    tokens: ['$Logo$', '$QuoteRef$', '$CustomerName$', '$ItemsTable$', '$Subtotal$', '$DiscountRate$', '$GrandTotal$', '$SignDate$'],
    lastModified: '2026-11-18',
    isDefault: true,
    sampleData: {
      title: 'COMMERCIAL PROPOSAL & CPQ QUOTATION',
      ref: 'QTE-2026-0042',
      customer: 'Northstar Logistics Group',
      date: '2026-11-20',
      items: [
        { desc: 'AI Autonomous Agent Worker Seat (Annual)', qty: 5, unitPrice: 4800, total: 24000 },
        { desc: 'Single-Mode 96-Core Armored Fiber Spool (1000m)', qty: 2, unitPrice: 2450, total: 4900 },
        { desc: 'Enterprise Implementation & Integration Pack', qty: 1, unitPrice: 20000, total: 20000 }
      ],
      total: 48900,
      terms: 'Standard Net 30 Days. Prices quoted in USD. 1-year SLA warranty included.'
    }
  },
  {
    id: 'pt-2',
    name: 'Multi-Jurisdiction VAT / GCT Tax Invoice',
    docType: 'Tax Invoice',
    paperSize: 'A4',
    tokens: ['$Logo$', '$InvoiceRef$', '$CustomerTRN$', '$TaxBreakdown$', '$GrandTotal$', '$StripePayLink$'],
    lastModified: '2026-11-14',
    isDefault: true,
    sampleData: {
      title: 'FORMAL TAX INVOICE STATEMENT',
      ref: 'INV-2026-0819',
      customer: 'Cyberdyne Systems Corp',
      date: '2026-11-15',
      items: [
        { desc: 'Nokia 7750 Service Router Edge Gateway', qty: 1, unitPrice: 12500, total: 12500 },
        { desc: 'Optical Fiber Splicing & Termination Labor', qty: 16, unitPrice: 150, total: 2400 }
      ],
      total: 14900,
      terms: 'Remit payment via Stripe Billing Portal. Overdue invoices subject to 1.5% monthly interest.'
    }
  },
  {
    id: 'pt-3',
    name: 'Commercial Sales Order & Fulfillment Slip',
    docType: 'Sales Order',
    paperSize: 'US Letter',
    tokens: ['$OrderRef$', '$WarehouseDepot$', '$ItemsTable$', '$DispatchLead$', '$DeliveryTarget$'],
    lastModified: '2026-11-10',
    isDefault: false,
    sampleData: {
      title: 'SALES ORDER FULFILLMENT VOUCHER',
      ref: 'ORD-2026-0312',
      customer: 'Fujikura Optical Technologies',
      date: '2026-11-12',
      items: [
        { desc: 'Audit Fiber Optical Transceiver (10G SFP+)', qty: 20, unitPrice: 500, total: 10000 },
        { desc: 'Cisco Catalyst 9300 48-Port Managed Switch', qty: 2, unitPrice: 4890, total: 9780 }
      ],
      total: 19780,
      terms: 'Warehouse pick verified from Kingston Central Logistics Hub. Signed delivery receipt required.'
    }
  },
  {
    id: 'pt-4',
    name: 'Enterprise Mission-Critical SLA Compliance Certificate',
    docType: 'SLA Certificate',
    paperSize: 'A4 Landscape',
    tokens: ['$AccountName$', '$UptimeGuarantee$', '$MTTR_Limit$', '$SecurityOfficer$', '$IssueDate$'],
    lastModified: '2026-11-05',
    isDefault: false,
    sampleData: {
      title: 'MISSION-CRITICAL SLA COMPLIANCE GUARANTEE',
      ref: 'SLA-CERT-2026',
      customer: 'Apex Global Logistics Ltd',
      date: '2026-11-01',
      items: [
        { desc: '99.99% Optical Backbone Core Uptime SLA', qty: 1, unitPrice: 0, total: 0 },
        { desc: '15-Minute Critical Severity First-Response Guarantee', qty: 1, unitPrice: 0, total: 0 }
      ],
      total: 0,
      terms: 'Certified under ISO/IEC 27001 and PCI-DSS Level 1 compliance. Governed by SYVORIS Platform Trust.'
    }
  }
];

export function PrintTemplatesView() {
  const { addAudit } = useCRM();
  const [templates, setTemplates] = useState<PrintTemplateItem[]>(INITIAL_PRINT_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string>('pt-1');
  const [toast, setToast] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New template form
  const [templateName, setTemplateName] = useState('');
  const [docType, setDocType] = useState<'Quotation' | 'Sales Order' | 'Tax Invoice' | 'SLA Certificate'>('Quotation');
  const [paperSize, setPaperSize] = useState<'A4' | 'US Letter' | 'A4 Landscape'>('A4');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const selectedTemplate = templates.find(t => t.id === selectedId) || templates[0];

  const handleCopyToken = (tok: string) => {
    navigator.clipboard?.writeText(tok);
    notify(`Copied token "${tok}" to clipboard.`);
  };

  const handlePrintPreview = () => {
    window.print();
    addAudit?.('Print Engine', `Generated print preview for ${selectedTemplate.name}`, 'Document Engine');
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName) return;

    const newTmpl: PrintTemplateItem = {
      id: `pt-${Date.now().toString().slice(-4)}`,
      name: templateName,
      docType: docType,
      paperSize: paperSize,
      tokens: ['$Logo$', '$DocRef$', '$CustomerName$', '$ItemsTable$', '$GrandTotal$', '$SignDate$'],
      lastModified: new Date().toISOString().slice(0, 10),
      isDefault: false,
      sampleData: {
        title: templateName.toUpperCase(),
        ref: `${docType.slice(0, 3).toUpperCase()}-2026-0999`,
        customer: 'Sample Enterprise Client',
        date: new Date().toISOString().slice(0, 10),
        items: [
          { desc: 'SYVORIS Platform Subscription', qty: 1, unitPrice: 12000, total: 12000 }
        ],
        total: 12000,
        terms: 'Standard terms and conditions apply.'
      }
    };

    setTemplates(prev => [...prev, newTmpl]);
    setSelectedId(newTmpl.id);
    setShowAddModal(false);
    setTemplateName('');
    notify(`Created template "${newTmpl.name}".`);
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
        eyebrow="ADMINISTRATION / PRINT TEMPLATES"
        title="Print & PDF Document Layout Studio"
        subtitle="Design printable PDF layouts, configure dynamic token placeholders ($Logo$, $GrandTotal$, $CustomerName$), and manage corporate stationary presets."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintPreview}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Print Layout</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Configured Layouts</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{templates.length} Templates</div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-format print schemas</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Rendering Engine</span>
            <Printer className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">Vector PDF 300 DPI</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Pixel-perfect typography</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Dynamic Merge Tokens</span>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">32 Placeholders</div>
          <div className="text-[11px] text-slate-500 mt-1">$Logo$, $GrandTotal$, etc.</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Paper Compatibility</span>
            <Layout className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">A4 & US Letter</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Commercial print standards</div>
        </div>
      </div>

      {/* Main Grid: Left Template Selector + Right Live Document Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Available Print Document Layouts
          </div>

          <div className="space-y-2">
            {templates.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedId === t.id
                    ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${selectedId === t.id ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {t.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono bg-slate-950 text-cyan-400 border border-slate-800 px-2 py-0.5 rounded">
                    {t.docType}
                  </span>
                  <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                    {t.paperSize}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 mt-2.5">
                  Modified {t.lastModified} {t.isDefault && '· (Default Master)'}
                </div>
              </div>
            ))}
          </div>

          {/* Merge Tokens Available */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Click-to-Copy Merge Tokens</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Paste these tokens into custom HTML layouts to bind CRM database fields:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedTemplate.tokens.map(tok => (
                <button
                  key={tok}
                  onClick={() => handleCopyToken(tok)}
                  className="text-[10px] font-mono bg-slate-950 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-800 px-2 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <Copy className="w-2.5 h-2.5 opacity-60" />
                  <span>{tok}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Sheet (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{selectedTemplate.name}</span>
                <span className="text-xs text-slate-400 font-normal">· Layout Preview</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Preset size: <strong className="text-cyan-400">{selectedTemplate.paperSize}</strong>
              </p>
            </div>

            <button
              onClick={handlePrintPreview}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF File</span>
            </button>
          </div>

          {/* SIMULATED PRINTED PAPER CANVAS */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 max-w-2xl mx-auto shadow-2xl font-sans text-slate-200 space-y-6">
            {/* Header / Logo */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    SY
                  </div>
                  <span className="font-bold text-base tracking-tight text-white">SYVORIS Ai</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Enterprise Telecommunications & Cloud Infrastructure</div>
                <div className="text-[10px] text-slate-500">12 Ocean Boulevard, Kingston, Jamaica</div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  {selectedTemplate.sampleData.title}
                </div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {selectedTemplate.sampleData.ref}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Issue Date: {selectedTemplate.sampleData.date}
                </div>
              </div>
            </div>

            {/* Recipient */}
            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 text-xs">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Billed / Issued To:</div>
              <div className="font-bold text-white mt-0.5">{selectedTemplate.sampleData.customer}</div>
              <div className="text-slate-400 text-[11px]">Authorized Enterprise Account · Validated RLS Customer ID</div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-2 text-center w-16">Qty</th>
                    <th className="py-2 px-3 text-right w-24">Unit Price</th>
                    <th className="py-2 px-3 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {selectedTemplate.sampleData.items.map((it, i) => (
                    <tr key={i} className="hover:bg-slate-900/30">
                      <td className="py-2.5 px-3 font-medium text-slate-200">{it.desc}</td>
                      <td className="py-2.5 px-2 text-center text-slate-400 font-mono">{it.qty}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 font-mono">${it.unitPrice.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white font-mono">${it.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end pt-2">
              <div className="w-56 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">${selectedTemplate.sampleData.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax (VAT / GCT 0% Exempt):</span>
                  <span className="font-mono text-slate-200">$0.00</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-cyan-400 border-t border-slate-800 pt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono">${selectedTemplate.sampleData.total.toLocaleString()} USD</span>
                </div>
              </div>
            </div>

            {/* Terms & Footer */}
            <div className="border-t border-slate-800 pt-4 space-y-2 text-[10px] text-slate-400">
              <div><strong>Terms:</strong> {selectedTemplate.sampleData.terms}</div>
              <div className="flex items-center justify-between text-slate-500 pt-1">
                <span>Rendered securely via SYVORIS PDF Generation Engine.</span>
                <span className="font-mono">Verification: SHA-256 Validated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE TEMPLATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Create New Print Template Layout</span>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Layout Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optical Dispatch Packing Slip"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Quotation">Quotation (CPQ)</option>
                  <option value="Sales Order">Sales Order</option>
                  <option value="Tax Invoice">Tax Invoice</option>
                  <option value="SLA Certificate">SLA Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Paper Preset</label>
                <select
                  value={paperSize}
                  onChange={e => setPaperSize(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="A4">A4 Portrait (210 x 297 mm)</option>
                  <option value="US Letter">US Letter (8.5 x 11 in)</option>
                  <option value="A4 Landscape">A4 Landscape</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Save Print Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
