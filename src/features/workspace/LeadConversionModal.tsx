import { useState, useMemo, useEffect } from 'react';
import {
  Building2, Check, CheckCircle2, ChevronRight, Contact,
  Loader2, ShieldAlert, ShieldCheck, Sparkles, Target, X, ArrowRight, ExternalLink
} from 'lucide-react';
import { money, type CRMRecord } from '../../data/models';
import { api, type AccountItem, type LeadConvertPayload, type LeadConvertResponse } from '../../services/api';

export function LeadConversionModal({
  lead,
  onClose,
  onComplete,
}: {
  lead: CRMRecord;
  onClose: () => void;
  onComplete: (org: CRMRecord, contact: CRMRecord, opp: CRMRecord) => void;
}) {
  const [availableAccounts, setAvailableAccounts] = useState<AccountItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const initialCompanyName = lead.fields.company || lead.fields.organization || 'New Enterprise';

  useEffect(() => {
    let mounted = true;
    setLoadingAccounts(true);
    api.listAccounts({ limit: 100 })
      .then(res => {
        if (mounted && res?.items) {
          setAvailableAccounts(res.items);
        }
      })
      .catch(err => {
        console.warn('Failed to load accounts for conversion linking:', err);
      })
      .finally(() => {
        if (mounted) setLoadingAccounts(false);
      });
    return () => { mounted = false; };
  }, []);

  // Duplicate check based on real PostgreSQL accounts
  const matchedOrg = useMemo(() => {
    if (!initialCompanyName || initialCompanyName === 'New Enterprise') return null;
    const nameLower = initialCompanyName.toLowerCase().trim();
    return availableAccounts.find(o => {
      const oName = o.name.toLowerCase().trim();
      return oName === nameLower || oName.includes(nameLower) || nameLower.includes(oName);
    }) || null;
  }, [availableAccounts, initialCompanyName]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [orgMode, setOrgMode] = useState<'create' | 'link'>('create');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [newOrgName, setNewOrgName] = useState(initialCompanyName);
  const [newOrgIndustry, setNewOrgIndustry] = useState(lead.fields.industry || 'Technology');
  const [newOrgSegment, setNewOrgSegment] = useState('Enterprise');
  const [newOrgTerritory, setNewOrgTerritory] = useState(lead.fields.territory || 'Caribbean');

  // Update selection if duplicate found
  useEffect(() => {
    if (matchedOrg) {
      setOrgMode('link');
      setSelectedOrgId(matchedOrg.id);
    } else if (availableAccounts.length > 0 && !selectedOrgId) {
      setSelectedOrgId(availableAccounts[0].id);
    }
  }, [matchedOrg, availableAccounts]);

  // Contact State
  const [contactFirstName, setContactFirstName] = useState(lead.fields.firstName || lead.title.split(' ')[0] || '');
  const [contactLastName, setContactLastName] = useState(lead.fields.lastName || lead.title.split(' ').slice(1).join(' ') || '');
  const [contactTitle, setContactTitle] = useState(lead.fields.jobTitle || 'Procurement Lead');
  const [contactEmail, setContactEmail] = useState(lead.fields.email || '');
  const [contactPhone, setContactPhone] = useState(lead.fields.phone || '');
  const [contactConsent, setContactConsent] = useState(lead.fields.consent || 'Email and phone permitted');

  // Opportunity State
  const [createDeal, setCreateDeal] = useState(true);
  const [dealName, setDealName] = useState(`${initialCompanyName} · Enterprise Solution`);
  const [dealAmount, setDealAmount] = useState('45000');
  const [dealStage, setDealStage] = useState('Qualification');
  const [dealProbability, setDealProbability] = useState('25');
  const [dealCloseDate, setDealCloseDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().slice(0, 10);
  });
  const [dealOwner, setDealOwner] = useState(lead.owner || 'Demo User');
  const [submitting, setSubmitting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<{
    targetOrg: CRMRecord;
    targetContact: CRMRecord;
    targetOpp: CRMRecord;
    raw: LeadConvertResponse;
  } | null>(null);

  const validateStep = (s: number): boolean => {
    setConversionError(null);
    if (s === 1) {
      if (orgMode === 'create' && !newOrgName.trim()) {
        setConversionError('Organization / Company Name is required.');
        return false;
      }
      if (orgMode === 'link' && !selectedOrgId) {
        setConversionError('Please select an existing organization to link.');
        return false;
      }
    } else if (s === 2) {
      if (!contactFirstName.trim() || !contactLastName.trim() || !contactEmail.trim()) {
        setConversionError('Contact first name, last name, and a valid email are required.');
        return false;
      }
    } else if (s === 3) {
      if (createDeal && !dealName.trim()) {
        setConversionError('Opportunity name is required when deal creation is enabled.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((step + 1) as any);
    }
  };

  const executeConversion = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setSubmitting(true);
    setConversionError(null);

    const payload: LeadConvertPayload = {
      account_mode: orgMode,
      existing_account_id: orgMode === 'link' && selectedOrgId ? selectedOrgId : undefined,
      new_account: orgMode === 'create' ? {
        name: newOrgName.trim(),
        industry: newOrgIndustry,
        segment: newOrgSegment,
        territory: newOrgTerritory,
      } : undefined,
      contact: {
        first_name: contactFirstName.trim(),
        last_name: contactLastName.trim(),
        job_title: contactTitle.trim() || undefined,
        email: contactEmail.trim().toLowerCase(),
        phone: contactPhone.trim() || undefined,
        consent_status: contactConsent,
      },
      create_opportunity: createDeal,
      opportunity: createDeal ? {
        name: dealName.trim(),
        amount: Number(dealAmount) || 0,
        stage: dealStage,
        probability: Number(dealProbability) || 25,
        expected_close_date: dealCloseDate,
      } : undefined,
    };

    try {
      const backendResult = await api.convertLead(lead.id, payload);

      const targetOrg: CRMRecord = {
        id: backendResult.account.id,
        ref: backendResult.account.ref,
        title: backendResult.account.name,
        description: backendResult.account.description || `Account created from converted lead ${lead.ref}.`,
        status: backendResult.account.status,
        owner: backendResult.account.owner_name || lead.owner || 'Lead Owner',
        amount: Number(backendResult.account.credit_limit || 0),
        date: backendResult.account.created_at ? backendResult.account.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        links: {
          contacts: [backendResult.contact.id],
          opportunities: backendResult.opportunity ? [backendResult.opportunity.id] : []
        },
        history: [],
        fields: {
          name: backendResult.account.name,
          industry: backendResult.account.industry || newOrgIndustry,
          segment: newOrgSegment,
          territory: newOrgTerritory,
          owner: backendResult.account.owner_name || lead.owner,
          consent: contactConsent,
          description: backendResult.account.description || '',
        }
      };

      const targetContact: CRMRecord = {
        id: backendResult.contact.id,
        ref: backendResult.contact.ref,
        title: backendResult.contact.full_name,
        description: `${backendResult.contact.job_title || 'Contact'} at ${targetOrg.title}`,
        status: backendResult.contact.status,
        owner: backendResult.contact.owner_name || lead.owner || 'Lead Owner',
        amount: 0,
        date: backendResult.contact.created_at ? backendResult.contact.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        links: { organizations: [targetOrg.id] },
        history: [],
        fields: {
          firstName: backendResult.contact.first_name,
          lastName: backendResult.contact.last_name,
          title: backendResult.contact.job_title || contactTitle,
          organization: targetOrg.title,
          email: backendResult.contact.email,
          phone: backendResult.contact.phone || contactPhone,
          consent: contactConsent,
          owner: lead.owner,
        }
      };

      const targetOpp: CRMRecord = backendResult.opportunity ? {
        id: backendResult.opportunity.id,
        ref: backendResult.opportunity.ref,
        title: backendResult.opportunity.name,
        description: `Opportunity generated from qualified lead ${lead.ref}.`,
        status: backendResult.opportunity.stage,
        owner: backendResult.opportunity.owner_name || dealOwner,
        amount: Number(backendResult.opportunity.amount || 0),
        probability: backendResult.opportunity.probability,
        date: backendResult.opportunity.created_at ? backendResult.opportunity.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        links: { organizations: [targetOrg.id], contacts: [targetContact.id] },
        history: [],
        fields: {
          name: backendResult.opportunity.name,
          customer: targetOrg.title,
          contact: targetContact.title,
          stage: backendResult.opportunity.stage,
          amount: String(backendResult.opportunity.amount),
          probability: String(backendResult.opportunity.probability),
          closeDate: dealCloseDate,
          source: lead.fields?.source || 'Lead Conversion',
          risk: backendResult.opportunity.risk_level || 'Low',
          owner: dealOwner,
          description: `Opportunity generated from qualified lead ${lead.ref}.`,
        }
      } : {
        id: targetOrg.id,
        ref: 'OPP-NONE',
        title: 'No Opportunity Created',
        description: '',
        status: 'Active',
        owner: lead.owner,
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        links: {},
        history: [],
        fields: {}
      };

      setCompletedResult({
        targetOrg,
        targetContact,
        targetOpp,
        raw: backendResult
      });
      setSubmitting(false);
    } catch (err: any) {
      console.error('Backend conversion failed:', err);
      setConversionError(err?.message || 'Lead conversion failed on PostgreSQL backend.');
      setSubmitting(false);
    }
  };

  // If conversion completed successfully, display the verified confirmation receipt
  if (completedResult) {
    return (
      <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="lead-conversion-modal panel max-w-xl">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 size={36} />
            </div>
            <span className="eyebrow text-emerald-700">CONVERSION COMPLETED · POSTGRESQL ATOMIC TRANSACTION</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Lead {lead.ref} Converted Successfully</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Customer organization, contact persona, and sales deal have been atomically persisted with full provenance tracking.
            </p>

            <div className="grid grid-cols-3 gap-3 my-6 text-left">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Building2 size={12}/> Account Ref
                </span>
                <strong className="text-sm font-bold text-slate-900 block font-mono">
                  {completedResult.raw.account.ref}
                </strong>
                <span className="text-xs text-slate-600 truncate block mt-0.5">
                  {completedResult.raw.account.name}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Contact size={12}/> Contact Ref
                </span>
                <strong className="text-sm font-bold text-slate-900 block font-mono">
                  {completedResult.raw.contact.ref}
                </strong>
                <span className="text-xs text-slate-600 truncate block mt-0.5">
                  {completedResult.raw.contact.full_name}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Target size={12}/> Deal Ref
                </span>
                <strong className="text-sm font-bold text-slate-900 block font-mono">
                  {completedResult.raw.opportunity ? completedResult.raw.opportunity.ref : 'N/A'}
                </strong>
                <span className="text-xs text-slate-600 truncate block mt-0.5">
                  {completedResult.raw.opportunity ? money(Number(completedResult.raw.opportunity.amount)) : 'None'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600"/>
                <span>Audit trail logged: <code>lead.converted</code> · Zero orphan risk verified.</span>
              </div>
              <span className="font-semibold text-emerald-700">ACID Committed</span>
            </div>

            <div className="flex justify-center gap-3">
              <button
                className="btn secondary"
                onClick={() => {
                  onComplete(completedResult.targetOrg, completedResult.targetContact, completedResult.targetOpp);
                }}
              >
                Close & Refresh Queue
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  onComplete(completedResult.targetOrg, completedResult.targetContact, completedResult.targetOpp);
                }}
              >
                Open Customer 360 <ArrowRight size={14}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lead-conversion-modal panel">
        {/* Modal Head */}
        <div className="form-modal-head">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles size={20}/>
            </span>
            <div>
              <span className="eyebrow">LEAD CONVERSION ENGINE · {lead.ref}</span>
              <h2>Convert Lead: {lead.title}</h2>
              <p>Map qualified prospect into customer master, contact record, and commercial deal.</p>
            </div>
          </div>
          <button className="icon-close" onClick={onClose}><X size={18}/></button>
        </div>

        {/* Wizard Progress Tabs */}
        <div className="conversion-steps-bar">
          <button
            className={`conversion-step-btn ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}
            onClick={() => { if (step > 1 || validateStep(1)) setStep(1); }}
          >
            <span>1</span><b>Organization</b>
          </button>
          <div className="step-line"/>
          <button
            className={`conversion-step-btn ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}
            onClick={() => { if (step > 2 || (validateStep(1) && validateStep(2))) setStep(2); }}
          >
            <span>2</span><b>Contact Person</b>
          </button>
          <div className="step-line"/>
          <button
            className={`conversion-step-btn ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`}
            onClick={() => { if (validateStep(1) && validateStep(2)) setStep(3); }}
          >
            <span>3</span><b>Deal & Pipeline</b>
          </button>
          <div className="step-line"/>
          <button
            className={`conversion-step-btn ${step === 4 ? 'active' : ''}`}
            onClick={() => { if (validateStep(1) && validateStep(2) && validateStep(3)) setStep(4); }}
          >
            <span>4</span><b>Review & Finalize</b>
          </button>
        </div>

        {/* Step Body */}
        <div className="form-modal-body">
          {conversionError && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
              <ShieldAlert size={16} className="text-rose-600 flex-shrink-0 mt-0.5"/>
              <div>
                <b>Conversion Blocked:</b> {conversionError}
              </div>
            </div>
          )}

          {/* STEP 1: ORGANIZATION RESOLUTION */}
          {step === 1 && (
            <div className="conversion-step-content space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Organization / Account Resolution</h3>
                <span className="text-xs text-slate-500">PostgreSQL deduplication check active</span>
              </div>

              {matchedOrg && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-3">
                  <ShieldAlert size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <b>Potential Existing Account Found:</b> An existing account <b>"{matchedOrg.name}"</b> ({matchedOrg.ref}) was found in PostgreSQL. You can link this lead to the existing customer or create a distinct subsidiary.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`p-4 rounded-lg border text-left flex flex-col gap-1 transition ${orgMode === 'link' ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white'}`}
                  onClick={() => setOrgMode('link')}
                >
                  <div className="flex items-center justify-between w-full">
                    <b className="text-xs text-slate-800">Link to Existing Organization</b>
                    {orgMode === 'link' && <Check size={16} className="text-blue-600"/>}
                  </div>
                  <span className="text-xs text-slate-500">Attach contact and deal to an existing corporate account record.</span>
                </button>

                <button
                  type="button"
                  className={`p-4 rounded-lg border text-left flex flex-col gap-1 transition ${orgMode === 'create' ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white'}`}
                  onClick={() => setOrgMode('create')}
                >
                  <div className="flex items-center justify-between w-full">
                    <b className="text-xs text-slate-800">Create New Organization</b>
                    {orgMode === 'create' && <Check size={16} className="text-blue-600"/>}
                  </div>
                  <span className="text-xs text-slate-500">Create a brand-new master account record for this customer.</span>
                </button>
              </div>

              {orgMode === 'link' ? (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Select Existing Account in Organization *
                    {loadingAccounts && <span className="text-slate-400 font-normal ml-2">(Loading accounts...)</span>}
                  </label>
                  {availableAccounts.length === 0 && !loadingAccounts ? (
                    <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200">
                      No accounts currently exist in this organization. Please switch to "Create New Organization".
                    </div>
                  ) : (
                    <select
                      className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white"
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                    >
                      <option value="">-- Choose Account --</option>
                      {availableAccounts.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.ref}) — {o.industry || 'General Industry'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1 col-span-2">
                    Organization Name *
                    <input
                      className="p-2 border border-slate-300 rounded text-xs"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="e.g. Apex Global Solutions"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                    Industry
                    <select
                      className="p-2 border border-slate-300 rounded text-xs bg-white"
                      value={newOrgIndustry}
                      onChange={(e) => setNewOrgIndustry(e.target.value)}
                    >
                      <option>Telecommunications</option>
                      <option>Technology</option>
                      <option>Public Sector</option>
                      <option>Utilities</option>
                      <option>Logistics</option>
                      <option>Financial Services</option>
                      <option>Healthcare</option>
                      <option>Manufacturing</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                    Segment
                    <select
                      className="p-2 border border-slate-300 rounded text-xs bg-white"
                      value={newOrgSegment}
                      onChange={(e) => setNewOrgSegment(e.target.value)}
                    >
                      <option>Enterprise</option>
                      <option>Mid-Market</option>
                      <option>SMB</option>
                      <option>Public Sector</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1 col-span-2">
                    Territory
                    <input
                      className="p-2 border border-slate-300 rounded text-xs"
                      value={newOrgTerritory}
                      onChange={(e) => setNewOrgTerritory(e.target.value)}
                      placeholder="e.g. North America / Caribbean"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CONTACT CONFIGURATION */}
          {step === 2 && (
            <div className="conversion-step-content space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Contact Person Profile</h3>
                <span className="text-xs text-slate-500">Will be linked to customer record</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  First Name *
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Last Name *
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Job Title
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Email Address *
                  <input
                    type="email"
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Direct Phone
                  <input
                    className="p-2 border border-slate-300 rounded text-xs"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                  Communication Consent Status
                  <select
                    className="p-2 border border-slate-300 rounded text-xs bg-white text-emerald-800 font-semibold"
                    value={contactConsent}
                    onChange={(e) => setContactConsent(e.target.value)}
                  >
                    <option>Email and phone permitted</option>
                    <option>Email permitted</option>
                    <option>Voice permitted</option>
                    <option>Pending preference confirmation</option>
                    <option>Opted out</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: OPPORTUNITY CREATION */}
          {step === 3 && (
            <div className="conversion-step-content space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Sales Opportunity & Pipeline Deal</h3>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createDeal}
                    onChange={(e) => setCreateDeal(e.target.checked)}
                  />
                  Create Opportunity immediately
                </label>
              </div>

              {createDeal ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1 col-span-2">
                    Opportunity Name *
                    <input
                      className="p-2 border border-slate-300 rounded text-xs"
                      value={dealName}
                      onChange={(e) => setDealName(e.target.value)}
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                    Indicative Deal Value (USD) *
                    <input
                      type="number"
                      className="p-2 border border-slate-300 rounded text-xs font-semibold"
                      value={dealAmount}
                      onChange={(e) => setDealAmount(e.target.value)}
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                    Pipeline Stage
                    <select
                      className="p-2 border border-slate-300 rounded text-xs bg-white"
                      value={dealStage}
                      onChange={(e) => setDealStage(e.target.value)}
                    >
                      <option>Qualification</option>
                      <option>Discovery</option>
                      <option>Proposal</option>
                      <option>Negotiation</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                    Win Probability (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="p-2 border border-slate-300 rounded text-xs"
                      value={dealProbability}
                      onChange={(e) => setDealProbability(e.target.value)}
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                    Expected Close Date
                    <input
                      type="date"
                      className="p-2 border border-slate-300 rounded text-xs"
                      value={dealCloseDate}
                      onChange={(e) => setDealCloseDate(e.target.value)}
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1 col-span-2">
                    Sales Owner
                    <input
                      className="p-2 border border-slate-300 rounded text-xs"
                      value={dealOwner}
                      onChange={(e) => setDealOwner(e.target.value)}
                    />
                  </label>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded text-xs text-slate-500">
                  No opportunity will be created at this time. Only Organization and Contact records will be initialized.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW & FINALIZE */}
          {step === 4 && (
            <div className="conversion-step-content space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Review Conversion Mapping</h3>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={14}/> Ready for execution
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5 mb-1.5">
                    <Building2 size={14}/> Organization
                  </span>
                  <strong className="text-xs text-slate-800 block">
                    {orgMode === 'link' ? availableAccounts.find(o => o.id === selectedOrgId)?.name : newOrgName}
                  </strong>
                  <small className="text-xs text-slate-500 block mt-1">
                    {orgMode === 'link' ? 'Linked to existing account' : `${newOrgIndustry} · ${newOrgSegment}`}
                  </small>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs font-bold text-cyan-800 flex items-center gap-1.5 mb-1.5">
                    <Contact size={14}/> Contact Record
                  </span>
                  <strong className="text-xs text-slate-800 block">
                    {contactFirstName} {contactLastName}
                  </strong>
                  <small className="text-xs text-slate-500 block mt-1">
                    {contactTitle} · {contactEmail}
                  </small>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5 mb-1.5">
                    <Target size={14}/> Deal Record
                  </span>
                  <strong className="text-xs text-slate-800 block">
                    {createDeal ? money(Number(dealAmount)) : 'None'}
                  </strong>
                  <small className="text-xs text-slate-500 block mt-1">
                    {createDeal ? `${dealStage} · ${dealName}` : 'Deal creation skipped'}
                  </small>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                <ShieldCheck size={16} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                <span>
                  Completing conversion will mark <b>{lead.ref}</b> as Converted, create foreign-key relationships across customer records, emit a <code>lead.converted</code> domain event, and record the transaction in the immutable audit log.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="form-modal-footer flex justify-between items-center">
          <div>
            {step > 1 && (
              <button className="btn secondary" onClick={() => setStep((step - 1) as any)}>
                Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            {step < 4 ? (
              <button className="btn primary" onClick={handleNext}>
                Next Step <ChevronRight size={14}/>
              </button>
            ) : (
              <button className="btn primary" onClick={executeConversion} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin"/> Executing Atomic Conversion...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15}/> Complete Conversion & Open Customer 360
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
