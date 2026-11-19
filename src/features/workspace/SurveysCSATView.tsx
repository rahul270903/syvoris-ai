import { useState, useMemo, useEffect } from 'react';
import {
  MessageCircle, Star, Plus, CheckCircle2,
  TrendingUp, Award, Smile, Frown, Meh,
  Calendar, Check, X, Building, RefreshCw
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { api, CustomerSurveyItem, CSATSummary } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

interface FeedbackItem {
  id: string;
  accountName: string;
  contactName: string;
  surveyTitle: string;
  score: number;
  maxScore: number;
  sentiment: 'Positive' | 'Neutral' | 'Detractor';
  comment: string;
  date: string;
  contextRef: string;
}

const DEFAULT_FEEDBACK: FeedbackItem[] = [
  {
    id: 'fb-1',
    accountName: 'Vertex Global Solutions',
    contactName: 'Elena Rostova',
    surveyTitle: 'Post-Implementation Architecture Review',
    score: 5,
    maxScore: 5,
    sentiment: 'Positive',
    comment: 'The enterprise deployment was completed 3 days ahead of schedule. Optical transceivers and cloud routing performed flawlessly under peak load.',
    date: '2026-11-18',
    contextRef: 'PRJ-2026-001',
  },
  {
    id: 'fb-2',
    accountName: 'Fujikura Optical Technologies Inc',
    contactName: 'Marcus Vance',
    surveyTitle: 'Support Resolution CSAT',
    score: 5,
    maxScore: 5,
    sentiment: 'Positive',
    comment: 'Fast resolution by the Tier-2 engineering desk during our API gateway migration check.',
    date: '2026-11-15',
    contextRef: 'CAS-2026-003',
  },
  {
    id: 'fb-3',
    accountName: 'Corning Optical Communications Ltd',
    contactName: 'David Lee',
    surveyTitle: 'Executive Commercial Relationship Survey',
    score: 4,
    maxScore: 5,
    sentiment: 'Positive',
    comment: 'Commercial terms and discount negotiations were handled transparently and professionally by Arjun Mehta.',
    date: '2026-11-12',
    contextRef: 'QTE-2026-081',
  },
  {
    id: 'fb-4',
    accountName: 'Apex Global Logistics',
    contactName: 'Marcus Wright',
    surveyTitle: 'Quarterly Platform Experience NPS',
    score: 7,
    maxScore: 10,
    sentiment: 'Neutral',
    comment: 'The system is reliable, though we would appreciate more granular warehouse inventory tracking reports.',
    date: '2026-11-08',
    contextRef: 'ACC-2026-00002',
  },
];

const DEFAULT_SURVEYS: CustomerSurveyItem[] = [
  {
    id: 'srv-1',
    tenant_id: 'default',
    ref: 'SRV-2026-00001',
    title: 'Post-Service CSAT Satisfaction Survey',
    description: 'Triggered automatically when a high-priority customer support case is marked Resolved.',
    survey_type: 'CSAT (1-5 Rating)',
    trigger_event: 'Case Resolution (Case Closed)',
    is_active: true,
    response_count: 64,
    average_score: 4.8,
    created_at: '2026-11-01T08:00:00Z',
  },
  {
    id: 'srv-2',
    tenant_id: 'default',
    ref: 'SRV-2026-00002',
    title: 'Customer Relationship NPS Survey',
    description: 'Quarterly net promoter survey dispatched to executive sponsors and procurement delegates.',
    survey_type: 'NPS (0-10 Scale)',
    trigger_event: 'Quarterly Relationship Schedule',
    is_active: true,
    response_count: 42,
    average_score: 8.6,
    created_at: '2026-11-05T10:00:00Z',
  },
  {
    id: 'srv-3',
    tenant_id: 'default',
    ref: 'SRV-2026-00003',
    title: 'Project Go-Live & Onboarding Survey',
    description: 'Measures implementation satisfaction upon delivery of final project milestone.',
    survey_type: 'CSAT (1-5 Rating)',
    trigger_event: 'Project Milestone Completion',
    is_active: true,
    response_count: 22,
    average_score: 4.9,
    created_at: '2026-11-08T12:00:00Z',
  },
];

export function SurveysCSATView() {
  const { addEvent, addAudit } = useCRM();
  const [surveys, setSurveys] = useState<CustomerSurveyItem[]>(DEFAULT_SURVEYS);
  const [feedback, setFeedback] = useState<FeedbackItem[]>(DEFAULT_FEEDBACK);
  const [activeTab, setActiveTab] = useState<'feedback' | 'rules'>('feedback');
  const [csatSummary, setCsatSummary] = useState<CSATSummary | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  // Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formType, setFormType] = useState<string>('CSAT (1-5 Rating)');
  const [formTrigger, setFormTrigger] = useState<string>('Case Resolution (Case Closed)');
  const [formDescription, setFormDescription] = useState<string>('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const loadData = async () => {
    try {
      const [sRes, cRes] = await Promise.allSettled([
        api.listSurveys(),
        api.getCSATSummary(),
      ]);
      if (sRes.status === 'fulfilled' && sRes.value && sRes.value.length > 0) {
        setSurveys(sRes.value);
      }
      if (cRes.status === 'fulfilled' && cRes.value) {
        setCsatSummary(cRes.value);
      }
    } catch {
      // Handled
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      notify('Please enter a survey title.');
      return;
    }

    const newRef = `SRV-2026-${String(surveys.length + 1).padStart(5, '0')}`;
    const newSurvey: CustomerSurveyItem = {
      id: `srv-${Date.now()}`,
      tenant_id: 'default',
      ref: newRef,
      title: formTitle.trim(),
      description: formDescription.trim(),
      survey_type: formType,
      trigger_event: formTrigger,
      is_active: true,
      response_count: 0,
      average_score: 5.0,
      created_at: new Date().toISOString(),
    };

    setSurveys(prev => [newSurvey, ...prev]);
    try {
      await api.createSurvey(newSurvey);
    } catch {
      // Local fallback
    }

    addEvent('survey.created', { ref: newRef }, `Published survey ${newRef}: ${newSurvey.title}`);
    addAudit('Survey Published', 'Arjun Mehta', `${newRef}: ${newSurvey.title}`);
    notify(`Survey "${newSurvey.title}" created and activated!`);
    setIsDrawerOpen(false);
    setFormTitle('');
    setFormDescription('');
  };

  return (
    <div className="workspace-page space-y-4">
      {/* Header */}
      <SectionHeading
        eyebrow="MARKETING & CUSTOMER EXPERIENCE / VOICE OF CUSTOMER"
        title="Customer Feedback & CSAT / NPS Experience Center"
        subtitle="Measure post-interaction customer satisfaction, net promoter scores, survey response rates, and sentiment feedback."
        action={
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Plus size={14} />
            <span>Create Survey</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Customer Satisfaction (CSAT)</span>
          <strong className="text-xl font-bold text-emerald-600 font-manrope block mt-1">
            {csatSummary?.csat_percentage ? `${csatSummary.csat_percentage}%` : '94.2%'} Positive
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">4.8 / 5.0 Average Rating</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Net Promoter Score (NPS)</span>
          <strong className="text-xl font-bold text-blue-600 font-manrope block mt-1">
            {csatSummary?.nps_score ? `+${csatSummary.nps_score}` : '+58 NPS'}
          </strong>
          <small className="text-xs text-blue-700 font-semibold block mt-1">World-class enterprise index</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Feedback Received</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {csatSummary?.total_responses || 128} Responses
          </strong>
          <small className="text-xs text-slate-400 block mt-1">Across 3 active survey triggers</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Response Completion Rate</span>
          <strong className="text-xl font-bold text-purple-700 font-manrope block mt-1">
            44.6% Rate
          </strong>
          <small className="text-xs text-purple-700 font-semibold block mt-1">+12.4% vs industry baseline</small>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel p-3 bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              activeTab === 'feedback'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Feedback Stream ({feedback.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              activeTab === 'rules'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Survey Rules ({surveys.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Feedback Response Stream */}
      {activeTab === 'feedback' && (
        <section className="panel p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 font-manrope">
                Recent Customer Feedback & Sentiment Stream
              </h2>
              <p className="text-xs text-slate-500">
                Direct verbatim customer comments and ratings submitted across service tickets, onboarding and sales milestones.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {feedback.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-slate-900">{item.accountName}</strong>
                    <span className="text-[11px] text-slate-500">· {item.contactName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {item.contextRef}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: item.score }).map((_, i) => (
                        <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                      ))}
                      <span className="ml-1 text-xs font-bold text-slate-700">
                        {item.score}/{item.maxScore}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                        item.sentiment === 'Positive'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.sentiment === 'Neutral'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {item.sentiment === 'Positive' ? <Smile size={11} /> : <Meh size={11} />}
                      {item.sentiment}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-2.5 rounded border border-slate-200 mb-2">
                  "{item.comment}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Survey: <strong className="text-slate-600">{item.surveyTitle}</strong></span>
                  <span className="font-mono">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 2: Active Survey Rules */}
      {activeTab === 'rules' && (
        <section className="panel p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 font-manrope">
                Automated Survey Delivery & Trigger Rules
              </h2>
              <p className="text-xs text-slate-500">
                System event triggers that dispatch surveys to verified customer contacts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-table w-full">
              <thead>
                <tr>
                  <th>SURVEY REF</th>
                  <th>SURVEY TITLE & DESCRIPTION</th>
                  <th>TYPE / SCALE</th>
                  <th>AUTOMATED TRIGGER EVENT</th>
                  <th>RESPONSES</th>
                  <th>AVERAGE SCORE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <span className="ref-link font-mono text-xs">{s.ref}</span>
                    </td>
                    <td>
                      <strong className="text-xs text-slate-800 block">{s.title}</strong>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{s.description}</span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-slate-700">{s.survey_type}</span>
                    </td>
                    <td>
                      <span className="inline-block text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {s.trigger_event}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-slate-800">{s.response_count || 0}</span>
                    </td>
                    <td>
                      <strong className="text-xs text-emerald-700 font-bold">
                        ★ {Number(s.average_score || 0).toFixed(1)}
                      </strong>
                    </td>
                    <td>
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Create Survey Drawer */}
      {isDrawerOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setIsDrawerOpen(false)}>
          <div className="form-modal">
            <div className="form-modal-head">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  VOICE OF CUSTOMER
                </span>
                <h2 className="text-base font-bold text-slate-800">Create Customer Survey</h2>
                <p className="text-xs text-slate-500">
                  Configure an automated customer experience survey with lifecycle event triggers.
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

            <form onSubmit={handleCreateSurvey} className="flex flex-col flex-1 overflow-hidden">
              <div className="form-modal-body space-y-4">
                <div className="form-grid">
                  <label className="wide">
                    <span>Survey Title *</span>
                    <input
                      type="text"
                      placeholder="e.g. Q4 Executive Commercial Satisfaction Survey"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    <span>Survey Metric Scale *</span>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value)}
                      required
                    >
                      <option value="CSAT (1-5 Rating)">CSAT (1-5 Star Satisfaction)</option>
                      <option value="NPS (0-10 Scale)">NPS (0-10 Net Promoter Score)</option>
                      <option value="CES (1-7 Effort Scale)">CES (Customer Effort Score 1-7)</option>
                    </select>
                  </label>

                  <label>
                    <span>Lifecycle Trigger Event *</span>
                    <select
                      value={formTrigger}
                      onChange={e => setFormTrigger(e.target.value)}
                      required
                    >
                      <option value="Case Resolution (Case Closed)">Case Resolution (Ticket Closed)</option>
                      <option value="Opportunity Closed Won">Opportunity Closed Won</option>
                      <option value="Project Milestone Completion">Project Milestone Completion</option>
                      <option value="Quarterly Relationship Schedule">Quarterly Relationship Schedule</option>
                      <option value="Manual Dispatch">Manual Sales Dispatch</option>
                    </select>
                  </label>

                  <label className="wide">
                    <span>Survey Description & Purpose</span>
                    <textarea
                      rows={4}
                      placeholder="Explain to participants why their feedback matters and how it shapes platform operations..."
                      value={formDescription}
                      onChange={e => setFormDescription(e.target.value)}
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
                  Publish Survey
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
