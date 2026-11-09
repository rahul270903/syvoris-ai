import { useState, useMemo } from 'react';
import {
  ArrowRight, Building2, Check, CheckCircle2, ChevronRight, Contact,
  FileCheck2, Handshake, HelpCircle, ShieldAlert, ShieldCheck, Sparkles, Target, Users, X
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { makeId, money, type CRMRecord } from '../../data/models';

export function LeadConversionModal({
  lead,
  onClose,
  onComplete,
}: {
  lead: CRMRecord;
  onClose: () => void;
  onComplete: (org: CRMRecord, contact: CRMRecord, opp: CRMRecord) => void;
}) {
  const { records, create, update, addAudit, addEvent } = useCRM();
  const existingOrgs = records('organizations');

  const initialCompanyName = lead.fields.company || lead.fields.organization || 'New Enterprise';
  
  // Duplicate check
  const matchedOrg = useMemo(() => {
    return existingOrgs.find(o => 
      o.title.toLowerCase() === initialCompanyName.toLowerCase() ||
      o.title.toLowerCase().includes(initialCompanyName.toLowerCase()) ||
      initialCompanyName.toLowerCase().includes(o.title.toLowerCase())
    );
  }, [existingOrgs, initialCompanyName]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [orgMode, setOrgMode] = useState<'create' | 'link'>(matchedOrg ? 'link' : 'create');
  const [selectedOrgId, setSelectedOrgId] = useState<string>(matchedOrg?.id || existingOrgs[0]?.id || '');
  const [newOrgName, setNewOrgName] = useState(initialCompanyName);
  const [newOrgIndustry, setNewOrgIndustry] = useState(lead.fields.industry || 'Technology');
  const [newOrgSegment, setNewOrgSegment] = useState('Enterprise');
  const [newOrgTerritory, setNewOrgTerritory] = useState(lead.fields.territory || 'Caribbean');

  // Contact State
  const [contactFirstName, setContactFirstName] = useState(lead.fields.firstName || '');
  const [contactLastName, setContactLastName] = useState(lead.fields.lastName || '');
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

  const executeConversion = () => {
    let targetOrg: CRMRecord;
    if (orgMode === 'link') {
      targetOrg = existingOrgs.find(o => o.id === selectedOrgId) || existingOrgs[0];
    } else {
      targetOrg = create('organizations', {
        name: newOrgName,
        industry: newOrgIndustry,
        segment: newOrgSegment,
        territory: newOrgTerritory,
        owner: lead.owner,
        consent: contactConsent,
        description: `Account created from converted lead ${lead.ref}.`,
      }, { status: 'Active' });
    }

    // Create Contact
    const targetContact = create('contacts', {
      firstName: contactFirstName,
      lastName: contactLastName,
      title: contactTitle,
      organization: targetOrg.title,
      email: contactEmail,
      phone: contactPhone,
      consent: contactConsent,
      owner: lead.owner,
    }, {
      status: 'Active',
      links: { organizations: [targetOrg.id] },
    });

    // Create Opportunity
    let targetOpp: CRMRecord;
    if (createDeal) {
      targetOpp = create('opportunities', {
        name: dealName,
        customer: targetOrg.title,
        contact: `${contactFirstName} ${contactLastName}`.trim(),
        stage: dealStage,
        amount: dealAmount,
        probability: dealProbability,
        closeDate: dealCloseDate,
        source: lead.fields.source || 'Lead Conversion',
        risk: 'Low',
        owner: dealOwner,
        nextStep: 'Schedule technical discovery meeting',
        description: `Opportunity generated from qualified lead ${lead.ref}.`,
      }, {
        status: dealStage,
        amount: Number(dealAmount) || 0,
        probability: Number(dealProbability) || 25,
        links: {
          organizations: [targetOrg.id],
          contacts: [targetContact.id],
        },
      });
    } else {
      targetOpp = create('opportunities', {
        name: `${targetOrg.title} · Baseline Discovery`,
        customer: targetOrg.title,
        stage: 'Qualification',
        amount: '0',
        probability: '10',
        owner: lead.owner,
        description: `Record created from lead conversion ${lead.ref}`,
      }, { status: 'Qualification', links: { organizations: [targetOrg.id] } });
    }

    // Link back to Org
    update('organizations', targetOrg.id, {
      links: {
        contacts: [...new Set([...(targetOrg.links.contacts || []), targetContact.id])],
        opportunities: [...new Set([...(targetOrg.links.opportunities || []), targetOpp.id])],
      },
    }, 'Linked converted contact and opportunity');

    // Update Lead to Converted
    update('leads', lead.id, {
      status: 'Converted',
      links: {
        organizations: [targetOrg.id],
        contacts: [targetContact.id],
        opportunities: [targetOpp.id],
      },
      fields: {
        conversionDate: new Date().toISOString().slice(0, 10),
        convertedOrganization: targetOrg.ref,
        convertedContact: targetContact.ref,
        convertedOpportunity: targetOpp.ref,
      },
    }, 'Lead converted to organization, contact and opportunity');

    addAudit(
      'Lead conversion completed',
      'Demo User',
      `${lead.ref} → ${targetOrg.ref}, ${targetContact.ref}, ${targetOpp.ref}`
    );

    addEvent('lead.converted', lead, `${lead.ref} converted into ${targetOrg.ref}`);

    onComplete(targetOrg, targetContact, targetOpp);
  };

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
          <button className={`conversion-step-btn ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`} onClick={() => setStep(1)}>
            <span>1</span><b>Organization</b>
          </button>
          <div className="step-line"/>
          <button className={`conversion-step-btn ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`} onClick={() => setStep(2)}>
            <span>2</span><b>Contact Person</b>
          </button>
          <div className="step-line"/>
          <button className={`conversion-step-btn ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`} onClick={() => setStep(3)}>
            <span>3</span><b>Deal & Pipeline</b>
          </button>
          <div className="step-line"/>
          <button className={`conversion-step-btn ${step === 4 ? 'active' : ''}`} onClick={() => setStep(4)}>
            <span>4</span><b>Review & Finalize</b>
          </button>
        </div>

        {/* Step Body */}
        <div className="form-modal-body">
          {/* STEP 1: ORGANIZATION RESOLUTION */}
          {step === 1 && (
            <div className="conversion-step-content space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Organization / Account Resolution</h3>
                <span className="text-xs text-slate-500">Duplicate detection active</span>
              </div>

              {matchedOrg && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-3">
                  <ShieldAlert size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <b>Potential Duplicate Detected:</b> An existing account <b>"{matchedOrg.title}"</b> ({matchedOrg.ref}) was found. You can link this lead to the existing customer or create a distinct subsidiary.
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
                  <label className="text-xs font-bold text-slate-700 block">Select Existing Account</label>
                  <select
                    className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white"
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                  >
                    {existingOrgs.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.title} ({o.ref}) — {o.fields.industry}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1 col-span-2">
                    Organization Name *
                    <input
                      className="p-2 border border-slate-300 rounded text-xs"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
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
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                    Win Probability (%)
                    <input
                      type="number"
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
                    {orgMode === 'link' ? existingOrgs.find(o => o.id === selectedOrgId)?.title : newOrgName}
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
            <button className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            {step < 4 ? (
              <button className="btn primary" onClick={() => setStep((step + 1) as any)}>
                Next Step <ChevronRight size={14}/>
              </button>
            ) : (
              <button className="btn primary" onClick={executeConversion}>
                <CheckCircle2 size={15}/> Complete Conversion & Open Customer 360
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
