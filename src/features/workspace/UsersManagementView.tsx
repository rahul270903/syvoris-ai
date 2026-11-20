import { useState, useMemo } from 'react';
import {
  Users, UserPlus, Shield, ShieldAlert, Key, CheckCircle2,
  AlertTriangle, Lock, Unlock, Mail, RefreshCw, Search,
  SlidersHorizontal, MoreVertical, Edit2, Trash2, Eye,
  Building2, Phone, Sparkles, X, Check, Laptop
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  profile: string;
  mfaEnabled: boolean;
  status: 'Active' | 'Suspended' | 'Pending Invite';
  lastLogin: string;
  createdDate: string;
  phone?: string;
}

const INITIAL_USERS: AdminUser[] = [
  {
    id: 'usr-101',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@bluepeak.internal',
    role: 'Super Administrator',
    team: 'Executive Leadership',
    profile: 'Global Tenant Owner',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: 'Just now (127.0.0.1)',
    createdDate: '2026-01-15',
    phone: '+1 (876) 920-4100'
  },
  {
    id: 'usr-102',
    name: 'Sarah Jenkins',
    email: 'sarah.j@bluepeak.internal',
    role: 'Sales Director',
    team: 'Revenue Operations & CPQ',
    profile: 'VP Commercial Access',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '18 mins ago',
    createdDate: '2026-02-01',
    phone: '+1 (876) 920-4105'
  },
  {
    id: 'usr-103',
    name: 'Elena Rostova',
    email: 'elena.r@bluepeak.internal',
    role: 'Support Manager',
    team: 'Tier-2 Technical Escalations',
    profile: 'Service & SLA Master',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '32 mins ago',
    createdDate: '2026-02-10',
    phone: '+1 (876) 920-4122'
  },
  {
    id: 'usr-104',
    name: 'Marcus Vance',
    email: 'marcus.v@bluepeak.internal',
    role: 'Field Service Lead',
    team: 'Field Engineering & Splicing',
    profile: 'Infrastructure Operations',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '1 hour ago',
    createdDate: '2026-03-05',
    phone: '+1 (876) 920-4180'
  },
  {
    id: 'usr-105',
    name: 'David Sterling',
    email: 'david.s@bluepeak.internal',
    role: 'Security & Compliance Officer',
    team: 'IT Security & IAM',
    profile: 'Global Audit Inspector',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '2 hours ago',
    createdDate: '2026-01-20',
    phone: '+1 (876) 920-4199'
  },
  {
    id: 'usr-106',
    name: 'Maya Lin',
    email: 'maya.l@bluepeak.internal',
    role: 'Senior Account Executive',
    team: 'Caribbean Enterprise Sales',
    profile: 'Commercial AE Standard',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '4 hours ago',
    createdDate: '2026-03-15',
    phone: '+1 (876) 920-4130'
  },
  {
    id: 'usr-107',
    name: 'Michael Chen',
    email: 'michael.c@bluepeak.internal',
    role: 'Technical Architect',
    team: 'Pre-Sales Architecture',
    profile: 'Solution Engineering',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '5 hours ago',
    createdDate: '2026-04-02',
    phone: '+1 (876) 920-4138'
  },
  {
    id: 'usr-108',
    name: 'Carlos Ortiz',
    email: 'carlos.o@bluepeak.internal',
    role: 'Field Engineer',
    team: 'Field Engineering & Splicing',
    profile: 'Field Technician Mobile',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: 'Yesterday 17:40',
    createdDate: '2026-04-18',
    phone: '+1 (876) 920-4185'
  },
  {
    id: 'usr-109',
    name: 'Aisha Patel',
    email: 'aisha.p@bluepeak.internal',
    role: 'Finance Administrator',
    team: 'Commercial Compliance & Billing',
    profile: 'Billing & Invoicing Lead',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: 'Yesterday 14:15',
    createdDate: '2026-04-20',
    phone: '+1 (876) 920-4152'
  },
  {
    id: 'usr-110',
    name: 'Liam Brody',
    email: 'liam.b@bluepeak.internal',
    role: 'Sales Representative',
    team: 'Inbound Demand Generation',
    profile: 'Inbound Lead SDR',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '2 days ago',
    createdDate: '2026-05-12',
    phone: '+1 (876) 920-4112'
  },
  {
    id: 'usr-111',
    name: 'Tariq Mansour',
    email: 'tariq.m@bluepeak.internal',
    role: 'Support Agent',
    team: 'Tier-1 Help Desk',
    profile: 'Help Desk Operator',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '3 days ago',
    createdDate: '2026-05-18',
    phone: '+1 (876) 920-4128'
  },
  {
    id: 'usr-112',
    name: 'Vikram Das',
    email: 'vikram.d@external.bluepeak.internal',
    role: 'Field Representative',
    team: 'Caribbean Enterprise Sales',
    profile: 'External Contractor',
    mfaEnabled: false,
    status: 'Suspended',
    lastLogin: '18 days ago (Revoked)',
    createdDate: '2026-06-01',
    phone: '+1 (876) 920-4190'
  }
];

export function UsersManagementView() {
  const { addAudit, addEvent } = useCRM();
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState('');
  const [impersonatingUser, setImpersonatingUser] = useState<string | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('Senior Account Executive');
  const [formTeam, setFormTeam] = useState('Caribbean Enterprise Sales');
  const [formProfile, setFormProfile] = useState('Commercial AE Standard');
  const [formPhone, setFormPhone] = useState('+1 (876) 920-4100');
  const [formMfa, setFormMfa] = useState(true);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase()) ||
        u.team.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const activeCount = users.filter(u => u.status === 'Active').length;
  const adminCount = users.filter(u => u.role.toLowerCase().includes('admin') || u.role.toLowerCase().includes('director')).length;
  const suspendedCount = users.filter(u => u.status === 'Suspended').length;
  const mfaPercent = Math.round((users.filter(u => u.mfaEnabled).length / users.length) * 100);

  const handleToggleStatus = (u: AdminUser) => {
    const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
    setUsers(prev => prev.map(item => item.id === u.id ? { ...item, status: nextStatus } : item));
    notify(`User ${u.name} status updated to ${nextStatus}.`);
    addAudit?.('User Management', `Toggled account status for ${u.name} to ${nextStatus}`, 'Admin Security');
  };

  const handleResetPassword = (u: AdminUser) => {
    notify(`Temporary authorization link and MFA reset dispatched to ${u.email}`);
    addAudit?.('IAM Auth Challenge', `Triggered password reset and MFA token refresh for ${u.email}`, 'Admin Security');
  };

  const handleImpersonate = (u: AdminUser) => {
    setImpersonatingUser(u.name);
    notify(`Audit enclave: Switched preview context to ${u.name} (${u.role}).`);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;

    const newUser: AdminUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: formName,
      email: formEmail,
      role: formRole,
      team: formTeam,
      profile: formProfile,
      mfaEnabled: formMfa,
      status: 'Active',
      lastLogin: 'Never (Activation Sent)',
      createdDate: new Date().toISOString().slice(0, 10),
      phone: formPhone
    };

    setUsers(prev => [newUser, ...prev]);
    setShowAddModal(false);
    setFormName('');
    setFormEmail('');
    notify(`Identity ${newUser.name} provisioned successfully with profile "${newUser.profile}".`);
    addAudit?.('User Created', `Provisioned new identity ${newUser.name} (${newUser.email})`, 'Admin Security');
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUsers(prev => prev.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          name: formName,
          email: formEmail,
          role: formRole,
          team: formTeam,
          profile: formProfile,
          phone: formPhone,
          mfaEnabled: formMfa
        };
      }
      return u;
    }));

    setShowEditModal(false);
    setSelectedUser(null);
    notify(`Updated user profile for ${formName}.`);
  };

  const openEditModal = (u: AdminUser) => {
    setSelectedUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormTeam(u.team);
    setFormProfile(u.profile);
    setFormPhone(u.phone || '');
    setFormMfa(u.mfaEnabled);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Impersonation Banner */}
      {impersonatingUser && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Currently previewing security scope as: <strong>{impersonatingUser}</strong>. All modifications are logged to immutable audit ledger.</span>
          </div>
          <button
            onClick={() => { setImpersonatingUser(null); notify('Returned to Super Administrator context.'); }}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded font-semibold transition-colors"
          >
            Exit Scope
          </button>
        </div>
      )}

      {/* Section Header */}
      <SectionHeading
        eyebrow="ADMINISTRATION / IDENTITY & ACCESS"
        title="Users & Identity Access Management"
        subtitle="Manage authenticated enterprise identities, role permissions, multi-factor policies, and operational team affiliations."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                notify('Synchronized identity pool with Enterprise IdP (Okta / Azure AD SCIM).');
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sync SCIM Directory</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Provision New User</span>
            </button>
          </div>
        }
      />

      {/* 5-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Total Identities</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{users.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Enterprise active directory</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Active Sessions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{activeCount}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Healthy authenticated seats</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Administrative Tiers</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">{adminCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Elevated privilege owners</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Suspended / Locked</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">{suspendedCount}</div>
          <div className="text-[11px] text-rose-500/80 mt-1">Access revoked / offboarded</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>MFA Enforcement</span>
            <Key className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">{mfaPercent}%</div>
          <div className="text-[11px] text-purple-400/80 mt-1">FIDO2 / TOTP protected</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user by name, email, role, or team..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Roles</option>
            <option value="Super Administrator">Super Administrator</option>
            <option value="Sales Director">Sales Director</option>
            <option value="Senior Account Executive">Senior Account Executive</option>
            <option value="Support Manager">Support Manager</option>
            <option value="Field Service Lead">Field Service Lead</option>
            <option value="Security & Compliance Officer">Security Officer</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">User & Contact</th>
                <th className="py-3 px-4">Role & Profile</th>
                <th className="py-3 px-4">Team Assignment</th>
                <th className="py-3 px-4">MFA & Security</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          {u.name}
                          {u.role.includes('Super') && (
                            <span className="text-[10px] bg-cyan-950/80 text-cyan-400 border border-cyan-700/60 px-1.5 py-0.2 rounded font-mono">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" />{u.email}</span>
                          {u.phone && <span className="text-slate-600">· {u.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{u.role}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-cyan-400" />
                      <span>{u.profile}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{u.team}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {u.mfaEnabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
                        <Key className="w-3 h-3 text-emerald-400" /> Enforced (TOTP)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3 text-amber-400" /> Not Configured
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    <div>{u.lastLogin}</div>
                    <div className="text-slate-500 text-[10px]">Joined {u.createdDate}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      u.status === 'Active'
                        ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                        : 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {u.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(u)}
                        title="Edit User Profile"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleResetPassword(u)}
                        title="Send Password & MFA Reset Challenge"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded border border-slate-700 transition-colors"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleImpersonate(u)}
                        title="Assume User Session (Audit Mode)"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 rounded border border-slate-700 transition-colors"
                      >
                        <Laptop className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        title={u.status === 'Active' ? 'Suspend User Access' : 'Activate User Access'}
                        className={`p-1.5 rounded border transition-colors ${
                          u.status === 'Active'
                            ? 'bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border-slate-700 hover:border-rose-700'
                            : 'bg-slate-800 hover:bg-emerald-900/40 text-rose-400 hover:text-emerald-300 border-slate-700 hover:border-emerald-700'
                        }`}
                      >
                        {u.status === 'Active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>Provision New Enterprise Identity</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Sterling"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Enterprise Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jessica.s@bluepeak.internal"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Assigned Role</label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Senior Account Executive">Senior Account Executive</option>
                    <option value="Sales Director">Sales Director</option>
                    <option value="Support Manager">Support Manager</option>
                    <option value="Field Service Lead">Field Service Lead</option>
                    <option value="Security & Compliance Officer">Security Officer</option>
                    <option value="Super Administrator">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Operational Team</label>
                  <select
                    value={formTeam}
                    onChange={e => setFormTeam(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Caribbean Enterprise Sales">Caribbean Enterprise Sales</option>
                    <option value="Revenue Operations & CPQ">Revenue Operations & CPQ</option>
                    <option value="Tier-2 Technical Escalations">Tier-2 Technical Escalations</option>
                    <option value="Field Engineering & Splicing">Field Engineering & Splicing</option>
                    <option value="Commercial Compliance & Billing">Commercial Compliance & Billing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Security Profile</label>
                  <select
                    value={formProfile}
                    onChange={e => setFormProfile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Commercial AE Standard">Commercial AE Standard</option>
                    <option value="VP Commercial Access">VP Commercial Access</option>
                    <option value="Service & SLA Master">Service & SLA Master</option>
                    <option value="Infrastructure Operations">Infrastructure Operations</option>
                    <option value="Global Audit Inspector">Global Audit Inspector</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="mfaToggle"
                  checked={formMfa}
                  onChange={e => setFormMfa(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="mfaToggle" className="text-xs text-slate-300 font-medium">
                  Enforce Multi-Factor Authentication (FIDO2 / Hardware Security Token / TOTP)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-all"
                >
                  Confirm & Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <span>Edit User Profile: {selectedUser.name}</span>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Role</label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Senior Account Executive">Senior Account Executive</option>
                    <option value="Sales Director">Sales Director</option>
                    <option value="Support Manager">Support Manager</option>
                    <option value="Field Service Lead">Field Service Lead</option>
                    <option value="Security & Compliance Officer">Security Officer</option>
                    <option value="Super Administrator">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Team</label>
                  <select
                    value={formTeam}
                    onChange={e => setFormTeam(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Caribbean Enterprise Sales">Caribbean Enterprise Sales</option>
                    <option value="Revenue Operations & CPQ">Revenue Operations & CPQ</option>
                    <option value="Tier-2 Technical Escalations">Tier-2 Technical Escalations</option>
                    <option value="Field Engineering & Splicing">Field Engineering & Splicing</option>
                    <option value="Commercial Compliance & Billing">Commercial Compliance & Billing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Security Profile</label>
                  <select
                    value={formProfile}
                    onChange={e => setFormProfile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Commercial AE Standard">Commercial AE Standard</option>
                    <option value="VP Commercial Access">VP Commercial Access</option>
                    <option value="Service & SLA Master">Service & SLA Master</option>
                    <option value="Infrastructure Operations">Infrastructure Operations</option>
                    <option value="Global Audit Inspector">Global Audit Inspector</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="mfaToggleEdit"
                  checked={formMfa}
                  onChange={e => setFormMfa(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="mfaToggleEdit" className="text-xs text-slate-300 font-medium">
                  Enforce Multi-Factor Authentication
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
