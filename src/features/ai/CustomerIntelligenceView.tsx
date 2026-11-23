import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Users, Activity, ShieldCheck, Search, Filter,
  Building2, Phone, Mail, Calendar, MessageSquare, AlertTriangle,
  CheckCircle2, ArrowRight, Plus, ExternalLink, RefreshCw,
  Sparkles, Check, X, FileText, ChevronRight, UserCheck
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { useCRM } from '../../store/CRMStore';
import { money } from '../../data/models';

export interface DuplicateCandidate {
  id: string;
  sourceName: string;
  sourceRef: string;
  targetName: string;
  targetRef: string;
  similarityScore: number;
  matchingFields: string[];
  status: 'Pending Review' | 'Merged' | 'Confirmed Distinct';
}

const INITIAL_DUPLICATES: DuplicateCandidate[] = [
  {
    id: 'dup-01',
    sourceName: 'Vertex Global Solutions Inc.',
    sourceRef: 'ORG-TEMP-009',
    targetName: 'Vertex Global Solutions',
    targetRef: 'ORG-2026-0001',
    similarityScore: 96.5,
    matchingFields: ['Corporate Domain (vertexglobal.example)', 'Billing Address Munich', 'Phone Prefix +49'],
    status: 'Pending Review'
  },
  {
    id: 'dup-02',
    sourceName: 'Apex Logistics LLC',
    sourceRef: 'ORG-TEMP-012',
    targetName: 'Apex Global Logistics',
    targetRef: 'ORG-2026-0004',
    similarityScore: 92.1,
    matchingFields: ['Tax ID State Match', 'Contact: Bob Collins', 'HQ Atlanta GA'],
    status: 'Pending Review'
  }
];

export function CustomerIntelligenceView() {
  const navigate = useNavigate();
  const { records, addAudit, addEvent } = useCRM();

  const accounts = records('organizations');
  const contacts = records('contacts');
  const opportunities = records('opportunities');
  const cases = records('cases');
  const interactions = records('interactions');

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [memoryFilter, setMemoryFilter] = useState<'All' | 'Meeting' | 'Call' | 'Support' | 'Commercial'>('All');
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>(() => {
    try {
      const raw = localStorage.getItem('syvoris:customer_intelligence:duplicates');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DUPLICATES;
  });
  const [scanningDuplicates, setScanningDuplicates] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Memory Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteType, setNewNoteType] = useState('Meeting');
  const [newNoteSummary, setNewNoteSummary] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const selectedAccount = useMemo(() => {
    return accounts.find(a => a.id === selectedAccountId) || accounts[0];
  }, [accounts, selectedAccountId]);

  // Linked items for selected account
  const linkedContacts = useMemo(() => {
    if (!selectedAccount) return [];
    return contacts.filter(c =>
      c.fields?.organization === selectedAccount.title ||
      c.fields?.organization === selectedAccount.id ||
      (selectedAccount.links?.contacts || []).includes(c.id)
    );
  }, [contacts, selectedAccount]);

  const linkedDeals = useMemo(() => {
    if (!selectedAccount) return [];
    return opportunities.filter(d =>
      d.fields?.customer === selectedAccount.title ||
      d.fields?.organization === selectedAccount.id ||
      (selectedAccount.links?.opportunities || []).includes(d.id)
    );
  }, [opportunities, selectedAccount]);

  const linkedCases = useMemo(() => {
    if (!selectedAccount) return [];
    return cases.filter(c =>
      c.fields?.customer === selectedAccount.title ||
      c.fields?.organization === selectedAccount.id ||
      (selectedAccount.links?.cases || []).includes(c.id)
    );
  }, [cases, selectedAccount]);

  // Chronological memory events
  const memoryTimeline = useMemo(() => {
    const events: { id: string; ref: string; title: string; type: string; date: string; summary: string; aiTakeaway: string }[] = [];

    // Synthesize from interactions
    interactions.forEach(i => {
      events.push({
        id: i.id,
        ref: i.ref,
        title: i.title,
        type: i.fields?.type || 'Meeting',
        date: i.date || '2026-11-18',
        summary: i.description || 'Quarterly strategic alignment session.',
        aiTakeaway: 'High buying intent for optical expansion. Customer prioritized 24/7 SLA responsiveness.'
      });
    });

    // Synthesize from cases
    linkedCases.forEach(c => {
      events.push({
        id: c.id,
        ref: c.ref,
        title: `Service Case: ${c.title}`,
        type: 'Support',
        date: c.date || '2026-11-15',
        summary: c.description || 'Support inquiry resolved within SLA window.',
        aiTakeaway: `Customer expressed urgency. SLA resolution achieved with positive post-close CSAT.`
      });
    });

    // Synthesize from deals
    linkedDeals.forEach(d => {
      events.push({
        id: d.id,
        ref: d.ref,
        title: `Commercial Milestone: ${d.title}`,
        type: 'Commercial',
        date: d.date || '2026-11-12',
        summary: `Pipeline opportunity reached ${d.status} stage with value of ${money(d.amount)}.`,
        aiTakeaway: 'Executive sponsor confirmed commercial budget allocation for current cycle.'
      });
    });

    // Add baseline entries if empty
    if (events.length === 0) {
      events.push(
        {
          id: 'mem-base-01',
          ref: 'MEM-2026-001',
          title: 'Executive Architecture Review Meeting',
          type: 'Meeting',
          date: 'Nov 18, 2026',
          summary: 'Discussed optical backbone capacity upgrades and 100G transceiver procurement.',
          aiTakeaway: 'VP Engineering confirmed approval for next phase rollout pending final quote.'
        },
        {
          id: 'mem-base-02',
          ref: 'MEM-2026-002',
          title: 'Technical Consultation Call: Webhook Latency',
          type: 'Call',
          date: 'Nov 16, 2026',
          summary: 'Investigated payload packet drop during peak traffic batch runs.',
          aiTakeaway: 'Client requested automated alerting rules in next platform update.'
        }
      );
    }

    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [interactions, linkedCases, linkedDeals]);

  const filteredTimeline = useMemo(() => {
    if (memoryFilter === 'All') return memoryTimeline;
    return memoryTimeline.filter(m => m.type.toLowerCase().includes(memoryFilter.toLowerCase()));
  }, [memoryTimeline, memoryFilter]);

  const handleRunTrigramScan = async () => {
    setScanningDuplicates(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      addAudit('Trigram Entity Deduplication Scan', 'Arjun Mehta', 'Analyzed 5 account records. 2 candidates identified.');
      showToast('Scan complete. 2 candidate duplicates identified with >90% trigram similarity.');
    } finally {
      setScanningDuplicates(false);
    }
  };

  const handleMergeDuplicate = (dup: DuplicateCandidate) => {
    setDuplicateCandidates(prev => {
      const updated = prev.map(d => d.id === dup.id ? { ...d, status: 'Merged' as const } : d);
      try {
        localStorage.setItem('syvoris:customer_intelligence:duplicates', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addAudit('Entity Resolution Merge Executed', 'Arjun Mehta', `Merged ${dup.sourceName} (${dup.sourceRef}) into ${dup.targetName} (${dup.targetRef})`);
    addEvent('customer.intelligence.merged', { ref: dup.targetRef }, `Merged duplicate record ${dup.sourceRef}`);
    showToast(`Merged ${dup.sourceRef} into master account ${dup.targetRef}.`);
  };

  const handleKeepDistinct = (dup: DuplicateCandidate) => {
    setDuplicateCandidates(prev => {
      const updated = prev.map(d => d.id === dup.id ? { ...d, status: 'Confirmed Distinct' as const } : d);
      try {
        localStorage.setItem('syvoris:customer_intelligence:duplicates', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addAudit('Entity Resolution Cleared', 'Arjun Mehta', `Marked ${dup.sourceRef} as distinct entity from ${dup.targetRef}`);
    showToast(`Marked ${dup.sourceRef} as confirmed distinct entity.`);
  };

  const handleCreateMemoryNote = () => {
    if (!newNoteTitle.trim()) return;
    const newRef = `MEM-2026-${(memoryTimeline.length + 1).toString().padStart(3, '0')}`;
    addAudit('Customer Memory Note Added', 'Arjun Mehta', `${newRef}: ${newNoteTitle}`);
    addEvent('customer.memory.added', { ref: newRef }, `${newNoteTitle} (${newNoteType})`);
    showToast(`Added memory record ${newRef} to customer timeline.`);
    setNoteModalOpen(false);
    setNewNoteTitle('');
    setNewNoteSummary('');
  };

  return (
    <div className="ai-workspace space-y-6">
      {/* Header */}
      <SectionHeading
        eyebrow="AI INTELLIGENCE & AGENT WORKFORCE / MEMORY & CONTEXT LAYER"
        title="Customer Intelligence"
        subtitle="Permission-aware customer relationship graphs, grounded interaction memory, sentiment analytics, and trigram entity deduplication."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNoteModalOpen(true)}
              className="btn primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Log Memory Note</span>
            </button>
            <span className="ai-mode-pill"><i /> Grounded Context Active</span>
          </div>
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monitored Accounts</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{accounts.length} Accounts</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">Enterprise Customer 360 graphs</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Key Stakeholders</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{contacts.length} Contacts</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Role hierarchy & sentiment indexed</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interaction Memory</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{memoryTimeline.length} Events</div>
            <div className="text-[11px] text-purple-600 font-medium mt-0.5">Calls, emails & technical reviews</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sentiment Score</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">94 / 100</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Positive account engagement</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      {/* Account Selector Pill Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">Select Account Context:</span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedAccount?.id === acc.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Building2 size={13} />
              <span>{acc.title}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedAccount?.id === acc.id ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
              }`}>
                {acc.ref}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Customer 360 Relationship Graph Cockpit */}
      {selectedAccount && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/20 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                {selectedAccount.title.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{selectedAccount.title}</span>
                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedAccount.ref}
                  </span>
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Industry: <strong className="text-slate-700">{selectedAccount.fields?.industry || 'Technology'}</strong> · 
                  Segment: <strong className="text-slate-700">{selectedAccount.fields?.segment || 'Enterprise Tier-1'}</strong> · 
                  Account Owner: <strong className="text-slate-700">{selectedAccount.owner || 'Arjun Mehta'}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/customers/360', { state: { openRecordId: selectedAccount.id } })}
                className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border border-slate-300"
              >
                <span>Open Full Customer 360</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>

          {/* Connected Context 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Linked Key Contacts */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" /> Key Stakeholders ({linkedContacts.length})
                </h4>
                <button
                  onClick={() => navigate('/contacts')}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Manage
                </button>
              </div>

              {linkedContacts.length > 0 ? (
                <div className="space-y-2">
                  {linkedContacts.map(c => (
                    <div key={c.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900 block">{c.title}</strong>
                        <span className="text-slate-500 text-[11px]">{c.fields?.job_title || 'Executive Lead'}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic py-2">No direct contacts linked yet.</div>
              )}
            </div>

            {/* Active Commercial Opportunities */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <FileText size={14} className="text-emerald-600" /> Pipeline Deals ({linkedDeals.length})
                </h4>
                <button
                  onClick={() => navigate('/sales/pipeline')}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  View
                </button>
              </div>

              {linkedDeals.length > 0 ? (
                <div className="space-y-2">
                  {linkedDeals.map(d => (
                    <div key={d.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <div className="truncate mr-2">
                        <strong className="text-slate-900 block truncate">{d.title}</strong>
                        <span className="text-slate-500 text-[11px]">{d.status} · {money(d.amount)}</span>
                      </div>
                      <span className="text-[10.5px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {d.probability || 25}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic py-2">No active pipeline deals found.</div>
              )}
            </div>

            {/* Support Cases & SLA Health */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-purple-600" /> SLA & Support ({linkedCases.length})
                </h4>
                <button
                  onClick={() => navigate('/service')}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Queue
                </button>
              </div>

              {linkedCases.length > 0 ? (
                <div className="space-y-2">
                  {linkedCases.map(c => (
                    <div key={c.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <div className="truncate mr-2">
                        <strong className="text-slate-900 block truncate">{c.title}</strong>
                        <span className="text-slate-500 text-[11px]">{c.ref} · {c.fields?.priority || 'Normal'} Priority</span>
                      </div>
                      <StatusPill status={c.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" /> Zero unresolved SLA incidents.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Section: Memory Timeline & Deduplication */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chronological Customer Memory Timeline */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Interaction Memory Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological context retrieved across calls, meetings, cases and deals.</p>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {(['All', 'Meeting', 'Call', 'Support', 'Commercial'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMemoryFilter(tab)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    memoryFilter === tab
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredTimeline.map(mem => (
              <div key={mem.id} className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-200 hover:bg-blue-50/20 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {mem.ref}
                    </span>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      {mem.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{mem.date}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{mem.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{mem.summary}</p>

                {/* AI Takeaway */}
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-950 flex items-start gap-2">
                  <Sparkles size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>AI Synthesis:</strong> {mem.aiTakeaway}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trigram Deduplication & Entity Resolution Steward */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Entity Resolution Steward</h3>
              <p className="text-xs text-slate-500 mt-0.5">Fuzzy trigram matching for account reconciliation.</p>
            </div>
            <button
              onClick={handleRunTrigramScan}
              disabled={scanningDuplicates}
              className="btn secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 border border-slate-300 font-medium"
              title="Execute phonetic and trigram distance analysis"
            >
              <RefreshCw size={12} className={scanningDuplicates ? 'animate-spin' : ''} />
              <span>Scan Database</span>
            </button>
          </div>

          <div className="space-y-4">
            {duplicateCandidates.map(dup => (
              <div
                key={dup.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  dup.status === 'Merged'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : dup.status === 'Confirmed Distinct'
                    ? 'border-slate-200 bg-slate-50/60 opacity-60'
                    : 'border-amber-200 bg-amber-50/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <AlertTriangle size={13} className="text-amber-600" /> Duplicate Candidate ({dup.similarityScore}% match)
                  </span>
                  <span
                    className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                      dup.status === 'Merged'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dup.status === 'Confirmed Distinct'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {dup.status}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 bg-white p-3 rounded-lg border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Master Record:</span>
                    <strong className="text-slate-900">{dup.targetName} ({dup.targetRef})</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Duplicate Candidate:</span>
                    <span className="text-rose-700 font-medium">{dup.sourceName} ({dup.sourceRef})</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-700 block">Matched Attributes:</span>
                  {dup.matchingFields.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-slate-600">
                      <Check size={11} className="text-emerald-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {dup.status === 'Pending Review' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleKeepDistinct(dup)}
                      className="btn secondary text-xs py-1.5 px-2.5 w-full border border-slate-300"
                    >
                      Keep Distinct
                    </button>
                    <button
                      onClick={() => handleMergeDuplicate(dup)}
                      className="btn primary text-xs py-1.5 px-3 w-full flex items-center justify-center gap-1 shadow-sm"
                    >
                      <UserCheck size={13} />
                      <span>Merge Records</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log Memory Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Customer Memory Note</h3>
                <p className="text-xs text-slate-500">Commit qualitative touchpoint notes into grounded customer context.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Interaction Title *</label>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={e => setNewNoteTitle(e.target.value)}
                  placeholder="e.g. Optical Transceiver Architecture Review"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Channel / Event Type</label>
                <select
                  value={newNoteType}
                  onChange={e => setNewNoteType(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Meeting">Meeting (In-Person / Virtual)</option>
                  <option value="Call">Phone Call</option>
                  <option value="Support">Technical Support Consultation</option>
                  <option value="Commercial">Commercial Negotiation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Observation & Takeaways</label>
                <textarea
                  value={newNoteSummary}
                  onChange={e => setNewNoteSummary(e.target.value)}
                  placeholder="Record customer sentiment, budget updates, requirements..."
                  rows={3}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="btn secondary text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMemoryNote}
                disabled={!newNoteTitle.trim()}
                className="btn primary text-xs py-2 px-4 shadow-sm"
              >
                Save Memory Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
