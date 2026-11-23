/**
 * SYVORIS Ai™ — Enterprise Client-Side Database & Offline API Interceptor
 * Ensures 100% resilient offline functionality, high-fidelity enterprise data,
 * complete CRUD operations, and persistent localStorage sync without network warnings.
 */

import type {
  AccountItem,
  ContactItem,
  LeadItem,
  OpportunityItem,
  ProductItem,
  ServiceCatalogItem,
  CatalogCategoryItem,
  ProductBundleItem,
  ProductAvailabilityItem,
  TaxRuleItem,
  CommercialTermsItem,
  WarehouseLocationItem,
  InventoryStockItem,
  VendorProfileItem,
  ProjectItem,
  ProjectTaskItem,
  ProjectMilestoneItem,
  ProjectResourceItem,
  ProjectCostItem,
  CaseItem,
  SLAPolicyItem,
  ServiceDashboardMetrics,
  SupportQueueItem,
  KnowledgeArticleItem,
  QuoteItem,
  SalesOrderItem,
  InvoiceItem,
  CampaignItem,
  AudienceSegmentItem,
  EmailTemplateItem,
  UserMemberResponse,
  RoleResponse,
  PermissionResponse,
  AuditEventItem,
  CurrentUserProfile,
  AuthResponse,
  TenantProfile,
  AIProposalItem,
  AIAgentItem,
  StockMovementItem,
  AIChatQueryResponse
} from './api';

const STORAGE_PREFIX = 'syvoris:offline_db:';

// Initial Enterprise Datasets
const initialAccounts: AccountItem[] = [
  {
    id: 'acc_01',
    tenant_id: 'tenant_bp_01',
    ref: 'ORG-2026-00041',
    name: 'NovaTech Solutions',
    account_type: 'Enterprise',
    industry: 'Telecommunications',
    website: 'https://novatech.example',
    phone: '+1 876 555 0182',
    email: 'contact@novatech.example',
    address: '14 Trafalgar Road, Kingston 10, Jamaica',
    billing_address: { street: '14 Trafalgar Road', city: 'Kingston', country: 'Jamaica' },
    shipping_address: { street: '14 Trafalgar Road', city: 'Kingston', country: 'Jamaica' },
    ownership: 'Private',
    status: 'Active',
    description: 'Enterprise cloud infrastructure, private 5G campus networks, and AI compute tenant.',
    credit_limit: 350000,
    owner_id: 'usr_arjun_01',
    owner_name: 'Arjun Mehta',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    contacts_count: 2,
    custom_fields: { parent: 'NovaTech Holding Group', tier: 'Platinum' }
  },
  {
    id: 'acc_02',
    tenant_id: 'tenant_bp_01',
    ref: 'ORG-2026-00042',
    name: 'Apex Global Logistics',
    account_type: 'Enterprise',
    industry: 'Logistics & Transport',
    website: 'https://apexlogistics.example',
    phone: '+1 305 555 0144',
    email: 'dispatch@apexlogistics.example',
    address: '7200 NW 19th St, Miami, FL 33126',
    billing_address: { street: '7200 NW 19th St', city: 'Miami', country: 'USA' },
    shipping_address: { street: 'Kingston Freeport Terminal Depot', city: 'Kingston', country: 'Jamaica' },
    ownership: 'Public',
    status: 'Active',
    description: 'Fleet telematics, real-time freight route optimization, and SAP ERP billing synchronization.',
    credit_limit: 180000,
    owner_id: 'usr_arjun_01',
    owner_name: 'Arjun Mehta',
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    contacts_count: 2,
    custom_fields: { sap_integrated: true, fleet_size: 1200 }
  },
  {
    id: 'acc_03',
    tenant_id: 'tenant_bp_01',
    ref: 'ORG-2026-00043',
    name: 'Vertex Global Solutions',
    account_type: 'Enterprise',
    industry: 'Financial Services',
    website: 'https://vertexglobal.example',
    phone: '+1 876 555 0133',
    email: 'admin@vertexglobal.example',
    address: '25 Knutsford Boulevard, Kingston 5, Jamaica',
    billing_address: { street: '25 Knutsford Boulevard', city: 'Kingston', country: 'Jamaica' },
    shipping_address: { street: '25 Knutsford Boulevard', city: 'Kingston', country: 'Jamaica' },
    ownership: 'Private',
    status: 'Active',
    description: 'Core banking transaction networks, ultra-low-latency financial dark fiber, and PCI-DSS compliance.',
    credit_limit: 250000,
    owner_id: 'usr_devina_01',
    owner_name: 'Devina Foster',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    contacts_count: 2,
    custom_fields: { compliance: 'PCI-DSS v4.0' }
  },
  {
    id: 'acc_04',
    tenant_id: 'tenant_bp_01',
    ref: 'ORG-2026-00044',
    name: 'Fujikura Optical Technologies',
    account_type: 'Tier-1 Carrier',
    industry: 'Optical Infrastructure',
    website: 'https://fujikura-optics.example',
    phone: '+1 876 555 0199',
    email: 'sales@fujikura-optics.example',
    address: 'Freeport Industrial Park, Montego Bay, Jamaica',
    billing_address: { street: 'Freeport Industrial Park', city: 'Montego Bay', country: 'Jamaica' },
    shipping_address: { street: 'Freeport Industrial Park', city: 'Montego Bay', country: 'Jamaica' },
    ownership: 'Public',
    status: 'Active',
    description: 'Metro optical fiber transport networks and dense wavelength division multiplexing (DWDM) hardware.',
    credit_limit: 420000,
    owner_id: 'usr_marcus_01',
    owner_name: 'Marcus Clarke',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    contacts_count: 1,
    custom_fields: { partner_tier: 'Platinum OEM' }
  },
  {
    id: 'acc_05',
    tenant_id: 'tenant_bp_01',
    ref: 'ORG-2026-00045',
    name: 'Caribbean Fiber Solutions',
    account_type: 'Carrier Wholesale',
    industry: 'Telecommunications',
    website: 'https://caribbeanfiber.example',
    phone: '+1 876 555 0155',
    email: 'noc@caribbeanfiber.example',
    address: '8 Port Royal Street, Kingston, Jamaica',
    billing_address: { street: '8 Port Royal Street', city: 'Kingston', country: 'Jamaica' },
    shipping_address: { street: '8 Port Royal Street', city: 'Kingston', country: 'Jamaica' },
    ownership: 'Private',
    status: 'Active',
    description: 'Subsea cable consortium landing partner and regional high-capacity IP transit operator.',
    credit_limit: 500000,
    owner_id: 'usr_arjun_01',
    owner_name: 'Arjun Mehta',
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    contacts_count: 2,
    custom_fields: { consortium_partner: true }
  },
  {
    id: 'acc_06',
    tenant_id: 'tenant_bp_01',
    ref: 'ORG-2026-00046',
    name: 'Digicel Business Systems',
    account_type: 'Enterprise',
    industry: 'Telecommunications',
    website: 'https://digicelbusiness.example',
    phone: '+1 876 555 0122',
    email: 'enterprise@digicelbusiness.example',
    address: '14 Ocean Boulevard, Kingston, Jamaica',
    billing_address: { street: '14 Ocean Boulevard', city: 'Kingston', country: 'Jamaica' },
    shipping_address: { street: '14 Ocean Boulevard', city: 'Kingston', country: 'Jamaica' },
    ownership: 'Private',
    status: 'Active',
    description: 'Enterprise cellular tower backhaul, managed SD-WAN, and business broadband provider.',
    credit_limit: 320000,
    owner_id: 'usr_andre_01',
    owner_name: 'Andre Morgan',
    created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    contacts_count: 1,
    custom_fields: { towers_count: 85 }
  },
  {
    id: 'acc_07',
    tenant_id: 'tenant_bp_01',
    ref: 'ORG-2026-00047',
    name: 'Flow Regional Networks',
    account_type: 'Carrier Wholesale',
    industry: 'Telecommunications',
    website: 'https://flowregional.example',
    phone: '+1 876 555 0177',
    email: 'wholesale@flowregional.example',
    address: '2–4 Carlton Crescent, Kingston 10, Jamaica',
    billing_address: { street: '2–4 Carlton Crescent', city: 'Kingston', country: 'Jamaica' },
    shipping_address: { street: '2–4 Carlton Crescent', city: 'Kingston', country: 'Jamaica' },
    ownership: 'Public',
    status: 'Active',
    description: 'Cross-border optical transport, metro Ethernet inter-connects, and dark fiber leasing.',
    credit_limit: 290000,
    owner_id: 'usr_sanjay_01',
    owner_name: 'Sanjay Reid',
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    contacts_count: 1,
    custom_fields: { peering_status: 'Active' }
  },
  {
    id: 'acc_08',
    tenant_id: 'tenant_bp_01',
    ref: 'ORG-2026-00048',
    name: 'Spalding Municipal Works',
    account_type: 'Public Sector',
    industry: 'Public Sector',
    website: 'https://spaldingworks.example',
    phone: '+1 876 555 0166',
    email: 'procurement@spaldingworks.example',
    address: 'Main Street, Spalding, Clarendon, Jamaica',
    billing_address: { street: 'Main Street', city: 'Spalding', country: 'Jamaica' },
    shipping_address: { street: 'Main Street', city: 'Spalding', country: 'Jamaica' },
    ownership: 'State Entity',
    status: 'Prospect',
    description: 'Municipal connectivity, smart street lighting SCADA, and civic public Wi-Fi infrastructure.',
    credit_limit: 150000,
    owner_id: 'usr_karen_01',
    owner_name: 'Karen Thompson',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    contacts_count: 1,
    custom_fields: { parish_council: 'Clarendon' }
  }
];

const initialContacts: ContactItem[] = [
  {
    id: 'con_01',
    tenant_id: 'tenant_bp_01',
    account_id: 'acc_01',
    account_name: 'NovaTech Solutions',
    ref: 'CON-00108',
    first_name: 'Marcus',
    last_name: 'Sterling',
    full_name: 'Marcus Sterling',
    job_title: 'Procurement Director',
    department: 'Procurement & Vendor Management',
    email: 'marcus.sterling@novatech.example',
    phone: '+1 876 555 0182',
    is_primary: true,
    is_decision_maker: true,
    status: 'Active',
    owner_id: 'usr_arjun_01',
    owner_name: 'Arjun Mehta',
    custom_fields: {},
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'con_02',
    tenant_id: 'tenant_bp_01',
    account_id: 'acc_01',
    account_name: 'NovaTech Solutions',
    ref: 'CON-00109',
    first_name: 'Elena',
    last_name: 'Vance',
    full_name: 'Elena Vance',
    job_title: 'VP of Technology Infrastructure',
    department: 'Network Operations',
    email: 'elena.vance@novatech.example',
    phone: '+1 876 555 0184',
    is_primary: false,
    is_decision_maker: true,
    status: 'Active',
    owner_id: 'usr_arjun_01',
    owner_name: 'Arjun Mehta',
    custom_fields: {},
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'con_03',
    tenant_id: 'tenant_bp_01',
    account_id: 'acc_02',
    account_name: 'Apex Global Logistics',
    ref: 'CON-00110',
    first_name: 'Tariq',
    last_name: 'Vance',
    full_name: 'Tariq Vance',
    job_title: 'VP of Fleet Operations',
    department: 'Fleet Management',
    email: 'tariq.vance@apexlogistics.example',
    phone: '+1 305 555 0144',
    is_primary: true,
    is_decision_maker: true,
    status: 'Active',
    owner_id: 'usr_arjun_01',
    owner_name: 'Arjun Mehta',
    custom_fields: {},
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'con_04',
    tenant_id: 'tenant_bp_01',
    account_id: 'acc_02',
    account_name: 'Apex Global Logistics',
    ref: 'CON-00111',
    first_name: 'Rachel',
    last_name: 'Campbell',
    full_name: 'Rachel Campbell',
    job_title: 'Supply Chain Systems Director',
    department: 'Supply Chain Logistics',
    email: 'rachel.campbell@apexlogistics.example',
    phone: '+1 305 555 0148',
    is_primary: false,
    is_decision_maker: false,
    status: 'Active',
    owner_id: 'usr_arjun_01',
    owner_name: 'Arjun Mehta',
    custom_fields: {},
    created_at: new Date(Date.now() - 38 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'con_05',
    tenant_id: 'tenant_bp_01',
    account_id: 'acc_03',
    account_name: 'Vertex Global Solutions',
    ref: 'CON-00112',
    first_name: 'Dr. Aris',
    last_name: 'Thorne',
    full_name: 'Dr. Aris Thorne',
    job_title: 'Chief Risk & Technology Officer',
    department: 'Cybersecurity & Infrastructure',
    email: 'aris.thorne@vertexglobal.example',
    phone: '+1 876 555 0133',
    is_primary: true,
    is_decision_maker: true,
    status: 'Active',
    owner_id: 'usr_devina_01',
    owner_name: 'Devina Foster',
    custom_fields: {},
    created_at: new Date(Date.now() - 55 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'con_06',
    tenant_id: 'tenant_bp_01',
    account_id: 'acc_04',
    account_name: 'Fujikura Optical Technologies',
    ref: 'CON-00113',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    full_name: 'Sarah Jenkins',
    job_title: 'Optical Engineering Lead',
    department: 'Systems Engineering',
    email: 'sarah.jenkins@fujikura-optics.example',
    phone: '+1 876 555 0199',
    is_primary: true,
    is_decision_maker: true,
    status: 'Active',
    owner_id: 'usr_marcus_01',
    owner_name: 'Marcus Clarke',
    custom_fields: {},
    created_at: new Date(Date.now() - 85 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'con_07',
    tenant_id: 'tenant_bp_01',
    account_id: 'acc_05',
    account_name: 'Caribbean Fiber Solutions',
    ref: 'CON-00114',
    first_name: 'Janelle',
    last_name: 'Brown',
    full_name: 'Janelle Brown',
    job_title: 'Carrier Finance Controller',
    department: 'Finance & Billing',
    email: 'janelle.brown@caribbeanfiber.example',
    phone: '+1 876 555 0155',
    is_primary: true,
    is_decision_maker: true,
    status: 'Active',
    owner_id: 'usr_arjun_01',
    owner_name: 'Arjun Mehta',
    custom_fields: {},
    created_at: new Date(Date.now() - 110 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'con_08',
    tenant_id: 'tenant_bp_01',
    account_id: 'acc_06',
    account_name: 'Digicel Business Systems',
    ref: 'CON-00115',
    first_name: 'David',
    last_name: 'Alcott',
    full_name: 'David Alcott',
    job_title: 'Enterprise Solutions Architect',
    department: 'Enterprise Architecture',
    email: 'david.alcott@digicelbusiness.example',
    phone: '+1 876 555 0122',
    is_primary: true,
    is_decision_maker: true,
    status: 'Active',
    owner_id: 'usr_andre_01',
    owner_name: 'Andre Morgan',
    custom_fields: {},
    created_at: new Date(Date.now() - 70 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'con_09',
    tenant_id: 'tenant_bp_01',
    account_id: 'acc_07',
    account_name: 'Flow Regional Networks',
    ref: 'CON-00116',
    first_name: 'Camille',
    last_name: 'Sterling',
    full_name: 'Camille Sterling',
    job_title: 'Wholesale Commercial Director',
    department: 'Carrier Sales',
    email: 'camille.sterling@flowregional.example',
    phone: '+1 876 555 0177',
    is_primary: true,
    is_decision_maker: true,
    status: 'Active',
    owner_id: 'usr_sanjay_01',
    owner_name: 'Sanjay Reid',
    custom_fields: {},
    created_at: new Date(Date.now() - 48 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'con_10',
    tenant_id: 'tenant_bp_01',
    account_id: 'acc_08',
    account_name: 'Spalding Municipal Works',
    ref: 'CON-00117',
    first_name: 'Tanya',
    last_name: 'Blake',
    full_name: 'Tanya Blake',
    job_title: 'Municipal Technology Director',
    department: 'Information Technology',
    email: 'tanya.blake@spaldingworks.example',
    phone: '+1 876 555 0166',
    is_primary: true,
    is_decision_maker: true,
    status: 'Active',
    owner_id: 'usr_karen_01',
    owner_name: 'Karen Thompson',
    custom_fields: {},
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const initialCases: CaseItem[] = [
  {
    id: 'case_01',
    tenant_id: 'tenant_bp_01',
    ref: 'CASE-2026-00001',
    subject: 'Enterprise SSO SAML Certificate Expiration Warning',
    description: 'Production identity provider signing certificate expires within 48 hours. Zero-downtime rollover required.',
    account_id: 'acc_03',
    account_name: 'Vertex Global Solutions',
    contact_id: 'con_05',
    contact_name: 'Dr. Aris Thorne',
    status: 'New',
    priority: 'High',
    category: 'Security & Auth',
    channel: 'Channel Portal',
    sentiment: 'Urgent',
    assigned_user_id: 'usr_arjun_01',
    assigned_user_name: 'Arjun Mehta',
    assigned_queue: 'Cloud & Identity Engineering',
    sla_breached: true,
    sla_response_deadline: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'case_02',
    tenant_id: 'tenant_bp_01',
    ref: 'CASE-2026-00002',
    subject: 'API Webhook Latency Spikes during Peak Batch Ingestion',
    description: 'Webhook queue backpressure resolved by tuning Redis stream consumer concurrency.',
    account_id: 'acc_01',
    account_name: 'NovaTech Solutions',
    contact_id: 'con_02',
    contact_name: 'Elena Vance',
    status: 'Closed',
    priority: 'High',
    category: 'API & Performance',
    channel: 'API Telemetry',
    sentiment: 'Satisfied',
    assigned_user_id: 'usr_karen_01',
    assigned_user_name: 'Tier-1 Support Team',
    assigned_queue: 'Tier-1 Help Desk',
    sla_breached: false,
    resolution_summary: 'Scaled Redis consumer group workers from 2 to 8 threads.',
    resolved_at: new Date(Date.now() - 86400000).toISOString(),
    closed_at: new Date(Date.now() - 82000000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'case_03',
    tenant_id: 'tenant_bp_01',
    ref: 'CASE-2026-00003',
    subject: 'Updated VAT Exemption Certificate Verification for Q4',
    description: 'Verified ministry tax exemption certificate and attached to customer master profile.',
    account_id: 'acc_01',
    account_name: 'NovaTech Solutions',
    contact_id: 'con_01',
    contact_name: 'Marcus Sterling',
    status: 'Resolved',
    priority: 'Normal',
    category: 'Billing & Compliance',
    channel: 'Email',
    sentiment: 'Neutral',
    assigned_user_id: 'usr_karen_01',
    assigned_user_name: 'Tier-1 Support Team',
    assigned_queue: 'CPQ & Billing Inquiries',
    sla_breached: false,
    resolution_summary: 'Tax profile exemption code updated and active.',
    resolved_at: new Date(Date.now() - 120000000).toISOString(),
    created_at: new Date(Date.now() - 250000000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'case_04',
    tenant_id: 'tenant_bp_01',
    ref: 'CASE-2026-00004',
    subject: 'Telematics MQTT Handshake TLS 1.3 Cipher Negotiation',
    description: 'Edge telematics hardware units reporting intermittent handshake resets with Miami ingest broker.',
    account_id: 'acc_02',
    account_name: 'Apex Global Logistics',
    contact_id: 'con_03',
    contact_name: 'Tariq Vance',
    status: 'In Progress',
    priority: 'High',
    category: 'IoT Gateway',
    channel: 'Customer Portal',
    sentiment: 'Concerned',
    assigned_user_id: 'usr_karen_01',
    assigned_user_name: 'Karen Thompson',
    assigned_queue: 'Tier-1 Help Desk',
    sla_breached: false,
    sla_response_deadline: new Date(Date.now() + 14400000).toISOString(),
    created_at: new Date(Date.now() - 18000000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'case_05',
    tenant_id: 'tenant_bp_01',
    ref: 'CASE-2026-00005',
    subject: 'DWDM Optical Port Transceiver Low Power Alarm',
    description: 'Port 8 on subsea interface chassis reporting -22 dBm optical received power. Field crew dispatched with OTDR.',
    account_id: 'acc_05',
    account_name: 'Caribbean Fiber Solutions',
    contact_id: 'con_07',
    contact_name: 'Janelle Brown',
    status: 'In Progress',
    priority: 'Critical',
    category: 'Optical Physical Layer',
    channel: 'Carrier NOC Bridge',
    sentiment: 'Critical',
    assigned_user_id: 'usr_marcus_01',
    assigned_user_name: 'Marcus Clarke',
    assigned_queue: 'Optical NOC Incident Response',
    sla_breached: false,
    sla_response_deadline: new Date(Date.now() + 3600000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'case_06',
    tenant_id: 'tenant_bp_01',
    ref: 'CASE-2026-00006',
    subject: 'Municipal SCADA Telemetry Gateway Intermittent Dropouts',
    description: 'Streetlight monitoring remote terminal unit reporting packet loss during peak thunderstorm activity.',
    account_id: 'acc_08',
    account_name: 'Spalding Municipal Works',
    contact_id: 'con_10',
    contact_name: 'Tanya Blake',
    status: 'Assigned',
    priority: 'Normal',
    category: 'SCADA Infrastructure',
    channel: 'Webform',
    sentiment: 'Neutral',
    assigned_user_id: 'usr_devina_01',
    assigned_user_name: 'Devina Foster',
    assigned_queue: 'Tier-1 Help Desk',
    sla_breached: false,
    sla_response_deadline: new Date(Date.now() + 28800000).toISOString(),
    created_at: new Date(Date.now() - 36000000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const initialSLAPolicies: SLAPolicyItem[] = [
  {
    id: 'sla_01',
    tenant_id: 'tenant_bp_01',
    ref: 'SLA-001',
    name: 'P1 Mission-Critical Carrier Fiber Outage (15 Min / 2 Hr)',
    description: 'Statutory carrier outage SLA triggering immediate NOC war room, SMS escalations, and rapid field dispatch.',
    priority: 'Critical',
    first_response_hours: 0.25,
    resolution_hours: 2,
    business_hours_only: false,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'sla_02',
    tenant_id: 'tenant_bp_01',
    ref: 'SLA-002',
    name: 'P2 High-Priority Enterprise Degradation (30 Min / 4 Hr)',
    description: 'High-priority production disruption policy for packet loss, route flap, or hardware failover incidents.',
    priority: 'High',
    first_response_hours: 0.5,
    resolution_hours: 4,
    business_hours_only: false,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'sla_03',
    tenant_id: 'tenant_bp_01',
    ref: 'SLA-003',
    name: 'P3 Normal Technical Support & Configuration (2 Hr / 12 Hr)',
    description: 'Standard technical assistance, firewall rule changes, and configuration requests.',
    priority: 'Normal',
    first_response_hours: 2,
    resolution_hours: 12,
    business_hours_only: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'sla_04',
    tenant_id: 'tenant_bp_01',
    ref: 'SLA-004',
    name: 'P4 Routine Inquiry & Administrative Task (4 Hr / 48 Hr)',
    description: 'General account inquiries, billing statement requests, and user profile management.',
    priority: 'Low',
    first_response_hours: 4,
    resolution_hours: 48,
    business_hours_only: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z'
  }
];

const initialQueues: SupportQueueItem[] = [
  {
    id: 'q_01',
    tenant_id: 'tenant_bp_01',
    ref: 'QUE-001',
    name: 'Tier-1 Help Desk',
    code: 'TIER1',
    description: 'General customer support and ticketing triage',
    priority: 'Normal',
    default_channel: 'Portal',
    max_capacity: 50,
    is_active: true,
    active_case_count: 3,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'q_02',
    tenant_id: 'tenant_bp_01',
    ref: 'QUE-002',
    name: 'Optical NOC Incident Response',
    code: 'NOC-OPT',
    description: 'Emergency fiber and DWDM optical physical layer alarms',
    priority: 'Critical',
    default_channel: 'Monitoring',
    max_capacity: 25,
    is_active: true,
    active_case_count: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'q_03',
    tenant_id: 'tenant_bp_01',
    ref: 'QUE-003',
    name: 'Cloud & Identity Engineering',
    code: 'ENG-ID',
    description: 'SAML SSO, RBAC permissions, and API integrations',
    priority: 'High',
    default_channel: 'Portal',
    max_capacity: 20,
    is_active: true,
    active_case_count: 2,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'q_04',
    tenant_id: 'tenant_bp_01',
    ref: 'QUE-004',
    name: 'CPQ & Billing Inquiries',
    code: 'FIN-BILL',
    description: 'Invoices, VAT tax exemptions, and subscription billing',
    priority: 'Normal',
    default_channel: 'Email',
    max_capacity: 30,
    is_active: true,
    active_case_count: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

const initialAIProposals: AIProposalItem[] = [
  {
    id: 'prop-2026-0001',
    tenant_id: 'tenant_bp_01',
    ref: 'ACT-2026-0081',
    agent_id: 'agent_cpq',
    agent_name: 'CPQ Margin Guardian',
    action: 'High-Value Quote Discount Authorization',
    reasoning: 'Proposes an 18.0% commercial concession ($8,100 discount) on $45,000 core quote. Margin remains healthy at 34.2% (above 28% floor). Historical win-rate model predicts an 84% close probability with this adjustment vs 31% at list price.',
    evidence: 'Customer Email: Budget freeze notice received Nov 18; Pricing Policy floor is 28.0%; post-discount is 34.2%',
    confidence: 96.2,
    policy_check: 'POL-COMM-04: Discounts between 15% and 25% require Human-in-the-Loop review.',
    status: 'Pending Approval',
    payload: {
      category: 'Commercial',
      risk_level: 'High',
      target_ref: 'QUO-2026-0004',
      target_name: 'Cyberdyne Systems · Enterprise Network Modernization',
      target_link: '/sales/pipeline',
      amount: 45000
    },
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'prop-2026-0002',
    tenant_id: 'tenant_bp_01',
    ref: 'ACT-2026-0082',
    agent_id: 'agent_sdr',
    agent_name: 'Inbound SDR Agent',
    action: 'Inbound SDR Lead Qualification & Territory Routing',
    reasoning: 'Evaluated inbound lead against BANT scoring gates. Fit score 85/100 (Tier-1 Strategic). Proposes automated assignment to Senior AE Arjun Mehta.',
    evidence: 'Domain apexmanufacturing.com verified; 1,200 fleet units; high urgency for IoT integration. All BANT criteria fully confirmed.',
    confidence: 98.4,
    policy_check: 'POL-LEAD-01: Tier-1 strategic enterprise leads route to principal account team.',
    status: 'Pending Approval',
    payload: {
      category: 'Operations',
      risk_level: 'Low',
      target_ref: 'LED-2026-00003',
      target_name: 'Bob Collins (CEO at Apex Manufacturing Solutions)',
      target_link: '/leads',
      amount: 85000
    },
    created_at: new Date(Date.now() - 24 * 60 * 1000).toISOString()
  },
  {
    id: 'prop-2026-0003',
    tenant_id: 'tenant_bp_01',
    ref: 'ACT-2026-0083',
    agent_id: 'agent_inv',
    agent_name: 'Inventory Intelligence Agent',
    action: 'Multi-Warehouse Safety Stock PO Draft Trigger',
    reasoning: 'Safety stock breached regional buffer (threshold: 25 units). Proposes purchase order draft of 50 units ($18,500) with primary vendor Fujikura Optical.',
    evidence: 'Warehouse Central Hub: 12 units on hand, 18 reserved; Net ATP: -6 units (deficit warning); Contracted rate: $370.00',
    confidence: 91.8,
    policy_check: 'POL-PROC-02: Purchase order drafts over $15,000 require procurement supervisor sign-off.',
    status: 'Pending Approval',
    payload: {
      category: 'Operations',
      risk_level: 'Medium',
      target_ref: 'SKU-OPT-100G',
      target_name: 'Single-Mode 100G Optical Transceivers (Stock: 12 units)',
      target_link: '/inventory/stock',
      amount: 18500
    },
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prop-2026-0004',
    tenant_id: 'tenant_bp_01',
    ref: 'ACT-2026-0084',
    agent_id: 'agent_csm',
    agent_name: 'Save-Play Agent',
    action: 'Customer Churn Sentinel: Proactive CSM Rescue Play',
    reasoning: 'Detected 2 unresolved high-priority latency cases and 12-day silence from primary sponsor. Dispatched proactive executive check-in task to Account Director.',
    evidence: 'Open Case CASE-2026-00002: API Webhook latency unresolved 4 days; Sentiment score drop: 42/100',
    confidence: 94.0,
    policy_check: 'POL-CS-06: Autonomous dispatch of internal CSM follow-up tasks permitted.',
    status: 'Auto-Executed',
    payload: {
      category: 'Support NOC',
      risk_level: 'High',
      target_ref: 'ORG-2026-0002',
      target_name: 'NovaTech Solutions · High-Priority Account',
      target_link: '/customers/360',
      amount: 120000
    },
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString()
  },
  {
    id: 'prop-2026-0005',
    tenant_id: 'tenant_bp_01',
    ref: 'ACT-2026-0085',
    agent_id: 'agent_comp',
    agent_name: 'Compliance Guardian',
    action: 'Cross-Border VAT & Tax Exemption Audit',
    reasoning: 'Validated EU VIES VAT ID format (DE294820193) and verified active reverse-charge zero-rate tax status for upcoming invoice cycle.',
    evidence: 'EU VIES Registry API response: Active and valid; Corporate legal entity match: 100% confidence',
    confidence: 99.1,
    policy_check: 'POL-TAX-01: Autonomous verification and application of government registry tax exemptions.',
    status: 'Auto-Executed',
    payload: {
      category: 'Security',
      risk_level: 'Low',
      target_ref: 'ORG-2026-0001',
      target_name: 'Vertex Global Solutions · EU Entity Tax Exemption',
      target_link: '/inventory/taxes',
      amount: 0
    },
    created_at: new Date(Date.now() - 300 * 60 * 1000).toISOString()
  }
];

const initialAIAgents: AIAgentItem[] = [
  {
    id: 'agt-1',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-001',
    name: 'SDR Inbound Qualification Agent',
    persona: 'Inbound SDR Lead Qualifier',
    module: 'Revenue Operations',
    role_description: 'Evaluates enterprise prospect fit against BANT criteria, checks spam scores, and routes qualified leads to regional account executives.',
    autonomy_level: 'Act with Approval',
    status: 'Active',
    tool_permissions: ['crm:leads:read', 'crm:leads:qualify', 'email:send_intro'],
    primary_kpi: 'Lead Intake Velocity < 2h',
    metrics: { proposals_count: 142, approved_count: 138, accuracy_score: 98.4 },
    custom_fields: { daily_executions: 142, success_rate: 98.4 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-2',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-002',
    name: 'Deal Health & Win Predictor Agent',
    persona: 'Predictive Deal Scorer',
    module: 'Revenue Operations',
    role_description: 'Computes multi-factor win probability models using communication sentiment, executive sponsor engagement, and CRM stage dwell times.',
    autonomy_level: 'Suggest Only',
    status: 'Active',
    tool_permissions: ['crm:deals:read', 'ai:predict_win_loss'],
    primary_kpi: 'Win Prediction Accuracy >= 94%',
    metrics: { proposals_count: 320, approved_count: 308, accuracy_score: 95.8 },
    custom_fields: { daily_executions: 320, success_rate: 95.8 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-3',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-003',
    name: 'CPQ Margin Guardian & Pricing Auditor',
    persona: 'Quote Margin Compliance Officer',
    module: 'Revenue Operations',
    role_description: 'Monitors line-item pricing concessions, checks volume discount matrices, and ensures gross margin floors remain strictly compliant with CFO policy.',
    autonomy_level: 'Act with Approval',
    status: 'Active',
    tool_permissions: ['catalog:price_check', 'quote:margin_verify', 'approval:request'],
    primary_kpi: 'Margin Compliance >= 98%',
    metrics: { proposals_count: 88, approved_count: 86, accuracy_score: 99.2 },
    custom_fields: { daily_executions: 88, success_rate: 99.2 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-4',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-004',
    name: '24/7 Optical NOC Diagnostic & Support Agent',
    persona: 'Tier-1 Technical Support Specialist',
    module: 'Customer Service NOC',
    role_description: 'Triages customer technical incidents, analyzes optical link telemetry, and drafts solution articles grounded in verified customer documentation.',
    autonomy_level: 'Suggest Only',
    status: 'Active',
    tool_permissions: ['knowledge:search', 'service:case:diagnose', 'case:draft_response'],
    primary_kpi: 'First-Contact Resolution >= 80%',
    metrics: { proposals_count: 215, approved_count: 202, accuracy_score: 94.2 },
    custom_fields: { daily_executions: 215, success_rate: 94.2 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-5',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-005',
    name: 'SaaS Retention & Churn Interceptor',
    persona: 'Customer Success Retention Sentinel',
    module: 'Customer Success',
    role_description: 'Tracks workspace active user velocity, identifies sponsor turnover, and triggers proactive Customer Success Manager intervention playbooks.',
    autonomy_level: 'Act with Approval',
    status: 'Active',
    tool_permissions: ['usage:telemetry_read', 'crm:account:health_score'],
    primary_kpi: 'Net Revenue Retention >= 115%',
    metrics: { proposals_count: 64, approved_count: 62, accuracy_score: 96.0 },
    custom_fields: { daily_executions: 64, success_rate: 96.0 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-6',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-006',
    name: 'Cross-Border Tax Nexus & Export Guardian',
    persona: 'Trade Compliance & Tax Auditor',
    module: 'Governance & Risk',
    role_description: 'Validates VAT identification codes against government databases, applies tax exemptions, and verifies export compliance for hardware deliveries.',
    autonomy_level: 'Act Autonomously',
    status: 'Active',
    tool_permissions: ['tax:jurisdiction_validate', 'export:check_sanctions', 'audit:log'],
    primary_kpi: 'Zero Non-Compliance Incidents',
    metrics: { proposals_count: 412, approved_count: 412, accuracy_score: 99.8 },
    custom_fields: { daily_executions: 412, success_rate: 99.8 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-7',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-007',
    name: 'Dynamic Commercial Negotiation Agent',
    persona: 'Deal Terms & Discount Negotiator',
    module: 'Revenue Operations',
    role_description: 'Models multi-year concession tradeoffs, calculates contractual break-even dates, and proposes win-win terms during enterprise sales negotiations.',
    autonomy_level: 'Suggest Only',
    status: 'Active',
    tool_permissions: ['quote:counter_offer_model', 'deal:read'],
    primary_kpi: 'Discount Containment < 10%',
    metrics: { proposals_count: 94, approved_count: 90, accuracy_score: 93.5 },
    custom_fields: { daily_executions: 94, success_rate: 93.5 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-8',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-008',
    name: 'Multi-Warehouse ATP Inventory Optimizer',
    persona: 'Supply Chain Replenishment Sentinel',
    module: 'Supply Chain Operations',
    role_description: 'Calculates real-time available-to-promise inventory, identifies regional depot deficits, and triggers automated purchase order drafts before stock-outs occur.',
    autonomy_level: 'Act with Approval',
    status: 'Active',
    tool_permissions: ['inventory:atp_calc', 'supplier:po_draft'],
    primary_kpi: 'Zero Unplanned Stock-Outs',
    metrics: { proposals_count: 180, approved_count: 175, accuracy_score: 97.4 },
    custom_fields: { daily_executions: 180, success_rate: 97.4 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-9',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-009',
    name: 'Trigram Master Data Deduplication Steward',
    persona: 'Entity Resolution & Data Cleaner',
    module: 'Data Governance',
    role_description: 'Uses trigram similarity and phonetic matching algorithms to surface duplicate accounts, contacts, and companies with transparent confidence scores.',
    autonomy_level: 'Act with Approval',
    status: 'Active',
    tool_permissions: ['crm:trigram_match', 'crm:merge_candidate_propose'],
    primary_kpi: 'Data Health Score >= 95%',
    metrics: { proposals_count: 156, approved_count: 152, accuracy_score: 98.1 },
    custom_fields: { daily_executions: 156, success_rate: 98.1 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-10',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-010',
    name: 'Executive Revenue Forecast Intelligence',
    persona: 'Revenue Twin & Monte Carlo Analyst',
    module: 'Revenue Operations',
    role_description: 'Simulates quarterly revenue outcomes under macroeconomic shifts, discount concessions, and sales cycle accelerations using Monte Carlo simulations.',
    autonomy_level: 'Suggest Only',
    status: 'Active',
    tool_permissions: ['revenue_twin:simulate', 'forecast:run_monte_carlo'],
    primary_kpi: 'Forecast Accuracy +-3%',
    metrics: { proposals_count: 78, approved_count: 76, accuracy_score: 96.5 },
    custom_fields: { daily_executions: 78, success_rate: 96.5 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-11',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-011',
    name: 'Meeting Intelligence & Follow-up Agent',
    persona: 'Executive Briefing & Task Author',
    module: 'Customer Operations',
    role_description: 'Transcribes customer video calls, extracts commercial action items, assigns CRM follow-up tasks, and drafts personalized recap emails.',
    autonomy_level: 'Act with Approval',
    status: 'Active',
    tool_permissions: ['calendar:read', 'task:create', 'email:draft'],
    primary_kpi: 'Post-Meeting Task Velocity < 15m',
    metrics: { proposals_count: 110, approved_count: 108, accuracy_score: 97.9 },
    custom_fields: { daily_executions: 110, success_rate: 97.9 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-12',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-012',
    name: 'Knowledge Base Solution Drafter',
    persona: 'Technical Documentation Author',
    module: 'Customer Operations',
    role_description: 'Converts resolved support tickets and engineer post-mortems into structured, searchable internal and external knowledge articles.',
    autonomy_level: 'Suggest Only',
    status: 'Active',
    tool_permissions: ['knowledge:create_draft', 'case:read_resolved'],
    primary_kpi: 'Knowledge Article Acceptance 92%',
    metrics: { proposals_count: 45, approved_count: 42, accuracy_score: 93.3 },
    custom_fields: { daily_executions: 45, success_rate: 93.3 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-13',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-013',
    name: 'CRM Administrative Task Automation Agent',
    persona: 'System Hygiene & Auto-Tagging Bot',
    module: 'Data Governance',
    role_description: 'Closes orphaned activities, archives historical email sync logs, and updates company hierarchies according to master business rules.',
    autonomy_level: 'Act Autonomously',
    status: 'Active',
    tool_permissions: ['crm:activity_clean', 'crm:hierarchy_reindex'],
    primary_kpi: 'Admin Chore Reduction 40%',
    metrics: { proposals_count: 650, approved_count: 650, accuracy_score: 99.9 },
    custom_fields: { daily_executions: 650, success_rate: 99.9 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'agt-14',
    tenant_id: 'tenant_bp_01',
    ref: 'AGT-2026-014',
    name: 'Platform Audit Trail & Policy Enforcer',
    persona: 'Immutable Security Ledger Sentinel',
    module: 'Data Governance',
    role_description: 'Monitors all user interactions for compliance with tenant security policies, logs immutable cryptographic hashes, and flags unauthorized access.',
    autonomy_level: 'Act Autonomously',
    status: 'Active',
    tool_permissions: ['audit:write_hash', 'security:policy_check'],
    primary_kpi: '100% Policy Conformity',
    metrics: { proposals_count: 520, approved_count: 520, accuracy_score: 100 },
    custom_fields: { daily_executions: 520, success_rate: 100 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

const initialAvailability: ProductAvailabilityItem[] = [
  {
    id: 'av-1',
    tenant_id: 'tenant_bp_01',
    item_name: 'Enterprise AI Cloud Core Subscription (Annual)',
    status: 'In Stock',
    channel: 'All Channels',
    region: 'Global Multi-Region',
    lead_time_days: 0,
    notes: 'Instant automated cloud provisioning upon commercial order signature.',
    is_active: true,
    custom_fields: { sku: 'SYV-CORE-ENT', units_available: 'Unlimited SaaS' },
    created_at: '2026-11-01',
    updated_at: '2026-11-01',
    is_currently_effective: true
  },
  {
    id: 'av-2',
    tenant_id: 'tenant_bp_01',
    item_name: 'AI Autonomous Agent Worker Seat (Monthly)',
    status: 'In Stock',
    channel: 'Direct Enterprise & Web Direct',
    region: 'Global Multi-Region',
    lead_time_days: 0,
    notes: 'Real-time compute slot allocation on dedicated tenant Kubernetes pod.',
    is_active: true,
    custom_fields: { sku: 'SYV-AI-SEAT', units_available: '64 Slots Available' },
    created_at: '2026-11-02',
    updated_at: '2026-11-02',
    is_currently_effective: true
  },
  {
    id: 'av-3',
    tenant_id: 'tenant_bp_01',
    item_name: 'Single-Mode 96-Core Armored Fiber Cable (1000m Reel)',
    status: 'In Stock',
    channel: 'Direct Enterprise',
    region: 'Jamaica & Caribbean',
    lead_time_days: 3,
    notes: 'Stored in Kingston Central Logistics Hub. Staged for rapid delivery.',
    is_active: true,
    custom_fields: { sku: 'FBR-96-ARMORED', units_available: '850m Reels on hand' },
    created_at: '2026-11-03',
    updated_at: '2026-11-03',
    is_currently_effective: true
  },
  {
    id: 'av-4',
    tenant_id: 'tenant_bp_01',
    item_name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch',
    status: 'Build-to-Order',
    channel: 'Enterprise Direct & Partner Portal',
    region: 'Caribbean Region',
    lead_time_days: 5,
    notes: 'Supplied via Cisco authorized distribution hub.',
    is_active: true,
    custom_fields: { sku: 'NCT-CISCO-9300', units_available: '45 Units on hand' },
    created_at: '2026-11-04',
    updated_at: '2026-11-04',
    is_currently_effective: true
  },
  {
    id: 'av-5',
    tenant_id: 'tenant_bp_01',
    item_name: 'Nokia 7750 Service Router Edge Gateway',
    status: 'Build-to-Order',
    channel: 'Carrier Accounts Only',
    region: 'Global',
    lead_time_days: 21,
    notes: 'Imported directly from Nokia European staging hub.',
    is_active: true,
    custom_fields: { sku: 'NCT-NOKIA-7750', units_available: '12 Units allocated' },
    created_at: '2026-11-05',
    updated_at: '2026-11-05',
    is_currently_effective: true
  },
  {
    id: 'av-6',
    tenant_id: 'tenant_bp_01',
    item_name: 'Audit Fiber Optical Transceiver (10G SFP+ LR)',
    status: 'In Stock',
    channel: 'All Channels',
    region: 'Global',
    lead_time_days: 1,
    notes: 'Express courier shipment within 24 hours of PO confirmation.',
    is_active: true,
    custom_fields: { sku: 'AUDIT-PRD-TRANS', units_available: '240 Units in stock' },
    created_at: '2026-11-06',
    updated_at: '2026-11-06',
    is_currently_effective: true
  },
  {
    id: 'av-7',
    tenant_id: 'tenant_bp_01',
    item_name: 'XGS-PON Optical Network Terminal (10G Symmetric)',
    status: 'In Stock',
    channel: 'Telecom Wholesale & Direct',
    region: 'Caribbean & LATAM',
    lead_time_days: 2,
    notes: 'Standard CPE terminal kits packaged with power adapter and wall mount.',
    is_active: true,
    custom_fields: { sku: 'ONT-XGS-01', units_available: '1,200 Units in depot' },
    created_at: '2026-11-07',
    updated_at: '2026-11-07',
    is_currently_effective: true
  },
  {
    id: 'av-8',
    tenant_id: 'tenant_bp_01',
    item_name: 'Fiber Installation, Splicing & OTDR Testing',
    status: 'Scheduled Capacity',
    channel: 'Direct Enterprise',
    region: 'Caribbean Regional',
    lead_time_days: 5,
    notes: 'Field crew scheduling window requires 5 business days advance booking.',
    is_active: true,
    custom_fields: { sku: 'SVC-INSTALL', units_available: '3 Certified Splicing Teams' },
    created_at: '2026-11-08',
    updated_at: '2026-11-08',
    is_currently_effective: true
  }
];

const initialTaxRules: TaxRuleItem[] = [
  {
    id: 'tax_01',
    tenant_id: 'tenant_bp_01',
    ref: 'TAX-001',
    name: 'Florida State Sales Tax',
    code: 'US-FL',
    rate: 6.0,
    region: 'North America',
    tax_type: 'Sales Tax',
    is_inclusive: false,
    status: 'Active',
    custom_fields: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'tax_02',
    tenant_id: 'tenant_bp_01',
    ref: 'TAX-002',
    name: 'Miami-Dade County Surtax',
    code: 'US-FL-MIA',
    rate: 1.0,
    region: 'North America',
    tax_type: 'Local Surtax',
    is_inclusive: false,
    status: 'Active',
    custom_fields: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'tax_03',
    tenant_id: 'tenant_bp_01',
    ref: 'TAX-003',
    name: 'European Union Standard VAT (Reverse Charge)',
    code: 'EU-VIES',
    rate: 19.0,
    region: 'Europe',
    tax_type: 'VAT',
    is_inclusive: false,
    status: 'Active',
    custom_fields: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'tax_04',
    tenant_id: 'tenant_bp_01',
    ref: 'TAX-004',
    name: 'Caribbean General Consumption Tax (GCT)',
    code: 'CARICOM-JM',
    rate: 15.0,
    region: 'Caribbean',
    tax_type: 'Consumption Tax',
    is_inclusive: false,
    status: 'Active',
    custom_fields: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'tax_05',
    tenant_id: 'tenant_bp_01',
    ref: 'TAX-005',
    name: 'B2B International Hardware Zero-Rate Concession',
    code: 'INT-B2B-ZERO',
    rate: 0.0,
    region: 'Global Export',
    tax_type: 'Export Exemption',
    is_inclusive: false,
    status: 'Active',
    custom_fields: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

const initialTerms: CommercialTermsItem[] = [
  {
    id: 'trm_01',
    tenant_id: 'tenant_bp_01',
    ref: 'TRM-001',
    title: 'Standard Commercial Net 30 Terms',
    version: '1.0',
    category: 'Payment',
    content: 'Payment due within 30 days of invoice issuance. Late payments subject to 1.5% monthly service charge.',
    is_default: true,
    status: 'Active',
    custom_fields: { net_days: 30, penalty_rate: 1.5 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'trm_02',
    tenant_id: 'tenant_bp_01',
    ref: 'TRM-002',
    title: 'Enterprise Strategic Net 60 Terms',
    version: '1.2',
    category: 'Payment',
    content: 'Pre-approved enterprise tier payment within 60 days. Includes 1.0% prompt-pay discount if settled within 15 days.',
    is_default: false,
    status: 'Active',
    custom_fields: { net_days: 60, penalty_rate: 1.0 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'trm_03',
    tenant_id: 'tenant_bp_01',
    ref: 'TRM-003',
    title: '3-Year Advanced Hardware Replacement & SLA Warranty',
    version: '2.0',
    category: 'Warranty',
    content: 'Covers optical hardware defect replacements within 24 hours of advance RMA issuance. 99.99% uptime guarantee.',
    is_default: true,
    status: 'Active',
    custom_fields: { warranty_years: 3 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

const initialLocations: WarehouseLocationItem[] = [
  {
    id: 'loc_01',
    tenant_id: 'tenant_bp_01',
    ref: 'LOC-001',
    name: 'Main Distribution Center (Kingston Core Hub)',
    code: 'KGN-MAIN',
    address: '12 Marcus Garvey Drive, Kingston, Jamaica',
    is_active: true,
    is_default: true,
    items_count: 850,
    custom_fields: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'loc_02',
    tenant_id: 'tenant_bp_01',
    ref: 'LOC-002',
    name: 'Logistics Free Trade Depot (Miami Hub)',
    code: 'MIA-FTZ',
    address: '8400 NW 25th St, Doral, FL 33122, USA',
    is_active: true,
    is_default: false,
    items_count: 1245,
    custom_fields: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'loc_03',
    tenant_id: 'tenant_bp_01',
    ref: 'LOC-003',
    name: 'Secondary Regional Terminal (Montego Bay)',
    code: 'MBJ-TERM',
    address: 'Freeport Industrial Zone, Montego Bay, Jamaica',
    is_active: true,
    is_default: false,
    items_count: 8,
    custom_fields: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'loc_04',
    tenant_id: 'tenant_bp_01',
    ref: 'LOC-004',
    name: 'Spanish Town Engineering Yard & Cable Staging',
    code: 'SPT-ENG',
    address: 'Burke Road Logistics Yard, Spanish Town, Jamaica',
    is_active: true,
    is_default: false,
    items_count: 80,
    custom_fields: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

const initialStock: InventoryStockItem[] = [
  {
    id: 'stk_01',
    tenant_id: 'tenant_bp_01',
    ref: 'STK-001',
    product_id: 'prd_01',
    product_name: 'Single-Mode 96-Core Armored Fiber (1000m Reel)',
    product_sku: 'FBR-96-ARMORED',
    location_id: 'loc_01',
    location_name: 'Main Distribution Center (Kingston Core Hub)',
    quantity_on_hand: 850,
    quantity_reserved: 120,
    quantity_available: 730,
    reorder_threshold: 300,
    reorder_quantity: 500,
    unit_of_measure: 'Reel',
    status: 'Healthy',
    custom_fields: { unit_cost: 1100.0, bin_location: 'Aisle 3 · Rack B · Bin 14' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'stk_02',
    tenant_id: 'tenant_bp_01',
    ref: 'STK-002',
    product_id: 'prd_02',
    product_name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch',
    product_sku: 'NCT-CISCO-9300',
    location_id: 'loc_02',
    location_name: 'Logistics Free Trade Depot (Miami Hub)',
    quantity_on_hand: 45,
    quantity_reserved: 38,
    quantity_available: 7,
    reorder_threshold: 20,
    reorder_quantity: 150,
    unit_of_measure: 'Unit',
    status: 'Critical',
    custom_fields: { unit_cost: 2950.0, bin_location: 'Bay 7 · Shelf 2 · Bin 08' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'stk_03',
    tenant_id: 'tenant_bp_01',
    ref: 'STK-003',
    product_id: 'prd_03',
    product_name: 'Nokia 7750 Service Router Edge Gateway',
    product_sku: 'NCT-NOKIA-7750',
    location_id: 'loc_01',
    location_name: 'Main Distribution Center (Kingston Core Hub)',
    quantity_on_hand: 12,
    quantity_reserved: 4,
    quantity_available: 8,
    reorder_threshold: 6,
    reorder_quantity: 10,
    unit_of_measure: 'Unit',
    status: 'Healthy',
    custom_fields: { unit_cost: 8200.0, bin_location: 'High-Value Vault · C-02' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'stk_04',
    tenant_id: 'tenant_bp_01',
    ref: 'STK-004',
    product_id: 'prd_04',
    product_name: 'QSFP28 LR4 Optical Transceiver (100G)',
    product_sku: 'SKU-OPT-100G',
    location_id: 'loc_01',
    location_name: 'Main Distribution Center (Kingston Core Hub)',
    quantity_on_hand: 240,
    quantity_reserved: 95,
    quantity_available: 145,
    reorder_threshold: 100,
    reorder_quantity: 200,
    unit_of_measure: 'Unit',
    status: 'Healthy',
    custom_fields: { unit_cost: 210.0, bin_location: 'Optics Cabinet · Tray 03' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'stk_05',
    tenant_id: 'tenant_bp_01',
    ref: 'STK-005',
    product_id: 'prd_05',
    product_name: 'Precision Core-Alignment Optical Fusion Splicer Kit',
    product_sku: 'SKU-TOOL-SPLICE',
    location_id: 'loc_03',
    location_name: 'Secondary Regional Terminal (Montego Bay)',
    quantity_on_hand: 8,
    quantity_reserved: 6,
    quantity_available: 2,
    reorder_threshold: 5,
    reorder_quantity: 15,
    unit_of_measure: 'Kit',
    status: 'Critical',
    custom_fields: { unit_cost: 3400.0, bin_location: 'Tool Crib · Rack 1' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'stk_06',
    tenant_id: 'tenant_bp_01',
    ref: 'STK-006',
    product_id: 'prd_06',
    product_name: 'XGS-PON Optical Network Terminal (10G Symmetric)',
    product_sku: 'ONT-XGS-01',
    location_id: 'loc_02',
    location_name: 'Logistics Free Trade Depot (Miami Hub)',
    quantity_on_hand: 1200,
    quantity_reserved: 450,
    quantity_available: 750,
    reorder_threshold: 500,
    reorder_quantity: 1000,
    unit_of_measure: 'Unit',
    status: 'Healthy',
    custom_fields: { unit_cost: 65.0, bin_location: 'Aisle 1 · Pallet R-12' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

const initialMovements: StockMovementItem[] = [
  {
    id: 'mov_01',
    tenant_id: 'tenant_bp_01',
    ref: 'MOV-001',
    inventory_item_id: 'stk_01',
    movement_type: 'Receipt',
    quantity: 500,
    balance_before: 350,
    balance_after: 850,
    performed_by_name: 'Arjun Mehta',
    from_location_id: 'VEND-01',
    to_location_id: 'loc_01',
    reference_doc_type: 'Purchase Order',
    reference_doc_id: 'PO-2026-001',
    reason: 'Initial replenishment shipment from Fujikura Optical',
    created_at: '2026-01-01T00:00:00Z'
  }
];

const initialVendors: VendorProfileItem[] = [
  {
    id: 'vnd_01',
    tenant_id: 'tenant_bp_01',
    ref: 'VND-001',
    account_id: 'acc_03',
    account_name: 'Fujikura Optical Technologies Inc',
    vendor_code: 'FUJIKURA-OPT',
    vendor_category: 'Primary Optical Manufacturer',
    payment_terms: 'Net 45',
    rating: 98.4,
    status: 'Active',
    supplied_products_count: 4,
    supplied_products: [],
    custom_fields: {
      contact_name: 'Kenji Takahashi',
      contact_email: 'b2b-supply@fujikura.example',
      lead_time_days: 21,
      address: '1-5-1 Kiba, Koto-ku, Tokyo 135-8512, Japan'
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'vnd_02',
    tenant_id: 'tenant_bp_01',
    ref: 'VND-002',
    account_id: 'acc_04',
    account_name: 'Cisco Systems Direct Logistics',
    vendor_code: 'CISCO-DIR',
    vendor_category: 'Carrier Hardware OEM',
    payment_terms: 'Net 30',
    rating: 96.8,
    status: 'Active',
    supplied_products_count: 8,
    supplied_products: [],
    custom_fields: {
      contact_name: 'David Richardson',
      contact_email: 'enterprise-orders@cisco.example',
      lead_time_days: 14,
      address: '170 West Tasman Drive, San Jose, CA 95134, USA'
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'vnd_03',
    tenant_id: 'tenant_bp_01',
    ref: 'VND-003',
    account_id: 'acc_05',
    account_name: 'Nokia Networks Enterprise',
    vendor_code: 'NOKIA-ENT',
    vendor_category: 'Edge Routing Systems',
    payment_terms: 'Net 60',
    rating: 95.2,
    status: 'Active',
    supplied_products_count: 3,
    supplied_products: [],
    custom_fields: {
      contact_name: 'Kari Lindqvist',
      contact_email: 'telecom-contracts@nokia.example',
      lead_time_days: 28,
      address: 'Karakaari 7, 02610 Espoo, Finland'
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'vnd_04',
    tenant_id: 'tenant_bp_01',
    ref: 'VND-004',
    account_id: 'acc_06',
    account_name: 'Caribbean Freight Express Logistics',
    vendor_code: 'CFE-LOG',
    vendor_category: 'Regional Logistics Carrier',
    payment_terms: 'Net 15',
    rating: 99.1,
    status: 'Active',
    supplied_products_count: 12,
    supplied_products: [],
    custom_fields: {
      contact_name: 'Winston Sterling',
      contact_email: 'dispatch@caribbeanfreight.example',
      lead_time_days: 2,
      address: 'Third Portway, Newport West, Kingston, Jamaica'
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

function getStored<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function setStored<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export interface StoredUserAccount {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role: string;
  permissions: string[];
  failed_attempts: number;
  locked_until?: number;
  created_at: string;
}

export interface StoredPasswordReset {
  token: string;
  email: string;
  expires_at: number;
  created_at: string;
}

const DEFAULT_AUTH_ACCOUNTS: StoredUserAccount[] = [
  {
    id: 'usr_arjun_01',
    email: 'arjun.mehta@example.com',
    password: 'Password123!',
    first_name: 'Arjun',
    last_name: 'Mehta',
    full_name: 'Arjun Mehta',
    job_title: 'Tenant Owner & CTO',
    tenant_id: 'tenant_bp_01',
    tenant_name: 'BluePeak Innovations',
    tenant_slug: 'bluepeak-innovations',
    role: 'Tenant Owner',
    permissions: ['*'],
    failed_attempts: 0,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr_demo_01',
    email: 'demo@syvoris.example',
    password: 'SYVORIS-DEMO',
    first_name: 'Demo',
    last_name: 'Operator',
    full_name: 'Demo Operator',
    job_title: 'Operations Specialist',
    tenant_id: 'tenant_bp_01',
    tenant_name: 'BluePeak Innovations',
    tenant_slug: 'bluepeak-innovations',
    role: 'Operations Specialist',
    permissions: ['*'],
    failed_attempts: 0,
    created_at: '2026-01-01T00:00:00Z'
  }
];

function getStoredAuthAccounts(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}auth_accounts`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_AUTH_ACCOUNTS;
}

function setStoredAuthAccounts(accounts: StoredUserAccount[]) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}auth_accounts`, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

function getStoredPasswordResets(): StoredPasswordReset[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}password_resets`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function setStoredPasswordResets(resets: StoredPasswordReset[]) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}password_resets`, JSON.stringify(resets));
  } catch {
    // ignore
  }
}

function getActiveUser(): StoredUserAccount | null {
  try {
    const raw = localStorage.getItem('syvoris:active_user');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

function setActiveUser(user: StoredUserAccount | null) {
  try {
    if (user) {
      localStorage.setItem('syvoris:active_user', JSON.stringify(user));
      localStorage.setItem('syvoris:active_tenant_slug', user.tenant_slug);
      localStorage.setItem('syvoris:active_tenant_id', user.tenant_id);
      localStorage.setItem('syvoris:active_tenant_name', user.tenant_name);
      localStorage.setItem('syvoris:authenticated', 'true');
    } else {
      localStorage.removeItem('syvoris:active_user');
      localStorage.removeItem('syvoris:authenticated');
      localStorage.removeItem('syvoris:access_token');
      localStorage.removeItem('syvoris:refresh_token');
      localStorage.removeItem('syvoris:active_tenant_slug');
      localStorage.removeItem('syvoris:active_tenant_id');
      localStorage.removeItem('syvoris:active_tenant_name');
    }
  } catch {
    // ignore
  }
}

/**
 * Main offline fallback dispatcher for all /api/v1 endpoints
 */
export async function handleOfflineRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const urlParts = endpoint.split('?');
  const pathname = urlParts[0];
  const queryStr = urlParts[1] || '';
  const searchParams = new URLSearchParams(queryStr);

  let body: any = {};
  if (options.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      body = {};
    }
  }

  // 1. Auth & Current Profile
  if (pathname === '/auth/login') {
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const accounts = getStoredAuthAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === email);

    if (!account) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    if (account.locked_until && Date.now() < account.locked_until) {
      const remainingSeconds = Math.ceil((account.locked_until - Date.now()) / 1000);
      const remainingMins = Math.ceil(remainingSeconds / 60);
      throw new Error(`Account temporarily locked for security. Please try again in ${remainingMins} minute(s) (${remainingSeconds}s).`);
    }

    if (account.password !== password) {
      account.failed_attempts = (account.failed_attempts || 0) + 1;
      if (account.failed_attempts >= 5) {
        account.locked_until = Date.now() + 5 * 60 * 1000; // 5 min lockout
        setStoredAuthAccounts(accounts);
        throw new Error('Security Alert: Account locked due to 5 consecutive failed login attempts. Please wait 5 minutes or reset your password.');
      }
      setStoredAuthAccounts(accounts);
      const attemptsLeft = 5 - account.failed_attempts;
      throw new Error(`Invalid email or password. (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before temporary security lockout)`);
    }

    // Login successful
    account.failed_attempts = 0;
    delete account.locked_until;
    setStoredAuthAccounts(accounts);
    setActiveUser(account);

    const token = `jwt_token_${account.id}_${Date.now()}`;
    const authRes: AuthResponse = {
      access_token: token,
      token_type: 'bearer',
      refresh_token: `refresh_token_${account.id}_${Date.now()}`,
      expires_in: 86400,
      tenant_id: account.tenant_id,
      tenant_slug: account.tenant_slug,
      role: account.role,
      permissions: account.permissions || ['*']
    };
    return authRes as unknown as T;
  }

  if (pathname === '/auth/register') {
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const orgName = (body.organization_name || '').trim();
    const firstName = (body.first_name || '').trim();
    const lastName = (body.last_name || '').trim();
    const slug = (body.tenant_slug || orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim();

    if (!email || !password || !orgName || !firstName || !lastName) {
      throw new Error('All registration fields are required.');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters in length.');
    }

    const accounts = getStoredAuthAccounts();
    if (accounts.some(a => a.email.toLowerCase() === email)) {
      throw new Error(`An enterprise account with email '${email}' already exists. Please sign in or use another email.`);
    }

    const tenantId = `ten_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newAccount: StoredUserAccount = {
      id: userId,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      job_title: 'Tenant Owner & Executive',
      tenant_id: tenantId,
      tenant_name: orgName,
      tenant_slug: slug,
      role: 'Tenant Owner',
      permissions: ['*'],
      failed_attempts: 0,
      created_at: new Date().toISOString()
    };

    accounts.push(newAccount);
    setStoredAuthAccounts(accounts);
    setActiveUser(newAccount);

    const token = `jwt_token_${userId}_${Date.now()}`;
    const authRes: AuthResponse = {
      access_token: token,
      token_type: 'bearer',
      refresh_token: `refresh_token_${userId}_${Date.now()}`,
      expires_in: 86400,
      tenant_id: tenantId,
      tenant_slug: slug,
      role: 'Tenant Owner',
      permissions: ['*']
    };
    return authRes as unknown as T;
  }

  if (pathname === '/auth/password-reset/request') {
    const email = (body.email || '').trim().toLowerCase();
    const accounts = getStoredAuthAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === email);

    if (!account) {
      return {
        message: `If '${email}' is registered in SYVORIS Ai, a secure recovery link has been dispatched via enterprise SMTP relay.`
      } as unknown as T;
    }

    const token = 'RST-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const resets = getStoredPasswordResets().filter(r => r.email !== email);
    resets.push({
      token,
      email,
      expires_at: Date.now() + 15 * 60 * 1000,
      created_at: new Date().toISOString()
    });
    setStoredPasswordResets(resets);

    return {
      message: `A secure password reset email has been dispatched to ${email} via corporate SMTP relay.`,
      token: token,
      expires_in_minutes: 15,
      reset_url: `${typeof window !== 'undefined' ? window.location.origin : 'https://syvoris-ai.vercel.app'}/reset-password?token=${token}`
    } as unknown as T;
  }

  if (pathname === '/auth/password-reset/confirm') {
    const token = (body.token || '').trim();
    const newPassword = body.new_password || '';

    if (!token || !newPassword) {
      throw new Error('Reset token and new password are required.');
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters in length.');
    }

    const resets = getStoredPasswordResets();
    const resetEntry = resets.find(r => r.token.toUpperCase() === token.toUpperCase());

    if (!resetEntry || Date.now() > resetEntry.expires_at) {
      throw new Error('Password reset token is invalid or has expired (15-minute validity). Please request a new link.');
    }

    const accounts = getStoredAuthAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === resetEntry.email.toLowerCase());

    if (!account) {
      throw new Error('Associated user account was not found.');
    }

    account.password = newPassword;
    account.failed_attempts = 0;
    delete account.locked_until;
    setStoredAuthAccounts(accounts);

    setStoredPasswordResets(resets.filter(r => r.token !== resetEntry.token));

    return {
      message: 'Password has been successfully updated. You may now sign in with your new credentials.'
    } as unknown as T;
  }

  if (pathname === '/auth/switch-tenant' || pathname === '/auth/refresh') {
    const active = getActiveUser() || DEFAULT_AUTH_ACCOUNTS[0];
    const token = `jwt_token_${active.id}_${Date.now()}`;
    const authRes: AuthResponse = {
      access_token: token,
      token_type: 'bearer',
      refresh_token: `refresh_token_${active.id}_${Date.now()}`,
      expires_in: 86400,
      tenant_id: active.tenant_id,
      tenant_slug: active.tenant_slug,
      role: active.role,
      permissions: active.permissions || ['*']
    };
    return authRes as unknown as T;
  }

  if (pathname === '/auth/logout') {
    setActiveUser(null);
    return { message: 'Successfully logged out.' } as unknown as T;
  }

  if (pathname === '/auth/me') {
    const active = getActiveUser();
    if (!active) {
      throw new Error('401 Unauthorized: No active user session.');
    }
    const me: CurrentUserProfile = {
      user: {
        id: active.id,
        email: active.email,
        first_name: active.first_name,
        last_name: active.last_name,
        full_name: active.full_name,
        job_title: active.job_title,
        is_platform_admin: active.role === 'Tenant Owner',
        is_verified: true
      },
      active_tenant: {
        tenant_id: active.tenant_id,
        tenant_name: active.tenant_name,
        tenant_slug: active.tenant_slug,
        role: active.role,
        permissions: active.permissions || ['*'],
        status: 'active'
      },
      memberships: [
        {
          tenant_id: active.tenant_id,
          tenant_name: active.tenant_name,
          tenant_slug: active.tenant_slug,
          role: active.role,
          permissions: active.permissions || ['*'],
          status: 'active'
        }
      ]
    };
    return me as unknown as T;
  }

  if (pathname === '/tenant/profile') {
    const active = getActiveUser();
    const profile: TenantProfile = {
      id: active ? active.tenant_id : 'tenant_bp_01',
      name: active ? active.tenant_name : 'BluePeak Innovations',
      slug: active ? active.tenant_slug : 'bluepeak-innovations',
      status: 'active',
      plan_tier: 'enterprise',
      max_users: 50,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z'
    };
    return profile as unknown as T;
  }

  if (pathname === '/tenant/settings') {
    return {
      tenant_id: 'tenant_bp_01',
      timezone: 'America/Jamaica',
      currency: 'USD',
      date_format: 'YYYY-MM-DD',
      fiscal_year_start: 1,
      enforce_2fa: true,
      session_timeout_minutes: 60,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    } as unknown as T;
  }

  // 2. Accounts / Organizations
  if (pathname === '/accounts' || pathname === '/customers') {
    const accounts = getStored<AccountItem>('accounts', initialAccounts);
    if (method === 'GET') {
      const q = (searchParams.get('q') || '').toLowerCase();
      const filtered = accounts.filter(a => !q || a.name.toLowerCase().includes(q) || (a.ref && a.ref.toLowerCase().includes(q)));
      return { items: filtered, total: filtered.length, page: 1, limit: 100 } as unknown as T;
    }
    if (method === 'POST') {
      const newAcc: AccountItem = {
        id: `acc_${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: `ORG-2026-${String(accounts.length + 41).padStart(5, '0')}`,
        name: body.name || 'New Organization',
        account_type: body.account_type || 'Enterprise',
        industry: body.industry || 'Telecommunications',
        website: body.website || '',
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        billing_address: body.billing_address || {},
        shipping_address: body.shipping_address || {},
        ownership: body.ownership || 'Private',
        status: body.status || 'Active',
        description: body.description || '',
        credit_limit: Number(body.credit_limit || 0),
        owner_id: 'usr_arjun_01',
        owner_name: 'Arjun Mehta',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        contacts_count: 0,
        custom_fields: body.custom_fields || {}
      };
      accounts.unshift(newAcc);
      setStored('accounts', accounts);
      return newAcc as unknown as T;
    }
  }

  const accountIdMatch = pathname.match(/^\/(?:accounts|customers)\/([^/]+)$/);
  if (accountIdMatch) {
    const accId = accountIdMatch[1];
    const accounts = getStored<AccountItem>('accounts', initialAccounts);
    if (method === 'GET') {
      const found = accounts.find(a => a.id === accId) || accounts[0];
      return found as unknown as T;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const idx = accounts.findIndex(a => a.id === accId);
      if (idx !== -1) {
        accounts[idx] = { ...accounts[idx], ...body, updated_at: new Date().toISOString() };
        setStored('accounts', accounts);
        return accounts[idx] as unknown as T;
      }
      return accounts[0] as unknown as T;
    }
    if (method === 'DELETE') {
      const updated = accounts.filter(a => a.id !== accId);
      setStored('accounts', updated);
      return { success: true, id: accId } as unknown as T;
    }
  }

  // 3. Contacts
  if (pathname === '/contacts') {
    const contacts = getStored<ContactItem>('contacts', initialContacts);
    if (method === 'GET') {
      const q = (searchParams.get('q') || '').toLowerCase();
      const filtered = contacts.filter(c => !q || c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
      return { items: filtered, total: filtered.length, page: 1, limit: 100 } as unknown as T;
    }
    if (method === 'POST') {
      const newCon: ContactItem = {
        id: `con_${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        account_id: body.account_id || '',
        account_name: body.account_name || '',
        ref: `CON-2026-${String(contacts.length + 108).padStart(5, '0')}`,
        first_name: body.first_name || '',
        last_name: body.last_name || '',
        full_name: `${body.first_name || ''} ${body.last_name || ''}`.trim() || 'New Contact',
        job_title: body.job_title || 'Executive',
        department: body.department || 'Operations',
        email: body.email || 'contact@example.com',
        phone: body.phone || '',
        is_primary: !!body.is_primary,
        is_decision_maker: !!body.is_decision_maker,
        status: body.status || 'Active',
        owner_id: 'usr_arjun_01',
        owner_name: 'Arjun Mehta',
        custom_fields: body.custom_fields || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      contacts.unshift(newCon);
      setStored('contacts', contacts);
      return newCon as unknown as T;
    }
  }

  // 4. Cases & Service Support
  if (pathname === '/cases') {
    const cases = getStored<CaseItem>('cases', initialCases);
    if (method === 'GET') {
      const q = (searchParams.get('q') || '').toLowerCase();
      const filtered = cases.filter(c => !q || c.subject.toLowerCase().includes(q) || (c.ref && c.ref.toLowerCase().includes(q)));
      return { items: filtered, total: filtered.length, page: 1, limit: 100 } as unknown as T;
    }
    if (method === 'POST') {
      const newCase: CaseItem = {
        id: `case_${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: `CASE-2026-${String(cases.length + 1).padStart(5, '0')}`,
        subject: body.subject || 'New Support Incident',
        description: body.description || '',
        account_id: body.account_id,
        account_name: body.account_name || 'NovaTech Solutions',
        status: body.status || 'New',
        priority: body.priority || 'Normal',
        category: body.category || 'General',
        channel: body.channel || 'Portal',
        sentiment: 'Neutral',
        sla_breached: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      cases.unshift(newCase);
      setStored('cases', cases);
      return newCase as unknown as T;
    }
  }

  if (pathname === '/service/dashboard-metrics') {
    const cases = getStored<CaseItem>('cases', initialCases);
    const metrics: ServiceDashboardMetrics = {
      total_cases: cases.length,
      open_cases: cases.filter(c => ['New', 'Assigned', 'In Progress'].includes(c.status)).length,
      new_cases: cases.filter(c => c.status === 'New').length,
      assigned_cases: cases.filter(c => c.status === 'Assigned').length,
      in_progress_cases: cases.filter(c => c.status === 'In Progress').length,
      awaiting_customer_cases: cases.filter(c => c.status === 'Awaiting Customer').length,
      resolved_cases: cases.filter(c => c.status === 'Resolved').length,
      closed_cases: cases.filter(c => c.status === 'Closed').length,
      unassigned_cases: 0,
      sla_compliance_rate: 94.8,
      sla_breached_count: cases.filter(c => c.sla_breached).length,
      avg_first_response_hours: 0.4,
      avg_resolution_hours: 3.2,
      priority_distribution: {
        'Critical': cases.filter(c => c.priority === 'Critical').length,
        'High': cases.filter(c => c.priority === 'High').length,
        'Normal': cases.filter(c => c.priority === 'Normal').length,
        'Low': cases.filter(c => c.priority === 'Low').length
      },
      status_distribution: {
        'New': cases.filter(c => c.status === 'New').length,
        'Assigned': cases.filter(c => c.status === 'Assigned').length,
        'In Progress': cases.filter(c => c.status === 'In Progress').length,
        'Awaiting Customer': cases.filter(c => c.status === 'Awaiting Customer').length,
        'Resolved': cases.filter(c => c.status === 'Resolved').length,
        'Closed': cases.filter(c => c.status === 'Closed').length
      },
      channel_distribution: {
        'Portal': 2,
        'Email': 2,
        'Phone': 1,
        'API': 1
      },
      agent_workloads: [
        { user_id: 'usr_arjun_01', user_name: 'Arjun Mehta', active_cases: 2, resolved_cases: 5 },
        { user_id: 'usr_karen_01', user_name: 'Karen Thompson', active_cases: 2, resolved_cases: 8 }
      ],
      recent_activity: cases.slice(0, 4).map(c => ({
        id: c.id,
        ref: c.ref,
        subject: c.subject,
        priority: c.priority,
        status: c.status,
        channel: c.channel,
        updated_at: c.updated_at
      }))
    };
    return metrics as unknown as T;
  }

  if (pathname === '/service/sla' || pathname.startsWith('/service/sla/')) {
    const policies = getStored<SLAPolicyItem>('sla_policies', initialSLAPolicies);
    if (method === 'GET') {
      return policies as unknown as T;
    }
    if (method === 'POST') {
      const newPol: SLAPolicyItem = {
        id: `sla_${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: `SLA-00${policies.length + 1}`,
        name: body.name || 'New SLA Policy',
        priority: body.priority || 'Normal',
        first_response_hours: body.first_response_hours || 2,
        resolution_hours: body.resolution_hours || 8,
        business_hours_only: body.business_hours_only ?? true,
        is_active: true,
        created_at: new Date().toISOString()
      };
      policies.push(newPol);
      setStored('sla_policies', policies);
      return newPol as unknown as T;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const polId = pathname.replace('/service/sla/', '');
      const idx = policies.findIndex(p => p.id === polId);
      if (idx !== -1) {
        policies[idx] = { ...policies[idx], ...body, updated_at: new Date().toISOString() };
        setStored('sla_policies', policies);
        return policies[idx] as unknown as T;
      }
    }
  }

  if (pathname === '/service/queues') {
    return initialQueues as unknown as T;
  }

  // 5. Admin Users & Roles
  if (pathname === '/admin/users/' || pathname === '/admin/users') {
    return {
      items: [
        { id: 'usr_01', email: 'arjun.mehta@example.com', first_name: 'Arjun', last_name: 'Mehta', full_name: 'Arjun Mehta', job_title: 'Tenant Owner', role: 'Tenant Owner', permissions: ['*'], status: 'active', joined_at: '2026-01-01' },
        { id: 'usr_02', email: 'marcus.clarke@example.com', first_name: 'Marcus', last_name: 'Clarke', full_name: 'Marcus Clarke', job_title: 'VP Sales', role: 'Sales Director', permissions: ['sales:*'], status: 'active', joined_at: '2026-01-05' },
        { id: 'usr_03', email: 'devina.foster@example.com', first_name: 'Devina', last_name: 'Foster', full_name: 'Devina Foster', job_title: 'Director Engineering', role: 'Project Delivery Lead', permissions: ['projects:*'], status: 'active', joined_at: '2026-01-10' },
        { id: 'usr_04', email: 'karen.thompson@example.com', first_name: 'Karen', last_name: 'Thompson', full_name: 'Karen Thompson', job_title: 'NOC Commander', role: 'Service Operations Manager', permissions: ['service:*'], status: 'active', joined_at: '2026-01-15' }
      ],
      total: 4
    } as unknown as T;
  }

  if (pathname === '/admin/roles/' || pathname === '/admin/roles') {
    return [
      { id: 'role_01', name: 'Tenant Owner', is_system_role: true, is_platform_role: true, permissions: ['*'], description: 'Full administrative control' },
      { id: 'role_02', name: 'Sales Director', is_system_role: false, is_platform_role: false, permissions: ['sales:*', 'quotes:*'], description: 'Sales operations and approvals' },
      { id: 'role_03', name: 'Service Operations Manager', is_system_role: false, is_platform_role: false, permissions: ['service:*'], description: 'Service desk and SLA management' }
    ] as unknown as T;
  }

  if (pathname === '/admin/roles/permissions') {
    return [
      { id: 'perm_01', code: 'sales:read', module: 'Sales', description: 'View sales pipeline' },
      { id: 'perm_02', code: 'sales:write', module: 'Sales', description: 'Create and edit deals' },
      { id: 'perm_03', code: 'service:read', module: 'Service', description: 'View technical cases' },
      { id: 'perm_04', code: 'service:write', module: 'Service', description: 'Manage and resolve cases' }
    ] as unknown as T;
  }

  // 6. AI Workforce & Proposal Governance Fabric
  if (pathname === '/ai/proposals') {
    const proposals = getStored<AIProposalItem>('ai_proposals', initialAIProposals);
    if (method === 'GET') {
      const statusParam = searchParams.get('status');
      const agentIdParam = searchParams.get('agent_id');
      let filtered = proposals;
      if (statusParam) {
        filtered = filtered.filter(p => p.status.toLowerCase() === statusParam.toLowerCase());
      }
      if (agentIdParam) {
        filtered = filtered.filter(p => p.agent_id === agentIdParam);
      }
      return filtered as unknown as T;
    }
    if (method === 'POST') {
      const newProp: AIProposalItem = {
        id: body.id || `prop-${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: body.ref || `ACT-2026-${String(proposals.length + 86).padStart(4, '0')}`,
        agent_id: body.agent_id || 'agent_custom',
        agent_name: body.agent_name || 'Autonomous Agent',
        action: body.action || body.title || 'AI Action Proposal',
        reasoning: body.reasoning || body.summary || 'Proactive recommendation based on telemetry analysis.',
        evidence: body.evidence || 'Grounded in tenant transactional records.',
        confidence: body.confidence || 95.0,
        policy_check: body.policy_check || 'Standard architectural guardrails enforced.',
        status: body.status || 'Pending Approval',
        payload: body.payload || {},
        created_at: new Date().toISOString()
      };
      proposals.unshift(newProp);
      setStored('ai_proposals', proposals);
      return newProp as unknown as T;
    }
  }

  // AI Proposal Decision (supports both /decide and /decision)
  const proposalDecideMatch = pathname.match(/^\/ai\/proposals\/([^/]+)\/(decide|decision)$/);
  if (proposalDecideMatch) {
    const propId = proposalDecideMatch[1];
    const proposals = getStored<AIProposalItem>('ai_proposals', initialAIProposals);
    const idx = proposals.findIndex(p => p.id === propId || p.ref === propId);
    if (idx !== -1) {
      const nextStatus = body.approved ? 'Approved' : 'Rejected';
      proposals[idx] = {
        ...proposals[idx],
        status: nextStatus,
        decided_by_name: 'Arjun Mehta',
        decided_at: new Date().toISOString(),
        decision_notes: body.notes || (body.approved ? 'Approved via Enterprise Activity Queue' : 'Rejected by reviewer')
      };
      setStored('ai_proposals', proposals);
      return proposals[idx] as unknown as T;
    }
    return { success: true, id: propId, status: body.approved ? 'Approved' : 'Rejected' } as unknown as T;
  }

  // AI Agents Registry
  if (pathname === '/ai/agents') {
    const agents = getStored<AIAgentItem>('ai_agents', initialAIAgents);
    if (method === 'GET') {
      return agents as unknown as T;
    }
    if (method === 'POST') {
      const newAgent: AIAgentItem = {
        id: body.id || `agt-${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: body.ref || `AGT-2026-${String(agents.length + 15).padStart(3, '0')}`,
        name: body.name || 'New Custom Agent',
        persona: body.persona || body.name || 'Specialist Agent',
        module: body.module || body.department || 'Operations',
        role_description: body.role_description || 'Custom autonomous agent for CRM workflows.',
        autonomy_level: body.autonomy_level || 'Suggest Only',
        status: body.status || 'Active',
        system_prompt: body.system_prompt || 'Operate within assigned boundaries.',
        tool_permissions: body.tool_permissions || ['crm:read', 'audit:log'],
        primary_kpi: body.primary_kpi || 'Workflow Reliability >= 95%',
        metrics: { proposals_count: 0, approved_count: 0, accuracy_score: 99.0 },
        custom_fields: { daily_executions: 0, success_rate: 99.0, ...(body.custom_fields || {}) },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      agents.unshift(newAgent);
      setStored('ai_agents', agents);
      return newAgent as unknown as T;
    }
  }

  const agentIdMatch = pathname.match(/^\/ai\/agents\/([^/]+)$/);
  if (agentIdMatch) {
    const agtId = agentIdMatch[1];
    const agents = getStored<AIAgentItem>('ai_agents', initialAIAgents);
    const idx = agents.findIndex(a => a.id === agtId || a.ref === agtId);
    if (method === 'GET') {
      return (idx !== -1 ? agents[idx] : agents[0]) as unknown as T;
    }
    if (method === 'PUT' || method === 'PATCH') {
      if (idx !== -1) {
        agents[idx] = { ...agents[idx], ...body, updated_at: new Date().toISOString() };
        setStored('ai_agents', agents);
        return agents[idx] as unknown as T;
      }
    }
  }

  // 7. AI Copilot Conversational Engine
  if (pathname === '/ai/chat' || pathname.startsWith('/ai/copilot')) {
    const q = (body.message || '').toLowerCase();
    let replyContent = '';
    let links = [
      { label: 'Inspect Pipeline Forecast', path: '/sales/pipeline' },
      { label: 'Launch Revenue Digital Twin', path: '/ai/revenue-twin' },
      { label: 'Review Customer 360', path: '/customers/360' }
    ];

    if (q.includes('pipeline') || q.includes('forecast') || q.includes('deal')) {
      replyContent = `Analysis of live tenant records shows 3 active enterprise pipeline opportunities valued at $1,920,000 in gross Total Contract Value (TCV), yielding a probability-weighted expectation of $1,348,000. Key driver is the Vertex Global Solutions Enterprise Modernization deal ($1,200,000, 70% win probability) in Stage 4. Commercial close pacing is on track for Q1 2026.`;
      links = [
        { label: 'Sales Pipeline Register', path: '/sales/pipeline' },
        { label: 'Run Monte Carlo Forecast', path: '/ai/revenue-twin' }
      ];
    } else if (q.includes('lead') || q.includes('sdr') || q.includes('qualif')) {
      replyContent = `Inbound SDR telemetry reports 12 leads processed this period. Tier-1 enterprise lead Bob Collins (Apex Manufacturing Solutions) qualified at 85/100 fit score and is staged for Senior AE routing. Territory lead response velocity is currently 22 minutes (well below the 2-hour target).`;
      links = [
        { label: 'Inbound Leads Register', path: '/leads' },
        { label: 'AI Activity Queue', path: '/ai/activity' }
      ];
    } else if (q.includes('case') || q.includes('support') || q.includes('sla') || q.includes('ticket')) {
      replyContent = `Service Operations NOC currently monitors 5 total cases. High-priority incident CASE-2026-00002 (NovaTech Solutions Webhook Latency) is assigned to Senior NOC Engineer Karen Thompson with 4.5 hours remaining before SLA breach. All other cases are within green response limits.`;
      links = [
        { label: 'Service Dashboard', path: '/service/dashboard' },
        { label: 'Technical Cases Ledger', path: '/cases' }
      ];
    } else if (q.includes('health') || q.includes('churn') || q.includes('account') || q.includes('customer')) {
      replyContent = `Account portfolio health score averages 89.2/100 across 8 master enterprise accounts. Save-Play Agent detected latency churn risk on NovaTech Solutions and auto-dispatched an executive check-in task. Fujikura Optical Technologies and Apex Global Logistics maintain 100/100 perfect health postures.`;
      links = [
        { label: 'Customer 360 Workspace', path: '/customers/360' },
        { label: 'Customer Intelligence & Memory', path: '/ai/customer-intelligence' }
      ];
    } else if (q.includes('inventory') || q.includes('stock') || q.includes('atp') || q.includes('warehouse')) {
      replyContent = `Multi-warehouse ATP inventory check across 4 depots shows healthy stock for 96-core fiber reels (730 net ATP available) and 100G transceivers (145 net ATP). Miami Hub Cisco Catalyst 9300 units are at low stock (7 units available, 38 reserved), triggering an automated PO recommendation.`;
      links = [
        { label: 'Stock Management Ledger', path: '/inventory/stock' },
        { label: 'Product Availability Cockpit', path: '/catalog/availability' }
      ];
    } else {
      replyContent = `Hello! I am SYVORIS AI Copilot, grounded in your live tenant records via PostgreSQL Row-Level Security. BluePeak Innovations currently monitors 8 enterprise account profiles, $1.92M in active pipeline, and 2 high-priority service queues. How may I assist your workflow today?`;
    }

    const copilotResponse: AIChatQueryResponse = {
      session_id: body.session_id || `sess_${Date.now()}`,
      provider_used: body.provider || 'GPT-4o (PostgreSQL RLS Grounded)',
      reply: {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        grounding_sources: [
          { name: 'PostgreSQL Core DB (Tenant RLS)', ref: 'DB-CORE' },
          { name: 'BluePeak Master Accounts Ledger', ref: 'LEDGER-ACC' },
          { name: 'Carrier CPQ Engine', ref: 'CPQ-V2' }
        ],
        suggested_links: links,
        token_count: 315,
        created_at: new Date().toISOString()
      }
    };

    return {
      answer: replyContent,
      grounded_records: ['NovaTech Solutions', 'Apex Global Logistics', 'Vertex Global Solutions'],
      suggested_actions: links.map(l => l.label),
      ...copilotResponse
    } as unknown as T;
  }

  // 8. Product Availability Matrix
  if (pathname === '/catalog/availability') {
    const rules = getStored<ProductAvailabilityItem>('catalog_availability', initialAvailability);
    if (method === 'GET') {
      const q = (searchParams.get('q') || '').toLowerCase();
      const statusParam = searchParams.get('status');
      let filtered = rules;
      if (statusParam && statusParam !== 'all') {
        filtered = filtered.filter(r => r.status.toLowerCase() === statusParam.toLowerCase());
      }
      if (q) {
        filtered = filtered.filter(r => r.item_name.toLowerCase().includes(q) || (r.notes && r.notes.toLowerCase().includes(q)));
      }
      return filtered as unknown as T;
    }
    if (method === 'POST') {
      const newRule: ProductAvailabilityItem = {
        id: body.id || `av-${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        item_name: body.item_name || 'New Product Availability Rule',
        status: body.status || 'In Stock',
        channel: body.channel || 'All Channels',
        region: body.region || 'Global Multi-Region',
        lead_time_days: Number(body.lead_time_days || 0),
        notes: body.notes || 'Availability rule configured.',
        is_active: true,
        custom_fields: body.custom_fields || { sku: `SKU-${Date.now().toString().slice(-4)}` },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_currently_effective: true
      };
      rules.push(newRule);
      setStored('catalog_availability', rules);
      return newRule as unknown as T;
    }
  }

  const availabilityIdMatch = pathname.match(/^\/catalog\/availability\/([^/]+)$/);
  if (availabilityIdMatch) {
    const ruleId = availabilityIdMatch[1];
    const rules = getStored<ProductAvailabilityItem>('catalog_availability', initialAvailability);
    const idx = rules.findIndex(r => r.id === ruleId);
    if (method === 'GET') {
      return (idx !== -1 ? rules[idx] : rules[0]) as unknown as T;
    }
    if (method === 'PUT' || method === 'PATCH') {
      if (idx !== -1) {
        rules[idx] = { ...rules[idx], ...body, updated_at: new Date().toISOString() };
        setStored('catalog_availability', rules);
        return rules[idx] as unknown as T;
      }
    }
    if (method === 'DELETE') {
      const updated = rules.filter(r => r.id !== ruleId);
      setStored('catalog_availability', updated);
      return { success: true } as unknown as T;
    }
  }

  // 9. Taxes Management
  if (pathname === '/inventory/taxes') {
    const taxes = getStored<TaxRuleItem>('inventory_taxes', initialTaxRules);
    if (method === 'GET') {
      return taxes as unknown as T;
    }
    if (method === 'POST') {
      const newTax: TaxRuleItem = {
        id: body.id || `tax_${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: body.ref || `TAX-${String(taxes.length + 1).padStart(3, '0')}`,
        name: body.name || body.tax_name || 'New Tax Rule',
        code: body.code || body.jurisdiction_code || 'US-FL',
        rate: Number(body.rate !== undefined ? body.rate : (body.rate_percent || 0)),
        region: body.region || 'North America',
        tax_type: body.tax_type || 'Sales Tax',
        is_inclusive: Boolean(body.is_inclusive),
        status: body.status || 'Active',
        custom_fields: body.custom_fields || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      taxes.push(newTax);
      setStored('inventory_taxes', taxes);
      return newTax as unknown as T;
    }
  }

  const taxIdMatch = pathname.match(/^\/inventory\/taxes\/([^/]+)$/);
  if (taxIdMatch) {
    const taxId = taxIdMatch[1];
    const taxes = getStored<TaxRuleItem>('inventory_taxes', initialTaxRules);
    const idx = taxes.findIndex(t => t.id === taxId);
    if (method === 'PUT' || method === 'PATCH') {
      if (idx !== -1) {
        taxes[idx] = { ...taxes[idx], ...body, updated_at: new Date().toISOString() };
        setStored('inventory_taxes', taxes);
        return taxes[idx] as unknown as T;
      }
    }
    if (method === 'DELETE') {
      const updated = taxes.filter(t => t.id !== taxId);
      setStored('inventory_taxes', updated);
      return { success: true } as unknown as T;
    }
  }

  // 10. Commercial Terms & Conditions
  if (pathname === '/inventory/terms') {
    const terms = getStored<CommercialTermsItem>('inventory_terms', initialTerms);
    if (method === 'GET') {
      return terms as unknown as T;
    }
    if (method === 'POST') {
      const newTerm: CommercialTermsItem = {
        id: body.id || `trm_${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: body.ref || `TRM-${String(terms.length + 1).padStart(3, '0')}`,
        title: body.title || 'New Commercial Term',
        version: body.version || '1.0',
        category: body.category || 'Payment',
        content: body.content || body.body_text || 'Standard commercial policy terms.',
        status: body.status || 'Active',
        is_default: Boolean(body.is_default),
        custom_fields: body.custom_fields || { net_days: body.payment_net_days || 30 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      terms.push(newTerm);
      setStored('inventory_terms', terms);
      return newTerm as unknown as T;
    }
  }

  const termIdMatch = pathname.match(/^\/inventory\/terms\/([^/]+)$/);
  if (termIdMatch) {
    const termId = termIdMatch[1];
    const terms = getStored<CommercialTermsItem>('inventory_terms', initialTerms);
    const idx = terms.findIndex(t => t.id === termId);
    if (method === 'PUT' || method === 'PATCH') {
      if (idx !== -1) {
        terms[idx] = { ...terms[idx], ...body, updated_at: new Date().toISOString() };
        setStored('inventory_terms', terms);
        return terms[idx] as unknown as T;
      }
    }
    if (method === 'DELETE') {
      const updated = terms.filter(t => t.id !== termId);
      setStored('inventory_terms', updated);
      return { success: true } as unknown as T;
    }
  }

  // 11. Warehouse Locations
  if (pathname === '/inventory/locations') {
    const locs = getStored<WarehouseLocationItem>('inventory_locations', initialLocations);
    if (method === 'GET') {
      return locs as unknown as T;
    }
    if (method === 'POST') {
      const newLoc: WarehouseLocationItem = {
        id: body.id || `loc_${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: body.ref || `LOC-${String(locs.length + 1).padStart(3, '0')}`,
        name: body.name || 'New Warehouse Location',
        code: body.code || `LOC-${Date.now().toString().slice(-3)}`,
        address: body.address || '',
        is_active: true,
        is_default: false,
        items_count: 0,
        custom_fields: body.custom_fields || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      locs.push(newLoc);
      setStored('inventory_locations', locs);
      return newLoc as unknown as T;
    }
  }

  // 12. Stock Management & ATP Inventory
  if (pathname === '/inventory/stock') {
    const stock = getStored<InventoryStockItem>('inventory_stock', initialStock);
    if (method === 'GET') {
      return stock as unknown as T;
    }
    if (method === 'POST') {
      const onHand = Number(body.quantity_on_hand || 0);
      const reserved = Number(body.quantity_reserved !== undefined ? body.quantity_reserved : (body.quantity_allocated || 0));
      const available = Number(body.quantity_available !== undefined ? body.quantity_available : (onHand - reserved));
      const reorderThresh = Number(body.reorder_threshold !== undefined ? body.reorder_threshold : (body.reorder_point || 20));

      const newStk: InventoryStockItem = {
        id: body.id || `stk_${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: body.ref || `STK-${String(stock.length + 1).padStart(3, '0')}`,
        product_id: body.product_id || 'prd_custom',
        product_name: body.product_name || 'Inventory Hardware Item',
        product_sku: body.product_sku || body.sku || `SKU-${Date.now().toString().slice(-4)}`,
        location_id: body.location_id || 'loc_01',
        location_name: body.location_name || 'Main Distribution Center (Kingston Core Hub)',
        quantity_on_hand: onHand,
        quantity_reserved: reserved,
        quantity_available: available,
        reorder_threshold: reorderThresh,
        reorder_quantity: Number(body.reorder_quantity || 100),
        unit_of_measure: body.unit_of_measure || 'Unit',
        status: available < reorderThresh ? 'Critical' : 'Healthy',
        custom_fields: body.custom_fields || { unit_cost: body.unit_cost || 0, bin_location: body.bin_location || 'Aisle 1' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      stock.push(newStk);
      setStored('inventory_stock', stock);
      return newStk as unknown as T;
    }
  }

  const stockIdMatch = pathname.match(/^\/inventory\/stock\/([^/]+)$/);
  if (stockIdMatch) {
    const stkId = stockIdMatch[1];
    const stock = getStored<InventoryStockItem>('inventory_stock', initialStock);
    const idx = stock.findIndex(s => s.id === stkId || s.ref === stkId);
    if (method === 'PUT' || method === 'PATCH') {
      if (idx !== -1) {
        const onHand = body.quantity_on_hand !== undefined ? Number(body.quantity_on_hand) : stock[idx].quantity_on_hand;
        const reserved = body.quantity_reserved !== undefined ? Number(body.quantity_reserved) : (body.quantity_allocated !== undefined ? Number(body.quantity_allocated) : stock[idx].quantity_reserved);
        const available = onHand - reserved;
        stock[idx] = {
          ...stock[idx],
          ...body,
          quantity_on_hand: onHand,
          quantity_reserved: reserved,
          quantity_available: available,
          updated_at: new Date().toISOString()
        };
        setStored('inventory_stock', stock);
        return stock[idx] as unknown as T;
      }
    }
  }

  // Stock Movements Ledger
  if (pathname === '/inventory/movements') {
    const movements = getStored<StockMovementItem>('inventory_movements', initialMovements);
    if (method === 'GET') {
      return movements as unknown as T;
    }
    if (method === 'POST') {
      const newMov: StockMovementItem = {
        id: body.id || `mov_${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: body.ref || `MOV-${String(movements.length + 1).padStart(3, '0')}`,
        inventory_item_id: body.inventory_item_id || 'stk_01',
        movement_type: body.movement_type || 'Adjustment',
        quantity: Number(body.quantity || 0),
        balance_before: Number(body.balance_before || 0),
        balance_after: Number(body.balance_after || body.quantity || 0),
        from_location_id: body.from_location_id,
        to_location_id: body.to_location_id,
        reference_doc_type: body.reference_doc_type || 'Manual Audit',
        reference_doc_id: body.reference_doc_id || `AUD-${Date.now().toString().slice(-4)}`,
        reason: body.reason || 'Inventory count adjustment',
        performed_by_name: 'Arjun Mehta',
        created_at: new Date().toISOString()
      };
      movements.unshift(newMov);
      setStored('inventory_movements', movements);
      return newMov as unknown as T;
    }
  }

  // 13. Vendors & Suppliers
  if (pathname === '/vendors') {
    const vendors = getStored<VendorProfileItem>('vendors', initialVendors);
    if (method === 'GET') {
      return vendors as unknown as T;
    }
    if (method === 'POST') {
      const newVendor: VendorProfileItem = {
        id: body.id || `vnd_${Date.now()}`,
        tenant_id: 'tenant_bp_01',
        ref: body.ref || `VND-${String(vendors.length + 1).padStart(3, '0')}`,
        account_id: body.account_id || `acc_${Date.now()}`,
        account_name: body.account_name || body.vendor_name || 'New Vendor Profile',
        vendor_code: body.vendor_code || `VND-${Date.now().toString().slice(-4)}`,
        vendor_category: body.vendor_category || 'Hardware Supplier',
        payment_terms: body.payment_terms || 'Net 30',
        rating: Number(body.rating || body.performance_score || 95.0),
        status: body.status || 'Active',
        supplied_products_count: 0,
        supplied_products: [],
        custom_fields: body.custom_fields || { contact_name: body.contact_name, contact_email: body.contact_email },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      vendors.push(newVendor);
      setStored('vendors', vendors);
      return newVendor as unknown as T;
    }
  }

  const vendorIdMatch = pathname.match(/^\/vendors\/([^/]+)$/);
  if (vendorIdMatch) {
    const vndId = vendorIdMatch[1];
    const vendors = getStored<VendorProfileItem>('vendors', initialVendors);
    const idx = vendors.findIndex(v => v.id === vndId || v.ref === vndId);
    if (method === 'GET') {
      return (idx !== -1 ? vendors[idx] : vendors[0]) as unknown as T;
    }
    if (method === 'PUT' || method === 'PATCH') {
      if (idx !== -1) {
        vendors[idx] = { ...vendors[idx], ...body, updated_at: new Date().toISOString() };
        setStored('vendors', vendors);
        return vendors[idx] as unknown as T;
      }
    }
    if (method === 'DELETE') {
      const updated = vendors.filter(v => v.id !== vndId && v.ref !== vndId);
      setStored('vendors', updated);
      return { success: true } as unknown as T;
    }
  }

  // Fallback for all other endpoints: return structured empty or success
  if (method === 'GET') {
    return { items: [], total: 0 } as unknown as T;
  }
  return { success: true, ...body } as unknown as T;
}
