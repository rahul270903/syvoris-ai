import { useState, useMemo } from 'react';
import {
  Users, UserCheck, Search, Filter, Phone, Mail, MapPin,
  Building2, Briefcase, Plus, CheckCircle2, Clock, Shield,
  Award, ChevronRight, X, PhoneCall, MessageSquare, Laptop,
  Key, ArrowRight, Download, Send, Check
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'Executive' | 'Sales & Business Dev' | 'Field Engineering' | 'Customer Support' | 'IT & Security' | 'Finance & Billing';
  email: string;
  phone: string;
  extension: string;
  location: string;
  manager: string;
  status: 'Active' | 'In Field' | 'On Leave' | 'Remote';
  hireDate: string;
  tenure: string;
  skills: string[];
  equipment: { type: string; serial: string; status: string }[];
  assignedTicketsCount: number;
  bio: string;
}

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Arjun Mehta',
    role: 'Senior Account Executive & Enterprise Lead',
    department: 'Sales & Business Dev',
    email: 'arjun.mehta@bluepeak.internal',
    phone: '+1 (876) 920-4101',
    extension: '4101',
    location: 'Kingston HQ · Floor 4',
    manager: 'Sarah Jenkins (VP Commercial)',
    status: 'Active',
    hireDate: '2023-03-15',
    tenure: '3.6 Years',
    skills: ['Enterprise SaaS', 'Carrier Contracts', 'CPQ Pricing', 'Cisco Gold Partnering'],
    equipment: [
      { type: 'MacBook Pro 16" M3 Max', serial: 'C02G8721MD6T', status: 'Assigned' },
      { type: 'YubiKey 5C NFC Security Key', serial: 'YB-8921-99', status: 'Enrolled' }
    ],
    assignedTicketsCount: 2,
    bio: 'Leads strategic telco and logistics accounts across Jamaica, Barbados, and Trinidad & Tobago. Specialist in complex SLA negotiations and fiber optic rollouts.'
  },
  {
    id: 'emp-2',
    name: 'Dr. Evelyn Reed',
    role: 'Director of AI Architecture & Systems',
    department: 'Executive',
    email: 'evelyn.reed@bluepeak.internal',
    phone: '+1 (876) 920-4002',
    extension: '4002',
    location: 'Miami Innovation Lab / Remote',
    manager: 'Chief Executive Officer',
    status: 'Active',
    hireDate: '2022-08-01',
    tenure: '4.2 Years',
    skills: ['PostgreSQL pgvector', 'PyTorch & CUDA', 'Agentic Workflows', 'ISO 42001 AI Safety'],
    equipment: [
      { type: 'ThinkPad P1 Gen 6 RTX 4090', serial: 'PF-289410-X', status: 'Assigned' },
      { type: 'FIDO2 Dual-factor Bio Token', serial: 'FIDO-7712', status: 'Enrolled' }
    ],
    assignedTicketsCount: 1,
    bio: 'Oversees SYVORIS AI inference layer, autonomous agentic governance frameworks, and multi-tenant RLS isolation architecture.'
  },
  {
    id: 'emp-3',
    name: 'Marcus Vance',
    role: 'Lead Field Fiber Splicing Specialist',
    department: 'Field Engineering',
    email: 'marcus.v@bluepeak.internal',
    phone: '+1 (876) 920-4215',
    extension: '4215',
    location: 'Kingston Depot & Field Operations',
    manager: 'Carlos Santana (Head of Network Ops)',
    status: 'In Field',
    hireDate: '2023-11-10',
    tenure: '2.9 Years',
    skills: ['Fujikura 90S+ Core Alignment', 'OTDR Trace Analysis', 'Span Loss Testing', 'OS2 Single-Mode'],
    equipment: [
      { type: 'Fujikura 90S+ Fusion Splicer', serial: 'FJ-90S-88219', status: 'Checked Out' },
      { type: 'EXFO FTB-1v2 Pro OTDR', serial: 'EXFO-44102', status: 'Checked Out' },
      { type: 'Panasonic Toughbook 55', serial: 'TB-99120', status: 'Assigned' }
    ],
    assignedTicketsCount: 4,
    bio: 'Senior certified optical technician heading emergency restoration and metropolitan fiber backbone expansions across Greater Kingston and Spanish Town.'
  },
  {
    id: 'emp-4',
    name: 'David Sterling',
    role: 'Lead Infrastructure & Security Engineer',
    department: 'IT & Security',
    email: 'david.sterling@bluepeak.internal',
    phone: '+1 (876) 920-4330',
    extension: '4330',
    location: 'Kingston HQ · Server Enclave B',
    manager: 'Carlos Santana (Head of Network Ops)',
    status: 'Active',
    hireDate: '2024-01-15',
    tenure: '2.8 Years',
    skills: ['WireGuard IPSec VPN', 'BGP & OSPF Routing', 'Cisco Catalyst 9300', 'SOC2 Type II Audit'],
    equipment: [
      { type: 'Dell Precision 5680 Workstation', serial: 'DL-5680-411', status: 'Assigned' },
      { type: 'Hardware Console Server Dongle', serial: 'CS-8812', status: 'Enrolled' }
    ],
    assignedTicketsCount: 3,
    bio: 'Manages secure edge gateways, tenant VPC interconnects, zero-trust network access, and physical access badge telemetry.'
  },
  {
    id: 'emp-5',
    name: 'Elena Rostova',
    role: 'Principal Customer Success & Tier-2 Support',
    department: 'Customer Support',
    email: 'elena.rostova@bluepeak.internal',
    phone: '+1 (876) 920-4412',
    extension: '4412',
    location: 'Kingston HQ · Floor 3',
    manager: 'Alicia Morales (Support Director)',
    status: 'Active',
    hireDate: '2023-06-20',
    tenure: '3.4 Years',
    skills: ['SLA Escalations', 'Customer Onboarding', 'Zendesk & Jira Integration', 'Root Cause Analysis'],
    equipment: [
      { type: 'Apple MacBook Air M3', serial: 'C02K1982MD', status: 'Assigned' },
      { type: 'Jabra Evolve2 85 ANC Headset', serial: 'JB-8821-H', status: 'Assigned' }
    ],
    assignedTicketsCount: 5,
    bio: 'Primary escalation manager for top-tier enterprise accounts including NovaTech Solutions and Apex Global Logistics. Maintains a 98.4% CSAT rating.'
  },
  {
    id: 'emp-6',
    name: 'Kavita Patel',
    role: 'Senior Financial Controller & Billing Lead',
    department: 'Finance & Billing',
    email: 'kavita.patel@bluepeak.internal',
    phone: '+1 (876) 920-4509',
    extension: '4509',
    location: 'Kingston HQ · Floor 5',
    manager: 'Chief Financial Officer',
    status: 'Active',
    hireDate: '2022-11-01',
    tenure: '4.0 Years',
    skills: ['Radium ERP General Ledger', 'Stripe Billing API', 'Caribbean GCT/VAT Compliance', 'IFRS 15 Revenue'],
    equipment: [
      { type: 'HP Elite Dragonfly G4', serial: 'HP-991280-DF', status: 'Assigned' }
    ],
    assignedTicketsCount: 1,
    bio: 'Directs multi-currency revenue recognition, Radium ERP journal automation, and tax-exempt enterprise customer compliance audits.'
  },
  {
    id: 'emp-7',
    name: 'Carlos Santana',
    role: 'VP of Network Infrastructure & Field Operations',
    department: 'Executive',
    email: 'carlos.santana@bluepeak.internal',
    phone: '+1 (876) 920-4010',
    extension: '4010',
    location: 'Kingston HQ · Ops Command Center',
    manager: 'Chief Executive Officer',
    status: 'Active',
    hireDate: '2021-04-12',
    tenure: '5.6 Years',
    skills: ['DWDM Transport', 'Carrier Peering', 'OSP Cable Plant Engineering', 'Disaster Recovery'],
    equipment: [
      { type: 'Lenovo ThinkPad X1 Carbon Gen 11', serial: 'TP-110294-X1', status: 'Assigned' }
    ],
    assignedTicketsCount: 0,
    bio: 'Directs carrier-grade telecom backbone operations across Jamaica and the wider Caribbean corridor with 99.999% uptime mandate.'
  },
  {
    id: 'emp-8',
    name: 'Tanya Campbell',
    role: 'Tier-1 Technical Support Specialist',
    department: 'Customer Support',
    email: 'tanya.c@bluepeak.internal',
    phone: '+1 (876) 920-4418',
    extension: '4418',
    location: 'Kingston HQ · Floor 3',
    manager: 'Alicia Morales (Support Director)',
    status: 'Active',
    hireDate: '2024-05-02',
    tenure: '2.5 Years',
    skills: ['Incident Triage', 'DNS & MX Records', 'Webhooks Debugging', 'Customer Care'],
    equipment: [
      { type: 'Dell Latitude 7440', serial: 'DL-7440-192', status: 'Assigned' }
    ],
    assignedTicketsCount: 6,
    bio: 'Handles first-line technical inquiries, API integration triage, and initial customer verification for customer support portals.'
  },
  {
    id: 'emp-9',
    name: 'Andre Rhoden',
    role: 'Depot Hardware & Logistics Coordinator',
    department: 'Field Engineering',
    email: 'andre.r@bluepeak.internal',
    phone: '+1 (876) 920-4290',
    extension: '4290',
    location: 'Kingston Central Logistics Hub',
    manager: 'Marcus Vance (Lead Field Specialist)',
    status: 'Active',
    hireDate: '2024-02-18',
    tenure: '2.7 Years',
    skills: ['Inventory Cycle Audits', 'RMA Returns Processing', 'Fiber Drum Spooling', 'Hazmat Battery Transit'],
    equipment: [
      { type: 'Zebra TC58 Rugged Mobile Barcode Scanner', serial: 'ZB-TC58-992', status: 'Assigned' }
    ],
    assignedTicketsCount: 2,
    bio: 'Manages physical warehouse stock, calibration certification of testing gear, and rapid dispatch of Cisco switches and Nokia optical transceivers.'
  },
  {
    id: 'emp-10',
    name: 'Nadia Williams',
    role: 'People Operations & HR Business Partner',
    department: 'Executive',
    email: 'nadia.w@bluepeak.internal',
    phone: '+1 (876) 920-4050',
    extension: '4050',
    location: 'Kingston HQ · Floor 5',
    manager: 'Chief Executive Officer',
    status: 'Active',
    hireDate: '2023-01-09',
    tenure: '3.8 Years',
    skills: ['Talent Onboarding', 'Workplace Safety Compliance', 'Employee Benefits', 'Technical Recruiting'],
    equipment: [
      { type: 'Apple MacBook Pro 14" M3', serial: 'C02P4410MD', status: 'Assigned' }
    ],
    assignedTicketsCount: 1,
    bio: 'Manages global talent acquisition, enterprise benefits administration, engineering certification sponsorship, and onboarding lifecycle.'
  },
  {
    id: 'emp-11',
    name: 'Rajiv Sharma',
    role: 'Solutions Architect & Pre-Sales Consultant',
    department: 'Sales & Business Dev',
    email: 'rajiv.sharma@bluepeak.internal',
    phone: '+1 (876) 920-4120',
    extension: '4120',
    location: 'Remote · Kingston Support Hub',
    manager: 'Sarah Jenkins (VP Commercial)',
    status: 'Active',
    hireDate: '2023-09-12',
    tenure: '3.1 Years',
    skills: ['Enterprise Architecture', 'SD-WAN Topologies', 'Cloud Migration', 'SLA Engineering'],
    equipment: [
      { type: 'Dell XPS 15 9530', serial: 'DL-XPS-99120', status: 'Assigned' }
    ],
    assignedTicketsCount: 3,
    bio: 'Collaborates with Arjun Mehta to design carrier solutions, multi-region IP transit architectures, and customer cloud on-ramps.'
  },
  {
    id: 'emp-12',
    name: 'Alicia Morales',
    role: 'Director of Customer Support & Service Operations',
    department: 'Customer Support',
    email: 'alicia.m@bluepeak.internal',
    phone: '+1 (876) 920-4401',
    extension: '4401',
    location: 'Kingston HQ · Floor 3',
    manager: 'Chief Executive Officer',
    status: 'Active',
    hireDate: '2022-04-18',
    tenure: '4.5 Years',
    skills: ['ITIL v4 Master', 'Service Desk Modernization', 'SLA Governance', 'Team Coaching'],
    equipment: [
      { type: 'Apple MacBook Pro 14" M2', serial: 'C02H8812MD', status: 'Assigned' }
    ],
    assignedTicketsCount: 1,
    bio: 'Leads 24/7 follow-the-sun enterprise customer support, warranty dispatch, tier escalation matrix, and customer satisfaction audits.'
  }
];

export function EmployeesDirectoryView() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [callModalEmp, setCallModalEmp] = useState<Employee | null>(null);
  const [messageEmp, setMessageEmp] = useState<Employee | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState('');

  // New employee form state
  const [newEmp, setNewEmp] = useState({
    name: '',
    role: '',
    department: 'Customer Support' as Employee['department'],
    email: '',
    phone: '+1 (876) 920-',
    extension: '',
    location: 'Kingston HQ · Floor 3',
    manager: 'Alicia Morales (Support Director)',
    skills: '',
    bio: ''
  });

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const departments = ['All', 'Executive', 'Sales & Business Dev', 'Field Engineering', 'Customer Support', 'IT & Security', 'Finance & Billing'];

  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.skills.some(s => s.toLowerCase().includes(q)) ||
        emp.location.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [employees, selectedDept, search]);

  const kpis = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'Active' || e.status === 'In Field').length;
    const depts = new Set(employees.map(e => e.department)).size;
    const totalTenureMonths = employees.reduce((acc, e) => acc + parseFloat(e.tenure), 0);
    const avgTenure = (totalTenureMonths / total).toFixed(1);
    return { total, active, depts, avgTenure };
  }, [employees]);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name.trim() || !newEmp.role.trim() || !newEmp.email.trim()) {
      notify('Please complete all required fields.');
      return;
    }
    const created: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmp.name,
      role: newEmp.role,
      department: newEmp.department,
      email: newEmp.email,
      phone: newEmp.phone || '+1 (876) 920-4000',
      extension: newEmp.extension || Math.floor(4000 + Math.random() * 900).toString(),
      location: newEmp.location,
      manager: newEmp.manager,
      status: 'Active',
      hireDate: new Date().toISOString().split('T')[0],
      tenure: '0.1 Years',
      skills: newEmp.skills ? newEmp.skills.split(',').map(s => s.trim()) : ['Customer Care', 'Enterprise Onboarding'],
      equipment: [
        { type: 'Lenovo ThinkPad L14 Gen 4', serial: `LN-${Math.floor(100000 + Math.random() * 900000)}`, status: 'Assigned' }
      ],
      assignedTicketsCount: 0,
      bio: newEmp.bio || 'New enterprise staff member onboarded to BluePeak Innovations.'
    };
    setEmployees(prev => [created, ...prev]);
    setShowAddModal(false);
    setNewEmp({
      name: '',
      role: '',
      department: 'Customer Support',
      email: '',
      phone: '+1 (876) 920-',
      extension: '',
      location: 'Kingston HQ · Floor 3',
      manager: 'Alicia Morales (Support Director)',
      skills: '',
      bio: ''
    });
    notify(`Employee ${created.name} onboarded successfully.`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !messageEmp) return;
    notify(`Internal message dispatched to ${messageEmp.name} via Slack & Email notification.`);
    setMessageText('');
    setMessageEmp(null);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="SERVICE DESK & WORKFORCE / INTERNAL DIRECTORY"
        title="Enterprise Staff & Employee Directory"
        subtitle="Verified workforce directory, department reporting structures, VoIP extensions, and equipment allocations."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const csvHeader = 'Name,Role,Department,Email,Phone,Extension,Location,Status,Tenure\n';
                const csvRows = employees.map(e => `"${e.name}","${e.role}","${e.department}","${e.email}","${e.phone}","${e.extension}","${e.location}","${e.status}","${e.tenure}"`).join('\n');
                const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `BluePeak_Employee_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                notify('Exported Employee Directory to CSV.');
              }}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/30"
            >
              <Plus size={14} />
              <span>Add Employee</span>
            </button>
          </div>
        }
      />

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Staff</span>
            <Users size={16} className="text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{kpis.total}</div>
            <div className="text-[11px] text-slate-400 mt-1">Verified enterprise profiles</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">On-Duty / Active</span>
            <UserCheck size={16} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{kpis.active} Online</div>
            <div className="text-[11px] text-slate-400 mt-1">In office or field dispatch</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Departments</span>
            <Building2 size={16} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-300">{kpis.depts} Divisions</div>
            <div className="text-[11px] text-slate-400 mt-1">Cross-functional units</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Average Tenure</span>
            <Award size={16} className="text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-300">{kpis.avgTenure} Yrs</div>
            <div className="text-[11px] text-slate-400 mt-1">Enterprise retention index</div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3.5 border border-slate-800/80 rounded-2xl backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {departments.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDept(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                selectedDept === d
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40 font-semibold'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, role, skill, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* EMPLOYEES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(emp => {
          const initials = emp.name.split(' ').map(n => n[0]).join('').slice(0, 2);
          return (
            <div
              key={emp.id}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group shadow-sm hover:shadow-lg hover:shadow-black/20"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-slate-800">
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                        {emp.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{emp.role}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      emp.status === 'Active'
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                        : emp.status === 'In Field'
                        ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {emp.status}
                  </span>
                </div>

                {/* Metadata strip */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building2 size={13} className="text-slate-500 shrink-0" />
                    <span className="text-slate-300 font-medium">{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={13} className="text-slate-500 shrink-0" />
                    <a href={`mailto:${emp.email}`} className="text-blue-400 hover:underline truncate">
                      {emp.email}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-500 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                    <span className="font-mono text-[11px] bg-slate-800/90 text-cyan-400 px-2 py-0.5 rounded-md border border-slate-700/60">
                      ext. {emp.extension}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">{emp.location}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {emp.skills.slice(0, 3).map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60 font-medium"
                    >
                      {s}
                    </span>
                  ))}
                  {emp.skills.length > 3 && (
                    <span className="text-[10px] bg-slate-800/40 text-slate-500 px-1.5 py-0.5 rounded-md">
                      +{emp.skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Action footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCallModalEmp(emp)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors title='VoIP Call'"
                  >
                    <PhoneCall size={14} />
                  </button>
                  <button
                    onClick={() => setMessageEmp(emp)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition-colors title='Send Message'"
                  >
                    <MessageSquare size={14} />
                  </button>
                </div>
                <button
                  onClick={() => setSelectedEmp(emp)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Dossier</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <Users size={32} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-300">No employees match your search</p>
          <p className="text-xs text-slate-500 mt-1">Try relaxing filters or search queries.</p>
        </div>
      )}

      {/* FULL EMPLOYEE DOSSIER MODAL */}
      {selectedEmp && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedEmp(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedEmp(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Dossier Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-xl shadow-md ring-4 ring-slate-800">
                {selectedEmp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{selectedEmp.name}</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                    {selectedEmp.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedEmp.role}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-slate-500" />
                    {selectedEmp.department}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono text-cyan-400">
                    ext. {selectedEmp.extension}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio summary */}
            <div className="py-4 border-b border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Executive Profile & Background
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedEmp.bio}</p>
            </div>

            {/* Reporting & Organizational details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Direct Manager</span>
                <p className="font-semibold text-white mt-0.5">{selectedEmp.manager}</p>
              </div>
              <div>
                <span className="text-slate-400">Workstation / Location</span>
                <p className="font-semibold text-white mt-0.5">{selectedEmp.location}</p>
              </div>
              <div>
                <span className="text-slate-400">Enterprise Tenure</span>
                <p className="font-semibold text-white mt-0.5">{selectedEmp.tenure} (Hired {selectedEmp.hireDate})</p>
              </div>
              <div>
                <span className="text-slate-400">Active Incident Tickets</span>
                <p className="font-semibold text-white mt-0.5">{selectedEmp.assignedTicketsCount} assigned</p>
              </div>
            </div>

            {/* Skills & Certifications */}
            <div className="py-4 border-b border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Core Competencies & Tooling
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedEmp.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-slate-800 text-blue-300 px-2.5 py-1 rounded-lg border border-slate-700 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Assigned Hardware & IT Equipment */}
            <div className="pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Enterprise Asset Allocations</span>
                <span className="text-[11px] text-slate-500 font-mono">ITIL Asset Tracking</span>
              </h4>
              <div className="space-y-2">
                {selectedEmp.equipment.map((eq, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Laptop size={14} className="text-indigo-400" />
                      <div>
                        <span className="font-medium text-slate-200">{eq.type}</span>
                        <div className="text-[10px] text-slate-500 font-mono">SN: {eq.serial}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                      {eq.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedEmp(null);
                  setCallModalEmp(selectedEmp);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <PhoneCall size={14} className="text-emerald-400" />
                <span>Initiate Call</span>
              </button>
              <button
                onClick={() => {
                  setSelectedEmp(null);
                  setMessageEmp(selectedEmp);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare size={14} />
                <span>Send Direct Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALL DIALOG MODAL */}
      {callModalEmp && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCallModalEmp(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 text-slate-200 text-center relative animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <PhoneCall size={28} />
            </div>
            <h3 className="text-base font-bold text-white">Calling {callModalEmp.name}</h3>
            <p className="text-xs text-slate-400 mt-1">Connecting WebRTC SIP Trunk · ext. {callModalEmp.extension}</p>
            <div className="my-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300">
              <div className="text-[11px] text-slate-500">DID Direct Line</div>
              <div className="font-mono font-semibold text-white mt-0.5">{callModalEmp.phone}</div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  notify(`Call ended with ${callModalEmp.name}.`);
                  setCallModalEmp(null);
                }}
                className="px-5 py-2 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT MESSAGE MODAL */}
      {messageEmp && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setMessageEmp(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-slate-200 relative animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setMessageEmp(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                {messageEmp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Direct Message: {messageEmp.name}</h3>
                <p className="text-xs text-slate-400">{messageEmp.email}</p>
              </div>
            </div>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Message</label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder={`Write your internal dispatch to ${messageEmp.name}...`}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMessageEmp(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 text-slate-200 relative animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="mb-5">
              <h3 className="text-base font-bold text-white">Onboard New Employee</h3>
              <p className="text-xs text-slate-400">Register employee record in BluePeak internal workforce directory.</p>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Chen"
                    value={newEmp.name}
                    onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Solutions Engineer"
                    value={newEmp.role}
                    onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Department *</label>
                  <select
                    value={newEmp.department}
                    onChange={e => setNewEmp({ ...newEmp, department: e.target.value as Employee['department'] })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Customer Support">Customer Support</option>
                    <option value="Sales & Business Dev">Sales & Business Dev</option>
                    <option value="Field Engineering">Field Engineering</option>
                    <option value="IT & Security">IT & Security</option>
                    <option value="Finance & Billing">Finance & Billing</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@bluepeak.internal"
                    value={newEmp.email}
                    onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newEmp.phone}
                    onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">VoIP Extension</label>
                  <input
                    type="text"
                    placeholder="e.g. 4310"
                    value={newEmp.extension}
                    onChange={e => setNewEmp({ ...newEmp, extension: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Office / Workstation Location</label>
                <input
                  type="text"
                  value={newEmp.location}
                  onChange={e => setNewEmp({ ...newEmp, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Skills & Certifications (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. CCNA, Fiber Splicing, Python, SLA Escalations"
                  value={newEmp.skills}
                  onChange={e => setNewEmp({ ...newEmp, skills: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Brief Bio / Responsibilities</label>
                <textarea
                  rows={2}
                  placeholder="Key areas of ownership and customer engagements..."
                  value={newEmp.bio}
                  onChange={e => setNewEmp({ ...newEmp, bio: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Onboard Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
