import { useState, useMemo } from 'react';
import {
  BookOpen, Search, Filter, Plus, CheckCircle2, Clock, ThumbsUp,
  ThumbsDown, ChevronRight, X, Copy, ExternalLink, ShieldAlert,
  Terminal, FileText, Check, Download, Bookmark, Sparkles, User
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';

export interface SOPArticle {
  id: string;
  ref: string;
  title: string;
  category: 'Network & VPN' | 'Fiber & Field Ops' | 'ERP & VAT Billing' | 'Security & IAM' | 'Sales & CPQ';
  author: string;
  authorRole: string;
  lastUpdated: string;
  readTime: string;
  helpfulCount: number;
  notHelpfulCount: number;
  userVoted?: 'up' | 'down';
  tags: string[];
  summary: string;
  sections: { heading: string; body: string; codeSnippet?: string; callout?: { type: 'note' | 'warning' | 'tip'; text: string } }[];
}

const INITIAL_SOP_ARTICLES: SOPArticle[] = [
  {
    id: 'sop-1',
    ref: 'SOP-OPS-001',
    title: 'WireGuard & IPSec VPN Gateway Field Troubleshooting SOP',
    category: 'Network & VPN',
    author: 'David Sterling',
    authorRole: 'Lead Infrastructure & Security Engineer',
    lastUpdated: 'Nov 18, 2026',
    readTime: '4 min read',
    helpfulCount: 42,
    notHelpfulCount: 1,
    tags: ['VPN', 'WireGuard', 'IPSec', 'Field Techs', 'Firewall NAT'],
    summary: 'Standard operating procedure for resolving field technician handshake timeouts when connecting Panasonic Toughbooks and iPads to internal BluePeak subnets.',
    sections: [
      {
        heading: '1. Initial Triage & Handshake Validation',
        body: 'When field technicians report "Handshake Failed" or timeouts on subnet 10.240.8.0/24, verify if the edge gateway has clamped the MTU size or if cellular APN carrier CGNAT is dropping UDP packets on port 51820.',
        codeSnippet: `# Check current interface handshake on edge gateway\nsudo wg show wg0\n\n# Ping internal gateway with clamped MTU\nping -s 1380 -c 4 10.240.8.1`,
        callout: {
          type: 'warning',
          text: 'Never increase MTU above 1420 on mobile LTE/5G SIMs as carrier packet fragmentation causes silent cryptographic handshake discards.'
        }
      },
      {
        heading: '2. Applying MTU Clamp Configuration',
        body: 'Edit client configuration profile on the field device or push MDM update:',
        codeSnippet: `[Interface]\nPrivateKey = <CLIENT_PRIVATE_KEY>\nAddress = 10.240.8.42/24\nDNS = 10.240.0.10\nMTU = 1380\n\n[Peer]\nPublicKey = 9x7Ab...example=\nEndpoint = vpn.bluepeak.internal:51820\nAllowedIPs = 10.240.0.0/16\nPersistentKeepalive = 25`
      },
      {
        heading: '3. Escalation Contact',
        body: 'If handshake still fails after MTU adjustment, escalate immediately to David Sterling (ext. 4330) or Network Ops bridge.'
      }
    ]
  },
  {
    id: 'sop-2',
    ref: 'SOP-FBR-004',
    title: 'OTDR Span Loss Testing & Fusion Splice Verification Protocol',
    category: 'Fiber & Field Ops',
    author: 'Marcus Vance',
    authorRole: 'Lead Field Fiber Splicing Specialist',
    lastUpdated: 'Nov 14, 2026',
    readTime: '6 min read',
    helpfulCount: 58,
    notHelpfulCount: 0,
    tags: ['OTDR', 'Fujikura 90S+', 'Fiber Optic', 'Single-Mode OS2', 'dB Loss'],
    summary: 'Carrier-grade protocol for testing optical link loss on 96-core single-mode armored trunk cables across Jamaican highway corridors.',
    sections: [
      {
        heading: '1. Safety and Equipment Cleanliness',
        body: 'Inspect all ferrule ends with 400x fiber scope before mating. Clean using lint-free optical wipes and 99.8% anhydrous isopropyl alcohol. Never clean dry.'
      },
      {
        heading: '2. Fusion Splicer Arc Calibration',
        body: 'Execute Arc Calibration on the Fujikura 90S+ whenever ambient temperature changes by >5°C or humidity exceeds 85%:',
        codeSnippet: `1. Power on Fujikura 90S+\n2. Insert test fiber sample (125um cladding)\n3. Select: [Menu] -> [Maintenance] -> [Arc Calibration]\n4. Ensure splice loss estimation is <= 0.02 dB per joint`,
        callout: {
          type: 'tip',
          text: 'BluePeak carrier contracts require bidirectional OTDR averaging. Individual fusion joint loss must not exceed 0.05 dB.'
        }
      },
      {
        heading: '3. EXFO OTDR Parameter Settings',
        body: 'Set pulse width to 10ns for links under 2km, or 50ns for links between 2km and 20km. Wavelengths required: 1310nm and 1550nm.'
      }
    ]
  },
  {
    id: 'sop-3',
    ref: 'SOP-FIN-012',
    title: 'Enterprise VAT/GCT Exemption Certificate Verification in Radium ERP',
    category: 'ERP & VAT Billing',
    author: 'Kavita Patel',
    authorRole: 'Senior Financial Controller & Billing Lead',
    lastUpdated: 'Nov 19, 2026',
    readTime: '5 min read',
    helpfulCount: 37,
    notHelpfulCount: 2,
    tags: ['Radium ERP', 'VAT Exemption', 'Tax Compliance', 'Stripe Billing', 'GCT'],
    summary: 'Procedure for auditing, uploading, and validating Ministry of Finance GCT/VAT exemption certificates for educational and government enterprise clients.',
    sections: [
      {
        heading: '1. Certificate Ingestion Criteria',
        body: 'Verify that the Taxpayer Registration Number (TRN) matches the official customer account master. The exemption letter must carry a valid fiscal year date stamp from Tax Administration Jamaica (TAJ).'
      },
      {
        heading: '2. Updating Radium ERP Tax Schedule',
        body: 'Navigate to Radium ERP Financials -> Tax Management -> Customer Exemption Ledger. Enter the certified certificate ID, expiration date, and toggle Zero-Rated GCT Schedule.',
        codeSnippet: `PUT /api/v1/erp/customers/{cust_id}/tax-profile\n{\n  "tax_schedule": "ZERO_RATED_GCT",\n  "exemption_cert_id": "TAJ-EX-2026-90412",\n  "valid_until": "2027-03-31",\n  "verified_by": "kavita.patel@bluepeak.internal"\n}`,
        callout: {
          type: 'warning',
          text: 'Invoices generated prior to certificate entry cannot be backdated. A credit note must be approved by the Finance Controller.'
        }
      }
    ]
  },
  {
    id: 'sop-4',
    ref: 'SOP-SEC-009',
    title: 'Employee Offboarding & IAM Access Revocation Runbook',
    category: 'Security & IAM',
    author: 'David Sterling',
    authorRole: 'Lead Infrastructure & Security Engineer',
    lastUpdated: 'Nov 02, 2026',
    readTime: '3 min read',
    helpfulCount: 65,
    notHelpfulCount: 1,
    tags: ['IAM', 'Security', 'Offboarding', 'Okta', 'YubiKey', 'SOC2'],
    summary: 'Strict SOC2 Type II compliant sequence for disabling Okta SSO, API tokens, VPN certificates, and collecting company hardware.',
    sections: [
      {
        heading: '1. Phase 1: Immediate Identity Revocation (T-0)',
        body: 'Within 15 minutes of offboarding notification, lock the user in Okta directory to invalidate all active OAuth2 refresh tokens across Google Workspace, Slack, and SYVORIS CRM.',
        codeSnippet: `# Okta CLI user suspension\nokta users suspend <user_id> --reason "HR Offboarding Notice"\n\n# Revoke active PostgreSQL RLS tokens\ncurl -X POST https://api.bluepeak.internal/v1/auth/revoke-all -d "userId=<user_id>"`
      },
      {
        heading: '2. Phase 2: Hardware Asset Handover',
        body: 'Collect assigned laptop, YubiKey hardware tokens, and facility RFID badges. Log return in IT Asset Ledger.'
      }
    ]
  },
  {
    id: 'sop-5',
    ref: 'SOP-SAL-003',
    title: 'Autonomous AI Deal Guardrails & Margin Floor Override SOP',
    category: 'Sales & CPQ',
    author: 'Arjun Mehta',
    authorRole: 'Senior Account Executive & Enterprise Lead',
    lastUpdated: 'Nov 12, 2026',
    readTime: '4 min read',
    helpfulCount: 49,
    notHelpfulCount: 3,
    tags: ['CPQ', 'Discounting', 'Margin Floor', 'AI Guardrails', 'Deal Approvals'],
    summary: 'Guidelines for requesting margin floor discount exceptions when competing for multi-year enterprise fiber and SaaS connectivity contracts.',
    sections: [
      {
        heading: '1. Discount Authorization Thresholds',
        body: 'Sales reps may discount up to 10% autonomously. Discounts between 10.1% and 18% require VP Commercial sign-off. Any discount exceeding 18% triggers CFO and CEO executive review.'
      },
      {
        heading: '2. Submitting Deal Exception in SYVORIS CPQ',
        body: 'In the Quote Management view, click "Request Margin Override". Provide competitor pricing evidence, contract term (minimum 24 months), and expected gross profit margin.',
        callout: {
          type: 'note',
          text: 'AI Agent "Apex-DealGuard" evaluates win-rate probability against historical carrier contracts and returns an advisory score within 30 seconds.'
        }
      }
    ]
  },
  {
    id: 'sop-6',
    ref: 'SOP-ENG-018',
    title: 'FastAPI Backend & PostgreSQL Core Local Debugging Protocol',
    category: 'Network & VPN',
    author: 'Dr. Evelyn Reed',
    authorRole: 'Director of AI Architecture & Systems',
    lastUpdated: 'Nov 17, 2026',
    readTime: '5 min read',
    helpfulCount: 51,
    notHelpfulCount: 0,
    tags: ['FastAPI', 'PostgreSQL', 'Uvicorn', 'RLS', 'Debugging', 'Python'],
    summary: 'Engineering runbook for spinning up, inspecting, and hot-reloading the SYVORIS AI backend services and verifying multi-tenant RLS policies.',
    sections: [
      {
        heading: '1. Virtualenv & Python Runtime Activation',
        body: 'Ensure Python 3.11+ is activated within the `backend/venv` directory with all dependencies satisfied.',
        codeSnippet: `cd d:\\syvoris-ai\\backend\n.\\venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`
      },
      {
        heading: '2. Verifying PostgreSQL Health & Migrations',
        body: 'Test database connectivity and check if tenant RLS policies are actively enforced:',
        codeSnippet: `curl http://127.0.0.1:8000/health\n# Expected: {"status":"healthy","database":"connected","tenants_active":1}`
      }
    ]
  }
];

export function InternalFAQView() {
  const [articles, setArticles] = useState<SOPArticle[]>(INITIAL_SOP_ARTICLES);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [readingArticle, setReadingArticle] = useState<SOPArticle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // New SOP form state
  const [newSOP, setNewSOP] = useState({
    title: '',
    category: 'Network & VPN' as SOPArticle['category'],
    author: 'Arjun Mehta',
    authorRole: 'Senior Account Executive',
    readTime: '4 min read',
    tags: '',
    summary: '',
    steps: ''
  });

  const categories = ['All', 'Network & VPN', 'Fiber & Field Ops', 'ERP & VAT Billing', 'Security & IAM', 'Sales & CPQ'];

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const filtered = useMemo(() => {
    return articles.filter(art => {
      const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.author.toLowerCase().includes(q) ||
        art.tags.some(t => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [articles, selectedCategory, search]);

  const kpis = useMemo(() => {
    const total = articles.length;
    const domains = new Set(articles.map(a => a.category)).size;
    const totalVotes = articles.reduce((acc, a) => acc + a.helpfulCount + a.notHelpfulCount, 0);
    const totalUp = articles.reduce((acc, a) => acc + a.helpfulCount, 0);
    const helpfulness = totalVotes > 0 ? ((totalUp / totalVotes) * 100).toFixed(1) : '100.0';
    return { total, domains, helpfulness };
  }, [articles]);

  const handleVote = (id: string, type: 'up' | 'down') => {
    setArticles(prev => prev.map(a => {
      if (a.id !== id) return a;
      if (a.userVoted === type) return a; // already voted
      const hadUp = a.userVoted === 'up';
      const hadDown = a.userVoted === 'down';
      return {
        ...a,
        helpfulCount: type === 'up' ? a.helpfulCount + 1 : hadUp ? a.helpfulCount - 1 : a.helpfulCount,
        notHelpfulCount: type === 'down' ? a.notHelpfulCount + 1 : hadDown ? a.notHelpfulCount - 1 : a.notHelpfulCount,
        userVoted: type
      };
    }));
    if (readingArticle && readingArticle.id === id) {
      setReadingArticle(prev => prev ? {
        ...prev,
        helpfulCount: type === 'up' ? prev.helpfulCount + 1 : prev.helpfulCount,
        notHelpfulCount: type === 'down' ? prev.notHelpfulCount + 1 : prev.notHelpfulCount,
        userVoted: type
      } : null);
    }
    notify(`Thank you! Your feedback has been recorded.`);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    notify('Command copied to clipboard.');
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCreateSOP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSOP.title.trim() || !newSOP.summary.trim() || !newSOP.steps.trim()) {
      notify('Please complete title, summary, and procedure.');
      return;
    }
    const created: SOPArticle = {
      id: `sop-${Date.now()}`,
      ref: `SOP-USR-0${Math.floor(10 + Math.random() * 90)}`,
      title: newSOP.title,
      category: newSOP.category,
      author: newSOP.author,
      authorRole: newSOP.authorRole,
      lastUpdated: 'Just now',
      readTime: newSOP.readTime || '3 min read',
      helpfulCount: 1,
      notHelpfulCount: 0,
      tags: newSOP.tags ? newSOP.tags.split(',').map(t => t.trim()) : ['SOP', 'Runbook'],
      summary: newSOP.summary,
      sections: [
        {
          heading: '1. Standard Procedure & Execution',
          body: newSOP.steps
        }
      ]
    };
    setArticles(prev => [created, ...prev]);
    setShowAddModal(false);
    setNewSOP({
      title: '',
      category: 'Network & VPN',
      author: 'Arjun Mehta',
      authorRole: 'Senior Account Executive',
      readTime: '4 min read',
      tags: '',
      summary: '',
      steps: ''
    });
    notify(`SOP "${created.title}" published to internal knowledge base.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="SERVICE DESK & KNOWLEDGE / INTERNAL FAQ & SOPS"
        title="Internal Operational Runbooks & SOPs"
        subtitle="Verified engineering runbooks, field procedures, compliance protocols, and technical troubleshooting guides."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const text = articles.map(a => `# ${a.title} (${a.ref})\nCategory: ${a.category}\nAuthor: ${a.author} (${a.lastUpdated})\n\n${a.summary}\n\n---\n`).join('\n');
                const blob = new Blob([text], { type: 'text/markdown' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `BluePeak_Internal_SOP_Runbooks_${new Date().toISOString().slice(0, 10)}.md`;
                a.click();
                notify('Exported runbooks index to Markdown.');
              }}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download size={14} />
              <span>Export Runbooks</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/30"
            >
              <Plus size={14} />
              <span>Publish New SOP</span>
            </button>
          </div>
        }
      />

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Published Runbooks</span>
            <BookOpen size={16} className="text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{kpis.total} Articles</div>
            <div className="text-[11px] text-slate-400 mt-1">Certified operational SOPs</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Knowledge Domains</span>
            <Filter size={16} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-300">{kpis.domains} Domains</div>
            <div className="text-[11px] text-slate-400 mt-1">Cross-discipline coverage</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Helpfulness Rating</span>
            <ThumbsUp size={16} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{kpis.helpfulness}%</div>
            <div className="text-[11px] text-slate-400 mt-1">Verified positive feedback</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Average Read Time</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-300">4.5 Min</div>
            <div className="text-[11px] text-slate-400 mt-1">Concise executive SOP format</div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3.5 border border-slate-800/80 rounded-2xl backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === c
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40 font-semibold'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search runbooks, tags, SOP reference, author..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* ARTICLES LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(art => (
          <div
            key={art.id}
            onClick={() => setReadingArticle(art)}
            className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-lg hover:shadow-black/20"
          >
            <div>
              {/* Category pill & Ref */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800/90 text-cyan-400 border border-slate-700/60">
                  {art.ref}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/80">
                    {art.category}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock size={11} />
                    {art.readTime}
                  </span>
                </div>
              </div>

              {/* Title & Summary */}
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 mt-1">
                {art.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                {art.summary}
              </p>

              {/* Tags */}
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {art.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-800/70 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer row */}
            <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-300">
                  {art.author.charAt(0)}
                </div>
                <span className="truncate max-w-[140px] text-slate-300">{art.author}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{art.lastUpdated}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <ThumbsUp size={12} />
                  <span>{art.helpfulCount}</span>
                </div>
                <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight size={15} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <BookOpen size={32} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-300">No operational runbooks match your search</p>
          <p className="text-xs text-slate-500 mt-1">Try searching for "VPN", "OTDR", "VAT", "IAM", or "FastAPI".</p>
        </div>
      )}

      {/* ARTICLE READER MODAL */}
      {readingArticle && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setReadingArticle(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setReadingArticle(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="border-b border-slate-800 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
                  {readingArticle.ref}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  {readingArticle.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                  <Clock size={12} />
                  {readingArticle.readTime}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white leading-snug mt-1">
                {readingArticle.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                <span className="text-slate-300 font-medium">By {readingArticle.author}</span>
                <span className="text-slate-600">({readingArticle.authorRole})</span>
                <span className="text-slate-600">·</span>
                <span>Updated {readingArticle.lastUpdated}</span>
              </div>
            </div>

            {/* Summary callout */}
            <div className="my-5 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
              <strong className="text-blue-400 font-semibold block mb-1">Operational Purpose & Scope:</strong>
              {readingArticle.summary}
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {readingArticle.sections.map((sec, idx) => (
                <div key={idx} className="space-y-2.5">
                  <h4 className="text-sm font-bold text-white border-b border-slate-800/80 pb-1">
                    {sec.heading}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{sec.body}</p>

                  {sec.callout && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        sec.callout.type === 'warning'
                          ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                          : sec.callout.type === 'tip'
                          ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                          : 'bg-blue-950/30 border-blue-800/60 text-blue-200'
                      }`}
                    >
                      <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                      <div>{sec.callout.text}</div>
                    </div>
                  )}

                  {sec.codeSnippet && (
                    <div className="relative group/code mt-2">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-pre">
                        {sec.codeSnippet}
                      </div>
                      <button
                        onClick={() => handleCopy(sec.codeSnippet!)}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
                        title="Copy code snippet"
                      >
                        {copiedSnippet ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Helpfulness feedback strip */}
            <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Was this SOP runbook helpful?</span>
                <button
                  onClick={() => handleVote(readingArticle.id, 'up')}
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                    readingArticle.userVoted === 'up'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <ThumbsUp size={13} />
                  <span>Yes ({readingArticle.helpfulCount})</span>
                </button>
                <button
                  onClick={() => handleVote(readingArticle.id, 'down')}
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                    readingArticle.userVoted === 'down'
                      ? 'bg-rose-950/60 border-rose-700 text-rose-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <ThumbsDown size={13} />
                  <span>No ({readingArticle.notHelpfulCount})</span>
                </button>
              </div>

              <button
                onClick={() => setReadingArticle(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH NEW SOP MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 text-slate-200 relative animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="mb-5">
              <h3 className="text-base font-bold text-white">Publish Operational SOP Runbook</h3>
              <p className="text-xs text-slate-400">Contribute verified technical procedures to BluePeak internal knowledge repository.</p>
            </div>
            <form onSubmit={handleCreateSOP} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">SOP Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OSPF Cost Metric Calibration on Nokia 7750"
                  value={newSOP.title}
                  onChange={e => setNewSOP({ ...newSOP, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Domain Category *</label>
                  <select
                    value={newSOP.category}
                    onChange={e => setNewSOP({ ...newSOP, category: e.target.value as SOPArticle['category'] })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Network & VPN">Network & VPN</option>
                    <option value="Fiber & Field Ops">Fiber & Field Ops</option>
                    <option value="ERP & VAT Billing">ERP & VAT Billing</option>
                    <option value="Security & IAM">Security & IAM</option>
                    <option value="Sales & CPQ">Sales & CPQ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Est. Read Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 min read"
                    value={newSOP.readTime}
                    onChange={e => setNewSOP({ ...newSOP, readTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Nokia, OSPF, Routing, Carrier, Tier-3"
                  value={newSOP.tags}
                  onChange={e => setNewSOP({ ...newSOP, tags: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Operational Purpose & Scope *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summarize the intent and prerequisite requirements for executing this SOP..."
                  value={newSOP.summary}
                  onChange={e => setNewSOP({ ...newSOP, summary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Step-by-Step Procedure & CLI Commands *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Detail exact commands, parameters, and verification tests..."
                  value={newSOP.steps}
                  onChange={e => setNewSOP({ ...newSOP, steps: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Publish SOP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
