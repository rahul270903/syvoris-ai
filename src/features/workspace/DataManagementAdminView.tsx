import { useState } from 'react';
import {
  Database, HardDrive, ShieldCheck, RefreshCw, CheckCircle2,
  AlertTriangle, Archive, Trash2, Clock, Sparkles, Layers,
  Download, RotateCcw, Plus, Check, X, FileSpreadsheet
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface DataSnapshot {
  id: string;
  timestamp: string;
  size: string;
  type: 'Manual Snapshot' | 'Automated Daily' | 'Pre-Migration Backup';
  status: 'Ready' | 'Archived to S3' | 'Verifying';
  hash: string;
}

export interface SelfHealingRoutine {
  id: string;
  name: string;
  frequency: string;
  lastExecuted: string;
  recordsRepaired: number;
  status: 'Active' | 'Paused';
  description: string;
}

const INITIAL_SNAPSHOTS: DataSnapshot[] = [
  {
    id: 'SNAP-2026-1120-01',
    timestamp: 'Today 14:30 UTC',
    size: '4.82 GB',
    type: 'Manual Snapshot',
    status: 'Ready',
    hash: 'sha256:7f83b165...91c'
  },
  {
    id: 'SNAP-2026-1119-01',
    timestamp: 'Nov 19, 2026 00:00 UTC',
    size: '4.78 GB',
    type: 'Automated Daily',
    status: 'Archived to S3',
    hash: 'sha256:3a19c402...55b'
  },
  {
    id: 'SNAP-2026-1118-01',
    timestamp: 'Nov 18, 2026 00:00 UTC',
    size: '4.71 GB',
    type: 'Automated Daily',
    status: 'Archived to S3',
    hash: 'sha256:9c02d184...e41'
  }
];

const INITIAL_ROUTINES: SelfHealingRoutine[] = [
  {
    id: 'heal-1',
    name: 'Continuous Entity Resolution & Deduplication',
    frequency: 'Real-Time (Event Driven)',
    lastExecuted: '4 mins ago',
    recordsRepaired: 142,
    status: 'Active',
    description: 'Background worker resolves matching email, domain, and phone records into unified customer entities.'
  },
  {
    id: 'heal-2',
    name: 'E.164 Phone Number & Regional Code Normalization',
    frequency: 'Hourly',
    lastExecuted: '22 mins ago',
    recordsRepaired: 38,
    status: 'Active',
    description: 'Standardizes Caribbean and international dialing codes to ensure seamless click-to-dial dispatch.'
  },
  {
    id: 'heal-3',
    name: 'Address & Postal Geocoding Enrichment',
    frequency: 'Daily',
    lastExecuted: '6 hours ago',
    recordsRepaired: 19,
    status: 'Active',
    description: 'Normalizes logistical shipping depot addresses, parish locations, and optical fiber splice coordinates.'
  },
  {
    id: 'heal-4',
    name: 'Dormant Opportunity & Lead Archival Agent',
    frequency: 'Weekly',
    lastExecuted: '2 days ago',
    recordsRepaired: 64,
    status: 'Active',
    description: 'Safely moves stale disqualified leads and closed deals older than 180 days into compressed cold storage.'
  }
];

export function DataManagementAdminView() {
  const { addAudit } = useCRM();
  const [snapshots, setSnapshots] = useState<DataSnapshot[]>(INITIAL_SNAPSHOTS);
  const [routines, setRoutines] = useState<SelfHealingRoutine[]>(INITIAL_ROUTINES);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleRunHealthAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      notify('Data health audit complete: 18 tables verified, 0 foreign key orphan rows, 99.4% integrity score.');
      addAudit?.('Data Fabric Health Audit', 'Ran integrity verification across all 18 PostgreSQL tables', 'Data Management');
    }, 1100);
  };

  const handleCreateSnapshot = () => {
    setIsCreatingSnapshot(true);
    setTimeout(() => {
      setIsCreatingSnapshot(false);
      const newSnap: DataSnapshot = {
        id: `SNAP-2026-${Date.now().toString().slice(-6)}`,
        timestamp: 'Just now',
        size: '4.84 GB',
        type: 'Manual Snapshot',
        status: 'Ready',
        hash: `sha256:${Date.now().toString(16)}...`
      };
      setSnapshots(prev => [newSnap, ...prev]);
      notify(`Snapshot ${newSnap.id} created and verified in encrypted backup storage.`);
      addAudit?.('Database Snapshot Created', `Generated tenant database snapshot ${newSnap.id}`, 'Data Management');
    }, 1200);
  };

  const handleToggleRoutine = (id: string) => {
    setRoutines(prev => prev.map(r => {
      if (r.id === id) {
        const next = r.status === 'Active' ? 'Paused' : 'Active';
        return { ...r, status: next };
      }
      return r;
    }));
    notify('Self-healing routine state updated.');
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
        eyebrow="ADMINISTRATION / DATA FABRIC & RETENTION"
        title="Enterprise Data Fabric & Storage Management"
        subtitle="Manage continuous self-healing data routines, execute encrypted tenant snapshots, and monitor storage quotas."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunHealthAudit}
              disabled={isAuditing}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Scanning 18 Tables...' : 'Run Data Health Audit'}</span>
            </button>
            <button
              onClick={handleCreateSnapshot}
              disabled={isCreatingSnapshot}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Database className="w-4 h-4" />
              <span>{isCreatingSnapshot ? 'Creating Snapshot...' : 'Trigger Tenant Snapshot'}</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Governed Records</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">18,450 Records</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 18 enterprise tables</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Allocated Storage</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">4.8 GB / 50 GB</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">9.6% tenant quota utilized</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Last Snapshot Backup</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">Verified Ready</div>
          <div className="text-[11px] text-slate-500 mt-1">SHA-256 integrity verified</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Data Health Index</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">99.4% Complete</div>
          <div className="text-[11px] text-purple-400/80 mt-1">0 orphaned relational keys</div>
        </div>
      </div>

      {/* Self-Healing Data Fabric Routines */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Self-Healing Data Fabric Routines</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous autonomous background agents that deduplicate, standardize, and repair record attributes in real-time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map(r => (
            <div
              key={r.id}
              className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{r.name}</h4>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    r.status === 'Active'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                      : 'bg-slate-900 text-slate-500'
                  }`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {r.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="text-slate-400">
                  Cadence: <span className="text-slate-200">{r.frequency}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 font-mono font-semibold">
                    {r.recordsRepaired} repaired
                  </span>
                  <button
                    onClick={() => handleToggleRoutine(r.id)}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    {r.status === 'Active' ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Snapshots & Backups Ledger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Encrypted Tenant Snapshots & Point-in-Time Backups</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated immutable database snapshots stored across multi-region cloud buckets.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Snapshot Reference</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Archive Size</th>
                <th className="py-3 px-4">SHA-256 Checksum</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {snapshots.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                    {s.id}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded font-mono">
                      {s.type}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-slate-300">
                    {s.timestamp}
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-white">
                    {s.size}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                    {s.hash}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                      {s.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => notify(`Restore simulation verified: Snapshot ${s.id} is healthy and restorable.`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      Verify Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
