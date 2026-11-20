import { useState } from 'react';
import {
  Bot, Sparkles, Cpu, ShieldCheck, Zap, Key,
  CheckCircle2, RefreshCw, Sliders, Database, Eye,
  Lock, AlertTriangle, Plus, Server, Activity, Save
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';

export interface AIModelItem {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Private On-Prem (Self-Hosted)';
  roleType: 'Primary Copilot' | 'Document & Legal Specialist' | 'Long-Context Memory' | 'Zero-Egress Sovereign';
  contextWindow: string;
  maxOutput: string;
  temperature: number;
  avgLatency: string;
  fallbackModel: string;
  apiKeyMasked: string;
  endpointUrl?: string;
  status: 'Active' | 'Standby';
  zeroEgress: boolean;
}

const INITIAL_MODELS: AIModelItem[] = [
  {
    id: 'mdl-1',
    name: 'OpenAI GPT-4o Enterprise',
    provider: 'OpenAI',
    roleType: 'Primary Copilot',
    contextWindow: '128,000 tokens',
    maxOutput: '4,096 tokens',
    temperature: 0.2,
    avgLatency: '380 ms',
    fallbackModel: 'Anthropic Claude 3.5 Sonnet',
    apiKeyMasked: 'sk-proj-•••••••••••••88f',
    status: 'Active',
    zeroEgress: false
  },
  {
    id: 'mdl-2',
    name: 'Anthropic Claude 3.5 Sonnet',
    provider: 'Anthropic',
    roleType: 'Document & Legal Specialist',
    contextWindow: '200,000 tokens',
    maxOutput: '8,192 tokens',
    temperature: 0.1,
    avgLatency: '420 ms',
    fallbackModel: 'Google Gemini 1.5 Pro',
    apiKeyMasked: 'sk-ant-•••••••••••••91c',
    status: 'Active',
    zeroEgress: false
  },
  {
    id: 'mdl-3',
    name: 'Google Gemini 1.5 Pro (Multimodal 1M)',
    provider: 'Google',
    roleType: 'Long-Context Memory',
    contextWindow: '1,000,000 tokens',
    maxOutput: '8,192 tokens',
    temperature: 0.4,
    avgLatency: '460 ms',
    fallbackModel: 'OpenAI GPT-4o Enterprise',
    apiKeyMasked: 'AIzaSy•••••••••••••43v',
    status: 'Active',
    zeroEgress: false
  },
  {
    id: 'mdl-4',
    name: 'Private On-Prem Meta Llama 3 70B Enclave',
    provider: 'Private On-Prem (Self-Hosted)',
    roleType: 'Zero-Egress Sovereign',
    contextWindow: '64,000 tokens',
    maxOutput: '4,096 tokens',
    temperature: 0.1,
    avgLatency: '290 ms',
    fallbackModel: 'Local Enclave Standby',
    apiKeyMasked: 'tls-cert-bluepeak-internal-v1',
    endpointUrl: 'https://ai-enclave.bluepeak.internal:8443/v1',
    status: 'Active',
    zeroEgress: true
  }
];

export function AIModelConfigView() {
  const { addAudit } = useCRM();
  const [models, setModels] = useState<AIModelItem[]>(INITIAL_MODELS);
  const [selectedModelId, setSelectedModelId] = useState<string>('mdl-1');
  const [benchmarking, setBenchmarking] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Model Form
  const [modelName, setModelName] = useState('');
  const [provider, setProvider] = useState<'OpenAI' | 'Anthropic' | 'Google' | 'Private On-Prem (Self-Hosted)'>('OpenAI');
  const [contextWin, setContextWin] = useState('128,000 tokens');
  const [temp, setTemp] = useState(0.2);
  const [zeroEgress, setZeroEgress] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  const handleToggleStatus = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === 'Active' ? 'Standby' : 'Active';
        return { ...m, status: nextStatus };
      }
      return m;
    }));
    notify('Model gateway routing status updated.');
  };

  const handleBenchmark = () => {
    setBenchmarking(true);
    setTimeout(() => {
      setBenchmarking(false);
      notify(`Ping benchmark complete. Primary gateway latency verified at 384ms.`);
      addAudit?.('AI Model Gateway', `Benchmarked latency across all 4 registered model providers`, 'AI Ops');
    }, 850);
  };

  const handleSaveParameters = () => {
    notify(`Model parameters for "${selectedModel.name}" updated in LLM routing gateway.`);
    addAudit?.('AI Model Config', `Adjusted temperature to ${selectedModel.temperature} for ${selectedModel.name}`, 'AI Ops');
  };

  const handleTempChange = (newTemp: number) => {
    setModels(prev => prev.map(m => m.id === selectedModel.id ? { ...m, temperature: newTemp } : m));
  };

  const handleCreateModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName) return;

    const newMdl: AIModelItem = {
      id: `mdl-${Date.now().toString().slice(-4)}`,
      name: modelName,
      provider: provider,
      roleType: zeroEgress ? 'Zero-Egress Sovereign' : 'Primary Copilot',
      contextWindow: contextWin,
      maxOutput: '4,096 tokens',
      temperature: temp,
      avgLatency: '350 ms',
      fallbackModel: 'OpenAI GPT-4o Enterprise',
      apiKeyMasked: 'sk-custom-•••••••••••••01x',
      status: 'Active',
      zeroEgress: zeroEgress
    };

    setModels(prev => [...prev, newMdl]);
    setSelectedModelId(newMdl.id);
    setShowAddModal(false);
    setModelName('');
    notify(`Model gateway "${newMdl.name}" registered and connected.`);
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
        eyebrow="ADMINISTRATION / AI MODEL CONFIGURATION"
        title="AI Model Gateway & Routing Configuration"
        subtitle="Manage multi-model provider connections, private zero-egress enclaves, inference temperature, and automatic fallback cascades."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleBenchmark}
              disabled={benchmarking}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${benchmarking ? 'animate-spin' : ''}`} />
              <span>Benchmark Gateway Latency</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register Model Gateway</span>
            </button>
          </div>
        }
      />

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Configured Providers</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{models.length} Gateways</div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-LLM arbitration</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Average Inference Latency</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">384 ms</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Prompt-to-first-token</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Context Window Ceiling</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">1,000,000 Tokens</div>
          <div className="text-[11px] text-slate-500 mt-1">Full relationship graph memory</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Air-Gapped Sovereign Mode</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">Zero-Egress Active</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Private on-prem PII enclave</div>
        </div>
      </div>

      {/* Main Grid: Models List + Parameters Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Models List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Registered LLM Gateways & Endpoints
          </div>

          <div className="space-y-2">
            {models.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedModelId(m.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedModelId === m.id
                    ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Cpu className={`w-4 h-4 ${selectedModelId === m.id ? 'text-cyan-400' : 'text-slate-400'}`} />
                      {m.name}
                    </h4>
                    <div className="text-[11px] text-slate-400 mt-1">{m.provider}</div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    m.status === 'Active'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                      : 'bg-slate-950 text-slate-500 border border-slate-800'
                  }`}>
                    {m.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[10px]">
                  <span className="font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {m.contextWindow}
                  </span>
                  <span className="text-slate-400">Latency: <strong className="text-slate-200">{m.avgLatency}</strong></span>
                  {m.zeroEgress && (
                    <span className="bg-purple-950 text-purple-300 border border-purple-800/50 px-1.5 py-0.5 rounded">
                      Zero-Egress
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Parameters & Gateway Settings (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{selectedModel.name}</h3>
                {selectedModel.zeroEgress && (
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded font-mono">
                    Air-Gapped Sovereign
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Role: <strong className="text-cyan-400">{selectedModel.roleType}</strong></p>
            </div>

            <button
              onClick={handleSaveParameters}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Model Policy</span>
            </button>
          </div>

          {/* Model Config Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[11px] block">Context Window Capacity</span>
                <span className="text-white font-mono font-bold text-sm mt-1 block">{selectedModel.contextWindow}</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[11px] block">Max Output Generation</span>
                <span className="text-white font-mono font-bold text-sm mt-1 block">{selectedModel.maxOutput}</span>
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Sampling Temperature:</span>
                <span className="text-cyan-400 font-mono font-bold">{selectedModel.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedModel.temperature}
                onChange={e => handleTempChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.0 (Strict Factual / Legal Analysis)</span>
                <span>1.0 (Creative Prospecting)</span>
              </div>
            </div>

            {/* Fallback Cascading Route */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                Automatic Fallback Cascade
              </span>
              <div className="text-xs text-slate-200 flex items-center gap-2">
                <span>In the event of rate-limiting or outage, reroute requests to:</span>
                <strong className="text-cyan-400">{selectedModel.fallbackModel}</strong>
              </div>
            </div>

            {/* API Key or Endpoint */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                Credential Authentication Reference
              </span>
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>{selectedModel.apiKeyMasked}</span>
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-emerald-400 px-2 py-0.5 rounded">
                  Active in Secret Vault
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handleToggleStatus(selectedModel.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  selectedModel.status === 'Active'
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                }`}
              >
                {selectedModel.status === 'Active' ? 'Pause / Set Standby' : 'Promote to Active'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REGISTER MODEL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="text-white font-semibold text-base flex items-center gap-2 pb-3 border-b border-slate-800">
              <Bot className="w-5 h-5 text-cyan-400" />
              <span>Register New AI Model Gateway</span>
            </div>

            <form onSubmit={handleCreateModel} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Model Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenAI o1 Reasoning Preview"
                  value={modelName}
                  onChange={e => setModelName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={e => setProvider(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="OpenAI">OpenAI Enterprise</option>
                  <option value="Anthropic">Anthropic Claude</option>
                  <option value="Google">Google Gemini</option>
                  <option value="Private On-Prem (Self-Hosted)">Private On-Prem (Self-Hosted)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Context Window</label>
                <input
                  type="text"
                  value={contextWin}
                  onChange={e => setContextWin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="zeroEgressToggle"
                  checked={zeroEgress}
                  onChange={e => setZeroEgress(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <label htmlFor="zeroEgressToggle" className="text-xs text-slate-300 font-medium">
                  Air-Gapped Private Mode (Zero customer data egress)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg"
                >
                  Register Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
