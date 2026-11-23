import type { CRMData, CRMRecord } from './models';
import { makeActivity } from './models';

const d = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const r = (
  id: string,
  ref: string,
  title: string,
  status: string,
  owner: string,
  amount: number,
  fields: Record<string, string>,
  links: Record<string, string[]> = {},
  extras: Partial<CRMRecord> = {}
): CRMRecord => ({
  id,
  ref,
  title,
  status,
  owner,
  date: fields.date || d(-1),
  amount,
  description: fields.description || fields.notes || fields.scope || title,
  fields,
  links,
  history: [makeActivity('Verified enterprise record', 'Audit initialized in PostgreSQL RLS layer')],
  ...extras
});

export const seedData: CRMData = {
  dashboard: [],

  organizations: [
    r('org_1', 'ORG-2026-00041', 'NovaTech Solutions', 'Active', 'Arjun Mehta', 350000, {
      name: 'NovaTech Solutions',
      industry: 'Telecommunications',
      segment: 'Enterprise',
      website: 'novatech.example',
      phone: '+1 876 555 0182',
      territory: 'Global Multi-Region',
      creditLimit: '350000',
      ownership: 'Private',
      parent: 'NovaTech Holding Group',
      consent: 'Direct phone, secure email and Slack integration authorized',
      owner: 'Arjun Mehta',
      description: 'Enterprise cloud infrastructure, private 5G campus networks, and AI compute tenant.'
    }, { contacts: ['con_1', 'con_2'], opportunities: ['opp_1'], quotes: ['qt_1'], salesOrders: ['so_1'], cases: ['case_1'], projects: ['prj_1'] }),

    r('org_2', 'ORG-2026-00042', 'Apex Global Logistics', 'Active', 'Arjun Mehta', 180000, {
      name: 'Apex Global Logistics',
      industry: 'Logistics & Transport',
      segment: 'Enterprise',
      website: 'apexlogistics.example',
      phone: '+1 305 555 0144',
      territory: 'Miami & Caribbean Hub',
      creditLimit: '180000',
      ownership: 'Public',
      consent: 'Email and automated IoT EDI webhook alerts enabled',
      owner: 'Arjun Mehta',
      description: 'Fleet telematics, real-time freight route optimization, and SAP ERP billing synchronization.'
    }, { contacts: ['con_3', 'con_4'], opportunities: ['opp_2'], quotes: ['qt_2'], salesOrders: ['so_2'], cases: ['case_2'], projects: ['prj_2'] }),

    r('org_3', 'ORG-2026-00043', 'Vertex Global Solutions', 'Active', 'Devina Foster', 250000, {
      name: 'Vertex Global Solutions',
      industry: 'Financial Services',
      segment: 'Enterprise',
      website: 'vertexglobal.example',
      phone: '+1 876 555 0133',
      territory: 'Kingston & London',
      creditLimit: '250000',
      ownership: 'Private',
      consent: 'Encrypted corporate email only; strict PCI-DSS audit logging required',
      owner: 'Devina Foster',
      description: 'Core banking transaction networks, ultra-low-latency financial dark fiber, and PCI-DSS compliance.'
    }, { contacts: ['con_5', 'con_12'], opportunities: ['opp_3'], quotes: ['qt_3'], cases: ['case_6'], projects: ['prj_3'] }),

    r('org_4', 'ORG-2026-00044', 'Fujikura Optical Technologies', 'Active', 'Marcus Clarke', 420000, {
      name: 'Fujikura Optical Technologies',
      industry: 'Optical Infrastructure',
      segment: 'Tier-1 Carrier',
      website: 'fujikura-optics.example',
      phone: '+1 876 555 0199',
      territory: 'Global',
      creditLimit: '420000',
      ownership: 'Public',
      consent: 'Email and executive phone contact authorized',
      owner: 'Marcus Clarke',
      description: 'Metro optical fiber transport networks and dense wavelength division multiplexing (DWDM) hardware.'
    }, { contacts: ['con_6'], opportunities: ['opp_4'], quotes: ['qt_4'] }),

    r('org_5', 'ORG-2026-00045', 'Caribbean Fiber Solutions', 'Active', 'Arjun Mehta', 500000, {
      name: 'Caribbean Fiber Solutions',
      industry: 'Telecommunications',
      segment: 'Carrier Wholesale',
      website: 'caribbeanfiber.example',
      phone: '+1 876 555 0155',
      territory: 'Caribbean Regional',
      creditLimit: '500000',
      ownership: 'Private',
      parent: 'Seiretsu Group',
      consent: 'Email, phone and 24/7 carrier NOC escalation bridge permitted',
      owner: 'Arjun Mehta',
      description: 'Subsea cable consortium landing partner and regional high-capacity IP transit operator.'
    }, { contacts: ['con_7', 'con_11'], opportunities: ['opp_4'], salesOrders: ['so_1'], invoices: ['inv_1'], cases: ['case_3'], projects: ['prj_4'] }),

    r('org_6', 'ORG-2026-00046', 'Digicel Business Systems', 'Active', 'Andre Morgan', 320000, {
      name: 'Digicel Business Systems',
      industry: 'Telecommunications',
      segment: 'Enterprise',
      website: 'digicelbusiness.example',
      phone: '+1 876 555 0122',
      territory: 'Jamaica',
      creditLimit: '320000',
      ownership: 'Private',
      consent: 'Full commercial communications permitted',
      owner: 'Andre Morgan',
      description: 'Enterprise cellular tower backhaul, managed SD-WAN, and business broadband provider.'
    }, { contacts: ['con_8'], opportunities: ['opp_5'], quotes: ['qt_5'] }),

    r('org_7', 'ORG-2026-00047', 'Flow Regional Networks', 'Active', 'Sanjay Reid', 290000, {
      name: 'Flow Regional Networks',
      industry: 'Telecommunications',
      segment: 'Carrier Wholesale',
      website: 'flowregional.example',
      phone: '+1 876 555 0177',
      territory: 'Regional',
      creditLimit: '290000',
      ownership: 'Public',
      consent: 'Wholesale carrier contracts and scheduled operational maintenance notices only',
      owner: 'Sanjay Reid',
      description: 'Cross-border optical transport, metro Ethernet inter-connects, and dark fiber leasing.'
    }, { contacts: ['con_9'], opportunities: ['opp_6'], cases: ['case_4'] }),

    r('org_8', 'ORG-2026-00048', 'Spalding Municipal Works', 'Prospect', 'Karen Thompson', 150000, {
      name: 'Spalding Municipal Works',
      industry: 'Public Sector',
      segment: 'Government',
      website: 'spaldingworks.example',
      phone: '+1 876 555 0166',
      territory: 'Clarendon',
      creditLimit: '150000',
      ownership: 'State Entity',
      consent: 'Pending formal tender confirmation and procurement office notice',
      owner: 'Karen Thompson',
      description: 'Municipal connectivity, smart street lighting SCADA, and civic public Wi-Fi infrastructure.'
    }, { contacts: ['con_10'], opportunities: ['opp_7'], cases: ['case_5'] })
  ],

  contacts: [
    r('con_1', 'CON-00108', 'Marcus Sterling', 'Active', 'Arjun Mehta', 0, {
      firstName: 'Marcus',
      lastName: 'Sterling',
      title: 'Procurement Director',
      organization: 'NovaTech Solutions',
      email: 'marcus.sterling@novatech.example',
      phone: '+1 876 555 0182',
      department: 'Procurement & Vendor Management',
      primary: 'Primary',
      decisionMaker: 'Yes',
      consent: 'Email and phone permitted',
      owner: 'Arjun Mehta'
    }, { organization: ['org_1'] }),

    r('con_2', 'CON-00109', 'Elena Vance', 'Active', 'Arjun Mehta', 0, {
      firstName: 'Elena',
      lastName: 'Vance',
      title: 'VP of Technology Infrastructure',
      organization: 'NovaTech Solutions',
      email: 'elena.vance@novatech.example',
      phone: '+1 876 555 0184',
      department: 'Network Operations',
      primary: 'Secondary',
      decisionMaker: 'Yes',
      consent: 'Email and video conference invited',
      owner: 'Arjun Mehta'
    }, { organization: ['org_1'] }),

    r('con_3', 'CON-00110', 'Tariq Vance', 'Active', 'Arjun Mehta', 0, {
      firstName: 'Tariq',
      lastName: 'Vance',
      title: 'VP of Fleet Operations',
      organization: 'Apex Global Logistics',
      email: 'tariq.vance@apexlogistics.example',
      phone: '+1 305 555 0144',
      department: 'Fleet Management',
      primary: 'Primary',
      decisionMaker: 'Yes',
      consent: 'Direct phone and emergency SMS permitted',
      owner: 'Arjun Mehta'
    }, { organization: ['org_2'] }),

    r('con_4', 'CON-00111', 'Rachel Campbell', 'Active', 'Arjun Mehta', 0, {
      firstName: 'Rachel',
      lastName: 'Campbell',
      title: 'Supply Chain Systems Director',
      organization: 'Apex Global Logistics',
      email: 'rachel.campbell@apexlogistics.example',
      phone: '+1 305 555 0148',
      department: 'Supply Chain Logistics',
      primary: 'Secondary',
      decisionMaker: 'No',
      consent: 'Email permitted',
      owner: 'Arjun Mehta'
    }, { organization: ['org_2'] }),

    r('con_5', 'CON-00112', 'Dr. Aris Thorne', 'Active', 'Devina Foster', 0, {
      firstName: 'Dr. Aris',
      lastName: 'Thorne',
      title: 'Chief Risk & Technology Officer',
      organization: 'Vertex Global Solutions',
      email: 'aris.thorne@vertexglobal.example',
      phone: '+1 876 555 0133',
      department: 'Cybersecurity & Infrastructure',
      primary: 'Primary',
      decisionMaker: 'Yes',
      consent: 'PGP encrypted email and calendar invitations only',
      owner: 'Devina Foster'
    }, { organization: ['org_3'] }),

    r('con_6', 'CON-00113', 'Sarah Jenkins', 'Active', 'Marcus Clarke', 0, {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      title: 'Optical Engineering Lead',
      organization: 'Fujikura Optical Technologies',
      email: 'sarah.jenkins@fujikura-optics.example',
      phone: '+1 876 555 0199',
      department: 'Systems Engineering',
      primary: 'Primary',
      decisionMaker: 'Yes',
      consent: 'Technical inquiries and phone briefing permitted',
      owner: 'Marcus Clarke'
    }, { organization: ['org_4'] }),

    r('con_7', 'CON-00114', 'Janelle Brown', 'Active', 'Arjun Mehta', 0, {
      firstName: 'Janelle',
      lastName: 'Brown',
      title: 'Carrier Finance Controller',
      organization: 'Caribbean Fiber Solutions',
      email: 'janelle.brown@caribbeanfiber.example',
      phone: '+1 876 555 0155',
      department: 'Finance & Billing',
      primary: 'Primary',
      decisionMaker: 'Yes',
      consent: 'Invoicing and billing correspondence permitted',
      owner: 'Arjun Mehta'
    }, { organization: ['org_5'] }),

    r('con_8', 'CON-00115', 'David Alcott', 'Active', 'Andre Morgan', 0, {
      firstName: 'David',
      lastName: 'Alcott',
      title: 'Enterprise Solutions Architect',
      organization: 'Digicel Business Systems',
      email: 'david.alcott@digicelbusiness.example',
      phone: '+1 876 555 0122',
      department: 'Enterprise Architecture',
      primary: 'Primary',
      decisionMaker: 'Yes',
      consent: 'Direct email and solution reviews permitted',
      owner: 'Andre Morgan'
    }, { organization: ['org_6'] }),

    r('con_9', 'CON-00116', 'Camille Sterling', 'Active', 'Sanjay Reid', 0, {
      firstName: 'Camille',
      lastName: 'Sterling',
      title: 'Wholesale Commercial Director',
      organization: 'Flow Regional Networks',
      email: 'camille.sterling@flowregional.example',
      phone: '+1 876 555 0177',
      department: 'Carrier Sales',
      primary: 'Primary',
      decisionMaker: 'Yes',
      consent: 'Contract negotiation and review meetings approved',
      owner: 'Sanjay Reid'
    }, { organization: ['org_7'] }),

    r('con_10', 'CON-00117', 'Tanya Blake', 'Active', 'Karen Thompson', 0, {
      firstName: 'Tanya',
      lastName: 'Blake',
      title: 'Municipal Technology Director',
      organization: 'Spalding Municipal Works',
      email: 'tanya.blake@spaldingworks.example',
      phone: '+1 876 555 0166',
      department: 'Information Technology',
      primary: 'Primary',
      decisionMaker: 'Yes',
      consent: 'Official parish council communications authorized',
      owner: 'Karen Thompson'
    }, { organization: ['org_8'] }),

    r('con_11', 'CON-00118', 'Winston Clarke', 'Active', 'Marcus Clarke', 0, {
      firstName: 'Winston',
      lastName: 'Clarke',
      title: 'Executive VP of Network Strategy',
      organization: 'Caribbean Fiber Solutions',
      email: 'winston.clarke@caribbeanfiber.example',
      phone: '+1 876 555 0158',
      department: 'Executive Leadership',
      primary: 'Secondary',
      decisionMaker: 'Yes',
      consent: 'Executive briefings only',
      owner: 'Marcus Clarke'
    }, { organization: ['org_5'] }),

    r('con_12', 'CON-00119', 'Nigel Chen', 'Active', 'Devina Foster', 0, {
      firstName: 'Nigel',
      lastName: 'Chen',
      title: 'Lead Cyber Infrastructure Engineer',
      organization: 'Vertex Global Solutions',
      email: 'nigel.chen@vertexglobal.example',
      phone: '+1 876 555 0137',
      department: 'Information Security',
      primary: 'Secondary',
      decisionMaker: 'No',
      consent: 'Technical security audit correspondence approved',
      owner: 'Devina Foster'
    }, { organization: ['org_3'] })
  ],

  leads: [
    r('lead_1', 'LEAD-2026-00081', 'Tanya Blake', 'Qualified', 'Karen Thompson', 160000, {
      firstName: 'Tanya',
      lastName: 'Blake',
      company: 'Spalding Municipal Works',
      jobTitle: 'Technology Director',
      email: 'tanya.blake@spaldingworks.example',
      phone: '+1 876 555 0166',
      source: 'Partner Referral',
      industry: 'Public Sector',
      territory: 'Clarendon',
      score: '87',
      priority: 'High',
      consent: 'Verified Official',
      nextActivity: 'Civic Council Procurement Review',
      date: d(-2),
      description: 'Smart city municipal fiber rollout and civic Wi-Fi infrastructure.'
    }, { organization: ['org_8'], contact: ['con_10'] }, { score: 87 }),

    r('lead_2', 'LEAD-2026-00082', 'Dwayne Richards', 'New', 'Marcus Clarke', 125000, {
      firstName: 'Dwayne',
      lastName: 'Richards',
      company: 'Northshore Data Group',
      jobTitle: 'IT Director',
      email: 'dwayne.richards@northshore.example',
      phone: '+1 876 555 0102',
      source: 'Website Lead Form',
      industry: 'Technology',
      territory: 'Montego Bay',
      score: '78',
      priority: 'High',
      consent: 'Email and phone permitted',
      nextActivity: 'Initial Architecture Discovery Call',
      date: d(-1),
      description: 'Interested in managed cloud connectivity and dark fiber links across 3 regional branches.'
    }, {}, { score: 78 }),

    r('lead_3', 'LEAD-2026-00083', 'Alana Foster', 'Contacted', 'Andre Morgan', 95000, {
      firstName: 'Alana',
      lastName: 'Foster',
      company: 'Bluewater Logistics & Port Operations',
      jobTitle: 'Facilities & IoT Systems Manager',
      email: 'alana.foster@bluewater.example',
      phone: '+1 876 555 0128',
      source: 'Trade Event',
      industry: 'Logistics',
      territory: 'Kingston Freeport',
      score: '68',
      priority: 'Normal',
      consent: 'Email permitted',
      nextActivity: 'Dispatch Technical Capability Briefing',
      date: d(-4),
      description: 'Met at regional maritime infrastructure forum; requires warehouse IoT mesh connectivity.'
    }, {}, { score: 68 }),

    r('lead_4', 'LEAD-2026-00084', 'Kirk Morgan', 'Assigned', 'Sanjay Reid', 85000, {
      firstName: 'Kirk',
      lastName: 'Morgan',
      company: 'Caribbean Power & Utilities',
      jobTitle: 'Substation Network Engineer',
      email: 'kirk.morgan@caribpower.example',
      phone: '+1 876 555 0170',
      source: 'Outbound Voice',
      industry: 'Utilities',
      territory: 'Kingston & St. Catherine',
      score: '62',
      priority: 'Normal',
      consent: 'Voice consent verified',
      nextActivity: 'Confirm Substation Site Coordinates',
      date: d(-5),
      description: 'Outbound qualification for power grid optical grounding wire (OPGW) integration.'
    }, {}, { score: 62 }),

    r('lead_5', 'LEAD-2026-00085', 'Veronica Brooks', 'Qualified', 'Arjun Mehta', 220000, {
      firstName: 'Veronica',
      lastName: 'Brooks',
      company: 'Atlantic Data Warehousing',
      jobTitle: 'Infrastructure Operations VP',
      email: 'veronica.brooks@atlanticdw.example',
      phone: '+1 876 555 0194',
      source: 'Executive Referral',
      industry: 'Cloud Infrastructure',
      territory: 'Montego Bay Free Zone',
      score: '91',
      priority: 'High',
      consent: 'Direct communication authorized',
      nextActivity: 'Formal Proposal Drafting',
      date: d(-1),
      description: 'Requires dedicated 100G optical wavelength cross-connect to subsea landing station.'
    }, {}, { score: 91 }),

    r('lead_6', 'LEAD-2026-00086', 'Carlton Wright', 'New', 'Marcus Clarke', 75000, {
      firstName: 'Carlton',
      lastName: 'Wright',
      company: 'Southern Medical Centers',
      jobTitle: 'Chief Medical Information Officer',
      email: 'carlton.wright@southmed.example',
      phone: '+1 876 555 0188',
      source: 'Inbound Webinar',
      industry: 'Healthcare',
      territory: 'Mandeville',
      score: '74',
      priority: 'Normal',
      consent: 'Email authorized',
      nextActivity: 'Schedule Compliance & HIPAA Review',
      date: d(-3),
      description: 'High-reliability telehealth telemetry and redundant medical fiber backbone inquiry.'
    }, {}, { score: 74 })
  ],

  opportunities: [
    r('opp_1', 'OPP-2026-00214', 'NovaTech Metro Optical Ring Buildout', 'Proposal', 'Arjun Mehta', 350000, {
      name: 'NovaTech Metro Optical Ring Buildout',
      customer: 'NovaTech Solutions',
      contact: 'Marcus Sterling',
      stage: 'Proposal',
      probability: '75',
      closeDate: d(28),
      source: 'Existing Enterprise Customer',
      risk: 'Low',
      nextStep: 'Commercial price negotiation and SLA signoff',
      owner: 'Arjun Mehta',
      currency: 'USD',
      description: 'High-density 96-core metro dark fiber expansion and redundant optical routing ring.'
    }, { organization: ['org_1'], contacts: ['con_1', 'con_2'], quotes: ['qt_1'] }, { probability: 75 }),

    r('opp_2', 'OPP-2026-00215', 'Apex Fleet IoT Telematics & Ingestion Platform', 'Negotiation', 'Arjun Mehta', 185000, {
      name: 'Apex Fleet IoT Telematics & Ingestion Platform',
      customer: 'Apex Global Logistics',
      contact: 'Tariq Vance',
      stage: 'Negotiation',
      probability: '85',
      closeDate: d(14),
      source: 'Contract Expansion',
      risk: 'Low',
      nextStep: 'Final SAP ERP billing adapter sign-off',
      owner: 'Arjun Mehta',
      currency: 'USD',
      description: 'Deployment of real-time MQTT telematics ingestion across 1,200 commercial transport units.'
    }, { organization: ['org_2'], contacts: ['con_3'], quotes: ['qt_2'] }, { probability: 85 }),

    r('opp_3', 'OPP-2026-00216', 'Vertex Financial Ultra-Low Latency Link', 'Discovery', 'Devina Foster', 240000, {
      name: 'Vertex Financial Ultra-Low Latency Link',
      customer: 'Vertex Global Solutions',
      contact: 'Dr. Aris Thorne',
      stage: 'Discovery',
      probability: '40',
      closeDate: d(60),
      source: 'Cross-sell',
      risk: 'Medium',
      nextStep: 'Complete latency bench testing and optical OTDR report',
      owner: 'Devina Foster',
      currency: 'USD',
      description: 'Sub-millisecond low-latency dark fiber transport for algorithmic banking settlement.'
    }, { organization: ['org_3'], contacts: ['con_5'], quotes: ['qt_3'] }, { probability: 40 }),

    r('opp_4', 'OPP-2026-00217', 'Caribbean Fiber DWDM Transit Expansion', 'Closed Won', 'Marcus Clarke', 450000, {
      name: 'Caribbean Fiber DWDM Transit Expansion',
      customer: 'Caribbean Fiber Solutions',
      contact: 'Janelle Brown',
      stage: 'Closed Won',
      probability: '100',
      closeDate: d(-6),
      source: 'Carrier Wholesale Framework',
      risk: 'Low',
      nextStep: 'Project handoff to Carrier Engineering Pod',
      owner: 'Marcus Clarke',
      currency: 'USD',
      description: '400 Gbps regional optical wavelength leasing contract across southern subsea landing points.'
    }, { organization: ['org_5'], contacts: ['con_7'], salesOrders: ['so_1'] }, { probability: 100 }),

    r('opp_5', 'OPP-2026-00218', 'Digicel Multi-Site Cloud Peering Exchange', 'Proposal', 'Andre Morgan', 120000, {
      name: 'Digicel Multi-Site Cloud Peering Exchange',
      customer: 'Digicel Business Systems',
      contact: 'David Alcott',
      stage: 'Proposal',
      probability: '60',
      closeDate: d(45),
      source: 'Partner Referral',
      risk: 'Medium',
      nextStep: 'Technical review with Core IP routing engineering',
      owner: 'Andre Morgan',
      currency: 'USD',
      description: 'High-availability BGP cloud peering exchange linking Kingston datacenter with AWS and Azure.'
    }, { organization: ['org_6'], contacts: ['con_8'], quotes: ['qt_5'] }, { probability: 60 }),

    r('opp_6', 'OPP-2026-00219', 'Flow Subsea Cable Cross-Connect Lease', 'Qualification', 'Sanjay Reid', 280000, {
      name: 'Flow Subsea Cable Cross-Connect Lease',
      customer: 'Flow Regional Networks',
      contact: 'Camille Sterling',
      stage: 'Qualification',
      probability: '50',
      closeDate: d(75),
      source: 'Direct RFP Response',
      risk: 'High',
      nextStep: 'Submit formal bid response document with regulatory approvals',
      owner: 'Sanjay Reid',
      currency: 'USD',
      description: 'Carrier wholesale dark fiber cross-connect and subsea cable terminal access lease.'
    }, { organization: ['org_7'], contacts: ['con_9'] }, { probability: 50 }),

    r('opp_7', 'OPP-2026-00220', 'Spalding Municipal Smart City Wi-Fi & SCADA', 'Discovery', 'Karen Thompson', 160000, {
      name: 'Spalding Municipal Smart City Wi-Fi & SCADA',
      customer: 'Spalding Municipal Works',
      contact: 'Tanya Blake',
      stage: 'Discovery',
      probability: '30',
      closeDate: d(90),
      source: 'Partner Referral',
      risk: 'High',
      nextStep: 'Conduct parish council site survey and utility pole attachment audit',
      owner: 'Karen Thompson',
      currency: 'USD',
      description: 'Civic smart lighting telemetry, environmental monitoring and municipal Wi-Fi mesh network.'
    }, { organization: ['org_8'], contacts: ['con_10'] }, { probability: 30 })
  ],

  quotes: [
    r('qt_1', 'QT-2026-00112', 'NovaTech Optical Ring Infrastructure Quote', 'Approved', 'Arjun Mehta', 350000, {
      name: 'NovaTech Optical Ring Infrastructure Quote',
      customer: 'NovaTech Solutions',
      opportunity: 'OPP-2026-00214',
      validUntil: d(25),
      currency: 'USD',
      discount: '5',
      tax: '15',
      paymentTerms: 'Net 30',
      notes: 'Commercial CPQ proposal including 96-core armored fiber, Cisco 9300 core switches, and Gold 24/7 SLA.'
    }, { organization: ['org_1'], opportunities: ['opp_1'] }, {
      lineItems: [
        { id: 'li_1', name: 'Single-Mode 96-Core Armored Fiber Cable (1000m Reel)', sku: 'SKU-00081', quantity: 15, unitPrice: 2450, discount: 5, taxRate: 15, total: 34912 },
        { id: 'li_2', name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch', sku: 'SKU-00083', quantity: 6, unitPrice: 4890, discount: 5, taxRate: 15, total: 27873 },
        { id: 'li_3', name: 'Fiber Installation, Splicing & OTDR Reflectometry Certification', sku: 'SVC-00031', quantity: 4, unitPrice: 8500, discount: 0, taxRate: 0, total: 34000 },
        { id: 'li_4', name: 'Enterprise Turnkey Fiber Infrastructure Pack', sku: 'BND-001', quantity: 8, unitPrice: 32500, discount: 6, taxRate: 15, total: 244400 }
      ]
    }),

    r('qt_2', 'QT-2026-00113', 'Apex Fleet Telematics Gateway Pack Quote', 'Approved', 'Arjun Mehta', 185000, {
      name: 'Apex Fleet Telematics Gateway Pack Quote',
      customer: 'Apex Global Logistics',
      opportunity: 'OPP-2026-00215',
      validUntil: d(15),
      currency: 'USD',
      discount: '4',
      tax: '15',
      paymentTerms: 'Net 30',
      notes: 'Real-time IoT telematics ingestion gateways, cloud subscription, and SAP ERP sync adapter.'
    }, { organization: ['org_2'], opportunities: ['opp_2'] }, {
      lineItems: [
        { id: 'li_5', name: 'Enterprise AI Cloud Core Subscription (Annual)', sku: 'SKU-00087', quantity: 1, unitPrice: 8500, discount: 0, taxRate: 15, total: 8500 },
        { id: 'li_6', name: 'AI Autonomous Agent Worker Seat (Monthly Subscription)', sku: 'SKU-00086', quantity: 48, unitPrice: 450, discount: 5, taxRate: 15, total: 20520 },
        { id: 'li_7', name: 'Predictive Sales & Revenue Intelligence Module', sku: 'SKU-00088', quantity: 1, unitPrice: 36000, discount: 0, taxRate: 15, total: 36000 },
        { id: 'li_8', name: 'Enterprise Network Architecture & Migration Consulting', sku: 'SVC-00032', quantity: 8, unitPrice: 15000, discount: 0, taxRate: 0, total: 120000 }
      ]
    }),

    r('qt_3', 'QT-2026-00114', 'Vertex Low-Latency Dark Fiber Quote', 'In Review', 'Devina Foster', 240000, {
      name: 'Vertex Low-Latency Dark Fiber Quote',
      customer: 'Vertex Global Solutions',
      opportunity: 'OPP-2026-00216',
      validUntil: d(40),
      currency: 'USD',
      discount: '0',
      tax: '15',
      paymentTerms: 'Net 30',
      notes: 'Dedicated point-to-point dark fiber with 99.999% SLA availability and sub-millisecond route guarantees.'
    }, { organization: ['org_3'], opportunities: ['opp_3'] }),

    r('qt_4', 'QT-2026-00115', 'Caribbean Fiber DWDM Carrier Contract', 'Accepted', 'Marcus Clarke', 450000, {
      name: 'Caribbean Fiber DWDM Carrier Contract',
      customer: 'Caribbean Fiber Solutions',
      opportunity: 'OPP-2026-00217',
      validUntil: d(-1),
      currency: 'USD',
      discount: '8',
      tax: '0',
      paymentTerms: 'Net 30',
      notes: 'Carrier wholesale DWDM contract accepted and committed to order SO-2026-00071.'
    }, { organization: ['org_5'], opportunities: ['opp_4'] }),

    r('qt_5', 'QT-2026-00116', 'Digicel Cloud Peering Core Upgrade Quote', 'Draft', 'Andre Morgan', 120000, {
      name: 'Digicel Cloud Peering Core Upgrade Quote',
      customer: 'Digicel Business Systems',
      opportunity: 'OPP-2026-00218',
      validUntil: d(30),
      currency: 'USD',
      discount: '3',
      tax: '15',
      paymentTerms: 'Net 30',
      notes: 'Multi-datacenter redundant edge routing cluster and BGP transit.'
    }, { organization: ['org_6'], opportunities: ['opp_5'] })
  ],

  salesOrders: [
    r('so_1', 'SO-2026-00071', 'Caribbean Fiber DWDM Carrier Core Deployment', 'In Delivery', 'Marcus Clarke', 450000, {
      name: 'Caribbean Fiber DWDM Carrier Core Deployment',
      customer: 'Caribbean Fiber Solutions',
      quote: 'QT-2026-00115',
      fulfilment: 'Hardware Staged - Field Installation Active',
      currency: 'USD',
      paymentTerms: 'Net 30',
      description: 'Order confirmed; optical hardware dispatched to Kingston Central Logistics Hub.'
    }, { organization: ['org_5'], opportunities: ['opp_4'] }),

    r('so_2', 'SO-2026-00072', 'Apex Fleet Telematics Deployment Order', 'Confirmed', 'Arjun Mehta', 185000, {
      name: 'Apex Fleet Telematics Deployment Order',
      customer: 'Apex Global Logistics',
      quote: 'QT-2026-00113',
      fulfilment: 'Compute Instances Allocated',
      currency: 'USD',
      paymentTerms: 'Net 30',
      description: 'Confirmed sales order for 1,200 telemetry gateways and cloud ingestion API pipeline.'
    }, { organization: ['org_2'], opportunities: ['opp_2'] }),

    r('so_3', 'SO-2026-00073', 'NovaTech Optical Metro Ring Hardware Order', 'Allocated', 'Arjun Mehta', 350000, {
      name: 'NovaTech Optical Metro Ring Hardware Order',
      customer: 'NovaTech Solutions',
      quote: 'QT-2026-00112',
      fulfilment: 'Inventory Allocated from Kingston Hub',
      currency: 'USD',
      paymentTerms: 'Net 30',
      description: 'Core switches and fiber reels reserved in stock management ledger.'
    }, { organization: ['org_1'], opportunities: ['opp_1'] })
  ],

  invoices: [
    r('inv_1', 'INV-2026-00041', 'Caribbean Fiber Milestone 1 Carrier Billing', 'Paid', 'Finance Operations', 225000, {
      name: 'Caribbean Fiber Milestone 1 Carrier Billing',
      customer: 'Caribbean Fiber Solutions',
      salesOrder: 'SO-2026-00071',
      dueDate: d(-10),
      status: 'Paid',
      currency: 'USD',
      description: 'Initial 50% mobilization milestone invoice settled via wire transfer.'
    }, { organization: ['org_5'], salesOrders: ['so_1'] }),

    r('inv_2', 'INV-2026-00042', 'NovaTech Equipment Staging Advance Invoice', 'Issued', 'Finance Operations', 175000, {
      name: 'NovaTech Equipment Staging Advance Invoice',
      customer: 'NovaTech Solutions',
      salesOrder: 'SO-2026-00073',
      dueDate: d(18),
      status: 'Issued',
      currency: 'USD',
      description: 'Equipment procurement and staging advance invoice for Metro Optical Ring project.'
    }, { organization: ['org_1'], salesOrders: ['so_3'] }),

    r('inv_3', 'INV-2026-00043', 'Apex IoT Platform Subscription Annual Invoice', 'Issued', 'Finance Operations', 185000, {
      name: 'Apex IoT Platform Subscription Annual Invoice',
      customer: 'Apex Global Logistics',
      salesOrder: 'SO-2026-00072',
      dueDate: d(24),
      status: 'Issued',
      currency: 'USD',
      description: 'Annual enterprise SaaS and telematics compute cluster hosting invoice.'
    }, { organization: ['org_2'], salesOrders: ['so_2'] })
  ],

  cases: [
    r('case_1', 'CASE-2026-00001', 'Enterprise SSO SAML Certificate Expiration Warning', 'New', 'Arjun Mehta', 0, {
      subject: 'Enterprise SSO SAML Certificate Expiration Warning',
      customer: 'Vertex Global Solutions',
      contact: 'Dr. Aris Thorne',
      category: 'Security & Auth',
      priority: 'High',
      assigned: 'Arjun Mehta',
      sla: 'Breached (P2)',
      dueAt: d(0),
      channel: 'Channel Portal',
      sentiment: 'Urgent',
      description: 'Production identity provider signing certificate expires within 48 hours. Zero-downtime rollover required.'
    }, { organization: ['org_3'], contacts: ['con_5'] }),

    r('case_2', 'CASE-2026-00002', 'API Webhook Latency Spikes during Peak Batch Ingestion', 'Closed', 'Tier-1 Support Team', 0, {
      subject: 'API Webhook Latency Spikes during Peak Batch Ingestion',
      customer: 'NovaTech Solutions',
      contact: 'Elena Vance',
      category: 'API & Performance',
      priority: 'High',
      assigned: 'Tier-1 Support Team',
      sla: 'Met',
      dueAt: d(-2),
      channel: 'API Telemetry',
      sentiment: 'Satisfied',
      description: 'Webhook queue backpressure resolved by tuning Redis stream consumer concurrency and worker thread count.'
    }, { organization: ['org_1'], contacts: ['con_2'] }),

    r('case_3', 'CASE-2026-00003', 'Updated VAT Exemption Certificate Verification for Q4', 'Resolved', 'Tier-1 Support Team', 0, {
      subject: 'Updated VAT Exemption Certificate Verification for Q4',
      customer: 'NovaTech Solutions',
      contact: 'Marcus Sterling',
      category: 'Billing & Compliance',
      priority: 'Normal',
      assigned: 'Tier-1 Support Team',
      sla: 'Met',
      dueAt: d(-5),
      channel: 'Email',
      sentiment: 'Neutral',
      description: 'Verified ministry tax exemption certificate and attached to customer master profile in tax management engine.'
    }, { organization: ['org_1'], contacts: ['con_1'] }),

    r('case_4', 'CASE-2026-00004', 'Telematics MQTT Handshake TLS 1.3 Cipher Negotiation', 'In Progress', 'Karen Thompson', 0, {
      subject: 'Telematics MQTT Handshake TLS 1.3 Cipher Negotiation',
      customer: 'Apex Global Logistics',
      contact: 'Tariq Vance',
      category: 'IoT Gateway',
      priority: 'High',
      assigned: 'Karen Thompson',
      sla: '1 Business Hour',
      dueAt: d(1),
      channel: 'Customer Portal',
      sentiment: 'Concerned',
      description: 'Edge telematics hardware units reporting intermittent handshake resets with Miami ingest broker.'
    }, { organization: ['org_2'], contacts: ['con_3'] }),

    r('case_5', 'CASE-2026-00005', 'DWDM Optical Port Transceiver Low Power Alarm', 'In Progress', 'Marcus Clarke', 0, {
      subject: 'DWDM Optical Port Transceiver Low Power Alarm',
      customer: 'Caribbean Fiber Solutions',
      contact: 'Janelle Brown',
      category: 'Optical Physical Layer',
      priority: 'Critical',
      assigned: 'Marcus Clarke',
      sla: '2 Hours (Carrier SLA)',
      dueAt: d(0),
      channel: 'Carrier NOC Bridge',
      sentiment: 'Critical',
      description: 'Port 8 on subsea interface chassis reporting -22 dBm optical received power. Field crew dispatched with OTDR.'
    }, { organization: ['org_5'], contacts: ['con_7'] }),

    r('case_6', 'CASE-2026-00006', 'Municipal SCADA Telemetry Gateway Intermittent Dropouts', 'Open', 'Devina Foster', 0, {
      subject: 'Municipal SCADA Telemetry Gateway Intermittent Dropouts',
      customer: 'Spalding Municipal Works',
      contact: 'Tanya Blake',
      category: 'SCADA Infrastructure',
      priority: 'Normal',
      assigned: 'Devina Foster',
      sla: '8 Business Hours',
      dueAt: d(2),
      channel: 'Webform',
      sentiment: 'Neutral',
      description: 'Streetlight monitoring remote terminal unit reporting packet loss during peak thunderstorm activity.'
    }, { organization: ['org_8'], contacts: ['con_10'] })
  ],

  projects: [
    r('prj_1', 'PRJ-2026-00001', 'NovaTech Metro Core Optical Ring Infrastructure', 'Active', 'Arjun Mehta', 350000, {
      name: 'NovaTech Metro Core Optical Ring Infrastructure',
      customer: 'NovaTech Solutions',
      manager: 'Arjun Mehta',
      startDate: d(-20),
      finishDate: d(60),
      budget: '350000',
      billingModel: 'Milestone',
      progress: '45',
      health: 'On Track',
      opportunity: 'OPP-2026-00214',
      description: 'End-to-end civil conduit access, 96-core fiber deployment, and redundant Cisco Catalyst core switching.'
    }, { organization: ['org_1'], opportunities: ['opp_1'] }),

    r('prj_2', 'PRJ-2026-00002', 'Apex Fleet Telematics & ERP Integration', 'In Progress', 'Arjun Mehta', 95000, {
      name: 'Apex Fleet Telematics & ERP Integration',
      customer: 'Apex Global Logistics',
      manager: 'Arjun Mehta',
      startDate: d(-30),
      finishDate: d(65),
      budget: '95000',
      billingModel: 'Milestone',
      progress: '28',
      health: 'On Track',
      opportunity: 'OPP-2026-00215',
      description: 'Real-time IoT telematics ingestion, automated route optimization, and SAP ERP billing synchronization for 1,200 commercial transport units.'
    }, { organization: ['org_2'], opportunities: ['opp_2'] }),

    r('prj_3', 'PRJ-2026-00003', 'Vertex Financial Ultra-Low Latency Link', 'Planning', 'Devina Foster', 240000, {
      name: 'Vertex Financial Ultra-Low Latency Link',
      customer: 'Vertex Global Solutions',
      manager: 'Devina Foster',
      startDate: d(-5),
      finishDate: d(90),
      budget: '240000',
      billingModel: 'Fixed Price',
      progress: '15',
      health: 'On Track',
      opportunity: 'OPP-2026-00216',
      description: 'Sub-millisecond low latency dark fiber link linking Vertex trading desks with primary regional banking exchange.'
    }, { organization: ['org_3'], opportunities: ['opp_3'] }),

    r('prj_4', 'PRJ-2026-00004', 'Caribbean Fiber DWDM 400G Expansion Delivery', 'Completed', 'Marcus Clarke', 450000, {
      name: 'Caribbean Fiber DWDM 400G Expansion Delivery',
      customer: 'Caribbean Fiber Solutions',
      manager: 'Marcus Clarke',
      startDate: d(-90),
      finishDate: d(-5),
      budget: '450000',
      billingModel: 'Milestone',
      progress: '100',
      health: 'On Track',
      opportunity: 'OPP-2026-00217',
      description: 'Successful delivery, optical loss verification, and carrier sign-off for 400G subsea wavelength expansion.'
    }, { organization: ['org_5'], opportunities: ['opp_4'] })
  ],

  tasks: [
    r('task_1', 'TSK-2026-00141', 'Verify Optical Return Loss (ORL) on Ring Segment 3', 'In Progress', 'Sarah Jenkins', 0, {
      name: 'Verify Optical Return Loss (ORL) on Ring Segment 3',
      assignee: 'Sarah Jenkins',
      priority: 'High',
      dueDate: d(2),
      relatedTo: 'PRJ-2026-00001',
      description: 'Perform bidirectional OTDR testing and certify splice loss under 0.05 dB per fusion point.'
    }, { projects: ['prj_1'] }),

    r('task_2', 'TSK-2026-00142', 'Configure SAP ERP Ingestion Webhook Pipeline', 'In Progress', 'Arjun Mehta', 0, {
      name: 'Configure SAP ERP Ingestion Webhook Pipeline',
      assignee: 'Arjun Mehta',
      priority: 'High',
      dueDate: d(3),
      relatedTo: 'PRJ-2026-00002',
      description: 'Finalize HMAC-SHA256 authenticated webhook endpoint for automated freight billing events.'
    }, { projects: ['prj_2'] }),

    r('task_3', 'TSK-2026-00143', 'Renew Vertex SSO Identity SAML Certificate', 'Open', 'Arjun Mehta', 0, {
      name: 'Renew Vertex SSO Identity SAML Certificate',
      assignee: 'Arjun Mehta',
      priority: 'Critical',
      dueDate: d(0),
      relatedTo: 'CASE-2026-00001',
      description: 'Coordinate zero-downtime key rotation with Vertex enterprise security director.'
    }, { cases: ['case_1'] }),

    r('task_4', 'TSK-2026-00144', 'Dispatch Field Splicing Crew to DWDM Terminal B', 'Open', 'Karen Thompson', 0, {
      name: 'Dispatch Field Splicing Crew to DWDM Terminal B',
      assignee: 'Karen Thompson',
      priority: 'High',
      dueDate: d(1),
      relatedTo: 'CASE-2026-00005',
      description: 'Check optical power levels on port 8 with calibrated optical light meter.'
    }, { cases: ['case_5'] })
  ],

  milestones: [
    r('ms_1', 'MS-2026-0001', 'Architectural Design & Right-of-Way Conduit Approval', 'Completed', 'Arjun Mehta', 0, {
      name: 'Architectural Design & Right-of-Way Conduit Approval',
      project: 'NovaTech Metro Core Optical Ring Infrastructure',
      dueDate: d(-10),
      progress: '100',
      description: 'Parish council utility permits secured and CAD engineering schematic validated.'
    }, { projects: ['prj_1'] }),

    r('ms_2', 'MS-2026-0002', 'Armored Fiber Pull & Metro Ring Fusion Splicing', 'In Progress', 'Sarah Jenkins', 0, {
      name: 'Armored Fiber Pull & Metro Ring Fusion Splicing',
      project: 'NovaTech Metro Core Optical Ring Infrastructure',
      dueDate: d(15),
      progress: '65',
      description: '15,000 meters of 96-core armored single-mode cable pulled through underground conduits.'
    }, { projects: ['prj_1'] }),

    r('ms_3', 'MS-2026-0003', 'IoT Edge Ingestion Broker Core Provisioning', 'Completed', 'Arjun Mehta', 0, {
      name: 'IoT Edge Ingestion Broker Core Provisioning',
      project: 'Apex Fleet Telematics & ERP Integration',
      dueDate: d(-5),
      progress: '100',
      description: 'High-throughput cluster provisioned and MQTT test payloads validated at 10,000 msgs/sec.'
    }, { projects: ['prj_2'] }),

    r('ms_4', 'MS-2026-0004', 'SAP ERP Billing Integration Live Pilot', 'In Progress', 'Arjun Mehta', 0, {
      name: 'SAP ERP Billing Integration Live Pilot',
      project: 'Apex Fleet Telematics & ERP Integration',
      dueDate: d(20),
      progress: '40',
      description: 'End-to-end test dispatching automated freight bills upon GPS arrival at destination.'
    }, { projects: ['prj_2'] }),

    r('ms_5', 'MS-2026-0005', 'Vertex Low Latency Optical Bench Calibration', 'In Progress', 'Devina Foster', 0, {
      name: 'Vertex Low Latency Optical Bench Calibration',
      project: 'Vertex Financial Ultra-Low Latency Link',
      dueDate: d(30),
      progress: '25',
      description: 'Precision OTDR chromatic dispersion and propagation delay bench testing.'
    }, { projects: ['prj_3'] })
  ],

  resources: [
    r('res_1', 'RES-2026-0001', 'Senior Optical Infrastructure Lead (Sarah Jenkins)', 'Active', 'Sarah Jenkins', 0, {
      name: 'Senior Optical Infrastructure Lead (Sarah Jenkins)',
      type: 'Engineer',
      capacity: '160 hours / month',
      allocation: '85%',
      owner: 'Sarah Jenkins',
      description: 'Lead specialist for fusion splicing, OTDR reflectometry, and DWDM wave-division multiplexing.'
    }),

    r('res_2', 'RES-2026-0002', 'Cloud Systems & API Architecture Lead (Arjun Mehta)', 'Active', 'Arjun Mehta', 0, {
      name: 'Cloud Systems & API Architecture Lead (Arjun Mehta)',
      type: 'Architect',
      capacity: '160 hours / month',
      allocation: '70%',
      owner: 'Arjun Mehta',
      description: 'Core backend integrations, SAP ERP synchronization, and multi-tenant PostgreSQL security.'
    }),

    r('res_3', 'RES-2026-0003', 'Metro Civil Works & Cable Pulling Pod Alpha', 'Active', 'Project Operations', 0, {
      name: 'Metro Civil Works & Cable Pulling Pod Alpha',
      type: 'Team',
      capacity: '320 hours / month',
      allocation: '92%',
      owner: 'Project Operations',
      description: 'Certified 6-person heavy conduit pulling and outdoor optical enclosure installation crew.'
    }),

    r('res_4', 'RES-2026-0004', '24/7 Carrier NOC Tier-2 Incident Response Pod', 'Active', 'Karen Thompson', 0, {
      name: '24/7 Carrier NOC Tier-2 Incident Response Pod',
      type: 'Team',
      capacity: '720 hours / month',
      allocation: '60%',
      owner: 'Karen Thompson',
      description: 'Round-the-clock monitoring, optical loss escalation, and carrier peering SLA enforcement.'
    })
  ],

  costs: [
    r('cst_1', 'CST-2026-0001', 'Direct Hardware BOM: Cisco 9300 Switches & Transceivers', 'Approved', 'Arjun Mehta', 42800, {
      name: 'Direct Hardware BOM: Cisco 9300 Switches & Transceivers',
      project: 'NovaTech Metro Core Optical Ring Infrastructure',
      category: 'Hardware BOM',
      status: 'Approved',
      date: d(-15),
      description: 'Purchased from Cisco authorized distributor under partner discount tier.'
    }, { projects: ['prj_1'] }),

    r('cst_2', 'CST-2026-0002', 'Metro Right-of-Way Conduit Access & Civil Permitting', 'Approved', 'Arjun Mehta', 18500, {
      name: 'Metro Right-of-Way Conduit Access & Civil Permitting',
      project: 'NovaTech Metro Core Optical Ring Infrastructure',
      category: 'Permits & Civil',
      status: 'Approved',
      date: d(-12),
      description: 'Municipal utility duct leasing and public works agency clearance fees.'
    }, { projects: ['prj_1'] }),

    r('cst_3', 'CST-2026-0003', 'Precision Fusion Splicer & OTDR Tool Calibration Lease', 'Approved', 'Sarah Jenkins', 6200, {
      name: 'Precision Fusion Splicer & OTDR Tool Calibration Lease',
      project: 'NovaTech Metro Core Optical Ring Infrastructure',
      category: 'Equipment Rental',
      status: 'Approved',
      date: d(-8),
      description: 'Rental and calibration certification for Fujikura 90S+ core alignment splicer kit.'
    }, { projects: ['prj_1'] }),

    r('cst_4', 'CST-2026-0004', 'AWS & Azure Dedicated Cloud Peering Gateway Hosting', 'Approved', 'Arjun Mehta', 14200, {
      name: 'AWS & Azure Dedicated Cloud Peering Gateway Hosting',
      project: 'Apex Fleet Telematics & ERP Integration',
      category: 'Cloud Infrastructure',
      status: 'Approved',
      date: d(-14),
      description: 'Dedicated VPC transit gateways and low-latency MQTT ingestion broker compute nodes.'
    }, { projects: ['prj_2'] })
  ],

  products: [
    r('prod_1', 'SKU-00081', 'Single-Mode 96-Core Armored Fiber Cable (1000m Reel)', 'Active', 'Catalogue Admin', 2450, {
      name: 'Single-Mode 96-Core Armored Fiber Cable (1000m Reel)',
      sku: 'SKU-00081',
      category: 'Optical & Fiber Hardware',
      unitPrice: '2450',
      taxCategory: 'Standard GCT (15%)',
      availability: 'Immediate Stock (Kingston Hub)',
      description: 'Heavy-duty steel-armored single-mode outdoor fiber optic cable with water-blocking gel for duct and direct burial.'
    }),

    r('prod_2', 'SKU-00082', 'XGS-PON Optical Network Terminal (10G Symmetric)', 'Active', 'Catalogue Admin', 185, {
      name: 'XGS-PON Optical Network Terminal (10G Symmetric)',
      sku: 'SKU-00082',
      category: 'Customer Premise Equipment (CPE)',
      unitPrice: '185',
      taxCategory: 'Standard GCT (15%)',
      availability: 'Immediate Stock (Kingston Hub)',
      description: 'ITU-T G.9807.1 compliant 10-Gigabit symmetric optical terminal with 10GE LAN port and POTS voice gateway.'
    }),

    r('prod_3', 'SKU-00083', 'Cisco Catalyst 9300 48-Port PoE+ Managed Core Switch', 'Active', 'Catalogue Admin', 4890, {
      name: 'Cisco Catalyst 9300 48-Port PoE+ Managed Core Switch',
      sku: 'SKU-00083',
      category: 'Network & Routing Hardware',
      unitPrice: '4890',
      taxCategory: 'Standard GCT (15%)',
      availability: 'Build-to-Order (5 Days)',
      description: 'Enterprise stackable layer-3 switch with 480 Gbps stacking bandwidth, modular uplinks, and redundant power supplies.'
    }),

    r('prod_4', 'SKU-00084', 'Nokia 7750 Service Router Edge Gateway', 'Active', 'Catalogue Admin', 12500, {
      name: 'Nokia 7750 Service Router Edge Gateway',
      sku: 'SKU-00084',
      category: 'Network & Routing Hardware',
      unitPrice: '12500',
      taxCategory: 'Standard GCT (15%)',
      availability: 'Build-to-Order (21 Days)',
      description: 'Carrier-grade IP/MPLS edge router delivering terabit switching performance, SRv6, and carrier wholesale traffic shaping.'
    }),

    r('prod_5', 'SKU-00085', '100G QSFP28 LR4 Optical Transceiver (10km Single-Mode)', 'Active', 'Catalogue Admin', 420, {
      name: '100G QSFP28 LR4 Optical Transceiver (10km Single-Mode)',
      sku: 'SKU-00085',
      category: 'Optical & Fiber Hardware',
      unitPrice: '420',
      taxCategory: 'Standard GCT (15%)',
      availability: 'Immediate Stock (Miami Depot)',
      description: 'Hot-pluggable 100G Ethernet optical transceiver operating over 1310nm wavelength up to 10 kilometers on SMF.'
    }),

    r('prod_6', 'SKU-00086', 'AI Autonomous Agent Worker Seat (Monthly Subscription)', 'Active', 'Catalogue Admin', 450, {
      name: 'AI Autonomous Agent Worker Seat (Monthly Subscription)',
      sku: 'SKU-00086',
      category: 'Enterprise Cloud & AI Software',
      unitPrice: '450',
      taxCategory: 'Standard GCT (15%)',
      availability: 'Instant Automated Provisioning',
      description: 'Dedicated GPU compute slot executing autonomous sales qualification, pricing negotiation, and incident resolution workflows.'
    }),

    r('prod_7', 'SKU-00087', 'Enterprise AI Cloud Core Subscription (Annual)', 'Active', 'Catalogue Admin', 8500, {
      name: 'Enterprise AI Cloud Core Subscription (Annual)',
      sku: 'SKU-00087',
      category: 'Enterprise Cloud & AI Software',
      unitPrice: '8500',
      taxCategory: 'Standard GCT (15%)',
      availability: 'Instant Automated Provisioning',
      description: 'Multi-tenant cloud platform core license with Row-Level Security, automated audit trail, and domain event fabric.'
    }),

    r('prod_8', 'SKU-00088', 'Predictive Sales & Revenue Intelligence Module', 'Active', 'Catalogue Admin', 36000, {
      name: 'Predictive Sales & Revenue Intelligence Module',
      sku: 'SKU-00088',
      category: 'Enterprise Cloud & AI Software',
      unitPrice: '36000',
      taxCategory: 'Standard GCT (15%)',
      availability: 'Instant Automated Provisioning',
      description: 'Machine learning forecasting model estimating deal close velocities, margin slippage, and pipeline conversion health.'
    })
  ],

  services: [
    r('svc_1', 'SVC-00031', 'Fiber Installation, Splicing & OTDR Reflectometry Certification', 'Active', 'Catalogue Admin', 8500, {
      name: 'Fiber Installation, Splicing & OTDR Reflectometry Certification',
      sku: 'SVC-00031',
      unitPrice: '8500',
      billingUnit: 'Per Span (5km)',
      description: 'Certified optical technicians perform fusion splicing, OTDR trace measurement, optical return loss certification, and CAD documentation.'
    }),

    r('svc_2', 'SVC-00032', 'Enterprise Network Architecture & Migration Consulting', 'Active', 'Catalogue Admin', 15000, {
      name: 'Enterprise Network Architecture & Migration Consulting',
      sku: 'SVC-00032',
      unitPrice: '15000',
      billingUnit: 'Per Engagement',
      description: 'Senior CCIE / JNCIE architects audit existing multi-branch topologies and formulate high-availability zero-downtime migration plans.'
    }),

    r('svc_3', 'SVC-00033', '24x7x365 Mission-Critical Carrier NOC Managed Service', 'Active', 'Catalogue Admin', 36000, {
      name: '24x7x365 Mission-Critical Carrier NOC Managed Service',
      sku: 'SVC-00033',
      unitPrice: '36000',
      billingUnit: 'Annual Retainer',
      description: 'Continuous proactive optical telemetry monitoring, 15-minute emergency dispatch SLA, and monthly executive reliability reports.'
    }),

    r('svc_4', 'SVC-00034', 'Emergency On-Site Optical Restoration Dispatch', 'Active', 'Catalogue Admin', 4200, {
      name: 'Emergency On-Site Optical Restoration Dispatch',
      sku: 'SVC-00034',
      unitPrice: '4200',
      billingUnit: 'Per Incident',
      description: '4-hour rapid mobilization window with emergency fusion splicing vehicle, replacement fiber spans, and OTDR diagnostic equipment.'
    }),

    r('svc_5', 'SVC-00035', 'AI Copilot Custom Domain & Knowledge Graph Ingestion Pack', 'Active', 'Catalogue Admin', 12000, {
      name: 'AI Copilot Custom Domain & Knowledge Graph Ingestion Pack',
      sku: 'SVC-00035',
      unitPrice: '12000',
      billingUnit: 'Turnkey Package',
      description: 'Ingestion of enterprise pricing policies, customer service SOPs, and product manuals into vector embeddings and CRM grounding graph.'
    })
  ],

  categories: [
    r('cat_1', 'CAT-001', 'Optical & Fiber Hardware', 'Active', 'Catalogue Admin', 0, {
      name: 'Optical & Fiber Hardware',
      code: 'OPT-FBR',
      itemCount: '18',
      description: 'Dark fiber, transceivers, armor-jacketed cable, ODF distribution frames and splice trays.'
    }),
    r('cat_2', 'CAT-002', 'Network & Routing Hardware', 'Active', 'Catalogue Admin', 0, {
      name: 'Network & Routing Hardware',
      code: 'NET-ROUT',
      itemCount: '12',
      description: 'Enterprise core switches, edge service routers, firewall appliances, and redundant power shelves.'
    }),
    r('cat_3', 'CAT-003', 'Enterprise Cloud & AI Software', 'Active', 'Catalogue Admin', 0, {
      name: 'Enterprise Cloud & AI Software',
      code: 'CLD-AI',
      itemCount: '8',
      description: 'Autonomous AI agent licenses, multi-tenant CRM seats, digital twin simulation, and API gateways.'
    }),
    r('cat_4', 'CAT-004', 'Professional Engineering Services', 'Active', 'Catalogue Admin', 0, {
      name: 'Professional Engineering Services',
      code: 'ENG-SVC',
      itemCount: '7',
      description: 'Optical fusion splicing, OTDR reflectometry testing, site engineering surveys, and architecture consulting.'
    }),
    r('cat_5', 'CAT-005', 'Carrier Managed Connectivity', 'Active', 'Catalogue Admin', 0, {
      name: 'Carrier Managed Connectivity',
      code: 'CAR-CONN',
      itemCount: '6',
      description: 'Metro Ethernet wavelengths, dedicated dark fiber leases, IP transit, and subsea cross-connects.'
    }),
    r('cat_6', 'CAT-006', 'Customer Premise Equipment (CPE)', 'Active', 'Catalogue Admin', 0, {
      name: 'Customer Premise Equipment (CPE)',
      code: 'CPE-DEV',
      itemCount: '14',
      description: 'XGS-PON optical network terminals, PoE enterprise access points, and SD-WAN branch appliances.'
    })
  ],

  bundles: [
    r('bnd_1', 'BND-001', 'Enterprise Turnkey Fiber Infrastructure Pack', 'Active', 'Catalogue Admin', 32500, {
      name: 'Enterprise Turnkey Fiber Infrastructure Pack',
      code: 'BND-FBR-TURNKEY',
      productsCount: '4',
      discountPercentage: '12%',
      description: 'Complete commercial package: 5 reels armored fiber + Cisco Catalyst 9300 + precision fusion splicing + 24/7 Gold SLA.'
    }),
    r('bnd_2', 'BND-002', 'Carrier Metro Transit Edge Cluster', 'Active', 'Catalogue Admin', 78000, {
      name: 'Carrier Metro Transit Edge Cluster',
      code: 'BND-METRO-CORE',
      productsCount: '5',
      discountPercentage: '15%',
      description: 'Nokia 7750 service router + 10x 100G QSFP28 transceivers + redundant power modules + implementation engineering.'
    }),
    r('bnd_3', 'BND-003', 'Autonomous AI Workforce Enterprise Suite', 'Active', 'Catalogue Admin', 14500, {
      name: 'Autonomous AI Workforce Enterprise Suite',
      code: 'BND-AI-CORP',
      productsCount: '3',
      discountPercentage: '18%',
      description: '10x Autonomous AI Agent Worker Seats + Annual Cloud Core Platform + Predictive Revenue Intelligence Module.'
    }),
    r('bnd_4', 'BND-004', 'Branch SD-WAN & Secure Remote Connectivity Kit', 'Active', 'Catalogue Admin', 9800, {
      name: 'Branch SD-WAN & Secure Remote Connectivity Kit',
      code: 'BND-SDWAN-REMOTE',
      productsCount: '3',
      discountPercentage: '8%',
      description: 'Dual managed edge routers + 10G SFP+ optical transceivers + 4G/5G backup failover modem.'
    })
  ],

  vendors: [
    r('ven_1', 'VEN-00021', 'Cisco Systems Inc.', 'Active', 'Procurement', 0, {
      name: 'Cisco Systems Inc.',
      category: 'Network & Routing Hardware',
      contact: 'Sarah Jenkins',
      email: 'enterprise-orders@cisco.example',
      phone: '+1 800 555 2472',
      terms: 'Net 30',
      tier: 'Platinum Authorized Supplier',
      leadTime: '5 Days',
      description: 'Primary OEM supplier for enterprise Catalyst core switches, SD-WAN gateways, and optics.'
    }),
    r('ven_2', 'VEN-00022', 'Nokia Networks', 'Active', 'Procurement', 0, {
      name: 'Nokia Networks',
      category: 'Carrier Routing & DWDM',
      contact: 'Janelle Brown',
      email: 'carrier-sales@nokia.example',
      phone: '+1 800 555 6654',
      terms: 'Net 45',
      tier: 'Tier-1 Carrier Vendor',
      leadTime: '21 Days',
      description: 'Carrier-grade edge routers, optical transport hardware, and DWDM transponders.'
    }),
    r('ven_3', 'VEN-00023', 'Corning Optical Communications', 'Active', 'Procurement', 0, {
      name: 'Corning Optical Communications',
      category: 'Optical & Fiber Hardware',
      contact: 'Marcus Sterling',
      email: 'orders@corning.example',
      phone: '+1 800 555 2676',
      terms: 'Net 30',
      tier: 'Strategic Partner',
      leadTime: '3 Days',
      description: 'Single-mode armored fiber optic cable, pre-terminated splice trays, and rugged outdoor vaults.'
    }),
    r('ven_4', 'VEN-00024', 'Fujikura Precision Optical Equipment', 'Active', 'Procurement', 0, {
      name: 'Fujikura Precision Optical Equipment',
      category: 'Field Engineering Tools',
      contact: 'David Alcott',
      email: 'instruments@fujikura.example',
      phone: '+1 800 555 3854',
      terms: 'Net 30',
      tier: 'Preferred Hardware Partner',
      leadTime: '1 Day',
      description: 'Core-alignment optical fusion splicers, precision fiber cleavers, and calibrated OTDR test units.'
    }),
    r('ven_5', 'VEN-00025', 'Caribbean Wholesale Logistics Ltd.', 'Active', 'Procurement', 0, {
      name: 'Caribbean Wholesale Logistics Ltd.',
      category: 'Conduits & Civil Materials',
      contact: 'Tanya Blake',
      email: 'dispatch@caribwholesale.example',
      phone: '+1 876 555 0199',
      terms: 'Net 15',
      tier: 'Domestic Logistics Partner',
      leadTime: 'Immediate (Same-Day)',
      description: 'Local Caribbean distribution hub for heavy conduit, cable pull lubricant, and utility pole hardware.'
    })
  ],

  taxes: [
    r('tax_1', 'TAX-001', 'Standard General Consumption Tax (GCT 15%)', 'Active', 'Finance', 0, {
      name: 'Standard General Consumption Tax (GCT 15%)',
      rate: '15',
      region: 'Domestic Regional',
      type: 'Standard Tax',
      description: 'Standard domestic sales tax applied to network hardware, local engineering services, and CRM software seats.'
    }),
    r('tax_2', 'TAX-002', 'Zero-Rated Cross-Border Export (0%)', 'Active', 'Finance', 0, {
      name: 'Zero-Rated Cross-Border Export (0%)',
      rate: '0',
      region: 'International Export',
      type: 'Exempt',
      description: 'Statutory 0% tax rating applied to wholesale telecom transit delivered outside domestic jurisdiction.'
    }),
    r('tax_3', 'TAX-003', 'Public Sector Infrastructure Surcharge (2.5%)', 'Active', 'Finance', 0, {
      name: 'Public Sector Infrastructure Surcharge (2.5%)',
      rate: '2.5',
      region: 'Municipal & Public Sector',
      type: 'Special Assessment',
      description: 'Special infrastructure development assessment levied on municipal right-of-way utility duct leases.'
    }),
    r('tax_4', 'TAX-004', 'Cloud Digital Services Assessment (5%)', 'Active', 'Finance', 0, {
      name: 'Cloud Digital Services Assessment (5%)',
      rate: '5',
      region: 'Cross-Border SaaS',
      type: 'Digital Services Tax',
      description: 'Compliance tax applied to cloud-hosted AI copilot modules and autonomous agent compute licenses.'
    })
  ],

  terms: [
    r('trm_1', 'TRM-001', 'Standard Enterprise Carrier Commercial Terms', 'Active', 'Legal Operations', 0, {
      name: 'Standard Enterprise Carrier Commercial Terms',
      version: '3.4',
      category: 'Commercial Contracts',
      effectiveDate: d(-180),
      description: 'Net 30 payment schedule, 99.95% network availability SLA, $1,000,000 liability limitation, and automated late interest clauses.'
    }),
    r('trm_2', 'TRM-002', 'Public Sector & Government Fixed-Price Terms', 'Active', 'Legal Operations', 0, {
      name: 'Public Sector & Government Fixed-Price Terms',
      version: '2.1',
      category: 'Government Procurement',
      effectiveDate: d(-90),
      description: 'Milestone acceptance verification requirements, 60-day payment cycle, and ministry anti-corruption statutory compliance riders.'
    }),
    r('trm_3', 'TRM-003', 'Annual Prepaid Cloud SaaS Subscription Agreement', 'Active', 'Legal Operations', 0, {
      name: 'Annual Prepaid Cloud SaaS Subscription Agreement',
      version: '1.8',
      category: 'Software Licensing',
      effectiveDate: d(-60),
      description: 'Annual advance billing, 99.99% cloud uptime SLA guarantee, automated tenant data backup, and GDPR/CCPA data processing terms.'
    }),
    r('trm_4', 'TRM-004', 'Emergency Optical Restoration Time-and-Materials Rider', 'Active', 'Legal Operations', 0, {
      name: 'Emergency Optical Restoration Time-and-Materials Rider',
      version: '1.2',
      category: 'Carrier SLA',
      effectiveDate: d(-120),
      description: 'Defines 4-hour mobilization commitment, overtime technician hourly rates, and hazardous weather dispatch protocols.'
    })
  ],

  stockPolicies: [
    r('stk_1', 'STK-001', 'Negative Stock Prevention & Strict ATP Enactment', 'Active', 'Inventory Admin', 0, {
      name: 'Negative Stock Prevention & Strict ATP Enactment',
      setting: 'Disallow Negative Stock',
      threshold: '0',
      status: 'Active',
      description: 'Enforces available-to-promise validation before sales orders or field staging can be confirmed.'
    }),
    r('stk_2', 'STK-002', 'Safety Buffer Stock Minimum Reserve Policy (15%)', 'Active', 'Inventory Admin', 0, {
      name: 'Safety Buffer Stock Minimum Reserve Policy (15%)',
      setting: '15% Dedicated Reserve',
      threshold: '15',
      status: 'Active',
      description: 'Alerts the procurement desk and automatically generates purchase orders when depot stock dips below 15%.'
    }),
    r('stk_3', 'STK-003', 'Critical SFP+ Transceiver Escrow Allocation', 'Active', 'Inventory Admin', 0, {
      name: 'Critical SFP+ Transceiver Escrow Allocation',
      setting: 'Reserved for P1 Outages',
      threshold: '10',
      status: 'Active',
      description: 'Quarantines a dedicated reserve of 100G transceivers strictly for emergency carrier fiber restoration.'
    }),
    r('stk_4', 'STK-004', 'Multi-Depot Stock Auto-Replenishment Rules', 'Active', 'Inventory Admin', 0, {
      name: 'Multi-Depot Stock Auto-Replenishment Rules',
      setting: 'Lead Time 3 Days',
      threshold: '25',
      status: 'Active',
      description: 'Automatically triggers stock transfer requests from Miami Free Zone Depot to Kingston Central Logistics Hub.'
    })
  ],

  slaPolicies: [
    r('sla_1', 'SLA-001', 'P1 Mission-Critical Carrier Fiber Outage (15 Min / 2 Hr)', 'Active', 'Service Admin', 0, {
      name: 'P1 Mission-Critical Carrier Fiber Outage (15 Min / 2 Hr)',
      priority: 'Critical',
      firstResponse: '15 minutes',
      resolution: '2 hours',
      businessHours: '24/7/365 Continuous',
      description: 'Statutory carrier outage SLA triggering immediate NOC war room, SMS escalations, and rapid field dispatch.'
    }),
    r('sla_2', 'SLA-002', 'P2 High-Priority Enterprise Degradation (30 Min / 4 Hr)', 'Active', 'Service Admin', 0, {
      name: 'P2 High-Priority Enterprise Degradation (30 Min / 4 Hr)',
      priority: 'High',
      firstResponse: '30 minutes',
      resolution: '4 hours',
      businessHours: '24/7/365 Continuous',
      description: 'High-priority production disruption policy for packet loss, route flap, or hardware failover incidents.'
    }),
    r('sla_3', 'SLA-003', 'P3 Normal Technical Support & Configuration (2 Hr / 12 Hr)', 'Active', 'Service Admin', 0, {
      name: 'P3 Normal Technical Support & Configuration (2 Hr / 12 Hr)',
      priority: 'Normal',
      firstResponse: '2 business hours',
      resolution: '12 business hours',
      businessHours: 'Monday–Friday 08:00–18:00 EST',
      description: 'Standard technical assistance, firewall rule changes, and configuration requests.'
    }),
    r('sla_4', 'SLA-004', 'P4 Routine Inquiry & Administrative Task (4 Hr / 48 Hr)', 'Active', 'Service Admin', 0, {
      name: 'P4 Routine Inquiry & Administrative Task (4 Hr / 48 Hr)',
      priority: 'Low',
      firstResponse: '4 business hours',
      resolution: '48 business hours',
      businessHours: 'Monday–Friday 08:00–18:00 EST',
      description: 'General account inquiries, billing statement requests, and user profile management.'
    })
  ],

  users: [
    r('usr_0', 'USR-0000', 'Rahul Borkar', 'Active', 'System Admin', 0, {
      name: 'Rahul Borkar',
      email: 'rrborkar09@gmail.com',
      role: 'Tenant Owner & Platform Administrator',
      team: 'Executive Leadership & Engineering',
      status: 'Active',
      description: 'Primary tenant owner, full super-admin access across CRM, CPQ, and AI workforce.'
    }),
    r('usr_marlon', 'USR-0000B', 'Marlon Freckleton', 'Active', 'System Admin', 0, {
      name: 'Marlon Freckleton',
      email: 'mnfreckleton@gmail.com',
      role: 'Enterprise Operations Director & Co-Founder',
      team: 'Executive Leadership & Operations',
      status: 'Active',
      description: 'Operations Director, full administrative oversight across CRM fulfillment, orders, and logistics.'
    }),
    r('usr_1', 'USR-0001', 'Arjun Mehta', 'Active', 'System Admin', 0, {
      name: 'Arjun Mehta',
      email: 'arjun.mehta@example.com',
      role: 'Tenant Owner & Platform Administrator',
      team: 'Executive Leadership & Engineering',
      status: 'Active',
      description: 'Primary tenant owner, full super-admin access across CRM, CPQ, and AI workforce.'
    }),
    r('usr_2', 'USR-0002', 'Marcus Clarke', 'Active', 'System Admin', 0, {
      name: 'Marcus Clarke',
      email: 'marcus.clarke@example.com',
      role: 'Senior VP of Sales & Revenue Operations',
      team: 'Revenue & Commercial Operations',
      status: 'Active',
      description: 'Oversees enterprise sales pipeline, CPQ discount approvals, and carrier contracts.'
    }),
    r('usr_3', 'USR-0003', 'Devina Foster', 'Active', 'System Admin', 0, {
      name: 'Devina Foster',
      email: 'devina.foster@example.com',
      role: 'Director of Engineering & Delivery Projects',
      team: 'Project Management Office',
      status: 'Active',
      description: 'Manages fiber infrastructure rollouts, engineering budgets, and customer delivery milestones.'
    }),
    r('usr_4', 'USR-0004', 'Karen Thompson', 'Active', 'System Admin', 0, {
      name: 'Karen Thompson',
      email: 'karen.thompson@example.com',
      role: 'Lead Service Operations & NOC Commander',
      team: 'Customer Service & Carrier NOC',
      status: 'Active',
      description: 'Directs 24/7 technical support, optical line alarms, and SLA compliance.'
    }),
    r('usr_5', 'USR-0005', 'Andre Morgan', 'Active', 'System Admin', 0, {
      name: 'Andre Morgan',
      email: 'andre.morgan@example.com',
      role: 'Enterprise Account Executive (Telecom)',
      team: 'Revenue & Commercial Operations',
      status: 'Active',
      description: 'Account manager for regional telco carriers and public sector municipal bids.'
    }),
    r('usr_6', 'USR-0006', 'Sanjay Reid', 'Active', 'System Admin', 0, {
      name: 'Sanjay Reid',
      email: 'sanjay.reid@example.com',
      role: 'Commercial Pricing & CPQ Contracts Manager',
      team: 'Revenue & Commercial Operations',
      status: 'Active',
      description: 'Oversees product price books, margin guardrails, and customer master agreements.'
    }),
    r('usr_7', 'USR-0007', 'Sarah Jenkins', 'Active', 'System Admin', 0, {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      role: 'Lead Optical Systems Architect',
      team: 'Network Engineering & Field Deployment',
      status: 'Active',
      description: 'Supervises DWDM optical rings, OTDR trace certifications, and fiber cable pulling crews.'
    }),
    r('usr_8', 'USR-0008', 'Priya Sharma', 'Active', 'System Admin', 0, {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      role: 'AI Workforce & Governance Officer',
      team: 'AI Systems & Platform Infrastructure',
      status: 'Active',
      description: 'Oversees agent autonomy policies, conversational copilot guardrails, and audit logs.'
    })
  ],

  roles: [
    r('role_1', 'ROLE-001', 'Tenant Owner / Platform Administrator', 'Active', 'System Admin', 0, {
      name: 'Tenant Owner / Platform Administrator',
      scope: 'Global Tenant Scope',
      permissionsCount: '58',
      description: 'Unrestricted enterprise administrative permissions across database, billing, users, and security.'
    }),
    r('role_2', 'ROLE-002', 'Senior VP of Sales & Revenue Operations', 'Active', 'System Admin', 0, {
      name: 'Senior VP of Sales & Revenue Operations',
      scope: 'Commercial & Sales Modules',
      permissionsCount: '34',
      description: 'Full approval over quotes, opportunity stages, discount exceptions, and revenue forecasts.'
    }),
    r('role_3', 'ROLE-003', 'Customer Service & Carrier NOC Lead', 'Active', 'System Admin', 0, {
      name: 'Customer Service & Carrier NOC Lead',
      scope: 'Customer Service & SLA Desk',
      permissionsCount: '28',
      description: 'Manages support queues, ticket reassignment, SLA policy changes, and customer CSAT surveys.'
    }),
    r('role_4', 'ROLE-004', 'Project Delivery & Engineering Manager', 'Active', 'System Admin', 0, {
      name: 'Project Delivery & Engineering Manager',
      scope: 'Project Management & Resources',
      permissionsCount: '24',
      description: 'Controls project charters, milestone signoffs, task allocation, and project cost tracking.'
    }),
    r('role_5', 'ROLE-005', 'Finance & Contracts Controller', 'Active', 'System Admin', 0, {
      name: 'Finance & Contracts Controller',
      scope: 'Billing & Commercial CPQ',
      permissionsCount: '22',
      description: 'Authorizes sales orders, issues customer invoices, configures tax rules, and manages terms.'
    }),
    r('role_6', 'ROLE-006', 'AI Governance & Compliance Auditor', 'Active', 'System Admin', 0, {
      name: 'AI Governance & Compliance Auditor',
      scope: 'AI Intelligence & Audit Trail',
      permissionsCount: '19',
      description: 'Monitors agent workforce activity, model safety policies, copilot prompts, and compliance.'
    })
  ],

  teams: [
    r('team_1', 'TEAM-001', 'Executive Leadership & Platform Administration', 'Active', 'System Admin', 0, {
      name: 'Executive Leadership & Platform Administration',
      manager: 'Arjun Mehta',
      membersCount: '3',
      description: 'Strategic direction, tenant governance, and system-wide security oversight.'
    }),
    r('team_2', 'TEAM-002', 'Revenue & Commercial Operations', 'Active', 'Marcus Clarke', 0, {
      name: 'Revenue & Commercial Operations',
      manager: 'Marcus Clarke',
      membersCount: '8',
      description: 'Enterprise account executives, CPQ pricing specialists, and sales development reps.'
    }),
    r('team_3', 'TEAM-003', 'Customer Service & Carrier NOC', 'Active', 'Karen Thompson', 0, {
      name: 'Customer Service & Carrier NOC',
      manager: 'Karen Thompson',
      membersCount: '12',
      description: '24/7 mission-critical carrier NOC technicians, incident dispatchers, and SLA managers.'
    }),
    r('team_4', 'TEAM-004', 'Network Engineering & Field Deployment', 'Active', 'Sarah Jenkins', 0, {
      name: 'Network Engineering & Field Deployment',
      manager: 'Sarah Jenkins',
      membersCount: '15',
      description: 'Outdoor fiber pulling crews, fusion splicers, and telecommunications civil engineers.'
    }),
    r('team_5', 'TEAM-005', 'Project Management Office (PMO)', 'Active', 'Devina Foster', 0, {
      name: 'Project Management Office (PMO)',
      manager: 'Devina Foster',
      membersCount: '6',
      description: 'Project managers, scrum masters, and resource allocation controllers.'
    })
  ],

  appointments: [
    r('apt_1', 'APT-001', 'Technical Architecture Discovery: Metro Optical Ring', 'Confirmed', 'Arjun Mehta', 0, {
      name: 'Technical Architecture Discovery: Metro Optical Ring',
      customer: 'NovaTech Solutions',
      host: 'Arjun Mehta',
      attendee: 'Elena Vance',
      date: d(2),
      time: '10:00 AM EST',
      location: 'Virtual Conference (Encrypted Bridge)',
      description: 'Review optical routing ring schematics, core switch density, and fiber loss margins.'
    }),
    r('apt_2', 'APT-002', 'Quarterly Business Review (QBR): Fleet Telematics Pilot', 'Confirmed', 'Arjun Mehta', 0, {
      name: 'Quarterly Business Review (QBR): Fleet Telematics Pilot',
      customer: 'Apex Global Logistics',
      host: 'Arjun Mehta',
      attendee: 'Tariq Vance',
      date: d(4),
      time: '02:00 PM EST',
      location: 'Apex Executive Boardroom (Miami Hub)',
      description: 'Review pilot telemetry ingestion accuracy and evaluate Phase 2 SAP invoice automation.'
    }),
    r('apt_3', 'APT-003', 'Subsea Cable Landing Station Technical Tour & Audit', 'Confirmed', 'Marcus Clarke', 0, {
      name: 'Subsea Cable Landing Station Technical Tour & Audit',
      customer: 'Caribbean Fiber Solutions',
      host: 'Marcus Clarke',
      attendee: 'Janelle Brown',
      date: d(7),
      time: '11:00 AM EST',
      location: 'Kingston Coastal Landing Station',
      description: 'Inspect 400G optical transponder racks, backup generator power shelves, and physical security.'
    }),
    r('apt_4', 'APT-004', 'Municipal Smart Grid Procurement Briefing', 'Scheduled', 'Karen Thompson', 0, {
      name: 'Municipal Smart Grid Procurement Briefing',
      customer: 'Spalding Municipal Works',
      host: 'Karen Thompson',
      attendee: 'Tanya Blake',
      date: d(10),
      time: '09:30 AM EST',
      location: 'Parish Council Administration Chamber',
      description: 'Briefing on smart street lighting SCADA architecture and municipal Wi-Fi mesh rollout.'
    })
  ],

  webforms: [
    r('form_1', 'FORM-001', 'Enterprise High-Bandwidth Fiber Quote Request', 'Active', 'Digital Experience', 0, {
      name: 'Enterprise High-Bandwidth Fiber Quote Request',
      code: 'FORM-FBR-QUOTE',
      fieldsCount: '8',
      submissionsCount: '48',
      targetModule: 'Leads & Opportunities',
      description: 'Public web form capturing company domain, bandwidth requirement, and GPS location coordinates.'
    }),
    r('form_2', 'FORM-002', '24/7 Mission-Critical Carrier Incident Form', 'Active', 'Customer Operations', 0, {
      name: '24/7 Mission-Critical Carrier Incident Form',
      code: 'FORM-NOC-INCIDENT',
      fieldsCount: '6',
      submissionsCount: '19',
      targetModule: 'Service Desk Cases',
      description: 'Authenticated portal form allowing authorized telco partners to log emergency P1 fiber disruptions.'
    }),
    r('form_3', 'FORM-003', 'Consultation & Pre-Engineering Site Survey Request', 'Active', 'Sales Operations', 0, {
      name: 'Consultation & Pre-Engineering Site Survey Request',
      code: 'FORM-SITE-SURVEY',
      fieldsCount: '7',
      submissionsCount: '32',
      targetModule: 'Appointments & Sales Activities',
      description: 'Captures facility addresses, right-of-way duct access notes, and preferred survey dates.'
    }),
    r('form_4', 'FORM-004', 'Parish Council Public Sector Tender Registration', 'Active', 'Public Sector Desk', 0, {
      name: 'Parish Council Public Sector Tender Registration',
      code: 'FORM-CIVIC-TENDER',
      fieldsCount: '9',
      submissionsCount: '11',
      targetModule: 'Government Opportunities',
      description: 'Standardized municipal tender form compliant with Jamaican and Caribbean public procurement rules.'
    })
  ],

  duplicates: [
    r('dup_1', 'DUP-001', 'NovaTech Solutions vs. NovaTech Cloud Holding', 'Review Required', 'Data Governance', 0, {
      name: 'NovaTech Solutions vs. NovaTech Cloud Holding',
      entity: 'Organizations',
      confidence: '94%',
      primaryRecord: 'ORG-2026-00041',
      duplicateRecord: 'ORG-TEMP-9912',
      description: 'Potential duplicate detected via matching domain (novatech.example) and tax registration number.'
    }),
    r('dup_2', 'DUP-002', 'Marcus Sterling (Duplicate Contact Record)', 'Review Required', 'Data Governance', 0, {
      name: 'Marcus Sterling (Duplicate Contact Record)',
      entity: 'Contacts',
      confidence: '98%',
      primaryRecord: 'CON-00108',
      duplicateRecord: 'CON-TEMP-8831',
      description: 'Identical email address (marcus.sterling@novatech.example) detected from trade show scan.'
    }),
    r('dup_3', 'DUP-003', 'Apex Fleet Telematics (Duplicate Opportunity Record)', 'Review Required', 'Data Governance', 0, {
      name: 'Apex Fleet Telematics (Duplicate Opportunity Record)',
      entity: 'Opportunities',
      confidence: '89%',
      primaryRecord: 'OPP-2026-00215',
      duplicateRecord: 'OPP-TEMP-4421',
      description: 'Duplicate deal created by external SDR agent; needs merge into active negotiation pipeline.'
    })
  ],

  recycleBin: [
    r('del_1', 'REC-2026-0091', 'Legacy Cisco Catalyst 2960-X Switch (End-of-Life SKU)', 'Deleted', 'System Admin', 0, {
      originalEntity: 'products',
      sku: 'NCT-CISCO-2960',
      category: 'Hardware',
      reason: 'Deprecated SKU replaced by Catalyst 9300 Series',
      deletedAt: d(-14),
      description: 'Soft-deleted legacy network hardware product.'
    }),
    r('del_2', 'REC-2026-0092', 'Preliminary 2025 Telecom Surcharge Draft Rule', 'Deleted', 'Finance Director', 0, {
      originalEntity: 'taxes',
      code: 'TAX-DRAFT-2025',
      region: 'Regional Caribbean',
      rate: '3.5%',
      reason: 'Superseded by updated regional finance ministry statutory guidelines',
      deletedAt: d(-20),
      description: 'Superseded preliminary digital tax rule.'
    }),
    r('del_3', 'REC-2026-0093', 'Old Inactive Supplier: Island Optical Spares Ltd.', 'Deleted', 'Procurement', 0, {
      originalEntity: 'vendors',
      vendorCode: 'VEN-OLD-0012',
      reason: 'Merged operations with Caribbean Wholesale Logistics',
      deletedAt: d(-30),
      description: 'Decommissioned supplier profile.'
    }),
    r('del_4', 'REC-2026-0094', 'Draft Stale Lead: Clarendon General Trading', 'Deleted', 'Sales Operations', 0, {
      originalEntity: 'leads',
      leadRef: 'LEAD-2025-00012',
      reason: 'Unresponsive after 6 attempts; prospect ceased operations',
      deletedAt: d(-45),
      description: 'Soft-deleted unviable prospect lead.'
    })
  ],

  internalTickets: [
    r('it_1', 'IT-2026-00001', 'Configure Zero-Downtime SSO SAML Certificate Rollover', 'In Progress', 'Arjun Mehta', 0, {
      subject: 'Configure Zero-Downtime SSO SAML Certificate Rollover',
      requester: 'Arjun Mehta',
      department: 'Platform Engineering',
      priority: 'High',
      status: 'In Progress',
      assigned: 'Arjun Mehta',
      date: d(-1),
      description: 'Update the identity provider X.509 certificate across active enterprise tenant domains.'
    }),
    r('it_2', 'IT-2026-00002', 'Provision High-Throughput Redis Stream for Ingestion Worker', 'Resolved', 'DevOps Team', 0, {
      subject: 'Provision High-Throughput Redis Stream for Ingestion Worker',
      requester: 'Elena Vance',
      department: 'Cloud Infrastructure',
      priority: 'Normal',
      status: 'Resolved',
      assigned: 'DevOps Team',
      date: d(-3),
      description: 'Allocated dedicated memory cache instance for high-speed telematics telemetry buffering.'
    }),
    r('it_3', 'IT-2026-00003', 'Calibrate Field OTDR Optical Reflectometer Instruments', 'Open', 'Sarah Jenkins', 0, {
      subject: 'Calibrate Field OTDR Optical Reflectometer Instruments',
      requester: 'Sarah Jenkins',
      department: 'Field Engineering',
      priority: 'Normal',
      status: 'Open',
      assigned: 'Sarah Jenkins',
      date: d(-2),
      description: 'Annual ISO/IEC optical power calibration for precision field fusion test kits.'
    }),
    r('it_4', 'IT-2026-00004', 'Configure CPQ Margin Warning Alert Threshold in PostgreSQL', 'Resolved', 'Sanjay Reid', 0, {
      subject: 'Configure CPQ Margin Warning Alert Threshold in PostgreSQL',
      requester: 'Sanjay Reid',
      department: 'Commercial Operations',
      priority: 'Normal',
      status: 'Resolved',
      assigned: 'Arjun Mehta',
      date: d(-6),
      description: 'Implemented automated policy rule triggering manager approval when quote margin is below 22%.'
    })
  ],

  employees: [
    r('emp_1', 'EMP-0001', 'Arjun Mehta', 'Active', 'Executive', 0, {
      name: 'Arjun Mehta',
      title: 'Tenant Owner & Chief Technology Officer',
      department: 'Executive Leadership',
      email: 'arjun.mehta@example.com',
      phone: '+1 876 555 0101',
      location: 'Kingston HQ / Remote',
      manager: 'Board of Directors',
      description: 'Platform architecture lead, core database security, and executive operations.'
    }),
    r('emp_2', 'EMP-0002', 'Marcus Clarke', 'Active', 'Sales', 0, {
      name: 'Marcus Clarke',
      title: 'Senior VP of Global Revenue Operations',
      department: 'Revenue & Commercial Operations',
      email: 'marcus.clarke@example.com',
      phone: '+1 876 555 0102',
      location: 'Kingston HQ',
      manager: 'Arjun Mehta',
      description: 'Leads commercial negotiations, CPQ discount policies, and strategic carrier alliances.'
    }),
    r('emp_3', 'EMP-0003', 'Devina Foster', 'Active', 'Engineering', 0, {
      name: 'Devina Foster',
      title: 'Director of Telecom Engineering Projects',
      department: 'Project Management Office',
      email: 'devina.foster@example.com',
      phone: '+1 876 555 0103',
      location: 'Kingston HQ',
      manager: 'Arjun Mehta',
      description: 'Supervises enterprise infrastructure deliveries, fiber build schedules, and civil works.'
    }),
    r('emp_4', 'EMP-0004', 'Karen Thompson', 'Active', 'Customer Service', 0, {
      name: 'Karen Thompson',
      title: 'Carrier NOC Incident Commander',
      department: 'Customer Service & Carrier NOC',
      email: 'karen.thompson@example.com',
      phone: '+1 876 555 0104',
      location: '24/7 Carrier NOC Center',
      manager: 'Arjun Mehta',
      description: 'Oversees 24/7 technical incident resolution, optical line alarms, and SLA enforcement.'
    }),
    r('emp_5', 'EMP-0005', 'Sarah Jenkins', 'Active', 'Field Operations', 0, {
      name: 'Sarah Jenkins',
      title: 'Lead Optical Splicing & Test Engineer',
      department: 'Network Engineering & Field Deployment',
      email: 'sarah.jenkins@example.com',
      phone: '+1 876 555 0105',
      location: 'Field Operations / Mobile',
      manager: 'Devina Foster',
      description: 'Precision fusion splicing, OTDR loss characterization, and subsea cable terminal maintenance.'
    }),
    r('emp_6', 'EMP-0006', 'Sanjay Reid', 'Active', 'Finance', 0, {
      name: 'Sanjay Reid',
      title: 'Commercial Contracts & CPQ Manager',
      department: 'Revenue & Commercial Operations',
      email: 'sanjay.reid@example.com',
      phone: '+1 876 555 0106',
      location: 'Kingston HQ',
      manager: 'Marcus Clarke',
      description: 'Manages master service agreements, commercial billing schedules, and catalog price books.'
    })
  ],

  knowledge: [
    r('kb_1', 'KB-00018', 'Fiber Optical Loss Troubleshooting Checklist & SOP', 'Published', 'Service Operations', 0, {
      title: 'Fiber Optical Loss Troubleshooting Checklist & SOP',
      category: 'Physical Layer Diagnostics',
      visibility: 'Internal & Carrier Partners',
      version: '2.1',
      owner: 'Sarah Jenkins',
      content: 'Step 1: Inspect patch lead faces with digital microscope. Step 2: Clean ferrule with optical dry cleaner. Step 3: Connect calibrated optical power meter at 1310/1550nm. Step 4: Perform OTDR trace to pinpoint micro-bends.',
      description: 'Approved standard operating procedure for frontline service teams.'
    }),
    r('kb_2', 'KB-00019', 'Enterprise SSO SAML 2.0 Identity Provider Configuration Runbook', 'Published', 'Platform Engineering', 0, {
      title: 'Enterprise SSO SAML 2.0 Identity Provider Configuration Runbook',
      category: 'Security & Identity',
      visibility: 'Internal & Administrators',
      version: '1.4',
      owner: 'Arjun Mehta',
      content: 'Standard metadata XML upload, entity ID matching, and tenant claim mapping for Okta, Azure AD and Google Workspace.',
      description: 'Technical runbook for zero-downtime identity federation.'
    }),
    r('kb_3', 'KB-00020', 'CPQ Margin Guardrails and Discount Escalation Matrix', 'Published', 'Commercial Operations', 0, {
      title: 'CPQ Margin Guardrails and Discount Escalation Matrix',
      category: 'Commercial Policies',
      visibility: 'Internal Sales Staff',
      version: '3.0',
      owner: 'Sanjay Reid',
      content: 'Discounts up to 5% require SDR Manager approval. Discounts between 5% and 12% require VP of Revenue. Discounts > 12% require Tenant Owner authorization.',
      description: 'Policy guidance for commercial quote drafting.'
    })
  ],

  surveys: [
    r('sur_1', 'SUR-00011', 'Post-Resolution Customer Satisfaction Survey (CSAT)', 'Active', 'Customer Experience', 0, {
      name: 'Post-Resolution Customer Satisfaction Survey (CSAT)',
      channel: 'Email & In-App Portal',
      question: 'How satisfied are you with the timeliness and resolution of your technical case?',
      scale: '1–5 Stars (ITIL Standard)',
      description: 'Triggered automatically upon case resolution; generates NPS and CSAT operational metrics.'
    }),
    r('sur_2', 'SUR-00012', 'Enterprise Network Delivery Project Handover Survey', 'Active', 'Customer Experience', 0, {
      name: 'Enterprise Network Delivery Project Handover Survey',
      channel: 'Digital Signature Portal',
      question: 'Did the optical deployment meet the agreed SLA specifications and schedule?',
      scale: '1–10 Recommendation Score',
      description: 'Executive survey completed by enterprise sponsor following milestone signoff.'
    })
  ],

  campaigns: [
    r('camp_1', 'CMP-2026-00019', 'Metro Fiber Ring Expansion Campaign 2026', 'Active', 'Lisa Campbell', 25000, {
      name: 'Metro Fiber Ring Expansion Campaign 2026',
      type: 'Multi-Channel B2B Demand Gen',
      audience: 'Enterprise & Carrier Wholesale',
      segment: 'Telecom Decision Makers',
      startDate: d(-15),
      endDate: d(45),
      channel: 'Direct Email + Executive Webinars',
      budget: '25000',
      objective: 'Generate 20 qualified enterprise fiber access opportunities across regional metros.',
      status: 'Active',
      sent: '4,120',
      opens: '1,892',
      clicks: '584',
      conversions: '42',
      description: 'Targeted campaign educating regional enterprises on dark fiber latency advantages.'
    }),
    r('camp_2', 'CMP-2026-00020', 'Autonomous AI Workforce Enterprise Launch', 'Active', 'Lisa Campbell', 35000, {
      name: 'Autonomous AI Workforce Enterprise Launch',
      type: 'Executive Briefing Series',
      audience: 'Chief Technology Officers & CIOs',
      segment: 'High-Growth Tech & Finance',
      startDate: d(-10),
      endDate: d(60),
      channel: 'LinkedIn InMail + In-Person Breakfast',
      budget: '35000',
      objective: 'Position SYVORIS autonomous agents for tier-1 sales and technical support automation.',
      status: 'Active',
      sent: '2,400',
      opens: '1,320',
      clicks: '460',
      conversions: '31',
      description: 'Executive briefings presenting measurable ROI from autonomous CRM copilot workflows.'
    })
  ],

  segments: [
    r('seg_1', 'SEG-0001', 'High-Bandwidth Enterprise Cloud Tenants', 'Active', 'Lisa Campbell', 0, {
      name: 'High-Bandwidth Enterprise Cloud Tenants',
      criteria: 'Credit Limit > $100,000 AND Industry = Telecommunications OR Financial Services',
      members: '24',
      owner: 'Lisa Campbell',
      description: 'Tier-1 clients eligible for dedicated 100G and 400G optical dark fiber leases.'
    }),
    r('seg_2', 'SEG-0002', 'Municipal & Civic Smart City Prospects', 'Active', 'Lisa Campbell', 0, {
      name: 'Municipal & Civic Smart City Prospects',
      criteria: 'Segment = Government AND Territory = Caribbean Regional',
      members: '16',
      owner: 'Lisa Campbell',
      description: 'Parish councils and civic utility departments planning smart grid infrastructure.'
    })
  ],

  priceBooks: [
    r('pb_1', 'PB-0001', 'Enterprise Standard Price Book (USD)', 'Active', 'Commercial Operations', 0, {
      name: 'Enterprise Standard Price Book (USD)',
      currency: 'USD',
      segment: 'Enterprise',
      effectiveDate: d(-60),
      description: 'Primary price book containing list prices for all hardware, fiber cabling, and cloud subscriptions.'
    }),
    r('pb_2', 'PB-0002', 'Carrier Wholesale Tier-1 Volume Agreement', 'Active', 'Commercial Operations', 0, {
      name: 'Carrier Wholesale Tier-1 Volume Agreement',
      currency: 'USD',
      segment: 'Carrier Wholesale',
      effectiveDate: d(-90),
      description: 'Volume discount price schedule for licensed regional telecom carriers.'
    })
  ],

  purchaseOrders: [
    r('po_1', 'PO-2026-00018', 'Core Cisco Catalyst Switching Order', 'Approved', 'Procurement', 48900, {
      name: 'Core Cisco Catalyst Switching Order',
      vendor: 'Cisco Systems Inc.',
      status: 'Approved',
      requestedDate: d(12),
      terms: 'Net 30',
      description: 'Replenishment order for 10x Cisco 9300 switches for upcoming metro projects.'
    }, { vendors: ['ven_1'] }),

    r('po_2', 'PO-2026-00019', 'Corning Armored Optical Fiber Replenishment', 'Approved', 'Procurement', 36750, {
      name: 'Corning Armored Optical Fiber Replenishment',
      vendor: 'Corning Optical Communications',
      status: 'Approved',
      requestedDate: d(8),
      terms: 'Net 30',
      description: '15 reels of 96-core heavy outdoor armored fiber cable.'
    }, { vendors: ['ven_3'] })
  ],

  agents: [
    r('agent_1', 'AGT-0001', 'SDR Qualification Copilot', 'Active', 'Revenue Operations', 0, {
      name: 'SDR Qualification Copilot',
      role: 'Inbound Lead Qualification',
      purpose: 'Capture, enrich, score and route leads within 60 seconds.',
      autonomy: 'Suggest Only',
      module: 'Lead Capture',
      kpi: 'Qualified opportunities / response time',
      status: 'Active',
      permissions: 'Read leads; propose assignments; draft outreach',
      owner: 'Revenue Operations'
    }),
    r('agent_2', 'AGT-0002', 'Deal & Pipeline Velocity Agent', 'Active', 'Sales Operations', 0, {
      name: 'Deal & Pipeline Velocity Agent',
      role: 'Deal Execution & Stalling Detection',
      purpose: 'Surface deal risks, next best steps, and stage slippages.',
      autonomy: 'Act with Approval',
      module: 'Sales Pipeline',
      kpi: 'Stage velocity / win rate',
      status: 'Active',
      permissions: 'Read opportunities; propose tasks and stage transitions',
      owner: 'Sales Operations'
    }),
    r('agent_3', 'AGT-0003', 'Commercial CPQ & Pricing Agent', 'Active', 'Commercial Operations', 0, {
      name: 'Commercial CPQ & Pricing Agent',
      role: 'Commercial Quote Drafting',
      purpose: 'Draft quotes from approved price books and verify margin guardrails.',
      autonomy: 'Act with Approval',
      module: 'Quotes & CPQ',
      kpi: 'Quote turnaround / margin protection',
      status: 'Active',
      permissions: 'Read catalog; draft quotes; calculate discounts',
      owner: 'Commercial Operations'
    }),
    r('agent_4', 'AGT-0004', 'Carrier Service & NOC Incident Agent', 'Active', 'Customer Operations', 0, {
      name: 'Carrier Service & NOC Incident Agent',
      role: 'Support Triage & Diagnostic Grounding',
      purpose: 'Retrieve approved knowledge articles and propose rapid case resolutions.',
      autonomy: 'Suggest Only',
      module: 'Service Desk',
      kpi: 'First-contact resolution / SLA compliance',
      status: 'Active',
      permissions: 'Read cases and approved SOPs; draft responses',
      owner: 'Customer Operations'
    }),
    r('agent_5', 'AGT-0005', 'Revenue Digital Twin Simulator', 'Active', 'Revenue Operations', 0, {
      name: 'Revenue Digital Twin Simulator',
      role: 'Predictive Monte Carlo Simulation',
      purpose: 'Simulate commercial deal closures, cash flow timing, and ARR trajectories.',
      autonomy: 'Suggest Only',
      module: 'Analytics & Twin',
      kpi: 'Forecast variance / accuracy',
      status: 'Active',
      permissions: 'Read deals, orders, and macro indicators',
      owner: 'Revenue Operations'
    }),
    r('agent_6', 'AGT-0006', 'Enterprise Compliance & Security Guardian', 'Active', 'Risk & Compliance', 0, {
      name: 'Enterprise Compliance & Security Guardian',
      role: 'Policy Supervision & Audit',
      purpose: 'Supervise agent tool calls against data residency and consent policies.',
      autonomy: 'Act with Approval',
      module: 'AI Governance',
      kpi: 'Prevented policy breaches / zero false positives',
      status: 'Active',
      permissions: 'Inspect all agent events; block non-compliant writes',
      owner: 'Risk & Compliance'
    })
  ],

  decisions: [
    r('dec_1', 'DEC-2026-00027', 'CPQ Discount Exception Approval on QT-2026-00112', 'Approved', 'Marcus Clarke', 0, {
      name: 'CPQ Discount Exception Approval on QT-2026-00112',
      agent: 'Commercial CPQ & Pricing Agent',
      action: 'Approve 5% volume discount on NovaTech Optical Ring Infrastructure Quote',
      reason: 'Standard volume threshold met; gross margin remains above 38% policy floor.',
      evidence: 'Gross margin: 39.4% · Target: >35% · Customer lifetime value: $850k',
      policy: 'Commercial Discount Guardrail Policy v3.2',
      confidence: '0.96',
      autonomy: 'Act with Approval',
      status: 'Approved',
      relatedTo: 'QT-2026-00112',
      description: 'Approved by Senior VP of Revenue Operations Marcus Clarke.'
    }, { quotes: ['qt_1'] })
  ],

  documents: [
    r('doc_1', 'DOC-2026-00018', 'NovaTech Metro Core Optical Ring Engineering Plan', 'Available', 'Arjun Mehta', 0, {
      name: 'NovaTech Metro Core Optical Ring Engineering Plan',
      type: 'Technical Specification',
      relatedTo: 'OPP-2026-00214',
      version: '2.0',
      owner: 'Arjun Mehta',
      description: 'Approved optical route schematics, conduit cross-sections, and splice loss budget.'
    })
  ],

  interactions: [
    r('act_1', 'ACT-2026-00128', 'Executive Scope Alignment with Marcus Sterling', 'Completed', 'Arjun Mehta', 0, {
      subject: 'Executive Scope Alignment with Marcus Sterling',
      type: 'Meeting',
      channel: 'Video Call',
      relatedTo: 'NovaTech Solutions',
      date: d(-2),
      summary: 'Confirmed delivery schedule for Metro Optical Ring and finalized equipment staging milestones.',
      consent: 'Direct corporate email and calendar confirmed'
    }, { organizations: ['org_1'], contacts: ['con_1'] }),

    r('act_2', 'ACT-2026-00129', 'Fleet Telematics SAP Sync Review with Tariq Vance', 'Completed', 'Arjun Mehta', 0, {
      subject: 'Fleet Telematics SAP Sync Review with Tariq Vance',
      type: 'Call',
      channel: 'Phone',
      relatedTo: 'Apex Global Logistics',
      date: d(-1),
      summary: 'Validated real-time MQTT packet payloads and confirmed SAP ERP webhook credentials.',
      consent: 'Phone contact authorized'
    }, { organizations: ['org_2'], contacts: ['con_3'] })
  ],

  events: [
    r('evt_1', 'EVT-2026-00018', 'lead.qualified', 'Published', 'Event Fabric', 0, {
      name: 'lead.qualified',
      entityRef: 'LEAD-2026-00081',
      delivery: 'Published',
      at: d(-2),
      description: 'Municipal smart city lead passed qualification threshold score of 87.'
    }),
    r('evt_2', 'EVT-2026-00019', 'quote.approval_granted', 'Published', 'Event Fabric', 0, {
      name: 'quote.approval_granted',
      entityRef: 'QT-2026-00112',
      delivery: 'Published',
      at: d(-1),
      description: 'Quote discount approved by Revenue Operations; quote released to customer.'
    })
  ],

  audit: [
    r('aud_1', 'AUD-2026-00044', 'Quote Approval Exception Logged', 'Recorded', 'System', 0, {
      name: 'Quote Approval Exception Logged',
      actor: 'Marcus Clarke',
      target: 'QT-2026-00112',
      policy: 'Commercial Discount Guardrail Policy v3.2',
      timestamp: new Date().toISOString(),
      description: 'Approved 5% commercial discount exception on NovaTech CPQ quote.'
    }),
    r('aud_2', 'AUD-2026-00045', 'PostgreSQL Tenant RLS Policy Verified', 'Recorded', 'System', 0, {
      name: 'PostgreSQL Tenant RLS Policy Verified',
      actor: 'Platform Engine',
      target: 'Tenant bluepeak-innovations',
      policy: 'Row-Level Security Tenant Isolation',
      timestamp: new Date().toISOString(),
      description: 'Automated cryptographic check confirmed all query filters enforce active tenant ID context.'
    })
  ],

  imports: [],
  sequences: [
    r('seq_1', 'SEQ-001', 'Enterprise Cloud & Dark Fiber Outreach Sequence', 'Active', 'Marcus Clarke', 0, {
      name: 'Enterprise Cloud & Dark Fiber Outreach Sequence',
      stepsCount: '5',
      activeProspects: '28',
      replyRate: '24%',
      description: 'Automated 5-step touchpoint sequence combining personalized email, phone follow-up, and LinkedIn touchpoints.'
    })
  ],
  playbooks: [
    r('pbk_1', 'PBK-001', 'Enterprise Tier-1 Carrier Deal Playbook', 'Active', 'Marcus Clarke', 0, {
      name: 'Enterprise Tier-1 Carrier Deal Playbook',
      stage: 'Proposal & Negotiation',
      stepsCount: '6',
      description: 'Step-by-step guidance on RFP response, optical SLA guarantees, liability terms, and pricing defense.'
    })
  ],
  settings: [],
  workflows: [
    r('wf_1', 'WF-001', 'High-Score Lead Automatic Assignment Rule', 'Active', 'System Admin', 0, {
      name: 'High-Score Lead Automatic Assignment Rule',
      trigger: 'lead.created',
      condition: 'Score >= 80',
      action: 'Assign Senior Account Executive & Send Instant Notification',
      description: 'Routes high-intent leads to senior sales reps within 60 seconds.'
    })
  ],
  loyalty: [],
  scenarios: [
    r('scn_1', 'SCN-0001', 'Baseline Pipeline Trajectory (+10% Win Rate)', 'Simulated', 'Revenue Operations', 0, {
      name: 'Baseline Pipeline Trajectory (+10% Win Rate)',
      baseline: 'Current Weighted Pipeline ($1.9M)',
      change: 'Increase stage conversion velocity by 10 points',
      outcome: 'Estimated ARR: $2.4M (+26%)',
      description: 'Monte Carlo simulation assuming AI copilot accelerates proposal turnaround from 7 days to 24 hours.'
    })
  ],
  leadSources: [
    r('src_1', 'SRC-0001', 'Direct Enterprise Inbound & Website', 'Active', 'Marketing', 0, {
      name: 'Direct Enterprise Inbound & Website',
      type: 'Inbound Digital',
      conversionRate: '18%',
      description: 'Web forms, technical documentation downloads, and live chat captures.'
    }),
    r('src_2', 'SRC-0002', 'Strategic Partner & Carrier Consortium', 'Active', 'Sales', 0, {
      name: 'Strategic Partner & Carrier Consortium',
      type: 'Channel Partner',
      conversionRate: '34%',
      description: 'Introductions from subsea landing station operators and hardware distributors.'
    })
  ],
  trackers: [
    r('trk_1', 'TRK-001', 'Enterprise Dark Fiber Intent Tracker', 'Active', 'Digital Experience', 0, {
      name: 'Enterprise Dark Fiber Intent Tracker',
      domain: 'syvoris.example/network-map',
      dwellThreshold: '30s',
      action: 'Log High-Intent Telemetry Signal',
      description: 'Monitors regional dark fiber map route searches and enriches lead scoring.'
    })
  ],
  mailroom: [
    r('mlr_1', 'MLR-001', 'support@syvoris.example Inbound Mailroom', 'Active', 'Support Admin', 0, {
      name: 'support@syvoris.example Inbound Mailroom',
      email: 'support@syvoris.example',
      routingRule: 'Auto Case Creation & P1 Alarm Detection',
      defaultPriority: 'Normal',
      description: 'Parses inbound support emails and creates structured support cases with SLA timers.'
    })
  ],
  preferences: [
    r('prf_1', 'PRF-001', 'NovaTech Solutions Enterprise Preferences', 'Active', 'Arjun Mehta', 0, {
      name: 'NovaTech Solutions Enterprise Preferences',
      customer: 'NovaTech Solutions',
      emailFrequency: 'Daily digest',
      phoneContact: 'Marcus Sterling (Procurement)',
      emergencySMS: 'Enabled for P1 outages',
      dataResidency: 'Dedicated Cloud Tenant',
      description: 'Customer communication and compliance preferences.'
    })
  ],
  integrations: [
    r('int_1', 'INT-0001', 'Radium ERP Connector (SAP / Oracle)', 'Active', 'Platform Admin', 0, {
      name: 'Radium ERP Connector (SAP / Oracle)',
      type: 'ERP / Inventory / Financials',
      environment: 'Production Cloud',
      status: 'Active',
      ownership: 'Bidirectional Sync',
      description: 'Real-time synchronization for sales orders, stock ATP availability, and customer invoicing.'
    }),
    r('int_2', 'INT-0002', 'SendGrid / AWS SES Enterprise Communications', 'Active', 'Platform Admin', 0, {
      name: 'SendGrid / AWS SES Enterprise Communications',
      type: 'Transactional Email',
      environment: 'Production Cloud',
      status: 'Active',
      ownership: 'Outbound Delivery',
      description: 'Enterprise SMTP/API connector for quote delivery, case alerts, and CSAT surveys.'
    }),
    r('int_3', 'INT-0003', 'Twilio Telecom SMS & Voice Bridge', 'Active', 'Platform Admin', 0, {
      name: 'Twilio Telecom SMS & Voice Bridge',
      type: 'Voice & SMS Gateway',
      environment: 'Production Cloud',
      status: 'Active',
      ownership: 'Two-Way Gateway',
      description: 'Emergency 2FA codes, P1 carrier incident escalation phone calls, and dispatch SMS.'
    }),
    r('int_4', 'INT-0004', 'Stripe Enterprise Commercial Invoicing Engine', 'Active', 'Platform Admin', 0, {
      name: 'Stripe Enterprise Commercial Invoicing Engine',
      type: 'Payment & Subscription Gateway',
      environment: 'Production Cloud',
      status: 'Active',
      ownership: 'Financial Clearing',
      description: 'Automated credit card, ACH, and regional wire transfer processing for recurring software subscriptions.'
    })
  ]
};
