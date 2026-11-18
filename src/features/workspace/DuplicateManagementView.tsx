import React, { useState, useEffect } from 'react';
import { 
  Search, GitMerge, Check, AlertTriangle, ShieldCheck, 
  ArrowRight, RefreshCw, X, CheckCircle2, ChevronRight, Layers,
  Users, Building2, UserCheck, AlertCircle
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
  const [mergeError, setMergeError] = useState<string | null>(null);

  const runScan = async () => {
    setLoading(true);
    setScanningStatus(`Scanning candidate ${entityType} records with fuzzy and exact algorithms...`);
    try {
      const res = await api.scanDuplicates(entityType, 50);
      setClusters(res.clusters || []);
    } catch {
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
    setMergeError(null);

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
    setMergeError(null);
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
      }, 2000);
    } catch (err: any) {
      setMergeError(err?.message || 'Failed to merge duplicate records.');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            DATA STEWARDSHIP & DEDUPLICATION / INTEGRITY ENGINE
          </div>
          <div className="flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Enterprise Duplicate Detection & Merge</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Normalized email/phone resolution, fuzzy corporate naming matching, and atomic record consolidation (CR-04).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            {(['account', 'contact', 'lead'] as const).map(type => (
              <button
                key={type}
                onClick={() => setEntityType(type)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
                  entityType === type 
                    ? 'bg-white text-blue-700 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}s
              </button>
            ))}
          </div>

          <button
            onClick={runScan}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Run Scan
          </button>
        </div>
      </div>

      {/* Status banner */}
      {scanningStatus && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>{scanningStatus}</span>
        </div>
      )}

      {/* Cluster Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-sm font-medium">Scanning active records against multi-field matching criteria...</p>
        </div>
      ) : clusters.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Zero Duplicates Detected</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
            All candidate {entityType} records satisfy unique normalization constraints. No clusters exceed the similarity threshold.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Detected Potential Duplicate Clusters ({clusters.length})
          </div>

          {clusters.map(cluster => (
            <div 
              key={cluster.cluster_id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    cluster.confidence_score >= 90 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {cluster.confidence_score}% Confidence Match
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    Rule Triggered: {cluster.primary_rule}
                  </span>
                </div>

                <button
                  onClick={() => openMergeModal(cluster)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all self-start md:self-auto cursor-pointer"
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
                    className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Candidate #{idx + 1}</span>
                      <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        {rec.ref}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-sm">{rec.name}</div>
                    
                    <div className="text-xs text-slate-600 space-y-1">
                      {rec.email && <div><span className="font-medium text-slate-500">Email:</span> <span className="text-slate-800 font-semibold">{rec.email}</span></div>}
                      {rec.phone && <div><span className="font-medium text-slate-500">Phone:</span> <span className="text-slate-800 font-semibold">{rec.phone}</span></div>}
                      {rec.secondary_info && <div><span className="font-medium text-slate-500">Details:</span> <span className="text-slate-800 font-medium">{rec.secondary_info}</span></div>}
                      {rec.owner_name && <div><span className="font-medium text-slate-500">Owner:</span> <span className="text-slate-800 font-medium">{rec.owner_name}</span></div>}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Review & Execute Atomic Merge</h3>
              </div>
              <button 
                onClick={() => setActiveCluster(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mergeMessage ? (
              <div className="p-8 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-base">{mergeMessage}</h4>
                <p className="text-xs text-slate-600">All child deals, contacts, activities, and sub-accounts have been atomically reassigned.</p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <div className="font-bold text-blue-950">Atomic Rollback & Reassignment Guarantee</div>
                  <div>Select the surviving <strong>Master Record</strong>. All linked child contacts, opportunities, and activities will be re-pointed to it. Non-master records will be soft-deleted with an immutable audit trail.</div>
                </div>

                {mergeError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{mergeError}</span>
                  </div>
                )}

                {/* Master Record Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Choose Surviving Master Record:</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeCluster.records.map(rec => (
                      <div 
                        key={rec.id}
                        onClick={() => setMasterId(rec.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          masterId === rec.id
                            ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-2 ring-blue-300'
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{rec.ref}</span>
                          {masterId === rec.id ? (
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-600 text-white">
                              Master Record
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
                              Will Be Archived
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 text-sm">{rec.name}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">{rec.email || rec.phone || 'No direct contact info'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Field Selection / Overrides */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Field Value Precedence:</label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {Object.keys(activeCluster.records[0].fields || {}).map(fieldKey => (
                      <div key={fieldKey} className="grid grid-cols-3 p-3 items-center bg-white hover:bg-slate-50/60 transition-colors">
                        <span className="font-semibold text-slate-700 capitalize">{fieldKey.replace('_', ' ')}</span>
                        <div className="col-span-2 flex items-center gap-4">
                          {activeCluster.records.map(r => (
                            <label key={r.id} className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                              <input 
                                type="radio" 
                                name={`field_${fieldKey}`}
                                checked={selectedFields[fieldKey] === r.fields[fieldKey]}
                                onChange={() => setSelectedFields(prev => ({ ...prev, [fieldKey]: r.fields[fieldKey] }))}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="truncate max-w-[160px]">{r.fields[fieldKey] || <span className="text-slate-400 italic">&lt;empty&gt;</span>}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveCluster(null)}
                    disabled={merging}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeMerge}
                    disabled={merging}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
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
