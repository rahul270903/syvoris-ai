import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2, Gauge, ShieldAlert, ShieldCheck, Sparkles, Target,
  Users, RefreshCw, Loader2, ArrowRight, XCircle, Clock, Building2,
  Mail, Phone, Award, CheckSquare, Square, ExternalLink
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, type LeadItem } from '../../services/api';
import { money, shortDate, type CRMRecord } from '../../data/models';
import { LeadConversionModal } from './LeadConversionModal';

export function LeadQualificationView({
  onNavigateToConversion
}: {
  onNavigateToConversion?: () => void;
}) {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Filters
  const [scoreTier, setScoreTier] = useState<'all' | 'high' | 'medium' | 'low' | 'nurture'>('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // BANT Checklist local state per lead
  const [bantState, setBantState] = useState<Record<string, { budget: boolean; authority: boolean; need: boolean; timeline: boolean }>>({});

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [convertingLead, setConvertingLead] = useState<CRMRecord | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.listLeads({ limit: 100, sort_by: 'score', sort_order: 'desc' });
      const items = res.items || [];
      setLeads(items);
      if (items.length > 0 && !selectedLeadId) {
        setSelectedLeadId(items[0].id);
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to fetch leads for qualification.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const selectedLead = useMemo(() => {
    return leads.find(l => l.id === selectedLeadId) || leads[0] || null;
  }, [leads, selectedLeadId]);

  // Lead converted to CRMRecord format for conversion modal
  const selectedAsRecord = useMemo<CRMRecord | null>(() => {
    if (!selectedLead) return null;
    return {
      id: selectedLead.id,
      ref: selectedLead.ref,
      title: selectedLead.full_name,
      description: `${selectedLead.job_title || 'Lead'} at ${selectedLead.company_name}`,
      status: selectedLead.status,
      owner: selectedLead.owner_name || 'Owner',
      amount: 0,
      date: selectedLead.created_at ? selectedLead.created_at.slice(0, 10) : '',
      links: {
        organizations: selectedLead.converted_account_id ? [selectedLead.converted_account_id] : [],
        contacts: selectedLead.converted_contact_id ? [selectedLead.converted_contact_id] : [],
        opportunities: selectedLead.converted_opportunity_id ? [selectedLead.converted_opportunity_id] : [],
      },
      history: [],
      fields: {
        company: selectedLead.company_name,
        organization: selectedLead.company_name,
        firstName: selectedLead.first_name,
        lastName: selectedLead.last_name,
        jobTitle: selectedLead.job_title || '',
        email: selectedLead.email,
        phone: selectedLead.phone || '',
        source: selectedLead.source,
        industry: selectedLead.industry || '',
        territory: selectedLead.territory || '',
        score: String(selectedLead.score),
        priority: selectedLead.priority,
        consent: selectedLead.consent_status,
        description: selectedLead.description || '',
      }
    };
  }, [selectedLead]);

  // Current lead BANT state
  const currentBant = selectedLead ? bantState[selectedLead.id] || {
    budget: selectedLead.score >= 50,
    authority: ['chief', 'c-level', 'cxo', 'ceo', 'cto', 'cio', 'cfo', 'director', 'vp'].some(t => (selectedLead.job_title || '').toLowerCase().includes(t)),
    need: true,
    timeline: selectedLead.priority === 'Urgent' || selectedLead.priority === 'High'
  } : { budget: false, authority: false, need: false, timeline: false };

  const toggleBant = (key: 'budget' | 'authority' | 'need' | 'timeline') => {
    if (!selectedLead) return;
    setBantState(prev => ({
      ...prev,
      [selectedLead.id]: {
        ...currentBant,
        [key]: !currentBant[key]
      }
    }));
  };

  const handleUpdateStatus = async (newStatus: 'Qualified' | 'Nurture' | 'Disqualified') => {
    if (!selectedLead) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.updateLead(selectedLead.id, { status: newStatus });
      setActionSuccess(`Lead ${selectedLead.ref} status updated to ${newStatus} in PostgreSQL.`);
      await fetchLeads();
    } catch (err: any) {
      setActionError(err?.message || `Failed to transition lead to ${newStatus}.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered queue
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // Score tier filter
      if (scoreTier === 'high' && l.score < 70) return false;
      if (scoreTier === 'medium' && (l.score < 40 || l.score >= 70)) return false;
      if (scoreTier === 'low' && l.score >= 40) return false;
      if (scoreTier === 'nurture' && l.status !== 'Nurture') return false;

      // Status filter
      if (statusFilter !== 'All' && l.status !== statusFilter) return false;

      // Search term
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches = l.ref.toLowerCase().includes(q) ||
          l.full_name.toLowerCase().includes(q) ||
          l.company_name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [leads, scoreTier, statusFilter, search]);

  // Qualification Metrics
  const stats = useMemo(() => {
    const queue = leads.filter(l => ['New', 'Contacted', 'In Progress', 'Nurture'].includes(l.status)).length;
    const highFit = leads.filter(l => l.score >= 70 && l.status !== 'Converted').length;
    const qualified = leads.filter(l => l.status === 'Qualified').length;
    const avgScore = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0;
    return { queue, highFit, qualified, avgScore };
  }, [leads]);

  return (
    <div className="workspace-page">
      <SectionHeading
        eyebrow="LEAD CAPTURE & CONVERSIONS / WORKSPACE"
        title="Lead Qualification & Decision Engine"
        subtitle="Evaluate inbound prospects against rule-based scoring criteria, explainable fit factors, and BANT qualification gates before converting into revenue pipeline."
        action={
          <button className="btn secondary small" onClick={fetchLeads} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Queue
          </button>
        }
      />

      {/* Qualification Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Review Queue</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.queue}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider block">High Fit Ready (≥70)</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{stats.highFit}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award size={20} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider block">Avg Qualification Score</span>
            <span className="text-2xl font-bold text-indigo-700 mt-1 block">{stats.avgScore}/100</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Gauge size={20} />
          </div>
        </div>

        <div className="panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-cyan-600 font-bold uppercase tracking-wider block">Qualified for Conversion</span>
            <span className="text-2xl font-bold text-cyan-700 mt-1 block">{stats.qualified}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN: Queue */}
        <div className="col-span-5 space-y-3">
          <div className="panel p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Qualification Queue</h2>
              <span className="phase-chip">{filteredLeads.length} leads</span>
            </div>

            {/* Score Tier Chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition ${
                  scoreTier === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => setScoreTier('all')}
              >
                All
              </button>
              <button
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition ${
                  scoreTier === 'high' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
                onClick={() => setScoreTier('high')}
              >
                High Fit (≥70)
              </button>
              <button
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition ${
                  scoreTier === 'medium' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
                onClick={() => setScoreTier('medium')}
              >
                Medium (40-69)
              </button>
              <button
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition ${
                  scoreTier === 'low' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
                onClick={() => setScoreTier('low')}
              >
                Review (&lt;40)
              </button>
              <button
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition ${
                  scoreTier === 'nurture' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
                onClick={() => setScoreTier('nurture')}
              >
                Nurture
              </button>
            </div>

            {/* Search and status filter */}
            <div className="flex gap-2 mb-3">
              <input
                className="p-2 border border-slate-200 rounded text-xs flex-1"
                placeholder="Search prospect or company..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="p-2 border border-slate-200 rounded text-xs bg-white"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Qualified">Qualified</option>
                <option value="Nurture">Nurture</option>
                <option value="Disqualified">Disqualified</option>
                <option value="Converted">Converted</option>
              </select>
            </div>

            {loading && leads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
                Loading qualification queue...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                No prospects match the qualification filter.
              </div>
            ) : (
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {filteredLeads.map(lead => {
                  const isSelected = selectedLead?.id === lead.id;
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-slate-700">{lead.ref}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            lead.score >= 70 ? 'bg-emerald-100 text-emerald-800' :
                            lead.score >= 40 ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            Score {lead.score}
                          </span>
                          <StatusPill status={lead.status} />
                        </div>
                      </div>
                      <strong className="text-xs text-slate-900 block truncate">{lead.full_name}</strong>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {lead.job_title ? `${lead.job_title} · ` : ''}{lead.company_name}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Source: {lead.source} · {lead.created_at ? shortDate(lead.created_at.slice(0, 10)) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Qualification Inspector */}
        <div className="col-span-7 space-y-4">
          {!selectedLead ? (
            <div className="panel p-12 text-center text-slate-400 text-xs">
              Select a prospect from the qualification queue to inspect scoring factors and execute qualification decisions.
            </div>
          ) : (
            <div className="panel p-5 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{selectedLead.ref}</span>
                    <StatusPill status={selectedLead.status} />
                    <span className="text-xs text-slate-400">· {selectedLead.source}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">{selectedLead.full_name}</h2>
                  <p className="text-xs text-slate-500">
                    {selectedLead.job_title || 'Lead'} at <b>{selectedLead.company_name}</b>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Evaluation Score</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-2xl font-bold font-mono ${
                      selectedLead.score >= 70 ? 'text-emerald-600' :
                      selectedLead.score >= 40 ? 'text-blue-600' :
                      'text-amber-600'
                    }`}>
                      {selectedLead.score}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ 100</span>
                  </div>
                </div>
              </div>

              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>{actionSuccess}</span>
                  </div>
                  <button className="text-emerald-700 font-bold hover:underline" onClick={() => setActionSuccess(null)}>
                    Dismiss
                  </button>
                </div>
              )}

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-600" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Already Converted Notice */}
              {selectedLead.status === 'Converted' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-emerald-800">Lead Successfully Converted to Customer</strong>
                    <span>
                      This prospect has been converted into Account {selectedLead.converted_account_name ? `"${selectedLead.converted_account_name}"` : 'Record'} and primary contact persona. Qualification actions are terminal and locked.
                    </span>
                  </div>
                </div>
              )}

              {/* Contact & Corporate Profile */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Work Email</span>
                  <strong className="text-slate-800 flex items-center gap-1.5">
                    <Mail size={12} className="text-slate-400" /> {selectedLead.email}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Direct Phone</span>
                  <strong className="text-slate-800 flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-400" /> {selectedLead.phone || 'Not provided'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Strategic Industry</span>
                  <strong className="text-slate-800 flex items-center gap-1.5">
                    <Building2 size={12} className="text-slate-400" /> {selectedLead.industry || 'General Industry'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Consent Status</span>
                  <strong className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> {selectedLead.consent_status}
                  </strong>
                </div>
              </div>

              {/* EXPLAINABLE SCORING FACTORS BREAKDOWN */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge size={14} className="text-indigo-600" /> Explainable Scoring Factor Breakdown
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Backend Engine Verified</span>
                </div>

                {(!selectedLead.score_factors || selectedLead.score_factors.length === 0) ? (
                  <div className="p-3 bg-slate-50 rounded text-xs text-slate-500">
                    Baseline qualification score: <b>{selectedLead.score} points</b>.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedLead.score_factors.map((factor: any, idx: number) => {
                      const isPos = factor.type === 'positive' || factor.weight > 0;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                            isPos
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                              : 'bg-rose-50/60 border-rose-200 text-rose-900'
                          }`}
                        >
                          <span className="font-medium text-[11px]">{factor.factor}</span>
                          <span className={`font-mono font-bold text-xs ${isPos ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {factor.weight > 0 ? `+${factor.weight}` : factor.weight}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BANT QUALIFICATION CHECKLIST */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-blue-600" /> BANT Qualification Criteria Checklist
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div
                    className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                      currentBant.budget ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                    onClick={() => toggleBant('budget')}
                  >
                    {currentBant.budget ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                    <div>
                      <b className="block text-[11px]">Budget Confirmed</b>
                      <span className="text-[10px] text-slate-500">Commercial capacity established</span>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                      currentBant.authority ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                    onClick={() => toggleBant('authority')}
                  >
                    {currentBant.authority ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                    <div>
                      <b className="block text-[11px]">Authority Verified</b>
                      <span className="text-[10px] text-slate-500">Decision maker or influencer</span>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                      currentBant.need ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                    onClick={() => toggleBant('need')}
                  >
                    {currentBant.need ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                    <div>
                      <b className="block text-[11px]">Need Established</b>
                      <span className="text-[10px] text-slate-500">Clear pain point or requirement</span>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                      currentBant.timeline ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                    onClick={() => toggleBant('timeline')}
                  >
                    {currentBant.timeline ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                    <div>
                      <b className="block text-[11px]">Timeline Defined</b>
                      <span className="text-[10px] text-slate-500">Target deployment timeframe set</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUALIFICATION DECISION OUTCOME ACTIONS */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    className="btn secondary small py-1.5 text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
                    disabled={actionLoading || selectedLead.status === 'Converted'}
                    onClick={() => handleUpdateStatus('Disqualified')}
                  >
                    <XCircle size={13} /> Disqualify
                  </button>
                  <button
                    className="btn secondary small py-1.5 text-xs text-purple-700 hover:bg-purple-50 border-purple-200"
                    disabled={actionLoading || selectedLead.status === 'Converted'}
                    onClick={() => handleUpdateStatus('Nurture')}
                  >
                    <Clock size={13} /> Mark Nurture
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="btn primary small py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={actionLoading || selectedLead.status === 'Qualified' || selectedLead.status === 'Converted'}
                    onClick={() => handleUpdateStatus('Qualified')}
                  >
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    {selectedLead.status === 'Qualified' ? 'Already Qualified' : 'Qualify Lead'}
                  </button>

                  <button
                    className="btn primary small py-1.5 text-xs flex items-center gap-1.5"
                    disabled={actionLoading || selectedLead.status === 'Converted' || !selectedAsRecord}
                    onClick={() => {
                      if (selectedAsRecord) {
                        setConvertingLead(selectedAsRecord);
                      }
                    }}
                  >
                    <Sparkles size={13} /> Convert to Customer
                  </button>
                </div>
              </div>
            </div>
          )}
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
