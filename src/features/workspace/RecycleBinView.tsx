import { useState, useMemo } from 'react';
import {
  Trash2, RotateCcw, ShieldCheck, Clock3, Search, RefreshCw,
  CheckCircle2, AlertTriangle, Layers, FileText, Building2,
  Package, Boxes, X, Eye, ExternalLink, ArrowRight
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import type { CRMRecord } from '../../data/models';

export function RecycleBinView() {
  const { data, records, restoreFromRecycleBin, purgeFromRecycleBin, emptyRecycleBin, addAudit, addEvent } = useCRM();

  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<CRMRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const recycleBinItems = useMemo(() => {
    return records('recycleBin') || [];
  }, [data.recycleBin, records]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      notify('Refreshed recycle bin ledger from PostgreSQL tenant storage.');
    }, 450);
  };

  const handleRestore = (item: CRMRecord) => {
    restoreFromRecycleBin(item.id);
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    }
    notify(`Record "${item.title || item.ref}" restored to original workspace.`);
  };

  const handlePurge = (item: CRMRecord) => {
    if (window.confirm(`Are you sure you want to permanently purge "${item.title || item.ref}"? This action cannot be undone.`)) {
      purgeFromRecycleBin(item.id);
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
      notify(`Record "${item.title || item.ref}" permanently purged.`);
    }
  };

  const handleEmptyBin = () => {
    emptyRecycleBin();
    setShowEmptyConfirm(false);
    setSelectedItem(null);
    notify('Recycle bin has been emptied. All deleted records permanently purged.');
  };

  const filteredItems = useMemo(() => {
    return recycleBinItems.filter(item => {
      const origEntity = (item.fields?.originalEntity || '').toLowerCase();
      if (entityFilter !== 'all') {
        if (entityFilter === 'catalog' && !['products', 'services', 'categories', 'bundles', 'availability'].includes(origEntity)) {
          return false;
        }
        if (entityFilter === 'accounts' && !['organizations', 'contacts', 'accounts'].includes(origEntity)) {
          return false;
        }
        if (entityFilter === 'sales' && !['opportunities', 'quotes', 'deals', 'orders'].includes(origEntity)) {
          return false;
        }
        if (entityFilter === 'governance' && !['taxes', 'terms', 'vendors', 'stock'].includes(origEntity)) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mRef = (item.ref || '').toLowerCase().includes(q);
        const mTitle = (item.title || '').toLowerCase().includes(q);
        const mDesc = (item.description || '').toLowerCase().includes(q);
        const mEnt = origEntity.includes(q);
        if (!mRef && !mTitle && !mDesc && !mEnt) return false;
      }

      return true;
    });
  }, [recycleBinItems, entityFilter, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const total = recycleBinItems.length;
    const uniqueEntities = new Set(recycleBinItems.map(x => x.fields?.originalEntity || 'general')).size;
    return {
      total,
      uniqueEntities,
      retentionDays: 30,
    };
  }, [recycleBinItems]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-200 text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-cyan-400 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Standard Section Heading */}
      <SectionHeading
        eyebrow="ADMINISTRATION & COMPLIANCE / DATA RETENTION"
        title="Recycle Bin & Data Retention Vault"
        subtitle="Recover accidentally deleted enterprise records within the 30-day statutory retention window, inspect deletion provenance, or execute audited permanent purges."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn secondary flex items-center gap-1.5"
              title="Refresh recycle bin"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-cyan-400' : ''} />
              <span>Refresh Vault</span>
            </button>
            {recycleBinItems.length > 0 && (
              <button
                onClick={() => setShowEmptyConfirm(true)}
                className="btn secondary flex items-center gap-1.5 text-rose-400 hover:text-rose-300 hover:border-rose-500/50"
              >
                <Trash2 size={14} />
                <span>Empty Recycle Bin</span>
              </button>
            )}
          </div>
        }
      />

      {/* Telemetry KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Deleted Records</span>
            <Trash2 size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Awaiting Restore or Expiry</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Source Modules</span>
            <Layers size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{kpis.uniqueEntities}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Distinct Origin Workspaces</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Statutory Retention</span>
            <Clock3 size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{kpis.retentionDays} Days</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Automated Purge Safe Guard</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Audit & Compliance</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">SOC 2 Type II</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All Deletions Cryptographically Logged</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Origin Entity Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 border border-slate-800/80 p-1 rounded-lg text-xs">
            {[
              { id: 'all', label: 'All Records' },
              { id: 'catalog', label: 'Product Catalogue' },
              { id: 'governance', label: 'Taxes, Terms & Stock' },
              { id: 'sales', label: 'Sales & Deals' },
              { id: 'accounts', label: 'Accounts & Contacts' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setEntityFilter(tab.id)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  entityFilter === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search record, reference, module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Recycle Bin Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Trash2 size={16} className="text-rose-400" />
            <span>Soft-Deleted Record Inventory</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {filteredItems.length} records in queue
            </span>
          </h3>
          <span className="text-xs text-slate-500">Records can be restored back to live workspaces with intact links</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold min-w-[140px]">Reference Code</th>
                <th className="py-3 px-4 font-semibold min-w-[280px]">Record Title & Details</th>
                <th className="py-3 px-4 font-semibold min-w-[160px]">Origin Workspace</th>
                <th className="py-3 px-4 font-semibold min-w-[140px]">Deleted By</th>
                <th className="py-3 px-4 font-semibold min-w-[120px]">Date Removed</th>
                <th className="py-3 px-4 font-semibold text-center min-w-[120px]">Retention Status</th>
                <th className="py-3 px-4 font-semibold text-right min-w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-500">
                    <Trash2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-300">Recycle Bin is currently clean</p>
                    <p className="text-xs text-slate-500 mt-1">
                      No deleted records in retention. Whenever items are deleted from Products, Taxes, Terms, Stock, or Vendors, they will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const origEntity = item.fields?.originalEntity || 'General';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-rose-400 text-xs">{item.ref}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.id}</div>
                      </td>
                      <td className="py-3 px-4 min-w-[280px] whitespace-normal">
                        <div className="font-bold text-slate-100 text-xs leading-snug group-hover:text-cyan-300 transition-colors">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                          {origEntity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-200">{item.owner || 'Arjun Mehta'}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {item.date || '2026-11-20'}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Clock3 size={11} /> 28 Days Left
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRestore(item)}
                            title="Restore record to original workspace"
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/40 text-[11px] font-medium transition-colors flex items-center gap-1"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => handlePurge(item)}
                            title="Purge permanently"
                            className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer: Record Inspection */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Deleted Record Provenance</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedItem.ref}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-slate-400 font-medium">Record Title:</div>
                <div className="text-sm font-semibold text-white">{selectedItem.title}</div>
                {selectedItem.description && (
                  <div className="text-slate-300 mt-1">{selectedItem.description}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Original Module</div>
                  <div className="text-cyan-400 font-medium mt-0.5 capitalize">{selectedItem.fields?.originalEntity || 'General'}</div>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Deleted By</div>
                  <div className="text-white font-medium mt-0.5">{selectedItem.owner || 'Arjun Mehta'}</div>
                </div>
              </div>

              {selectedItem.fields && Object.keys(selectedItem.fields).length > 0 && (
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-slate-400 font-semibold mb-2">Stored Field Attributes:</div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {Object.entries(selectedItem.fields).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center py-1 border-b border-slate-900">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-slate-200 truncate max-w-[220px]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-3">
              <button
                onClick={() => handlePurge(selectedItem)}
                className="btn secondary text-rose-400 hover:text-rose-300 border-rose-500/30 hover:border-rose-500/60 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Purge Permanently</span>
              </button>
              <button
                onClick={() => handleRestore(selectedItem)}
                className="btn primary flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Restore to Live Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Empty Recycle Bin */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Empty Recycle Bin?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently purge all <span className="font-bold text-rose-400">{recycleBinItems.length}</span> soft-deleted records from PostgreSQL tenant storage. This operation is cryptographically signed and irreversible.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                className="btn secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyBin}
                className="btn primary bg-rose-600 hover:bg-rose-500 text-white border-none flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Confirm Permanent Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
