import { useState, useMemo, useEffect } from 'react';
import {
  Send, Sparkles, CheckCircle2, ShieldAlert, ShieldCheck, ArrowRight,
  TrendingUp, Users, Target, Globe, Filter, Phone, Mail, Building2,
  RefreshCw, Loader2, Gauge, Award, Check
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, type LeadItem } from '../../services/api';
import { money, shortDate, type CRMRecord } from '../../data/models';
import { LeadConversionModal } from './LeadConversionModal';

const GENERIC_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'aol.com', 'mail.com', 'protonmail.com'
]);

const PRIORITY_INDUSTRIES = new Set([
  'telecommunications', 'technology', 'finance', 'healthcare',
  'saas', 'manufacturing', 'information technology', 'banking'
]);

// Frontend real-time simulator mirror of backend scoring
function calculatePreviewScore(form: {
  jobTitle: string;
  email: string;
  phone: string;
  source: string;
  industry: string;
  consent: string;
}) {
  let score = 10;
  const factors: { name: string; weight: number; positive: boolean }[] = [
    { name: 'Baseline Intake', weight: 10, positive: true }
  ];

  const title = (form.jobTitle || '').toLowerCase().trim();
  if (['c-level', 'chief', 'cxo', 'ceo', 'cto', 'cio', 'cfo', 'cro', 'president', 'founder', 'owner'].some(t => title.includes(t))) {
    score += 25;
    factors.push({ name: 'Executive C-Level Decision Maker', weight: 25, positive: true });
  } else if (['vice president', 'vp', 'director', 'head of', 'procurement', 'buyer'].some(t => title.includes(t))) {
    score += 20;
    factors.push({ name: 'Senior Director / Procurement Authority', weight: 20, positive: true });
  } else if (['manager', 'lead', 'supervisor', 'coordinator'].some(t => title.includes(t))) {
    score += 10;
    factors.push({ name: 'Operational Department Management', weight: 10, positive: true });
  } else if (['intern', 'assistant', 'student'].some(t => title.includes(t))) {
    score -= 10;
    factors.push({ name: 'Entry-Level / Non-Decision Maker', weight: -10, positive: false });
  }

  const email = (form.email || '').toLowerCase().trim();
  if (email.includes('@')) {
    const domain = email.split('@')[1];
    if (GENERIC_DOMAINS.has(domain)) {
      score -= 5;
      factors.push({ name: 'Generic Public Webmail Domain', weight: -5, positive: false });
    } else if (domain && domain.includes('.')) {
      score += 15;
      factors.push({ name: 'Verified Corporate Email Domain', weight: 15, positive: true });
    }
  }

  const phone = (form.phone || '').trim();
  if (phone.length >= 7) {
    score += 10;
    factors.push({ name: 'Direct Contact Phone Provided', weight: 10, positive: true });
  }

  const source = (form.source || '').toLowerCase().trim();
  if (['partner', 'referral', 'demo request', 'inbound demo'].some(s => source.includes(s))) {
    score += 20;
    factors.push({ name: 'High-Intent Inbound / Partner Referral', weight: 20, positive: true });
  } else if (['website', 'contact', 'webform', 'live chat'].some(s => source.includes(s))) {
    score += 10;
    factors.push({ name: 'Direct Inbound Channel', weight: 10, positive: true });
  } else if (['event', 'trade show', 'webinar'].some(s => source.includes(s))) {
    score += 10;
    factors.push({ name: 'Event / Webinar Engagement', weight: 10, positive: true });
  } else if (source.includes('outbound')) {
    score += 5;
    factors.push({ name: 'Outbound Prospecting Source', weight: 5, positive: true });
  }

  const ind = (form.industry || '').toLowerCase().trim();
  if (PRIORITY_INDUSTRIES.has(ind) || Array.from(PRIORITY_INDUSTRIES).some(p => ind.includes(p))) {
    score += 15;
    factors.push({ name: 'Tier-1 Strategic Industry Fit', weight: 15, positive: true });
  } else if (ind) {
    score += 5;
    factors.push({ name: 'Standard Commercial Industry', weight: 5, positive: true });
  }

  const consent = (form.consent || '').toLowerCase().trim();
  if (['permitted', 'granted', 'opted-in', 'yes'].some(c => consent.includes(c))) {
    score += 10;
    factors.push({ name: 'Explicit Communication Consent Verified', weight: 10, positive: true });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    factors
  };
}

export function LeadCaptureView({
  onLeadCaptured,
  onNavigateToConversion
}: {
  onLeadCaptured?: () => void;
  onNavigateToConversion?: () => void;
}) {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Website');
  const [industry, setIndustry] = useState('Technology');
  const [territory, setTerritory] = useState('North America');
  const [priority, setPriority] = useState('Normal');
  const [consent, setConsent] = useState('Email and phone permitted');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<{ ref: string; name: string; score: number } | null>(null);

  // Queue filter
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [convertingLead, setConvertingLead] = useState<CRMRecord | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.listLeads({ limit: 50, sort_by: 'created_at', sort_order: 'desc' });
      setLeads(res.items || []);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to retrieve recent leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Compute live preview score
  const preview = useMemo(() => {
    return calculatePreviewScore({
      jobTitle,
      email,
      phone,
      source,
      industry,
      consent
    });
  }, [jobTitle, email, phone, source, industry, consent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessBanner(null);

    // Validate mandatory fields
    if (!firstName.trim() || !lastName.trim() || !companyName.trim() || !email.trim()) {
      setFormError('First Name, Last Name, Company Name, and Work Email are required.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setFormError('Please enter a valid work email address.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createLead({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: companyName.trim(),
        job_title: jobTitle.trim() || undefined,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        source,
        industry: industry || undefined,
        territory: territory || undefined,
        status: 'New',
        priority,
        consent_status: consent,
        description: description.trim() || undefined,
      });

      setSuccessBanner({
        ref: created.ref,
        name: created.full_name,
        score: created.score,
      });

      // Reset form
      setFirstName('');
      setLastName('');
      setCompanyName('');
      setJobTitle('');
      setEmail('');
      setPhone('');
      setDescription('');

      await fetchLeads();
      if (onLeadCaptured) onLeadCaptured();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to capture lead to PostgreSQL.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQualifyLead = async (leadId: string) => {
    try {
      await api.updateLead(leadId, { status: 'Qualified' });
      await fetchLeads();
    } catch (err: any) {
      alert(`Qualification failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const filteredQueue = useMemo(() => {
    return leads.filter(l => {
      const matchesChannel = selectedChannel === 'All' || l.source.toLowerCase().includes(selectedChannel.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        l.ref.toLowerCase().includes(q) ||
        l.full_name.toLowerCase().includes(q) ||
        l.company_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q);
      return matchesChannel && matchesSearch;
    });
  }, [leads, selectedChannel, searchQuery]);

  // Channel metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const highFit = leads.filter(l => l.score >= 70).length;
    const qualified = leads.filter(l => l.status === 'Qualified').length;
    const converted = leads.filter(l => l.status === 'Converted').length;
    return { total, highFit, qualified, converted };
  }, [leads]);

  return (
    <div className="workspace-page">
      <SectionHeading
        eyebrow="LEAD CAPTURE & CONVERSIONS / INTAKE"
        title="Inbound Lead Capture & Channel Intake"
        subtitle="Intake prospects across webforms, partner channels, events, and inbound integrations with automated explainable scoring and sequential reference generation."
        action={
          <button className="btn secondary small" onClick={fetchLeads} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Queue
          </button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Leads Captured</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{metrics.total}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider block">High-Fit Prospects (≥70)</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{metrics.highFit}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award size={20} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-cyan-600 font-bold uppercase tracking-wider block">Qualified Queue</span>
            <span className="text-2xl font-bold text-cyan-700 mt-1 block">{metrics.qualified}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Target size={20} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-purple-600 font-bold uppercase tracking-wider block">Converted Customers</span>
            <span className="text-2xl font-bold text-purple-700 mt-1 block">{metrics.converted}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Main Split Section: Form on Left, Queue on Right */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN: Capture Form & Scoring Simulator */}
        <div className="col-span-6 space-y-4">
          <div className="panel p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                  <Send size={16} />
                </span>
                <h2 className="text-sm font-bold text-slate-800">Lead Capture Form</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">PostgreSQL Direct</span>
            </div>

            {successBanner && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>
                    Lead <b>{successBanner.ref}</b> ({successBanner.name}) captured successfully with initial score <b>{successBanner.score}/100</b>!
                  </span>
                </div>
                <button
                  className="text-emerald-700 font-bold hover:underline"
                  onClick={() => setSuccessBanner(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {formError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Channel Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lead Acquisition Channel *</label>
                <select
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                >
                  <option value="Website">Website Direct Inbound</option>
                  <option value="Partner Referral">Partner Referral (High Intent)</option>
                  <option value="Inbound Demo">Inbound Demo Request (High Intent)</option>
                  <option value="Trade Event">Trade Event / Industry Conference</option>
                  <option value="Live Chat">Website Live Chat</option>
                  <option value="Outbound Voice">Outbound Voice Campaign</option>
                  <option value="Email">Direct Email Inbound</option>
                  <option value="Social">Social Network / Professional Referral</option>
                  <option value="Webform">External Webform Integration</option>
                  <option value="Other">Other Acquisition Source</option>
                </select>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  First Name *
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="e.g. Elena"
                    required
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Last Name *
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="e.g. Rostova"
                    required
                  />
                </label>
              </div>

              {/* Corporate Info */}
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Company / Organization *
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Nordic Telecom OY"
                    required
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Job Title
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder="e.g. Chief Technology Officer"
                  />
                </label>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Work Email *
                  <input
                    type="email"
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. elena@nordictelecom.fi"
                    required
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Direct Phone
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +358-40-555-0199"
                  />
                </label>
              </div>

              {/* Strategy & Qualification */}
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Strategic Industry
                  <select
                    className="p-2 border border-slate-300 rounded text-xs bg-white"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                  >
                    <option value="Telecommunications">Telecommunications</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance / Banking</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Public Sector">Public Sector</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Territory
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={territory}
                    onChange={e => setTerritory(e.target.value)}
                    placeholder="e.g. Nordics"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Priority
                  <select
                    className="p-2 border border-slate-300 rounded text-xs bg-white"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
              </div>

              {/* Consent & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Communication Consent
                  <select
                    className="p-2 border border-slate-300 rounded text-xs bg-white"
                    value={consent}
                    onChange={e => setConsent(e.target.value)}
                  >
                    <option value="Email and phone permitted">Email and phone permitted</option>
                    <option value="Email permitted">Email permitted</option>
                    <option value="Voice permitted">Voice permitted</option>
                    <option value="Pending">Pending confirmation</option>
                    <option value="Opted out">Opted out</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Lead Intake Notes
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Project scope or requirements..."
                  />
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="btn primary w-full py-2.5 flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Persisting Lead to PostgreSQL...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Capture & Score Lead (Save Record)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* REAL-TIME PREVIEW SCORING CARD */}
          <div className="panel p-4 bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <Gauge size={16} className="text-indigo-600" />
                <span>Live Rule-Based Scoring Engine Preview</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Predicted Score:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                  preview.score >= 70 ? 'bg-emerald-100 text-emerald-800' :
                  preview.score >= 40 ? 'bg-blue-100 text-blue-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {preview.score}/100
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">Evaluated Scoring Factors:</span>
              <div className="flex flex-wrap gap-1.5">
                {preview.factors.map(f => (
                  <span
                    key={f.name}
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium ${
                      f.positive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span>{f.positive ? `+${f.weight}` : f.weight}</span>
                    <span>{f.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recent Captured Queue */}
        <div className="col-span-6 space-y-4">
          <div className="panel p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Recently Captured Prospects</h2>
                <p className="text-xs text-slate-500">Live PostgreSQL lead repository queue</p>
              </div>
              <span className="phase-chip">{filteredQueue.length} records</span>
            </div>

            {/* Filter controls */}
            <div className="flex gap-2 mb-3">
              <input
                className="p-2 border border-slate-200 rounded text-xs flex-1"
                placeholder="Search reference, prospect name, company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <select
                className="p-2 border border-slate-200 rounded text-xs bg-white"
                value={selectedChannel}
                onChange={e => setSelectedChannel(e.target.value)}
              >
                <option value="All">All Channels</option>
                <option value="Website">Website</option>
                <option value="Partner">Partner</option>
                <option value="Demo">Demo</option>
                <option value="Event">Event</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>

            {fetchError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 mb-3">
                {fetchError}
              </div>
            )}

            {loading && leads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
                Loading leads from PostgreSQL...
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                No captured prospects match the filter criteria.
              </div>
            ) : (
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {filteredQueue.map(lead => {
                  const asRecord: CRMRecord = {
                    id: lead.id,
                    ref: lead.ref,
                    title: lead.full_name,
                    description: `${lead.job_title || 'Lead'} at ${lead.company_name}`,
                    status: lead.status,
                    owner: lead.owner_name || 'Owner',
                    amount: 0,
                    date: lead.created_at ? lead.created_at.slice(0, 10) : '',
                    links: {
                      organizations: lead.converted_account_id ? [lead.converted_account_id] : [],
                      contacts: lead.converted_contact_id ? [lead.converted_contact_id] : [],
                      opportunities: lead.converted_opportunity_id ? [lead.converted_opportunity_id] : [],
                    },
                    history: [],
                    fields: {
                      company: lead.company_name,
                      jobTitle: lead.job_title || '',
                      email: lead.email,
                      phone: lead.phone || '',
                      source: lead.source,
                      score: String(lead.score),
                      priority: lead.priority,
                      consent: lead.consent_status,
                    }
                  };

                  return (
                    <div
                      key={lead.id}
                      className="p-3 bg-white hover:bg-slate-50/80 rounded-lg border border-slate-200 transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-blue-600">{lead.ref}</span>
                          <StatusPill status={lead.status} />
                          <span className="text-[10px] text-slate-400">· {lead.source}</span>
                        </div>
                        <strong className="text-xs text-slate-900 block truncate">{lead.full_name}</strong>
                        <span className="text-[11px] text-slate-600 block truncate">
                          {lead.job_title ? `${lead.job_title} · ` : ''}{lead.company_name}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><Mail size={10} /> {lead.email}</span>
                          {lead.phone && <span className="flex items-center gap-1"><Phone size={10} /> {lead.phone}</span>}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          lead.score >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          lead.score >= 40 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          Score {lead.score}
                        </span>

                        <div className="flex items-center gap-1">
                          {lead.status === 'New' && (
                            <button
                              className="btn secondary small py-1 px-2 text-[11px]"
                              onClick={() => handleQualifyLead(lead.id)}
                            >
                              Qualify
                            </button>
                          )}
                          {lead.status !== 'Converted' && (
                            <button
                              className="btn primary small py-1 px-2 text-[11px] flex items-center gap-1"
                              onClick={() => setConvertingLead(asRecord)}
                            >
                              <Sparkles size={11} /> Convert
                            </button>
                          )}
                          {lead.status === 'Converted' && (
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Converted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {convertingLead && (
        <LeadConversionModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onComplete={async (org, con, opp) => {
            setConvertingLead(null);
            await fetchLeads();
            if (onNavigateToConversion) {
              onNavigateToConversion();
            }
          }}
        />
      )}
    </div>
  );
}
