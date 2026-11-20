import { useState } from 'react';
import {
  ShieldCheck, Shield, Key, Users, CheckCircle2,
  AlertTriangle, Lock, Plus, Edit2, Copy, Check,
  Sliders, ChevronRight, Save, Eye, FileText, Database
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface RoleDef {
  id: string;
  name: string;
  tier: number;
  description: string;
  userCount: number;
  dataScope: 'Global' | 'Department' | 'Team Only' | 'Own Records Only';
  permissions: {
    module: string;
    read: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    approve: boolean;
  }[];
}

const INITIAL_ROLES: RoleDef[] = [
  {
    id: 'role-1',
    name: 'Super Administrator',
    tier: 1,
    description: 'Global tenant administrator with full sovereignty over RBAC, billing, integrations, and AI governance.',
    userCount: 1,
    dataScope: 'Global',
    permissions: [
      { module: 'Opportunities & Deals', read: true, create: true, edit: true, delete: true, export: true, approve: true },
      { module: 'Quotes & Commercials', read: true, create: true, edit: true, delete: true, export: true, approve: true },
      { module: 'Customer Service & Cases', read: true, create: true, edit: true, delete: true, export: true, approve: true },
      { module: 'Projects & Delivery', read: true, create: true, edit: true, delete: true, export: true, approve: true },
      { module: 'Product & Pricing Catalog', read: true, create: true, edit: true, delete: true, export: true, approve: true },
      { module: 'AI Workforce & Copilot', read: true, create: true, edit: true, delete: true, export: true, approve: true },
      { module: 'Billing & Subscriptions', read: true, create: true, edit: true, delete: true, export: true, approve: true },
    ]
  },
  {
    id: 'role-2',
    name: 'Sales Director & VP Commercials',
    tier: 2,
    description: 'Executive revenue leader with full pipeline oversight, CPQ governance, quote discounting sign-off, and commission auditing.',
    userCount: 2,
    dataScope: 'Global',
    permissions: [
      { module: 'Opportunities & Deals', read: true, create: true, edit: true, delete: true, export: true, approve: true },
      { module: 'Quotes & Commercials', read: true, create: true, edit: true, delete: true, export: true, approve: true },
      { module: 'Customer Service & Cases', read: true, create: false, edit: false, delete: false, export: true, approve: false },
      { module: 'Projects & Delivery', read: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Product & Pricing Catalog', read: true, create: true, edit: true, delete: false, export: true, approve: true },
      { module: 'AI Workforce & Copilot', read: true, create: true, edit: true, delete: false, export: true, approve: true },
      { module: 'Billing & Subscriptions', read: true, create: false, edit: false, delete: false, export: true, approve: false },
    ]
  },
  {
    id: 'role-3',
    name: 'Senior Account Executive',
    tier: 3,
    description: 'Quota-carrying commercial rep managing deals, outbound proposals, communications, and client negotiations.',
    userCount: 3,
    dataScope: 'Team Only',
    permissions: [
      { module: 'Opportunities & Deals', read: true, create: true, edit: true, delete: false, export: true, approve: false },
      { module: 'Quotes & Commercials', read: true, create: true, edit: true, delete: false, export: true, approve: false },
      { module: 'Customer Service & Cases', read: true, create: true, edit: false, delete: false, export: false, approve: false },
      { module: 'Projects & Delivery', read: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Product & Pricing Catalog', read: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'AI Workforce & Copilot', read: true, create: true, edit: false, delete: false, export: false, approve: false },
      { module: 'Billing & Subscriptions', read: false, create: false, edit: false, delete: false, export: false, approve: false },
    ]
  },
  {
    id: 'role-4',
    name: 'Support Manager & SLA Master',
    tier: 2,
    description: 'Technical support director in charge of ticket resolution queues, SLA breach overrides, and customer satisfaction metrics.',
    userCount: 2,
    dataScope: 'Global',
    permissions: [
      { module: 'Opportunities & Deals', read: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Quotes & Commercials', read: false, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Customer Service & Cases', read: true, create: true, edit: true, delete: true, export: true, approve: true },
      { module: 'Projects & Delivery', read: true, create: false, edit: true, delete: false, export: false, approve: false },
      { module: 'Product & Pricing Catalog', read: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'AI Workforce & Copilot', read: true, create: true, edit: true, delete: false, export: false, approve: false },
      { module: 'Billing & Subscriptions', read: false, create: false, edit: false, delete: false, export: false, approve: false },
    ]
  },
  {
    id: 'role-5',
    name: 'Field Service Lead',
    tier: 4,
    description: 'Infrastructure and telecommunications lead managing physical installations, OTDR testing, and stock handovers.',
    userCount: 2,
    dataScope: 'Department',
    permissions: [
      { module: 'Opportunities & Deals', read: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Quotes & Commercials', read: false, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Customer Service & Cases', read: true, create: true, edit: true, delete: false, export: false, approve: false },
      { module: 'Projects & Delivery', read: true, create: true, edit: true, delete: false, export: true, approve: true },
      { module: 'Product & Pricing Catalog', read: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'AI Workforce & Copilot', read: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Billing & Subscriptions', read: false, create: false, edit: false, delete: false, export: false, approve: false },
    ]
  },
  {
    id: 'role-6',
    name: 'Security & Compliance Officer',
    tier: 1,
    description: 'Auditor with read-only visibility into all transaction records, GDPR/CCPA privacy logs, and immutable decision trails.',
    userCount: 1,
    dataScope: 'Global',
    permissions: [
      { module: 'Opportunities & Deals', read: true, create: false, edit: false, delete: false, export: true, approve: false },
      { module: 'Quotes & Commercials', read: true, create: false, edit: false, delete: false, export: true, approve: false },
      { module: 'Customer Service & Cases', read: true, create: false, edit: false, delete: false, export: true, approve: false },
      { module: 'Projects & Delivery', read: true, create: false, edit: false, delete: false, export: true, approve: false },
      { module: 'Product & Pricing Catalog', read: true, create: false, edit: false, delete: false, export: true, approve: false },
      { module: 'AI Workforce & Copilot', read: true, create: false, edit: false, delete: false, export: true, approve: true },
      { module: 'Billing & Subscriptions', read: true, create: false, edit: false, delete: false, export: true, approve: false },
    ]
  }
];

export function RolesManagementView() {
  const { addAudit } = useCRM();
  const [roles, setRoles] = useState<RoleDef[]>(INITIAL_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('role-1');
  const [toast, setToast] = useState('');
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newDataScope, setNewDataScope] = useState<'Global' | 'Department' | 'Team Only' | 'Own Records Only'>('Team Only');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId) || roles[0];

  const handleTogglePermission = (moduleName: string, field: 'read' | 'create' | 'edit' | 'delete' | 'export' | 'approve') => {
    setRoles(prev => prev.map(r => {
      if (r.id === selectedRole.id) {
        return {
          ...r,
          permissions: r.permissions.map(p => {
            if (p.module === moduleName) {
              return { ...p, [field]: !p[field] };
            }
            return p;
          })
        };
      }
      return r;
    }));
  };

  const handleSavePolicy = () => {
    notify(`Policy matrix for "${selectedRole.name}" committed to PostgreSQL RLS engine.`);
    addAudit?.('RBAC Role Policy', `Updated permission matrix for role ${selectedRole.name}`, 'Access Control');
  };

  const handleCloneRole = () => {
    const cloned: RoleDef = {
      ...selectedRole,
      id: `role-${Date.now().toString().slice(-4)}`,
      name: `${selectedRole.name} (Copy)`,
      userCount: 0,
      description: `Cloned from ${selectedRole.name}. Customize permissions as required.`
    };
    setRoles(prev => [...prev, cloned]);
    setSelectedRoleId(cloned.id);
    notify(`Cloned role "${cloned.name}".`);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;

    const newRole: RoleDef = {
      id: `role-${Date.now().toString().slice(-4)}`,
      name: newRoleName,
      tier: 3,
      description: newRoleDesc || 'Custom operational security role.',
      userCount: 0,
      dataScope: newDataScope,
      permissions: [
        { module: 'Opportunities & Deals', read: true, create: false, edit: false, delete: false, export: false, approve: false },
        { module: 'Quotes & Commercials', read: true, create: false, edit: false, delete: false, export: false, approve: false },
        { module: 'Customer Service & Cases', read: true, create: false, edit: false, delete: false, export: false, approve: false },
        { module: 'Projects & Delivery', read: true, create: false, edit: false, delete: false, export: false, approve: false },
        { module: 'Product & Pricing Catalog', read: true, create: false, edit: false, delete: false, export: false, approve: false },
        { module: 'AI Workforce & Copilot', read: false, create: false, edit: false, delete: false, export: false, approve: false },
        { module: 'Billing & Subscriptions', read: false, create: false, edit: false, delete: false, export: false, approve: false },
      ]
    };

    setRoles(prev => [...prev, newRole]);
    setSelectedRoleId(newRole.id);
    setShowNewRoleModal(false);
    setNewRoleName('');
    setNewRoleDesc('');
    notify(`Role "${newRole.name}" created.`);
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
        eyebrow="ADMINISTRATION / ACCESS CONTROL"
        title="Roles & Security Profiles"
        subtitle="Configure organizational access tiers, record sharing boundaries, and granular module permissions."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloneRole}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Clone Current Role</span>
            </button>
            <button
              onClick={() => setShowNewRoleModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Role</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Configured Roles</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{roles.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Hierarchical authority tiers</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Data Scopes</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">4 Boundaries</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Global, Dept, Team, Own</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Governed Modules</span>
            <Key className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">7 Enterprise Domains</div>
          <div className="text-[11px] text-slate-500 mt-1">PostgreSQL RLS enforced</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Assigned Users</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">
            {roles.reduce((acc, r) => acc + r.userCount, 0)} Active
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1">Bound to active identity seats</div>
        </div>
      </div>

      {/* Main Grid: Roles List (Left) + Permission Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Role Navigation Column (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Organizational Roles Hierarchy
          </div>
          <div className="space-y-2">
            {roles.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedRoleId === r.id
                    ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${selectedRoleId === r.id ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {r.name}
                  </span>
                  <span className="text-[10px] font-mono bg-slate-950/70 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded">
                    Tier {r.tier}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {r.description}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/70 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    {r.userCount} {r.userCount === 1 ? 'user' : 'users'}
                  </span>
                  <span className="text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded text-[10px] font-medium">
                    Scope: {r.dataScope}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Permission Policy Matrix (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <span>{selectedRole.name}</span>
                <span className="text-xs font-normal text-slate-400">· Permission Policy Matrix</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Record visibility: <strong className="text-cyan-400">{selectedRole.dataScope} Records</strong>
              </div>
            </div>

            <button
              onClick={handleSavePolicy}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Role Policy</span>
            </button>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Module / Capability</th>
                  <th className="py-2.5 px-2 text-center">Read</th>
                  <th className="py-2.5 px-2 text-center">Create</th>
                  <th className="py-2.5 px-2 text-center">Edit</th>
                  <th className="py-2.5 px-2 text-center">Delete</th>
                  <th className="py-2.5 px-2 text-center">Export</th>
                  <th className="py-2.5 px-2 text-center">Approve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {selectedRole.permissions.map(p => (
                  <tr key={p.module} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-200">
                      {p.module}
                    </td>

                    {(['read', 'create', 'edit', 'delete', 'export', 'approve'] as const).map(f => (
                      <td key={f} className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleTogglePermission(p.module, f)}
                          className={`w-6 h-6 rounded inline-flex items-center justify-center transition-all ${
                            p[f]
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/60 shadow-sm shadow-cyan-950'
                              : 'bg-slate-950 text-slate-600 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {p[f] ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px]">-</span>}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Changes are dynamically enforced at the PostgreSQL Row-Level Security layer.</span>
            <span className="text-cyan-400 font-mono">Tenant ID: bluepeak-prod-01</span>
          </div>
        </div>
      </div>

      {/* CREATE ROLE MODAL */}
      {showNewRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span>Create New Security Role</span>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regional Partner Manager"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Briefly state the scope and responsibilities..."
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Data Visibility Scope</label>
                <select
                  value={newDataScope}
                  onChange={e => setNewDataScope(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Global">Global (All Tenant Records)</option>
                  <option value="Department">Department Wide</option>
                  <option value="Team Only">Team Only</option>
                  <option value="Own Records Only">Own Records Only</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewRoleModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
