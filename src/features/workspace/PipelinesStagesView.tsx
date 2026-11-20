import { useState } from 'react';
import {
  Kanban, Plus, Edit2, Trash2, ArrowUp, ArrowDown,
  CheckCircle2, DollarSign, Clock, ShieldCheck, ChevronRight,
  TrendingUp, Sparkles, X, Sliders, Layers, RefreshCw
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface StageItem {
  id: string;
  name: string;
  order: number;
  probability: number;
  forecastCategory: 'Pipeline' | 'Best Case' | 'Commit' | 'Closed' | 'Omitted';
  stalledDays: number;
  stageGate: string;
}

export interface PipelineItem {
  id: string;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  stages: StageItem[];
}

const INITIAL_PIPELINES: PipelineItem[] = [
  {
    id: 'pipe-1',
    name: 'Enterprise Direct Sales Pipeline',
    code: 'ENT-SALES',
    description: 'Primary consultative commercial sales cycle for enterprise cloud and networking accounts.',
    isDefault: true,
    stages: [
      { id: 'stg-101', name: 'Discovery & Needs Assessment', order: 1, probability: 20, forecastCategory: 'Pipeline', stalledDays: 14, stageGate: 'BANT Qualification Form Completed' },
      { id: 'stg-102', name: 'Solution Architecture & Scoping', order: 2, probability: 40, forecastCategory: 'Pipeline', stalledDays: 21, stageGate: 'Technical BOM & Architecture Verified' },
      { id: 'stg-103', name: 'Commercial Proposal Delivery', order: 3, probability: 60, forecastCategory: 'Best Case', stalledDays: 14, stageGate: 'CPQ Quote Generated & Dispatched' },
      { id: 'stg-104', name: 'Contract & Price Negotiation', order: 4, probability: 80, forecastCategory: 'Commit', stalledDays: 10, stageGate: 'Discount & Legal Boilerplate Approved' },
      { id: 'stg-105', name: 'Closed Won', order: 5, probability: 100, forecastCategory: 'Closed', stalledDays: 0, stageGate: 'Auto-Trigger Project Handover' },
      { id: 'stg-106', name: 'Closed Lost', order: 6, probability: 0, forecastCategory: 'Omitted', stalledDays: 0, stageGate: 'Root-Cause Loss Reason Mandatory' }
    ]
  },
  {
    id: 'pipe-2',
    name: 'Carrier Wholesale & Infrastructure',
    code: 'CARRIER-INFRA',
    description: 'Multi-year dark fiber, backhaul transport, and telecom transit wholesale agreements.',
    isDefault: false,
    stages: [
      { id: 'stg-201', name: 'RFP / Tender Ingestion', order: 1, probability: 15, forecastCategory: 'Pipeline', stalledDays: 30, stageGate: 'RFP Compliance Matrix Complete' },
      { id: 'stg-202', name: 'Optical Feasibility & Route Survey', order: 2, probability: 35, forecastCategory: 'Pipeline', stalledDays: 21, stageGate: 'Field Survey & Splicing Plan Approved' },
      { id: 'stg-203', name: 'Carrier Master Service Agreement (MSA)', order: 3, probability: 70, forecastCategory: 'Best Case', stalledDays: 14, stageGate: 'Carrier Legal Review Executed' },
      { id: 'stg-204', name: 'Regulatory & Spectrum Clearance', order: 4, probability: 85, forecastCategory: 'Commit', stalledDays: 15, stageGate: 'Utilities & Spectrum Signoff' },
      { id: 'stg-205', name: 'Closed Won (Carrier Commissioning)', order: 5, probability: 100, forecastCategory: 'Closed', stalledDays: 0, stageGate: 'Asset Activation & Billing Start' },
      { id: 'stg-206', name: 'Bid Rejected / Disqualified', order: 6, probability: 0, forecastCategory: 'Omitted', stalledDays: 0, stageGate: 'Loss Debrief Logged' }
    ]
  },
  {
    id: 'pipe-3',
    name: 'Channel & Partner Reseller Pipeline',
    code: 'CHANNEL-PARTNER',
    description: 'Indirect distributor deals, co-selling motions, and reseller revenue opportunities.',
    isDefault: false,
    stages: [
      { id: 'stg-301', name: 'Partner Lead Registration', order: 1, probability: 25, forecastCategory: 'Pipeline', stalledDays: 7, stageGate: 'Deal Registration Verified' },
      { id: 'stg-302', name: 'Joint Executive Demonstration', order: 2, probability: 50, forecastCategory: 'Best Case', stalledDays: 14, stageGate: 'Client Tech Sponsor Confirmed' },
      { id: 'stg-303', name: 'Partner Margin & Quota Approval', order: 3, probability: 75, forecastCategory: 'Commit', stalledDays: 7, stageGate: 'Reseller Margin Tier Approved' },
      { id: 'stg-304', name: 'Reseller Deal Won', order: 4, probability: 100, forecastCategory: 'Closed', stalledDays: 0, stageGate: 'Partner Commission Credit Created' }
    ]
  }
];

export function PipelinesStagesView() {
  const { addAudit } = useCRM();
  const [pipelines, setPipelines] = useState<PipelineItem[]>(INITIAL_PIPELINES);
  const [activePipelineId, setActivePipelineId] = useState<string>('pipe-1');
  const [toast, setToast] = useState('');

  // Modals
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [showAddPipelineModal, setShowAddPipelineModal] = useState(false);

  // Stage form
  const [stageName, setStageName] = useState('');
  const [stageProb, setStageProb] = useState(50);
  const [stageCategory, setStageCategory] = useState<'Pipeline' | 'Best Case' | 'Commit' | 'Closed' | 'Omitted'>('Pipeline');
  const [stageStalled, setStageStalled] = useState(14);
  const [stageGate, setStageGate] = useState('');

  // Pipeline form
  const [newPipeName, setNewPipeName] = useState('');
  const [newPipeDesc, setNewPipeDesc] = useState('');

  // Simulator
  const [simAmount, setSimAmount] = useState(250000);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const currentPipeline = pipelines.find(p => p.id === activePipelineId) || pipelines[0];

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentPipeline.stages.length) return;

    const newStages = [...currentPipeline.stages];
    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    // renumber
    newStages.forEach((s, idx) => { s.order = idx + 1; });

    setPipelines(prev => prev.map(p => p.id === currentPipeline.id ? { ...p, stages: newStages } : p));
    notify(`Stage sequence updated for ${currentPipeline.name}.`);
  };

  const handleDeleteStage = (stageId: string) => {
    const newStages = currentPipeline.stages.filter(s => s.id !== stageId);
    newStages.forEach((s, idx) => { s.order = idx + 1; });
    setPipelines(prev => prev.map(p => p.id === currentPipeline.id ? { ...p, stages: newStages } : p));
    notify('Stage removed from pipeline.');
  };

  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName) return;

    const newStage: StageItem = {
      id: `stg-${Date.now().toString().slice(-4)}`,
      name: stageName,
      order: currentPipeline.stages.length + 1,
      probability: Number(stageProb),
      forecastCategory: stageCategory,
      stalledDays: Number(stageStalled),
      stageGate: stageGate || 'Standard Review Required'
    };

    const newStages = [...currentPipeline.stages, newStage];
    setPipelines(prev => prev.map(p => p.id === currentPipeline.id ? { ...p, stages: newStages } : p));
    setShowAddStageModal(false);
    setStageName('');
    setStageGate('');
    notify(`Stage "${newStage.name}" added to ${currentPipeline.name}.`);
    addAudit?.('Pipeline Configuration', `Added stage ${newStage.name} to ${currentPipeline.name}`, 'Sales Ops');
  };

  const handleCreatePipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipeName) return;

    const newPipe: PipelineItem = {
      id: `pipe-${Date.now().toString().slice(-4)}`,
      name: newPipeName,
      code: newPipeName.toUpperCase().replace(/\s+/g, '-').slice(0, 8),
      description: newPipeDesc || 'Custom commercial pipeline.',
      isDefault: false,
      stages: [
        { id: `stg-init-1`, name: 'Lead Qualified', order: 1, probability: 20, forecastCategory: 'Pipeline', stalledDays: 14, stageGate: 'Initial BANT Form' },
        { id: `stg-init-2`, name: 'Commercial Proposal', order: 2, probability: 60, forecastCategory: 'Best Case', stalledDays: 14, stageGate: 'Quote Generated' },
        { id: `stg-init-3`, name: 'Deal Won', order: 3, probability: 100, forecastCategory: 'Closed', stalledDays: 0, stageGate: 'Contract Signed' }
      ]
    };

    setPipelines(prev => [...prev, newPipe]);
    setActivePipelineId(newPipe.id);
    setShowAddPipelineModal(false);
    setNewPipeName('');
    setNewPipeDesc('');
    notify(`Pipeline "${newPipe.name}" initialized.`);
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
        eyebrow="ADMINISTRATION / PIPELINES & STAGES"
        title="Pipelines & Sales Stages Studio"
        subtitle="Define commercial pipelines, win probabilities, stage progression gates, and automated delivery handovers."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddStageModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Add Stage</span>
            </button>
            <button
              onClick={() => setShowAddPipelineModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Kanban className="w-4 h-4" />
              <span>+ New Pipeline</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Configured Pipelines</span>
            <Kanban className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{pipelines.length} Active</div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-cycle revenue streams</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Active Pipeline Stages</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{currentPipeline.stages.length} Milestones</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Under {currentPipeline.code}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Average Cycle Velocity</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">38 Days</div>
          <div className="text-[11px] text-slate-500 mt-1">Opportunity create to won</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Stage Gate Enforcement</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">100% Mandatory</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Prevents unverified skips</div>
        </div>
      </div>

      {/* Pipeline Selector Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Pipeline:</span>
          <div className="flex flex-wrap gap-2">
            {pipelines.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePipelineId(p.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activePipelineId === p.id
                    ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {p.name} {p.isDefault && <span className="text-[10px] opacity-80">(Default)</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Code: <span className="font-mono text-cyan-400 font-semibold">{currentPipeline.code}</span>
        </div>
      </div>

      {/* Stages List & Visual Progression */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{currentPipeline.name}</span>
              <span className="text-xs font-normal text-slate-400">· Stage Progression Chain</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{currentPipeline.description}</p>
          </div>

          <button
            onClick={() => setShowAddStageModal(true)}
            className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Step</span>
          </button>
        </div>

        {/* Stages Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4">Stage Name</th>
                <th className="py-3 px-3 text-center">Probability</th>
                <th className="py-3 px-3">Forecast Category</th>
                <th className="py-3 px-3">Stalled Threshold</th>
                <th className="py-3 px-4">Required Stage Gate</th>
                <th className="py-3 px-3 text-right">Order & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {currentPipeline.stages.map((stg, idx) => (
                <tr key={stg.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                    {stg.order}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-white">{stg.name}</span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                      {stg.probability}%
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      stg.forecastCategory === 'Closed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : stg.forecastCategory === 'Commit'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                        : stg.forecastCategory === 'Best Case'
                        ? 'bg-purple-950 text-purple-400 border border-purple-800/50'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}>
                      {stg.forecastCategory}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-300">
                    {stg.stalledDays > 0 ? (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400">
                        <Clock className="w-3 h-3" />
                        Alert if &gt; {stg.stalledDays} days
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Terminal State</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-300 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{stg.stageGate}</span>
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveStage(idx, 'up')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded border border-slate-700 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={idx === currentPipeline.stages.length - 1}
                        onClick={() => handleMoveStage(idx, 'down')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded border border-slate-700 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteStage(stg.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded border border-slate-700 transition-colors"
                        title="Delete Stage"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Probability Weighting Simulator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>Interactive Win Probability & Weighted Forecast Simulator</span>
        </div>
        <p className="text-xs text-slate-400">
          Slide deal value to inspect how probability weighting across configured stages drives ARR forecast reporting.
        </p>

        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Simulated Deal Value:</span>
            <span className="text-cyan-400 font-mono font-bold text-base">
              ${simAmount.toLocaleString()} USD
            </span>
          </div>

          <input
            type="range"
            min={10000}
            max={1000000}
            step={10000}
            value={simAmount}
            onChange={e => setSimAmount(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
            {currentPipeline.stages.map(stg => {
              const weighted = Math.round((simAmount * stg.probability) / 100);
              return (
                <div key={stg.id} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-center">
                  <div className="text-[10px] text-slate-400 truncate">{stg.name}</div>
                  <div className="text-xs font-bold text-white mt-1">{stg.probability}%</div>
                  <div className="text-xs font-bold text-cyan-400 font-mono mt-0.5">
                    ${weighted.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ADD STAGE MODAL */}
      {showAddStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Add Stage to {currentPipeline.name}</span>
            </div>

            <form onSubmit={handleCreateStage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Stage Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Sponsor Signoff"
                  value={stageName}
                  onChange={e => setStageName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Probability (0-100%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={stageProb}
                    onChange={e => setStageProb(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Forecast Category</label>
                  <select
                    value={stageCategory}
                    onChange={e => setStageCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Pipeline">Pipeline</option>
                    <option value="Best Case">Best Case</option>
                    <option value="Commit">Commit</option>
                    <option value="Closed">Closed</option>
                    <option value="Omitted">Omitted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Stalled Alert (Days)</label>
                  <input
                    type="number"
                    min={0}
                    value={stageStalled}
                    onChange={e => setStageStalled(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Required Stage Gate</label>
                  <input
                    type="text"
                    placeholder="e.g. Formal NDA Signed"
                    value={stageGate}
                    onChange={e => setStageGate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStageModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Add Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PIPELINE MODAL */}
      {showAddPipelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Kanban className="w-5 h-5 text-cyan-400" />
              <span>Create New Commercial Pipeline</span>
            </div>

            <form onSubmit={handleCreatePipeline} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Pipeline Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Government & Municipal Cloud"
                  value={newPipeName}
                  onChange={e => setNewPipeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Cycle characteristics, target buyers..."
                  value={newPipeDesc}
                  onChange={e => setNewPipeDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddPipelineModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Initialize Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
