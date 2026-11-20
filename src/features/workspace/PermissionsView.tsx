import { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Lock, Unlock, Eye, EyeOff,
  CheckCircle2, Key, Sliders, Database, AlertCircle,
  Save, RefreshCw, FileText, Check, X, Layers
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

interface ModulePerm {
  module: string;
  viewAll: boolean;
  create: boolean;
  editOwn: boolean;
  editAny: boolean;
  delete: boolean;
  exportCsv: boolean;
  bulkUpdate: boolean;
  approve: boolean;
}

interface FieldMaskRule {
  id: string;
  module: string;
  field: string;
  maskingType: 'Redact All' | 'Show Last 4' | 'Hash SHA-256' | 'Restricted to Directors';
  enforcedRoles: string[];
  active: boolean;
}

const DEFAULT_MODULE_PERMS: Record<string, ModulePerm[]> = {
  'Super Administrator': [
    { module: 'Organizations & Customer 360', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Opportunities & Deals', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Quotes & CPQ Pricing', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Customer Service Cases & SLAs', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Projects & Milestones', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Product Catalog & Inventory', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Billing & Commercial Plans', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'AI Workforce & Copilot', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Admin & System Settings', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true }
  ],
  'Sales Director': [
    { module: 'Organizations & Customer 360', viewAll: true, create: true, editOwn: true, editAny: true, delete: false, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Opportunities & Deals', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Quotes & CPQ Pricing', viewAll: true, create: true, editOwn: true, editAny: true, delete: false, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Customer Service Cases & SLAs', viewAll: true, create: false, editOwn: false, editAny: false, delete: false, exportCsv: true, bulkUpdate: false, approve: false },
    { module: 'Projects & Milestones', viewAll: true, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'Product Catalog & Inventory', viewAll: true, create: true, editOwn: true, editAny: true, delete: false, exportCsv: true, bulkUpdate: false, approve: true },
    { module: 'Billing & Commercial Plans', viewAll: true, create: false, editOwn: false, editAny: false, delete: false, exportCsv: true, bulkUpdate: false, approve: false },
    { module: 'AI Workforce & Copilot', viewAll: true, create: true, editOwn: true, editAny: true, delete: false, exportCsv: true, bulkUpdate: false, approve: true },
    { module: 'Admin & System Settings', viewAll: false, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false }
  ],
  'Senior Account Executive': [
    { module: 'Organizations & Customer 360', viewAll: false, create: true, editOwn: true, editAny: false, delete: false, exportCsv: true, bulkUpdate: false, approve: false },
    { module: 'Opportunities & Deals', viewAll: false, create: true, editOwn: true, editAny: false, delete: false, exportCsv: true, bulkUpdate: false, approve: false },
    { module: 'Quotes & CPQ Pricing', viewAll: false, create: true, editOwn: true, editAny: false, delete: false, exportCsv: true, bulkUpdate: false, approve: false },
    { module: 'Customer Service Cases & SLAs', viewAll: false, create: true, editOwn: true, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'Projects & Milestones', viewAll: false, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'Product Catalog & Inventory', viewAll: true, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'Billing & Commercial Plans', viewAll: false, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'AI Workforce & Copilot', viewAll: false, create: true, editOwn: true, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'Admin & System Settings', viewAll: false, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false }
  ],
  'Support Manager': [
    { module: 'Organizations & Customer 360', viewAll: true, create: false, editOwn: true, editAny: false, delete: false, exportCsv: true, bulkUpdate: false, approve: false },
    { module: 'Opportunities & Deals', viewAll: true, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'Quotes & CPQ Pricing', viewAll: false, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'Customer Service Cases & SLAs', viewAll: true, create: true, editOwn: true, editAny: true, delete: true, exportCsv: true, bulkUpdate: true, approve: true },
    { module: 'Projects & Milestones', viewAll: true, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'Product Catalog & Inventory', viewAll: true, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'Billing & Commercial Plans', viewAll: false, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'AI Workforce & Copilot', viewAll: true, create: true, editOwn: true, editAny: true, delete: false, exportCsv: false, bulkUpdate: false, approve: false },
    { module: 'Admin & System Settings', viewAll: false, create: false, editOwn: false, editAny: false, delete: false, exportCsv: false, bulkUpdate: false, approve: false }
  ]
};

const INITIAL_FIELD_MASKS: FieldMaskRule[] = [
  {
    id: 'mask-1',
    module: 'Organizations / Tax Master',
    field: 'Tax Identification (TRN / EIN)',
    maskingType: 'Show Last 4',
    enforcedRoles: ['Senior Account Executive', 'Support Manager', 'Field Service Lead'],
    active: true
  },
  {
    id: 'mask-2',
    module: 'Quotes & Invoices',
    field: 'Product Cost / COGS & Gross Margin %',
    maskingType: 'Restricted to Directors',
    enforcedRoles: ['Senior Account Executive', 'Support Manager'],
    active: true
  },
  {
    id: 'mask-3',
    module: 'Billing / Stripe Portal',
    field: 'Payment Method Tokens & PCI Ref',
    maskingType: 'Redact All',
    enforcedRoles: ['Senior Account Executive', 'Sales Director', 'Support Manager'],
    active: true
  },
  {
    id: 'mask-4',
    module: 'Contacts / Executives',
    field: 'Direct Mobile & Personal Contact',
    maskingType: 'Show Last 4',
    enforcedRoles: ['Support Manager', 'Field Service Lead'],
    active: true
  },
  {
    id: 'mask-5',
    module: 'Deals / Discount Engine',
    field: 'Authorized Discount Range Ceiling',
    maskingType: 'Restricted to Directors',
    enforcedRoles: ['Senior Account Executive'],
    active: true
  }
];

export function PermissionsView() {
  const { addAudit } = useCRM();
  const [activeTab, setActiveTab] = useState<'matrix' | 'masking'>('matrix');
  const [selectedRole, setSelectedRole] = useState<string>('Sales Director');
  const [permsState, setPermsState] = useState(DEFAULT_MODULE_PERMS);
  const [maskRules, setMaskRules] = useState<FieldMaskRule[]>(INITIAL_FIELD_MASKS);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const currentPerms = permsState[selectedRole] || permsState['Sales Director'];

  const handleToggle = (moduleName: string, field: keyof ModulePerm) => {
    setPermsState(prev => {
      const roleList = prev[selectedRole] || [];
      const updated = roleList.map(item => {
        if (item.module === moduleName) {
          return { ...item, [field]: !item[field] };
        }
        return item;
      });
      return { ...prev, [selectedRole]: updated };
    });
  };

  const handleToggleMask = (ruleId: string) => {
    setMaskRules(prev => prev.map(r => r.id === ruleId ? { ...r, active: !r.active } : r));
    notify('Updated data masking enforcement policy.');
  };

  const handleSaveAll = () => {
    notify(`Permissions matrix for "${selectedRole}" deployed to PostgreSQL RLS policies.`);
    addAudit?.('Permissions Governance', `Updated access permissions for role ${selectedRole}`, 'IAM Security');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <SectionHeading
        eyebrow="ADMINISTRATION / SECURITY & PERMISSIONS"
        title="Permissions & Access Governance"
        subtitle="Manage row-level access boundaries, granular record operations, export sovereignty, and confidential field masking."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPermsState(DEFAULT_MODULE_PERMS);
                notify('Reset permissions matrix to enterprise security baseline.');
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset to Baseline</span>
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Deploy Permission Policies</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Governed Roles</span>
            <Key className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{Object.keys(permsState).length} Profiles</div>
          <div className="text-[11px] text-slate-500 mt-1">Granular RBAC boundaries</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Protected Tables</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">18 RLS Modules</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Tenant isolation active</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Field Masking Rules</span>
            <EyeOff className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">{maskRules.filter(m => m.active).length} Active Rules</div>
          <div className="text-[11px] text-slate-500 mt-1">PII & financial redacting</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Enforcement Engine</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">PostgreSQL RLS</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Kernel level policy check</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'matrix'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Role Permissions Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('masking')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'masking'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <EyeOff className="w-4 h-4" />
          <span>Field-Level Security & PII Masking</span>
        </button>
      </div>

      {activeTab === 'matrix' ? (
        <div className="space-y-4">
          {/* Role Picker */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Select Security Role:</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(permsState).map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedRole === r
                        ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-slate-400">
              Editing policies for <strong className="text-white">{selectedRole}</strong>
            </span>
          </div>

          {/* Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Governed Module</th>
                    <th className="py-3 px-2 text-center">View All</th>
                    <th className="py-3 px-2 text-center">Create</th>
                    <th className="py-3 px-2 text-center">Edit Own</th>
                    <th className="py-3 px-2 text-center">Edit Any</th>
                    <th className="py-3 px-2 text-center">Delete</th>
                    <th className="py-3 px-2 text-center">Export CSV</th>
                    <th className="py-3 px-2 text-center">Bulk Update</th>
                    <th className="py-3 px-2 text-center">Approve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {currentPerms.map(p => (
                    <tr key={p.module} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {p.module}
                      </td>

                      {(['viewAll', 'create', 'editOwn', 'editAny', 'delete', 'exportCsv', 'bulkUpdate', 'approve'] as const).map(k => (
                        <td key={k} className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleToggle(p.module, k)}
                            className={`w-6 h-6 rounded inline-flex items-center justify-center transition-all ${
                              p[k]
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/60 shadow-sm shadow-cyan-950'
                                : 'bg-slate-950 text-slate-600 border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {p[k] ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px]">-</span>}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Field Level Masking Tab */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">PII Data Masking & Attribute-Based Restriction Rules</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically redact or partially obfuscate sensitive financial and identity fields based on user role.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {maskRules.map(rule => (
              <div
                key={rule.id}
                className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{rule.field}</span>
                    <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded">
                      {rule.module}
                    </span>
                    <span className="text-[10px] bg-purple-950/50 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded font-mono">
                      {rule.maskingType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Enforced against roles: <span className="text-slate-300">{rule.enforcedRoles.join(', ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleMask(rule.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      rule.active
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {rule.active ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{rule.active ? 'Masking Enforced' : 'Masking Bypassed'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
