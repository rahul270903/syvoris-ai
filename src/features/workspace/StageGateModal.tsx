import { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Contact,
  DollarSign,
  FileCheck2,
  HelpCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  X
} from 'lucide-react';
import type { CRMRecord } from '../../data/models';
import { api, type ContactItem } from '../../services/api';

export interface StageGateModalProps {
  opportunity: CRMRecord;
  targetStage: string;
  onClose: () => void;
  onSuccess: (updatedStage: string) => void;
}

const LOSS_REASONS = [
  'Price / Budget Constraint',
  'Competitor Selection',
  'Project Deferred / Cancelled',
  'Feature / Capability Gap',
  'Loss of Executive Sponsor / Stakeholder',
  'Strategic Shift / Internal Reorganization',
  'Other / Unspecified',
];

export function StageGateModal({
  opportunity,
  targetStage,
  onClose,
  onSuccess,
}: StageGateModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Existing opportunity attributes
  const existingAccountId = opportunity.links.organizations?.[0] || opportunity.fields.accountId || '';
  const existingContactId = opportunity.links.contacts?.[0] || opportunity.fields.contactId || '';

  // Gate form state
  const [selectedContactId, setSelectedContactId] = useState<string>(existingContactId);
  const [budgetConfirmed, setBudgetConfirmed] = useState<boolean>(
    opportunity.fields.budgetConfirmed === 'Yes' || opportunity.fields.budgetConfirmed === 'true'
  );
  const [decisionMakerBoughtIn, setDecisionMakerBoughtIn] = useState<boolean>(
    opportunity.fields.decisionMakerBoughtIn === 'Yes' || opportunity.fields.decisionMakerBoughtIn === 'true'
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState<string>(
    opportunity.fields.closeDate || opportunity.date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [winDescription, setWinDescription] = useState<string>(opportunity.fields.winDescription || '');
  const [lossReasonCategory, setLossReasonCategory] = useState<string>(LOSS_REASONS[0]);
  const [lossReasonCustom, setLossReasonCustom] = useState<string>(opportunity.fields.lossReason || '');
  const [competitorName, setCompetitorName] = useState<string>(opportunity.fields.competitorName || '');
  const [transitionNotes, setTransitionNotes] = useState<string>('');

  // Contacts for stakeholder selection
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(false);

  useEffect(() => {
    // If target stage needs a contact, fetch contacts
    if (['Discovery', 'Proposal', 'Negotiation'].includes(targetStage)) {
      setLoadingContacts(true);
      api.listContacts({ limit: 100, account_id: existingAccountId || undefined })
        .then(res => {
          if (res?.items) setContacts(res.items);
        })
        .catch(() => {
          // Fallback to all tenant contacts
          api.listContacts({ limit: 100 })
            .then(res => {
              if (res?.items) setContacts(res.items);
            })
            .catch(() => {});
        })
        .finally(() => setLoadingContacts(false));
    }
  }, [targetStage, existingAccountId]);

  // Determine stage requirements
  const isDiscovery = targetStage === 'Discovery';
  const isProposal = targetStage === 'Proposal';
  const isNegotiation = targetStage === 'Negotiation';
  const isClosedWon = targetStage === 'Closed Won';
  const isClosedLost = targetStage === 'Closed Lost';

  const validate = (): string | null => {
    if (isDiscovery || isProposal || isNegotiation) {
      if (!selectedContactId && !existingContactId) {
        return `${targetStage} stage gate requires linking a stakeholder contact.`;
      }
    }
    if (isProposal) {
      if (!budgetConfirmed) {
        return 'Proposal stage gate requires confirmed budget.';
      }
      if (!expectedCloseDate) {
        return 'Proposal stage gate requires an expected close date.';
      }
    }
    if (isNegotiation) {
      if (!budgetConfirmed) {
        return 'Negotiation stage gate requires confirmed budget.';
      }
      if (!decisionMakerBoughtIn) {
        return 'Negotiation stage gate requires key decision-maker buy-in.';
      }
    }
    if (isClosedWon) {
      if (!winDescription.trim()) {
        return 'Closed Won stage gate requires documenting the competitive win summary.';
      }
    }
    if (isClosedLost) {
      const fullReason = lossReasonCategory === 'Other / Unspecified' ? lossReasonCustom : lossReasonCategory;
      if (!fullReason.trim()) {
        return 'Closed Lost stage gate requires documenting the loss reason.';
      }
    }
    return null;
  };

  const handleConfirm = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. If contact or close date was selected/changed, update opportunity attributes first
      const updates: Record<string, any> = {};
      if (selectedContactId && selectedContactId !== existingContactId) {
        updates.contact_id = selectedContactId;
      }
      if (expectedCloseDate && expectedCloseDate !== opportunity.fields.closeDate) {
        updates.expected_close_date = expectedCloseDate;
      }
      if (budgetConfirmed !== (opportunity.fields.budgetConfirmed === 'Yes')) {
        updates.budget_confirmed = budgetConfirmed;
      }
      if (decisionMakerBoughtIn !== (opportunity.fields.decisionMakerBoughtIn === 'Yes')) {
        updates.decision_maker_bought_in = decisionMakerBoughtIn;
      }

      if (Object.keys(updates).length > 0) {
        await api.updateOpportunity(opportunity.id, updates);
      }

      // 2. Perform the Stage-Gate transition
      const finalLossReason = isClosedLost
        ? (lossReasonCategory === 'Other / Unspecified' ? lossReasonCustom : `${lossReasonCategory}${lossReasonCustom ? ` - ${lossReasonCustom}` : ''}`)
        : undefined;

      await api.transitionOpportunityStage(opportunity.id, {
        to_stage: targetStage,
        budget_confirmed: budgetConfirmed,
        decision_maker_bought_in: decisionMakerBoughtIn,
        win_description: isClosedWon ? winDescription.trim() : undefined,
        loss_reason: finalLossReason,
        competitor_name: competitorName.trim() || undefined,
        notes: transitionNotes.trim() || undefined,
      });

      onSuccess(targetStage);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete stage gate transition.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isClosedWon ? 'bg-emerald-100 text-emerald-600' :
              isClosedLost ? 'bg-rose-100 text-rose-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {isClosedWon ? <CheckCircle2 size={20} /> :
               isClosedLost ? <AlertTriangle size={20} /> :
               <TrendingUp size={20} />}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Stage-Gate Verification
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-manrope">
                Advance {opportunity.ref} → {targetStage}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Stage transition pill bar */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs text-slate-500 block">Current Stage</span>
              <strong className="text-sm font-semibold text-slate-700">{opportunity.fields.stage || opportunity.status}</strong>
            </div>
            <ArrowRight size={18} className="text-slate-400" />
            <div>
              <span className="text-xs text-slate-500 block">Target Gate</span>
              <strong className={`text-sm font-bold ${
                isClosedWon ? 'text-emerald-700' :
                isClosedLost ? 'text-rose-700' :
                'text-blue-700'
              }`}>{targetStage}</strong>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
              <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Stage-Gate Rule Violation:</strong>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Gate Criteria Explanation */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-blue-900 text-xs flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Blueprint Governance Requirement</span>
              {isDiscovery && <span>Discovery stage requires an identified stakeholder Contact to proceed with requirements capture.</span>}
              {isProposal && <span>Proposal stage requires a linked Contact, confirmed budget, and expected close date before issuing commercial proposals.</span>}
              {isNegotiation && <span>Negotiation stage requires confirmed budget and documented key decision-maker buy-in.</span>}
              {isClosedWon && <span>Closed Won requires documenting the competitive win summary and commercial drivers for governance audit.</span>}
              {isClosedLost && <span>Closed Lost requires documenting the loss reason and competitor details for sales intelligence.</span>}
              {!isDiscovery && !isProposal && !isNegotiation && !isClosedWon && !isClosedLost && (
                <span>Confirm stage progression and verify opportunity attributes.</span>
              )}
            </div>
          </div>

          {/* Form fields based on target gate */}
          <div className="space-y-4">
            {/* Stakeholder Contact (Discovery, Proposal, Negotiation) */}
            {(isDiscovery || isProposal || isNegotiation) && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Contact size={14} className="text-slate-500" /> Stakeholder Contact <b className="text-rose-500">*</b>
                  </span>
                  {opportunity.fields.customer && (
                    <span className="text-[11px] text-slate-500 font-normal">Account: {opportunity.fields.customer}</span>
                  )}
                </label>
                {loadingContacts ? (
                  <div className="p-2.5 text-xs text-slate-500 bg-slate-50 rounded-lg flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-blue-600" /> Loading account contacts...
                  </div>
                ) : (
                  <select
                    value={selectedContactId}
                    onChange={e => setSelectedContactId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">-- Select Stakeholder Contact --</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.job_title || 'Contact'}{c.is_decision_maker ? ' · Decision Maker' : ''})
                      </option>
                    ))}
                    {selectedContactId && !contacts.some(c => c.id === selectedContactId) && (
                      <option value={selectedContactId}>
                        {opportunity.fields.contact || 'Current linked contact'}
                      </option>
                    )}
                  </select>
                )}
                {contacts.length === 0 && !loadingContacts && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No contacts linked to this account. Please create or link a contact in Contacts workspace first if needed.
                  </p>
                )}
              </div>
            )}

            {/* Confirmed Budget (Proposal, Negotiation) */}
            {(isProposal || isNegotiation) && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="budgetConfirmed"
                  checked={budgetConfirmed}
                  onChange={e => setBudgetConfirmed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="budgetConfirmed" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
                  Confirmed Customer Budget Available <b className="text-rose-500">*</b>
                  <span className="block text-[11px] font-normal text-slate-500">
                    Customer has confirmed allocated financial funds for this opportunity.
                  </span>
                </label>
              </div>
            )}

            {/* Expected Close Date (Proposal) */}
            {isProposal && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-500" /> Expected Close Date <b className="text-rose-500">*</b>
                </label>
                <input
                  type="date"
                  value={expectedCloseDate}
                  onChange={e => setExpectedCloseDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}

            {/* Decision Maker Bought In (Negotiation) */}
            {isNegotiation && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="decisionMakerBoughtIn"
                  checked={decisionMakerBoughtIn}
                  onChange={e => setDecisionMakerBoughtIn(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="decisionMakerBoughtIn" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
                  Key Decision-Maker Buy-In Confirmed <b className="text-rose-500">*</b>
                  <span className="block text-[11px] font-normal text-slate-500">
                    Executive sponsor or authorized signatory has formally validated the proposed solution.
                  </span>
                </label>
              </div>
            )}

            {/* Win Description (Closed Won) */}
            {isClosedWon && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Win Description Summary <b className="text-rose-500">*</b>
                </label>
                <textarea
                  rows={3}
                  value={winDescription}
                  onChange={e => setWinDescription(e.target.value)}
                  placeholder="Detail why the customer chose SYVORIS, key commercial value drivers, and implementation scope..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}

            {/* Loss Reason & Competitor (Closed Lost) */}
            {isClosedLost && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Primary Loss Reason Category <b className="text-rose-500">*</b>
                  </label>
                  <select
                    value={lossReasonCategory}
                    onChange={e => setLossReasonCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    {LOSS_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Loss Details & Context {lossReasonCategory === 'Other / Unspecified' && <b className="text-rose-500">*</b>}
                  </label>
                  <textarea
                    rows={2}
                    value={lossReasonCustom}
                    onChange={e => setLossReasonCustom(e.target.value)}
                    placeholder="Provide specific details regarding the lost deal for product and sales retrospective..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Selected Competitor (if applicable)
                  </label>
                  <input
                    type="text"
                    value={competitorName}
                    onChange={e => setCompetitorName(e.target.value)}
                    placeholder="e.g. Cisco, Radium Enterprise, Fortinet"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {/* Transition Notes (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Audit Transition Notes (Optional)
              </label>
              <input
                type="text"
                value={transitionNotes}
                onChange={e => setTransitionNotes(e.target.value)}
                placeholder="Log reason or milestone context for stage velocity ledger..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm flex items-center gap-2 transition-colors ${
              isClosedWon ? 'bg-emerald-600 hover:bg-emerald-700' :
              isClosedLost ? 'bg-rose-600 hover:bg-rose-700' :
              'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Confirm & Transition Stage
          </button>
        </div>
      </div>
    </div>
  );
}
