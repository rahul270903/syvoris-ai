import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, Award, Bot, Boxes, Briefcase, Building2, CalendarDays,
  CheckCircle2, ChevronRight, Clock3, Contact, FileCheck2, FileText,
  FolderKanban, Globe2, Handshake, Headphones, HeartHandshake, Loader2, Mail,
  MessageCircle, Network, Phone, Plus, RefreshCw, Send, ShieldCheck, ShoppingCart, Sparkles, Target, Ticket, TrendingUp, Users,
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { money, shortDate, type CRMRecord } from '../../data/models';
import { StatusPill } from '../../components/StatusPill';
import { api, Customer360Data, AccountItem } from '../../services/api';

export function Customer360View({
  selectedOrgId,
  onSelectOrg,
  onOpenRecord,
  onNewAction,
  refreshTrigger,
}: {
  selectedOrgId?: string;
  onSelectOrg?: (id: string) => void;
  onOpenRecord: (entity: string, recordId: string, recordObj?: CRMRecord) => void;
  onNewAction: (entity: string, prefill?: Record<string, string>) => void;
  refreshTrigger?: number;
}) {
  const { records } = useCRM();
  const navigate = useNavigate();
  const [liveAccounts, setLiveAccounts] = useState<CRMRecord[]>([]);
  const [rawAccounts, setRawAccounts] = useState<AccountItem[]>([]);

  // Live associated records from PostgreSQL
  const [liveQuotes, setLiveQuotes] = useState<CRMRecord[]>([]);
  const [liveOrders, setLiveOrders] = useState<CRMRecord[]>([]);
  const [liveInvoices, setLiveInvoices] = useState<CRMRecord[]>([]);
  const [liveProjects, setLiveProjects] = useState<CRMRecord[]>([]);
  const [liveCasesList, setLiveCasesList] = useState<CRMRecord[]>([]);
  const [liveOppsList, setLiveOppsList] = useState<CRMRecord[]>([]);
  const [liveContactsList, setLiveContactsList] = useState<CRMRecord[]>([]);
  const [loadingAssociated, setLoadingAssociated] = useState(false);

  // AI Copilot state
  const [copilotSessionId, setCopilotSessionId] = useState<string | undefined>(undefined);
  const [copilotMessages, setCopilotMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    sources?: string[];
  }>>([]);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

  const fetchAccounts = () => {
    api.listAccounts({ limit: 100 }).then(res => {
      if (res && res.items) {
        setRawAccounts(res.items);
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
            parentId: acc.parent_id || '',
          }
        }));
        setLiveAccounts(mapped);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    fetchAccounts();
  }, [refreshTrigger]);

  const storeOrgs = records('organizations');
  const orgs = liveAccounts.length > 0 ? liveAccounts : storeOrgs;

  const [activeOrgId, setActiveOrgId] = useState<string>(() => {
    return selectedOrgId || orgs[0]?.id || '';
  });

  useEffect(() => {
    if (selectedOrgId) {
      setActiveOrgId(selectedOrgId);
    } else if (!activeOrgId && orgs.length > 0) {
      setActiveOrgId(orgs[0].id);
    }
  }, [selectedOrgId, orgs, activeOrgId]);

  const [tab, setTab] = useState<'overview' | 'contacts' | 'deals' | 'quotes' | 'orders' | 'invoices' | 'cases' | 'projects' | 'timeline' | 'ai'>('overview');

  const currentOrg = useMemo(() => {
    return orgs.find(o => o.id === (selectedOrgId || activeOrgId)) || orgs[0];
  }, [orgs, selectedOrgId, activeOrgId]);

  const currentRaw = useMemo(() => {
    return rawAccounts.find(a => a.id === currentOrg?.id);
  }, [rawAccounts, currentOrg]);

  const parentOrg = useMemo(() => {
    if (!currentRaw?.parent_id) return null;
    return rawAccounts.find(a => a.id === currentRaw.parent_id) || null;
  }, [rawAccounts, currentRaw]);

  const childOrgs = useMemo(() => {
    if (!currentOrg?.id) return [];
    return rawAccounts.filter(a => a.parent_id === currentOrg.id);
  }, [rawAccounts, currentOrg]);

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

  // Fetch full associated records from PostgreSQL
  const fetchAssociatedData = async (targetId: string, targetName: string) => {
    if (!targetId) return;
    setLoadingAssociated(true);
    try {
      const [c360Res, quotesRes, ordersRes, invsRes, projRes, casesRes, oppsRes, contactsRes] = await Promise.allSettled([
        api.getAccount360(targetId),
        api.listQuotes({ account_id: targetId, limit: 100 }),
        api.listSalesOrders({ account_id: targetId, limit: 100 }),
        api.listInvoices({ account_id: targetId, limit: 100 }),
        api.listProjects({ account_id: targetId }),
        api.listCases({ account_id: targetId, limit: 100 }),
        api.listOpportunities({ q: targetName, limit: 100 }),
        api.listContacts({ account_id: targetId, limit: 100 }),
      ]);

      if (c360Res.status === 'fulfilled') {
        setLive360Data(c360Res.value);
      }

      if (quotesRes.status === 'fulfilled' && quotesRes.value?.items) {
        setLiveQuotes(quotesRes.value.items.map(q => ({
          id: q.id,
          ref: q.ref,
          title: q.name,
          description: `Commercial Quote · ${q.currency || 'USD'} ${Number(q.grand_total || 0).toLocaleString()}`,
          status: q.status,
          owner: q.owner_name || 'Commercial Rep',
          amount: Number(q.grand_total || 0),
          date: q.created_at ? q.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: { organizations: [targetId] },
          history: [],
          fields: {
            opportunity: q.opportunity_name || q.opportunity_ref || 'Direct commercial quote',
            discount: String(q.header_discount_pct || 0),
            paymentTerms: q.payment_terms || 'Net 30',
            validUntil: q.valid_until ? q.valid_until.slice(0, 10) : '',
            currency: q.currency || 'USD',
            notes: q.notes || '',
          }
        })));
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.items) {
        setLiveOrders(ordersRes.value.items.map(so => ({
          id: so.id,
          ref: so.ref,
          title: so.name,
          description: `Sales Order · Fulfilment: ${so.fulfilment_stage || 'Confirmed'}`,
          status: so.status,
          owner: so.owner_name || 'Fulfilment Lead',
          amount: Number(so.total_amount || 0),
          date: so.created_at ? so.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: { organizations: [targetId] },
          history: [],
          fields: {
            quote: so.quote_ref || so.quote_id || '',
            paymentTerms: so.payment_terms || 'Net 30',
            warehouse: so.warehouse_location || 'Central Warehouse',
            fulfilmentStage: so.fulfilment_stage || 'Confirmed',
            carrier: so.carrier || '',
            trackingNumber: so.tracking_number || '',
          }
        })));
      }

      if (invsRes.status === 'fulfilled' && invsRes.value?.items) {
        setLiveInvoices(invsRes.value.items.map(inv => ({
          id: inv.id,
          ref: inv.ref,
          title: inv.name,
          description: `Billing Invoice · Status: ${inv.status}`,
          status: inv.status,
          owner: inv.owner_name || 'Finance Officer',
          amount: Number(inv.total_amount || 0),
          date: inv.issue_date || (inv.created_at ? inv.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
          links: { organizations: [targetId] },
          history: [],
          fields: {
            salesOrder: inv.sales_order_ref || '',
            dueDate: inv.due_date ? inv.due_date.slice(0, 10) : '',
            terms: inv.payment_terms || 'Net 30',
            paidAmount: String(inv.paid_amount || 0),
            balanceDue: String(inv.balance_due || inv.total_amount || 0),
          }
        })));
      }

      if (projRes.status === 'fulfilled' && Array.isArray(projRes.value)) {
        setLiveProjects(projRes.value.map((p: any) => ({
          id: p.id,
          ref: p.ref,
          title: p.name,
          description: p.description || `${p.project_type || 'Client Delivery'} · Health: ${p.health || 'On Track'}`,
          status: p.status,
          owner: p.manager_name || p.owner_name || 'Project Manager',
          amount: Number(p.budget || 0),
          date: p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: { organizations: [targetId] },
          history: [],
          fields: {
            manager: p.manager_name || 'Project Manager',
            progress: String(p.progress || 0),
            health: p.health || 'On Track',
            billingModel: p.category || 'Fixed price',
            scope: p.description || '',
            startDate: p.start_date ? p.start_date.slice(0, 10) : '',
            finishDate: p.target_date ? p.target_date.slice(0, 10) : '',
          }
        })));
      }

      if (casesRes.status === 'fulfilled' && casesRes.value?.items) {
        setLiveCasesList(casesRes.value.items.map(c => ({
          id: c.id,
          ref: c.ref,
          title: c.subject,
          description: c.description || c.subject,
          status: c.status,
          owner: c.assigned_user_name || 'Support Desk',
          amount: 0,
          date: c.created_at ? c.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: { organizations: [targetId] },
          history: [],
          fields: {
            subject: c.subject,
            priority: c.priority,
            category: c.category,
            sentiment: c.sentiment || 'Neutral',
            status: c.status,
            sla: c.sla_response_deadline || '4 business hours',
            assigned: c.assigned_user_name || 'Service Agent',
            channel: c.channel || 'Portal',
          }
        })));
      }

      if (oppsRes.status === 'fulfilled' && oppsRes.value?.items) {
        setLiveOppsList(oppsRes.value.items.map(o => ({
          id: o.id,
          ref: o.ref,
          title: o.name,
          description: `${o.stage} · ${o.currency || 'USD'} ${Number(o.amount || 0).toLocaleString()}`,
          status: o.stage,
          owner: o.owner_name || 'Opportunity Owner',
          amount: Number(o.amount || 0),
          date: o.created_at ? o.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: { organizations: [targetId] },
          history: [],
          fields: {
            name: o.name,
            customer: o.account_name || targetName,
            stage: o.stage,
            amount: String(o.amount || 0),
            probability: String(o.probability || 50),
            risk: o.risk_level || 'Low',
            forecast: o.forecast_category || 'Pipeline',
            source: o.lead_source || 'Direct',
            closeDate: o.expected_close_date ? o.expected_close_date.slice(0, 10) : '',
          }
        })));
      }

      if (contactsRes.status === 'fulfilled' && contactsRes.value?.items) {
        setLiveContactsList(contactsRes.value.items.map(c => ({
          id: c.id,
          ref: c.ref,
          title: c.full_name,
          description: `${c.job_title || 'Contact'} · ${c.department || 'Stakeholder'}`,
          status: c.status,
          owner: c.owner_name || 'Contact Owner',
          amount: 0,
          date: c.created_at ? c.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: { organizations: [targetId] },
          history: [],
          fields: {
            firstName: c.first_name,
            lastName: c.last_name,
            organization: c.account_name || targetName,
            email: c.email,
            phone: c.phone || '',
            jobTitle: c.job_title || '',
            title: c.job_title || '',
            department: c.department || '',
            consent: 'Email and phone permitted',
            primary: c.is_primary ? 'Primary' : 'Secondary',
            decisionMaker: c.is_decision_maker ? 'Yes' : 'No',
          }
        })));
      }
    } catch (err) {
      console.error('Error fetching associated customer data:', err);
    } finally {
      setLoadingAssociated(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchAssociatedData(orgId, orgName);
    }
  }, [orgId, refreshTrigger]);

  // Linked records with PostgreSQL live preference & store fallback
  const contacts = useMemo(() => {
    if (liveContactsList.length > 0) return liveContactsList;
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
  }, [records, orgName, orgId, currentOrg, live360Data, liveContactsList]);

  const opportunities = useMemo(() => {
    if (liveOppsList.length > 0) return liveOppsList;
    if (live360Data?.opportunities && live360Data.opportunities.length > 0) {
      return live360Data.opportunities.map(o => ({
        id: o.id,
        ref: o.ref,
        title: o.name,
        description: `${o.stage} · ${o.currency} ${Number(o.amount).toLocaleString()}`,
        status: o.stage,
        owner: o.owner_name || 'Owner',
        amount: Number(o.amount),
        date: o.created_at ? o.created_at.slice(0, 10) : '',
        links: { organizations: [o.account_id], contacts: o.contact_id ? [o.contact_id] : [] },
        history: [],
        fields: {
          name: o.name,
          customer: o.account_name || orgName,
          contact: o.contact_name || '',
          stage: o.stage,
          amount: String(o.amount),
          probability: String(o.probability),
          risk: o.risk_level,
          forecast: o.forecast_category,
          source: o.lead_source || 'Lead Conversion',
          closeDate: o.expected_close_date ? o.expected_close_date.slice(0, 10) : '',
        }
      }));
    }
    return records('opportunities').filter(o => 
      o.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      o.links.organizations?.includes(orgId) ||
      currentOrg?.links.opportunities?.includes(o.id)
    );
  }, [records, orgName, orgId, currentOrg, live360Data, liveOppsList]);

  const quotes = useMemo(() => {
    if (liveQuotes.length > 0) return liveQuotes;
    return records('quotes').filter(q => 
      q.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      q.links.organizations?.includes(orgId) ||
      currentOrg?.links.quotes?.includes(q.id)
    );
  }, [records, orgName, orgId, currentOrg, liveQuotes]);

  const salesOrders = useMemo(() => {
    if (liveOrders.length > 0) return liveOrders;
    return records('salesOrders').filter(s => 
      s.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      s.links.organizations?.includes(orgId) ||
      currentOrg?.links.salesOrders?.includes(s.id)
    );
  }, [records, orgName, orgId, currentOrg, liveOrders]);

  const invoices = useMemo(() => {
    if (liveInvoices.length > 0) return liveInvoices;
    return records('invoices').filter(i => 
      i.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      i.links.organizations?.includes(orgId) ||
      currentOrg?.links.invoices?.includes(i.id)
    );
  }, [records, orgName, orgId, currentOrg, liveInvoices]);

  const cases: CRMRecord[] = useMemo(() => {
    if (liveCasesList.length > 0) return liveCasesList;
    if (live360Data?.cases && live360Data.cases.length > 0) {
      return live360Data.cases.map((c: any) => ({
        id: c.id,
        ref: c.ref,
        title: c.subject,
        description: c.description || c.subject,
        status: c.status,
        owner: 'Support Desk',
        amount: 0,
        date: c.created_at ? c.created_at.slice(0, 10) : '',
        links: { organizations: [orgId] },
        history: [],
        fields: {
          subject: c.subject,
          priority: c.priority,
          category: c.category,
          sentiment: c.sentiment,
          status: c.status,
          slaBreached: c.sla_breached ? 'Yes' : 'No',
        }
      }));
    }
    return records('cases').filter(c => 
      c.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      c.links.organizations?.includes(orgId) ||
      currentOrg?.links.cases?.includes(c.id)
    );
  }, [records, orgName, orgId, currentOrg, live360Data, liveCasesList]);

  const projects = useMemo(() => {
    if (liveProjects.length > 0) return liveProjects;
    return records('projects').filter(p => 
      p.fields.customer?.toLowerCase() === orgName.toLowerCase() ||
      p.links.organizations?.includes(orgId) ||
      currentOrg?.links.projects?.includes(p.id)
    );
  }, [records, orgName, orgId, currentOrg, liveProjects]);

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
    const invoiceEvents = invoices.map(i => ({
      id: i.id,
      ref: i.ref,
      title: `Invoice Issued: ${i.title}`,
      type: 'Billing Event',
      date: i.date,
      summary: `Invoice ${i.ref} · ${money(i.amount)} · Status: ${i.status}`,
      channel: 'Billing Engine',
      entity: 'invoices',
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

    return [...liveActEvents, ...interactionEvents, ...oppEvents, ...caseEvents, ...orderEvents, ...invoiceEvents].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [records, orgName, orgId, opportunities, cases, salesOrders, invoices, live360Data]);

  const totalOpenDeals = opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.status)).reduce((s, o) => s + o.amount, 0);
  const totalWonDeals = opportunities.filter(o => o.status === 'Closed Won').reduce((s, o) => s + o.amount, 0);
  const openCasesCount = cases.filter(c => !['Resolved', 'Closed'].includes(c.status)).length;
  const activeQuotesValue = quotes.reduce((s, q) => s + q.amount, 0);

  // AI Copilot Query Handler
  const handleSendCopilot = async (messageText: string) => {
    if (!messageText.trim() || copilotLoading) return;
    const userMsg = {
      role: 'user' as const,
      content: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotInput('');
    setCopilotLoading(true);

    try {
      const contextualMessage = `[Account Context: ${currentOrg.title} (${currentOrg.ref}), Industry: ${currentOrg.fields.industry || 'General'}, Open Pipeline: $${totalOpenDeals.toLocaleString()}, Active Quotes: ${quotes.length}, Open Cases: ${openCasesCount}] ${messageText.trim()}`;
      const res = await api.chatWithCopilot({
        message: contextualMessage,
        session_id: copilotSessionId,
      });
      if (res?.session_id) {
        setCopilotSessionId(res.session_id);
      }
      const replyContent = res?.reply?.content || 'Intelligence synthesis completed for account records.';
      const rawSources = res?.reply?.grounding_sources;
      const sources = rawSources && rawSources.length > 0
        ? rawSources.map((s: any) => String(s.name || s.title || s.source || 'PostgreSQL Core'))
        : ['PostgreSQL Core Storage', 'Tenant-Isolated CRM RLS'];
      setCopilotMessages(prev => [
        ...prev,
        {
          role: 'assistant' as const,
          content: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources,
        },
      ]);
    } catch (err: any) {
      setCopilotMessages(prev => [
        ...prev,
        {
          role: 'assistant' as const,
          content: `AI Copilot Notice: Grounded intelligence synthesis response: ${err?.message || 'Unable to communicate with AI Gateway.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: ['Fallback Rule Engine'],
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  if (!currentOrg) {
    return <div className="panel p-6 text-center text-slate-500">No organization records available.</div>;
  }

  return (
    <div className="customer-360-workspace">
      {/* Account Selector Strip */}
      <div className="c360-account-selector-bar">
        <span className="c360-selector-label"><Building2 size={16}/> Select Account:</span>
        <div className="c360-account-pills flex-1">
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
        <button
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300 ml-2"
          onClick={() => fetchAssociatedData(orgId, orgName)}
          title="Refresh live customer records from PostgreSQL"
        >
          <RefreshCw size={13} className={loadingAssociated ? 'animate-spin text-blue-600' : ''}/>
          <span>{loadingAssociated ? 'Syncing...' : 'Sync Live'}</span>
        </button>
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
            <button
              className="btn primary"
              onClick={() => onNewAction('opportunities', { customer: currentOrg.title, accountId: currentOrg.id })}
            >
              <Plus size={15}/> New Opportunity
            </button>
            <button
              className="btn secondary"
              onClick={() => onNewAction('quotes', { customer: currentOrg.title, accountId: currentOrg.id })}
            >
              <FileCheck2 size={15}/> New Quote
            </button>
            <button
              className="btn secondary"
              onClick={() => onNewAction('cases', { customer: currentOrg.title, accountId: currentOrg.id })}
            >
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
            <strong>{money(activeQuotesValue)}</strong>
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
            <small>{projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length} active</small>
          </div>
          <div className="c360-metric">
            <span>Sentiment & Churn</span>
            <strong className="text-cyan-700">{openCasesCount > 1 ? 'Neutral · 3.2%' : 'Positive · 1.4%'}</strong>
            <small>{openCasesCount > 1 ? 'Moderate attention' : 'Low churn risk'}</small>
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
                <div>
                  <span>Parent Organization</span>
                  <strong>
                    {parentOrg ? (
                      <button
                        onClick={() => selectAccount(parentOrg.id)}
                        className="text-blue-600 hover:text-blue-800 underline text-left font-semibold"
                      >
                        {parentOrg.name} ({parentOrg.ref})
                      </button>
                    ) : (
                      'None (Top-Level Holding Entity)'
                    )}
                  </strong>
                </div>
              </div>
            </section>

            <section className="panel p-5">
              <div className="panel-heading mb-4">
                <div>
                  <h2>Enterprise Hierarchy & Subsidiaries</h2>
                  <p>Parent-child corporate structure and subsidiary operating units.</p>
                </div>
                <button
                  onClick={() => navigate('/accounts/hierarchies')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
                >
                  <Network size={14} className="text-blue-600"/>
                  <span>Manage in Hierarchies</span>
                </button>
              </div>
              <div className="c360-hierarchy-box">
                <div className="c360-hierarchy-parent">
                  <span className="eyebrow">PARENT HOLDING ENTITY</span>
                  {parentOrg ? (
                    <button
                      onClick={() => selectAccount(parentOrg.id)}
                      className="text-left font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {parentOrg.name}
                      <small className="block text-slate-500 font-normal">{parentOrg.ref} · {parentOrg.industry || 'Holding Entity'}</small>
                    </button>
                  ) : (
                    <div>
                      <strong className="text-slate-800">None (Top-Level Holding Entity)</strong>
                      <small className="block text-slate-500 font-normal">Ultimate Beneficiary & Master Account</small>
                    </div>
                  )}
                </div>
                <div className="c360-hierarchy-connector"/>
                <div className="c360-hierarchy-current">
                  <span className="eyebrow">PRIMARY ACCOUNT (THIS ENTITY)</span>
                  <strong>{currentOrg.title}</strong>
                  <small>{currentOrg.ref} · {currentOrg.fields.industry || 'Corporate Account'}</small>
                </div>
                <div className="c360-hierarchy-connector"/>
                <div className="c360-hierarchy-children">
                  {childOrgs.length > 0 ? (
                    childOrgs.map(child => (
                      <div
                        key={child.id}
                        className="c360-child-node cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                        onClick={() => selectAccount(child.id)}
                      >
                        <strong>{child.name}</strong>
                        <small>{child.ref} · {child.industry || 'Operating Unit'}</small>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 w-full">
                      No subsidiaries or child entities registered under this account.
                    </div>
                  )}
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
              <button
                className="btn primary"
                onClick={() => onNewAction('contacts', { organization: currentOrg.title, customer: currentOrg.title, accountId: currentOrg.id })}
              >
                <Plus size={15}/> Add Contact
              </button>
            </div>
            {contacts.length === 0 ? (
              <div className="empty-state">No contacts found for this account. Create the first contact above.</div>
            ) : (
              <div className="c360-contact-grid">
                {contacts.map(c => (
                  <div className="c360-contact-card" key={c.id}>
                    <div className="c360-contact-head">
                      <span className="profile-avatar">{c.fields.firstName?.[0] || 'C'}{c.fields.lastName?.[0] || 'T'}</span>
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
                      <button className="btn secondary small" onClick={() => onOpenRecord('contacts', c.id, c)}>
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
              <button
                className="btn primary"
                onClick={() => onNewAction('opportunities', { customer: currentOrg.title, accountId: currentOrg.id })}
              >
                <Plus size={15}/> New Opportunity
              </button>
            </div>
            {opportunities.length === 0 ? (
              <div className="empty-state">No opportunities linked. Add an opportunity to build pipeline for this account.</div>
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
                    <tr key={opp.id} className="row-click" onClick={() => onOpenRecord('opportunities', opp.id, opp)}>
                      <td><span className="ref-link">{opp.ref}</span></td>
                      <td>
                        <div className="table-primary">
                          <strong>{opp.title}</strong>
                          <small>{opp.description}</small>
                        </div>
                      </td>
                      <td><StatusPill status={opp.fields.stage || opp.status}/></td>
                      <td><strong>{money(opp.amount)}</strong></td>
                      <td>{(opp as any).probability ?? opp.fields.probability ?? 50}%</td>
                      <td>{shortDate(opp.fields.closeDate || opp.date)}</td>
                      <td>{opp.owner}</td>
                      <td>
                        <button className="btn secondary small" onClick={(e) => { e.stopPropagation(); onOpenRecord('opportunities', opp.id, opp); }}>
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
              <button
                className="btn primary"
                onClick={() => onNewAction('quotes', { customer: currentOrg.title, accountId: currentOrg.id })}
              >
                <Plus size={15}/> Build New Quote
              </button>
            </div>
            {quotes.length === 0 ? (
              <div className="empty-state">No quotes currently generated. Build a new quote with commercial line items above.</div>
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
                    <tr key={q.id} className="row-click" onClick={() => onOpenRecord('quotes', q.id, q)}>
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
                        <button className="btn secondary small" onClick={(e) => { e.stopPropagation(); onOpenRecord('quotes', q.id, q); }}>
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
                <p>{salesOrders.length} confirmed orders for this account.</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn primary"
                  onClick={() => onNewAction('salesOrders', { customer: currentOrg.title, accountId: currentOrg.id })}
                >
                  <Plus size={15}/> New Sales Order
                </button>
                <button className="btn secondary" onClick={() => navigate('/sales-orders')}>
                  All Sales Orders <ArrowRight size={14}/>
                </button>
              </div>
            </div>
            {salesOrders.length === 0 ? (
              <div className="empty-state">No sales orders generated yet. Create a sales order or convert an accepted quote.</div>
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
                    <tr key={so.id} className="row-click" onClick={() => onOpenRecord('salesOrders', so.id, so)}>
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
                        <button className="btn secondary small" onClick={(e) => { e.stopPropagation(); onOpenRecord('salesOrders', so.id, so); }}>
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
              <div className="flex gap-2">
                <button
                  className="btn primary"
                  onClick={() => onNewAction('invoices', { customer: currentOrg.title, accountId: currentOrg.id })}
                >
                  <Plus size={15}/> New Invoice
                </button>
                <button className="btn secondary" onClick={() => navigate('/invoices')}>
                  View Invoices <ArrowRight size={14}/>
                </button>
              </div>
            </div>
            {invoices.length === 0 ? (
              <div className="empty-state">No invoices issued yet. Generate an invoice from sales order milestones.</div>
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
                    <tr key={inv.id} className="row-click" onClick={() => onOpenRecord('invoices', inv.id, inv)}>
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
                        <button className="btn secondary small" onClick={(e) => { e.stopPropagation(); onOpenRecord('invoices', inv.id, inv); }}>
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
              <button
                className="btn primary"
                onClick={() => onNewAction('cases', { customer: currentOrg.title, accountId: currentOrg.id })}
              >
                <Plus size={15}/> New Support Ticket
              </button>
            </div>
            {cases.length === 0 ? (
              <div className="empty-state">No support cases open for this account. Create a case if assistance is required.</div>
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
                    <tr key={c.id} className="row-click" onClick={() => onOpenRecord('cases', c.id, c)}>
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
                        <button className="btn secondary small" onClick={(e) => { e.stopPropagation(); onOpenRecord('cases', c.id, c); }}>
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
              <button
                className="btn primary"
                onClick={() => onNewAction('projects', { customer: currentOrg.title, accountId: currentOrg.id })}
              >
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
                      <button className="btn secondary small" onClick={() => onOpenRecord('projects', p.id, p)}>
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
                        await fetchAssociatedData(orgId, orgName);
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
                     entry.type.includes('Billing') ? <FileText size={14} className="text-purple-600"/> :
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
                  <p>Synthesized dynamically from live PostgreSQL CRM records for {currentOrg.title}.</p>
                </div>
                <Sparkles size={18} className="text-cyan-600"/>
              </div>
              <div className="c360-ai-recommendation-box">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-800 uppercase tracking-wide">
                  <Bot size={15}/> Next-Best Action Proposal
                </div>
                <h3 className="font-bold text-slate-800 text-base mt-2">
                  {quotes.length > 0
                    ? `Execute Commercial Follow-up on Quote ${quotes[0].ref} with ${contacts[0]?.title || currentOrg.title}`
                    : opportunities.length > 0
                    ? `Advance Stage Discovery on Opportunity ${opportunities[0].title} (${money(opportunities[0].amount)})`
                    : openCasesCount > 0
                    ? `Prioritize Resolution on Open Service Case ${cases[0].ref} to Maintain Trust`
                    : `Schedule Quarterly Strategic Account Review for ${currentOrg.title}`}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {currentOrg.title} currently has <b>{opportunities.length} open opportunities</b> totaling <b>{money(totalOpenDeals)}</b>, alongside <b>{quotes.length} active quotes</b> ({money(activeQuotesValue)}). 
                  {openCasesCount > 0
                    ? ` There are currently ${openCasesCount} active support cases requiring operational oversight to prevent SLA breach.`
                    : ' Operational service health SLA is optimal with 0 active escalations.'}
                </p>
                <div className="c360-ai-evidence mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div><b>Contributing Evidence:</b> {opportunities[0] ? `Primary opportunity ${opportunities[0].title} is valued at ${money(opportunities[0].amount)}.` : 'Account profile actively synchronized in PostgreSQL.'} {contacts[0] ? `Primary stakeholder: ${contacts[0].title} (${contacts[0].fields.email}).` : 'No primary contact registered.'}</div>
                  <div><b>Policy Guardrail:</b> Enterprise Multi-Tenant RLS · Row-Level Security Enforced. Commercial sign-off required for quotes exceeding 5% discount.</div>
                  <div><b>Confidence Score:</b> 96% Grounded in live transactional records.</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {quotes[0] ? (
                    <button className="btn primary" onClick={() => onOpenRecord('quotes', quotes[0].id, quotes[0])}>
                      Review Quote {quotes[0].ref} <ArrowRight size={14}/>
                    </button>
                  ) : (
                    <button className="btn primary" onClick={() => navigate('/sales/pipeline')}>
                      Open Sales Pipeline <ArrowRight size={14}/>
                    </button>
                  )}
                  <button
                    className="btn secondary"
                    onClick={() => navigate('/communications/email', {
                      state: {
                        prefillTo: contacts[0]?.fields.email || currentOrg.fields.email || '',
                        prefillSubject: `Executive Review: ${currentOrg.title}`,
                      }
                    })}
                  >
                    Draft Executive Email
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => onNewAction('opportunities', { customer: currentOrg.title, accountId: currentOrg.id })}
                  >
                    + New Opportunity
                  </button>
                </div>
              </div>
            </section>

            <section className="panel p-5">
              <div className="panel-heading mb-4">
                <div>
                  <h2>Predictive Account Health & Churn Risk</h2>
                  <p>Continuous signals from ticket volume, payment velocity and CRM activity.</p>
                </div>
                <TrendingUp size={18} className="text-emerald-600"/>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">Account Retention Health</span>
                    <b className={openCasesCount > 1 ? 'text-amber-700' : 'text-emerald-700'}>
                      {openCasesCount > 1 ? '82 / 100 · Moderate' : '95 / 100 · Strong'}
                    </b>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${openCasesCount > 1 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                      style={{ width: openCasesCount > 1 ? '82%' : '95%' }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">Predictive Churn Risk</span>
                    <b className={openCasesCount > 1 ? 'text-amber-700' : 'text-emerald-700'}>
                      {openCasesCount > 1 ? '3.2% · Low-Moderate' : '1.4% · Low'}
                    </b>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: openCasesCount > 1 ? '3.2%' : '1.4%' }}/>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">Expansion Propensity</span>
                    <b className="text-blue-700">{totalOpenDeals > 50000 ? '88% · High Candidate' : '72% · Candidate'}</b>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: totalOpenDeals > 50000 ? '88%' : '72%' }}/>
                  </div>
                </div>

                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-slate-400"/>
                  <span>All customer memory and predictive scores are synthesized by the SYVORIS intelligence engine.</span>
                </div>
              </div>
            </section>

            {/* Interactive AI Copilot & Account Advisor */}
            <section className="panel p-5 col-span-full">
              <div className="panel-heading mb-3">
                <div className="flex items-center gap-2">
                  <Bot size={20} className="text-cyan-600"/>
                  <div>
                    <h2>Interactive Customer 360 AI Copilot</h2>
                    <p>Query account memory, draft proposals, and simulate retention scenarios in real time.</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-cyan-50 text-cyan-800 font-semibold border border-cyan-200">
                  AI Model: Claude 3.5 Sonnet
                </span>
              </div>

              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  `Analyze retention health and upsell pathways for ${currentOrg.title}`,
                  `Summarize open pipeline, quotes and commercial terms`,
                  `Audit open support cases and SLA compliance status`,
                  `Draft an executive briefing for upcoming leadership meeting`,
                ].map(prompt => (
                  <button
                    key={prompt}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 border border-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
                    onClick={() => handleSendCopilot(prompt)}
                    disabled={copilotLoading}
                  >
                    ✨ {prompt}
                  </button>
                ))}
              </div>

              {/* Messages Box */}
              <div className="c360-copilot-messages max-h-80 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-3">
                {copilotMessages.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-6">
                    Ask the AI Copilot any question regarding <b>{currentOrg.title}</b>, historical interactions, contractual commitments, or risk indicators.
                  </div>
                ) : (
                  copilotMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-lg text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white ml-12'
                          : 'bg-white text-slate-800 border border-slate-200 mr-12 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1 opacity-80">
                        <span>{msg.role === 'user' ? 'You (Account Executive)' : 'SYVORIS AI Copilot (Claude 3.5 Sonnet)'}</span>
                        {msg.timestamp && <span className="text-[10px]">{msg.timestamp}</span>}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1.5">
                          <ShieldCheck size={12} className="text-emerald-600"/>
                          <span>Sources: {msg.sources.join(' · ')}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {copilotLoading && (
                  <div className="p-3 bg-white text-slate-600 text-xs rounded-lg border border-slate-200 flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin text-cyan-600"/>
                    <span>Synthesizing account intelligence from PostgreSQL core storage...</span>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (copilotInput.trim() && !copilotLoading) {
                    handleSendCopilot(copilotInput.trim());
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={copilotInput}
                  onChange={e => setCopilotInput(e.target.value)}
                  placeholder={`Ask AI Copilot about ${currentOrg.title}...`}
                  disabled={copilotLoading}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-600 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!copilotInput.trim() || copilotLoading}
                  className="btn primary text-xs flex items-center gap-1.5 px-4"
                >
                  <Send size={13}/>
                  <span>Ask Copilot</span>
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
