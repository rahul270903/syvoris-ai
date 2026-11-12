import React, { useState, useEffect } from 'react';
import { 
  Network, Building2, ChevronRight, ChevronDown, Users, 
  DollarSign, Briefcase, RefreshCw, AlertCircle, ShieldCheck
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

  useEffect(() => {
    api.listAccounts({ limit: 100 })
      .then(res => {
        if (res && res.items.length > 0) {
          setAccounts(res.items);
          setSelectedAccountId(res.items[0].id);
        }
      })
      .catch(() => {});
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

  const renderNode = (node: AccountHierarchyNode, level: number = 0) => {
    const isCurrent = node.id === hierarchy?.current_account_id;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] !== false;

    return (
      <div key={node.id} className="relative">
        <div 
          onClick={() => onOpenRecord('organizations', node.id)}
          className={`flex items-center justify-between p-3.5 my-1.5 rounded-xl border transition-all cursor-pointer ${
            isCurrent 
              ? 'bg-blue-900/30 border-blue-500 shadow-md ring-1 ring-blue-400' 
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
          }`}
          style={{ marginLeft: `${level * 28}px` }}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button 
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              </div>
            )}

            <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40">
              <Building2 className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100">{node.name}</span>
                <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-400">{node.ref}</span>
                {isCurrent && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Selected Node
                  </span>
                )}
                {level === 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Root Holding
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                <span>{node.industry || 'Enterprise'}</span>
                <span>•</span>
                <span>Type: {node.account_type}</span>
                <span>•</span>
                <span>Owner: {node.owner_name || 'Organization Owner'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{node.direct_contacts_count} Contacts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>{node.direct_opportunities_count} Deals</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
              <span>${Number(node.direct_pipeline_value).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="relative pl-3 border-l border-slate-800 ml-4">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-100">Account Hierarchies & Parent-Child Tree</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise relationship intelligence, recursive ownership modeling, and aggregated pipeline rollups (CR-02).
          </p>
        </div>

        {/* Account Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 whitespace-nowrap">Focus Account:</label>
          <select 
            value={selectedAccountId} 
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.ref})</option>
            ))}
          </select>

          <button 
            onClick={() => loadHierarchy(selectedAccountId)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Refresh Hierarchy"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {hierarchy && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400">Total Entities</div>
            <div className="text-xl font-bold text-slate-100 mt-1">{hierarchy.total_hierarchy_accounts}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400">Max Depth</div>
            <div className="text-xl font-bold text-cyan-400 mt-1">{hierarchy.max_depth} Levels</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400">Linked Contacts</div>
            <div className="text-xl font-bold text-indigo-400 mt-1">{hierarchy.total_hierarchy_contacts}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400">Total Deals</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{hierarchy.total_hierarchy_opportunities}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400">Rolled Up Pipeline</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">${Number(hierarchy.total_hierarchy_pipeline_value).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
          <p>Traversing hierarchy tree and calculating rollups...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : hierarchy?.root ? (
        <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-3 uppercase tracking-wider mb-2">
            <span>Corporate Entity & Subsidary Network</span>
            <span>Operating Metrics</span>
          </div>
          {renderNode(hierarchy.root)}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 bg-slate-900/20 rounded-xl border border-slate-800">
          No accounts found in this organization.
        </div>
      )}
    </div>
  );
}
