import React, { useState, useEffect } from 'react';
import {
  FileCheck2, Plus, RefreshCw, CheckCircle2, Globe2,
  Copy, Check, Code2, AlertTriangle, X, Send, Inbox, ArrowRight
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, SupportWebformItem, WebformSubmissionItem } from '../../services/api';

export function SupportWebformsView() {
  const [webforms, setWebforms] = useState<SupportWebformItem[]>([]);
  const [submissions, setSubmissions] = useState<WebformSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Webform for Embed & Preview
  const [selectedForm, setSelectedForm] = useState<SupportWebformItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Create Webform Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Cloud Infrastructure');
  const [formPriority, setFormPriority] = useState('High');
  const [creating, setCreating] = useState(false);

  // Test Submission Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testFullName, setTestFullName] = useState('Elena Rostova');
  const [testEmail, setTestEmail] = useState('elena.rostova@novatech.example');
  const [testSubject, setTestSubject] = useState('Production Microservice Latency Degradation');
  const [testDescription, setTestDescription] = useState('Observed 504 timeouts on regional microservice cluster.');
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState<WebformSubmissionItem | null>(null);

  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [formsRes, subsRes] = await Promise.all([
        api.listSupportWebforms(),
        api.listWebformSubmissions({ limit: 50 })
      ]);
      setWebforms(formsRes || []);
      setSubmissions(subsRes || []);
      if (formsRes && formsRes.length > 0 && !selectedForm) {
        setSelectedForm(formsRes[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load support webforms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyCode = (slug: string) => {
    const code = `<script src="https://app.syvoris.ai/embed/webform.js" data-form="${slug}"></script>`;
    navigator.clipboard.writeText(code);
    setCopiedSlug(slug);
    notify('Embed snippet copied to clipboard.');
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleCreateWebform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) return;
    setCreating(true);
    try {
      const newForm = await api.createSupportWebform({
        name: formName.trim(),
        slug: formSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        title: formTitle.trim() || formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        priority: formPriority,
        is_active: true,
        fields_config: [
          { name: 'full_name', label: 'Contact Name', type: 'text', required: true },
          { name: 'email', label: 'Work Email', type: 'email', required: true },
          { name: 'subject', label: 'Brief Summary', type: 'text', required: true },
          { name: 'description', label: 'Detailed Steps', type: 'textarea', required: true },
        ]
      });
      setWebforms(prev => [...prev, newForm]);
      setSelectedForm(newForm);
      setShowCreateModal(false);
      setFormName('');
      setFormSlug('');
      setFormTitle('');
      setFormDescription('');
      notify(`Webform ${newForm.name} created successfully.`);
    } catch (err: any) {
      notify(`Creation failed: ${err?.message || 'Error'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleRunTestSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;
    setSubmittingTest(true);
    setTestResult(null);
    try {
      const res = await api.submitWebform(selectedForm.slug, {
        submission_data: {
          full_name: testFullName,
          email: testEmail,
          subject: testSubject,
          description: testDescription,
        }
      });
      setTestResult(res);
      setSubmissions(prev => [res, ...prev]);
      notify('Test submission processed and case created in database!');
    } catch (err: any) {
      notify(`Submission failed: ${err?.message || 'Error submitting test form'}`);
    } finally {
      setSubmittingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <SectionHeading
        eyebrow="SERVICE ADMINISTRATION / DIGITAL INTAKE"
        title="Support Webforms"
        subtitle="Embed customer incident submission forms on websites, documentation portals, and external help centers with automatic case routing."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="btn secondary flex items-center gap-1.5 text-xs py-2 px-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowTestModal(true)}
              className="btn secondary flex items-center gap-1.5 text-xs py-2 px-3 text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 font-bold rounded-lg"
            >
              <Send size={13} />
              <span>Test Intake</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn primary bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm rounded-lg"
            >
              <Plus size={14} />
              <span>New Webform</span>
            </button>
          </div>
        }
      />

      {/* Webforms Register & Selected Form Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Webforms List */}
        <div className="space-y-3 lg:col-span-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Configured Intake Forms ({webforms.length})
          </span>

          <div className="space-y-2.5">
            {webforms.map(wf => {
              const isSelected = selectedForm?.id === wf.id;
              return (
                <div
                  key={wf.id}
                  onClick={() => setSelectedForm(wf)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/60 border-sky-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-sky-600 bg-sky-100/60 px-1.5 py-0.5 rounded">
                      {wf.ref}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{wf.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{wf.description}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Route: <strong className="text-slate-800">{wf.category || 'General'}</strong></span>
                    <span>Priority: <strong className="text-slate-800">{wf.priority}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Embed Snippet & Live Form Inspection */}
        {selectedForm ? (
          <div className="panel p-5 bg-white border border-slate-200 shadow-sm rounded-xl lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Webform Endpoint</span>
                <h3 className="text-base font-black text-slate-900">{selectedForm.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Slug identifier: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sky-700 font-mono">{selectedForm.slug}</code></p>
              </div>
              <button
                onClick={() => handleCopyCode(selectedForm.slug)}
                className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              >
                {copiedSlug === selectedForm.slug ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedSlug === selectedForm.slug ? 'Copied!' : 'Copy Embed Code'}</span>
              </button>
            </div>

            {/* Embed Code Snippet Card */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 size={14} className="text-sky-600" />
                <span>Embed Code for External Sites</span>
              </span>
              <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
                <code>{`<script src="https://app.syvoris.ai/embed/webform.js" data-form="${selectedForm.slug}"></script>`}</code>
              </div>
            </div>

            {/* Schema / Fields Configuration */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Form Schema Fields</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {(selectedForm.fields_config || []).map((f: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{f.label || f.name}</span>
                      <span className="text-[11px] text-slate-400 block">Type: {f.type}</span>
                    </div>
                    {f.required && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        REQUIRED
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="panel p-8 bg-white border border-slate-200 text-center text-slate-400 lg:col-span-2">
            Select a webform to inspect configuration and embed code.
          </div>
        )}
      </div>

      {/* Submissions Log Table */}
      <div className="panel bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden space-y-3">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ingested Form Submissions & Converted Cases</h3>
            <p className="text-xs text-slate-500">Live incoming client inquiries submitted via public webforms.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {submissions.length} total submissions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Submission Ref</th>
                <th className="py-3 px-4">Contact & Email</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Created Support Case</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Received Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.length > 0 ? (
                submissions.map(s => {
                  const data = s.submission_data || {};
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600">
                        {s.case_ref || `SUB-${s.id.slice(0, 8).toUpperCase()}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{data.full_name || 'Public Visitor'}</div>
                        <div className="text-[11px] text-slate-400">{data.email || 'No email provided'}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs truncate">
                        {data.subject || 'Webform Submission'}
                      </td>
                      <td className="py-3 px-4">
                        {s.case_id ? (
                          <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                            CASE-2026-ACTIVE
                          </span>
                        ) : (
                          <span className="text-slate-400">Processing</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill status={s.status} />
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {s.created_at ? s.created_at.slice(0, 16).replace('T', ' ') : 'Just now'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No webform submissions recorded yet. Use &quot;Test Intake&quot; above to simulate a live submission.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Submission Modal */}
      {showTestModal && selectedForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Live Intake Simulation</span>
                <h3 className="text-sm font-black text-slate-900">Submit to {selectedForm.name}</h3>
              </div>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRunTestSubmission} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={testFullName}
                  onChange={e => setTestFullName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Incident Summary</label>
                <input
                  type="text"
                  required
                  value={testSubject}
                  onChange={e => setTestSubject(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={testDescription}
                  onChange={e => setTestDescription(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              {testResult && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Submission confirmed! Record <strong>{testResult.case_ref || testResult.id.slice(0, 8).toUpperCase()}</strong> converted to live support ticket.</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="btn secondary py-1.5 px-3 text-slate-700 bg-white border border-slate-300 rounded font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingTest}
                  className="btn primary py-1.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{submittingTest ? 'Submitting...' : 'Submit Form'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Webform Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">Create Support Webform</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWebform} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Webform Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Developer SLA Escalation Form"
                  value={formName}
                  onChange={e => {
                    setFormName(e.target.value);
                    if (!formSlug) setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Identifier (Slug)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. vip-escalation"
                  value={formSlug}
                  onChange={e => setFormSlug(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Routing Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="API Integration">API Integration</option>
                    <option value="Billing & Invoicing">Billing & Invoicing</option>
                    <option value="General Support">General Support</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Critical">Critical (P1)</option>
                    <option value="High">High (P2)</option>
                    <option value="Normal">Normal (P3)</option>
                    <option value="Low">Low (P4)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer-Facing Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain form instructions shown to visitors..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn secondary py-1.5 px-3 text-slate-700 bg-white border border-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn primary py-1.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded"
                >
                  {creating ? 'Creating...' : 'Create Webform'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}