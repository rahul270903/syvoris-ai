import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, Award, Bot, Boxes, Briefcase, Building2, CalendarDays,
  CheckCircle2, ChevronRight, Clock3, Contact, FileCheck2, FileText,
  FolderKanban, Globe2, Handshake, Headphones, HeartHandshake, Mail,
  MessageCircle, Network, Phone, Plus, ShieldCheck, ShoppingCart, Sparkles, Target, Ticket, TrendingUp, Users,
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { money, shortDate, type CRMRecord } from '../../data/models';
import { StatusPill } from '../../components/StatusPill';
import { api, Customer360Data } from '../../services/api';

export function Customer360View({
  selectedOrgId,
  onSelectOrg,
  onOpenRecord,
  onNewAction,
}: {
  selectedOrgId?: string;
  onSelectOrg?: (id: string) => void;
  onOpenRecord: (entity: string, recordId: string) => void;
  onNewAction: (entity: string, prefill?: Record<string, string>) => void;
}) {
  const { records } = useCRM();
  const navigate = useNavigate();
  const [liveAccounts, setLiveAccounts] = useState<CRMRecord[]>([]);

  useEffect(() => {
    api.listAccounts({ limit: 100 }).then(res => {
      if (res && res.items) {
        const mapped: CRMRecord[] = res.items.map(acc => ({
          id: acc.id,
          ref: acc.ref,
          title: acc.name,
          description: acc.description || `${acc.name} · ${acc.industry || 'Organization'}`,
          status: acc.status,
          owner: acc.owner_name || 'Organization Owner',
          amount: Number(acc.credit_limit || 0),
          date: acc.created_at ? acc.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: { contacts: [] },
          history: [],
          fields: {
            name: acc.name,
            industry: acc.industry || '',
            segment: acc.account_type || 'Enterprise',
            website: acc.website || '',
            phone: acc.phone || '',
            email: acc.email || '',
            address: acc.address || '',
            ownership: acc.ownership || 'Private',
            creditLimit: String(acc.credit_limit || 0),
            description: acc.description || '',
          }
        }));
        setLiveAccounts(mapped);
      }
    }).catch(() => {});
  }, []);

  const storeOrgs = records('organizations');
  const orgs = liveAccounts.length > 0 ? liveAccounts : storeOrgs;

  const [activeOrgId, setActiveOrgId] = useState<string>(() => {
    return selectedOrgId || orgs[0]?.id || '';
  });

  useEffect(() => {
    if (!activeOrgId && orgs.length > 0) {
      setActiveOrgId(orgs[0].id);
    }
  }, [orgs, activeOrgId]);
  const [tab, setTab] = useState<'overview' | 'contacts' | 'deals' | 'quotes' | 'orders' | 'invoices' | 'cases' | 'projects' | 'timeline' | 'ai'>('overview');

  const currentOrg = useMemo(() => {
    return orgs.find(o => o.id === (selectedOrgId || activeOrgId)) || orgs[0];
  }, [orgs, selectedOrgId, activeOrgId]);

  const selectAccount = (id: string) => {
    setActiveOrgId(id);
    if (onSelectOrg) onSelectOrg(id);
  };

  const orgName = currentOrg?.title || '';
  const orgId = currentOrg?.id || '';

  const [live360Data, setLive360Data] = useState<Customer360Data | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [actType, setActType] = useState('Note');
  const [actSubject, setActSubject] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [savingAct, setSavingAct] = useState(false);

  const fetchLive360 = async (id: string) => {
    if (!id) return;
    try {
      const data = await api.getAccount360(id);
      setLive360Data(data);
    } catch {
      setLive360Data(null);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchLive360(orgId);
    }
  }, [orgId]);

  // Linked records
  const contacts = useMemo(() => {
    if (live360Data?.contacts && live360Data.contacts.length > 0) {
      return live360Data.contacts.map(c => ({
        id: c.id,
        ref: c.ref,
        title: c.full_name,
        description: `${c.job_title || 'Contact'} · ${c.department || 'Department'}`,
        status: c.status,
        owner: c.owner_name || 'Owner',
        amount: 0,
        date: c.created_at ? c.created_at.slice(0, 10) : '',
        links: { organizations: c.account_id ? [c.account_id] : [] },
        history: [],
        fields: {
          firstName: c.first_name,
          lastName: c.last_name,
          organization: c.account_name || orgName,
          email: c.email,
          phone: c.phone || '',
          jobTitle: c.job_title || '',
          title: c.job_title || '',
          department: c.department || '',
          consent: 'Email and phone permitted',
          primary: c.is_primary ? 'Primary' : 'Secondary',
          decisionMaker: c.is_decision_maker ? 'Yes' : 'No',
        }
      }));
    }
    return records('contacts').filter(c => 
      c.fields.organization?.toLowerCase() === orgName.toLowerCase() ||
      c.links.organizations?.includes(orgId) ||
      currentOrg?.links.contacts?.includes(c.id)
    );
  }, [records, orgName, orgId, currentOrg, live360Data]);

  const opportunities = useMemo(() => {
    return records('opportunities').filter(o => 
      o.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      o.links.organizations?.includes(orgId) ||
      currentOrg?.links.opportunities?.includes(o.id)
    );
  }, [records, orgName, orgId, currentOrg]);

  const quotes = useMemo(() => {
    return records('quotes').filter(q => 
      q.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      q.links.organizations?.includes(orgId) ||
      currentOrg?.links.quotes?.includes(q.id)
    );
  }, [records, orgName, orgId, currentOrg]);

  const salesOrders = useMemo(() => {
    return records('salesOrders').filter(s => 
      s.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      s.links.organizations?.includes(orgId) ||
      currentOrg?.links.salesOrders?.includes(s.id)
    );
  }, [records, orgName, orgId, currentOrg]);

  const invoices = useMemo(() => {
    return records('invoices').filter(i => 
      i.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      i.links.organizations?.includes(orgId) ||
      currentOrg?.links.invoices?.includes(i.id)
    );
  }, [records, orgName, orgId, currentOrg]);

  const cases = useMemo(() => {
    return records('cases').filter(c => 
      c.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      c.links.organizations?.includes(orgId) ||
      currentOrg?.links.cases?.includes(c.id)
    );
  }, [records, orgName, orgId, currentOrg]);

  const projects = useMemo(() => {
    return records('projects').filter(p => 
      p.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      p.links.organizations?.includes(orgId) ||
      currentOrg?.links.projects?.includes(p.id)
    );
  }, [records, orgName, orgId, currentOrg]);

  const timelineEntries = useMemo(() => {
    const liveActEvents = (live360Data?.activities || []).map(a => ({
      id: a.id,
      ref: `ACT-${a.id.slice(0, 6).toUpperCase()}`,
      title: `${a.activity_type}: ${a.subject}`,
      type: a.activity_type,
      date: a.occurred_at ? a.occurred_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      summary: `${a.description || ''} (Logged by ${a.actor_name})`,
      channel: a.activity_type === 'Call' ? 'Phone' : a.activity_type === 'Email' ? 'Email' : 'Direct Note',
      entity: 'interactions',
    }));

    const orgInteractions = records('interactions').filter(i => 
      i.fields.relatedTo?.toLowerCase().includes(orgName.toLowerCase()) ||
      i.links.organizations?.includes(orgId)
    );
    const oppEvents = opportunities.map(o => ({
      id: o.id,
      ref: o.ref,
      title: `Opportunity: ${o.title} (${o.fields.stage || o.status})`,
      type: 'Commercial Event',
      date: o.date,
      summary: o.description,
      channel: 'Sales Pipeline',
      entity: 'opportunities',
    }));
    const caseEvents = cases.map(c => ({
      id: c.id,
      ref: c.ref,
      title: `Support Case: ${c.title}`,
      type: 'Service Ticket',
      date: c.date,
      summary: c.description,
      channel: c.fields.channel || 'Service Desk',
      entity: 'cases',
    }));
    const orderEvents = salesOrders.map(s => ({
      id: s.id,
      ref: s.ref,
      title: `Sales Order: ${s.title}`,
      type: 'Fulfilment Event',
      date: s.date,
      summary: s.description,
      channel: 'Operations',
      entity: 'salesOrders',
    }));
    const interactionEvents = orgInteractions.map(i => ({
      id: i.id,
      ref: i.ref,
      title: i.title,
      type: i.fields.type || 'Interaction',
      date: i.fields.date || i.date,
      summary: i.description,
      channel: i.fields.channel || 'Direct',
      entity: 'interactions',
    }));

    return [...liveActEvents, ...interactionEvents, ...oppEvents, ...caseEvents, ...orderEvents].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [records, orgName, orgId, opportunities, cases, salesOrders, live360Data]);

  const totalOpenDeals = opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.status)).reduce((s, o) => s + o.amount, 0);
  const totalWonDeals = opportunities.filter(o => o.status === 'Closed Won').reduce((s, o) => s + o.amount, 0);
  const openCasesCount = cases.filter(c => !['Resolved', 'Closed'].includes(c.status)).length;

  if (!currentOrg) {
    return <div className="panel p-6 text-center text-slate-500">No organization records available.</div>;
  }

  return (
    <div className="customer-360-workspace">
      {/* Account Selector Strip */}
      <div className="c360-account-selector-bar">
        <span className="c360-selector-label"><Building2 size={16}/> Select Account:</span>
        <div className="c360-account-pills">
          {orgs.map(org => (
            <button
              key={org.id}
              className={`c360-account-pill ${org.id === currentOrg.id ? 'active' : ''}`}
              onClick={() => selectAccount(org.id)}
            >
              <b>{org.title}</b>
              <small>{org.fields.segment || 'Account'}</small>
            </button>
          ))}
        </div>
      </div>

      {/* Account Header Hero Card */}
      <div className="c360-hero-card panel">
        <div className="c360-hero-top">
          <div className="c360-hero-identity">
            <div className="c360-org-avatar">
              <Building2 size={24}/>
            </div>
            <div>
              <div className="c360-eyebrow-row">
                <span className="eyebrow">{currentOrg.ref} · {currentOrg.fields.segment?.toUpperCase() || 'ENTERPRISE'}</span>
                <StatusPill status={currentOrg.status}/>
                <span className="c360-health-pill"><i/> Health: 94/100 · Strong</span>
              </div>
              <h1 className="c360-org-name">{currentOrg.title}</h1>
              <p className="c360-org-desc">{currentOrg.description}</p>
            </div>
          </div>
          <div className="c360-hero-actions">
            <button className="btn primary" onClick={() => onNewAction('opportunities', { customer: currentOrg.title })}>
              <Plus size={15}/> New Opportunity
            </button>
            <button className="btn secondary" onClick={() => onNewAction('quotes', { customer: currentOrg.title })}>
              <FileCheck2 size={15}/> New Quote
            </button>
            <button className="btn secondary" onClick={() => onNewAction('cases', { customer: currentOrg.title })}>
              <Ticket size={15}/> Log Case
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="c360-metrics-bar">
          <div className="c360-metric">
            <span>Open Pipeline</span>
            <strong>{money(totalOpenDeals)}</strong>
            <small>{opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.status)).length} open deals</small>
          </div>
          <div className="c360-metric">
            <span>Closed-Won Revenue</span>
            <strong className="text-emerald-700">{money(totalWonDeals)}</strong>
            <small>Lifetime value</small>
          </div>
          <div className="c360-metric">
            <span>Active Quotes</span>
            <strong>{money(quotes.reduce((s, q) => s + q.amount, 0))}</strong>
            <small>{quotes.length} total quotes</small>
          </div>
          <div className="c360-metric">
            <span>Open Cases</span>
            <strong className={openCasesCount > 0 ? 'text-amber-700' : 'text-slate-700'}>{openCasesCount}</strong>
            <small>Service health SLA</small>
          </div>
          <div className="c360-metric">
            <span>Active Projects</span>
            <strong>{projects.length}</strong>
            <small>{projects.filter(p => p.status === 'Active').length} active</small>
          </div>
          <div className="c360-metric">
            <span>Sentiment & Churn</span>
            <strong className="text-cyan-700">Positive · 1.4%</strong>
            <small>Low churn risk</small>
          </div>
        </div>
      </div>

      {/* Contextual Navigation Tabs */}
      <div className="c360-tabs-nav">
        {[
          { key: 'overview', label: 'Overview & Hierarchy', icon: Building2, count: null },
          { key: 'contacts', label: 'Contacts', icon: Contact, count: contacts.length },
          { key: 'deals', label: 'Opportunities & Deals', icon: Target, count: opportunities.length },
          { key: 'quotes', label: 'Quotes & CPQ', icon: FileCheck2, count: quotes.length },
          { key: 'orders', label: 'Sales Orders', icon: ShoppingCart, count: salesOrders.length },
          { key: 'invoices', label: 'Invoices', icon: FileText, count: invoices.length },
          { key: 'cases', label: 'Support Cases', icon: Ticket, count: cases.length },
          { key: 'projects', label: 'Projects', icon: FolderKanban, count: projects.length },
          { key: 'timeline', label: 'Customer Timeline', icon: Activity, count: timelineEntries.length },
          { key: 'ai', label: 'AI Intelligence & Sentiment', icon: Sparkles, count: null },
        ].map(t => {
          const TIcon = t.icon;
          return (
            <button
              key={t.key}
              className={`c360-tab-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key as any)}
            >
              <TIcon size={16}/>
              <span>{t.label}</span>
              {t.count !== null && <span className="c360-tab-badge">{t.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="c360-tab-content">
        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="c360-overview-grid">
            <section className="panel p-5">
              <div className="panel-heading mb-4">
                <div>
                  <h2>Organization Master Profile</h2>
                  <p>Corporate identity, industry classification and relationship boundaries.</p>
                </div>
                <Building2 size={18} className="text-slate-400"/>
              </div>
              <div className="c360-field-grid">
                <div><span>Account Name</span><strong>{currentOrg.title}</strong></div>
                <div><span>Industry</span><strong>{currentOrg.fields.industry || 'Telecommunications'}</strong></div>
                <div><span>Customer Segment</span><strong>{currentOrg.fields.segment || 'Enterprise'}</strong></div>
                <div><span>Territory</span><strong>{currentOrg.fields.territory || 'Caribbean'}</strong></div>
                <div><span>Website</span><strong>{currentOrg.fields.website || 'caribbeanfiber.example'}</strong></div>
                <div><span>Main Telephone</span><strong>{currentOrg.fields.phone || '+1 876 555 0182'}</strong></div>
                <div><span>Credit Limit</span><strong>{money(Number(currentOrg.fields.creditLimit || 75000))}</strong></div>
                <div><span>Account Owner</span><strong>{currentOrg.owner}</strong></div>
                <div><span>Communication Consent</span><strong className="text-emerald-700">{currentOrg.fields.consent || 'Email and phone permitted'}</strong></div>
                <div><span>Parent Organization</span><strong>{currentOrg.fields.parent || 'Seiretsu Enterprise Group'}</strong></div>
              </div>
            </section>

            <section className="panel p-5">
              <div className="panel-heading mb-4">
                <div>
                  <h2>Enterprise Hierarchy & Subsidiaries</h2>
                  <p>Parent-child corporate structure and subsidiary operating units.</p>
                </div>
                <Network size={18} className="text-blue-500"/>
              </div>
              <div className="c360-hierarchy-box">
                <div className="c360-hierarchy-parent">
                  <span className="eyebrow">PARENT HOLDING ENTITY</span>
                  <strong>{currentOrg.fields.parent || 'Seiretsu Enterprise Group'}</strong>
                  <small>Ultimate Beneficiary & Master Agreement</small>
                </div>
                <div className="c360-hierarchy-connector"/>
                <div className="c360-hierarchy-current">
                  <span className="eyebrow">PRIMARY ACCOUNT (THIS ENTITY)</span>
                  <strong>{currentOrg.title}</strong>
                  <small>{currentOrg.ref} · {currentOrg.fields.industry}</small>
                </div>
                <div className="c360-hierarchy-connector"/>
                <div className="c360-hierarchy-children">
                  <div className="c360-child-node">
                    <strong>Kingston Operations Hub</strong>
                    <small>Regional Data Centre & Network Operations</small>
                  </div>
                  <div className="c360-child-node">
                    <strong>Montego Bay Branch Office</strong>
                    <small>Commercial & Customer Support Terminal</small>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* CONTACTS TAB */}
        {tab === 'contacts' && (
          <section className="panel p-5">
            <div className="panel-heading mb-4">
              <div>
                <h2>Customer Contacts & Stakeholders</h2>
                <p>{contacts.length} people linked to {currentOrg.title}.</p>
              </div>
              <button className="btn primary" onClick={() => onNewAction('contacts', { organization: currentOrg.title, accountId: currentOrg.id })}>
                <Plus size={15}/> Add Contact
              </button>
            </div>
            {contacts.length === 0 ? (
              <div className="empty-state">No contacts found for this account.</div>
            ) : (
              <div className="c360-contact-grid">
                {contacts.map(c => (
                  <div className="c360-contact-card" key={c.id}>
                    <div className="c360-contact-head">
                      <span className="profile-avatar">{c.fields.firstName?.[0]}{c.fields.lastName?.[0]}</span>
                      <div>
                        <strong>{c.title}</strong>
                        <small>{c.fields.title || 'Business Contact'} · {c.fields.department || 'Procurement'}</small>
                      </div>
                      <StatusPill status={c.status}/>
                    </div>
                    <div className="c360-contact-details">
                      <div><Mail size={14}/><span>{c.fields.email || 'email@example.test'}</span></div>
                      <div><Phone size={14}/><span>{c.fields.phone || '+1 876 555 0100'}</span></div>
                      <div><ShieldCheck size={14}/><span className="text-emerald-700">{c.fields.consent || 'Consent verified'}</span></div>
                    </div>
                    <div className="c360-contact-foot">
                      <button className="btn secondary small" onClick={() => onOpenRecord('contacts', c.id)}>
                        View Profile
                      </button>
                      <button className="btn secondary small" onClick={() => navigate('/communications/email', { state: { prefillTo: c.fields.email } })}>
                        <Mail size={13}/> Compose
                      </button>
                      <button className="btn secondary small" onClick={() => navigate('/communications/calls', { state: { prefillContact: c.title } })}>
                        <Phone size={13}/> Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* OPPORTUNITIES TAB */}
        {tab === 'deals' && (
          <section className="panel p-5">
            <div className="panel-heading mb-4">
              <div>
                <h2>Active Opportunities & Commercial Pipeline</h2>
                <p>{opportunities.length} opportunities for this organization.</p>
              </div>
              <button className="btn primary" onClick={() => onNewAction('opportunities', { customer: currentOrg.title })}>
                <Plus size={15}/> New Opportunity
              </button>
            </div>
            {opportunities.length === 0 ? (
              <div className="empty-state">No opportunities linked.</div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>REFERENCE</th>
                    <th>OPPORTUNITY</th>
                    <th>STAGE</th>
                    <th>VALUE</th>
                    <th>PROBABILITY</th>
                    <th>EXPECTED CLOSE</th>
                    <th>OWNER</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map(opp => (
                    <tr key={opp.id} className="row-click" onClick={() => onOpenRecord('opportunities', opp.id)}>
                      <td><span className="ref-link">{opp.ref}</span></td>
                      <td>
                        <div className="table-primary">
                          <strong>{opp.title}</strong>
                          <small>{opp.description}</small>
                        </div>
                      </td>
                      <td><StatusPill status={opp.fields.stage || opp.status}/></td>
                      <td><strong>{money(opp.amount)}</strong></td>
                      <td>{opp.probability ?? opp.fields.probability ?? 50}%</td>
                      <td>{shortDate(opp.fields.closeDate || opp.date)}</td>
                      <td>{opp.owner}</td>
                      <td>
                        <button className="btn secondary small" onClick={(e) => { e.stopPropagation(); onOpenRecord('opportunities', opp.id); }}>
                          Open <ArrowRight size={13}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* QUOTES TAB */}
        {tab === 'quotes' && (
          <section className="panel p-5">
            <div className="panel-heading mb-4">
              <div>
                <h2>Commercial Quotes & CPQ Proposals</h2>
                <p>{quotes.length} quotes generated for {currentOrg.title}.</p>
              </div>
              <button className="btn primary" onClick={() => onNewAction('quotes', { customer: currentOrg.title })}>
                <Plus size={15}/> Build New Quote
              </button>
            </div>
            {quotes.length === 0 ? (
              <div className="empty-state">No quotes currently generated.</div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>REFERENCE</th>
                    <th>QUOTE NAME</th>
                    <th>AMOUNT</th>
                    <th>DISCOUNT</th>
                    <th>PAYMENT TERMS</th>
                    <th>STATUS</th>
                    <th>VALID UNTIL</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(q => (
                    <tr key={q.id} className="row-click" onClick={() => onOpenRecord('quotes', q.id)}>
                      <td><span className="ref-link">{q.ref}</span></td>
                      <td>
                        <div className="table-primary">
                          <strong>{q.title}</strong>
                          <small>{q.fields.opportunity || 'Direct commercial quote'}</small>
                        </div>
                      </td>
                      <td><strong>{money(q.amount)}</strong></td>
                      <td>{q.fields.discount || '0'}%</td>
                      <td>{q.fields.paymentTerms || 'Net 30'}</td>
                      <td><StatusPill status={q.status}/></td>
                      <td>{shortDate(q.fields.validUntil || q.date)}</td>
                      <td>
                        <button className="btn secondary small" onClick={(e) => { e.stopPropagation(); onOpenRecord('quotes', q.id); }}>
                          Review Quote <ArrowRight size={13}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* SALES ORDERS TAB */}
        {tab === 'orders' && (
          <section className="panel p-5">
            <div className="panel-heading mb-4">
              <div>
                <h2>Sales Orders & Order Fulfilment</h2>
                <p>{salesOrders.length} confirmed orders from accepted commercial quotes.</p>
              </div>
              <button className="btn secondary" onClick={() => navigate('/sales-orders')}>
                All Sales Orders <ArrowRight size={14}/>
              </button>
            </div>
            {salesOrders.length === 0 ? (
              <div className="empty-state">No sales orders generated yet. Accept a quote to convert it into a sales order.</div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>ORDER REF</th>
                    <th>TITLE</th>
                    <th>AMOUNT</th>
                    <th>PAYMENT TERMS</th>
                    <th>FULFILMENT STATUS</th>
                    <th>DATE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {salesOrders.map(so => (
                    <tr key={so.id} className="row-click" onClick={() => onOpenRecord('salesOrders', so.id)}>
                      <td><span className="ref-link">{so.ref}</span></td>
                      <td>
                        <div className="table-primary">
                          <strong>{so.title}</strong>
                          <small>{so.fields.quote ? `From Quote ${so.fields.quote}` : so.description}</small>
                        </div>
                      </td>
                      <td><strong>{money(so.amount)}</strong></td>
                      <td>{so.fields.paymentTerms || 'Net 30'}</td>
                      <td><StatusPill status={so.status}/></td>
                      <td>{shortDate(so.date)}</td>
                      <td>
                        <button className="btn secondary small" onClick={(e) => { e.stopPropagation(); onOpenRecord('salesOrders', so.id); }}>
                          Order Details <ArrowRight size={13}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* INVOICES TAB */}
        {tab === 'invoices' && (
          <section className="panel p-5">
            <div className="panel-heading mb-4">
              <div>
                <h2>Customer Invoices & Billing References</h2>
                <p>{invoices.length} billing records associated with this account.</p>
              </div>
              <button className="btn secondary" onClick={() => navigate('/invoices')}>
                View Invoices <ArrowRight size={14}/>
              </button>
            </div>
            {invoices.length === 0 ? (
              <div className="empty-state">No invoices issued. Invoices are generated upon sales order fulfilment milestones.</div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>INVOICE REF</th>
                    <th>DESCRIPTION</th>
                    <th>AMOUNT</th>
                    <th>DUE DATE</th>
                    <th>TERMS</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="row-click" onClick={() => onOpenRecord('invoices', inv.id)}>
                      <td><span className="ref-link">{inv.ref}</span></td>
                      <td>
                        <div className="table-primary">
                          <strong>{inv.title}</strong>
                          <small>{inv.fields.salesOrder ? `Order: ${inv.fields.salesOrder}` : inv.description}</small>
                        </div>
                      </td>
                      <td><strong>{money(inv.amount)}</strong></td>
                      <td>{shortDate(inv.fields.dueDate || inv.date)}</td>
                      <td>{inv.fields.terms || 'Net 30'}</td>
                      <td><StatusPill status={inv.status}/></td>
                      <td>
                        <button className="btn secondary small" onClick={(e) => { e.stopPropagation(); onOpenRecord('invoices', inv.id); }}>
                          Invoice Details <ArrowRight size={13}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* SUPPORT CASES TAB */}
        {tab === 'cases' && (
          <section className="panel p-5">
            <div className="panel-heading mb-4">
              <div>
                <h2>Customer Support Tickets & SLA Tracking</h2>
                <p>{cases.length} cases registered for {currentOrg.title}.</p>
              </div>
              <button className="btn primary" onClick={() => onNewAction('cases', { customer: currentOrg.title })}>
                <Plus size={15}/> New Support Ticket
              </button>
            </div>
            {cases.length === 0 ? (
              <div className="empty-state">No support cases open for this account.</div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>CASE REF</th>
                    <th>SUBJECT</th>
                    <th>PRIORITY</th>
                    <th>CATEGORY</th>
                    <th>SLA TARGET</th>
                    <th>ASSIGNED</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c.id} className="row-click" onClick={() => onOpenRecord('cases', c.id)}>
                      <td><span className="ref-link">{c.ref}</span></td>
                      <td>
                        <div className="table-primary">
                          <strong>{c.title}</strong>
                          <small>{c.description}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${c.fields.priority === 'Critical' ? 'red' : c.fields.priority === 'High' ? 'amber' : 'blue'}`}>
                          {c.fields.priority || 'Normal'}
                        </span>
                      </td>
                      <td>{c.fields.category || 'Connectivity'}</td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          <Clock3 size={12}/> {c.fields.sla || '4 business hours'}
                        </span>
                      </td>
                      <td>{c.fields.assigned || 'Service Agent'}</td>
                      <td><StatusPill status={c.status}/></td>
                      <td>
                        <button className="btn secondary small" onClick={(e) => { e.stopPropagation(); onOpenRecord('cases', c.id); }}>
                          Manage Case <ArrowRight size={13}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* PROJECTS TAB */}
        {tab === 'projects' && (
          <section className="panel p-5">
            <div className="panel-heading mb-4">
              <div>
                <h2>Delivery Projects & Implementations</h2>
                <p>{projects.length} delivery projects associated with this customer.</p>
              </div>
              <button className="btn primary" onClick={() => onNewAction('projects', { customer: currentOrg.title })}>
                <Plus size={15}/> New Project
              </button>
            </div>
            {projects.length === 0 ? (
              <div className="empty-state">No active projects. Closed-Won opportunities can be handed off to create delivery projects.</div>
            ) : (
              <div className="c360-projects-grid">
                {projects.map(p => (
                  <div className="c360-project-card panel p-4" key={p.id}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="ref-link text-xs">{p.ref}</span>
                        <h3 className="font-bold text-slate-800 text-sm mt-0.5">{p.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                      </div>
                      <StatusPill status={p.status}/>
                    </div>
                    <div className="c360-project-progress my-3">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Milestone Progress</span>
                        <b>{p.fields.progress || '42'}%</b>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${p.fields.progress || 42}%` }}/>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div><span className="block text-slate-400">Budget</span><b>{money(p.amount)}</b></div>
                      <div><span className="block text-slate-400">Manager</span><b>{p.fields.manager || 'D. Foster'}</b></div>
                      <div><span className="block text-slate-400">Health</span><b className="text-emerald-700">{p.fields.health || 'On Track'}</b></div>
                    </div>
                    <div className="mt-3 pt-2 text-right">
                      <button className="btn secondary small" onClick={() => onOpenRecord('projects', p.id)}>
                        Open Project Details <ArrowRight size={13}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TIMELINE TAB */}
        {tab === 'timeline' && (
          <section className="panel p-5">
            <div className="panel-heading mb-4">
              <div>
                <h2>Chronological Customer Memory & Interaction Narrative</h2>
                <p>{timelineEntries.length} chronological events across all sales, service and commercial channels.</p>
              </div>
              <button className="btn primary" onClick={() => setShowActivityForm(!showActivityForm)}>
                <Plus size={15}/> {showActivityForm ? 'Close Form' : 'Log Activity / Note'}
              </button>
            </div>
            {showActivityForm && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg mb-4 text-xs">
                <div className="font-semibold text-cyan-400 mb-2">Log Interaction / Note to Account Memory</div>
                <div className="flex gap-2 mb-2">
                  <select
                    className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                    value={actType}
                    onChange={e => setActType(e.target.value)}
                  >
                    <option value="Note">Note</option>
                    <option value="Call">Phone Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Email">Email</option>
                  </select>
                  <input
                    className="flex-1 p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                    placeholder="Subject..."
                    value={actSubject}
                    onChange={e => setActSubject(e.target.value)}
                  />
                </div>
                <textarea
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 mb-2"
                  rows={2}
                  placeholder="Notes, discussion summary, or next actions..."
                  value={actDesc}
                  onChange={e => setActDesc(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button className="btn secondary" onClick={() => setShowActivityForm(false)}>Cancel</button>
                  <button
                    className="btn primary"
                    disabled={!actSubject.trim() || savingAct}
                    onClick={async () => {
                      if (!actSubject.trim() || !orgId) return;
                      setSavingAct(true);
                      try {
                        await api.createAccountActivity(orgId, {
                          activity_type: actType,
                          subject: actSubject.trim(),
                          description: actDesc.trim() || undefined,
                        });
                        setActSubject('');
                        setActDesc('');
                        setShowActivityForm(false);
                        await fetchLive360(orgId);
                      } catch (err) {
                        console.error('Failed to log activity', err);
                      } finally {
                        setSavingAct(false);
                      }
                    }}
                  >
                    {savingAct ? 'Saving...' : 'Save Activity'}
                  </button>
                </div>
              </div>
            )}
            <div className="c360-unified-timeline">
              {timelineEntries.map(entry => (
                <div className="c360-timeline-item" key={`${entry.entity}-${entry.id}`}>
                  <div className="c360-timeline-marker">
                    {entry.type.includes('Commercial') ? <Target size={14} className="text-blue-600"/> :
                     entry.type.includes('Service') ? <Ticket size={14} className="text-amber-600"/> :
                     entry.type.includes('Fulfilment') ? <ShoppingCart size={14} className="text-emerald-600"/> :
                     <Activity size={14} className="text-cyan-600"/>}
                  </div>
                  <div className="c360-timeline-body">
                    <div className="flex items-center justify-between gap-2">
                      <strong>{entry.title}</strong>
                      <time className="text-xs text-slate-400 font-mono">{shortDate(entry.date)}</time>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{entry.summary}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>Ref: <b>{entry.ref}</b></span>
                      <span>Channel: <b>{entry.channel}</b></span>
                      <button className="link-button ml-auto" onClick={() => onOpenRecord(entry.entity, entry.id)}>
                        Inspect event <ArrowRight size={12}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI INSIGHTS & SENTIMENT TAB */}
        {tab === 'ai' && (
          <div className="c360-ai-grid">
            <section className="panel p-5">
              <div className="panel-heading mb-4">
                <div>
                  <h2>AI Account Synthesis & Next-Best Action</h2>
                  <p>Synthesized continuously by Deal Agent & SDR Agent from CRM memory.</p>
                </div>
                <Sparkles size={18} className="text-cyan-600"/>
              </div>
              <div className="c360-ai-recommendation-box">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-800 uppercase tracking-wide">
                  <Bot size={15}/> Next-Best Action Proposal
                </div>
                <h3 className="font-bold text-slate-800 text-base mt-2">
                  Schedule Q4 Regional Fiber Expansion Review with Marcus Sterling
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Caribbean Fiber Solutions is preparing their municipal trunk lines. Deal win-probability for <b>Spalding Fiber Expansion</b> is currently 65%, with quote QT-2026-00112 awaiting final commercial sign-off. Immediate follow-up can accelerate contract execution before end of quarter.
                </p>
                <div className="c360-ai-evidence mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div><b>Contributing Evidence:</b> High packet-loss case CASE-2026-00318 is under active diagnosis; customer sentiment is concerned. Addressing connectivity promptly preserves renewal trust.</div>
                  <div><b>Policy Guardrail:</b> Commercial Discount Policy v2.1 · Rep limit 5%, Quote has 8% discount pending Manager Approval.</div>
                  <div><b>Confidence Score:</b> 94% (Grounded in 14 historical interactions).</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="btn primary" onClick={() => navigate('/quotes/approvals')}>
                    Review Quote Approval <ArrowRight size={14}/>
                  </button>
                  <button className="btn secondary" onClick={() => navigate('/communications/email', { state: { prefillTo: 'marcus.sterling@example.test' } })}>
                    Draft Executive Email
                  </button>
                </div>
              </div>
            </section>

            <section className="panel p-5">
              <div className="panel-heading mb-4">
                <div>
                  <h2>Predictive Account Health & Churn Risk</h2>
                  <p>Continuous signals from ticket volume, payment velocity and NPS.</p>
                </div>
                <TrendingUp size={18} className="text-emerald-600"/>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">Account Retention Health</span>
                    <b className="text-emerald-700">92 / 100 · Strong</b>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '92%' }}/>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">Predictive Churn Risk</span>
                    <b className="text-emerald-700">1.4% · Low</b>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '1.4%' }}/>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">Expansion Propensity</span>
                    <b className="text-blue-700">78% · High Candidate</b>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '78%' }}/>
                  </div>
                </div>

                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-slate-400"/>
                  <span>All customer memory and predictive scores are calculated locally in the prototype demonstration engine.</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
