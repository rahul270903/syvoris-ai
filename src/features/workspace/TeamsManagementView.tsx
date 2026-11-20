import { useState } from 'react';
import {
  Users, UserPlus, Building2, CheckCircle2, Shield,
  Mail, Phone, Briefcase, Plus, Edit2, Trash2, X,
  FolderKanban, DollarSign, Clock, Layers, Search
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface TeamItem {
  id: string;
  name: string;
  code: string;
  department: string;
  leadName: string;
  leadEmail: string;
  queueName: string;
  members: string[];
  quotaOrSla: string;
  activeWorkload: number;
  description: string;
}

const INITIAL_TEAMS: TeamItem[] = [
  {
    id: 'team-1',
    name: 'Revenue Operations & CPQ',
    code: 'REV-OPS',
    department: 'Commercial Operations',
    leadName: 'Sarah Jenkins',
    leadEmail: 'sarah.j@bluepeak.internal',
    queueName: 'inbound-deals-queue',
    members: ['Sarah Jenkins', 'Liam Brody', 'Aisha Patel'],
    quotaOrSla: '$1,200,000 / Quarter',
    activeWorkload: 8,
    description: 'Strategic pipeline velocity, quote discount governance, CPQ pricing books, and sales enablement.'
  },
  {
    id: 'team-2',
    name: 'Caribbean Enterprise Sales',
    code: 'CARIB-SALES',
    department: 'Sales & Business Development',
    leadName: 'Arjun Mehta',
    leadEmail: 'arjun.mehta@bluepeak.internal',
    queueName: 'caribbean-enterprise-deals',
    members: ['Arjun Mehta', 'Maya Lin'],
    quotaOrSla: '$1,500,000 / Quarter',
    activeWorkload: 12,
    description: 'Regional enterprise sales across Jamaica, Trinidad, and Bahamas focusing on telecom carrier wholesale and cloud deals.'
  },
  {
    id: 'team-3',
    name: 'Tier-2 Technical Escalations',
    code: 'TIER2-SUPP',
    department: 'Customer Care & Service',
    leadName: 'Elena Rostova',
    leadEmail: 'elena.r@bluepeak.internal',
    queueName: 'p1-tech-escalations',
    members: ['Elena Rostova', 'Tariq Mansour', 'Michael Chen'],
    quotaOrSla: '99.5% SLA (15 min MTTF)',
    activeWorkload: 5,
    description: 'Mission-critical engineering escalations, SAML/SSO identity sync failures, and core API latency resolution.'
  },
  {
    id: 'team-4',
    name: 'Field Engineering & Splicing',
    code: 'FIELD-OPS',
    department: 'Network Infrastructure',
    leadName: 'Marcus Vance',
    leadEmail: 'marcus.v@bluepeak.internal',
    queueName: 'field-dispatch-queue',
    members: ['Marcus Vance', 'Carlos Ortiz'],
    quotaOrSla: '40 Installations / Mo',
    activeWorkload: 6,
    description: 'Physical fiber route construction, OTDR reflectance testing, patch bay termination, and depot stock dispatch.'
  },
  {
    id: 'team-5',
    name: 'Commercial Compliance & Billing',
    code: 'FIN-COMP',
    department: 'Finance & Legal',
    leadName: 'Aisha Patel',
    leadEmail: 'aisha.p@bluepeak.internal',
    queueName: 'invoicing-tax-queue',
    members: ['Aisha Patel', 'David Sterling'],
    quotaOrSla: '100% Tax Audit Accuracy',
    activeWorkload: 3,
    description: 'Regional VAT/GCT multi-tier tax calculation, Stripe billing reconciliations, and contract boilerplate legal review.'
  }
];

const ALL_AVAILABLE_MEMBERS = [
  'Arjun Mehta',
  'Sarah Jenkins',
  'Elena Rostova',
  'Marcus Vance',
  'David Sterling',
  'Maya Lin',
  'Michael Chen',
  'Carlos Ortiz',
  'Aisha Patel',
  'Liam Brody',
  'Tariq Mansour'
];

export function TeamsManagementView() {
  const { addAudit } = useCRM();
  const [teams, setTeams] = useState<TeamItem[]>(INITIAL_TEAMS);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [toast, setToast] = useState('');

  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDept, setTeamDept] = useState('Sales & Business Development');
  const [teamLead, setTeamLead] = useState('Sarah Jenkins');
  const [teamQueue, setTeamQueue] = useState('');
  const [teamTarget, setTeamTarget] = useState('$500,000 / Quarter');
  const [teamDesc, setTeamDesc] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase()) ||
    t.leadName.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembersAssigned = Array.from(new Set(teams.flatMap(t => t.members))).length;
  const totalQueueWorkload = teams.reduce((acc, t) => acc + t.activeWorkload, 0);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) return;

    const newTeam: TeamItem = {
      id: `team-${Date.now().toString().slice(-4)}`,
      name: teamName,
      code: teamName.toUpperCase().replace(/\s+/g, '-').slice(0, 8),
      department: teamDept,
      leadName: teamLead,
      leadEmail: `${teamLead.toLowerCase().replace(/\s+/g, '.')}@bluepeak.internal`,
      queueName: teamQueue || `${teamName.toLowerCase().replace(/\s+/g, '-')}-queue`,
      members: [teamLead],
      quotaOrSla: teamTarget,
      activeWorkload: 0,
      description: teamDesc || 'Operational team collaboration unit.'
    };

    setTeams(prev => [...prev, newTeam]);
    setShowCreateModal(false);
    setTeamName('');
    setTeamQueue('');
    setTeamDesc('');
    notify(`Team "${newTeam.name}" initialized and bound to queue "${newTeam.queueName}".`);
    addAudit?.('Team Management', `Created team ${newTeam.name} with lead ${newTeam.leadName}`, 'Teams');
  };

  const handleToggleMember = (memberName: string) => {
    if (!selectedTeam) return;

    setTeams(prev => prev.map(t => {
      if (t.id === selectedTeam.id) {
        const hasMember = t.members.includes(memberName);
        const updatedMembers = hasMember
          ? t.members.filter(m => m !== memberName)
          : [...t.members, memberName];
        return { ...t, members: updatedMembers };
      }
      return t;
    }));

    setSelectedTeam(prev => {
      if (!prev) return null;
      const hasMember = prev.members.includes(memberName);
      const updatedMembers = hasMember
        ? prev.members.filter(m => m !== memberName)
        : [...prev.members, memberName];
      return { ...prev, members: updatedMembers };
    });

    notify(`Updated team roster for ${selectedTeam.name}.`);
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
        eyebrow="ADMINISTRATION / TEAMS & QUEUES"
        title="Teams & Operational Queues"
        subtitle="Manage business units, designated team leads, shared ownership queues, and member workload distributions."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Team</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Configured Teams</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{teams.length} Teams</div>
          <div className="text-[11px] text-slate-500 mt-1">Cross-functional squads</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Assigned Reps</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{totalMembersAssigned} Specialists</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Active identity members</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Active Workload</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">{totalQueueWorkload} Records</div>
          <div className="text-[11px] text-slate-500 mt-1">Queued across 5 mailboxes</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Quarterly Commercial Target</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">$2.70M Pipeline</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Managed sales quota</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search team by name, lead, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{filteredTeams.length}</strong> operational teams
        </div>
      </div>

      {/* Teams Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map(t => (
          <div
            key={t.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded uppercase">
                    {t.code}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">{t.name}</h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t.department}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-emerald-400">{t.activeWorkload} In-Flight</div>
                  <div className="text-[10px] text-slate-500">Active records</div>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                {t.description}
              </p>

              {/* Lead & Queue */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Team Lead:</span>
                  <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    {t.leadName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Shared Queue:</span>
                  <span className="font-mono text-[11px] text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/40">
                    {t.queueName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target / SLA:</span>
                  <span className="text-slate-300 font-medium">{t.quotaOrSla}</span>
                </div>
              </div>

              {/* Members Avatars */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Assigned Members ({t.members.length})</span>
                  <button
                    onClick={() => { setSelectedTeam(t); setShowRosterModal(true); }}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold transition-colors"
                  >
                    Manage Roster →
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {t.members.map(m => (
                    <span
                      key={m}
                      className="text-[11px] bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-full flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
              <button
                onClick={() => { setSelectedTeam(t); setShowRosterModal(true); }}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors text-center"
              >
                Configure Team & Routing
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MANAGE ROSTER MODAL */}
      {showRosterModal && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Roster: {selectedTeam.name}</span>
              </div>
              <button
                onClick={() => setShowRosterModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select or deselect specialists assigned to handle the <strong>{selectedTeam.queueName}</strong> workload.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {ALL_AVAILABLE_MEMBERS.map(m => {
                const isSelected = selectedTeam.members.includes(m);
                return (
                  <div
                    key={m}
                    onClick={() => handleToggleMember(m)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-700/60 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-xs font-medium">{m}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-cyan-600 border-cyan-500 text-white' : 'border-slate-700'
                    }`}>
                      {isSelected && <span className="text-[10px]">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setShowRosterModal(false)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Create New Operational Team</span>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Government & Public Sector RFPs"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Department</label>
                <select
                  value={teamDept}
                  onChange={e => setTeamDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Commercial Operations">Commercial Operations</option>
                  <option value="Sales & Business Development">Sales & Business Development</option>
                  <option value="Customer Care & Service">Customer Care & Service</option>
                  <option value="Network Infrastructure">Network Infrastructure</option>
                  <option value="Finance & Legal">Finance & Legal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Team Lead</label>
                  <select
                    value={teamLead}
                    onChange={e => setTeamLead(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {ALL_AVAILABLE_MEMBERS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Target / SLA</label>
                  <input
                    type="text"
                    value={teamTarget}
                    onChange={e => setTeamTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Operational responsibilities and scope..."
                  value={teamDesc}
                  onChange={e => setTeamDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
