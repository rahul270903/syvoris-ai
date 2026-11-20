import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, Award, BadgeCheck, BarChart3, Boxes, Briefcase, Building2,
  CalendarDays, Check, CheckCircle2, ChevronDown, CircleDollarSign, ClipboardCheck, Clock3,
  Contact, Copy, FileCheck2, FilePlus2, FileSpreadsheet, FileText, FolderKanban,
  Gauge, Globe2, Handshake, Headphones, HeartHandshake, Mail, MessageCircle,
  Network, PackageCheck, Phone, PieChart, Plus, RefreshCw, Search, Send, Settings,
  ShieldAlert, ShieldCheck, ShoppingCart, Sparkles, Target, Ticket, Trash2, Truck, User, Users, X
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { makeId, money, shortDate, type CRMRecord, type LineItem } from '../../data/models';
import { getWorkspaceConfig, prettyEntity } from './config';
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
import { SalesForecastingView } from './SalesForecastingView';
import { SalesActivitiesView } from './SalesActivitiesView';
import { MySalesDashboardView } from './MySalesDashboardView';
import { DiscountManagementView } from './DiscountManagementView';
import { PurchaseOrdersView } from './PurchaseOrdersView';
import { QuoteDocumentView } from './QuoteDocumentView';
import { EmailTemplatesView } from './EmailTemplatesView';
import { MarketingPerformanceView } from './MarketingPerformanceView';
import { CustomerEngagementView } from './CustomerEngagementView';
import { LoyaltyProgramsView } from './LoyaltyProgramsView';
import { SurveysCSATView } from './SurveysCSATView';
import { OrderFulfilmentView } from './OrderFulfilmentView';
import { CustomerPortalView } from './CustomerPortalView';
import { RadiumConnectorView } from './RadiumConnectorView';
import { WorkflowDesignerView } from './WorkflowDesignerView';
import { AuditTrailView } from './AuditTrailView';
import { AccountHierarchiesView } from './AccountHierarchiesView';
import { DuplicateManagementView } from './DuplicateManagementView';
import { OrganizationSelectField } from './OrganizationSelectField';
import { ProjectDetailsView } from './ProjectDetailsView';
import { ProjectAnalyticsView } from './ProjectAnalyticsView';
import { MilestonesView } from './MilestonesView';
import { ProjectCostsView } from './ProjectCostsView';
import { ResourceAllocationView } from './ResourceAllocationView';
import { ServiceDashboardView } from './ServiceDashboardView';
import { CasesWorkspaceView } from './CasesWorkspaceView';
import { SupportQueueView } from './SupportQueueView';
import { SLAManagementView } from './SLAManagementView';
import { BusinessHoursView } from './BusinessHoursView';
import { SupportWebformsView } from './SupportWebformsView';
import { AppointmentPagesView } from './AppointmentPagesView';
import { ServiceAnalyticsView } from './ServiceAnalyticsView';
import { LeadCaptureView } from './LeadCaptureView';
import { LeadQualificationView } from './LeadQualificationView';
import { LeadAssignmentView } from './LeadAssignmentView';
import { ActivitiesView } from './ActivitiesView';
import { TeamCollaborationView } from './TeamCollaborationView';
import { BillingWorkspace } from '../billing/BillingWorkspace';
import { ConsentManagementView } from './ConsentManagementView';
import { ProductsCatalogView } from './ProductsCatalogView';
import { ServicesCatalogView } from './ServicesCatalogView';
import { CategoriesCatalogView } from './CategoriesCatalogView';
import { BundlesCatalogView } from './BundlesCatalogView';
import { ProductAvailabilityView } from './ProductAvailabilityView';
import { TaxManagementView } from './TaxManagementView';
import { TermsManagementView } from './TermsManagementView';
import { StockManagementView } from './StockManagementView';
import { VendorsCatalogView } from './VendorsCatalogView';
import { api, type AccountItem } from '../../services/api';

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
  const [modalEntity, setModalEntity] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<LineItem[]>([initialLine()]);
  const [toast, setToast] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeModalEntity = modalEntity || config.entity;
  const activeModalConfig = useMemo(() => {
    if (!modalEntity || modalEntity === config.entity) return config;
    return getWorkspaceConfig({
      path: `/${modalEntity}`,
      label: prettyEntity(modalEntity),
      description: `Manage ${prettyEntity(modalEntity)}`,
      entity: modalEntity,
      category: config.group || 'Core',
      icon: config.title,
    } as any);
  }, [modalEntity, config]);

  const closeModal = () => {
    setModal(false);
    setModalEntity('');
    setEditingId(null);
    setFormError(null);
  };

  // Advanced Modals
  const [convertingLead, setConvertingLead] = useState<CRMRecord | null>(null);
  const [activeComm, setActiveComm] = useState<CommType | null>(null);
  const [commPrefill, setCommPrefill] = useState<{
    to?: string;
    contact?: string;
    accountId?: string;
    organization?: string;
  }>({});

  // Live Backend Records
  const isLiveCRMEntity =
    config.entity === 'organizations' ||
    config.entity === 'contacts' ||
    config.entity === 'leads' ||
    config.entity === 'opportunities' ||
    config.entity === 'priceBooks' ||
    config.entity === 'quotes' ||
    config.entity === 'salesOrders' ||
    config.entity === 'invoices' ||
    (config.entity === 'products' && (item.path === '/catalog/products' || item.path === '/quotes/configuration')) ||
    item.path === '/sales/pipeline' ||
    item.path === '/sales/forecasting' ||
    item.path === '/quotes/builder' ||
    item.path === '/quotes/approvals' ||
    item.path === '/orders/details' ||
    item.path === '/orders/allocation' ||
    item.path === '/orders/fulfilment' ||
    config.entity === 'projects' ||
    config.entity === 'tasks' ||
    config.entity === 'milestones' ||
    config.entity === 'resources' ||
    config.entity === 'costs' ||
    config.entity === 'campaigns' ||
    config.entity === 'segments' ||
    item.path === '/marketing/email-templates' ||
    config.entity === 'cases' ||
    config.entity === 'slaPolicies' ||
    item.path === '/service/sla' ||
    config.entity === 'knowledge' ||
    config.entity === 'surveys' ||
    item.path === '/service/feedback' ||
    config.entity === 'interactions' ||
    item.path === '/customers/timeline';
  const [liveAccounts, setLiveAccounts] = useState<CRMRecord[]>([]);
  const [liveContacts, setLiveContacts] = useState<CRMRecord[]>([]);
  const [liveLeads, setLiveLeads] = useState<CRMRecord[]>([]);
  const [liveOpportunities, setLiveOpportunities] = useState<CRMRecord[]>([]);
  const [livePriceBooks, setLivePriceBooks] = useState<CRMRecord[]>([]);
  const [liveProducts, setLiveProducts] = useState<CRMRecord[]>([]);
  const [liveQuotes, setLiveQuotes] = useState<CRMRecord[]>([]);
  const [liveSalesOrders, setLiveSalesOrders] = useState<CRMRecord[]>([]);
  const [liveInvoices, setLiveInvoices] = useState<CRMRecord[]>([]);
  const [liveProjects, setLiveProjects] = useState<CRMRecord[]>([]);
  const [liveProjectTasks, setLiveProjectTasks] = useState<CRMRecord[]>([]);
  const [liveProjectMilestones, setLiveProjectMilestones] = useState<CRMRecord[]>([]);
  const [liveProjectResources, setLiveProjectResources] = useState<CRMRecord[]>([]);
  const [liveProjectCosts, setLiveProjectCosts] = useState<CRMRecord[]>([]);
  const [liveCampaigns, setLiveCampaigns] = useState<CRMRecord[]>([]);
  const [liveSegments, setLiveSegments] = useState<CRMRecord[]>([]);
  const [liveEmailTemplates, setLiveEmailTemplates] = useState<CRMRecord[]>([]);
  const [liveCases, setLiveCases] = useState<CRMRecord[]>([]);
  const [liveSLAPolicies, setLiveSLAPolicies] = useState<CRMRecord[]>([]);
  const [liveKnowledge, setLiveKnowledge] = useState<CRMRecord[]>([]);
  const [liveSurveys, setLiveSurveys] = useState<CRMRecord[]>([]);
  const [liveActivities, setLiveActivities] = useState<CRMRecord[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<AccountItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsFetchError, setAccountsFetchError] = useState<string | null>(null);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const [opportunitiesLoaded, setOpportunitiesLoaded] = useState(false);
  const [priceBooksLoaded, setPriceBooksLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [quotesLoaded, setQuotesLoaded] = useState(false);
  const [salesOrdersLoaded, setSalesOrdersLoaded] = useState(false);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [milestonesLoaded, setMilestonesLoaded] = useState(false);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [costsLoaded, setCostsLoaded] = useState(false);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);
  const [segmentsLoaded, setSegmentsLoaded] = useState(false);
  const [emailTemplatesLoaded, setEmailTemplatesLoaded] = useState(false);
  const [casesLoaded, setCasesLoaded] = useState(false);
  const [slaPoliciesLoaded, setSLAPoliciesLoaded] = useState(false);
  const [knowledgeLoaded, setKnowledgeLoaded] = useState(false);
  const [surveysLoaded, setSurveysLoaded] = useState(false);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [externalSelected, setExternalSelected] = useState<{ entity: string; record: CRMRecord } | null>(null);

  const fetchLiveCRMData = async () => {
    setDataVersion(v => v + 1);
    if (config.entity === 'organizations') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listAccounts({ limit: 100 });
        const items = res?.items || [];
        setAvailableAccounts(items);
        const mapped: CRMRecord[] = items.map(acc => ({
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
            parent: acc.parent_id ? (items.find(x => x.id === acc.parent_id)?.name || '') : '',
          }
        }));
        setLiveAccounts(mapped);
        setAccountsLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load organizations from backend.');
        setAccountsLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'contacts') {
      setLoadingLive(true);
      setLoadingAccounts(true);
      setLiveError(null);
      setAccountsFetchError(null);
      try {
        const [contactsRes, accountsRes] = await Promise.all([
          api.listContacts({ limit: 100 }),
          api.listAccounts({ limit: 100 }),
        ]);
        const items = contactsRes?.items || [];
        const mapped: CRMRecord[] = items.map(c => ({
          id: c.id,
          ref: c.ref,
          title: c.full_name,
          description: `${c.job_title || 'Contact'}${c.account_name ? ` at ${c.account_name}` : ''}`,
          status: c.status,
          owner: c.owner_name || 'Contact Owner',
          amount: 0,
          date: c.created_at ? c.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: { organizations: c.account_id ? [c.account_id] : [] },
          history: [],
          fields: {
            firstName: c.first_name,
            lastName: c.last_name,
            organization: c.account_name || '',
            accountId: c.account_id || '',
            email: c.email,
            phone: c.phone || '',
            title: c.job_title || '',
            department: c.department || '',
            primary: c.is_primary ? 'Primary' : 'Secondary',
            decisionMaker: c.is_decision_maker ? 'Yes' : 'No',
          }
        }));
        setLiveContacts(mapped);
        setContactsLoaded(true);

        if (accountsRes?.items) {
          setAvailableAccounts(accountsRes.items);
        }
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load contacts from backend.');
        setAccountsFetchError(err?.message || 'Failed to load organizations.');
        setContactsLoaded(true);
      } finally {
        setLoadingLive(false);
        setLoadingAccounts(false);
      }
    } else if (config.entity === 'leads' || ['/lead-capture', '/lead-qualification', '/lead-conversion'].includes(item.path)) {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listLeads({ limit: 100 });
        const items = res?.items || [];
        const mapped: CRMRecord[] = items.map(l => ({
          id: l.id,
          ref: l.ref,
          title: l.full_name,
          description: `${l.job_title || 'Lead'}${l.company_name ? ` at ${l.company_name}` : ''}`,
          status: l.status,
          owner: l.owner_name || 'Lead Owner',
          amount: 0,
          date: l.created_at ? l.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: {
            organizations: l.converted_account_id ? [l.converted_account_id] : [],
            contacts: l.converted_contact_id ? [l.converted_contact_id] : [],
            opportunities: l.converted_opportunity_id ? [l.converted_opportunity_id] : [],
          },
          history: [],
          fields: {
            firstName: l.first_name,
            lastName: l.last_name,
            company: l.company_name,
            organization: l.company_name,
            title: l.job_title || '',
            jobTitle: l.job_title || '',
            email: l.email,
            phone: l.phone || '',
            source: l.source || 'Website',
            industry: l.industry || '',
            territory: l.territory || '',
            score: String(l.score),
            priority: l.priority || 'Normal',
            consent: l.consent_status || 'Pending',
            description: l.description || '',
            convertedOrganization: l.converted_account_name || '',
            convertedContact: l.converted_contact_name || '',
            convertedOpportunity: l.converted_opportunity_name || '',
            conversionDate: l.converted_at ? l.converted_at.slice(0, 10) : '',
          }
        }));
        setLiveLeads(mapped);
        setLeadsLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load leads from backend.');
        setLeadsLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'projects') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listProjects();
        const items = res || [];
        const mapped: CRMRecord[] = items.map(p => ({
          id: p.id,
          ref: p.ref,
          title: p.name,
          description: `${p.account_name ? `${p.account_name} · ` : ''}${p.category || p.project_type || 'Project'} · Health: ${p.health}`,
          status: p.status,
          owner: p.manager_name || 'Project Manager',
          amount: Number(p.budget || 0),
          date: p.start_date || (p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
          links: {
            organizations: p.account_id ? [p.account_id] : [],
            opportunities: p.opportunity_id ? [p.opportunity_id] : [],
          },
          history: [],
          fields: {
            name: p.name,
            customer: p.account_name || '',
            manager: p.manager_name || '',
            budget: String(p.budget || 0),
            progress: String(p.progress_pct || 0),
            health: p.health || 'On Track',
            billingModel: p.category || 'Fixed price',
            startDate: p.start_date || '',
            finishDate: p.target_date || '',
            actualCost: String((p as any).actual_cost || 0),
            status: p.status,
            description: p.description || '',
          }
        }));
        setLiveProjects(mapped);
        setProjectsLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load projects from backend.');
        setProjectsLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'tasks' || item.path === '/projects/tasks') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listProjectTasks();
        const items = res || [];
        const mapped: CRMRecord[] = items.map(t => ({
          id: t.id,
          ref: t.ref,
          title: t.title,
          description: `${t.project_name ? `${t.project_name} · ` : ''}Priority: ${t.priority} · Estimated: ${t.estimated_hours}h`,
          status: t.status,
          owner: t.assigned_user_name || 'Unassigned',
          amount: 0,
          date: t.due_date || (t.created_at ? t.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
          links: {
            projects: [t.project_id],
          },
          history: [],
          fields: {
            title: t.title,
            project: t.project_name || '',
            milestone: t.milestone_name || '',
            priority: t.priority,
            assignee: t.assigned_user_name || 'Unassigned',
            status: t.status,
            estimatedHours: String(t.estimated_hours || 0),
            actualHours: String(t.actual_hours || 0),
            startDate: t.start_date || '',
            dueDate: t.due_date || '',
            description: t.description || '',
          }
        }));
        setLiveProjectTasks(mapped);
        setTasksLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load project tasks from backend.');
        setTasksLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'milestones' || item.path === '/projects/milestones') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listProjectMilestones();
        const items = res || [];
        const mapped: CRMRecord[] = items.map(m => ({
          id: m.id,
          ref: m.ref,
          title: m.name,
          description: `${m.project_name ? `${m.project_name} · ` : ''}Target: ${m.target_date} · Deliverable: ${m.deliverable}`,
          status: m.status,
          owner: m.owner_name || 'Milestone Owner',
          amount: 0,
          date: m.target_date || (m.created_at ? m.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
          links: {
            projects: [m.project_id],
          },
          history: [],
          fields: {
            name: m.name,
            project: m.project_name || '',
            deliverable: m.deliverable || '',
            targetDate: m.target_date || '',
            priority: m.priority || 'Medium',
            owner: m.owner_name || '',
            status: m.status,
            completionCriteria: m.completion_criteria || '',
            completionEvidence: (m.custom_fields?.completion_evidence as string) || '',
            description: m.description || '',
          }
        }));
        setLiveProjectMilestones(mapped);
        setMilestonesLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load project milestones from backend.');
        setMilestonesLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'resources' || item.path === '/projects/resources') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listProjectResources();
        const items = res || [];
        const mapped: CRMRecord[] = items.map(r => ({
          id: r.id,
          ref: r.ref,
          title: r.role_title,
          description: `${r.user_name || 'Team Member'} · ${r.project_name || ''} · Rate: $${r.hourly_rate}/h (${r.allocation_pct}%)`,
          status: r.is_overallocated ? 'Over-Allocated' : 'Active',
          owner: r.user_name || 'Team Member',
          amount: Number(r.hourly_rate || 0),
          date: r.start_date || (r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
          links: {
            projects: [r.project_id],
          },
          history: [],
          fields: {
            name: r.role_title,
            assignee: r.user_name || '',
            project: r.project_name || '',
            allocation: String(r.allocation_pct),
            hourlyRate: String(r.hourly_rate),
            plannedHours: String(r.planned_hours || 0),
            actualHours: String(r.actual_hours || 0),
            startDate: r.start_date || '',
            endDate: r.end_date || '',
            status: r.is_overallocated ? 'Over-Allocated' : 'Active',
            description: (r.custom_fields?.notes as string) || '',
          }
        }));
        setLiveProjectResources(mapped);
        setResourcesLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load resource allocations from backend.');
        setResourcesLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'costs' || item.path === '/projects/costs') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listProjectCosts();
        const items = res || [];
        const mapped: CRMRecord[] = items.map(c => ({
          id: c.id,
          ref: c.ref,
          title: c.title,
          description: `${c.project_name ? `${c.project_name} · ` : ''}${c.category} (${c.cost_type}) · Date: ${c.date_incurred}`,
          status: c.cost_type,
          owner: 'Finance / PMO',
          amount: Number(c.amount || 0),
          date: c.date_incurred || (c.created_at ? c.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
          links: {
            projects: [c.project_id],
          },
          history: [],
          fields: {
            name: c.title,
            project: c.project_name || '',
            category: c.category,
            costType: c.cost_type,
            amount: String(c.amount),
            dateIncurred: c.date_incurred,
            vendor: c.vendor_name || '',
            notes: c.notes || '',
            status: c.cost_type,
          }
        }));
        setLiveProjectCosts(mapped);
        setCostsLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load project costs from backend.');
        setCostsLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'opportunities' || item.path === '/sales/pipeline' || item.path === '/sales/forecasting') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const [oppsRes, accsRes] = await Promise.all([
          api.listOpportunities({ limit: 100 }),
          api.listAccounts({ limit: 100 }),
        ]);
        const items = oppsRes?.items || [];
        if (accsRes?.items) setAvailableAccounts(accsRes.items);
        const mapped: CRMRecord[] = items.map(opp => ({
          id: opp.id,
          ref: opp.ref,
          title: opp.name,
          description: `${opp.account_name || 'Organization'} · ${opp.stage} · Win Prob: ${opp.probability}%`,
          status: opp.stage,
          owner: opp.owner_name || 'Opportunity Owner',
          amount: Number(opp.amount || 0),
          date: opp.expected_close_date || (opp.created_at ? opp.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
          links: {
            organizations: opp.account_id ? [opp.account_id] : [],
            contacts: opp.contact_id ? [opp.contact_id] : [],
          },
          history: (opp.stage_history || []).map((h, idx) => ({
            id: `hist-${idx}`,
            action: `Stage transitioned: ${h.from_stage} -> ${h.to_stage}`,
            actor: h.actor_name || 'Sales Rep',
            at: h.transition_at ? h.transition_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            details: h.notes || `Duration in stage: ${h.days_in_previous_stage} days`,
          })),
          fields: {
            name: opp.name,
            customer: opp.account_name || '',
            accountId: opp.account_id || '',
            contact: opp.contact_name || '',
            contactId: opp.contact_id || '',
            stage: opp.stage,
            amount: String(opp.amount || 0),
            probability: String(opp.probability || 0),
            closeDate: opp.expected_close_date || '',
            risk: opp.risk_level || 'Low',
            source: opp.lead_source || 'Direct Outreach',
            nextStep: opp.next_step || '',
            owner: opp.owner_name || '',
            description: opp.description || '',
            winDescription: opp.win_description || '',
            lossReason: opp.loss_reason || '',
          },
        }));
        setLiveOpportunities(mapped);
        setOpportunitiesLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load opportunities from backend.');
        setOpportunitiesLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'priceBooks' || item.path === '/price-books') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listPriceBooks({ limit: 100 });
        const items = res?.items || [];
        const mapped: CRMRecord[] = items.map(pb => ({
          id: pb.id,
          ref: pb.id.slice(0, 8).toUpperCase(),
          title: pb.name,
          description: `${(pb.is_default || pb.is_standard) ? 'Default Price Book · ' : ''}Currency: ${pb.currency} · Entries: ${pb.entries?.length || 0} items`,
          status: pb.is_active ? 'Active' : 'Inactive',
          owner: 'Commercial Pricing Team',
          amount: pb.entries?.length || 0,
          date: pb.created_at ? pb.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: {},
          history: [],
          fields: {
            name: pb.name,
            currency: pb.currency,
            isDefault: (pb.is_default || pb.is_standard) ? 'Yes' : 'No',
            status: pb.is_active ? 'Active' : 'Inactive',
            description: pb.description || '',
          }
        }));
        setLivePriceBooks(mapped);
        setPriceBooksLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load price books from backend.');
        setPriceBooksLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'products' && (item.path === '/catalog/products' || item.path === '/quotes/configuration')) {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listProducts({ limit: 100 });
        const items = res?.items || [];
        const mapped: CRMRecord[] = items.map(p => ({
          id: p.id,
          ref: p.sku || `PRD-${p.id.slice(0, 8)}`,
          title: p.name,
          description: `${p.category || 'Product'} · UOM: ${p.unit_of_measure || 'Unit'} · Tax: ${p.tax_category || 'Standard'}`,
          status: p.is_active ? 'Active' : 'Inactive',
          owner: 'Catalogue Manager',
          amount: Number(p.standard_price || 0),
          date: p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: {},
          history: [],
          fields: {
            name: p.name,
            sku: p.sku,
            category: p.category || '',
            unitPrice: String(p.standard_price || 0),
            taxCategory: p.tax_category || 'Standard',
            description: p.description || '',
          }
        }));
        setLiveProducts(mapped);
        setProductsLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load product configuration from backend.');
        setProductsLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (
      config.entity === 'quotes' ||
      item.path === '/quotes' ||
      item.path === '/quotes/builder' ||
      item.path === '/quotes/approvals'
    ) {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const [quotesRes, accsRes] = await Promise.all([
          api.listQuotes({ limit: 100 }),
          api.listAccounts({ limit: 100 }),
        ]);
        const items = quotesRes?.items || [];
        if (accsRes?.items) setAvailableAccounts(accsRes.items);
        const mapped: CRMRecord[] = items.map(q => ({
          id: q.id,
          ref: q.ref,
          title: q.name,
          description: `${q.account_name || 'Customer'} · ${q.currency} ${Number(q.grand_total).toLocaleString()} (Disc: ${Number(q.total_discount || 0).toLocaleString()}) · Rev v${q.version}`,
          status: q.status,
          owner: q.owner_name || 'Sales Representative',
          amount: Number(q.grand_total || 0),
          date: q.created_at ? q.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          lineItems: (q.lines || []).map(l => ({
            id: l.id || makeId(),
            productId: l.product_id,
            name: l.item_name,
            sku: l.sku || '',
            quantity: Number(l.quantity),
            unitPrice: Number(l.unit_price),
            discount: Number(l.discount_pct || 0),
            taxRate: Number(l.tax_rate || 0),
            total: Number(l.line_total),
          })),
          links: {
            organizations: q.account_id ? [q.account_id] : [],
            opportunities: q.opportunity_id ? [q.opportunity_id] : [],
          },
          history: [],
          fields: {
            name: q.name,
            customer: q.account_name || '',
            opportunity: q.opportunity_ref || '',
            validUntil: q.valid_until || '',
            currency: q.currency,
            discount: String(q.header_discount_pct || 0),
            tax: String(q.total_tax || 0),
            paymentTerms: q.payment_terms || 'Net 30',
            notes: q.notes || '',
            version: String(q.version),
            grandTotal: String(q.grand_total),
          }
        }));
        setLiveQuotes(mapped);
        setQuotesLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load quotes from backend.');
        setQuotesLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (
      config.entity === 'salesOrders' ||
      item.path === '/sales-orders' ||
      item.path === '/orders/details' ||
      item.path === '/orders/allocation' ||
      item.path === '/orders/fulfilment'
    ) {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const [ordersRes, accsRes] = await Promise.all([
          api.listSalesOrders({ limit: 100 }),
          api.listAccounts({ limit: 100 }),
        ]);
        const items = ordersRes?.items || [];
        if (accsRes?.items) setAvailableAccounts(accsRes.items);
        const mapped: CRMRecord[] = items.map(o => ({
          id: o.id,
          ref: o.ref,
          title: o.name,
          description: `${o.account_name || 'Customer'} · ${o.currency} ${Number(o.total_amount).toLocaleString()} · Fulfilment: ${o.fulfilment_stage || 'Draft'}`,
          status: o.status,
          owner: o.owner_name || 'Order Operations',
          amount: Number(o.total_amount || 0),
          date: o.created_at ? o.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          lineItems: (o.lines || []).map(l => ({
            id: l.id || makeId(),
            productId: l.product_id,
            name: l.item_name,
            sku: l.sku || '',
            quantity: Number(l.quantity),
            unitPrice: Number(l.unit_price),
            discount: Number(l.discount_pct || 0),
            taxRate: Number(l.tax_rate || 0),
            total: Number(l.line_total),
          })),
          links: {
            organizations: o.account_id ? [o.account_id] : [],
            quotes: o.quote_id ? [o.quote_id] : [],
            opportunities: o.opportunity_id ? [o.opportunity_id] : [],
          },
          history: [],
          fields: {
            name: o.name,
            customer: o.account_name || '',
            quote: o.quote_ref || '',
            requestedDate: o.requested_delivery_date || '',
            warehouse: o.warehouse_location || 'Kingston Central Logistics Hub',
            paymentTerms: o.payment_terms || 'Net 30',
            carrier: o.carrier || '',
            trackingNumber: o.tracking_number || '',
            fulfilmentStage: o.fulfilment_stage || 'Draft',
            totalAmount: String(o.total_amount),
            notes: o.notes || '',
          }
        }));
        setLiveSalesOrders(mapped);
        setSalesOrdersLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load sales orders from backend.');
        setSalesOrdersLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'invoices' || item.path === '/invoices') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const [invoicesRes, accsRes] = await Promise.all([
          api.listInvoices({ limit: 100 }),
          api.listAccounts({ limit: 100 }),
        ]);
        const items = invoicesRes?.items || [];
        if (accsRes?.items) setAvailableAccounts(accsRes.items);
        const mapped: CRMRecord[] = items.map(inv => ({
          id: inv.id,
          ref: inv.ref,
          title: inv.name,
          description: `${inv.account_name || 'Customer'} · ${inv.currency} ${Number(inv.total_amount).toLocaleString()} · Balance Due: ${inv.currency} ${Number(inv.balance_due).toLocaleString()}`,
          status: inv.status,
          owner: inv.owner_name || 'Finance & Billing',
          amount: Number(inv.total_amount || 0),
          date: inv.issue_date || (inv.created_at ? inv.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
          links: {
            organizations: inv.account_id ? [inv.account_id] : [],
            salesOrders: inv.sales_order_id ? [inv.sales_order_id] : [],
          },
          history: [],
          fields: {
            name: inv.name,
            customer: inv.account_name || '',
            salesOrder: inv.sales_order_ref || '',
            dueDate: inv.due_date || '',
            amount: String(inv.total_amount),
            paidAmount: String(inv.paid_amount || 0),
            balanceDue: String(inv.balance_due || 0),
            terms: inv.payment_terms || 'Net 30',
            status: inv.status,
            notes: inv.notes || '',
          }
        }));
        setLiveInvoices(mapped);
        setInvoicesLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load invoices from backend.');
        setInvoicesLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'campaigns' || item.path === '/campaigns' || item.path === '/marketing/performance') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listCampaigns({ limit: 100 });
        const items = res?.items || [];
        const mapped: CRMRecord[] = items.map(c => ({
          id: c.id,
          ref: c.ref,
          title: c.name,
          description: `${c.type} Campaign · Channel: ${c.channel} · Budget: $${Number(c.budget || 0).toLocaleString()} · Actual: $${Number(c.actual_cost || 0).toLocaleString()}`,
          status: c.status,
          owner: c.owner_name || 'Marketing Team',
          amount: Number(c.budget || 0),
          date: c.start_date ? String(c.start_date) : (c.created_at ? c.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
          links: {},
          history: [],
          fields: {
            name: c.name,
            type: c.type,
            channel: c.channel,
            audience: c.target_audience || 'Target Audience',
            segment: c.target_audience || '',
            startDate: c.start_date ? String(c.start_date) : '',
            endDate: c.end_date ? String(c.end_date) : '',
            owner: c.owner_name || '',
            budget: String(c.budget || 0),
            objective: c.objective || '',
            actualCost: String(c.actual_cost || 0),
            expectedRevenue: String(c.expected_revenue || 0),
            revenueGenerated: String(c.revenue_generated || 0),
            roi: String(c.roi_percentage || 0),
            memberCount: String(c.member_count || 0),
          }
        }));
        setLiveCampaigns(mapped);
        setCampaignsLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load campaigns from backend.');
        setCampaignsLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'segments' || item.path === '/segments') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listSegments({ limit: 100 });
        const items = res?.items || [];
        const mapped: CRMRecord[] = items.map(s => ({
          id: s.id,
          ref: s.ref,
          title: s.name,
          description: `${s.segment_type} Segment · Target: ${s.target_entity} · Members: ${s.member_count || 0}`,
          status: s.is_active ? 'Active' : 'Inactive',
          owner: s.owner_name || 'Audience Strategist',
          amount: s.member_count || 0,
          date: s.created_at ? s.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: {},
          history: [],
          fields: {
            name: s.name,
            segmentType: s.segment_type,
            targetEntity: s.target_entity,
            status: s.is_active ? 'Active' : 'Inactive',
            description: s.description || '',
            memberCount: String(s.member_count || 0),
          }
        }));
        setLiveSegments(mapped);
        setSegmentsLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load segments from backend.');
        setSegmentsLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (item.path === '/marketing/email-templates') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listEmailTemplates({ limit: 100 });
        const items = res?.items || [];
        const mapped: CRMRecord[] = items.map(t => ({
          id: t.id,
          ref: t.ref,
          title: t.name,
          description: `${t.category} Template · Subject: "${t.subject}" · Tags: ${(t.merge_tags || []).join(', ') || 'None'}`,
          status: t.is_active ? 'Active' : 'Inactive',
          owner: t.owner_name || 'Email Marketing Manager',
          amount: (t.merge_tags || []).length,
          date: t.created_at ? t.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: {},
          history: [],
          fields: {
            name: t.name,
            subject: t.subject,
            category: t.category,
            status: t.is_active ? 'Active' : 'Inactive',
            bodyHtml: t.body_html || '',
            mergeTags: (t.merge_tags || []).join(', '),
          }
        }));
        setLiveEmailTemplates(mapped);
        setEmailTemplatesLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load email templates from backend.');
        setEmailTemplatesLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'cases' || item.path === '/cases' || item.path === '/service/queue') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const [casesRes, accsRes] = await Promise.all([
          api.listCases({ limit: 100 }),
          api.listAccounts({ limit: 100 }),
        ]);
        const items = casesRes?.items || [];
        if (accsRes?.items) setAvailableAccounts(accsRes.items);
        const mapped: CRMRecord[] = items.map(c => ({
          id: c.id,
          ref: c.ref,
          title: c.subject,
          description: `${c.account_name || 'Customer'} · Priority: ${c.priority} · Channel: ${c.channel} · Category: ${c.category}`,
          status: c.status,
          owner: c.assigned_user_name || c.assigned_queue || 'Support Queue',
          amount: c.csat_score || 0,
          date: c.created_at ? c.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: {
            organizations: c.account_id ? [c.account_id] : [],
            contacts: c.contact_id ? [c.contact_id] : [],
          },
          history: (c.comments || []).map((comm, idx) => ({
            id: `comm-${idx}`,
            action: comm.is_internal ? 'Internal Staff Note' : 'Customer Message',
            actor: comm.author_name || 'Support Agent',
            at: comm.created_at ? comm.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            details: comm.message,
          })),
          fields: {
            subject: c.subject,
            customer: c.account_name || '',
            contact: c.contact_name || '',
            category: c.category || 'Technical Support',
            priority: c.priority || 'Normal',
            assigned: c.assigned_user_name || c.assigned_queue || 'Support Agent',
            sla: c.sla_breached ? 'Breached' : (c.sla_resolution_deadline ? `Due ${c.sla_resolution_deadline.slice(0, 16)}` : 'Active SLA'),
            channel: c.channel || 'Portal',
            sentiment: c.sentiment || 'Neutral',
            description: c.description || c.subject,
            resolutionSummary: c.resolution_summary || '',
            csatScore: c.csat_score ? String(c.csat_score) : '',
          }
        }));
        setLiveCases(mapped);
        setCasesLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load cases from backend.');
        setCasesLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'slaPolicies' || item.path === '/service/sla') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const items = await api.listSLAPolicies();
        const mapped: CRMRecord[] = (items || []).map(sla => ({
          id: sla.id,
          ref: sla.ref,
          title: sla.name,
          description: `Priority: ${sla.priority} · First Response: ${sla.first_response_hours}h · Resolution: ${sla.resolution_hours}h · ${sla.business_hours_only ? 'Business Hours Only' : '24x7 Calendar'}`,
          status: sla.is_active ? 'Active' : 'Inactive',
          owner: 'SLA Operations Team',
          amount: sla.resolution_hours,
          date: sla.created_at ? sla.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: {},
          history: [],
          fields: {
            name: sla.name,
            priority: sla.priority,
            firstResponseHours: String(sla.first_response_hours),
            resolutionHours: String(sla.resolution_hours),
            businessHoursOnly: sla.business_hours_only ? 'Yes' : 'No',
            status: sla.is_active ? 'Active' : 'Inactive',
            description: sla.description || '',
          }
        }));
        setLiveSLAPolicies(mapped);
        setSLAPoliciesLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load SLA policies from backend.');
        setSLAPoliciesLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'knowledge' || item.path === '/knowledge') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await api.listKnowledgeArticles({ limit: 100 });
        const items = res?.items || [];
        const mapped: CRMRecord[] = items.map(k => ({
          id: k.id,
          ref: k.ref,
          title: k.title,
          description: `${k.category} · Visibility: ${k.visibility} · Helpful Votes: ${k.helpful_count || 0}`,
          status: k.status,
          owner: 'Knowledge Author',
          amount: k.helpful_count || 0,
          date: k.created_at ? k.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: {},
          history: [],
          fields: {
            title: k.title,
            category: k.category,
            visibility: k.visibility,
            version: 'v1.0',
            owner: 'Knowledge Author',
            content: k.content || k.summary || '',
            helpfulVotes: String(k.helpful_count || 0),
          }
        }));
        setLiveKnowledge(mapped);
        setKnowledgeLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load knowledge articles from backend.');
        setKnowledgeLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    } else if (config.entity === 'surveys' || item.path === '/surveys' || item.path === '/service/feedback') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const items = await api.listSurveys();
        const mapped: CRMRecord[] = (items || []).map(s => ({
          id: s.id,
          ref: s.ref,
          title: s.title,
          description: `${s.survey_type} Survey · Trigger: ${s.trigger_event} · Responses: ${s.response_count || 0} (Avg Score: ${s.average_score || 0})`,
          status: s.is_active ? 'Active' : 'Inactive',
          owner: 'Customer Experience Team',
          amount: Number(s.average_score || 0),
          date: s.created_at ? s.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: {},
          history: [],
          fields: {
            title: s.title,
            surveyType: s.survey_type,
            triggerEvent: s.trigger_event,
            status: s.is_active ? 'Active' : 'Inactive',
            description: s.title,
            responseCount: String(s.response_count || 0),
            averageScore: String(s.average_score || 0),
          }
        }));
        setLiveSurveys(mapped);
        setSurveysLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to load customer surveys from backend.');
        setSurveysLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    }

    if (config.entity === 'interactions' || item.path === '/customers/timeline') {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const actList = await api.listActivities(100);
        const mapped: CRMRecord[] = actList.map(a => ({
          id: a.id,
          ref: `ACT-${a.id.slice(0, 8).toUpperCase()}`,
          title: a.subject,
          description: a.description || 'Customer interaction recorded in PostgreSQL.',
          status: 'Completed',
          owner: a.actor_name || 'System Operator',
          amount: 0,
          date: a.occurred_at ? a.occurred_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          links: {
            organizations: a.account_id ? [a.account_id] : [],
            contacts: a.contact_id ? [a.contact_id] : [],
          },
          history: [],
          fields: {
            subject: a.subject,
            type: a.activity_type,
            channel: a.activity_type === 'Call' ? 'Phone' : a.activity_type === 'Email' ? 'Email' : a.activity_type === 'Meeting' ? 'Calendar' : 'Outreach',
            relatedTo: a.metadata?.account_name || a.metadata?.organization || (a.account_id ? `Account: ${a.account_id.slice(0, 8)}` : 'Customer Account'),
            occurredAt: a.occurred_at,
            actor: a.actor_name,
            summary: a.description || 'Logged interaction with verified audit record.',
            consent: 'Verified',
          }
        }));
        setLiveActivities(mapped);
        setActivitiesLoaded(true);
      } catch (err: any) {
        setLiveError(err?.message || 'Failed to fetch customer activities from backend.');
        setActivitiesLoaded(true);
      } finally {
        setLoadingLive(false);
      }
    }
  };

  useEffect(() => {
    fetchLiveCRMData();
  }, [config.entity, item.path]);

  useEffect(() => {
    const state = location.state as { openRecordId?: string } | null;
    if (state?.openRecordId) {
      setSelectedId(state.openRecordId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.key]);

  const localRows = records(config.entity);
  const rows = useMemo(() => {
    if (config.entity === 'organizations') {
      return accountsLoaded ? liveAccounts : [];
    }
    if (config.entity === 'contacts') {
      return contactsLoaded ? liveContacts : [];
    }
    if (config.entity === 'leads') {
      return leadsLoaded ? liveLeads : [];
    }
    if (config.entity === 'opportunities' || item.path === '/sales/pipeline' || item.path === '/sales/forecasting') {
      return opportunitiesLoaded ? liveOpportunities : [];
    }
    if (config.entity === 'priceBooks' || item.path === '/price-books') {
      return priceBooksLoaded ? livePriceBooks : [];
    }
    if (config.entity === 'products' && (item.path === '/catalog/products' || item.path === '/quotes/configuration')) {
      return productsLoaded ? liveProducts : [];
    }
    if (config.entity === 'quotes' || item.path === '/quotes' || item.path === '/quotes/builder' || item.path === '/quotes/approvals') {
      return quotesLoaded ? liveQuotes : [];
    }
    if (config.entity === 'salesOrders' || item.path === '/sales-orders' || item.path === '/orders/details' || item.path === '/orders/allocation' || item.path === '/orders/fulfilment') {
      return salesOrdersLoaded ? liveSalesOrders : [];
    }
    if (config.entity === 'invoices' || item.path === '/invoices') {
      return invoicesLoaded ? liveInvoices : [];
    }
    if (config.entity === 'projects') {
      return projectsLoaded ? liveProjects : [];
    }
    if (config.entity === 'tasks') {
      return tasksLoaded ? liveProjectTasks : [];
    }
    if (config.entity === 'milestones') {
      return milestonesLoaded ? liveProjectMilestones : [];
    }
    if (config.entity === 'resources') {
      return resourcesLoaded ? liveProjectResources : [];
    }
    if (config.entity === 'costs') {
      return costsLoaded ? liveProjectCosts : [];
    }
    if (config.entity === 'campaigns') {
      return campaignsLoaded ? liveCampaigns : [];
    }
    if (config.entity === 'segments') {
      return segmentsLoaded ? liveSegments : [];
    }
    if (item.path === '/marketing/email-templates') {
      return emailTemplatesLoaded ? liveEmailTemplates : [];
    }
    if (config.entity === 'cases') {
      return casesLoaded ? liveCases : [];
    }
    if (config.entity === 'slaPolicies' || item.path === '/service/sla') {
      return slaPoliciesLoaded ? liveSLAPolicies : [];
    }
    if (config.entity === 'knowledge') {
      return knowledgeLoaded ? liveKnowledge : [];
    }
    if (config.entity === 'surveys' || item.path === '/surveys' || item.path === '/service/feedback') {
      return surveysLoaded ? liveSurveys : [];
    }
    if (config.entity === 'interactions' || item.path === '/customers/timeline') {
      return activitiesLoaded ? liveActivities : [];
    }
    return localRows;
  }, [
    config.entity,
    item.path,
    accountsLoaded, liveAccounts,
    contactsLoaded, liveContacts,
    leadsLoaded, liveLeads,
    opportunitiesLoaded, liveOpportunities,
    priceBooksLoaded, livePriceBooks,
    productsLoaded, liveProducts,
    quotesLoaded, liveQuotes,
    salesOrdersLoaded, liveSalesOrders,
    invoicesLoaded, liveInvoices,
    projectsLoaded, liveProjects,
    tasksLoaded, liveProjectTasks,
    milestonesLoaded, liveProjectMilestones,
    resourcesLoaded, liveProjectResources,
    costsLoaded, liveProjectCosts,
    campaignsLoaded, liveCampaigns,
    segmentsLoaded, liveSegments,
    emailTemplatesLoaded, liveEmailTemplates,
    casesLoaded, liveCases,
    slaPoliciesLoaded, liveSLAPolicies,
    knowledgeLoaded, liveKnowledge,
    surveysLoaded, liveSurveys,
    activitiesLoaded, liveActivities,
    localRows
  ]);
  const statusOptions = useMemo(() => {
    if (config.entity === 'campaigns') {
      return ['Planning', 'Active', 'In Progress', 'Paused', 'Completed', 'Draft'];
    }
    return [...new Set(rows.map(r => r.status))];
  }, [rows, config.entity]);
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

  const openNew = (prefill: Record<string, string> = {}, targetEntity?: string) => {
    const entity = targetEntity || config.entity;
    setModalEntity(entity);
    setEditingId(null);
    setFormError(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      currency: 'USD',
      owner: 'Arjun Mehta',
      status: ['organizations', 'contacts'].includes(entity) ? 'Active' : 'Draft',
      accountId: prefill.accountId || '',
      parentId: prefill.parentId || '',
      parent: prefill.parent || '',
      organization: prefill.organization || prefill.customer || '',
      customer: prefill.customer || prefill.organization || '',
      ...prefill,
    });
    setLines([initialLine()]);
    if (
      ['contacts', 'opportunities', 'quotes', 'salesOrders', 'invoices', 'organizations', 'cases', 'projects'].includes(entity) &&
      availableAccounts.length === 0
    ) {
      setLoadingAccounts(true);
      api.listAccounts({ limit: 100 })
        .then(res => {
          if (res?.items) setAvailableAccounts(res.items);
        })
        .catch(err => setAccountsFetchError(err?.message || 'Failed to load organizations.'))
        .finally(() => setLoadingAccounts(false));
    }
    setModal(true);
  };

  const openEdit = (record: CRMRecord, targetEntity?: string) => {
    const entity = targetEntity || config.entity;
    setModalEntity(entity);
    setEditingId(record.id);
    setFormError(null);
    const existingAccountId = record.fields.accountId || record.links.organizations?.[0] || '';
    setForm({
      ...record.fields,
      status: record.status || record.fields.status || 'Active',
      accountId: existingAccountId,
      parentId: record.fields.parentId || '',
      parent: record.fields.parent || '',
      organization: record.fields.organization || record.fields.customer || '',
      customer: record.fields.customer || record.fields.organization || '',
    });
    setLines(record.lineItems?.length ? record.lineItems : [initialLine()]);
    if (
      ['contacts', 'opportunities', 'quotes', 'salesOrders', 'invoices', 'organizations', 'cases', 'projects'].includes(entity) &&
      availableAccounts.length === 0
    ) {
      setLoadingAccounts(true);
      api.listAccounts({ limit: 100 })
        .then(res => {
          if (res?.items) setAvailableAccounts(res.items);
        })
        .catch(err => setAccountsFetchError(err?.message || 'Failed to load organizations.'))
        .finally(() => setLoadingAccounts(false));
    }
    setSelectedId(null);
    setModal(true);
  };

  const isCommercial = ['quotes', 'salesOrders', 'purchaseOrders'].includes(activeModalEntity);
  const lineTotal = lines.map(computeLine).reduce((s, l) => s + l.total, 0);

  const saveRecord = async (submit: boolean | string = false) => {
    const activeEntity = modalEntity || config.entity;
    const missing = activeModalConfig.fields.find(f => f.required && !String(form[f.key] || '').trim());
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
    if (activeEntity === 'leads' && fields.score) fields.score = String(Math.min(100, Math.max(0, Number(fields.score))));

    let statusValue: string;
    if (typeof submit === 'string') {
      statusValue = submit;
    } else if (submit === true) {
      statusValue = 'Pending Approval';
    } else if (fields.status) {
      statusValue = fields.status;
    } else if (editingId) {
      statusValue = rows.find(r => r.id === editingId)?.status || 'Draft';
    } else {
      statusValue = ['organizations', 'contacts'].includes(activeEntity) ? 'Active' : 'Draft';
    }
    const options = { status: statusValue, amount, lineItems: isCommercial ? lines.map(computeLine) : undefined };

    // Organizations / Accounts: PostgreSQL is the single source of truth
    if (activeEntity === 'organizations') {
      setSubmitting(true);
      setFormError(null);
      try {
        const parentIdPayload = fields.parentId && fields.parentId.trim() ? fields.parentId.trim() : undefined;
        if (editingId) {
          await api.updateAccount(editingId, {
            name: fields.name || item.label,
            industry: fields.industry || undefined,
            website: fields.website || undefined,
            phone: fields.phone || undefined,
            email: fields.email || undefined,
            address: fields.address || undefined,
            ownership: fields.ownership || 'Private',
            status: statusValue,
            description: fields.description || undefined,
            credit_limit: amount,
            parent_id: parentIdPayload,
          });
          notify('Organization updated in PostgreSQL database.');
        } else {
          await api.createAccount({
            name: fields.name || item.label,
            industry: fields.industry || undefined,
            website: fields.website || undefined,
            phone: fields.phone || undefined,
            email: fields.email || undefined,
            address: fields.address || undefined,
            ownership: fields.ownership || 'Private',
            status: statusValue,
            description: fields.description || undefined,
            credit_limit: amount,
            parent_id: parentIdPayload,
          });
          notify('Organization created and saved to PostgreSQL.');
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save organization to backend.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Contacts: PostgreSQL is the single source of truth
    if (activeEntity === 'contacts') {
      setSubmitting(true);
      setFormError(null);
      try {
        const accountIdPayload = fields.accountId && fields.accountId.trim() ? fields.accountId.trim() : null;
        if (editingId) {
          await api.updateContact(editingId, {
            first_name: fields.firstName || 'First',
            last_name: fields.lastName || 'Last',
            email: fields.email || `contact-${Date.now()}@syvoris.example`,
            account_id: accountIdPayload,
            phone: fields.phone || undefined,
            job_title: fields.title || fields.jobTitle || undefined,
            department: fields.department || undefined,
            status: statusValue,
            is_primary: fields.primary === 'Primary',
            is_decision_maker: fields.decisionMaker === 'Yes',
          });
          notify('Contact updated in PostgreSQL database.');
        } else {
          await api.createContact({
            first_name: fields.firstName || 'First',
            last_name: fields.lastName || 'Last',
            email: fields.email || `contact-${Date.now()}@syvoris.example`,
            account_id: accountIdPayload,
            phone: fields.phone || undefined,
            job_title: fields.title || fields.jobTitle || undefined,
            department: fields.department || undefined,
            status: statusValue,
            is_primary: fields.primary === 'Primary',
            is_decision_maker: fields.decisionMaker === 'Yes',
          });
          notify('Contact created and saved to PostgreSQL.');
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save contact to backend.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Leads: PostgreSQL is the single source of truth
    if (activeEntity === 'leads') {
      setSubmitting(true);
      setFormError(null);
      try {
        const companyName = fields.company || fields.organization || fields.name || 'Company';
        const firstName = fields.firstName || fields.name?.split(' ')[0] || 'First';
        const lastName = fields.lastName || fields.name?.split(' ').slice(1).join(' ') || 'Last';
        if (editingId) {
          await api.updateLead(editingId, {
            first_name: firstName,
            last_name: lastName,
            company_name: companyName,
            job_title: fields.title || fields.jobTitle || undefined,
            email: fields.email || `lead-${Date.now()}@syvoris.example`,
            phone: fields.phone || undefined,
            source: fields.source || 'Website',
            industry: fields.industry || undefined,
            territory: fields.territory || undefined,
            status: fields.status || statusValue || 'New',
            priority: fields.priority || 'Normal',
            consent_status: fields.consent || 'Pending',
            description: fields.description || undefined,
          });
          notify('Lead updated in PostgreSQL database.');
        } else {
          await api.createLead({
            first_name: firstName,
            last_name: lastName,
            company_name: companyName,
            job_title: fields.title || fields.jobTitle || undefined,
            email: fields.email || `lead-${Date.now()}@syvoris.example`,
            phone: fields.phone || undefined,
            source: fields.source || 'Website',
            industry: fields.industry || undefined,
            territory: fields.territory || undefined,
            status: fields.status || 'New',
            priority: fields.priority || 'Normal',
            consent_status: fields.consent || 'Pending',
            description: fields.description || undefined,
          });
          notify('Lead created and scored in PostgreSQL database.');
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save lead to backend.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Opportunities: PostgreSQL is the single source of truth
    if (activeEntity === 'opportunities') {
      setSubmitting(true);
      setFormError(null);
      try {
        let targetAccountId = form.accountId;
        if (!targetAccountId) {
          const accs = await api.listAccounts({ q: fields.customer, limit: 1 });
          if (accs?.items?.[0]) {
            targetAccountId = accs.items[0].id;
          } else {
            const newAcc = await api.createAccount({
              name: fields.customer || 'Enterprise Account',
              account_type: 'Enterprise',
              industry: 'Technology',
            });
            targetAccountId = newAcc.id;
          }
        }

        const payload = {
          name: fields.name || item.label,
          account_id: targetAccountId,
          contact_id: fields.contactId || undefined,
          stage: fields.stage || 'New Opportunity',
          amount: Number(fields.amount || amount || 0),
          probability: Number(fields.probability || 10),
          close_date: fields.closeDate || undefined,
          source: fields.source || 'Direct Outreach',
          risk: fields.risk || 'Low',
          next_step: fields.notes || undefined,
        };

        if (editingId) {
          await api.updateOpportunity(editingId, payload);
          notify('Opportunity updated in PostgreSQL database.');
        } else {
          await api.createOpportunity(payload);
          notify('Opportunity created and saved to PostgreSQL.');
        }
        await fetchLiveCRMData();
        setModal(false);
        setEditingId(null);
      } catch (err: any) {
        const msg = err?.message || 'Failed to save opportunity to backend.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Price Books: PostgreSQL is the single source of truth
    if (activeEntity === 'priceBooks') {
      setSubmitting(true);
      setFormError(null);
      try {
        if (editingId) {
          await api.updatePriceBook(editingId, {
            name: fields.name,
            currency: fields.currency || 'USD',
            is_default: fields.isDefault === 'Yes',
            is_active: fields.status !== 'Inactive',
            description: fields.description || undefined,
          });
          notify('Price book updated in PostgreSQL.');
        } else {
          await api.createPriceBook({
            name: fields.name,
            currency: fields.currency || 'USD',
            is_default: fields.isDefault === 'Yes',
            is_active: fields.status !== 'Inactive',
            description: fields.description || undefined,
          });
          notify('Price book created in PostgreSQL.');
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save price book.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Products: Product Configuration
    if (activeEntity === 'products' && (item.path === '/catalog/products' || item.path === '/quotes/configuration')) {
      setSubmitting(true);
      setFormError(null);
      try {
        if (editingId) {
          await api.updateProduct(editingId, {
            name: fields.name,
            sku: fields.sku,
            category: fields.category || 'Product',
            standard_price: Number(fields.unitPrice || 0),
            tax_category: fields.taxCategory || 'Standard',
            description: fields.description || undefined,
          });
          notify('Product updated in PostgreSQL.');
        } else {
          await api.createProduct({
            name: fields.name,
            sku: fields.sku || `PRD-${Date.now().toString().slice(-6)}`,
            category: fields.category || 'Product',
            standard_price: Number(fields.unitPrice || 0),
            tax_category: fields.taxCategory || 'Standard',
            description: fields.description || undefined,
          });
          notify('Product created in PostgreSQL.');
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save product.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Quotes & CPQ: PostgreSQL is the single source of truth
    if (activeEntity === 'quotes') {
      setSubmitting(true);
      setFormError(null);
      try {
        let targetAccountId = form.accountId;
        if (!targetAccountId) {
          const accs = await api.listAccounts({ q: fields.customer, limit: 1 });
          if (accs?.items?.[0]) {
            targetAccountId = accs.items[0].id;
          } else {
            const newAcc = await api.createAccount({
              name: fields.customer || 'Commercial Client',
              account_type: 'Enterprise',
              industry: 'Technology',
            });
            targetAccountId = newAcc.id;
          }
        }

        const quoteLines = (lines || []).map((l, idx) => ({
          product_id: l.productId || undefined,
          item_name: l.name || 'Commercial Line Item',
          sku: l.sku || 'SKU-ITEM',
          quantity: l.quantity,
          unit_price: l.unitPrice,
          cost_price: l.unitPrice * 0.7,
          discount_pct: l.discount || 0,
          tax_rate: l.taxRate || 0,
          sort_order: idx,
        }));

        if (editingId) {
          await api.updateQuote(editingId, {
            name: fields.name,
            valid_until: fields.validUntil || undefined,
            currency: fields.currency || 'USD',
            header_discount_pct: Number(fields.discount || 0),
            payment_terms: fields.paymentTerms || 'Net 30',
            notes: fields.notes || undefined,
            lines: quoteLines.length ? quoteLines : undefined,
          });
          notify('Quote updated in PostgreSQL.');
        } else {
          const newQuote = await api.createQuote({
            name: fields.name,
            account_id: targetAccountId,
            valid_until: fields.validUntil || undefined,
            currency: fields.currency || 'USD',
            header_discount_pct: Number(fields.discount || 0),
            payment_terms: fields.paymentTerms || 'Net 30',
            notes: fields.notes || undefined,
            lines: quoteLines,
          });
          if (submit) {
            await api.submitQuoteForApproval(newQuote.id, 'Automatic submission upon quotation creation');
            notify(`Quote ${newQuote.ref} created and submitted for managerial approval.`);
          } else {
            notify(`Quote ${newQuote.ref} created and saved to PostgreSQL.`);
          }
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save quote.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Sales Orders: PostgreSQL is the single source of truth
    if (activeEntity === 'salesOrders') {
      setSubmitting(true);
      setFormError(null);
      try {
        let targetAccountId = form.accountId;
        if (!targetAccountId) {
          const accs = await api.listAccounts({ q: fields.customer, limit: 1 });
          if (accs?.items?.[0]) {
            targetAccountId = accs.items[0].id;
          } else {
            const newAcc = await api.createAccount({
              name: fields.customer || 'Commercial Client',
              account_type: 'Enterprise',
              industry: 'Technology',
            });
            targetAccountId = newAcc.id;
          }
        }

        const orderLines = (lines || []).map((l, idx) => ({
          product_id: l.productId || undefined,
          item_name: l.name || 'Order Item',
          sku: l.sku || 'SKU-ITEM',
          quantity: l.quantity,
          unit_price: l.unitPrice,
          discount_pct: l.discount || 0,
          tax_rate: l.taxRate || 0,
          sort_order: idx,
        }));

        if (editingId) {
          await api.updateSalesOrder(editingId, {
            name: fields.name,
            status: (fields.status as any) || undefined,
            fulfilment_stage: fields.fulfilmentStage || undefined,
            warehouse_location: fields.warehouse || undefined,
            requested_delivery_date: fields.requestedDate || undefined,
            carrier: fields.carrier || undefined,
            tracking_number: fields.trackingNumber || undefined,
            payment_terms: fields.paymentTerms || undefined,
            notes: fields.notes || undefined,
          });
          notify('Sales order updated in PostgreSQL.');
        } else {
          const newOrder = await api.createSalesOrder({
            name: fields.name,
            account_id: targetAccountId,
            warehouse_location: fields.warehouse || 'Kingston Central Logistics Hub',
            requested_delivery_date: fields.requestedDate || undefined,
            payment_terms: fields.paymentTerms || 'Net 30',
            notes: fields.notes || undefined,
            lines: orderLines as any,
          });
          notify(`Sales order ${newOrder.ref} created in PostgreSQL.`);
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save sales order.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Invoices: PostgreSQL is the single source of truth
    if (activeEntity === 'invoices') {
      setSubmitting(true);
      setFormError(null);
      try {
        let targetAccountId = form.accountId;
        if (!targetAccountId) {
          const accs = await api.listAccounts({ q: fields.customer, limit: 1 });
          if (accs?.items?.[0]) {
            targetAccountId = accs.items[0].id;
          } else {
            const newAcc = await api.createAccount({
              name: fields.customer || 'Billing Client',
              account_type: 'Enterprise',
              industry: 'Technology',
            });
            targetAccountId = newAcc.id;
          }
        }

        if (editingId) {
          await api.updateInvoice(editingId, {
            status: (fields.status as any) || undefined,
            due_date: fields.dueDate || undefined,
            notes: fields.notes || undefined,
          });
          notify('Invoice updated in PostgreSQL.');
        } else {
          const newInv = await api.createInvoice({
            name: fields.name,
            account_id: targetAccountId,
            status: 'Issued',
            issue_date: new Date().toISOString().slice(0, 10) as any,
            due_date: (fields.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)) as any,
            total_amount: Number(fields.amount || amount || 0),
            currency: 'USD',
            payment_terms: fields.terms || 'Net 30',
            notes: fields.notes || undefined,
          });
          notify(`Invoice ${newInv.ref} created in PostgreSQL.`);
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save invoice.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Projects: PostgreSQL is the single source of truth
    if (activeEntity === 'projects') {
      setSubmitting(true);
      setFormError(null);
      try {
        let targetAccountId = form.accountId;
        if (!targetAccountId && (fields.customer || fields.organization)) {
          const accs = await api.listAccounts({ q: fields.customer || fields.organization, limit: 1 });
          if (accs?.items?.[0]) {
            targetAccountId = accs.items[0].id;
          }
        }
        if (editingId) {
          await api.updateProject(editingId, {
            name: fields.name || item.label,
            account_id: targetAccountId || undefined,
            budget: Number(fields.budget || amount || 0),
            category: fields.billingModel || 'Fixed price',
            start_date: fields.startDate || undefined,
            target_date: fields.finishDate || undefined,
            description: fields.scope || fields.description || undefined,
            status: fields.status || statusValue,
          });
          notify('Project updated in PostgreSQL database.');
        } else {
          await api.createProject({
            name: fields.name || item.label,
            account_id: targetAccountId || undefined,
            budget: Number(fields.budget || amount || 0),
            category: fields.billingModel || 'Fixed price',
            start_date: fields.startDate || new Date().toISOString().slice(0, 10),
            target_date: fields.finishDate || undefined,
            description: fields.scope || fields.description || undefined,
          });
          notify('Project created and saved to PostgreSQL.');
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save project to backend.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Project Tasks: PostgreSQL is the single source of truth
    if (activeEntity === 'tasks') {
      setSubmitting(true);
      setFormError(null);
      try {
        const projectId = fields.projectId || liveProjects[0]?.id;
        if (!projectId && !editingId) {
          throw new Error('Please select or specify a project ID for this task.');
        }
        if (editingId) {
          await api.updateProjectTask(editingId, {
            title: fields.title || fields.name || 'New Task',
            priority: fields.priority || 'Medium',
            estimated_hours: Number(fields.estimatedHours || 8),
            actual_hours: Number(fields.actualHours || 0),
            due_date: fields.dueDate || undefined,
            status: fields.status || statusValue || 'Open',
            description: fields.description || undefined,
          });
          notify('Task updated in PostgreSQL database.');
        } else {
          await api.createProjectTask({
            project_id: projectId,
            title: fields.title || fields.name || 'New Task',
            priority: fields.priority || 'Medium',
            estimated_hours: Number(fields.estimatedHours || 8),
            due_date: fields.dueDate || undefined,
            description: fields.description || undefined,
          });
          notify('Task created and saved to PostgreSQL.');
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save task to backend.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Milestones: PostgreSQL is the single source of truth
    if (activeEntity === 'milestones') {
      setSubmitting(true);
      setFormError(null);
      try {
        const projectId = fields.projectId || liveProjects[0]?.id;
        if (!projectId && !editingId) {
          throw new Error('Please select or specify a project ID for this milestone.');
        }
        if (editingId) {
          await api.updateProjectMilestone(editingId, {
            name: fields.name || 'New Milestone',
            deliverable: fields.deliverable || 'Deliverable',
            target_date: fields.targetDate || new Date().toISOString().slice(0, 10),
            priority: fields.priority || 'Medium',
            status: fields.status || statusValue || 'Pending',
            completion_criteria: fields.completionCriteria || undefined,
            description: fields.description || undefined,
          });
          notify('Milestone updated in PostgreSQL database.');
        } else {
          await api.createProjectMilestone({
            project_id: projectId,
            name: fields.name || 'New Milestone',
            deliverable: fields.deliverable || 'Deliverable specification',
            target_date: fields.targetDate || new Date().toISOString().slice(0, 10),
            priority: fields.priority || 'Medium',
            completion_criteria: fields.completionCriteria || undefined,
            description: fields.description || undefined,
          });
          notify('Milestone created and saved to PostgreSQL.');
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save milestone to backend.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Resource Allocation: PostgreSQL is the single source of truth
    if (activeEntity === 'resources') {
      setSubmitting(true);
      setFormError(null);
      try {
        const projectId = fields.projectId || liveProjects[0]?.id;
        if (!projectId && !editingId) {
          throw new Error('Please select or specify a project ID for this resource allocation.');
        }
        if (editingId) {
          await api.updateProjectResource(editingId, {
            role_title: fields.name || fields.roleTitle || 'Team Member',
            allocation_pct: Number(fields.allocation || 100),
            hourly_rate: Number(fields.hourlyRate || 85),
            planned_hours: Number(fields.plannedHours || 160),
            actual_hours: Number(fields.actualHours || 0),
            start_date: fields.startDate || undefined,
            end_date: fields.endDate || undefined,
            custom_fields: fields.description ? { notes: fields.description } : {},
          });
          notify('Resource allocation updated in PostgreSQL database.');
        } else {
          await api.createProjectResource({
            project_id: projectId,
            user_id: availableAccounts[0]?.id || 'usr-default',
            role_title: fields.name || fields.roleTitle || 'Team Member',
            allocation_pct: Number(fields.allocation || 100),
            hourly_rate: Number(fields.hourlyRate || 85),
            planned_hours: Number(fields.plannedHours || 160),
            start_date: fields.startDate || undefined,
            end_date: fields.endDate || undefined,
            custom_fields: fields.description ? { notes: fields.description } : {},
          });
          notify('Resource allocation created and saved to PostgreSQL.');
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save resource allocation to backend.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Project Costs: PostgreSQL is the single source of truth
    if (activeEntity === 'costs') {
      setSubmitting(true);
      setFormError(null);
      try {
        const projectId = fields.projectId || liveProjects[0]?.id;
        if (!projectId && !editingId) {
          throw new Error('Please select or specify a project ID for this cost entry.');
        }
        if (editingId) {
          await api.updateProjectCost(editingId, {
            title: fields.name || fields.title || 'Project Expense',
            category: fields.category || 'Labor',
            cost_type: fields.costType || 'Actual',
            amount: Number(fields.amount || amount || 0),
            date_incurred: fields.dateIncurred || new Date().toISOString().slice(0, 10),
            vendor_name: fields.vendor || undefined,
            notes: fields.notes || fields.description || undefined,
          });
          notify('Cost record updated in PostgreSQL database.');
        } else {
          await api.createProjectCost({
            project_id: projectId,
            title: fields.name || fields.title || 'Project Expense',
            category: fields.category || 'Labor',
            cost_type: fields.costType || 'Actual',
            amount: Number(fields.amount || amount || 0),
            date_incurred: fields.dateIncurred || new Date().toISOString().slice(0, 10),
            vendor_name: fields.vendor || undefined,
            notes: fields.notes || fields.description || undefined,
          });
          notify('Cost record created and saved to PostgreSQL.');
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save cost record to backend.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Campaigns: PostgreSQL is the single source of truth
    if (activeEntity === 'campaigns') {
      setSubmitting(true);
      setFormError(null);
      try {
        if (editingId) {
          await api.updateCampaign(editingId, {
            name: fields.name || item.label,
            type: fields.type || 'Email',
            channel: fields.channel || 'Email',
            target_audience: fields.audience || fields.segment || undefined,
            start_date: (fields.startDate || undefined) as any,
            end_date: (fields.endDate || undefined) as any,
            budget: Number(fields.budget || amount || 0),
            objective: fields.objective || undefined,
            status: statusValue,
          });
          notify('Campaign updated in PostgreSQL database.');
        } else {
          const newC = await api.createCampaign({
            name: fields.name || item.label,
            type: fields.type || 'Email',
            channel: fields.channel || 'Email',
            target_audience: fields.audience || fields.segment || undefined,
            start_date: (fields.startDate || new Date().toISOString().slice(0, 10)) as any,
            end_date: (fields.endDate || undefined) as any,
            budget: Number(fields.budget || amount || 0),
            objective: fields.objective || undefined,
          });
          notify(`Campaign ${newC.ref} created and saved to PostgreSQL.`);
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save campaign to backend.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Audience Segments: PostgreSQL is the single source of truth
    if (activeEntity === 'segments') {
      setSubmitting(true);
      setFormError(null);
      try {
        if (editingId) {
          await api.updateSegment(editingId, {
            name: fields.name || item.label,
            segment_type: fields.segmentType || 'Dynamic',
            target_entity: fields.targetEntity || 'contacts',
            description: fields.description || undefined,
            is_active: fields.status === 'Active',
          });
          notify('Segment updated in PostgreSQL database.');
        } else {
          const newS = await api.createSegment({
            name: fields.name || item.label,
            segment_type: fields.segmentType || 'Dynamic',
            target_entity: fields.targetEntity || 'contacts',
            description: fields.description || undefined,
            is_active: fields.status !== 'Inactive',
          });
          notify(`Audience segment ${newS.ref} created in PostgreSQL.`);
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save audience segment.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Email Templates: PostgreSQL is the single source of truth
    if (item.path === '/marketing/email-templates') {
      setSubmitting(true);
      setFormError(null);
      try {
        if (editingId) {
          await api.updateEmailTemplate(editingId, {
            name: fields.name || item.label,
            subject: fields.subject || 'Subject',
            category: fields.category || 'Promotional',
            body_html: fields.bodyHtml || '<p>Template Content</p>',
            is_active: fields.status === 'Active',
          });
          notify('Email template updated in PostgreSQL database.');
        } else {
          const newT = await api.createEmailTemplate({
            name: fields.name || item.label,
            subject: fields.subject || 'Subject',
            category: fields.category || 'Promotional',
            body_html: fields.bodyHtml || '<p>Template Content</p>',
            is_active: fields.status !== 'Inactive',
          });
          notify(`Email template ${newT.ref} created in PostgreSQL.`);
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save email template.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Customer Service Cases: PostgreSQL is the single source of truth
    if (activeEntity === 'cases') {
      setSubmitting(true);
      setFormError(null);
      try {
        let targetAccountId = form.accountId;
        if (!targetAccountId && fields.customer) {
          const accs = await api.listAccounts({ q: fields.customer, limit: 1 });
          if (accs?.items?.[0]) {
            targetAccountId = accs.items[0].id;
          } else {
            const newAcc = await api.createAccount({
              name: fields.customer,
              account_type: 'Enterprise',
              industry: 'Technology',
            });
            targetAccountId = newAcc.id;
          }
        }
        if (editingId) {
          await api.updateCase(editingId, {
            subject: fields.subject || item.label,
            priority: fields.priority || 'Normal',
            category: fields.category || 'Technical Support',
            channel: fields.channel || 'Portal',
            sentiment: fields.sentiment || 'Neutral',
            description: fields.description || undefined,
            status: statusValue,
          });
          notify('Service case updated in PostgreSQL database.');
        } else {
          const newC = await api.createCase({
            subject: fields.subject || item.label,
            account_id: targetAccountId || undefined,
            priority: fields.priority || 'Normal',
            category: fields.category || 'Technical Support',
            channel: fields.channel || 'Portal',
            sentiment: fields.sentiment || 'Neutral',
            description: fields.description || fields.subject || 'Issue description',
          });
          notify(`Service case ${newC.ref} logged and saved to PostgreSQL.`);
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save service case.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // SLA Policies: PostgreSQL is the single source of truth
    if (activeEntity === 'slaPolicies' || item.path === '/service/sla') {
      setSubmitting(true);
      setFormError(null);
      try {
        if (editingId) {
          await api.updateSLAPolicy(editingId, {
            name: fields.name || item.label,
            priority: fields.priority || 'Normal',
            first_response_hours: Number(fields.firstResponseHours || 4),
            resolution_hours: Number(fields.resolutionHours || 24),
            business_hours_only: fields.businessHoursOnly === 'Yes',
            is_active: fields.status !== 'Inactive',
            description: fields.description || undefined,
          });
          notify('SLA policy updated in PostgreSQL database.');
        } else {
          const newSla = await api.createSLAPolicy({
            name: fields.name || item.label,
            priority: fields.priority || 'Normal',
            first_response_hours: Number(fields.firstResponseHours || 4),
            resolution_hours: Number(fields.resolutionHours || 24),
            business_hours_only: fields.businessHoursOnly === 'Yes',
            is_active: fields.status !== 'Inactive',
            description: fields.description || undefined,
          });
          notify(`SLA policy ${newSla.ref} created in PostgreSQL.`);
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save SLA policy.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Knowledge Base Articles: PostgreSQL is the single source of truth
    if (activeEntity === 'knowledge') {
      setSubmitting(true);
      setFormError(null);
      try {
        if (editingId) {
          await api.updateKnowledgeArticle(editingId, {
            title: fields.title || item.label,
            category: fields.category || 'Troubleshooting',
            visibility: fields.visibility || 'Customer-facing',
            content: fields.content || 'Article content',
            status: fields.status || 'Published',
          });
          notify('Knowledge article updated in PostgreSQL database.');
        } else {
          const newK = await api.createKnowledgeArticle({
            title: fields.title || item.label,
            category: fields.category || 'Troubleshooting',
            visibility: fields.visibility || 'Customer-facing',
            content: fields.content || 'Article content',
            status: 'Published',
          });
          notify(`Knowledge article ${newK.ref} published in PostgreSQL.`);
        }
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save knowledge article.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Customer Surveys: PostgreSQL is the single source of truth
    if (activeEntity === 'surveys' || item.path === '/surveys' || item.path === '/service/feedback') {
      setSubmitting(true);
      setFormError(null);
      try {
        const newS = await api.createSurvey({
          title: fields.title || item.label,
          survey_type: fields.surveyType || 'CSAT',
          trigger_event: fields.triggerEvent || 'case.resolved',
          is_active: fields.status !== 'Inactive',
          custom_fields: {
            questions: [
              { id: "q1", text: "How satisfied are you with our service?", scale: 5 }
            ]
          }
        });
        notify(`Customer survey ${newS.ref} created in PostgreSQL.`);
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save customer survey.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Customer Activities / Interactions: PostgreSQL
    if (activeEntity === 'interactions' || item.path === '/customers/timeline') {
      setSubmitting(true);
      setFormError(null);
      try {
        const targetAccId = form.accountId || (availableAccounts.length > 0 ? availableAccounts[0].id : undefined);
        if (!targetAccId) {
          throw new Error('Please select an organization for this activity.');
        }
        await api.createAccountActivity(targetAccId, {
          activity_type: fields.type || 'Outreach',
          subject: fields.subject || fields.name || 'Customer interaction',
          description: fields.summary || fields.description || 'Logged customer interaction in PostgreSQL.',
          contact_id: form.contactId || undefined,
        });
        notify('Customer activity logged and committed to PostgreSQL.');
        await fetchLiveCRMData();
        closeModal();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save customer activity.';
        setFormError(msg);
        notify(`Error: ${msg}`);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Default prototype entities (opportunities, quotes, etc.)
    if (editingId) {
      update(
        activeEntity,
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
      const record = create(activeEntity, fields, options);
      if (submit) {
        update(activeEntity, record.id, { status: 'Pending Approval' }, 'Submitted for approval');
        if (activeEntity === 'quotes') {
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
    closeModal();
  };

  const transition = async (record: CRMRecord, newStatus: string, action?: string) => {
    if (config.entity === 'opportunities') {
      try {
        await api.transitionOpportunityStage(record.id, {
          to_stage: newStatus,
          budget_confirmed: newStatus === 'Proposal' || newStatus === 'Negotiation' ? true : undefined,
          decision_maker_bought_in: newStatus === 'Negotiation' ? true : undefined,
          win_description: newStatus === 'Closed Won' ? (action || 'Deal closed successfully with customer acceptance') : undefined,
          loss_reason: newStatus === 'Closed Lost' ? (action || 'Competitor pricing / budget constraints') : undefined,
          notes: action || `Advanced stage to ${newStatus}`,
        });
        notify(`${record.ref} advanced to ${newStatus} in PostgreSQL.`);
        await fetchLiveCRMData();
      } catch (err: any) {
        const errMsg = err?.message || `Cannot advance to ${newStatus}`;
        notify(`Stage Gate Blocked: ${errMsg}`);
      }
      return;
    }
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

  const createProjectFromOpportunity = async (opp: CRMRecord) => {
    try {
      const p = await api.createProject({
        name: `${opp.title} · Implementation`,
        opportunity_id: opp.id,
        account_id: opp.links.organizations?.[0],
        budget: opp.amount || 50000,
        category: 'Milestone',
        start_date: new Date().toISOString().slice(0, 10),
        target_date: opp.fields.closeDate || undefined,
        description: opp.description,
      });
      notify(`Project ${p.ref} created in PostgreSQL from closed-won deal.`);
      await fetchLiveCRMData();
      navigate('/projects/details', { state: { projectId: p.id } });
    } catch {
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
      navigate('/projects/details', { state: { projectId: project.id } });
    }
    setSelectedId(null);
  };

  const runAction = (record: CRMRecord, action: string) => {
    if (config.entity === 'campaigns') {
      if (action === 'Launch Campaign' || action === 'Activate Campaign') {
        update('campaigns', record.id, { status: 'Active' }, 'Campaign launched');
        api.transitionCampaignStatus(record.id, 'Active')
          .then(() => {
            notify(`Campaign ${record.ref} launched and active.`);
            fetchLiveCRMData();
          })
          .catch(() => notify(`Campaign ${record.ref} marked as Active.`));
        return;
      }
      if (action === 'Pause Campaign') {
        update('campaigns', record.id, { status: 'Paused' }, 'Campaign paused');
        api.transitionCampaignStatus(record.id, 'Paused')
          .then(() => {
            notify(`Campaign ${record.ref} paused.`);
            fetchLiveCRMData();
          })
          .catch(() => notify(`Campaign ${record.ref} marked as Paused.`));
        return;
      }
      if (action === 'Complete Campaign') {
        update('campaigns', record.id, { status: 'Completed' }, 'Campaign completed');
        api.transitionCampaignStatus(record.id, 'Completed')
          .then(() => {
            notify(`Campaign ${record.ref} marked as Completed.`);
            fetchLiveCRMData();
          })
          .catch(() => notify(`Campaign ${record.ref} marked as Completed.`));
        return;
      }
    }
    if (config.entity === 'cases') {
      if (action === 'Resolve Case' || action === 'Mark Resolved') {
        api.transitionCase(record.id, { target_status: 'Resolved', resolution_summary: 'Issue resolved by support engineering' })
          .then(() => {
            notify(`Case ${record.ref} marked as Resolved.`);
            fetchLiveCRMData();
          })
          .catch(err => notify(`Case resolution failed: ${err?.message || 'Error'}`));
        return;
      }
      if (action === 'Close Case') {
        api.transitionCase(record.id, { target_status: 'Closed' })
          .then(() => {
            notify(`Case ${record.ref} closed.`);
            fetchLiveCRMData();
          })
          .catch(err => notify(`Case close failed: ${err?.message || 'Error'}`));
        return;
      }
      if (action === 'Wait for Customer') {
        api.transitionCase(record.id, { target_status: 'Awaiting Customer' })
          .then(() => {
            notify(`Case ${record.ref} placed in Awaiting Customer (SLA paused).`);
            fetchLiveCRMData();
          })
          .catch(err => notify(`Case status update failed: ${err?.message || 'Error'}`));
        return;
      }
    }
    if (config.entity === 'knowledge') {
      if (action === 'Upvote' || action === 'Mark Helpful') {
        api.voteKnowledgeHelpful(record.id)
          .then(() => {
            notify(`Helpful vote recorded for ${record.ref}.`);
            fetchLiveCRMData();
          })
          .catch((err: any) => notify(`Vote failed: ${err?.message || 'Error'}`));
        return;
      }
    }
    if (config.entity === 'leads') {
      if (action === 'Qualify Lead') {
        api.updateLead(record.id, { status: 'Qualified' })
          .then(() => {
            notify(`Lead ${record.ref} marked as Qualified in PostgreSQL.`);
            fetchLiveCRMData();
          })
          .catch(() => {
            transition(record, 'Qualified', 'Lead qualified after discovery review');
          });
        return;
      }
      if (action === 'Convert Lead') {
        setConvertingLead(record);
        return;
      }
      if (action === 'Mark Nurture') {
        api.updateLead(record.id, { status: 'Nurture' })
          .then(() => {
            notify(`Lead ${record.ref} marked for Nurture in PostgreSQL.`);
            fetchLiveCRMData();
          })
          .catch(() => {
            transition(record, 'Nurture');
          });
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
        setSubmitting(true);
        api.submitQuoteForApproval(record.id, 'Discount / Commercial terms sign-off requested')
          .then(async () => {
            notify(`Quote ${record.ref} submitted for managerial approval in PostgreSQL.`);
            await fetchLiveCRMData();
          })
          .catch((err) => {
            notify(`Approval submission failed: ${err?.message || 'Unknown error'}`);
          })
          .finally(() => setSubmitting(false));
        return;
      }
      if (action === 'Approve Quote') {
        setSubmitting(true);
        api.approveQuote(record.id, true, 'Approved by commercial manager')
          .then(async () => {
            notify(`Quote ${record.ref} approved in PostgreSQL.`);
            await fetchLiveCRMData();
          })
          .catch((err) => {
            notify(`Approval failed: ${err?.message || 'Unknown error'}`);
          })
          .finally(() => setSubmitting(false));
        return;
      }
      if (action === 'Reject Quote') {
        setSubmitting(true);
        api.approveQuote(record.id, false, 'Discount outside standard delegation limits')
          .then(async () => {
            notify(`Quote ${record.ref} rejected in PostgreSQL.`);
            await fetchLiveCRMData();
          })
          .catch((err) => {
            notify(`Rejection failed: ${err?.message || 'Unknown error'}`);
          })
          .finally(() => setSubmitting(false));
        return;
      }
      if (action === 'Accept Quote' || action === 'Convert to Sales Order') {
        setSubmitting(true);
        api.acceptQuote(record.id, { notes: 'Accepted by customer and converted to order' })
          .then(async (order) => {
            notify(`Quote ${record.ref} accepted! Sales Order ${order.ref} created in PostgreSQL.`);
            await fetchLiveCRMData();
            navigate('/sales-orders', { state: { openRecordId: order.id } });
          })
          .catch((err) => {
            notify(`Quote acceptance failed: ${err?.message || 'Unknown error'}`);
          })
          .finally(() => setSubmitting(false));
        return;
      }
      if (action === 'Revise Quote') {
        setSubmitting(true);
        api.createQuoteRevision(record.id)
          .then(async (revised) => {
            notify(`New revision v${revised.version} created for quote ${record.ref}.`);
            await fetchLiveCRMData();
            setSelectedId(revised.id);
          })
          .catch((err) => {
            notify(`Revision creation failed: ${err?.message || 'Unknown error'}`);
          })
          .finally(() => setSubmitting(false));
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
        api.updateSalesOrder(record.id, { status: 'Confirmed' })
          .then(async () => {
            notify(`Sales order ${record.ref} confirmed in PostgreSQL.`);
            await fetchLiveCRMData();
          })
          .catch(err => notify(`Confirm failed: ${err?.message || 'Unknown error'}`));
        return;
      }
      if (action === 'Check Inventory (ERP Boundary)') {
        notify('Inventory Boundary: 100% Stock Available (Warehouse: Kingston Hub · Reserved line items).');
        return;
      }
      if (action === 'Mark Fulfilled') {
        api.updateSalesOrder(record.id, { status: 'Fulfilled', fulfilment_stage: 'Delivered' })
          .then(async () => {
            notify(`Sales order ${record.ref} fulfilled in PostgreSQL.`);
            await fetchLiveCRMData();
          })
          .catch(err => notify(`Fulfillment update failed: ${err?.message || 'Unknown error'}`));
        return;
      }
      if (action === 'Generate Invoice') {
        setSubmitting(true);
        api.generateInvoiceFromOrder(record.id)
          .then(async (inv) => {
            notify(`Invoice ${inv.ref} generated from sales order ${record.ref} in PostgreSQL.`);
            await fetchLiveCRMData();
            navigate('/invoices', { state: { openRecordId: inv.id } });
          })
          .catch(err => notify(`Invoice generation failed: ${err?.message || 'Unknown error'}`))
          .finally(() => setSubmitting(false));
        return;
      }
    }
    if (config.entity === 'invoices') {
      if (action === 'Record Payment') {
        setSubmitting(true);
        api.recordInvoicePayment(record.id, { amount: record.amount })
          .then(async (inv) => {
            notify(`Payment recorded for ${inv.ref}. Balance due: $${inv.balance_due}. Status: ${inv.status}.`);
            await fetchLiveCRMData();
          })
          .catch(err => notify(`Record payment failed: ${err?.message || 'Unknown error'}`))
          .finally(() => setSubmitting(false));
        return;
      }
      if (action === 'Mark Void') {
        api.updateInvoice(record.id, { status: 'Void' })
          .then(async () => {
            notify(`Invoice ${record.ref} marked as Void in PostgreSQL.`);
            await fetchLiveCRMData();
          })
          .catch(err => notify(`Void failed: ${err?.message || 'Unknown error'}`));
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
    if (action === 'Approve Record' || action === 'Approve & Set Active' || action === 'Set Active') {
      if (config.entity === 'organizations') {
        setSubmitting(true);
        api.updateAccount(record.id, { status: 'Active' })
          .then(async () => {
            notify(`Organization "${record.title}" approved and status set to Active in PostgreSQL.`);
            await fetchLiveCRMData();
          })
          .catch(err => notify(`Approval failed: ${err?.message || 'Unknown error'}`))
          .finally(() => setSubmitting(false));
        return;
      }
      if (config.entity === 'contacts') {
        setSubmitting(true);
        api.updateContact(record.id, { status: 'Active' })
          .then(async () => {
            notify(`Contact "${record.title}" approved and status set to Active in PostgreSQL.`);
            await fetchLiveCRMData();
          })
          .catch(err => notify(`Approval failed: ${err?.message || 'Unknown error'}`))
          .finally(() => setSubmitting(false));
        return;
      }
      transition(record, 'Active', 'Approved by administrator');
      return;
    }
    if (action === 'Reject Record' || action.startsWith('Set ')) {
      const targetStatus = action === 'Reject Record' ? 'Inactive' : action.replace('Set ', '');
      if (config.entity === 'organizations') {
        setSubmitting(true);
        api.updateAccount(record.id, { status: targetStatus })
          .then(async () => {
            notify(`Organization "${record.title}" status updated to ${targetStatus} in PostgreSQL.`);
            await fetchLiveCRMData();
          })
          .catch(err => notify(`Status update failed: ${err?.message || 'Unknown error'}`))
          .finally(() => setSubmitting(false));
        return;
      }
      if (config.entity === 'contacts') {
        setSubmitting(true);
        api.updateContact(record.id, { status: targetStatus })
          .then(async () => {
            notify(`Contact "${record.title}" status updated to ${targetStatus} in PostgreSQL.`);
            await fetchLiveCRMData();
          })
          .catch(err => notify(`Status update failed: ${err?.message || 'Unknown error'}`))
          .finally(() => setSubmitting(false));
        return;
      }
      transition(record, targetStatus, `Status updated to ${targetStatus}`);
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
    if (['organizations', 'contacts'].includes(config.entity)) {
      const acts: string[] = ['Edit Record'];
      if (record.status !== 'Active') {
        acts.push('Approve & Set Active');
      } else {
        acts.push('Set Inactive');
      }
      if (record.status === 'Pending Approval') {
        acts.push('Reject Record');
      }
      acts.push('Duplicate Record');
      return acts;
    }
    if (record.status === 'Pending Approval') return ['Approve Record', 'Reject Record'];
    if (config.entity === 'leads') return record.status === 'Qualified' ? ['Convert Lead', 'Mark Nurture'] : ['Qualify Lead', 'Convert Lead', 'Mark Nurture'];
    if (config.entity === 'opportunities')
      return record.status === 'Closed Won' ? ['Create Project', 'Create Quote'] : record.status === 'Closed Lost' ? ['Create Quote'] : ['Advance Stage', 'Create Quote', 'Close Won', 'Close Lost'];
    if (config.entity === 'quotes')
      return record.status === 'Draft' ? ['Edit Quote', 'Submit for Approval'] : record.status === 'Pending Approval' ? ['Approve Quote', 'Reject Quote'] : record.status === 'Approved' ? ['Accept Quote', 'Revise Quote'] : record.status === 'Accepted' ? ['Convert to Sales Order', 'Revise Quote'] : ['Revise Quote'];
    if (config.entity === 'cases')
      return record.status === 'Resolved' ? ['Close Case'] : record.status === 'Closed' ? [] : ['Start Case', 'Escalate Case', 'Wait for Customer', 'Resolve Case'];
    if (config.entity === 'salesOrders')
      return record.status === 'Draft' ? ['Confirm Order'] : record.status === 'Confirmed' ? ['Check Inventory (ERP Boundary)', 'Mark Fulfilled', 'Generate Invoice'] : ['Generate Invoice'];
    if (config.entity === 'invoices')
      return record.status === 'Paid' ? [] : ['Record Payment', 'Mark Void'];
    if (config.entity === 'campaigns') {
      if (record.status === 'Planning' || record.status === 'Draft') return ['Launch Campaign', 'Edit Record'];
      if (record.status === 'Active' || record.status === 'In Progress') return ['Pause Campaign', 'Complete Campaign', 'Edit Record'];
      if (record.status === 'Paused') return ['Activate Campaign', 'Complete Campaign', 'Edit Record'];
      if (record.status === 'Completed') return ['Launch Campaign', 'Edit Record'];
      return ['Launch Campaign', 'Edit Record'];
    }
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
    if (config.entity === 'milestones') return ['ref', 'title', 'deliverable', 'targetDate', 'priority', 'status'];
    if (config.entity === 'resources') return ['ref', 'title', 'assignee', 'allocation', 'hourlyRate', 'status'];
    if (config.entity === 'costs') return ['ref', 'title', 'category', 'amount', 'dateIncurred', 'status'];
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
    if (key === 'hourlyRate') return `$${record.fields.hourlyRate || record.amount}/h`;
    if (key === 'allocation') return `${record.fields.allocation || 0}%`;
    if (key === 'date' || key === 'closeDate' || key === 'dueDate' || key === 'targetDate' || key === 'dateIncurred') return shortDate(record.fields[key] || record.date);
    if (key === 'score') return <span className="score-value">{record.score ?? record.fields.score ?? '—'}</span>;
    if (key === 'probability') return `${record.probability ?? record.fields.probability ?? 0}%`;
    if (key === 'health') return <StatusPill status={record.fields.health || 'On Track'}/>;
    if (key === 'progress')
      return (
        <span className="progress-cell">
          <i><b style={{ width: `${Math.max(0, Math.min(100, Number(record.fields.progress || 0)))}%` }}/></i>
          {record.fields.progress || 0}%
        </span>
      );
    if (key === 'status') {
      if (['organizations', 'contacts'].includes(config.entity) && record.status !== 'Active') {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
            <StatusPill status={record.status}/>
            <button
              className="btn primary small"
              style={{ padding: '2px 8px', fontSize: 11, background: '#16a34a', borderColor: '#15803d', color: '#fff' }}
              onClick={() => runAction(record, 'Approve & Set Active')}
              title="Manually approve and activate this record in PostgreSQL"
            >
              Approve
            </button>
          </div>
        );
      }
      if (record.status === 'Pending Approval') {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
            <StatusPill status={record.status}/>
            <button
              className="btn primary small"
              style={{ padding: '2px 8px', fontSize: 11, background: '#16a34a', borderColor: '#15803d', color: '#fff' }}
              onClick={() => runAction(record, 'Approve Record')}
              title="Approve this record immediately in PostgreSQL"
            >
              Approve
            </button>
          </div>
        );
      }
      return <StatusPill status={record.status}/>;
    }
    if (key === 'organization') return record.fields.organization || '—';
    return record.fields[key] || (key === 'owner' ? record.owner : undefined) || '—';
  };

  const renderFormModal = () => {
    if (!modal) return null;
    return (
      <div className="overlay" onMouseDown={e => e.target === e.currentTarget && closeModal()}>
        <div className="form-modal">
          <div className="form-modal-head">
            <div>
              <span className="eyebrow">{editingId ? 'EDIT RECORD' : 'NEW RECORD'}</span>
              <h2>{editingId ? 'Edit' : 'Create'} {activeModalConfig.title.replace(/s$/, '').replace(/ Management$/, '')}</h2>
              <p>Complete the relevant business attributes. Required fields are marked.</p>
            </div>
            <button className="icon-close" onClick={closeModal}><X size={18}/></button>
          </div>
          <div className="form-modal-body">
            <div className="form-grid">
              {activeModalConfig.fields.map(field => {
                if (
                  (activeModalEntity === 'contacts' && field.key === 'organization') ||
                  (activeModalEntity === 'opportunities' && field.key === 'customer') ||
                  (activeModalEntity === 'quotes' && field.key === 'customer') ||
                  (activeModalEntity === 'salesOrders' && field.key === 'customer') ||
                  (activeModalEntity === 'invoices' && field.key === 'customer') ||
                  (activeModalEntity === 'cases' && field.key === 'customer') ||
                  (activeModalEntity === 'projects' && field.key === 'customer')
                ) {
                  return (
                    <OrganizationSelectField
                      key={`${activeModalEntity}-organization-select`}
                      label={field.label}
                      required={field.required}
                      value={form.accountId || ''}
                      organizationName={form.customer || form.organization || ''}
                      accounts={availableAccounts}
                      loading={loadingAccounts}
                      error={accountsFetchError}
                      disabled={submitting}
                      onChange={(accId, accName) => {
                        setForm(old => ({
                          ...old,
                          accountId: accId,
                          customer: accName,
                          organization: accName,
                        }));
                      }}
                      onRefresh={() => fetchLiveCRMData()}
                    />
                  );
                }
                if (activeModalEntity === 'organizations' && field.key === 'parent') {
                  return (
                    <OrganizationSelectField
                      key="organizations-parent-select"
                      label="Parent organization"
                      required={field.required}
                      value={form.parentId || ''}
                      organizationName={form.parent || ''}
                      accounts={editingId ? availableAccounts.filter(a => a.id !== editingId) : availableAccounts}
                      loading={loadingAccounts}
                      error={accountsFetchError}
                      disabled={submitting}
                      onChange={(accId, accName) => {
                        setForm(old => ({
                          ...old,
                          parentId: accId,
                          parent: accName,
                        }));
                      }}
                      onRefresh={() => fetchLiveCRMData()}
                    />
                  );
                }
                return (
                  <FormField
                    key={field.key}
                    field={field}
                    value={form[field.key] || ''}
                    onChange={v => setForm(old => ({ ...old, [field.key]: v }))}
                  />
                );
              })}
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
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 mx-5 mb-3">
              {formError}
            </div>
          )}
          <div className="form-modal-footer">
            <button className="btn secondary" disabled={submitting} onClick={closeModal}>Cancel</button>
            {['quotes', 'salesOrders', 'purchaseOrders', 'decisions', 'discounts', 'organizations'].includes(activeModalEntity) ? (
              <>
                <button className="btn secondary" disabled={submitting} onClick={() => saveRecord(false)}>
                  {submitting ? 'Saving...' : 'Save draft'}
                </button>
                <button className="btn primary" disabled={submitting} onClick={() => saveRecord(true)}>
                  <Send size={15}/> {submitting ? 'Submitting...' : 'Submit for approval'}
                </button>
                {activeModalEntity === 'organizations' && (
                  <button
                    className="btn primary"
                    style={{ background: '#16a34a', borderColor: '#15803d', color: '#fff' }}
                    disabled={submitting}
                    onClick={() => saveRecord('Active')}
                  >
                    <BadgeCheck size={15}/> {submitting ? 'Approving...' : 'Approve & Activate'}
                  </button>
                )}
              </>
            ) : (
              <button className="btn primary" disabled={submitting} onClick={() => saveRecord(false)}>
                <Check size={15}/> {submitting ? 'Saving...' : editingId ? 'Save Changes' : `Create ${activeModalConfig.title.replace(/s$/, '')}`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCommModal = () => {
    if (!activeComm) return null;
    return (
      <CommunicationModal
        type={activeComm}
        prefillTo={commPrefill.to}
        prefillContact={commPrefill.contact}
        prefillAccountId={commPrefill.accountId}
        prefillOrganization={commPrefill.organization}
        onClose={() => setActiveComm(null)}
        onLogged={msg => {
          notify(msg);
          fetchLiveCRMData();
        }}
      />
    );
  };

  const renderToast = () => {
    if (!toast) return null;
    return (
      <div className="inline-toast">
        <Check size={15}/>{toast}
        <button onClick={() => setToast('')}><X size={13}/></button>
      </div>
    );
  };

  // CUSTOMER 360 WORKSPACE RENDER
  if (item.path === '/customers/360') {
    const detailRecord = externalSelected ? externalSelected.record : (selected || null);
    return (
      <div className="workspace-page">
        <SectionHeading
          eyebrow="ESSENTIALS & CUSTOMER 360 / UNIFIED ACCOUNT VIEW"
          title="Customer 360"
          subtitle="Unified customer memory, relationship hierarchy, active commercial records, service cases, implementation projects and AI sentiment."
          action={
            <button className="btn primary" onClick={() => openNew({}, 'organizations')}>
              <Plus size={16}/> New Organization
            </button>
          }
        />
        <Customer360View
          selectedOrgId={selectedId || undefined}
          onSelectOrg={id => setSelectedId(id)}
          onOpenRecord={(entity, recId, recordObj) => {
            const found = recordObj || findByRef(recId) || records(entity).find(r => r.id === recId || r.ref === recId);
            if (found) {
              const rObj = 'record' in found ? found.record : found;
              setExternalSelected({ entity, record: rObj });
              setSelectedId(rObj.id);
            }
          }}
          onNewAction={(entity, prefill) => openNew(prefill, entity)}
          refreshTrigger={dataVersion}
        />
        {detailRecord && (
          <div className="overlay" onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setSelectedId(null);
              setExternalSelected(null);
            }
          }}>
            <aside className="detail-panel">
              <div className="detail-head">
                <div>
                  <span className="eyebrow">{detailRecord.ref}</span>
                  <h2>{detailRecord.title}</h2>
                  <p>{detailRecord.description}</p>
                </div>
                <button className="icon-close" onClick={() => {
                  setSelectedId(null);
                  setExternalSelected(null);
                }}><X size={18}/></button>
              </div>
              <div className="detail-scroll">
                <div className="detail-summary">
                  <div><span>Status</span><StatusPill status={detailRecord.status}/></div>
                  <div><span>Value</span><strong>{money(detailRecord.amount)}</strong></div>
                  <div><span>Owner</span><strong>{detailRecord.owner}</strong></div>
                  <div><span>Date</span><strong>{shortDate(detailRecord.date)}</strong></div>
                </div>
                <div className="detail-section">
                  <div className="detail-fields">
                    {fieldsForRecord(detailRecord).map(f => (
                      <div key={f.label}><span>{f.label}</span><strong>{f.value}</strong></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="detail-actions">
                <button
                  className="btn secondary"
                  onClick={() => openEdit(detailRecord, externalSelected?.entity || modalEntity || config.entity)}
                >
                  Edit Record
                </button>
                {availableActions(detailRecord).map(a => (
                  <button className="btn primary" key={a} onClick={() => runAction(detailRecord, a)}>
                    {a === 'Approve Action' || a === 'Approve Quote' ? <BadgeCheck size={15}/> :
                     a === 'Submit for Approval' ? <Send size={15}/> :
                     a === 'Complete Task' ? <Check size={15}/> : null}
                    {a}
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}
        {renderFormModal()}
        {renderCommModal()}
        {renderToast()}
      </div>
    );
  }

  // ACCOUNT HIERARCHIES WORKSPACE (CR-02)
  if (item.path === '/accounts/hierarchies' || item.path === '/admin/hierarchy') {
    return (
      <div className="workspace-page">
        <AccountHierarchiesView
          onOpenRecord={(entity, recordId) => {
            navigate('/organizations', { state: { selectedId: recordId } });
          }}
        />
      </div>
    );
  }

  // DUPLICATE MANAGEMENT & RESOLUTION WORKSPACE (CR-04)
  if (item.path === '/data/duplicates' || item.path === '/admin/duplicates') {
    return (
      <div className="workspace-page">
        <DuplicateManagementView
          onOpenRecord={(entity, recordId) => {
            const targetPath = entity === 'account' ? '/organizations' : `/${entity}s`;
            navigate(targetPath, { state: { selectedId: recordId } });
          }}
        />
      </div>
    );
  }

  // CONSENT MANAGEMENT DEDICATED WORKSPACE
  if (item.path === '/customers/consent') {
    return (
      <div className="workspace-page">
        <ConsentManagementView />
      </div>
    );
  }

  // LEAD CAPTURE DEDICATED WORKSPACE
  if (item.path === '/lead-capture') {
    return (
      <div className="workspace-page">
        <LeadCaptureView
          onLeadCaptured={fetchLiveCRMData}
          onNavigateToConversion={() => navigate('/lead-conversion')}
        />
      </div>
    );
  }

  // LEAD QUALIFICATION DEDICATED WORKSPACE
  if (item.path === '/lead-qualification') {
    return (
      <div className="workspace-page">
        <LeadQualificationView
          onNavigateToConversion={() => navigate('/lead-conversion')}
        />
      </div>
    );
  }

  // LEAD ASSIGNMENT & ROUTING RULES DEDICATED WORKSPACE
  if (item.path === '/lead-assignment') {
    return (
      <div className="workspace-page">
        <LeadAssignmentView />
      </div>
    );
  }

  // LEAD CONVERSION DEDICATED WORKSPACE
  if (item.path === '/lead-conversion') {
    const leadSource = leadsLoaded ? liveLeads : records('leads');
    const eligibleLeads = leadSource.filter(l => l.status !== 'Converted');
    const convertedLeads = leadSource.filter(l => l.status === 'Converted');

    return (
      <div className="workspace-page">
        <SectionHeading
          eyebrow="LEAD CAPTURE & CONVERSIONS / WORKSPACE"
          title="Lead Conversion Engine"
          subtitle="Convert qualified prospects into master corporate accounts, contact personas, and pipeline opportunities with automated duplicate detection."
          action={
            <div className="flex items-center gap-2">
              <button
                className="btn secondary small"
                onClick={fetchLiveCRMData}
                disabled={loadingLive}
              >
                <RefreshCw size={13} className={loadingLive ? 'animate-spin' : ''}/> Refresh Queue
              </button>
              <button
                className="btn primary small flex items-center gap-1.5"
                disabled={eligibleLeads.length === 0}
                onClick={() => {
                  const target = eligibleLeads.find(l => l.status === 'Qualified') || eligibleLeads[0];
                  if (target) setConvertingLead(target);
                }}
              >
                <Sparkles size={14}/> Launch Conversion Wizard
              </button>
            </div>
          }
        />

        {/* Conversion Pipeline KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="panel p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Eligible In Queue</span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block">{eligibleLeads.length}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="panel p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider block">Qualified Ready</span>
              <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                {eligibleLeads.filter(l => l.status === 'Qualified').length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="panel p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-purple-600 font-bold uppercase tracking-wider block">High Fit (≥70)</span>
              <span className="text-2xl font-bold text-purple-700 mt-1 block">
                {eligibleLeads.filter(l => Number(l.score || l.fields?.score || 0) >= 70).length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award size={20} />
            </div>
          </div>
          <div className="panel p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Converted Customers</span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block">{convertedLeads.length}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </div>
        </div>

        <div className="panel p-5 mb-4">
          <div className="panel-heading mb-4 flex items-center justify-between">
            <div>
              <h2>Prospects Ready for Customer Conversion</h2>
              <p>Select any qualified or evaluated lead to initiate the 4-step atomic customer conversion wizard.</p>
            </div>
            <span className="phase-chip">{eligibleLeads.length} prospects in queue</span>
          </div>

          {eligibleLeads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="font-semibold text-slate-700 text-sm">All leads are currently converted into Customer 360 accounts.</p>
              <p className="text-xs text-slate-400 mt-1">To test conversion, create a new prospect or capture inbound leads.</p>
              <button className="btn primary small mt-3" onClick={() => navigate('/lead-capture')}>
                + Inbound Lead Capture
              </button>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>REFERENCE</th>
                    <th>PROSPECT</th>
                    <th>ORGANIZATION</th>
                    <th>SCORE</th>
                    <th>STATUS</th>
                    <th>SOURCE</th>
                    <th>OWNER</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleLeads.map(lead => (
                    <tr key={lead.id}>
                      <td><span className="ref-link font-mono">{lead.ref}</span></td>
                      <td>
                        <b>{lead.title}</b>
                        <small className="block text-slate-400">{lead.fields?.jobTitle || lead.fields?.title || 'Lead'}</small>
                      </td>
                      <td>{lead.fields?.company || lead.fields?.organization || '—'}</td>
                      <td>
                        <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                          Number(lead.score || 0) >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          Number(lead.score || 0) >= 40 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {lead.score || 80}/100
                        </span>
                      </td>
                      <td><StatusPill status={lead.status}/></td>
                      <td>{lead.fields?.source || 'Inbound'}</td>
                      <td>{lead.owner || 'Arjun Mehta'}</td>
                      <td>
                        <button
                          className="btn primary small py-1 text-xs flex items-center gap-1.5"
                          onClick={() => setConvertingLead(lead)}
                        >
                          <Sparkles size={13}/> Convert to Customer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {convertingLead && (
          <LeadConversionModal
            lead={convertingLead}
            onClose={() => setConvertingLead(null)}
            onComplete={(org, con, opp) => {
              setConvertingLead(null);
              fetchLiveCRMData();
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
    return (
      <div className="workspace-page">
        <MySalesDashboardView />
      </div>
    );
  }

  // SALES FORECASTING ENGINE DEDICATED VIEW
  if (item.path === '/sales/forecasting') {
    return (
      <div className="workspace-page">
        <SalesForecastingView />
      </div>
    );
  }

  // SALES ACTIVITIES & NEXT-BEST ACTIONS DEDICATED VIEW
  if (item.path === '/sales/activities') {
    return (
      <div className="workspace-page">
        <SalesActivitiesView />
      </div>
    );
  }

  // COMMERCIAL DISCOUNT MANAGEMENT & MARGIN GOVERNANCE DEDICATED VIEW
  if (item.path === '/discounts') {
    return (
      <div className="workspace-page">
        <DiscountManagementView />
      </div>
    );
  }

  // VENDOR PURCHASE ORDERS & PROCUREMENT DEDICATED VIEW
  if (item.path === '/purchase-orders') {
    return (
      <div className="workspace-page">
        <PurchaseOrdersView />
      </div>
    );
  }

  // UNIFIED INBOX & OMNICHANNEL CHANNELS DEDICATED VIEW
  if (['/inbox', '/communications/email', '/communications/calls', '/communications/sms', '/communications/live-chat', '/meetings'].includes(item.path)) {
    let initialChannel: 'all' | 'email' | 'chat' | 'sms' | 'call' = 'all';
    if (item.path === '/communications/email') initialChannel = 'email';
    else if (item.path === '/communications/calls') initialChannel = 'call';
    else if (item.path === '/communications/sms') initialChannel = 'sms';
    else if (item.path === '/communications/live-chat') initialChannel = 'chat';
    else if (item.path === '/meetings') initialChannel = 'call';

    return (
      <div className="workspace-page">
        <UnifiedInboxView initialChannel={initialChannel} />
      </div>
    );
  }

  // CUSTOMER ACTIVITIES LEDGER DEDICATED VIEW
  if (item.path === '/activities') {
    return (
      <div className="workspace-page">
        <ActivitiesView />
      </div>
    );
  }

  // TEAM COLLABORATION DEDICATED VIEW
  if (item.path === '/collaboration') {
    return (
      <div className="workspace-page">
        <TeamCollaborationView />
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

  // PROJECT DETAILS DEDICATED VIEW
  if (item.path === '/projects/details') {
    return (
      <div className="workspace-page">
        <ProjectDetailsView
          initialProjectId={(location.state as any)?.projectId}
          onNavigateTo={(path, state) => navigate(path, { state })}
        />
      </div>
    );
  }

  // PROJECT MILESTONES DEDICATED VIEW
  if (item.path === '/projects/milestones') {
    return (
      <div className="workspace-page">
        <MilestonesView />
      </div>
    );
  }

  // PROJECT COSTS DEDICATED VIEW
  if (item.path === '/projects/costs') {
    return (
      <div className="workspace-page">
        <ProjectCostsView />
      </div>
    );
  }

  // RESOURCE ALLOCATION DEDICATED VIEW
  if (item.path === '/projects/resources') {
    return (
      <div className="workspace-page">
        <ResourceAllocationView />
      </div>
    );
  }

  // PROJECT ANALYTICS DEDICATED VIEW
  if (item.path === '/projects/analytics') {
    return (
      <div className="workspace-page">
        <ProjectAnalyticsView
          onNavigateTo={(path, state) => navigate(path, { state })}
        />
      </div>
    );
  }

  // SERVICE DASHBOARD DEDICATED VIEW
  if (item.path === '/service' || item.path === '/service/dashboard') {
    return (
      <div className="workspace-page">
        <ServiceDashboardView />
      </div>
    );
  }

  // CASES MANAGEMENT DEDICATED VIEW
  if (item.path === '/cases') {
    return (
      <div className="workspace-page">
        <CasesWorkspaceView />
      </div>
    );
  }

  // SUPPORT QUEUE DEDICATED VIEW
  if (item.path === '/service/queue') {
    return (
      <div className="workspace-page">
        <SupportQueueView />
      </div>
    );
  }

  // SLA MANAGEMENT DEDICATED VIEW
  if (item.path === '/service/sla') {
    return (
      <div className="workspace-page">
        <SLAManagementView />
      </div>
    );
  }

  // BUSINESS HOURS DEDICATED VIEW
  if (item.path === '/service/business-hours') {
    return (
      <div className="workspace-page">
        <BusinessHoursView />
      </div>
    );
  }

  // SUPPORT WEBFORMS DEDICATED VIEW
  if (item.path === '/service/webforms') {
    return (
      <div className="workspace-page">
        <SupportWebformsView />
      </div>
    );
  }

  // APPOINTMENT PAGES DEDICATED VIEW
  if (item.path === '/service/appointments') {
    return (
      <div className="workspace-page">
        <AppointmentPagesView />
      </div>
    );
  }

  // SERVICE ANALYTICS DEDICATED VIEW
  if (item.path === '/service/analytics') {
    return (
      <div className="workspace-page">
        <ServiceAnalyticsView />
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

  // SAAS COMMERCIALIZATION, BILLING & SUBSCRIPTIONS VIEW
  if (item.path === '/admin/integrations') {
    return (
      <div className="workspace-page">
        <BillingWorkspace />
      </div>
    );
  }

  // EMAIL TEMPLATES STUDIO DEDICATED VIEW
  if (item.path === '/marketing/email-templates' || item.path === '/admin/email-templates') {
    return (
      <div className="workspace-page">
        <EmailTemplatesView />
      </div>
    );
  }

  // MARKETING PERFORMANCE & ATTRIBUTION VIEW
  if (item.path === '/marketing/performance') {
    return (
      <div className="workspace-page">
        <MarketingPerformanceView />
      </div>
    );
  }

  // CUSTOMER ENGAGEMENT & LIFECYCLE HUB DEDICATED VIEW
  if (item.path === '/engagement' || item.path === '/marketing/engagement') {
    return (
      <div className="workspace-page">
        <CustomerEngagementView />
      </div>
    );
  }

  // LOYALTY PROGRAMS & REWARDS ENGINE DEDICATED VIEW
  if (item.path === '/loyalty' || item.path === '/marketing/loyalty') {
    return (
      <div className="workspace-page">
        <LoyaltyProgramsView />
      </div>
    );
  }

  // CUSTOMER SURVEYS & CSAT / NPS EXPERIENCE CENTER DEDICATED VIEW
  if (item.path === '/surveys' || item.path === '/service/feedback' || item.path === '/marketing/surveys') {
    return (
      <div className="workspace-page">
        <SurveysCSATView />
      </div>
    );
  }

  // PRODUCT CATALOG DEDICATED VIEW
  if (item.path === '/catalog/products' || item.path === '/products') {
    return (
      <div className="workspace-page">
        <ProductsCatalogView />
      </div>
    );
  }

  // SERVICES CATALOG DEDICATED VIEW
  if (item.path === '/catalog/services' || item.path === '/services') {
    return (
      <div className="workspace-page">
        <ServicesCatalogView />
      </div>
    );
  }

  // CATEGORIES TAXONOMY DEDICATED VIEW
  if (item.path === '/catalog/categories' || item.path === '/categories') {
    return (
      <div className="workspace-page">
        <CategoriesCatalogView />
      </div>
    );
  }

  // BUNDLES COMMERCIAL DEDICATED VIEW
  if (item.path === '/catalog/bundles' || item.path === '/bundles') {
    return (
      <div className="workspace-page">
        <BundlesCatalogView />
      </div>
    );
  }

  // PRODUCT AVAILABILITY & LEAD TIMES DEDICATED VIEW
  if (item.path === '/catalog/availability' || item.path === '/availability') {
    return (
      <div className="workspace-page">
        <ProductAvailabilityView />
      </div>
    );
  }

  // MULTI-JURISDICTION TAX ENGINE DEDICATED VIEW
  if (item.path === '/inventory/taxes' || item.path === '/catalog/tax-management' || item.path === '/catalog/taxes' || item.path === '/taxes') {
    return (
      <div className="workspace-page">
        <TaxManagementView />
      </div>
    );
  }

  // COMMERCIAL TERMS & LEGAL BOILERPLATES DEDICATED VIEW
  if (item.path === '/inventory/terms' || item.path === '/catalog/terms-and-conditions' || item.path === '/catalog/terms' || item.path === '/terms') {
    return (
      <div className="workspace-page">
        <TermsManagementView />
      </div>
    );
  }

  // MULTI-WAREHOUSE STOCK & ATP INVENTORY DEDICATED VIEW
  if (item.path === '/inventory/stock' || item.path === '/catalog/stock-management' || item.path === '/catalog/stock' || item.path === '/stock') {
    return (
      <div className="workspace-page">
        <StockManagementView />
      </div>
    );
  }

  // CERTIFIED VENDORS & SUPPLIERS DIRECTORY DEDICATED VIEW
  if (item.path === '/catalog/vendors' || item.path === '/vendors') {
    return (
      <div className="workspace-page">
        <VendorsCatalogView />
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
            <tr
              key={r.id}
              className="row-click"
              onClick={() => {
                if (config.entity === 'projects') {
                  navigate('/projects/details', { state: { projectId: r.id } });
                  return;
                }
                setSelectedId(r.id);
              }}
            >
              {fieldColumns().map(k => (
                <td key={k}>{cell(r, k)}</td>
              ))}
              <td>
                <button
                  className="row-open"
                  onClick={e => {
                    e.stopPropagation();
                    if (config.entity === 'projects') {
                      navigate('/projects/details', { state: { projectId: r.id } });
                      return;
                    }
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
      {loadingLive ? (
        <div className="p-8 text-center text-xs text-slate-500">
          Loading {config.title.toLowerCase()} from PostgreSQL database...
        </div>
      ) : liveError ? (
        <div className="p-6 m-4 bg-red-50 text-red-700 text-xs rounded border border-red-200">
          <strong>Database Connection Warning:</strong> {liveError}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={isLiveCRMEntity ? `No ${config.title.toLowerCase()} found` : undefined}
          description={isLiveCRMEntity ? `This tenant has no ${config.title.toLowerCase()} yet. Create your first record above.` : undefined}
        />
      ) : null}
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
          {['organizations', 'contacts'].includes(config.entity) && selected.status !== 'Active' ? (
            <div style={{
              background: selected.status === 'Pending Approval' ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: `1px solid ${selected.status === 'Pending Approval' ? '#fcd34d' : '#86efac'}`,
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {selected.status === 'Pending Approval' ? (
                  <Clock3 size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                ) : (
                  <ShieldCheck size={18} style={{ color: '#15803d', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: selected.status === 'Pending Approval' ? '#92400e' : '#14532d' }}>
                    {selected.status === 'Pending Approval' ? 'Awaiting Operational Approval' : `Current Status: ${selected.status}`}
                  </div>
                  <div style={{ fontSize: 11, color: selected.status === 'Pending Approval' ? '#b45309' : '#166534' }}>
                    Manually approve to change status to Active and enable full CRM operations.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn primary"
                  style={{ background: '#16a34a', borderColor: '#15803d', color: '#fff', fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => runAction(selected, 'Approve & Set Active')}
                >
                  <BadgeCheck size={14} /> Approve & Set Active
                </button>
                {selected.status === 'Pending Approval' && (
                  <button
                    className="btn secondary"
                    style={{ borderColor: '#f87171', color: '#dc2626', fontSize: 12, padding: '6px 12px' }}
                    onClick={() => runAction(selected, 'Reject Record')}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ) : selected.status === 'Pending Approval' ? (
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              border: '1px solid #fcd34d',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock3 size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e' }}>Awaiting Operational Approval</div>
                  <div style={{ fontSize: 11, color: '#b45309' }}>Review and approve to activate this record in PostgreSQL.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn primary"
                  style={{ background: '#16a34a', borderColor: '#15803d', color: '#fff', fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => runAction(selected, 'Approve Record')}
                >
                  <BadgeCheck size={14} /> Approve Record
                </button>
                <button
                  className="btn secondary"
                  style={{ borderColor: '#f87171', color: '#dc2626', fontSize: 12, padding: '6px 12px' }}
                  onClick={() => runAction(selected, 'Reject Record')}
                >
                  Reject
                </button>
              </div>
            </div>
          ) : null}

          <div className="detail-summary">
            <div>
              <span>Current status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <StatusPill status={selected.status}/>
                {['organizations', 'contacts'].includes(config.entity) && (
                  <select
                    value={selected.status}
                    style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', fontWeight: 600 }}
                    onChange={e => {
                      const newStatus = e.target.value;
                      if (newStatus !== selected.status) {
                        runAction(selected, newStatus === 'Active' ? 'Approve & Set Active' : `Set ${newStatus}`);
                      }
                    }}
                    title="Manually change record status in PostgreSQL"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Draft">Draft</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                )}
              </div>
            </div>
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
            <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1.5">
                <Activity size={14} className="text-blue-600" />
                Log Customer Outreach:
              </span>
              <button
                className="btn secondary small flex items-center gap-1"
                onClick={() => {
                  const targetAccountId = config.entity === 'organizations' ? selected.id : (selected.fields.accountId || selected.links.organizations?.[0] || '');
                  setCommPrefill({
                    to: selected.fields.email,
                    contact: config.entity === 'contacts' ? selected.title : undefined,
                    accountId: targetAccountId,
                    organization: config.entity === 'organizations' ? selected.title : selected.fields.organization,
                  });
                  setActiveComm('email');
                }}
              >
                <Mail size={13} className="text-blue-600" /> Email
              </button>
              <button
                className="btn secondary small flex items-center gap-1"
                onClick={() => {
                  const targetAccountId = config.entity === 'organizations' ? selected.id : (selected.fields.accountId || selected.links.organizations?.[0] || '');
                  setCommPrefill({
                    to: selected.fields.email,
                    contact: config.entity === 'contacts' ? selected.title : undefined,
                    accountId: targetAccountId,
                    organization: config.entity === 'organizations' ? selected.title : selected.fields.organization,
                  });
                  setActiveComm('call');
                }}
              >
                <Phone size={13} className="text-emerald-600" /> Call
              </button>
              <button
                className="btn secondary small flex items-center gap-1"
                onClick={() => {
                  const targetAccountId = config.entity === 'organizations' ? selected.id : (selected.fields.accountId || selected.links.organizations?.[0] || '');
                  setCommPrefill({
                    to: selected.fields.email,
                    contact: config.entity === 'contacts' ? selected.title : undefined,
                    accountId: targetAccountId,
                    organization: config.entity === 'organizations' ? selected.title : selected.fields.organization,
                  });
                  setActiveComm('sms');
                }}
              >
                <MessageCircle size={13} className="text-indigo-600" /> SMS
              </button>
              <button
                className="btn secondary small flex items-center gap-1"
                onClick={() => {
                  const targetAccountId = config.entity === 'organizations' ? selected.id : (selected.fields.accountId || selected.links.organizations?.[0] || '');
                  setCommPrefill({
                    to: selected.fields.email,
                    contact: config.entity === 'contacts' ? selected.title : undefined,
                    accountId: targetAccountId,
                    organization: config.entity === 'organizations' ? selected.title : selected.fields.organization,
                  });
                  setActiveComm('meeting');
                }}
              >
                <CalendarDays size={13} className="text-purple-600" /> Meeting
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
            <span>Verified enterprise record. Transactions and status transitions are committed to multi-tenant storage with immutable audit logging.</span>
          </div>
        </div>

        <div className="detail-actions">
          <button className="btn secondary" onClick={() => openEdit(selected)}>Edit record</button>
          {availableActions(selected).map(a => (
            <button
              className={a === 'Reject Record' || a === 'Reject Action' ? 'btn secondary' : 'btn primary'}
              style={
                a === 'Approve Record' || a === 'Approve Action' || a === 'Approve Quote'
                  ? { background: '#16a34a', borderColor: '#15803d', color: '#fff' }
                  : a === 'Reject Record' || a === 'Reject Action'
                  ? { borderColor: '#f87171', color: '#dc2626' }
                  : undefined
              }
              key={a}
              onClick={() => runAction(selected, a)}
            >
              {a === 'Approve Action' || a === 'Approve Quote' || a === 'Approve Record' ? <BadgeCheck size={15}/> :
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
                  disabled={submitting}
                  onClick={async () => {
                    if (config.entity === 'organizations') {
                      setSubmitting(true);
                      try {
                        await api.deleteAccount(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Organization archived in PostgreSQL database.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'contacts') {
                      setSubmitting(true);
                      try {
                        await api.deleteContact(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Contact archived in PostgreSQL database.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'leads') {
                      setSubmitting(true);
                      try {
                        await api.deleteLead(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Lead archived in PostgreSQL database.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'opportunities') {
                      setSubmitting(true);
                      try {
                        await api.deleteOpportunity(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Opportunity archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'priceBooks') {
                      setSubmitting(true);
                      try {
                        await api.deletePriceBook(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Price book archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'products') {
                      setSubmitting(true);
                      try {
                        await api.deleteProduct(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Product archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'quotes') {
                      setSubmitting(true);
                      try {
                        await api.deleteQuote(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Quote archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'salesOrders') {
                      setSubmitting(true);
                      try {
                        await api.deleteSalesOrder(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Sales order archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'invoices') {
                      setSubmitting(true);
                      try {
                        await api.deleteInvoice(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Invoice archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'campaigns') {
                      setSubmitting(true);
                      try {
                        await api.deleteCampaign(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Campaign archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'segments') {
                      setSubmitting(true);
                      try {
                        await api.deleteSegment(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Segment archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (item.path === '/marketing/email-templates') {
                      setSubmitting(true);
                      try {
                        await api.deleteEmailTemplate(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Email template archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'cases') {
                      setSubmitting(true);
                      try {
                        await api.deleteCase(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Service case archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'slaPolicies' || item.path === '/service/sla') {
                      setSubmitting(true);
                      try {
                        await api.deleteSLAPolicy(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('SLA policy archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'knowledge') {
                      setSubmitting(true);
                      try {
                        await api.deleteKnowledgeArticle(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Knowledge article archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    if (config.entity === 'surveys' || item.path === '/surveys' || item.path === '/service/feedback') {
                      setSubmitting(true);
                      try {
                        await api.deleteSurvey(selected.id);
                        await fetchLiveCRMData();
                        setSelectedId(null);
                        setConfirmDelete(false);
                        notify('Survey archived in PostgreSQL.');
                      } catch (err: any) {
                        notify(`Delete failed: ${err?.message || 'Unknown error'}`);
                      } finally {
                        setSubmitting(false);
                      }
                      return;
                    }
                    remove(config.entity, selected.id);
                    setSelectedId(null);
                    setConfirmDelete(false);
                    notify('Record moved to recycle bin.');
                  }}
                >
                  {submitting ? 'Archiving...' : 'Confirm delete'}
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

      {isLiveCRMEntity ? (
        <div className="demo-strip" style={{ borderColor: 'rgba(5, 150, 105, 0.4)', background: 'linear-gradient(90deg, rgba(236, 253, 245, 0.95), rgba(240, 253, 250, 0.85))' }}>
          <span className="demo-strip-icon" style={{ color: '#059669' }}><ShieldCheck size={16}/></span>
          <div>
            <strong style={{ color: '#065f46' }}>Enterprise CRM Tier · PostgreSQL RLS Enforced</strong>
            <p style={{ color: '#047857' }}>Production database storage active. Records are isolated with tenant Row-Level Security policies. Changes are committed directly to PostgreSQL.</p>
          </div>
          <span className="demo-tag" style={{ background: '#059669', color: '#fff' }}>LIVE DB</span>
        </div>
      ) : (
        <div className="demo-strip">
          <span className="demo-strip-icon"><ShieldCheck size={16}/></span>
          <div>
            <strong>Operational Workspace · Active Records</strong>
            <p>Records, commercial workflows, approvals and lifecycle states are verified and synchronized across the enterprise customer lifecycle.</p>
          </div>
          <span className="demo-tag" style={{ background: '#2563eb', color: '#fff' }}>ACTIVE</span>
        </div>
      )}

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
          {isLiveCRMEntity ? (
            <span style={{ color: '#059669', fontWeight: 600 }}>
              PostgreSQL Core Storage · Tenant-isolated with Row-Level Security
            </span>
          ) : (
            <span>Multi-tenant verified storage · Enterprise session active</span>
          )}
        </div>
      </section>

      {selected && detailPanel}

      {renderFormModal()}

      {/* LEAD CONVERSION MODAL */}
      {convertingLead && (
        <LeadConversionModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onComplete={(org, con, opp) => {
            setConvertingLead(null);
            fetchLiveCRMData();
            navigate('/customers/360', { state: { openRecordId: org.id } });
            notify(`Lead successfully converted into ${org.ref}, ${con.ref} and ${opp.ref}.`);
          }}
        />
      )}

      {renderCommModal()}

      {renderToast()}
    </div>
  );
}

function FormField({ field, value, onChange }: { field: FieldDef; value: string; onChange: (value: string) => void }) {
  return (
    <label className={field.wide ? 'wide' : ''}>
      <span className="field-label-text">
        {field.label}
        {field.required && <em className="required-asterisk"> *</em>}
      </span>
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
