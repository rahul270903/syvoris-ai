import { useState, useMemo, useEffect } from 'react';
import {
  HeartHandshake, Activity, AlertTriangle, ArrowRight,
  CheckCircle2, Mail, Phone, Calendar, RefreshCw, Send,
  ShieldAlert, Clock
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, AccountItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';

interface AccountEngagementProfile {
  id: string;
  name: string;
  ref: string;
  segment: string;
  score: number;
  lastTouchpoint: string;
  preferredChannel: 'Email' | 'Meetings' | 'Phone' | 'Portal';
  touchpointCount: number;
  churnRisk: 'Low' | 'Moderate' | 'High';
  status: string;
}

const DEFAULT_PROFILES: AccountEngagementProfile[] = [
  {
    id: 'acc-1',
    name: 'Fujikura Optical Technologies Inc',
    ref: 'ACC-VND-0003',
    segment: 'Strategic Vendor / Partner',
    score: 94,
    lastTouchpoint: '2026-11-18',
    preferredChannel: 'Meetings',
    touchpointCount: 38,
    churnRisk: 'Low',
    status: 'Champion',
  },
  {
    id: 'acc-2',
    name: 'Cisco Systems Caribbean & Latin America',
    ref: 'ACC-VND-0002',
    segment: 'Enterprise Partner',
    score: 88,
    lastTouchpoint: '2026-11-16',
    preferredChannel: 'Email',
    touchpointCount: 29,
    churnRisk: 'Low',
    status: 'Champion',
  },
  {
    id: 'acc-3',
    name: 'Vertex Global Solutions',
    ref: 'ACC-2026-00001',
    segment: 'Enterprise Customer',
    score: 78,
    lastTouchpoint: '2026-11-14',
    preferredChannel: 'Phone',
    touchpointCount: 22,
    churnRisk: 'Low',
    status: 'Engaged',
  },
  {
    id: 'acc-4',
    name: 'Corning Optical Communications Ltd',
    ref: 'ACC-VND-0001',
    segment: 'Global Hardware Supplier',
    score: 65,
    lastTouchpoint: '2026-11-04',
    preferredChannel: 'Meetings',
    touchpointCount: 14,
    churnRisk: 'Moderate',
    status: 'Engaged',
  },
  {
    id: 'acc-5',
    name: 'Apex Global Logistics',
    ref: 'ACC-2026-00002',
    segment: 'Mid-Market Logistics',
    score: 42,
    lastTouchpoint: '2026-10-18',
    preferredChannel: 'Email',
    touchpointCount: 6,
    churnRisk: 'High',
    status: 'At-Risk',
  },
  {
    id: 'acc-6',
    name: 'NovaTech Solutions',
    ref: 'ACC-2026-00001',
    segment: 'Cloud Partner',
    score: 38,
    lastTouchpoint: '2026-10-12',
    preferredChannel: 'Email',
    touchpointCount: 4,
    churnRisk: 'High',
    status: 'At-Risk',
  },
];

export function CustomerEngagementView() {
  const { addEvent, addAudit } = useCRM();
  const [profiles, setProfiles] = useState<AccountEngagementProfile[]>(DEFAULT_PROFILES);
  const [filter, setFilter] = useState<'All' | 'Champion' | 'Engaged' | 'At-Risk'>('All');
  const [toast, setToast] = useState<string>('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const filteredProfiles = useMemo(() => {
    if (filter === 'All') return profiles;
    return profiles.filter(p => p.status === filter);
  }, [profiles, filter]);

  const stats = useMemo(() => {
    const total = profiles.length;
    const avgScore = Math.round(profiles.reduce((s, p) => s + p.score, 0) / total);
    const champions = profiles.filter(p => p.status === 'Champion').length;
    const atRisk = profiles.filter(p => p.status === 'At-Risk').length;
    return { total, avgScore, champions, atRisk };
  }, [profiles]);

  const handleTriggerReengagement = async (profile: AccountEngagementProfile) => {
    try {
      await api.createAccountActivity(profile.id, {
        activity_type: 'Email',
        subject: `Automated Re-engagement Cadence Triggered for ${profile.name}`,
        description: `Triggered 30-day reactivation touchpoint for account at churn risk score ${profile.score}/100.`,
      });
    } catch {
      // Local fallback
    }

    setProfiles(prev =>
      prev.map(p =>
        p.id === profile.id
          ? {
              ...p,
              score: Math.min(100, p.score + 15),
              status: p.score + 15 >= 50 ? 'Engaged' : 'At-Risk',
              churnRisk: p.score + 15 >= 50 ? 'Moderate' : 'High',
              lastTouchpoint: new Date().toISOString().slice(0, 10),
            }
          : p
      )
    );

    addEvent('engagement.triggered', { ref: profile.ref }, `Re-engagement campaign dispatched to ${profile.name}`);
    addAudit('Customer Re-engagement Triggered', 'Arjun Mehta', `Initiated outreach for ${profile.name}`);
    notify(`Re-engagement campaign triggered for ${profile.name}! Touchpoint logged.`);
  };

  return (
    <div className="workspace-page space-y-4">
      {/* Header */}
      <SectionHeading
        eyebrow="MARKETING & CUSTOMER EXPERIENCE / ENGAGEMENT INTELLIGENCE"
        title="Omnichannel Customer Engagement & Lifecycle Hub"
        subtitle="Monitor client engagement health, track digital touchpoints, execute re-engagement journeys, and prevent customer churn."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Avg Engagement Health</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {stats.avgScore} / 100
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">Strong customer sentiment</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Monitored Accounts</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {stats.total} Enterprises
          </strong>
          <small className="text-xs text-blue-700 font-semibold block mt-1">Active customer lifecycle</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Champion Accounts</span>
          <strong className="text-xl font-bold text-emerald-600 font-manrope block mt-1">
            {stats.champions} Champions
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">Score ≥ 80 with frequent touchpoints</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">At-Risk Accounts</span>
          <strong className="text-xl font-bold text-rose-600 font-manrope block mt-1">
            {stats.atRisk} At-Risk
          </strong>
          <small className="text-xs text-rose-700 font-semibold block mt-1">Requires proactive re-engagement</small>
        </div>
      </div>

      {/* Engagement Segmentation Filter Tabs */}
      <div className="panel p-3 bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Filter Cohort:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['All', 'Champion', 'Engaged', 'At-Risk'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  filter === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tab === 'All' ? 'All Accounts' : `${tab}s`}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[11px] text-slate-500">
          Showing {filteredProfiles.length} of {profiles.length} corporate accounts
        </span>
      </div>

      {/* Customer Engagement Health Table */}
      <section className="panel p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 font-manrope">
              Account Engagement Health & Churn Risk Index
            </h2>
            <p className="text-xs text-slate-500">
              Composite engagement score derived from meeting frequency, email response time, portal activity, and support ticket volume.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="crm-table w-full">
            <thead>
              <tr>
                <th>ACCOUNT / CUSTOMER</th>
                <th>ENGAGEMENT HEALTH</th>
                <th>LAST TOUCHPOINT</th>
                <th>PREFERRED CHANNEL</th>
                <th>LIFECYCLE TOUCHPOINTS</th>
                <th>CHURN RISK</th>
                <th>ENGAGEMENT ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <strong className="text-xs text-slate-800 block">{p.name}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">{p.ref} · {p.segment}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            p.score >= 80 ? 'bg-emerald-500' : p.score >= 50 ? 'bg-blue-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{p.score}/100</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-mono text-slate-600">{p.lastTouchpoint}</span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {p.preferredChannel === 'Email' ? <Mail size={11} className="text-blue-500" /> :
                       p.preferredChannel === 'Meetings' ? <Calendar size={11} className="text-purple-500" /> :
                       p.preferredChannel === 'Phone' ? <Phone size={11} className="text-emerald-500" /> :
                       <Activity size={11} className="text-slate-500" />}
                      {p.preferredChannel}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-slate-700">{p.touchpointCount} Interactions</span>
                  </td>
                  <td>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        p.churnRisk === 'Low'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : p.churnRisk === 'Moderate'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {p.churnRisk} Risk
                    </span>
                  </td>
                  <td>
                    {p.status === 'At-Risk' ? (
                      <button
                        onClick={() => handleTriggerReengagement(p)}
                        className="btn primary text-[11px] py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1"
                      >
                        <Send size={11} /> Re-engage Now
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTriggerReengagement(p)}
                        className="btn secondary text-[11px] py-1 px-2.5 text-blue-700 hover:bg-blue-50 border-blue-200 flex items-center gap-1"
                      >
                        <Activity size={11} /> Log Touchpoint
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Automated Lifecycle Playbooks */}
      <div className="panel p-5 bg-white border border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Automated Omnichannel Lifecycle Playbooks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="block text-slate-800 font-bold mb-1">New Client Welcome Cadence</strong>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
              4-touchpoint automated email and onboarding intro across first 14 days of contract execution.
            </p>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active in Automation
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="block text-slate-800 font-bold mb-1">30-Day Inactive Win-Back</strong>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
              Automatically triggers executive check-in notification when no customer interaction is logged for 30 days.
            </p>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active in Automation
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="block text-slate-800 font-bold mb-1">QBR & Architecture Review</strong>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
              Schedules quarterly business review calendar invite 45 days prior to quarter end for Champion accounts.
            </p>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active in Automation
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="block text-slate-800 font-bold mb-1">Renewal Anticipation Drip</strong>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
              Sends value summary report and renewal proposal 60 days before subscription expiration.
            </p>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active in Automation
            </span>
          </div>
        </div>
      </div>

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
