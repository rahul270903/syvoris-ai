import { useState } from 'react';
import {
  List, CheckCircle2, Sliders, Plus, Edit2, Trash2,
  Check, X, ArrowRight, Sparkles, Filter, Database,
  Layers, RefreshCw, AlertCircle
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface PicklistOption {
  id: string;
  label: string;
  color?: string;
  isDefault?: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface PicklistDependency {
  id: string;
  module: string;
  parentField: string;
  parentValue: string;
  childField: string;
  allowedChildValues: string[];
  description: string;
}

const INITIAL_DEPENDENCIES: PicklistDependency[] = [
  {
    id: 'dep-1',
    module: 'Project Management / Tasks',
    parentField: 'Category',
    parentValue: 'Software',
    childField: 'Task Type',
    allowedChildValues: ['Bug Fix', 'Feature Request', 'Cloud Migration', 'API Integration', 'Code Review'],
    description: 'When task category is "Software", restrict type to software engineering deliverables.'
  },
  {
    id: 'dep-2',
    module: 'Project Management / Tasks',
    parentField: 'Category',
    parentValue: 'Hardware',
    childField: 'Task Type',
    allowedChildValues: ['Installation', 'Fiber Splicing', 'Rack Mounting', 'Transceiver Burn-in', 'OTDR Calibration'],
    description: 'When task category is "Hardware", restrict type to physical telecommunications and fiber tasks.'
  },
  {
    id: 'dep-3',
    module: 'Customer Service & Cases',
    parentField: 'Issue Category',
    parentValue: 'Billing & Commercial',
    childField: 'Escalation Sub-Type',
    allowedChildValues: ['Invoice Dispute', 'Refund Request', 'Tax Exemption Certificate', 'Stripe Gateway Error'],
    description: 'Restricts case classification to financial items when parent category is Billing.'
  },
  {
    id: 'dep-4',
    module: 'Customer Service & Cases',
    parentField: 'Issue Category',
    parentValue: 'Technical Infrastructure',
    childField: 'Escalation Sub-Type',
    allowedChildValues: ['SAML SSO Handshake', 'BGP Peering Drop', 'Fiber Cut Physical', 'API Latency SLA Breach'],
    description: 'Restricts case classification to engineering infrastructure when parent category is Technical.'
  },
  {
    id: 'dep-5',
    module: 'Opportunities & Deals',
    parentField: 'Deal Type',
    parentValue: 'Carrier Wholesale',
    childField: 'Commercial Offering',
    allowedChildValues: ['Dark Fiber IRU Lease', '100G Transit Backhaul', 'Subsea Cable Capacity', 'Colocation Power Rack'],
    description: 'Limits deal offerings to carrier-grade infrastructure products.'
  },
  {
    id: 'dep-6',
    module: 'Opportunities & Deals',
    parentField: 'Deal Type',
    parentValue: 'Enterprise Cloud',
    childField: 'Commercial Offering',
    allowedChildValues: ['Per-Seat Enterprise License', 'Autonomous Agent Compute Seat', 'Custom RAG Storage Pool', 'Fluid Edge Services'],
    description: 'Limits deal offerings to SaaS cloud software subscriptions.'
  }
];

const INITIAL_PICKLIST_OPTIONS: Record<string, PicklistOption[]> = {
  'Task Type': [
    { id: 'opt-1', label: 'Bug Fix', color: 'rose', isActive: true, sortOrder: 1 },
    { id: 'opt-2', label: 'Feature Request', color: 'cyan', isActive: true, sortOrder: 2 },
    { id: 'opt-3', label: 'Cloud Migration', color: 'blue', isActive: true, sortOrder: 3 },
    { id: 'opt-4', label: 'API Integration', color: 'purple', isActive: true, sortOrder: 4 },
    { id: 'opt-5', label: 'Code Review', color: 'slate', isActive: true, sortOrder: 5 },
    { id: 'opt-6', label: 'Installation', color: 'amber', isActive: true, sortOrder: 6 },
    { id: 'opt-7', label: 'Fiber Splicing', color: 'emerald', isActive: true, sortOrder: 7 },
    { id: 'opt-8', label: 'Rack Mounting', color: 'indigo', isActive: true, sortOrder: 8 },
    { id: 'opt-9', label: 'Transceiver Burn-in', color: 'orange', isActive: true, sortOrder: 9 },
    { id: 'opt-10', label: 'OTDR Calibration', color: 'teal', isActive: true, sortOrder: 10 }
  ],
  'Project Status': [
    { id: 'ps-1', label: 'Planning', color: 'blue', isDefault: true, isActive: true, sortOrder: 1 },
    { id: 'ps-2', label: 'In Progress', color: 'cyan', isActive: true, sortOrder: 2 },
    { id: 'ps-3', label: 'In Review', color: 'purple', isActive: true, sortOrder: 3 },
    { id: 'ps-4', label: 'On Hold', color: 'amber', isActive: true, sortOrder: 4 },
    { id: 'ps-5', label: 'Completed', color: 'emerald', isActive: true, sortOrder: 5 },
    { id: 'ps-6', label: 'Cancelled', color: 'rose', isActive: true, sortOrder: 6 }
  ],
  'Lead Source': [
    { id: 'ls-1', label: 'Website Inbound', color: 'cyan', isDefault: true, isActive: true, sortOrder: 1 },
    { id: 'ls-2', label: 'Executive Referral', color: 'purple', isActive: true, sortOrder: 2 },
    { id: 'ls-3', label: 'Partner Registration', color: 'blue', isActive: true, sortOrder: 3 },
    { id: 'ls-4', label: 'Telecom Trade Show', color: 'emerald', isActive: true, sortOrder: 4 },
    { id: 'ls-5', label: 'Outbound SDR Cadence', color: 'amber', isActive: true, sortOrder: 5 }
  ]
};

export function PicklistConfigurationView() {
  const { addAudit } = useCRM();
  const [activeTab, setActiveTab] = useState<'conditional' | 'values'>('conditional');
  const [dependencies, setDependencies] = useState<PicklistDependency[]>(INITIAL_DEPENDENCIES);
  const [picklists, setPicklists] = useState(INITIAL_PICKLIST_OPTIONS);
  const [selectedPicklist, setSelectedPicklist] = useState<string>('Task Type');
  const [toast, setToast] = useState('');

  // Simulator State
  const [simCategory, setSimCategory] = useState<'Software' | 'Hardware'>('Software');
  const [simSelectedTaskType, setSimSelectedTaskType] = useState<string>('Bug Fix');

  // Modals
  const [showAddDepModal, setShowAddDepModal] = useState(false);
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);

  // New Dep Form
  const [depModule, setDepModule] = useState('Project Management / Tasks');
  const [depParentField, setDepParentField] = useState('Category');
  const [depParentVal, setDepParentVal] = useState('Software');
  const [depChildField, setDepChildField] = useState('Task Type');
  const [depChildVals, setDepChildVals] = useState('Bug Fix, Feature Request, Cloud Migration');
  const [depDesc, setDepDesc] = useState('');

  // New Option Form
  const [optLabel, setOptLabel] = useState('');
  const [optColor, setOptColor] = useState('cyan');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Compute simulator options based on chosen parent value
  const simRule = dependencies.find(d =>
    d.parentField === 'Category' && d.parentValue === simCategory && d.childField === 'Task Type'
  );
  const availableChildOptions = simRule ? simRule.allowedChildValues : ['General Task'];

  const handleSimCategoryChange = (val: 'Software' | 'Hardware') => {
    setSimCategory(val);
    const rule = dependencies.find(d =>
      d.parentField === 'Category' && d.parentValue === val && d.childField === 'Task Type'
    );
    if (rule && rule.allowedChildValues.length > 0) {
      setSimSelectedTaskType(rule.allowedChildValues[0]);
    }
  };

  const handleDeleteDependency = (depId: string) => {
    setDependencies(prev => prev.filter(d => d.id !== depId));
    notify('Conditional picklist dependency removed.');
  };

  const handleCreateDependency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depParentField || !depParentVal || !depChildField) return;

    const newDep: PicklistDependency = {
      id: `dep-${Date.now().toString().slice(-4)}`,
      module: depModule,
      parentField: depParentField,
      parentValue: depParentVal,
      childField: depChildField,
      allowedChildValues: depChildVals.split(',').map(s => s.trim()).filter(Boolean),
      description: depDesc || `If ${depParentField} is "${depParentVal}", restrict ${depChildField}.`
    };

    setDependencies(prev => [...prev, newDep]);
    setShowAddDepModal(false);
    setDepDesc('');
    notify(`Conditional rule created: ${newDep.parentValue} ➔ ${newDep.childField}`);
    addAudit?.('Picklist Dependency', `Added conditional rule for ${newDep.parentValue}`, 'Metadata Config');
  };

  const handleCreateOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!optLabel) return;

    const newOpt: PicklistOption = {
      id: `opt-${Date.now().toString().slice(-4)}`,
      label: optLabel,
      color: optColor,
      isActive: true,
      sortOrder: (picklists[selectedPicklist] || []).length + 1
    };

    setPicklists(prev => ({
      ...prev,
      [selectedPicklist]: [...(prev[selectedPicklist] || []), newOpt]
    }));

    setShowAddOptionModal(false);
    setOptLabel('');
    notify(`Option "${newOpt.label}" added to ${selectedPicklist}.`);
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
        eyebrow="ADMINISTRATION / PICKLIST CONFIGURATION"
        title="Picklist Field Values & Conditional Dependencies"
        subtitle="Manage global dropdown option registers and configure dynamic conditional logic rules (e.g. If Category is 'Software', show 'Bug Fix'; if 'Hardware', show 'Installation')."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddDepModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Dependency Rule</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Configured Dropdowns</span>
            <List className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">14 Picklists</div>
          <div className="text-[11px] text-slate-500 mt-1">Master schema definitions</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Dependency Rules</span>
            <Filter className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{dependencies.length} Active Rules</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Conditional logic engine</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Total Option Values</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">92 Choices</div>
          <div className="text-[11px] text-slate-500 mt-1">Active categorical badges</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Form Engine Filter</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">Zero Stale Options</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Dynamic client-side filtering</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('conditional')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'conditional'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Conditional Logic & Dependencies ("The Dropdown Filter")</span>
        </button>

        <button
          onClick={() => setActiveTab('values')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'values'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Dropdown Option Values Master ("The Dropdown Manager")</span>
        </button>
      </div>

      {activeTab === 'conditional' ? (
        <div className="space-y-5">
          {/* INTERACTIVE DEPENDENCY SIMULATOR */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 border border-cyan-500/40 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Conditional Logic Verification Sandbox</h3>
                  <p className="text-xs text-slate-400">
                    Test the exact requirement: Select parent <strong>Category</strong> to watch child <strong>Task Type</strong> restrict dynamically.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2.5 py-1 rounded">
                Dynamic RLS Evaluator Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Parent Dropdown: Category
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimCategoryChange('Software')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      simCategory === 'Software'
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Software
                  </button>
                  <button
                    onClick={() => handleSimCategoryChange('Hardware')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      simCategory === 'Hardware'
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Hardware
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Selected parent condition: <strong className="text-cyan-400">{simCategory}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Child Dropdown: Task Type (Filtered Options)
                </label>
                <select
                  value={simSelectedTaskType}
                  onChange={e => setSimSelectedTaskType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {availableChildOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Allowed options restricted to: <strong>{availableChildOptions.join(', ')}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DEPENDENCY RULES TABLE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Configured Conditional Rules & Allowed Subsets</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  When a user selects the parent choice, the form renderer filters available child options to the defined list.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Governed Module</th>
                    <th className="py-3 px-4">Parent Field & Choice</th>
                    <th className="py-3 px-4">Dependent Child Field</th>
                    <th className="py-3 px-4">Permitted Child Options</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {dependencies.map(dep => (
                    <tr key={dep.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {dep.module}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-400 text-[11px]">{dep.parentField} =</div>
                        <span className="font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded text-xs inline-block mt-0.5">
                          "{dep.parentValue}"
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-400 text-[11px]">Restricts:</div>
                        <span className="font-semibold text-white mt-0.5 inline-block">
                          {dep.childField}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {dep.allowedChildValues.map(val => (
                            <span
                              key={val}
                              className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded font-mono"
                            >
                              {val}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteDependency(dep.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded border border-slate-700 transition-colors"
                          title="Delete Dependency Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Dropdown Master Values Tab */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Picklist:</span>
              <div className="flex flex-wrap gap-2">
                {Object.keys(picklists).map(name => (
                  <button
                    key={name}
                    onClick={() => setSelectedPicklist(name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedPicklist === name
                        ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAddOptionModal(true)}
              className="px-3.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Value</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">Option Label</th>
                  <th className="py-2.5 px-3">Badge Style</th>
                  <th className="py-2.5 px-3 text-center">Default</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {(picklists[selectedPicklist] || []).map(opt => (
                  <tr key={opt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-500 text-[11px]">
                      {opt.sortOrder}
                    </td>

                    <td className="py-3 px-4 font-semibold text-white">
                      {opt.label}
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                        {opt.color || 'cyan'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {opt.isDefault ? (
                        <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded">
                          Default
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE DEPENDENCY MODAL */}
      {showAddDepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Filter className="w-5 h-5 text-cyan-400" />
              <span>Add Conditional Logic Dependency</span>
            </div>

            <form onSubmit={handleCreateDependency} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Target Module</label>
                <select
                  value={depModule}
                  onChange={e => setDepModule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Project Management / Tasks">Project Management / Tasks</option>
                  <option value="Customer Service & Cases">Customer Service & Cases</option>
                  <option value="Opportunities & Deals">Opportunities & Deals</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Parent Field</label>
                  <input
                    type="text"
                    required
                    value={depParentField}
                    onChange={e => setDepParentField(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Parent Choice Value</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software"
                    value={depParentVal}
                    onChange={e => setDepParentVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Restricted Child Field</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Task Type"
                  value={depChildField}
                  onChange={e => setDepChildField(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Allowed Child Options (Comma-Separated) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Bug Fix, Feature Request, Cloud Migration"
                  value={depChildVals}
                  onChange={e => setDepChildVals(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDepModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Save Dependency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE OPTION MODAL */}
      {showAddOptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Add Option to {selectedPicklist}</span>
            </div>

            <form onSubmit={handleCreateOption} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Option Value *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expedited Maintenance"
                  value={optLabel}
                  onChange={e => setOptLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Badge Color</label>
                <select
                  value={optColor}
                  onChange={e => setOptColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="cyan">Cyan</option>
                  <option value="blue">Blue</option>
                  <option value="emerald">Emerald</option>
                  <option value="purple">Purple</option>
                  <option value="amber">Amber</option>
                  <option value="rose">Rose</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddOptionModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Add Value
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
