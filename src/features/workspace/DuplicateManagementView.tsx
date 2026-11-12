import React, { useState, useEffect } from 'react';
import { 
  Search, GitMerge, Check, AlertTriangle, ShieldCheck, 
  ArrowRight, RefreshCw, X, CheckCircle2, ChevronRight, Layers
} from 'lucide-react';
import { api, DuplicateCluster, DuplicateRecordItem } from '../../services/api';

export function DuplicateManagementView({
  onOpenRecord
}: {
  onOpenRecord: (entity: string, recordId: string) => void;
}) {
  const [entityType, setEntityType] = useState<'account' | 'contact' | 'lead'>('account');
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<string>('');
  
  // Merge Modal State
  const [activeCluster, setActiveCluster] = useState<DuplicateCluster | null>(null);
  const [masterId, setMasterId] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<Record<string, string>>({});
  const [merging, setMerging] = useState(false);
  const [mergeMessage, setMergeMessage] = useState<string | null>(null);

  const runScan = async () => {
    setLoading(true);
    setScanningStatus(`Scanning candidate ${entityType} records with fuzzy and exact algorithms...`);
    try {
      const res = await api.scanDuplicates(entityType, 50);
      setClusters(res.clusters || []);
    } catch (err: any) {
      setClusters([]);
    } finally {
      setLoading(false);
      setScanningStatus('');
    }
  };

  useEffect(() => {
    runScan();
  }, [entityType]);

  const openMergeModal = (cluster: DuplicateCluster) => {
    setActiveCluster(cluster);
    const firstRec = cluster.records[0];
    setMasterId(firstRec.id);
    setMergeMessage(null);

    // Initialize field selection with first record's values
    const initialFields: Record<string, string> = {};
    Object.keys(firstRec.fields || {}).forEach(k => {
      initialFields[k] = firstRec.fields[k] || '';
    });
    setSelectedFields(initialFields);
  };

  const executeMerge = async () => {
    if (!activeCluster || !masterId) return;
    setMerging(true);
    try {
      const duplicateIds = activeCluster.records
        .map(r => r.id)
        .filter(id => id !== masterId);

      const res = await api.mergeRecords({
        entity_type: entityType,
        master_id: masterId,
        duplicate_ids: duplicateIds,
        field_overrides: selectedFields
      });

      setMergeMessage(res.message);
      // Remove merged cluster from list
      setClusters(prev => prev.filter(c => c.cluster_id !== activeCluster.cluster_id));
      setTimeout(() => {
        setActiveCluster(null);
        setMergeMessage(null);
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Failed to merge records.');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-100">Enterprise Duplicate Detection & Merge</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Normalized email/phone resolution, fuzzy corporate naming matching, and atomic record consolidation (CR-04).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            {(['account', 'contact', 'lead'] as const).map(type => (
              <button
                key={type}
                onClick={() => setEntityType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                  entityType === type 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}s
              </button>
            ))}
          </div>

          <button
            onClick={runScan}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Run Scan
          </button>
        </div>
      </div>

      {/* Status banner */}
      {scanningStatus && (
        <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300 text-xs flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>{scanningStatus}</span>
        </div>
      )}

      {/* Cluster Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
          <p>Scanning active records against multi-field matching criteria...</p>
        </div>
      ) : clusters.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-slate-900/20 rounded-2xl border border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-200">Zero Duplicates Detected</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
            All candidate {entityType} records satisfy unique normalization constraints. No clusters exceed the similarity threshold.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Detected Potential Duplicate Clusters ({clusters.length})
          </div>

          {clusters.map(cluster => (
            <div 
              key={cluster.cluster_id}
              className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    cluster.confidence_score >= 90 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {cluster.confidence_score}% Confidence Match
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    Rule Triggered: {cluster.primary_rule}
                  </span>
                </div>

                <button
                  onClick={() => openMergeModal(cluster)}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-lg shadow transition-all self-start md:self-auto"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  Review & Merge Records
                </button>
              </div>

              {/* Records comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cluster.records.map((rec, idx) => (
                  <div 
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Candidate #{idx + 1}</span>
                      <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-300">{rec.ref}</span>
                    </div>

                    <div className="font-semibold text-slate-100 text-sm">{rec.name}</div>
                    
                    <div className="text-xs text-slate-400 space-y-1">
                      {rec.email && <div>Email: <span className="text-slate-200">{rec.email}</span></div>}
                      {rec.phone && <div>Phone: <span className="text-slate-200">{rec.phone}</span></div>}
                      {rec.secondary_info && <div>Details: <span className="text-slate-200">{rec.secondary_info}</span></div>}
                      {rec.owner_name && <div>Owner: <span className="text-slate-200">{rec.owner_name}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side-by-Side Merge Review Modal */}
      {activeCluster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-slate-100">Review & Execute Atomic Merge</h3>
              </div>
              <button 
                onClick={() => setActiveCluster(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mergeMessage ? (
              <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-slate-100 text-base">{mergeMessage}</h4>
                <p className="text-xs text-slate-400">All child deals, contacts, activities, and sub-accounts have been atomically reassigned.</p>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 space-y-1">
                  <div className="font-semibold text-blue-100">Atomic Rollback & Reassignment Guarantee</div>
                  <div>Select the surviving <strong>Master Record</strong>. All linked child contacts, opportunities, and activities will be re-pointed to it. Non-master records will be soft-deleted with an immutable audit trail.</div>
                </div>

                {/* Master Record Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Choose Surviving Master Record:</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeCluster.records.map(rec => (
                      <div 
                        key={rec.id}
                        onClick={() => setMasterId(rec.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          masterId === rec.id
                            ? 'bg-blue-900/40 border-blue-500 shadow-md ring-1 ring-blue-400'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-cyan-400">{rec.ref}</span>
                          {masterId === rec.id ? (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                              Master Record
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">
                              Will Be Archived
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-100 text-sm">{rec.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{rec.email || rec.phone || 'No direct contact info'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Field Selection / Overrides */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Field Value Precedence:</label>
                  <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 text-xs">
                    {Object.keys(activeCluster.records[0].fields || {}).map(fieldKey => (
                      <div key={fieldKey} className="grid grid-cols-3 p-2.5 items-center bg-slate-950/40">
                        <span className="font-medium text-slate-400 capitalize">{fieldKey.replace('_', ' ')}</span>
                        <div className="col-span-2 flex items-center gap-3">
                          {activeCluster.records.map(r => (
                            <label key={r.id} className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                              <input 
                                type="radio" 
                                name={`field_${fieldKey}`}
                                checked={selectedFields[fieldKey] === r.fields[fieldKey]}
                                onChange={() => setSelectedFields(prev => ({ ...prev, [fieldKey]: r.fields[fieldKey] }))}
                                className="text-blue-600 focus:ring-0"
                              />
                              <span className="truncate max-w-[150px]">{r.fields[fieldKey] || '<empty>'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setActiveCluster(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeMerge}
                    disabled={merging}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-lg shadow transition-all"
                  >
                    <GitMerge className={`w-4 h-4 ${merging ? 'animate-spin' : ''}`} />
                    {merging ? 'Consolidating Records...' : 'Confirm & Execute Atomic Merge'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
