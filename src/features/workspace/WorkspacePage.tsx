import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, Award, BadgeCheck, BarChart3, Boxes, Briefcase, Building2,
  CalendarDays, Check, ChevronDown, CircleDollarSign, ClipboardCheck, Clock3,
  Contact, Copy, FileCheck2, FilePlus2, FileSpreadsheet, FileText, FolderKanban,
  Gauge, Globe2, Handshake, Headphones, HeartHandshake, Mail, MessageCircle,
  Network, PackageCheck, Phone, PieChart, Plus, Search, Send, Settings,
  ShieldAlert, ShieldCheck, ShoppingCart, Sparkles, Target, Ticket, Trash2, Truck, User, Users, X
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { makeId, money, shortDate, type CRMRecord, type LineItem } from '../../data/models';
import { getWorkspaceConfig } from './config';
import type { FieldDef } from './types';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { EmptyState } from '../../components/EmptyState';
import { Customer360View } from './Customer360View';
import { LeadConversionModal } from './LeadConversionModal';
import { CommunicationModal, type CommType } from './CommunicationModal';
import { UnifiedInboxView } from './UnifiedInboxView';
import { CalendarView } from './CalendarView';
import { ApprovalsView } from './ApprovalsView';
import { SalesLeaderboardView } from './SalesLeaderboardView';
import { QuoteDocumentView } from './QuoteDocumentView';
import { OrderFulfilmentView } from './OrderFulfilmentView';
import { CustomerPortalView } from './CustomerPortalView';
import { RadiumConnectorView } from './RadiumConnectorView';
import { WorkflowDesignerView } from './WorkflowDesignerView';
import { AuditTrailView } from './AuditTrailView';

type Props = { item: { path: string; label: string; description: string; entity: string; category: string; icon: any } };

const pipelineStages = ['New Opportunity', 'Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const nextStage = (s: string) => ({ 'New Opportunity': 'Qualification', 'Qualification': 'Discovery', 'Discovery': 'Proposal', 'Proposal': 'Negotiation', 'Negotiation': 'Closed Won' }[s] || 'Closed Won');
const initialLine = (): LineItem => ({ id: makeId(), name: '24-core OS2 fiber cable', sku: 'FBR-24C-OS2', quantity: 1, unitPrice: 18, discount: 0, taxRate: 0, total: 18 });
const computeLine = (l: LineItem) => {
  const gross = l.quantity * l.unitPrice;
  const discounted = gross * (1 - (l.discount || 0) / 100);
  return { ...l, total: discounted * (1 + (l.taxRate || 0) / 100) };
};

function fieldsForRecord(record: CRMRecord) {
  return Object.entries(record.fields)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => ({ label: k.replace(/([A-Z])/g, ' $1').replace(/^./, x => x.toUpperCase()), value: v }));
}

export function WorkspacePage({ item }: Props) {
  const config = getWorkspaceConfig(item);
  const { data, records, create, update, remove, findByRef, addAudit, addEvent } = useCRM();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<LineItem[]>([initialLine()]);
  const [toast, setToast] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Advanced Modals
  const [convertingLead, setConvertingLead] = useState<CRMRecord | null>(null);
  const [activeComm, setActiveComm] = useState<CommType | null>(null);
  const [commPrefill, setCommPrefill] = useState<{ to?: string; contact?: string }>({});

  useEffect(() => {
    const state = location.state as { openRecordId?: string } | null;
    if (state?.openRecordId) {
      setSelectedId(state.openRecordId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.key]);

  const rows = records(config.entity);
  const statusOptions = useMemo(() => [...new Set(rows.map(r => r.status))], [rows]);
  const filtered = useMemo(() => {
    return rows.filter(r =>
      (status === 'All statuses' || r.status === status) &&
      [r.ref, r.title, r.owner, r.description, ...Object.values(r.fields)].join(' ').toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, status, query]);

  const selected = rows.find(r => r.id === selectedId) || null;
  const Icon = item.icon;

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter(r => ['Pending Approval', 'Pending', 'Review'].includes(r.status)).length,
    value: rows.reduce((s, r) => s + (r.amount || 0), 0),
    active: rows.filter(r => ['Active', 'In Progress', 'Open', 'Qualified', 'Proposal', 'Negotiation'].includes(r.status)).length,
  }), [rows]);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const openNew = (prefill: Record<string, string> = {}) => {
    setEditingId(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      currency: 'USD',
      owner: 'Demo User',
      ...prefill,
    });
    setLines([initialLine()]);
    setModal(true);
  };

  const openEdit = (record: CRMRecord) => {
    setEditingId(record.id);
    setForm({ ...record.fields });
    setLines(record.lineItems?.length ? record.lineItems : [initialLine()]);
    setSelectedId(null);
    setModal(true);
  };

  const isCommercial = ['quotes', 'salesOrders', 'purchaseOrders'].includes(config.entity);
  const lineTotal = lines.map(computeLine).reduce((s, l) => s + l.total, 0);

  const saveRecord = (submit: boolean) => {
    const missing = config.fields.find(f => f.required && !String(form[f.key] || '').trim());
    if (missing) {
      notify(`${missing.label} is required.`);
      return;
    }
    if (
      isCommercial &&
      (!lines.length ||
        lines.some(
          line =>
            !Number.isFinite(line.quantity) ||
            line.quantity <= 0 ||
            !Number.isFinite(line.unitPrice) ||
            line.unitPrice < 0 ||
            line.discount < 0 ||
            line.discount > 100 ||
            line.taxRate < 0
        ))
    ) {
      notify('Check each commercial line: quantity must be positive, price and tax non-negative, and discount between 0 and 100%.');
      return;
    }

    const amount = isCommercial ? lineTotal : Number(form.amount || form.value || form.budget || form.creditLimit || 0) || 0;
    const fields = { ...form };
    if (config.entity === 'leads' && fields.score) fields.score = String(Math.min(100, Math.max(0, Number(fields.score))));

    const statusValue = submit ? 'Pending Approval' : editingId ? rows.find(r => r.id === editingId)?.status || 'Draft' : 'Draft';
    const options = { status: statusValue, amount, lineItems: isCommercial ? lines.map(computeLine) : undefined };

    if (editingId) {
      update(
        config.entity,
        editingId,
        {
          title: fields.name || fields.account || fields.subject || fields.company || item.label,
          fields,
          amount,
          lineItems: options.lineItems,
          status: statusValue,
        },
        submit ? 'Draft submitted for approval' : 'Draft updated'
      );
      notify(submit ? 'Record submitted for approval.' : 'Record updated.');
    } else {
      const record = create(config.entity, fields, options);
      if (submit) {
        update(config.entity, record.id, { status: 'Pending Approval' }, 'Submitted for approval');
        if (config.entity === 'quotes') {
          // Add approval decision record
          create('decisions', {
            name: `Quote Approval: ${record.title}`,
            agent: 'Quote Agent',
            action: `Approve Quote ${record.ref} for ${money(record.amount)}`,
            reason: Number(form.discount || 0) > 5 ? `Quote discount (${form.discount}%) exceeds standard 5% threshold` : 'Standard managerial sign-off requirement',
            evidence: `Quote ${record.ref} · Total: ${money(record.amount)} · Customer: ${record.fields.customer}`,
            policy: 'Commercial Discount Policy v2.1',
            confidence: '0.94',
            status: 'Pending Approval',
          }, { status: 'Pending Approval', links: { quotes: [record.id] } });
        }
      }
      notify(submit ? 'Record submitted for approval.' : 'Record saved as draft.');
    }
    setModal(false);
    setEditingId(null);
  };

  const transition = (record: CRMRecord, newStatus: string, action?: string) => {
    update(
      config.entity,
      record.id,
      { status: newStatus, ...(config.entity === 'opportunities' ? { fields: { stage: newStatus } } : {}) },
      action || `Status changed to ${newStatus}`
    );
    notify(`${record.ref} moved to ${newStatus}.`);
  };

  const createQuoteFromOpportunity = (opp: CRMRecord) => {
    const catalogueService = records('services')[0];
    const catalogueProduct = records('products')[0];
    const catalogue = catalogueService || catalogueProduct;
    const negotiatedAmount = opp.amount;

    const quote = create(
      'quotes',
      {
        name: `${opp.title} · Commercial Quote`,
        customer: opp.fields.customer || opp.title,
        opportunity: opp.ref,
        validUntil: '',
        currency: opp.fields.currency || 'USD',
        discount: '8',
        tax: '0',
        paymentTerms: 'Net 30',
        notes: `Commercial quote generated from ${opp.ref}. Includes 8% volume incentive.`,
      },
      {
        status: 'Draft',
        amount: negotiatedAmount,
        links: { opportunities: [opp.id], organizations: opp.links.organizations || [] },
        lineItems: [
          {
            id: makeId(),
            productId: catalogue?.id,
            name: catalogue?.title || 'Fiber connectivity package',
            sku: catalogue?.fields.sku || 'FBR-24C-OS2',
            quantity: 1,
            unitPrice: negotiatedAmount,
            discount: 8,
            taxRate: 0,
            total: negotiatedAmount * 0.92,
          },
        ],
      }
    );

    update('opportunities', opp.id, { links: { quotes: [...new Set([...(opp.links.quotes || []), quote.id])] } }, 'Draft quote linked to opportunity');
    notify(`Draft quote ${quote.ref} created from ${opp.ref}.`);
    navigate('/quotes');
    setSelectedId(null);
  };

  const convertQuote = (quote: CRMRecord) => {
    const order = create(
      'salesOrders',
      {
        name: `${quote.title} · Sales Order`,
        customer: quote.fields.customer || quote.title,
        quote: quote.ref,
        requestedDate: '',
        warehouse: 'Kingston Central Logistics Hub',
        paymentTerms: quote.fields.paymentTerms || 'Net 30',
        notes: 'Sales order confirmed from accepted quote.',
      },
      {
        status: 'Confirmed',
        amount: quote.amount,
        lineItems: quote.lineItems,
        links: { quotes: [quote.id], organizations: quote.links.organizations || [], opportunities: quote.links.opportunities || [] },
      }
    );

    update(
      'quotes',
      quote.id,
      { status: 'Accepted', fields: { acceptedDate: new Date().toISOString().slice(0, 10), salesOrderRef: order.ref }, links: { salesOrders: [order.id] } },
      'Quote accepted and converted to sales order'
    );

    for (const oppId of quote.links.opportunities || []) {
      const opp = records('opportunities').find(x => x.id === oppId);
      if (opp) update('opportunities', opp.id, { links: { salesOrders: [...new Set([...(opp.links.salesOrders || []), order.id])] } }, 'Sales order linked');
    }

    notify(`Sales order ${order.ref} created from accepted quote.`);
    navigate('/sales-orders');
    setSelectedId(null);
  };

  const createProjectFromOpportunity = (opp: CRMRecord) => {
    const project = create(
      'projects',
      {
        name: `${opp.title} · Implementation`,
        customer: opp.fields.customer || opp.title,
        manager: 'D. Foster',
        startDate: new Date().toISOString().slice(0, 10),
        finishDate: opp.fields.closeDate || '',
        budget: String(opp.amount),
        billingModel: 'Milestone',
        progress: '15',
        health: 'On Track',
        opportunity: opp.ref,
        scope: opp.description,
      },
      { status: 'Active', amount: opp.amount, links: { opportunities: [opp.id], organizations: opp.links.organizations || [] } }
    );

    update('opportunities', opp.id, { fields: { projectRef: project.ref }, links: { projects: [project.id] } }, 'Project handoff initiated');
    notify(`Project ${project.ref} created from closed-won deal.`);
    navigate('/projects');
    setSelectedId(null);
  };

  const runAction = (record: CRMRecord, action: string) => {
    if (config.entity === 'leads') {
      if (action === 'Qualify Lead') {
        transition(record, 'Qualified', 'Lead qualified after discovery review');
        return;
      }
      if (action === 'Convert Lead') {
        setConvertingLead(record);
        return;
      }
      if (action === 'Mark Nurture') {
        transition(record, 'Nurture');
        return;
      }
    }
    if (config.entity === 'opportunities') {
      if (action === 'Create Quote') {
        createQuoteFromOpportunity(record);
        return;
      }
      if (action === 'Advance Stage') {
        transition(record, nextStage(record.fields.stage || record.status), 'Opportunity stage advanced');
        return;
      }
      if (action === 'Close Won') {
        transition(record, 'Closed Won', 'Opportunity closed won');
        notify('Deal Closed-Won! You can now trigger Create Project handoff.');
        return;
      }
      if (action === 'Close Lost') {
        transition(record, 'Closed Lost', 'Opportunity closed lost');
        return;
      }
      if (action === 'Create Project' && record.status === 'Closed Won') {
        createProjectFromOpportunity(record);
        return;
      }
    }
    if (config.entity === 'quotes') {
      if (action === 'Edit Quote') {
        openEdit(record);
        return;
      }
      if (action === 'Submit for Approval') {
        transition(record, 'Pending Approval', 'Quote submitted for managerial sign-off');
        create('decisions', {
          name: `Quote Sign-off: ${record.title}`,
          agent: 'Quote Agent',
          action: `Approve Quote ${record.ref} (${money(record.amount)})`,
          reason: 'Discount exceeds 5% threshold',
          evidence: `Customer: ${record.fields.customer} · Amount: ${money(record.amount)}`,
          policy: 'Commercial Discount Guardrail v2.1',
          confidence: '0.94',
          status: 'Pending Approval',
        }, { status: 'Pending Approval', links: { quotes: [record.id] } });
        return;
      }
      if (action === 'Approve Quote') {
        transition(record, 'Approved', 'Quote approved by authorized manager');
        return;
      }
      if (action === 'Reject Quote') {
        transition(record, 'Rejected', 'Quote rejected by manager');
        return;
      }
      if (action === 'Accept Quote') {
        transition(record, 'Accepted', 'Customer accepted commercial proposal');
        return;
      }
      if (action === 'Convert to Sales Order') {
        convertQuote(record);
        return;
      }
      if (action === 'Revise Quote') {
        openEdit(record);
        return;
      }
    }
    if (config.entity === 'cases') {
      const chain: Record<string, string> = {
        'Start Case': 'In Progress',
        'Escalate Case': 'Escalated',
        'Wait for Customer': 'Waiting for Customer',
        'Resolve Case': 'Resolved',
        'Close Case': 'Closed',
      };
      const next = chain[action];
      if (next) {
        transition(record, next, action);
        if (next === 'Resolved') {
          const interaction = create(
            'interactions',
            {
              subject: `Case Resolved · ${record.ref}`,
              type: 'Note',
              channel: 'Service Desk',
              relatedTo: record.fields.customer || record.title,
              summary: `Resolution recorded for ${record.title}. Root cause addressed and customer updated.`,
            },
            { status: 'Completed', links: { cases: [record.id], organizations: record.links.organizations || [] } }
          );
          update('cases', record.id, { links: { interactions: [...new Set([...(record.links.interactions || []), interaction.id])] } }, 'Resolution linked');
          notify(`Case resolved. Logged resolution interaction in customer timeline.`);
        }
        return;
      }
    }
    if (config.entity === 'salesOrders') {
      if (action === 'Confirm Order') {
        transition(record, 'Confirmed', 'Order confirmed');
        return;
      }
      if (action === 'Check Inventory (ERP Boundary)') {
        notify('Radium ERP Inventory Boundary: 100% Stock Available (Warehouse: Kingston Hub · Reserved 5,000m fiber cable).');
        return;
      }
      if (action === 'Mark Fulfilled') {
        transition(record, 'Fulfilled', 'Fulfilment completed (Simulated)');
        return;
      }
      if (action === 'Generate Invoice') {
        const invoice = create(
          'invoices',
          {
            name: `Invoice for ${record.ref}`,
            customer: record.fields.customer || record.title,
            salesOrder: record.ref,
            dueDate: '',
            amount: String(record.amount),
            terms: record.fields.paymentTerms || 'Net 30',
            notes: 'Invoice generated from fulfilled sales order.',
          },
          { status: 'Issued', amount: record.amount, links: { salesOrders: [record.id], organizations: record.links.organizations || [] } }
        );
        update('salesOrders', record.id, { links: { invoices: [...new Set([...(record.links.invoices || []), invoice.id])] } }, 'Invoice linked');
        notify(`Invoice ${invoice.ref} generated.`);
        navigate('/invoices');
        setSelectedId(null);
        return;
      }
    }
    if (config.entity === 'decisions' && (action === 'Approve Action' || action === 'Reject Action')) {
      transition(record, action === 'Approve Action' ? 'Approved' : 'Rejected', `Human ${action.toLowerCase()}`);
      return;
    }
    if (config.entity === 'agents' && (action === 'Pause Agent' || action === 'Resume Agent')) {
      transition(record, action === 'Pause Agent' ? 'Paused' : 'Active', action);
      return;
    }
    if (action === 'Duplicate Record') {
      const copy = create(config.entity, { ...record.fields, name: `${record.title} (Copy)` }, { status: 'Draft', amount: record.amount, lineItems: record.lineItems, links: record.links });
      notify(`Duplicate ${copy.ref} created.`);
      return;
    }
    transition(record, action);
  };

  const availableActions = (record: CRMRecord) => {
    if (config.entity === 'leads') return record.status === 'Qualified' ? ['Convert Lead', 'Mark Nurture'] : ['Qualify Lead', 'Convert Lead', 'Mark Nurture'];
    if (config.entity === 'opportunities')
      return record.status === 'Closed Won' ? ['Create Project', 'Create Quote'] : record.status === 'Closed Lost' ? ['Create Quote'] : ['Advance Stage', 'Create Quote', 'Close Won', 'Close Lost'];
    if (config.entity === 'quotes')
      return record.status === 'Draft' ? ['Edit Quote', 'Submit for Approval'] : record.status === 'Pending Approval' ? ['Approve Quote', 'Reject Quote'] : record.status === 'Approved' ? ['Accept Quote', 'Revise Quote'] : record.status === 'Accepted' ? ['Convert to Sales Order', 'Revise Quote'] : ['Revise Quote'];
    if (config.entity === 'cases')
      return record.status === 'Resolved' ? ['Close Case'] : record.status === 'Closed' ? [] : ['Start Case', 'Escalate Case', 'Wait for Customer', 'Resolve Case'];
    if (config.entity === 'salesOrders')
      return record.status === 'Draft' ? ['Confirm Order'] : record.status === 'Confirmed' ? ['Check Inventory (ERP Boundary)', 'Mark Fulfilled', 'Generate Invoice'] : ['Generate Invoice'];
    if (config.entity === 'tasks') return record.status === 'Completed' ? [] : ['Complete Task'];
    if (config.entity === 'decisions') return record.status === 'Pending Approval' ? ['Approve Action', 'Reject Action'] : [];
    if (config.entity === 'agents') return record.status === 'Paused' ? ['Resume Agent'] : ['Pause Agent'];
    return record.status === 'Draft' ? ['Edit Record', 'Submit for Approval'] : ['Duplicate Record'];
  };

  const openRelated = (ref: string) => {
    const found = findByRef(ref);
    if (found) {
      const mapping: Record<string, string> = {
        organizations: '/organizations',
        contacts: '/contacts',
        leads: '/leads',
        opportunities: '/opportunities',
        quotes: '/quotes',
        salesOrders: '/sales-orders',
        invoices: '/invoices',
        cases: '/cases',
        projects: '/projects',
        tasks: '/tasks',
        campaigns: '/campaigns',
        products: '/catalog/products',
        services: '/catalog/services',
        agents: '/ai/agents',
        decisions: '/ai/activity',
        interactions: '/activities',
      };
      navigate(mapping[found.entity] || '/dashboard', { state: { openRecordId: found.record.id } });
    } else {
      notify('Related reference is not available in current demo dataset.');
    }
  };

  const linkedRecords = (record: CRMRecord) => {
    const refs = new Set<string>();
    Object.values(record.links || {}).flat().forEach(x => refs.add(x));
    Object.entries(record.fields).forEach(([k, v]) => {
      if (/ref|related|opportunity|quote|order|project|customer/i.test(k) && typeof v === 'string' && v.match(/^[A-Z]{2,}-/)) refs.add(v);
    });
    return [...refs].map(ref => findByRef(ref)).filter((x): x is NonNullable<typeof x> => !!x);
  };

  const fieldColumns = () => {
    if (config.entity === 'leads') return ['ref', 'title', 'company', 'source', 'score', 'owner', 'status'];
    if (config.entity === 'organizations') return ['ref', 'title', 'industry', 'segment', 'owner', 'status'];
    if (config.entity === 'contacts') return ['ref', 'title', 'email', 'organization', 'owner', 'status'];
    if (config.entity === 'opportunities') return ['ref', 'title', 'customer', 'stage', 'amount', 'probability', 'closeDate', 'owner'];
    if (config.entity === 'quotes') return ['ref', 'title', 'customer', 'opportunity', 'amount', 'status', 'owner'];
    if (config.entity === 'cases') return ['ref', 'title', 'customer', 'priority', 'assigned', 'sla', 'status'];
    if (config.entity === 'projects') return ['ref', 'title', 'customer', 'manager', 'budget', 'progress', 'health', 'status'];
    if (config.entity === 'tasks') return ['ref', 'title', 'assignee', 'priority', 'dueDate', 'status'];
    if (config.entity === 'campaigns') return ['ref', 'title', 'audience', 'channel', 'budget', 'owner', 'status'];
    if (config.entity === 'agents') return ['ref', 'title', 'role', 'module', 'autonomy', 'owner', 'status'];
    return ['ref', 'title', 'owner', 'date', 'amount', 'status'];
  };

  const cell = (record: CRMRecord, key: string) => {
    if (key === 'ref') return <span className="ref-link">{record.ref}</span>;
    if (key === 'title')
      return (
        <div className="table-primary">
          <strong>{record.title}</strong>
          <small>{record.description}</small>
        </div>
      );
    if (key === 'amount' || key === 'budget') return money(record.amount);
    if (key === 'date' || key === 'closeDate' || key === 'dueDate') return shortDate(record.fields[key] || record.date);
    if (key === 'score') return <span className="score-value">{record.score ?? record.fields.score ?? '—'}</span>;
    if (key === 'probability') return `${record.probability ?? record.fields.probability ?? 0}%`;
    if (key === 'progress')
      return (
        <span className="progress-cell">
          <i><b style={{ width: `${Math.max(0, Math.min(100, Number(record.fields.progress || 0)))}%` }}/></i>
          {record.fields.progress || 0}%
        </span>
      );
    if (key === 'status') return <StatusPill status={record.status}/>;
    return record.fields[key] || record.owner || '—';
  };

  // CUSTOMER 360 WORKSPACE RENDER
  if (item.path === '/customers/360') {
    return (
      <div className="workspace-page">
        <SectionHeading
          eyebrow="ESSENTIALS & CUSTOMER 360 / UNIFIED ACCOUNT VIEW"
          title="Customer 360"
          subtitle="Unified customer memory, relationship hierarchy, active commercial records, service cases, implementation projects and AI sentiment."
          action={
            <button className="btn primary" onClick={() => openNew()}>
              <Plus size={16}/> New Organization
            </button>
          }
        />
        <Customer360View
          selectedOrgId={selectedId || undefined}
          onSelectOrg={id => setSelectedId(id)}
          onOpenRecord={(entity, recId) => {
            const found = findByRef(recId) || records(entity).find(r => r.id === recId);
            if (found) {
              const rId = 'record' in found ? found.record.id : found.id;
              setSelectedId(rId);
            }
          }}
          onNewAction={(entity, prefill) => openNew(prefill)}
        />
        {selected && (
          <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setSelectedId(null)}>
            <aside className="detail-panel">
              <div className="detail-head">
                <div>
                  <span className="eyebrow">{selected.ref}</span>
                  <h2>{selected.title}</h2>
                  <p>{selected.description}</p>
                </div>
                <button className="icon-close" onClick={() => setSelectedId(null)}><X size={18}/></button>
              </div>
              <div className="detail-scroll">
                <div className="detail-summary">
                  <div><span>Status</span><StatusPill status={selected.status}/></div>
                  <div><span>Value</span><strong>{money(selected.amount)}</strong></div>
                  <div><span>Owner</span><strong>{selected.owner}</strong></div>
                  <div><span>Date</span><strong>{shortDate(selected.date)}</strong></div>
                </div>
                <div className="detail-section">
                  <div className="detail-fields">
                    {fieldsForRecord(selected).map(f => (
                      <div key={f.label}><span>{f.label}</span><strong>{f.value}</strong></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="detail-actions">
                <button className="btn secondary" onClick={() => openEdit(selected)}>Edit Record</button>
              </div>
            </aside>
          </div>
        )}
      </div>
    );
  }

  // LEAD CONVERSION DEDICATED WORKSPACE
  if (item.path === '/lead-conversion') {
    const qualifiedLeads = records('leads').filter(l => l.status === 'Qualified' || l.status === 'New');
    return (
      <div className="workspace-page">
        <SectionHeading
          eyebrow="LEAD CAPTURE & CONVERSIONS / WORKSPACE"
          title="Lead Conversion Engine"
          subtitle="Convert qualified leads into master organizations, contact people, and revenue deals with automated duplicate detection."
          action={<StatusPill status="Interactive Wizard"/>}
        />
        <div className="panel p-5 mb-4">
          <div className="panel-heading mb-4">
            <div>
              <h2>Qualified Leads Ready for Conversion</h2>
              <p>Select a qualified prospect to initiate the 4-step customer conversion wizard.</p>
            </div>
            <span className="phase-chip">{qualifiedLeads.length} leads in queue</span>
          </div>
          <div className="table-scroll">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>REFERENCE</th>
                  <th>PROSPECT</th>
                  <th>ORGANIZATION</th>
                  <th>SCORE</th>
                  <th>SOURCE</th>
                  <th>OWNER</th>
                  <th>CONVERT</th>
                </tr>
              </thead>
              <tbody>
                {qualifiedLeads.map(lead => (
                  <tr key={lead.id}>
                    <td><span className="ref-link">{lead.ref}</span></td>
                    <td><b>{lead.title}</b><small className="block text-slate-400">{lead.fields.jobTitle}</small></td>
                    <td>{lead.fields.company || '—'}</td>
                    <td><span className="score-value">{lead.score || 80}</span></td>
                    <td>{lead.fields.source}</td>
                    <td>{lead.owner}</td>
                    <td>
                      <button className="btn primary small" onClick={() => setConvertingLead(lead)}>
                        <Sparkles size={13}/> Convert to Customer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {convertingLead && (
          <LeadConversionModal
            lead={convertingLead}
            onClose={() => setConvertingLead(null)}
            onComplete={(org, con, opp) => {
              setConvertingLead(null);
              navigate('/customers/360', { state: { openRecordId: org.id } });
              notify(`Lead successfully converted into ${org.ref}, ${con.ref} and ${opp.ref}.`);
            }}
          />
        )}
      </div>
    );
  }

  // MY SALES DASHBOARD DEDICATED VIEW
  if (item.path === '/sales/my-dashboard') {
    const myDeals = records('opportunities').filter(o => o.owner === 'Demo User' || o.owner === 'Sarah Reid' || o.owner === 'M. Clarke');
    return (
      <div className="workspace-page">
        <SectionHeading
          eyebrow="SALES & PIPELINE MANAGEMENT / PERSONAL WORKSPACE"
          title="My Sales Dashboard"
          subtitle="Personal quota pacing, active deal pipeline, daily sales activities and priority action queue."
          action={
            <button className="btn primary" onClick={() => openNew()}>
              <Plus size={16}/> New Opportunity
            </button>
          }
        />
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="panel p-4">
            <span className="text-xs text-slate-500 font-semibold block">Quarterly Quota Target</span>
            <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">$200,000</strong>
            <small className="text-xs text-emerald-700 font-semibold block mt-1">115% Attained ($230k)</small>
          </div>
          <div className="panel p-4">
            <span className="text-xs text-slate-500 font-semibold block">My Active Deals</span>
            <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">{myDeals.length} Deals</strong>
            <small className="text-xs text-blue-700 block mt-1">{money(myDeals.reduce((s, d) => s + d.amount, 0))} Total Value</small>
          </div>
          <div className="panel p-4">
            <span className="text-xs text-slate-500 font-semibold block">Today's Sales Activities</span>
            <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">4 Actions</strong>
            <small className="text-xs text-slate-400 block mt-1">2 calls · 1 meeting · 1 quote</small>
          </div>
          <div className="panel p-4">
            <span className="text-xs text-slate-500 font-semibold block">Win Probability Index</span>
            <strong className="text-xl font-bold text-cyan-700 font-manrope block mt-1">68% Avg</strong>
            <small className="text-xs text-emerald-700 block mt-1">+4.5% vs team average</small>
          </div>
        </div>

        <section className="panel p-5">
          <div className="panel-heading mb-4">
            <div>
              <h2>My Priority Deals in Flight</h2>
              <p>Move deals forward, generate quotes and manage stakeholder alignment.</p>
            </div>
            <button className="link-button" onClick={() => navigate('/sales/pipeline')}>
              Open Pipeline Board <ArrowRight size={14}/>
            </button>
          </div>
          <table className="crm-table">
            <thead>
              <tr>
                <th>REF</th>
                <th>OPPORTUNITY</th>
                <th>CUSTOMER</th>
                <th>STAGE</th>
                <th>VALUE</th>
                <th>PROBABILITY</th>
                <th>NEXT STEP</th>
              </tr>
            </thead>
            <tbody>
              {myDeals.map(d => (
                <tr key={d.id} className="row-click" onClick={() => setSelectedId(d.id)}>
                  <td><span className="ref-link">{d.ref}</span></td>
                  <td><b>{d.title}</b></td>
                  <td>{d.fields.customer}</td>
                  <td><StatusPill status={d.fields.stage || d.status}/></td>
                  <td><strong>{money(d.amount)}</strong></td>
                  <td>{d.probability ?? d.fields.probability ?? 50}%</td>
                  <td><span className="text-xs text-blue-700 font-semibold">{d.fields.nextStep || 'Follow up'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  // UNIFIED INBOX DEDICATED VIEW
  if (item.path === '/inbox') {
    return (
      <div className="workspace-page">
        <UnifiedInboxView />
      </div>
    );
  }

  // CALENDAR DEDICATED VIEW
  if (item.path === '/calendar' || item.path === '/projects/calendar') {
    return (
      <div className="workspace-page">
        <CalendarView />
      </div>
    );
  }

  // APPROVALS DEDICATED VIEW
  if (item.path === '/approvals' || item.path === '/quotes/approvals' || item.path === '/admin/approvals') {
    return (
      <div className="workspace-page">
        <ApprovalsView />
      </div>
    );
  }

  // SALES LEADERBOARD & PERFORMANCE VIEW
  if (item.path === '/sales/leaderboard' || item.path === '/sales/performance') {
    return (
      <div className="workspace-page">
        <SalesLeaderboardView />
      </div>
    );
  }

  // QUOTE & ORDER DOCUMENTS VIEW
  if (item.path === '/quotes/documents' || item.path === '/orders/documents') {
    return (
      <div className="workspace-page">
        <QuoteDocumentView />
      </div>
    );
  }

  // ORDER FULFILMENT & LOGISTICS VIEW
  if (item.path === '/orders/fulfilment' || item.path === '/orders/allocation') {
    return (
      <div className="workspace-page">
        <OrderFulfilmentView />
      </div>
    );
  }

  // CUSTOMER PORTAL PREVIEW
  if (item.path === '/customer-portal') {
    return (
      <div className="workspace-page">
        <CustomerPortalView />
      </div>
    );
  }

  // RADIUM ERP CONNECTOR VIEW
  if (item.path === '/integrations/radium') {
    return (
      <div className="workspace-page">
        <RadiumConnectorView />
      </div>
    );
  }

  // WORKFLOW AUTOMATION DESIGNER VIEW
  if (item.path === '/admin/workflows') {
    return (
      <div className="workspace-page">
        <WorkflowDesignerView />
      </div>
    );
  }

  // SECURITY & GOVERNANCE AUDIT LEDGER VIEW
  if (item.path === '/admin/audit') {
    return (
      <div className="workspace-page">
        <AuditTrailView />
      </div>
    );
  }

  // STANDARD WORKSPACE PAGE VIEW
  const table = (
    <div className="table-scroll">
      <table className="crm-table">
        <thead>
          <tr>
            {fieldColumns().map(k => (
              <th key={k}>{k === 'ref' ? 'REFERENCE' : k === 'title' ? 'RECORD' : k.replace(/([A-Z])/g, ' $1').toUpperCase()}</th>
            ))}
            <th>OPEN</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id} className="row-click" onClick={() => setSelectedId(r.id)}>
              {fieldColumns().map(k => (
                <td key={k}>{cell(r, k)}</td>
              ))}
              <td>
                <button
                  className="row-open"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedId(r.id);
                  }}
                  aria-label={`Open ${r.ref}`}
                >
                  <ArrowRight size={16}/>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <EmptyState/>}
    </div>
  );

  const pipelineView = (
    <div className="pipeline-board">
      {pipelineStages.map((stage, sIdx) => {
        const deals = filtered.filter(r => (r.fields.stage || r.status) === stage);
        return (
          <div className="pipeline-column" key={stage}>
            <div className="pipeline-column-head">
              <span>{stage}</span>
              <b>{deals.length}</b>
            </div>
            <div className="pipeline-column-value">{money(deals.reduce((n, r) => n + r.amount, 0))}</div>
            {deals.map(r => {
              return (
                <div className="deal-card" key={r.id} onClick={() => setSelectedId(r.id)}>
                  <strong>{r.title}</strong>
                  <span>{r.fields.customer || r.fields.company || r.fields.account || 'Account pending'}</span>
                  <b>{money(r.amount)}</b>
                  <small>{r.probability ?? r.fields.probability ?? 0}% probability · {r.owner}</small>
                  <div className="deal-card-footer" onClick={e => e.stopPropagation()}>
                    <button
                      className="deal-move-btn"
                      disabled={sIdx <= 0}
                      onClick={() => {
                        const prev = pipelineStages[sIdx - 1];
                        transition(r, prev, `Moved deal to ${prev}`);
                      }}
                    >
                      ←
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">Stage {sIdx + 1}/7</span>
                    <button
                      className="deal-move-btn"
                      disabled={sIdx >= pipelineStages.length - 1}
                      onClick={() => {
                        const next = pipelineStages[sIdx + 1];
                        transition(r, next, `Moved deal to ${next}`);
                        if (next === 'Closed Won') {
                          notify('Deal Won! You can now create a delivery project handoff.');
                        }
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  // Detail Side Drawer
  const detailPanel = selected && (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setSelectedId(null)}>
      <aside className="detail-panel">
        <div className="detail-head">
          <div>
            <span className="eyebrow">{item.label.toUpperCase()} · {selected.ref}</span>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
          </div>
          <button className="icon-close" onClick={() => setSelectedId(null)}><X size={18}/></button>
        </div>
        <div className="detail-scroll">
          <div className="detail-summary">
            <div><span>Current status</span><StatusPill status={selected.status}/></div>
            <div><span>Indicative value</span><strong>{money(selected.amount)}</strong></div>
            <div><span>Record owner</span><strong>{selected.owner}</strong></div>
            <div><span>Record date</span><strong>{shortDate(selected.date)}</strong></div>
          </div>

          {/* SLA Indicator for Cases */}
          {config.entity === 'cases' && (
            <div className="p-3 bg-amber-50 rounded border border-amber-200 mt-3 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 size={15} className="text-amber-700"/>
                <span><b>SLA Target:</b> {selected.fields.sla || '4 business hours'} (High Priority Guarantee)</span>
              </div>
              <span className="font-bold text-amber-800">2h 45m remaining</span>
            </div>
          )}

          {/* Quick Communication Actions for Contacts, Organizations, Leads */}
          {['contacts', 'organizations', 'leads'].includes(config.entity) && (
            <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-3 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 mr-1">Simulate Channel:</span>
              <button
                className="btn secondary small"
                onClick={() => {
                  setCommPrefill({ to: selected.fields.email, contact: selected.title });
                  setActiveComm('email');
                }}
              >
                <Mail size={13}/> Email
              </button>
              <button
                className="btn secondary small"
                onClick={() => {
                  setCommPrefill({ to: selected.fields.email, contact: selected.title });
                  setActiveComm('call');
                }}
              >
                <Phone size={13}/> Call
              </button>
              <button
                className="btn secondary small"
                onClick={() => {
                  setCommPrefill({ to: selected.fields.email, contact: selected.title });
                  setActiveComm('sms');
                }}
              >
                <MessageCircle size={13}/> SMS
              </button>
              <button
                className="btn secondary small"
                onClick={() => {
                  setCommPrefill({ to: selected.fields.email, contact: selected.title });
                  setActiveComm('meeting');
                }}
              >
                <CalendarDays size={13}/> Meeting
              </button>
            </div>
          )}

          {/* Commercial Line Items */}
          {selected.lineItems && selected.lineItems.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-heading">
                <h3>Commercial line items</h3>
                <span>{selected.lineItems.length} lines</span>
              </div>
              <div className="line-item-table">
                <div className="line-item-row header">
                  <span>Item</span><span>Qty</span><span>Unit price</span><span>Total</span>
                </div>
                {selected.lineItems.map(l => (
                  <div className="line-item-row" key={l.id}>
                    <span>{l.name}<small>{l.sku}</small></span>
                    <span>{l.quantity}</span>
                    <span>{money(l.unitPrice)}</span>
                    <strong>{money(l.total)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Record Attributes */}
          <div className="detail-section">
            <div className="detail-section-heading">
              <h3>Record information</h3>
              <span>{fieldsForRecord(selected).length} attributes</span>
            </div>
            <div className="detail-fields">
              {fieldsForRecord(selected).map(f => (
                <div key={f.label}>
                  <span>{f.label}</span>
                  <strong>{f.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Related Cross-Linked Records */}
          {linkedRecords(selected).length > 0 && (
            <div className="detail-section">
              <div className="detail-section-heading">
                <h3>Related business records</h3>
                <Activity size={15}/>
              </div>
              <div className="related-list">
                {linkedRecords(selected).map(x => (
                  <button key={x.record.id} onClick={() => openRelated(x.record.ref)}>
                    <span><b>{x.record.ref}</b><small>{x.record.title}</small></span>
                    <ArrowRight size={15}/>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Activity History */}
          <div className="detail-section">
            <div className="detail-section-heading">
              <h3>Activity history</h3>
              <Activity size={15}/>
            </div>
            <div className="activity-feed">
              {[...selected.history].reverse().map(h => (
                <div className="activity-item" key={h.id}>
                  <i/>
                  <div>
                    <strong>{h.action}</strong>
                    <span>{h.actor} · {new Date(h.at).toLocaleString()}</span>
                    {h.details && <small>{h.details}</small>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="prototype-note">
            <ShieldCheck size={16}/>
            <span>Prototype record. Business actions update local demonstration data; live messaging, ERP posting and external services are simulated.</span>
          </div>
        </div>

        <div className="detail-actions">
          <button className="btn secondary" onClick={() => openEdit(selected)}>Edit record</button>
          {availableActions(selected).map(a => (
            <button className="btn primary" key={a} onClick={() => runAction(selected, a)}>
              {a === 'Approve Action' || a === 'Approve Quote' ? <BadgeCheck size={15}/> :
               a === 'Submit for Approval' ? <Send size={15}/> :
               a === 'Complete Task' ? <Check size={15}/> : null}
              {a}
            </button>
          ))}
          <button className="btn danger-ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14}/> Move to recycle bin
          </button>
        </div>

        {confirmDelete && (
          <div className="confirm-overlay">
            <div className="confirm-card">
              <h3>Move record to recycle bin?</h3>
              <p>{selected.ref} will be removed from this workspace. It can be reviewed in Administration → Recycle Bin.</p>
              <div>
                <button className="btn secondary" onClick={() => setConfirmDelete(false)}>Keep record</button>
                <button
                  className="btn danger"
                  onClick={() => {
                    remove(config.entity, selected.id);
                    setSelectedId(null);
                    setConfirmDelete(false);
                    notify('Record moved to recycle bin.');
                  }}
                >
                  Confirm delete
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );

  return (
    <div className="workspace-page">
      <SectionHeading
        eyebrow={`${config.group.toUpperCase()} / WORKSPACE`}
        title={config.title}
        subtitle={config.description}
        action={
          <div className="flex gap-2">
            {config.entity === 'leads' && (
              <button className="btn secondary" onClick={() => navigate('/lead-conversion')}>
                <Sparkles size={15}/> Conversion Engine
              </button>
            )}
            {['communications/email', 'inbox'].some(p => item.path.includes(p)) && (
              <button className="btn secondary" onClick={() => setActiveComm('email')}>
                <Mail size={15}/> Compose Email
              </button>
            )}
            {item.path.includes('calls') && (
              <button className="btn secondary" onClick={() => setActiveComm('call')}>
                <Phone size={15}/> Log Call
              </button>
            )}
            {item.path.includes('sms') && (
              <button className="btn secondary" onClick={() => setActiveComm('sms')}>
                <MessageCircle size={15}/> Send SMS
              </button>
            )}
            {item.path.includes('live-chat') && (
              <button className="btn secondary" onClick={() => setActiveComm('chat')}>
                <Globe2 size={15}/> Live Chat Simulator
              </button>
            )}
            <button className="btn primary" onClick={() => openNew()}>
              <Plus size={16}/> {config.primaryAction || 'New record'}
            </button>
          </div>
        }
      />

      <div className="demo-strip">
        <span className="demo-strip-icon"><ShieldCheck size={16}/></span>
        <div>
          <strong>Interactive prototype · demonstration data</strong>
          <p>Records, approvals and workflows are persisted in this browser. External communications, production AI execution and connected-system transactions are simulated.</p>
        </div>
        <span className="demo-tag">DEMO</span>
      </div>

      <div className="metric-row">
        <div className="metric-card">
          <span>Records</span>
          <strong>{stats.total}</strong>
          <small>In this workspace</small>
        </div>
        <div className="metric-card">
          <span>Active / in progress</span>
          <strong>{stats.active}</strong>
          <small>Current working records</small>
        </div>
        <div className="metric-card">
          <span>Awaiting review</span>
          <strong>{stats.pending}</strong>
          <small>Approval or review queue</small>
        </div>
        <div className="metric-card">
          <span>Indicative value</span>
          <strong>{money(stats.value)}</strong>
          <small>Illustrative record value</small>
        </div>
      </div>

      {config.special === 'timeline' && (
        <section className="panel timeline-workspace-panel mb-4">
          <div className="panel-header">
            <div>
              <h2>Unified customer activity timeline</h2>
              <p>Chronological customer communications, meetings, notes and operational interactions.</p>
            </div>
            <span className="phase-chip">Shared customer memory</span>
          </div>
          <div className="unified-timeline">
            {[...rows].sort((a, b) => b.date.localeCompare(a.date)).map(record => (
              <button key={record.id} onClick={() => setSelectedId(record.id)}>
                <i/>
                <span>
                  <strong>{record.title}</strong>
                  <small>{record.fields.type || 'Activity'} · {record.fields.channel || 'Internal'} · {shortDate(record.date)}</small>
                  <p>{record.description}</p>
                  <em>{record.fields.relatedTo || record.fields.customer || record.owner} · {record.ref}</em>
                </span>
                <ArrowRight size={15}/>
              </button>
            ))}
          </div>
        </section>
      )}

      {config.special === 'approvals' && (
        <section className="panel approvals-workspace-panel mb-4">
          <div className="panel-header">
            <div>
              <h2>Human approval queue</h2>
              <p>Review AI proposals and commercial decisions with evidence and policy context.</p>
            </div>
            <span className="phase-chip">Human control active</span>
          </div>
          <div className="approval-workspace-list">
            {rows.map(record => (
              <div className="approval-workspace-card" key={record.id}>
                <span className="approval-symbol"><ClipboardCheck size={17}/></span>
                <div>
                  <strong>{record.title}</strong>
                  <p>{record.fields.action || record.description}</p>
                  <small>{record.ref} · {record.fields.agent || record.owner} · {record.fields.confidence ? `Confidence ${record.fields.confidence}` : 'Confidence not specified'}</small>
                  <div className="approval-evidence">
                    <span><b>Reason</b> {record.fields.reason || 'Not provided'}</span>
                    <span><b>Policy</b> {record.fields.policy || 'No policy reference'}</span>
                    <span><b>Evidence</b> {record.fields.evidence || 'No supporting evidence attached'}</span>
                  </div>
                </div>
                <div className="approval-workspace-actions">
                  <StatusPill status={record.status}/>
                  {record.status === 'Pending Approval' && (
                    <>
                      <button className="btn primary" onClick={() => runAction(record, 'Approve Action')}>
                        <BadgeCheck size={14}/> Approve
                      </button>
                      <button className="btn secondary" onClick={() => runAction(record, 'Reject Action')}>
                        Reject
                      </button>
                    </>
                  )}
                  <button className="link-button" onClick={() => setSelectedId(record.id)}>
                    Open details <ArrowRight size={13}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {config.special === 'calendar' && (
        <section className="panel calendar-workspace-panel mb-4">
          <div className="panel-header">
            <div>
              <h2>Upcoming activities & events</h2>
              <p>Scheduled customer meetings, follow-ups and work items from shared CRM records.</p>
            </div>
            <span className="phase-chip">Local schedule view</span>
          </div>
          <div className="calendar-agenda">
            {[...rows, ...records('tasks')]
              .filter(record => record.status !== 'Completed' && record.status !== 'Cancelled')
              .sort((a, b) => (a.fields.date || a.fields.dueDate || a.date).localeCompare(b.fields.date || b.fields.dueDate || b.date))
              .map(record => (
                <button key={record.id} onClick={() => openRelated(record.ref)}>
                  <span className="agenda-date">
                    <b>{new Date(`${(record.fields.date || record.fields.dueDate || record.date).slice(0, 10)}T12:00:00`).getDate()}</b>
                    <small>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${(record.fields.date || record.fields.dueDate || record.date).slice(0, 10)}T12:00:00`))}</small>
                  </span>
                  <span>
                    <strong>{record.title}</strong>
                    <small>{record.fields.type || 'Task'} · {record.fields.relatedTo || record.fields.customer || record.owner}</small>
                  </span>
                  <StatusPill status={record.status}/>
                  <ArrowRight size={14}/>
                </button>
              ))}
          </div>
        </section>
      )}

      {config.special === 'pipeline' && (
        <section className="panel pipeline-panel mb-4">
          <div className="panel-header">
            <div>
              <h2>Opportunity Interactive Pipeline</h2>
              <p>Move deals through stages with 1-click controls or open deal details for quotes and handoffs.</p>
            </div>
            <div className="search-field compact">
              <Search size={15}/>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search opportunities..."/>
            </div>
          </div>
          {pipelineView}
        </section>
      )}

      {config.special === 'hierarchy' && (
        <section className="panel hierarchy-panel mb-4">
          <div className="panel-header">
            <div>
              <h2>Organization relationship graph</h2>
              <p>Illustrative parent-child and customer relationship references.</p>
            </div>
          </div>
          <div className="hierarchy-tree">
            {records('organizations').map(org => (
              <div className="hierarchy-branch" key={org.id}>
                <button className="hierarchy-org" onClick={() => setSelectedId(org.id)}>
                  <b>{org.title}</b>
                  <small>{org.fields.segment} · {org.fields.industry}</small>
                </button>
                {records('contacts')
                  .filter(c => c.links.organizations?.includes(org.id))
                  .map(c => (
                    <button key={c.id} className="hierarchy-contact" onClick={() => openRelated(c.ref)}>
                      <span>{c.title}</span>
                      <small>{c.fields.title}</small>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel record-panel">
        <div className="panel-header">
          <div>
            <h2>{config.title} register</h2>
            <p>{filtered.length} records · Select a row to inspect details and actions.</p>
          </div>
          <div className="record-tools">
            <label className="search-field">
              <Search size={15}/>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}...`}/>
            </label>
            <label className="filter-field">
              <ChevronDown size={14}/>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option>All statuses</option>
                {statusOptions.map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {table}
        <div className="table-footer">
          <span>Showing {filtered.length} of {rows.length} records</span>
          <span>Browser-local persistence · Single-tenant demonstration store</span>
        </div>
      </section>

      {selected && detailPanel}

      {/* CREATE / EDIT FORM MODAL */}
      {modal && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setModal(false)}>
          <div className="form-modal">
            <div className="form-modal-head">
              <div>
                <span className="eyebrow">{editingId ? 'EDIT RECORD' : 'NEW RECORD'}</span>
                <h2>{editingId ? 'Edit' : 'Create'} {config.title.replace(/s$/, '')}</h2>
                <p>Complete the relevant business attributes. Required fields are marked.</p>
              </div>
              <button className="icon-close" onClick={() => setModal(false)}><X size={18}/></button>
            </div>
            <div className="form-modal-body">
              <div className="form-grid">
                {config.fields.map(field => (
                  <FormField
                    key={field.key}
                    field={field}
                    value={form[field.key] || ''}
                    onChange={v => setForm(old => ({ ...old, [field.key]: v }))}
                  />
                ))}
              </div>

              {isCommercial && (
                <div className="line-builder">
                  <div className="line-builder-head">
                    <div>
                      <strong>Commercial line items</strong>
                      <small>Multiple lines · discounts and tax calculated per item</small>
                    </div>
                    <button className="btn secondary" onClick={() => setLines(old => [...old, initialLine()])}>
                      <Plus size={14}/> Add line
                    </button>
                  </div>
                  {lines.map(line => (
                    <div className="line-editor" key={line.id}>
                      <label>
                        Product / service
                        <input
                          value={line.name}
                          onChange={e => setLines(old => old.map(x => (x.id === line.id ? computeLine({ ...x, name: e.target.value }) : x)))}
                        />
                      </label>
                      <label>
                        SKU
                        <input
                          value={line.sku || ''}
                          onChange={e => setLines(old => old.map(x => (x.id === line.id ? { ...x, sku: e.target.value } : x)))}
                        />
                      </label>
                      <label>
                        Qty
                        <input
                          type="number"
                          min="0.01"
                          value={line.quantity}
                          onChange={e => setLines(old => old.map(x => (x.id === line.id ? computeLine({ ...x, quantity: Number(e.target.value) }) : x)))}
                        />
                      </label>
                      <label>
                        Unit price
                        <input
                          type="number"
                          min="0"
                          value={line.unitPrice}
                          onChange={e => setLines(old => old.map(x => (x.id === line.id ? computeLine({ ...x, unitPrice: Number(e.target.value) }) : x)))}
                        />
                      </label>
                      <label>
                        Discount %
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={line.discount}
                          onChange={e => setLines(old => old.map(x => (x.id === line.id ? computeLine({ ...x, discount: Number(e.target.value) }) : x)))}
                        />
                      </label>
                      <label>
                        Tax %
                        <input
                          type="number"
                          min="0"
                          value={line.taxRate}
                          onChange={e => setLines(old => old.map(x => (x.id === line.id ? computeLine({ ...x, taxRate: Number(e.target.value) }) : x)))}
                        />
                      </label>
                      <div className="line-editor-total">
                        <small>Line total</small>
                        <strong>{money(computeLine(line).total)}</strong>
                      </div>
                      <button
                        className="line-remove"
                        onClick={() => setLines(old => (old.length > 1 ? old.filter(x => x.id !== line.id) : old))}
                        title="Remove line"
                      >
                        <X size={14}/>
                      </button>
                    </div>
                  ))}
                  <div className="line-grand-total">
                    <span>Calculated document total</span>
                    <strong>{money(lineTotal)}</strong>
                  </div>
                </div>
              )}
            </div>
            <div className="form-modal-footer">
              <button className="btn secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn secondary" onClick={() => saveRecord(false)}>Save draft</button>
              <button className="btn primary" onClick={() => saveRecord(true)}>
                <Send size={15}/> Submit for approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD CONVERSION MODAL */}
      {convertingLead && (
        <LeadConversionModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onComplete={(org, con, opp) => {
            setConvertingLead(null);
            navigate('/customers/360', { state: { openRecordId: org.id } });
            notify(`Lead successfully converted into ${org.ref}, ${con.ref} and ${opp.ref}.`);
          }}
        />
      )}

      {/* COMMUNICATION MODAL */}
      {activeComm && (
        <CommunicationModal
          type={activeComm}
          prefillTo={commPrefill.to}
          prefillContact={commPrefill.contact}
          onClose={() => setActiveComm(null)}
          onLogged={msg => notify(msg)}
        />
      )}

      {toast && (
        <div className="inline-toast">
          <Check size={15}/>{toast}
          <button onClick={() => setToast('')}><X size={13}/></button>
        </div>
      )}
    </div>
  );
}

function FormField({ field, value, onChange }: { field: FieldDef; value: string; onChange: (value: string) => void }) {
  return (
    <label className={field.wide ? 'wide' : ''}>
      {field.label}
      {field.required && <em> *</em>}
      {field.type === 'textarea' ? (
        <textarea rows={3} value={value} placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} onChange={e => onChange(e.target.value)}/>
      ) : field.type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)}>
          <option value="">Select…</option>
          {(field.options || []).map(o => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input type={field.type || 'text'} value={value} placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} onChange={e => onChange(e.target.value)}/>
      )}
    </label>
  );
}
