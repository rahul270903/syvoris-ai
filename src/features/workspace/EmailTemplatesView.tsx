import { useState, useMemo, useEffect } from 'react';
import {
  Mail, Plus, Eye, Code, Copy, CheckCircle2,
  X, Sparkles, Send, FileText, Check, Tag
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
    body_html: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
  <h2>Dear {{contact.first_name}},</h2>
  <p>Thank you for partnering with <strong>SYVORIS Ai</strong>. We are pleased to present the commercial agreement for <strong>{{account.name}}</strong>.</p>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Quotation Reference:</strong> {{quote.ref}}</p>
    <p style="margin: 4px 0 0;"><strong>Total Commercial Value:</strong> {{quote.amount}}</p>
  </div>
  <p>Please review the enclosed terms and execute via secure digital portal.</p>
  <p>Warm regards,<br/><strong>{{owner.name}}</strong><br/>Enterprise Commercial Operations</p>
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
    body_html: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
  <h2>Welcome to the Platform, {{contact.first_name}}!</h2>
  <p>We are thrilled to welcome <strong>{{account.name}}</strong> into the SYVORIS Enterprise ecosystem.</p>
  <p>Your dedicated Customer Success Architect is preparing your kickoff migration session.</p>
  <p>Best regards,<br/>SYVORIS Customer Architecture</p>
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
    body_html: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
  <h2>Special Commercial Briefing</h2>
  <p>Hi {{contact.first_name}},</p>
  <p>For Q4 2026, SYVORIS has authorized pre-allocation for high-density transceivers and AI core networking routers for {{account.name}}.</p>
  <p>Reach out to {{owner.name}} to schedule an executive briefing.</p>
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
    body_html: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
  <h2>Executive Check-in</h2>
  <p>Dear {{contact.first_name}},</p>
  <p>We noticed your team hasn't run the latest revenue predictive forecasts this cycle. Let's schedule a 15-minute optimization review.</p>
  <p>Warmly,<br/>{{owner.name}}</p>
</div>`,
    merge_tags: ['contact.first_name', 'account.name', 'owner.name'],
    is_active: true,
    owner_name: 'Sarah Reid',
    created_at: '2026-11-16T11:45:00Z',
    updated_at: '2026-11-16T11:45:00Z',
  },
];

export function EmailTemplatesView() {
  const { addEvent, addAudit } = useCRM();
  const [templates, setTemplates] = useState<EmailTemplateItem[]>(DEFAULT_TEMPLATES);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Transactional');
  const [formSubject, setFormSubject] = useState<string>('');
  const [formBody, setFormBody] = useState<string>('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const loadTemplates = async () => {
    try {
      const res = await api.listEmailTemplates();
      if (res?.items && res.items.length > 0) {
        setTemplates(res.items);
      }
    } catch {
      // Handled
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === 'All') return templates;
    return templates.filter(t => t.category.toLowerCase() === categoryFilter.toLowerCase());
  }, [templates, categoryFilter]);

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
      body_html: formBody.trim(),
      merge_tags: ['contact.first_name', 'account.name'],
      is_active: true,
      owner_name: 'Arjun Mehta',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTemplates(prev => [newTmpl, ...prev]);
    try {
      await api.createEmailTemplate({
        name: newTmpl.name,
        subject: newTmpl.subject,
        category: newTmpl.category,
        body_html: newTmpl.body_html,
        is_active: true,
      });
    } catch {
      // Local fallback
    }

    addEvent('template.created', { ref: newRef }, `Created email template: ${newTmpl.name}`);
    addAudit('Email Template Created', 'Arjun Mehta', `${newRef}: ${newTmpl.name}`);
    notify(`Email template "${newTmpl.name}" published successfully!`);
    setIsDrawerOpen(false);
    setFormName('');
    setFormSubject('');
    setFormBody('');
  };

  // Render dummy live preview
  const renderPreviewContent = (tmpl: EmailTemplateItem) => {
    let subject = tmpl.subject
      .replace(/{{contact\.first_name}}/g, 'Elena')
      .replace(/{{account\.name}}/g, 'Vertex Global Solutions')
      .replace(/{{quote\.ref}}/g, 'QTE-2026-088')
      .replace(/{{quote\.amount}}/g, '$75,000')
      .replace(/{{owner\.name}}/g, 'Arjun Mehta');

    let body = tmpl.body_html
      .replace(/{{contact\.first_name}}/g, 'Elena')
      .replace(/{{account\.name}}/g, 'Vertex Global Solutions')
      .replace(/{{quote\.ref}}/g, 'QTE-2026-088')
      .replace(/{{quote\.amount}}/g, '$75,000')
      .replace(/{{owner\.name}}/g, 'Arjun Mehta');

    return { subject, body };
  };

  return (
    <div className="workspace-page space-y-4">
      {/* Header */}
      <SectionHeading
        eyebrow="MARKETING & COMMUNICATIONS / TEMPLATE STUDIO"
        title="Enterprise Email Template Studio"
        subtitle="Design, organize, preview and publish responsive customer email templates with dynamic merge tags."
        action={
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Plus size={14} />
            <span>Create Email Template</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Email Templates</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {templates.length} Templates
          </strong>
          <small className="text-xs text-blue-700 font-semibold block mt-1">Ready for CRM campaigns</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Active in Workflows</span>
          <strong className="text-xl font-bold text-emerald-600 font-manrope block mt-1">
            {templates.filter(t => t.is_active).length} Active
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">Automated dispatch enabled</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Avg Engagement Benchmark</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            41.8% Open Rate
          </strong>
          <small className="text-xs text-slate-400 block mt-1">Across 12 enterprise drips</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Dynamic Token Engine</span>
          <strong className="text-xl font-bold text-purple-700 font-manrope block mt-1">
            {MERGE_TAG_PRESETS.length} Tokens
          </strong>
          <small className="text-xs text-purple-700 font-semibold block mt-1">Personalization active</small>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="panel p-3 bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Template Category:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {['All', 'Transactional', 'Onboarding', 'Promotional', 'Re-engagement'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <span className="text-slate-500 text-[11px]">
          Showing {filteredTemplates.length} of {templates.length} published templates
        </span>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map(tmpl => (
          <div
            key={tmpl.id}
            className="panel p-5 bg-white border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-slate-500">{tmpl.ref}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  {tmpl.category}
                </span>
              </div>

              <strong className="text-sm font-bold text-slate-900 block font-manrope mb-1.5">
                {tmpl.name}
              </strong>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 mb-3 line-clamp-1">
                <strong>Subject:</strong> {tmpl.subject}
              </div>

              <div className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3">
                <div dangerouslySetInnerHTML={{ __html: tmpl.body_html }} />
              </div>

              <div className="flex flex-wrap items-center gap-1 mb-3">
                {tmpl.merge_tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200"
                  >
                    {`{{${tag}}}`}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">By {tmpl.owner_name || 'Marketing Operations'}</span>
              <button
                onClick={() => setPreviewTemplate(tmpl)}
                className="btn secondary text-xs py-1 px-3 text-blue-700 hover:bg-blue-50 border-blue-200 flex items-center gap-1 font-semibold"
              >
                <Eye size={13} />
                <span>Live Preview</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview Modal */}
      {previewTemplate && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setPreviewTemplate(null)}>
          <div className="modal-card wide">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Mail size={18} />
                </span>
                <div>
                  <span className="eyebrow text-blue-600">EMAIL TEMPLATE PREVIEW</span>
                  <h2>{previewTemplate.name}</h2>
                </div>
              </div>
              <button className="icon-close" onClick={() => setPreviewTemplate(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs space-y-1">
                <div>
                  <strong className="text-slate-600">Subject: </strong>
                  <span className="font-semibold text-slate-900 font-mono">
                    {renderPreviewContent(previewTemplate).subject}
                  </span>
                </div>
                <div>
                  <strong className="text-slate-600">Category: </strong>
                  <span className="text-slate-800">{previewTemplate.category}</span>
                </div>
                <div>
                  <strong className="text-slate-600">Sample Recipient: </strong>
                  <span className="text-slate-800">Elena Rostova &lt;elena@vertex.example&gt;</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-6 bg-white shadow-inner min-h-[220px]">
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderPreviewContent(previewTemplate).body,
                  }}
                />
              </div>
            </div>

            <div className="modal-footer flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Tokens rendered with sample customer profile</span>
              <button className="btn secondary text-xs" onClick={() => setPreviewTemplate(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Email Template Drawer */}
      {isDrawerOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setIsDrawerOpen(false)}>
          <div className="form-modal">
            <div className="form-modal-head">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  TEMPLATE STUDIO
                </span>
                <h2 className="text-base font-bold text-slate-800">Create Email Template</h2>
                <p className="text-xs text-slate-500">
                  Author a reusable responsive communication template with dynamic customer tokens.
                </p>
              </div>
              <button
                type="button"
                className="icon-close"
                onClick={() => setIsDrawerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="flex flex-col flex-1 overflow-hidden">
              <div className="form-modal-body space-y-4">
                <div className="form-grid">
                  <label className="wide">
                    <span>Template Name *</span>
                    <input
                      type="text"
                      placeholder="e.g. Q4 Executive Quote Delivery"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    <span>Template Category *</span>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      required
                    >
                      <option value="Transactional">Transactional</option>
                      <option value="Onboarding">Onboarding</option>
                      <option value="Promotional">Promotional</option>
                      <option value="Re-engagement">Re-engagement</option>
                      <option value="Service">Service & Support</option>
                    </select>
                  </label>

                  <label>
                    <span>Author</span>
                    <input type="text" value="Arjun Mehta" disabled className="bg-slate-50" />
                  </label>

                  <label className="wide">
                    <span>Email Subject Line *</span>
                    <input
                      type="text"
                      placeholder="e.g. SYVORIS Ai Proposal {{quote.ref}} for {{account.name}}"
                      value={formSubject}
                      onChange={e => setFormSubject(e.target.value)}
                      required
                    />
                  </label>

                  {/* Merge Tags helper bar */}
                  <div className="wide p-2.5 bg-blue-50/60 border border-blue-200/60 rounded-lg">
                    <span className="text-[11px] font-bold text-blue-900 block mb-1.5 flex items-center gap-1">
                      <Tag size={12} /> Click token to insert into body:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {MERGE_TAG_PRESETS.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleInsertTag(tag)}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-white text-blue-800 border border-blue-300 hover:bg-blue-100 shadow-sm"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="wide">
                    <span>Email Body (HTML / Text) *</span>
                    <textarea
                      rows={8}
                      placeholder="Enter email content with HTML tags and merge tokens..."
                      value={formBody}
                      onChange={e => setFormBody(e.target.value)}
                      required
                      className="font-mono text-xs leading-relaxed"
                    />
                  </label>
                </div>
              </div>

              <div className="form-modal-footer">
                <button
                  type="button"
                  className="btn secondary text-xs"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary text-xs">
                  Publish Email Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="inline-toast">
          <CheckCircle2 size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
