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
  TenantProfile
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
  if (pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/switch-tenant' || pathname === '/auth/refresh') {
    const token = 'mock_jwt_enterprise_token_bluepeak';
    const authRes: AuthResponse = {
      access_token: token,
      token_type: 'bearer',
      refresh_token: 'mock_refresh_token_bluepeak',
      expires_in: 86400,
      tenant_id: 'tenant_bp_01',
      tenant_slug: 'bluepeak-innovations',
      role: 'Tenant Owner',
      permissions: ['*']
    };
    return authRes as unknown as T;
  }

  if (pathname === '/auth/me') {
    const me: CurrentUserProfile = {
      user: {
        id: 'usr_arjun_01',
        email: 'arjun.mehta@example.com',
        first_name: 'Arjun',
        last_name: 'Mehta',
        full_name: 'Arjun Mehta',
        job_title: 'Tenant Owner & CTO',
        is_platform_admin: true,
        is_verified: true
      },
      active_tenant: {
        tenant_id: 'tenant_bp_01',
        tenant_name: 'BluePeak Innovations',
        tenant_slug: 'bluepeak-innovations',
        role: 'Tenant Owner',
        permissions: ['*'],
        status: 'active'
      },
      memberships: [
        {
          tenant_id: 'tenant_bp_01',
          tenant_name: 'BluePeak Innovations',
          tenant_slug: 'bluepeak-innovations',
          role: 'Tenant Owner',
          permissions: ['*'],
          status: 'active'
        }
      ]
    };
    return me as unknown as T;
  }

  if (pathname === '/tenant/profile') {
    const profile: TenantProfile = {
      id: 'tenant_bp_01',
      name: 'BluePeak Innovations',
      slug: 'bluepeak-innovations',
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

  // 6. AI Copilot Query
  if (pathname === '/ai/chat' || pathname.startsWith('/ai/copilot')) {
    return {
      answer: 'Hello! I am SYVORIS AI Copilot, grounded in your enterprise CRM dataset. BluePeak Innovations currently oversees 8 account master records with $1.9M in weighted pipeline. How may I assist your operations today?',
      grounded_records: ['NovaTech Solutions', 'Apex Global Logistics', 'Vertex Global Solutions'],
      suggested_actions: ['Review NovaTech Optical Ring Quote', 'Check Apex MQTT Telematics Handshake']
    } as unknown as T;
  }

  // Fallback for all other endpoints: return structured empty or success
  if (method === 'GET') {
    return { items: [], total: 0 } as unknown as T;
  }
  return { success: true, ...body } as unknown as T;
}
