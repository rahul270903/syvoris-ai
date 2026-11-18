import React, { useState, useEffect } from 'react';
import { 
  Network, Building2, ChevronRight, ChevronDown, Users, 
  DollarSign, Briefcase, RefreshCw, AlertCircle, ShieldCheck,
  GitFork, Check, X, ArrowRight, Layers
} from 'lucide-react';
import { api, AccountHierarchyResponse, AccountHierarchyNode, AccountItem } from '../../services/api';

export function AccountHierarchiesView({
  onOpenRecord
}: {
  onOpenRecord: (entity: string, recordId: string) => void;
}) {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [hierarchy, setHierarchy] = useState<AccountHierarchyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Reparenting Modal State
  const [reparentTarget, setReparentTarget] = useState<AccountHierarchyNode | null>(null);
  const [newParentId, setNewParentId] = useState<string>('');
  const [savingParent, setSavingParent] = useState(false);
  const [reparentError, setReparentError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      const res = await api.listAccounts({ limit: 100 });
      if (res && res.items.length > 0) {
        setAccounts(res.items);
        if (!selectedAccountId) {
          setSelectedAccountId(res.items[0].id);
        }
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadHierarchy = async (accId: string) => {
    if (!accId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAccountHierarchy(accId);
      setHierarchy(data);
      // Auto-expand all nodes in the tree
      const expanded: Record<string, boolean> = {};
      const traverse = (node: AccountHierarchyNode) => {
        expanded[node.id] = true;
        node.children.forEach(traverse);
      };
      if (data.root) traverse(data.root);
      setExpandedNodes(expanded);
    } catch (err: any) {
      setError(err?.message || 'Failed to load account hierarchy tree.');
      setHierarchy(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      loadHierarchy(selectedAccountId);
    }
  }, [selectedAccountId]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Collect all descendant IDs of a node to prevent cycles
  const getDescendantIds = (node: AccountHierarchyNode): Set<string> => {
    const ids = new Set<string>();
    const recurse = (n: AccountHierarchyNode) => {
      n.children.forEach(child => {
        ids.add(child.id);
        recurse(child);
      });
    };
    recurse(node);
    return ids;
  };

  const openReparentModal = (node: AccountHierarchyNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setReparentTarget(node);
    // Find current parent ID in accounts list
    const accItem = accounts.find(a => a.id === node.id);
    setNewParentId(accItem?.parent_id || '');
    setReparentError(null);
  };

  const handleSaveParent = async () => {
    if (!reparentTarget) return;

    if (newParentId === reparentTarget.id) {
      setReparentError('An account cannot be its own parent.');
      return;
    }

    const descendants = getDescendantIds(reparentTarget);
    if (newParentId && descendants.has(newParentId)) {
      setReparentError('Invalid hierarchy: target parent is currently a descendant or subsidiary of this account (cycle prevention).');
      return;
    }

    setSavingParent(true);
    setReparentError(null);
    try {
      await api.updateAccount(reparentTarget.id, {
        parent_id: newParentId ? newParentId : undefined
      });
      setSuccessToast(`Parent relationship for "${reparentTarget.name}" successfully updated.`);
      setReparentTarget(null);
      await loadAccounts();
      await loadHierarchy(selectedAccountId);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setReparentError(err?.message || 'Failed to update account parent relationship.');
    } finally {
      setSavingParent(false);
    }
  };

  const renderNode = (node: AccountHierarchyNode, level: number = 0) => {
    const isCurrent = node.id === hierarchy?.current_account_id;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] !== false;

    return (
      <div key={node.id} className="relative">
        <div 
          onClick={() => onOpenRecord('organizations', node.id)}
          className={`flex flex-col lg:flex-row lg:items-center justify-between p-3.5 my-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
            isCurrent 
              ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-300' 
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
          }`}
          style={{ marginLeft: `${level * 28}px` }}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button 
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-1 rounded hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              </div>
            )}

            <div className={`p-2 rounded-lg border ${
              isCurrent 
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <Building2 className="w-4 h-4" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{node.name}</span>
                <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {node.ref}
                </span>
                {isCurrent && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Focus Node
                  </span>
                )}
                {level === 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Root Holding
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2.5 mt-1 font-medium">
                <span>{node.industry || 'Enterprise'}</span>
                <span>•</span>
                <span>Type: <strong className="text-slate-700">{node.account_type}</strong></span>
                <span>•</span>
                <span>Owner: <strong className="text-slate-700">{node.owner_name || 'Organization Owner'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 lg:mt-0 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 bg-cyan-50 border border-cyan-200/80 px-2.5 py-1 rounded-md text-cyan-800 font-medium">
              <Users className="w-3.5 h-3.5 text-cyan-600" />
              <span>{node.direct_contacts_count} Contacts</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md text-amber-800 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-amber-600" />
              <span>{node.direct_opportunities_count} Deals</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md text-emerald-800 font-bold">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>${Number(node.direct_pipeline_value).toLocaleString()}</span>
            </div>

            <button
              onClick={(e) => openReparentModal(node, e)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium shadow-2xs transition-colors"
              title="Change Parent Account"
            >
              <GitFork className="w-3.5 h-3.5 text-slate-500" />
              <span>Change Parent</span>
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="relative pl-3 border-l-2 border-slate-200 ml-4">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            ESSENTIALS & CUSTOMER 360 / ENTERPRISE GRAPH
          </div>
          <div className="flex items-center gap-2.5">
            <Network className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Account Hierarchies & Parent-Child Tree</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Enterprise relationship intelligence, recursive ownership modeling, and aggregated pipeline rollups (CR-02).
          </p>
        </div>

        {/* Account Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Focus Account:</label>
          <select 
            value={selectedAccountId} 
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.ref})</option>
            ))}
          </select>

          <button 
            onClick={() => loadHierarchy(selectedAccountId)}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-colors"
            title="Refresh Hierarchy"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {hierarchy && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Entities</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{hierarchy.total_hierarchy_accounts}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Max Depth</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{hierarchy.max_depth} Levels</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked Contacts</div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{hierarchy.total_hierarchy_contacts}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Deals</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{hierarchy.total_hierarchy_opportunities}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rolled Up Pipeline</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">${Number(hierarchy.total_hierarchy_pipeline_value).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-sm font-medium">Traversing hierarchy tree and calculating corporate rollups...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      ) : hierarchy?.root ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-3 uppercase tracking-wider mb-2">
            <span>Corporate Entity & Subsidiary Network</span>
            <span>Operating Metrics & Actions</span>
          </div>
          {renderNode(hierarchy.root)}
        </div>
      ) : (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
          No accounts found in this organization.
        </div>
      )}

      {/* Reparent Organization Modal */}
      {reparentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Configure Parent Organization</h3>
              </div>
              <button 
                onClick={() => setReparentTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Target Account
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>{reparentTarget.name}</span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {reparentTarget.ref}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Select New Parent Organization:
                </label>
                <select
                  value={newParentId}
                  onChange={(e) => {
                    setNewParentId(e.target.value);
                    setReparentError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="">None (Make Top-Level Root Holding Entity)</option>
                  {accounts
                    .filter(a => a.id !== reparentTarget.id)
                    .map(a => {
                      const isDescendant = getDescendantIds(reparentTarget).has(a.id);
                      return (
                        <option 
                          key={a.id} 
                          value={a.id}
                          disabled={isDescendant}
                        >
                          {a.name} ({a.ref}) {isDescendant ? '— [Invalid: Subsidiary]' : ''}
                        </option>
                      );
                    })}
                </select>
                <p className="text-xs text-slate-500 mt-1.5">
                  Selecting another organization nests this account and its subsidiaries under the chosen parent.
                </p>
              </div>

              {reparentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{reparentError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setReparentTarget(null)}
                disabled={savingParent}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveParent}
                disabled={savingParent}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                {savingParent ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save Relationship
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
