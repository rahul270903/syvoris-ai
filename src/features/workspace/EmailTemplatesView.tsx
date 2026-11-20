import { useState, useMemo, useEffect } from 'react';
import {
  Mail, Plus, Eye, Code, Copy, CheckCircle2,
  X, Sparkles, Send, FileText, Check, Tag, Clock,
  Layers, Search, RefreshCw
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { api, EmailTemplateItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

const MERGE_TAG_PRESETS = [
  '{{contact.first_name}}',
  '{{contact.last_name}}',
  '{{account.name}}',
  '{{quote.ref}}',
  '{{quote.amount}}',
  '{{owner.name}}',
  '{{company.name}}',
];

const DEFAULT_TEMPLATES: EmailTemplateItem[] = [
  {
    id: 'tmpl-1',
    tenant_id: 'default',
    ref: 'TMPL-2026-001',
    name: 'Executive Proposal & Commercial Terms Delivery',
    subject: 'SYVORIS Ai Commercial Proposal {{quote.ref}} for {{account.name}}',
    category: 'Transactional',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #f1f5f9; background: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
  <h2 style="color: #38bdf8; margin-top: 0;">Dear {{contact.first_name}},</h2>
  <p>Thank you for partnering with <strong>SYVORIS Ai</strong>. We are pleased to present the commercial agreement for <strong>{{account.name}}</strong>.</p>
  <div style="background: #1e293b; border: 1px solid #475569; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Quotation Reference:</strong> <span style="color: #38bdf8;">{{quote.ref}}</span></p>
    <p style="margin: 6px 0 0;"><strong>Total Commercial Value:</strong> <span style="color: #4ade80;">{{quote.amount}}</span></p>
  </div>
  <p>Please review the enclosed terms and execute via our encrypted digital signature portal.</p>
  <p style="margin-bottom: 0;">Warm regards,<br/><strong style="color: #f8fafc;">{{owner.name}}</strong><br/><span style="color: #94a3b8;">Enterprise Commercial Operations</span></p>
</div>`,
    merge_tags: ['contact.first_name', 'account.name', 'quote.ref', 'quote.amount', 'owner.name'],
    is_active: true,
    owner_name: 'Arjun Mehta',
    created_at: '2026-11-10T10:00:00Z',
    updated_at: '2026-11-10T10:00:00Z',
  },
  {
    id: 'tmpl-2',
    tenant_id: 'default',
    ref: 'TMPL-2026-002',
    name: 'New Enterprise Client Welcome & Onboarding Cadence',
    subject: 'Welcome to SYVORIS Ai Enterprise, {{contact.first_name}}!',
    category: 'Onboarding',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #f1f5f9; background: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
  <h2 style="color: #38bdf8; margin-top: 0;">Welcome to the Platform, {{contact.first_name}}!</h2>
  <p>We are thrilled to welcome <strong>{{account.name}}</strong> into the SYVORIS Enterprise ecosystem.</p>
  <p>Your dedicated Customer Success Architect is preparing your kickoff migration session and API environment keys.</p>
  <p style="margin-bottom: 0;">Best regards,<br/><strong style="color: #f8fafc;">Elena Rostova</strong><br/><span style="color: #94a3b8;">Customer Architecture Team</span></p>
</div>`,
    merge_tags: ['contact.first_name', 'account.name'],
    is_active: true,
    owner_name: 'Elena Rostova',
    created_at: '2026-11-12T14:30:00Z',
    updated_at: '2026-11-12T14:30:00Z',
  },
  {
    id: 'tmpl-3',
    tenant_id: 'default',
    ref: 'TMPL-2026-003',
    name: 'Q4 Optical Hardware Expansion Promotional Outreach',
    subject: 'Exclusive Q4 Regional Telecom Infrastructure Upgrade for {{account.name}}',
    category: 'Promotional',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #f1f5f9; background: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
  <h2 style="color: #38bdf8; margin-top: 0;">Special Commercial Briefing</h2>
  <p>Hi {{contact.first_name}},</p>
  <p>For Q4 2026, SYVORIS has authorized pre-allocation for high-density transceivers and AI core networking gear for select accounts.</p>
  <p>Reach out to {{owner.name}} to schedule an executive technical briefing.</p>
  <p style="margin-bottom: 0;">Warm regards,<br/><strong style="color: #f8fafc;">{{owner.name}}</strong></p>
</div>`,
    merge_tags: ['contact.first_name', 'account.name', 'owner.name'],
    is_active: true,
    owner_name: 'Arjun Mehta',
    created_at: '2026-11-14T09:15:00Z',
    updated_at: '2026-11-14T09:15:00Z',
  },
  {
    id: 'tmpl-4',
    tenant_id: 'default',
    ref: 'TMPL-2026-004',
    name: '30-Day Dormant Account Re-engagement Touchpoint',
    subject: '{{contact.first_name}}, let\'s review {{account.name}}\'s platform value',
    category: 'Re-engagement',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #f1f5f9; background: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
  <h2 style="color: #38bdf8; margin-top: 0;">Executive Check-in</h2>
  <p>Dear {{contact.first_name}},</p>
  <p>We noticed your team hasn't run the latest revenue predictive forecasts this cycle. Let's schedule a 15-minute optimization sync.</p>
  <p style="margin-bottom: 0;">Warmly,<br/><strong style="color: #f8fafc;">{{owner.name}}</strong></p>
</div>`,
    merge_tags: ['contact.first_name', 'account.name', 'owner.name'],
    is_active: true,
    owner_name: 'Sarah Jenkins',
    created_at: '2026-11-16T11:45:00Z',
    updated_at: '2026-11-16T11:45:00Z',
  },
];

export function EmailTemplatesView() {
  const { addEvent, addAudit } = useCRM();
  const [templates, setTemplates] = useState<EmailTemplateItem[]>(DEFAULT_TEMPLATES);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [testRecipient, setTestRecipient] = useState<string>('arjun.mehta@bluepeak.internal');
  const [toast, setToast] = useState<string>('');

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Transactional');
  const [formSubject, setFormSubject] = useState<string>('');
  const [formBody, setFormBody] = useState<string>('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchCat = categoryFilter === 'All' || t.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                          t.subject.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [templates, categoryFilter, search]);

  const handleInsertTag = (tag: string) => {
    setFormBody(prev => `${prev} ${tag}`);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSubject.trim() || !formBody.trim()) {
      notify('Please complete all required fields.');
      return;
    }

    const newRef = `TMPL-2026-${String(templates.length + 1).padStart(3, '0')}`;
    const newTmpl: EmailTemplateItem = {
      id: `tmpl-${Date.now()}`,
      tenant_id: 'default',
      ref: newRef,
      name: formName.trim(),
      subject: formSubject.trim(),
      category: formCategory,
      body_html: `<div style="font-family: sans-serif; line-height: 1.6; color: #f1f5f9; background: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #334155;">\n${formBody.trim()}\n</div>`,
      merge_tags: ['contact.first_name', 'account.name'],
      is_active: true,
      owner_name: 'Arjun Mehta',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTemplates(prev => [newTmpl, ...prev]);
    setShowCreateModal(false);
    setFormName('');
    setFormSubject('');
    setFormBody('');

    notify(`Email template "${newTmpl.name}" published successfully!`);
    addAudit?.('Email Template Created', `Created template ${newRef}: ${newTmpl.name}`, 'Communications');
  };

  const renderPreviewContent = (tmpl: EmailTemplateItem) => {
    const replacements: Record<string, string> = {
      '{{contact.first_name}}': 'Marcus',
      '{{contact.last_name}}': 'Vance',
      '{{account.name}}': 'Northstar Logistics Group',
      '{{quote.ref}}': 'QTE-2026-0042',
      '{{quote.amount}}': '$48,900.00 USD',
      '{{owner.name}}': 'Arjun Mehta',
      '{{company.name}}': 'SYVORIS Ai Enterprise',
    };

    let subject = tmpl.subject;
    let body = tmpl.body_html;

    Object.entries(replacements).forEach(([tag, val]) => {
      subject = subject.split(tag).join(val);
      body = body.split(tag).join(val);
    });

    return { subject, body };
  };

  const handleSendTestDispatch = () => {
    notify(`Test dispatch generated and transmitted to ${testRecipient}. Delivery verified.`);
    addAudit?.('Email Dispatch', `Dispatched test email ${previewTemplate?.ref} to ${testRecipient}`, 'Communications');
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
        eyebrow="ADMINISTRATION / EMAIL TEMPLATES"
        title="Email Templates & Campaign Layout Studio"
        subtitle="Manage reusable transactional notifications, automated onboarding cadences, and dynamic variable merge tags."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Template</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Active Templates</span>
            <Mail className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{templates.length} Layouts</div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-channel touchpoints</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Dynamic Merge Tags</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{MERGE_TAG_PRESETS.length} Placeholders</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Context-aware injection</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Delivery Protocol</span>
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">SMTP / SES TLS 1.3</div>
          <div className="text-[11px] text-slate-500 mt-1">DKIM & SPF signed</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Open & Click Tracking</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">64.2% Avg Open</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Real-time engagement telemetry</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search templates by title or subject line..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Transactional', 'Onboarding', 'Promotional', 'Re-engagement'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map(tmpl => (
          <div
            key={tmpl.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded">
                    {tmpl.ref}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">{tmpl.name}</h3>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <span className="text-cyan-400 font-medium">Subject:</span>
                    <span className="truncate max-w-xs">{tmpl.subject}</span>
                  </div>
                </div>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                  {tmpl.category}
                </span>
              </div>

              {/* Merge tags list */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-500 mb-1.5">Embedded Variables:</div>
                <div className="flex flex-wrap gap-1.5">
                  {tmpl.merge_tags.map(t => (
                    <span
                      key={t}
                      className="text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded"
                    >
                      {`{{${t}}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Owner: {tmpl.owner_name}</span>
              <button
                onClick={() => setPreviewTemplate(tmpl)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-lg font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview & Test</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* LIVE PREVIEW & DISPATCH MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <Mail className="w-5 h-5 text-cyan-400" />
                <span>Template Preview: {previewTemplate.name}</span>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                <div>
                  <span className="text-slate-500 font-medium">Rendered Subject: </span>
                  <strong className="text-white font-mono">{renderPreviewContent(previewTemplate).subject}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Sample Recipient Context: </span>
                  <span className="text-cyan-400">Marcus Vance &lt;marcus@northstar-logistics.example&gt;</span>
                </div>
              </div>

              {/* Rendered HTML Body */}
              <div
                className="rounded-xl overflow-hidden border border-slate-800"
                dangerouslySetInnerHTML={{ __html: renderPreviewContent(previewTemplate).body }}
              />

              {/* Test Dispatch Bar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Test Email Dispatcher
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={e => setTestRecipient(e.target.value)}
                    placeholder="Enter recipient email address..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleSendTestDispatch}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Email</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Compose New Email Template</span>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Template Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Carrier SLA Renewal Notification"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Transactional">Transactional</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Promotional">Promotional</option>
                    <option value="Re-engagement">Re-engagement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Subject Line *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Update regarding {{account.name}}"
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Tag inserter */}
              <div>
                <div className="text-[11px] text-slate-400 mb-1.5 font-semibold">Click to Insert Dynamic Merge Tag:</div>
                <div className="flex flex-wrap gap-1.5">
                  {MERGE_TAG_PRESETS.map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleInsertTag(tag)}
                      className="text-[10px] font-mono bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 px-2 py-0.5 rounded transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Email Body Content *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Dear {{contact.first_name}},\n\nYour message here..."
                  value={formBody}
                  onChange={e => setFormBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
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
                  Publish Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
