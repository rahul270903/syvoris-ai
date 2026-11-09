import { useState, useMemo } from 'react';
import {
  FileBarChart, Search, Download, Filter,
  ShieldCheck, Clock, User, Check, RefreshCw
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import type { CRMRecord } from '../../data/models';

export function AuditTrailView() {
  const { records } = useCRM();

  const [query, setQuery] = useState('');
  const [filterActor, setFilterActor] = useState('All');
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const auditRows = useMemo<CRMRecord[]>(() => {
    return records('audit');
  }, [records]);

  const actors = useMemo<string[]>(() => {
    const list = new Set(auditRows.map(a => a.fields.actor || a.owner || 'Demo User'));
    return ['All', ...Array.from(list)];
  }, [auditRows]);

  const filtered = useMemo<CRMRecord[]>(() => {
    return auditRows.filter((a: CRMRecord) => {
      const actor = a.fields.actor || a.owner || 'Demo User';
      const matchActor = filterActor === 'All' || actor === filterActor;
      const matchQuery = [a.fields.name || a.title, a.fields.details || a.description, a.ref, actor]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchActor && matchQuery;
    });
  }, [auditRows, filterActor, query]);

  const handleExportCSV = () => {
    const headers = 'ID,Timestamp,Actor,Action,Record,Details\n';
    const rows = filtered
      .map(
        (a: CRMRecord) =>
          `"${a.id}","${a.fields.timestamp || a.date}","${a.fields.actor || a.owner}","${a.fields.name || a.title}","${a.ref}","${(a.fields.details || a.description || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `syvoris-audit-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Audit ledger exported to CSV successfully.');
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="ADMINISTRATION & GOVERNANCE / SECURITY AUDIT"
        title="Immutable Audit Ledger & Security Trail"
        subtitle="Complete chronological record of all commercial transactions, approval gates, role adjustments and data modifications."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* Compliance Banner */}
      <div className="demo-strip">
        <span className="demo-strip-icon">
          <ShieldCheck size={18} />
        </span>
        <div>
          <strong>SOC2 Type II & GDPR Compliant Audit Trail</strong>
          <p>
            Audit entries are write-once, append-only records with SHA-256 provenance hashes. Demonstrates non-repudiation across all commercial events.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel p-3 bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search action, record ID, or user..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-xs p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Actor:</span>
          <select
            value={filterActor}
            onChange={e => setFilterActor(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-300 font-medium text-slate-800 bg-white"
          >
            {actors.map(act => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="panel overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Action Event</th>
                <th className="py-2.5 px-4">Record Ref</th>
                <th className="py-2.5 px-4">Operational Details</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((entry: CRMRecord) => (
                <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {entry.fields.timestamp ? new Date(entry.fields.timestamp).toLocaleString() : entry.date || '2026-11-09 10:00'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      <User size={11} className="text-slate-500" />
                      {entry.fields.actor || entry.owner || 'Demo User'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {entry.fields.name || entry.title}
                  </td>
                  <td className="py-3 px-4 font-mono text-sky-700 font-medium">
                    {entry.ref || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {entry.fields.details || entry.description}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusPill status="Recorded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="inline-toast">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
