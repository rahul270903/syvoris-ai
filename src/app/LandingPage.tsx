import React, { useState, useEffect, useRef, useMemo } from 'react';
import EnterpriseTelemetryBackground from '../components/EnterpriseTelemetryBackground';
import BlurText from '../components/BlurText';
import SpotlightCard from '../components/SpotlightCard';
import {
  ArrowRight, Check, ChevronDown, ChevronRight, X, Mail, Phone,
  Building2, Users, BarChart3, Shield, Layers, Calendar, Search,
  CheckCircle2, Sparkles, Filter, Briefcase, Clock, FileText,
  Activity, ArrowUpRight, Lock, ExternalLink, Globe, Menu, Play,
  Pause, RotateCcw, TrendingUp, Target, DollarSign, CheckCheck, Zap
} from 'lucide-react';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onLaunchDemo: () => void;
}

export function LandingPage({ onNavigateLogin, onNavigateRegister, onLaunchDemo }: LandingPageProps) {
  // Navigation states
  const [activeDropdown, setActiveDropdown] = useState<'product' | 'solutions' | 'resources' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Hero interactive state
  const [activeHeroTab, setActiveHeroTab] = useState<'account360' | 'pipeline' | 'activity' | 'revenue'>('account360');
  const [selectedHeroAccount, setSelectedHeroAccount] = useState<number>(0);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Section 2: Interactive Bento Feature Discovery state
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number>(0);

  // Section 3: Interactive Customer 360 Showcase state
  const [activeC360Tab, setActiveC360Tab] = useState<'overview' | 'contacts' | 'deals' | 'timeline' | 'health'>('overview');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'meetings' | 'proposals' | 'contracts'>('all');

  // Section 4: Storytelling Workflow state
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);
  const [isAutoPlayingWorkflow, setIsAutoPlayingWorkflow] = useState<boolean>(false);

  // Section 5: Motion-Enabled Sales Pipeline Simulator state
  const [pipelineDealStage, setPipelineDealStage] = useState<number>(2); // 0: Lead, 1: Qualified, 2: Opportunity, 3: Proposal, 4: Won

  // Demo form state
  const [demoForm, setDemoForm] = useState({
    fullName: '',
    workEmail: '',
    company: '',
    role: 'Executive / Decision Maker',
    teamSize: '51-200 employees',
    primaryInterest: 'Full Platform Overview',
    notes: ''
  });

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
  };

  // Parallax tracking for Hero floating ecosystem
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setParallaxOffset({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
  };

  // Auto-playing workflow sequence
  useEffect(() => {
    if (!isAutoPlayingWorkflow) return;
    const interval = setInterval(() => {
      setActiveWorkflowStep((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlayingWorkflow]);

  // Hero account options
  const heroAccounts = useMemo(() => [
    {
      name: 'Nexus Global Technologies',
      industry: 'Enterprise Cloud Infrastructure',
      tier: 'Tier 1 Enterprise',
      status: 'Active Client',
      arr: '$480,000',
      growth: '+14.8%',
      contactName: 'Sarah Chen',
      contactRole: 'VP of Engineering & Architecture',
      contactEmail: 'schen@nexusglobal.example',
      dealName: 'Q4 Capacity Expansion',
      dealValue: '$185,000',
      dealStage: 'Proposal Phase',
      dealProb: '75%',
      expectedClose: 'Dec 15, 2026',
      recentNote: 'Quarterly review logged with positive architectural feedback'
    },
    {
      name: 'Apex Global Networks',
      industry: 'High-Density Telecom & Edge',
      tier: 'Tier 1 Strategic',
      status: 'Active Client',
      arr: '$310,000',
      growth: '+22.4%',
      contactName: 'Marcus Vance',
      contactRole: 'Director of Global Infrastructure',
      contactEmail: 'mvance@apexglobal.example',
      dealName: 'Optical Edge Deployment',
      dealValue: '$120,000',
      dealStage: 'Technical Discovery',
      dealProb: '60%',
      expectedClose: 'Jan 20, 2027',
      recentNote: 'Proof of concept benchmark validated with 99.999% SLA'
    },
    {
      name: 'Stratis Media Group',
      industry: 'Digital Streaming & Content Distribution',
      tier: 'Enterprise Key Account',
      status: 'Contract Expansion',
      arr: '$540,000',
      growth: '+18.1%',
      contactName: 'Elena Rostova',
      contactRole: 'Chief Technology Officer',
      contactEmail: 'erostova@stratismedia.example',
      dealName: 'Global Transcoding Cluster',
      dealValue: '$320,000',
      dealStage: 'Negotiation',
      dealProb: '90%',
      expectedClose: 'Dec 28, 2026',
      recentNote: 'Executive security addendum signed; commercial review final'
    }
  ], []);

  const currentHeroAccount = heroAccounts[selectedHeroAccount];

  // 5-Stage Storytelling Workflow steps
  const workflowSteps = useMemo(() => [
    {
      num: '01',
      title: 'Capture',
      tagline: 'Inbound Ingestion & Deduplication',
      desc: 'Bring customer and lead information into one workspace from web, email, and partner channels without duplicate records.',
      detail: 'Centralize contact and lead ingestion with automatic source tracking and real-time validation.',
      mockup: {
        badge: 'Stage 01: Capture',
        title: 'New Enterprise Lead Captured',
        source: 'Web Inbound Form · Organic Search',
        fields: [
          { label: 'Company', val: 'Nexus Global Technologies' },
          { label: 'Primary Lead', val: 'Sarah Chen (VP Eng)' },
          { label: 'Enrichment Score', val: '94/100 (Verified Enterprise)' },
          { label: 'Deduplication', val: 'Zero collision confirmed' }
        ]
      }
    },
    {
      num: '02',
      title: 'Understand',
      tagline: 'Customer 360 & Relationship Graph',
      desc: 'Build context through customer profiles, relationship hierarchies, and complete interaction histories.',
      detail: 'View stakeholder maps, organizational relationships, and historical engagement at a glance.',
      mockup: {
        badge: 'Stage 02: Understand',
        title: 'Customer 360 Graph Assembled',
        source: 'Automated Account Intelligence',
        fields: [
          { label: 'Account Tier', val: 'Tier 1 Strategic' },
          { label: 'Key Stakeholders', val: '3 Executive Contacts Mapped' },
          { label: 'Commercial ARR', val: '$480,000 Existing Base' },
          { label: 'Relationship Health', val: '96 / 100 High Affinity' }
        ]
      }
    },
    {
      num: '03',
      title: 'Engage',
      tagline: 'Activity Cadence & Collaborative Hub',
      desc: 'Manage conversations, team activities, and timely follow-ups with shared visibility across your sales teams.',
      detail: 'Coordinate meetings, log direct communications, and assign follow-ups with team accountability.',
      mockup: {
        badge: 'Stage 03: Engage',
        title: 'Multi-Channel Cadence Active',
        source: 'Team Collaboration Hub',
        fields: [
          { label: 'Meeting Logged', val: 'Roadmap Architecture Review (45m)' },
          { label: 'Next Action', val: 'Deliver Custom CPQ Quote #Q-2026' },
          { label: 'Assigned Owner', val: 'Enterprise AE Lead' },
          { label: 'SLA Status', val: 'On track · 0 overdue items' }
        ]
      }
    },
    {
      num: '04',
      title: 'Convert',
      tagline: 'Visual Pipeline & Revenue Closure',
      desc: 'Move qualified opportunities through structured pipeline stages with clear probability and revenue visibility.',
      detail: 'Track deal stages, proposal milestones, and expected close dates with transparent commercial terms.',
      mockup: {
        badge: 'Stage 04: Convert',
        title: 'Opportunity Advanced to Proposal',
        source: 'Commercial Pipeline Engine',
        fields: [
          { label: 'Active Deal', val: 'Q4 Capacity Expansion' },
          { label: 'Deal Value', val: '$185,000 ARR' },
          { label: 'Stage Probability', val: '75% Weighted ($138,750)' },
          { label: 'Target Close', val: 'December 15, 2026' }
        ]
      }
    },
    {
      num: '05',
      title: 'Grow',
      tagline: 'Account Expansion & Long-Term Retention',
      desc: 'Strengthen customer relationships, monitor satisfaction, and identify future expansion opportunities.',
      detail: 'Drive ongoing retention, account reviews, and long-term customer partnerships.',
      mockup: {
        badge: 'Stage 05: Grow',
        title: 'Retention & Account Expansion Vector',
        source: 'Customer Success & Account Growth',
        fields: [
          { label: 'Lifetime Value', val: '$1,420,000 Total Realized' },
          { label: 'Next QBR', val: 'Scheduled in 75 days' },
          { label: 'Identified Add-on', val: '$60,000 Security Module' },
          { label: 'Renewal Probability', val: '98% Confirmed' }
        ]
      }
    }
  ], []);

  // Pipeline simulator stages
  const pipelineStages = useMemo(() => [
    { name: 'Lead', prob: 20, badgeColor: 'bg-white/[0.05] text-slate-300 border-white/10' },
    { name: 'Qualified', prob: 40, badgeColor: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30' },
    { name: 'Opportunity', prob: 60, badgeColor: 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40' },
    { name: 'Proposal', prob: 80, badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { name: 'Won', prob: 100, badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  ], []);

  const simulatedDealAmount = 240000;
  const currentStage = pipelineStages[pipelineDealStage];
  const weightedPipelineValue = (simulatedDealAmount * currentStage.prob) / 100;

  return (
    <div className="min-h-screen bg-[#06070A] text-[#F8FAFC] font-sans selection:bg-[#38BDF8]/30 selection:text-[#F8FAFC] relative overflow-x-hidden">
      {/* KEYFRAME & REDUCED-MOTION STYLES */}
      <style>{`
        @keyframes float-subtle-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-subtle-2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(6px); }
        }
        @keyframes float-subtle-3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .anim-float-1 { animation: float-subtle-1 5s ease-in-out infinite; }
        .anim-float-2 { animation: float-subtle-2 6s ease-in-out infinite 0.75s; }
        .anim-float-3 { animation: float-subtle-3 5.5s ease-in-out infinite 1.5s; }

        @media (prefers-reduced-motion: reduce) {
          .anim-float-1, .anim-float-2, .anim-float-3 {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* =========================================================================
          1. FLOATING PILL NAVBAR
          Architectural Glass: dark capsule (rounded-full), frosted glass backdrop blur,
          hairline 1px border, brand logo, dropdown items, "Log in" and prominent cyan button.
          ========================================================================= */}
      <header className="sticky top-3 sm:top-5 z-50 w-full px-3 sm:px-6 flex justify-center pointer-events-none">
        <div className="pointer-events-auto max-w-5xl w-full bg-[#0D1017]/90 backdrop-blur-xl border border-white/[0.08] rounded-full px-4 sm:px-6 py-2.5 shadow-2xl shadow-black/60 flex items-center justify-between transition-all hover:border-white/20">
          {/* Left: Brand Logo & Title */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            aria-label="SYVORIS Ai Home"
          >
            <div className="w-7 h-7 rounded-full bg-[#38BDF8] flex items-center justify-center p-1 shadow-sm group-hover:scale-105 transition-transform">
              <img
                src="/assets/syvoris-mark-transparent.svg"
                alt="SYVORIS Ai"
                className="w-4 h-4 object-contain brightness-0"
              />
            </div>
            <span className="font-extrabold text-[15px] sm:text-base tracking-tight text-[#F8FAFC] font-display">
              syvoris<span className="text-[#38BDF8]">.ai</span>
            </span>
          </div>

          {/* Centre: Desktop Links with Dropdowns */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-[13px] font-medium text-slate-300">
            {/* Product Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('product')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                className="flex items-center gap-1 hover:text-white transition py-1 cursor-pointer focus-visible:outline-none focus-visible:text-white"
                aria-expanded={activeDropdown === 'product'}
              >
                <span>Product</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${activeDropdown === 'product' ? 'rotate-180 text-white' : ''}`} />
              </button>

              {activeDropdown === 'product' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 z-50">
                  <div className="bg-[#0D1017] border border-white/[0.08] rounded-2xl p-2 shadow-2xl backdrop-blur-2xl text-xs space-y-1">
                    <a
                      href="#customer-360"
                      className="block p-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition"
                    >
                      <div className="font-semibold text-[#F8FAFC]">Customer 360</div>
                      <div className="text-[11px] text-slate-400">Unified accounts and contact graphs</div>
                    </a>
                    <a
                      href="#sales-workflow"
                      className="block p-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition"
                    >
                      <div className="font-semibold text-[#F8FAFC]">Sales Pipeline</div>
                      <div className="text-[11px] text-slate-400">Visual Kanban and deal forecasting</div>
                    </a>
                    <a
                      href="#platform"
                      className="block p-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition"
                    >
                      <div className="font-semibold text-[#F8FAFC]">Activity Hub</div>
                      <div className="text-[11px] text-slate-400">Chronological client touchpoints</div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('solutions')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                className="flex items-center gap-1 hover:text-white transition py-1 cursor-pointer focus-visible:outline-none focus-visible:text-white"
                aria-expanded={activeDropdown === 'solutions'}
              >
                <span>Solutions</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${activeDropdown === 'solutions' ? 'rotate-180 text-white' : ''}`} />
              </button>

              {activeDropdown === 'solutions' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 z-50">
                  <div className="bg-[#0D1017] border border-white/[0.08] rounded-2xl p-2 shadow-2xl backdrop-blur-2xl text-xs space-y-1">
                    <a
                      href="#platform"
                      className="block p-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition"
                    >
                      <div className="font-semibold text-[#F8FAFC]">Enterprise Sales</div>
                      <div className="text-[11px] text-slate-400">Multi-tier account relationships</div>
                    </a>
                    <a
                      href="#sales-workflow"
                      className="block p-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition"
                    >
                      <div className="font-semibold text-[#F8FAFC]">Revenue Operations</div>
                      <div className="text-[11px] text-slate-400">Clear lifecycle and probability</div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('resources')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                className="flex items-center gap-1 hover:text-white transition py-1 cursor-pointer focus-visible:outline-none focus-visible:text-white"
                aria-expanded={activeDropdown === 'resources'}
              >
                <span>Resources</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${activeDropdown === 'resources' ? 'rotate-180 text-white' : ''}`} />
              </button>

              {activeDropdown === 'resources' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 z-50">
                  <div className="bg-[#0D1017] border border-white/[0.08] rounded-2xl p-2 shadow-2xl backdrop-blur-2xl text-xs space-y-1">
                    <a
                      href="#governance"
                      className="block p-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition"
                    >
                      <div className="font-semibold text-[#F8FAFC]">Platform Governance</div>
                      <div className="text-[11px] text-slate-400">Multi-tenancy & access control</div>
                    </a>
                    <button
                      type="button"
                      onClick={onLaunchDemo}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition"
                    >
                      <div className="font-semibold text-[#38BDF8]">Interactive Sandbox</div>
                      <div className="text-[11px] text-slate-400">Live test-drive workspace</div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <a href="#customer-360" className="hover:text-white transition py-1 focus-visible:outline-none focus-visible:text-white">Customer 360</a>
            <a href="#sales-workflow" className="hover:text-white transition py-1 focus-visible:outline-none focus-visible:text-white">Workflow</a>
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="hover:text-white transition py-1 cursor-pointer focus-visible:outline-none focus-visible:text-white"
            >
              Demo
            </button>
          </nav>

          {/* Right: Actions ('Log in' and pill 'Start free') */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={onNavigateLogin}
              className="text-xs sm:text-[13px] font-medium text-slate-300 hover:text-white px-2 sm:px-3 py-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded-lg"
            >
              Log in
            </button>

            <button
              onClick={() => setShowDemoModal(true)}
              className="bg-[#38BDF8] hover:bg-[#7dd3fc] text-[#06070A] font-bold text-xs sm:text-[13px] px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg shadow-[#38BDF8]/20 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              Start free
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Attached to pill) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-16 left-4 right-4 z-50 bg-[#0D1017] border border-white/[0.08] rounded-3xl p-5 shadow-2xl backdrop-blur-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-200">
            <a
              href="#platform"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-white/[0.06] transition"
            >
              Platform
            </a>
            <a
              href="#customer-360"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-white/[0.06] transition"
            >
              Customer 360
            </a>
            <a
              href="#sales-workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-white/[0.06] transition"
            >
              Sales Workflow
            </a>
            <a
              href="#sales-pipeline-simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-white/[0.06] transition"
            >
              Pipeline & Operations
            </a>
            <a
              href="#governance"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-white/[0.06] transition"
            >
              Governance
            </a>
          </nav>
          <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateLogin();
              }}
              className="w-full text-center py-2.5 text-xs font-semibold text-white rounded-xl border border-white/10 hover:bg-white/[0.06] transition"
            >
              Log in
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowDemoModal(true);
              }}
              className="w-full text-center py-2.5 text-xs font-bold text-[#06070A] bg-[#38BDF8] hover:bg-[#7dd3fc] rounded-full shadow-lg shadow-[#38BDF8]/20 transition"
            >
              Start free
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. HERO — CINEMATIC EDITORIAL HERO WITH AURORA & BLURTEXT
          Centred display typography, uppercase monospace eyebrow label,
          restrained React Bits Aurora background, and layered telemetry frame.
          ========================================================================= */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-36 border-b border-white/[0.08]"
      >
        {/* Enterprise CRM SaaS Telemetry & Connected Node Network Background */}
        <EnterpriseTelemetryBackground />

        {/* Ambient radial lighting accents */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[380px] bg-gradient-to-b from-[#38BDF8]/10 via-[#1769D2]/5 to-transparent blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-[400px] h-[300px] bg-gradient-to-tr from-[#38BDF8]/5 to-transparent blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Copy, Value Proposition & CTAs */}
            <div className="lg:col-span-5 space-y-6">
              {/* Monospace Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#38BDF8] text-xs font-mono tracking-[0.2em] uppercase shadow-2xs backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                <span>Enterprise CRM · Sales · Marketing</span>
              </div>

              {/* Main Headline with React Bits BlurText */}
              <BlurText
                text="Every customer relationship. Every opportunity. One intelligent workspace."
                delay={35}
                animateBy="words"
                direction="top"
                className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-[#F8FAFC] tracking-[-0.03em] leading-[1.12] font-display"
              />

              {/* Supporting Description */}
              <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-xl">
                Bring your customer relationships, sales operations and marketing activities together in one connected platform. Give your team the clarity and tools to engage customers, manage opportunities and grow your business.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <button
                  onClick={onLaunchDemo}
                  className="px-6 py-3.5 bg-[#38BDF8] hover:bg-[#7dd3fc] text-[#06070A] font-bold text-sm rounded-xl shadow-lg shadow-[#38BDF8]/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                >
                  <span>Explore the Platform</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setShowDemoModal(true)}
                  className="px-6 py-3.5 bg-white/[0.05] hover:bg-white/[0.1] text-[#F8FAFC] font-semibold text-sm rounded-xl border border-white/10 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 backdrop-blur-md"
                >
                  Request a Demo
                </button>
              </div>

              {/* Account Quick Switcher for Interactive Discovery */}
              <div className="pt-4 border-t border-white/[0.08]">
                <span className="text-[11px] font-mono tracking-[0.2em] text-[#38BDF8] uppercase block mb-2">
                  00 // Interactive Account Discovery
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {heroAccounts.map((acc, idx) => (
                    <button
                      key={acc.name}
                      onClick={() => setSelectedHeroAccount(idx)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        selectedHeroAccount === idx
                          ? 'bg-[#38BDF8] text-[#06070A] border-[#38BDF8] font-bold shadow-md shadow-[#38BDF8]/20'
                          : 'bg-[#0D1017] text-slate-300 border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      {acc.name.split(' ')[0]}
                    </button>
                  ))}
                  <span className="text-[11px] text-slate-500 pl-1">(Click to switch preview data)</span>
                </div>
              </div>

              {/* Brand Microcopy & Pillars */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 tracking-wide">
                <span className="text-[#F8FAFC] font-bold">ENGAGE · CONVERT · GROW</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span>Multi-Tenant Architecture</span>
              </div>
            </div>

            {/* Right Column: Layered Floating CRM Ecosystem */}
            <div className="lg:col-span-7 relative">
              {/* FLOATING CARD 1: Top-Left Revenue Velocity */}
              <div
                style={{
                  transform: `translate3d(${parallaxOffset.x * -10}px, ${parallaxOffset.y * -8}px, 0)`
                }}
                className="hidden sm:flex absolute -top-8 -left-6 z-20 anim-float-1 bg-[#0D1017]/95 backdrop-blur-md border border-white/[0.08] rounded-2xl p-3.5 shadow-2xl shadow-black/60 items-center gap-3.5 hover:border-[#38BDF8]/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center font-bold shrink-0 border border-[#38BDF8]/20">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Enterprise ARR</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                      {currentHeroAccount.growth}
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-[#F8FAFC]">
                    {currentHeroAccount.arr}
                  </div>
                </div>
              </div>

              {/* FLOATING CARD 2: Top-Right Key Stakeholder Roster */}
              <div
                style={{
                  transform: `translate3d(${parallaxOffset.x * 12}px, ${parallaxOffset.y * -10}px, 0)`
                }}
                className="hidden md:flex absolute -top-6 -right-6 z-20 anim-float-2 bg-[#0D1017]/95 backdrop-blur-md border border-white/[0.08] rounded-2xl p-3.5 shadow-2xl shadow-black/60 items-center gap-3 hover:border-[#38BDF8]/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#06070A] to-[#103B70] text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center font-bold text-xs">
                    {currentHeroAccount.contactName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0D1017] absolute bottom-0 right-0" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#F8FAFC]">
                    {currentHeroAccount.contactName}
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">
                    {currentHeroAccount.contactRole}
                  </div>
                  <div className="text-[10px] text-[#38BDF8] font-semibold flex items-center gap-1 mt-0.5">
                    <Mail size={10} />
                    <span>{currentHeroAccount.contactEmail}</span>
                  </div>
                </div>
              </div>

              {/* CENTRAL DASHBOARD PREVIEW CONTAINER */}
              <div className="relative z-10 bg-[#0D1017] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden transition-all duration-300">
                {/* Product Preview Topbar */}
                <div className="bg-[#06070A] text-white px-4 py-3 flex items-center justify-between border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 pl-2 border-l border-white/10 font-mono">
                      SYVORIS Ai Workspace · Enterprise Command
                    </span>
                  </div>

                  {/* Switcher Tabs */}
                  <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg text-[11px] font-semibold border border-white/[0.06]">
                    <button
                      onClick={() => setActiveHeroTab('account360')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeHeroTab === 'account360'
                          ? 'bg-[#38BDF8] text-[#06070A] font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Customer 360
                    </button>
                    <button
                      onClick={() => setActiveHeroTab('pipeline')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeHeroTab === 'pipeline'
                          ? 'bg-[#38BDF8] text-[#06070A] font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pipeline
                    </button>
                    <button
                      onClick={() => setActiveHeroTab('activity')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeHeroTab === 'activity'
                          ? 'bg-[#38BDF8] text-[#06070A] font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Activities
                    </button>
                    <button
                      onClick={() => setActiveHeroTab('revenue')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeHeroTab === 'revenue'
                          ? 'bg-[#38BDF8] text-[#06070A] font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Intelligence
                    </button>
                  </div>
                </div>

                {/* Interactive Preview Body */}
                <div className="p-5 bg-[#0D1017] min-h-[300px]">
                  {/* TAB 1: CUSTOMER 360 VIEW */}
                  {activeHeroTab === 'account360' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Account Summary Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-[#F8FAFC]">{currentHeroAccount.name}</h3>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-semibold">
                              {currentHeroAccount.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-0.5">
                            {currentHeroAccount.industry} · {currentHeroAccount.tier}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block font-mono">ACCOUNT ARR</span>
                          <span className="text-base font-extrabold text-[#38BDF8]">{currentHeroAccount.arr}</span>
                        </div>
                      </div>

                      {/* Contact & Deal Relationship Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Primary Contact */}
                        <div className="p-3 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-1.5 hover:border-white/20 transition">
                          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase block">
                            Key Stakeholder
                          </span>
                          <div className="font-bold text-[#F8FAFC]">{currentHeroAccount.contactName}</div>
                          <div className="text-[#94A3B8] text-[11px]">{currentHeroAccount.contactRole}</div>
                          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#38BDF8]">
                            <Mail size={12} />
                            <span>{currentHeroAccount.contactEmail}</span>
                          </div>
                        </div>

                        {/* Current Opportunity */}
                        <div className="p-3 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-1.5 hover:border-white/20 transition">
                          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase block">
                            Active Opportunity
                          </span>
                          <div className="font-bold text-[#F8FAFC]">{currentHeroAccount.dealName}</div>
                          <div className="text-emerald-400 font-semibold">{currentHeroAccount.dealValue} · {currentHeroAccount.dealStage}</div>
                          <div className="pt-1 text-[11px] text-[#94A3B8]">
                            Expected Close: {currentHeroAccount.expectedClose} ({currentHeroAccount.dealProb} prob)
                          </div>
                        </div>
                      </div>

                      {/* Relationship Health & Touchpoints */}
                      <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-[#38BDF8] shrink-0" />
                          <span className="font-medium text-[#F8FAFC]">{currentHeroAccount.recentNote}</span>
                        </div>
                        <span className="text-[11px] font-mono text-[#38BDF8] shrink-0">Updated</span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SALES PIPELINE VIEW */}
                  {activeHeroTab === 'pipeline' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] text-xs">
                        <span className="font-bold text-[#F8FAFC]">Active Pipeline ($2.48M Total Value)</span>
                        <span className="text-slate-400">24 Deals in Progress · Q4 Velocity</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {/* Stage 1 */}
                        <div className="p-2.5 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#F8FAFC]">Qualified</span>
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-semibold text-slate-300">8</span>
                          </div>
                          <div className="p-2 bg-[#0D1017] border border-white/[0.08] rounded-lg space-y-1">
                            <div className="font-semibold text-[11px] text-[#F8FAFC]">AeroGrid Systems</div>
                            <div className="text-emerald-400 font-bold text-[11px]">$95,000</div>
                          </div>
                        </div>

                        {/* Stage 2 */}
                        <div className="p-2.5 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#38BDF8]">Proposal</span>
                            <span className="text-[10px] bg-[#38BDF8]/10 text-[#38BDF8] px-1.5 py-0.5 rounded font-semibold">5</span>
                          </div>
                          <div className="p-2 bg-[#0D1017] border border-white/[0.08] rounded-lg space-y-1">
                            <div className="font-semibold text-[11px] text-[#F8FAFC]">{currentHeroAccount.name}</div>
                            <div className="text-emerald-400 font-bold text-[11px]">{currentHeroAccount.dealValue}</div>
                          </div>
                        </div>

                        {/* Stage 3 */}
                        <div className="p-2.5 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400">Negotiation</span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">4</span>
                          </div>
                          <div className="p-2 bg-[#0D1017] border border-white/[0.08] rounded-lg space-y-1">
                            <div className="font-semibold text-[11px] text-[#F8FAFC]">Stratis Media</div>
                            <div className="text-emerald-400 font-bold text-[11px]">$320,000</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>Average deal cycle: <b className="text-white">38 Days</b></span>
                        <a href="#sales-pipeline-simulator" className="text-[#38BDF8] font-semibold hover:underline">
                          Test Interactive Pipeline →
                        </a>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ACTIVITIES & ENGAGEMENT */}
                  {activeHeroTab === 'activity' && (
                    <div className="space-y-3 animate-in fade-in duration-200 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="font-bold text-[#F8FAFC]">Recent Customer Activities</span>
                        <span className="text-[11px] text-[#38BDF8] font-mono">REAL-TIME TOUCHPOINTS</span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="p-2.5 bg-[#06070A]/80 border border-white/[0.08] rounded-xl flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center shrink-0 mt-0.5">
                            <Calendar size={13} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-[#F8FAFC]">Enterprise Architecture Sync with {currentHeroAccount.name}</div>
                            <div className="text-[#94A3B8] text-[11px]">Completed by Account Lead · 45m duration</div>
                          </div>
                          <span className="text-[10px] text-slate-500">Today</span>
                        </div>

                        <div className="p-2.5 bg-[#06070A]/80 border border-white/[0.08] rounded-xl flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText size={13} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-[#F8FAFC]">Commercial Proposal Sent: {currentHeroAccount.dealName}</div>
                            <div className="text-[#94A3B8] text-[11px]">Quote delivered for {currentHeroAccount.dealValue}</div>
                          </div>
                          <span className="text-[10px] text-slate-500">Yesterday</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: REVENUE INTELLIGENCE VIEW */}
                  {activeHeroTab === 'revenue' && (
                    <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="font-bold text-[#F8FAFC]">Commercial Intelligence Overview</span>
                        <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Net Retention: 118%</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-[#06070A]/80 border border-white/[0.08] rounded-xl">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Total Revenue</span>
                          <span className="text-base font-extrabold text-[#F8FAFC] block mt-1">$2.48M</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">+5.2% vs target</span>
                        </div>
                        <div className="p-3 bg-[#06070A]/80 border border-white/[0.08] rounded-xl">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Gross Margin</span>
                          <span className="text-base font-extrabold text-[#38BDF8] block mt-1">69.4%</span>
                          <span className="text-[10px] text-slate-500">Operational baseline</span>
                        </div>
                        <div className="p-3 bg-[#06070A]/80 border border-white/[0.08] rounded-xl">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Win Rate</span>
                          <span className="text-base font-extrabold text-emerald-400 block mt-1">68.4%</span>
                          <span className="text-[10px] text-slate-500">Proposal to close</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl flex items-center justify-between">
                        <span className="text-[11px] text-slate-300 font-medium">90-Day Projected Revenue Runway</span>
                        <span className="text-xs font-extrabold text-[#38BDF8]">+$482,000 (Healthy)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Preview Bottom Bar */}
                <div className="bg-[#06070A] px-5 py-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-medium text-slate-200 font-mono">Live Operational Workspace</span>
                  </div>
                  <button
                    onClick={onLaunchDemo}
                    className="font-bold text-[#38BDF8] hover:text-[#7dd3fc] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Launch Interactive Demo</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* FLOATING CARD 3: Bottom-Left Active Opportunity Badge */}
              <div
                style={{
                  transform: `translate3d(${parallaxOffset.x * -8}px, ${parallaxOffset.y * 10}px, 0)`
                }}
                className="hidden sm:flex absolute -bottom-7 -left-6 z-20 anim-float-3 bg-[#0D1017]/95 backdrop-blur-md border border-white/[0.08] rounded-2xl p-3.5 shadow-2xl shadow-black/60 items-center gap-3.5 hover:border-[#38BDF8]/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center font-bold shrink-0 border border-[#38BDF8]/20">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                    {currentHeroAccount.dealName}
                  </div>
                  <div className="text-xs font-bold text-[#F8FAFC]">
                    {currentHeroAccount.dealValue} · <span className="text-emerald-400">{currentHeroAccount.dealStage}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Close: {currentHeroAccount.expectedClose}
                  </div>
                </div>
              </div>

              {/* FLOATING CARD 4: Bottom-Right Live Activity Feed */}
              <div
                style={{
                  transform: `translate3d(${parallaxOffset.x * 10}px, ${parallaxOffset.y * 8}px, 0)`
                }}
                className="hidden md:flex absolute -bottom-8 -right-6 z-20 anim-float-1 bg-[#0D1017]/95 backdrop-blur-md border border-white/[0.08] rounded-2xl p-3 shadow-2xl shadow-black/60 items-center gap-2.5 hover:border-[#38BDF8]/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#F8FAFC] block">Executive Briefing Logged</span>
                  <span className="text-[10px] text-slate-400">Positive account feedback confirmed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. BENTO CAPABILITY ARCHITECTURE
          Asymmetric 12-column Bento Grid: 7-col + 5-col top row, 4-col + 4-col + 4-col bottom row.
          Integrated React Bits SpotlightCard hover effect with dark editorial precision.
          ========================================================================= */}
      <section id="platform" className="py-24 lg:py-32 bg-[#06070A] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono tracking-[0.2em] text-[#38BDF8] uppercase block">
              01 // PLATFORM ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-[-0.03em] font-display">
              One connected platform for your business.
            </h2>
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed">
              Manage customer relationships, sales activities and business engagement through an integrated, unified workspace.
            </p>
          </div>

          {/* 12-Column Asymmetric Bento Grid */}
          <div className="grid grid-cols-12 gap-6 mb-12">
            {/* Bento Card 1: 7-col (CRM & Customer 360) */}
            <div className="col-span-12 lg:col-span-7">
              <SpotlightCard
                spotlightColor="rgba(56, 189, 248, 0.15)"
                theme="dark"
                className={`h-full p-7 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  activeFeatureIndex === 0
                    ? 'bg-[#0D1017] border-[#38BDF8] ring-1 ring-[#38BDF8]/40 shadow-xl'
                    : 'bg-[#0D1017] border-white/[0.08] hover:border-white/20'
                }`}
                onClick={() => setActiveFeatureIndex(0)}
                role="button"
                tabIndex={0}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20">
                      <Users size={22} />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-[#38BDF8] uppercase bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2.5 py-1 rounded-full">
                      CORE // C360
                    </span>
                  </div>
                  <h3 className="font-bold text-xl text-[#F8FAFC]">CRM & Customer 360</h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed mt-1.5">
                    Manage accounts, contacts, leads and customer relationships in one organized environment.
                  </p>

                  {/* Micro-diagram preview inside Bento */}
                  <div className="mt-5 p-4 rounded-xl bg-[#06070A]/80 border border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">Nexus Global Technologies</span>
                      <span className="text-emerald-400 font-mono text-[11px]">$480,000 ARR</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-slate-500 block text-[10px]">Decision Maker</span>
                        <span className="text-slate-200 font-medium">Sarah Chen (VP)</span>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-slate-500 block text-[10px]">Renewal Target</span>
                        <span className="text-emerald-400 font-medium">98% Retention</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-white/[0.08] text-[11px] font-bold text-[#38BDF8] flex items-center gap-1.5">
                  <span>Explore Customer 360</span>
                  <ChevronRight size={13} />
                </div>
              </SpotlightCard>
            </div>

            {/* Bento Card 2: 5-col (Sales Management) */}
            <div className="col-span-12 lg:col-span-5">
              <SpotlightCard
                spotlightColor="rgba(56, 189, 248, 0.15)"
                theme="dark"
                className={`h-full p-7 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  activeFeatureIndex === 1
                    ? 'bg-[#0D1017] border-[#38BDF8] ring-1 ring-[#38BDF8]/40 shadow-xl'
                    : 'bg-[#0D1017] border-white/[0.08] hover:border-white/20'
                }`}
                onClick={() => setActiveFeatureIndex(1)}
                role="button"
                tabIndex={0}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20">
                      <BarChart3 size={22} />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-[#38BDF8] uppercase bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2.5 py-1 rounded-full">
                      VELOCITY // CPQ
                    </span>
                  </div>
                  <h3 className="font-bold text-xl text-[#F8FAFC]">Sales Management</h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed mt-1.5">
                    Organize opportunities, monitor sales pipelines and manage follow-ups throughout the cycle.
                  </p>

                  {/* Micro-diagram preview */}
                  <div className="mt-5 p-4 rounded-xl bg-[#06070A]/80 border border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Weighted Pipeline</span>
                      <span className="font-mono text-[#38BDF8] font-bold">$2.48M Value</span>
                    </div>
                    <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#1769D2] to-[#38BDF8] h-full w-[72%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>24 Active Deals</span>
                      <span>38-Day Cycle</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-white/[0.08] text-[11px] font-bold text-[#38BDF8] flex items-center gap-1.5">
                  <span>Explore Sales Engine</span>
                  <ChevronRight size={13} />
                </div>
              </SpotlightCard>
            </div>

            {/* Bento Card 3: 4-col (Marketing & Engagement) */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <SpotlightCard
                spotlightColor="rgba(56, 189, 248, 0.15)"
                theme="dark"
                className={`h-full p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  activeFeatureIndex === 2
                    ? 'bg-[#0D1017] border-[#38BDF8] ring-1 ring-[#38BDF8]/40 shadow-xl'
                    : 'bg-[#0D1017] border-white/[0.08] hover:border-white/20'
                }`}
                onClick={() => setActiveFeatureIndex(2)}
                role="button"
                tabIndex={0}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20 mb-3.5">
                    <Layers size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-[#F8FAFC]">Marketing & Engagement</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mt-1">
                    Support customer engagement and marketing activities through connected workflows.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.08] text-[11px] font-bold text-[#38BDF8] flex items-center gap-1">
                  <span>Explore Engagement</span>
                  <ChevronRight size={13} />
                </div>
              </SpotlightCard>
            </div>

            {/* Bento Card 4: 4-col (AI-Assisted Workflows) */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <SpotlightCard
                spotlightColor="rgba(56, 189, 248, 0.15)"
                theme="dark"
                className={`h-full p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  activeFeatureIndex === 3
                    ? 'bg-[#0D1017] border-[#38BDF8] ring-1 ring-[#38BDF8]/40 shadow-xl'
                    : 'bg-[#0D1017] border-white/[0.08] hover:border-white/20'
                }`}
                onClick={() => setActiveFeatureIndex(3)}
                role="button"
                tabIndex={0}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20 mb-3.5">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-[#F8FAFC]">AI-Assisted Workflows</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mt-1">
                    Introduce intelligent assistance, prioritization and anomaly alerts where supported.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.08] text-[11px] font-bold text-[#38BDF8] flex items-center gap-1">
                  <span>Explore Intelligence</span>
                  <ChevronRight size={13} />
                </div>
              </SpotlightCard>
            </div>

            {/* Bento Card 5: 4-col (Governance & Architecture Indicator) */}
            <div className="col-span-12 lg:col-span-4">
              <SpotlightCard
                spotlightColor="rgba(56, 189, 248, 0.15)"
                theme="dark"
                className="h-full p-6 rounded-2xl border border-white/[0.08] bg-[#0D1017] flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20 mb-3.5">
                    <Shield size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-[#F8FAFC]">Multi-Tenant Isolation</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mt-1">
                    Row-Level Security (RLS) enforcement ensures zero cross-tenant bleed for complete compliance.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.08] text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>RLS Enforced · 100% Isolated</span>
                </div>
              </SpotlightCard>
            </div>
          </div>

          {/* Synchronized Live Capability Preview Deck */}
          <div className="bg-[#0D1017] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300">
            {activeFeatureIndex === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-xs font-mono tracking-[0.2em] text-[#38BDF8] uppercase block">
                    FEATURE DEEP-DIVE
                  </span>
                  <h4 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">Complete Customer Context at Your Fingertips</h4>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    Eliminate fragmented silos. Every contact, email touchpoint, contract renewal, and account hierarchy is unified into a single interactive source of truth.
                  </p>
                  <ul className="space-y-2 text-xs font-medium text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#38BDF8]" />
                      <span>Stakeholder mapping with verified roles and decision authorities</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#38BDF8]" />
                      <span>Real-time account ARR and relationship health scores</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-7 bg-[#06070A]/80 border border-white/[0.08] rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs">
                    <span className="font-bold text-[#F8FAFC]">Customer Profile · Nexus Global Technologies</span>
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">Tier 1 Strategic</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#0D1017] border border-white/[0.08] rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Assigned Executive</span>
                      <span className="font-bold text-[#F8FAFC] block mt-1">Enterprise AE Lead</span>
                      <span className="text-[11px] text-slate-500">Direct account owner</span>
                    </div>
                    <div className="p-3 bg-[#0D1017] border border-white/[0.08] rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Contract Renewal</span>
                      <span className="font-bold text-[#F8FAFC] block mt-1">March 31, 2027</span>
                      <span className="text-[11px] text-emerald-400 font-semibold">98% renewal confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureIndex === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-xs font-mono tracking-[0.2em] text-[#38BDF8] uppercase block">
                    FEATURE DEEP-DIVE
                  </span>
                  <h4 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">Structured Pipeline Kanban & Revenue Forecasting</h4>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    Gain transparent visibility into every active opportunity. Filter by deal size, probability weighting, and anticipated close dates.
                  </p>
                  <ul className="space-y-2 text-xs font-medium text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#38BDF8]" />
                      <span>Custom stage milestones aligned with commercial SLAs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#38BDF8]" />
                      <span>Automated probability weighting and pipeline velocity calculations</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-7 bg-[#06070A]/80 border border-white/[0.08] rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs">
                    <span className="font-bold text-[#F8FAFC]">Pipeline Summary · 24 Deals Active</span>
                    <span className="text-[#38BDF8] font-mono font-semibold">$2,480,000 Pipeline Value</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-[#0D1017] border border-white/[0.08] rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#F8FAFC]">Q4 Capacity Expansion — $185,000</div>
                        <div className="text-[11px] text-slate-400">Nexus Global · Proposal Phase</div>
                      </div>
                      <span className="text-xs font-bold text-[#38BDF8] font-mono">75% Prob</span>
                    </div>
                    <div className="p-3 bg-[#0D1017] border border-white/[0.08] rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#F8FAFC]">Optical Edge Deployment — $120,000</div>
                        <div className="text-[11px] text-slate-400">Apex Global · Discovery Phase</div>
                      </div>
                      <span className="text-xs font-bold text-[#38BDF8] font-mono">60% Prob</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureIndex === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-xs font-mono tracking-[0.2em] text-[#38BDF8] uppercase block">
                    FEATURE DEEP-DIVE
                  </span>
                  <h4 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">Lead Ingestion, Routing & Attribution</h4>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    Connect marketing channels directly to commercial reps. Track attribution sources and eliminate orphaned leads with automated qualification.
                  </p>
                  <ul className="space-y-2 text-xs font-medium text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#38BDF8]" />
                      <span>Instant lead deduplication and company enrichment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#38BDF8]" />
                      <span>Clear multi-touch attribution reports across digital channels</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-7 bg-[#06070A]/80 border border-white/[0.08] rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs">
                    <span className="font-bold text-[#F8FAFC]">Recent Inbound Conversions</span>
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">100% Routed</span>
                  </div>
                  <div className="p-3 bg-[#0D1017] border border-white/[0.08] rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center font-bold">
                        <Globe size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-[#F8FAFC]">Inbound Enterprise RFQ Form</div>
                        <div className="text-[11px] text-slate-400">Assigned to Field Sales Team · 3m response time</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#38BDF8] font-mono">Enriched</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureIndex === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-xs font-mono tracking-[0.2em] text-[#38BDF8] uppercase block">
                    FEATURE DEEP-DIVE
                  </span>
                  <h4 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">AI-Assisted Workflow & Anomaly Detection</h4>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    Prioritize high-impact accounts. Receive automated alerts on stalled opportunities, schedule recommendations, and synthesized deal summaries.
                  </p>
                  <ul className="space-y-2 text-xs font-medium text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#38BDF8]" />
                      <span>Pipeline anomaly alerts preventing deal slippage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#38BDF8]" />
                      <span>Automated meeting summaries and next-step action generation</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-7 bg-[#06070A]/80 border border-white/[0.08] rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs">
                    <span className="font-bold text-[#F8FAFC]">Intelligent Action Queue</span>
                    <span className="text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2 py-0.5 rounded font-semibold">2 Recommended Actions</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Zap size={16} className="text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold text-[#F8FAFC]">Follow-up Due: Apex Global Proposal</div>
                        <div className="text-[11px] text-slate-400">No contact in 4 days · 80% win probability impact</div>
                      </div>
                    </div>
                    <button
                      onClick={onLaunchDemo}
                      className="text-xs font-bold text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      Execute →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. INTERACTIVE CUSTOMER 360 SHOWCASE
          Detailed, interactive multi-tab account context explorer with architectural glass container.
          ========================================================================= */}
      <section id="customer-360" className="py-24 lg:py-32 bg-[#06070A] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono tracking-[0.2em] text-[#38BDF8] uppercase block">
              02 // UNIFIED CONTEXT
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-[-0.03em] font-display">
              Know your customers. Understand every relationship.
            </h2>
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed">
              Gain deep visibility into every client organization, relationship stakeholder, past interaction, and upcoming commitment.
            </p>
          </div>

          {/* Interactive Customer 360 Showcase Container */}
          <div className="bg-[#0D1017] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
            {/* Top Overview Bar */}
            <div className="p-6 sm:p-8 bg-[#06070A] text-white flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#103B70] to-[#38BDF8] text-[#06070A] font-extrabold text-2xl flex items-center justify-center shadow-md">
                  NG
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-extrabold text-xl sm:text-2xl text-[#F8FAFC]">Nexus Global Technologies, Inc.</h3>
                    <span className="px-2.5 py-0.5 bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 rounded-full text-xs font-semibold">
                      Enterprise Strategic
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Global Cloud Telecommunications · 1,200 Employees · Primary Workspace: North America
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-mono">Account ARR</span>
                  <span className="text-xl font-extrabold text-[#38BDF8]">$480,000</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-mono">Relationship Health</span>
                  <span className="text-xl font-extrabold text-emerald-400">96 / 100</span>
                </div>
              </div>
            </div>

            {/* Interactive Tab Navigation */}
            <div className="px-6 sm:px-8 border-b border-white/[0.08] bg-[#0A0D14] flex items-center gap-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveC360Tab('overview')}
                className={`py-3.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeC360Tab === 'overview'
                    ? 'border-[#38BDF8] text-[#38BDF8]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveC360Tab('contacts')}
                className={`py-3.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeC360Tab === 'contacts'
                    ? 'border-[#38BDF8] text-[#38BDF8]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Contacts & Stakeholders (3)
              </button>
              <button
                onClick={() => setActiveC360Tab('deals')}
                className={`py-3.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeC360Tab === 'deals'
                    ? 'border-[#38BDF8] text-[#38BDF8]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Opportunities ($245,000)
              </button>
              <button
                onClick={() => setActiveC360Tab('timeline')}
                className={`py-3.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeC360Tab === 'timeline'
                    ? 'border-[#38BDF8] text-[#38BDF8]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Interaction Timeline
              </button>
              <button
                onClick={() => setActiveC360Tab('health')}
                className={`py-3.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeC360Tab === 'health'
                    ? 'border-[#38BDF8] text-[#38BDF8]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Account Health Index
              </button>
            </div>

            {/* Tabbed Content Body */}
            <div className="p-6 sm:p-8">
              {/* TAB 1: OVERVIEW */}
              {activeC360Tab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  <div className="p-5 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-3">
                    <span className="text-[11px] font-mono tracking-wider text-[#38BDF8] uppercase block">Commercial Summary</span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span className="text-slate-400">Commercial Tier:</span>
                        <span className="font-bold text-[#F8FAFC]">Tier 1 Strategic</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span className="text-slate-400">Contract Renewal:</span>
                        <span className="font-bold text-[#F8FAFC]">March 31, 2027</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Assigned Lead:</span>
                        <span className="font-bold text-[#38BDF8]">Arjun Mehta (Lead AE)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-3">
                    <span className="text-[11px] font-mono tracking-wider text-[#38BDF8] uppercase block">Key Decision Makers</span>
                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-[#F8FAFC]">Sarah Chen</div>
                      <div className="text-[11px] text-slate-400">VP of Engineering & Architecture</div>
                      <div className="pt-2 text-[11px] text-[#38BDF8] flex items-center gap-1.5">
                        <Mail size={12} />
                        <span>schen@nexusglobal.example</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-3">
                    <span className="text-[11px] font-mono tracking-wider text-[#38BDF8] uppercase block">Growth Vectors</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Expanding infrastructure coverage into Europe and Asia Pacific. Active opportunity #Q4-CAP-088 progressing with high velocity.
                    </p>
                    <div className="text-xs font-bold text-[#38BDF8] font-mono">$185,000 Potential ARR</div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACTS */}
              {activeC360Tab === 'contacts' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F8FAFC]">Sarah Chen</span>
                      <span className="text-[10px] font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.5 rounded">Technical VP</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">VP of Engineering & Architecture</div>
                    <div className="text-[#38BDF8] text-[11px] pt-1">schen@nexusglobal.example</div>
                    <div className="text-[10px] text-slate-500">Last Contact: 3 Days Ago (Meeting)</div>
                  </div>

                  <div className="p-4 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F8FAFC]">David Miller</span>
                      <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">Procurement</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">Head of Global Procurement</div>
                    <div className="text-[#38BDF8] text-[11px] pt-1">dmiller@nexusglobal.example</div>
                    <div className="text-[10px] text-slate-500">Last Contact: 5 Days Ago (Proposal Delivered)</div>
                  </div>

                  <div className="p-4 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F8FAFC]">Elena Rostova</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Executive</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">Chief Technology Officer</div>
                    <div className="text-[#38BDF8] text-[11px] pt-1">erostova@nexusglobal.example</div>
                    <div className="text-[10px] text-slate-500">Last Contact: 2 Weeks Ago (Executive Review)</div>
                  </div>
                </div>
              )}

              {/* TAB 3: DEALS */}
              {activeC360Tab === 'deals' && (
                <div className="space-y-3 animate-in fade-in duration-200 text-xs">
                  <div className="p-4 bg-[#06070A]/80 border border-white/[0.08] rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-[#F8FAFC]">Q4 Capacity Expansion</div>
                      <div className="text-slate-400">Proposal Phase · Target Close: Dec 15, 2026</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-emerald-400 font-mono">$185,000</div>
                      <span className="text-[11px] text-[#38BDF8] font-semibold">75% Probability</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#06070A]/80 border border-white/[0.08] rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-[#F8FAFC]">Global Security & Edge Add-on</div>
                      <div className="text-slate-400">Discovery Phase · Target Close: Jan 30, 2027</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-emerald-400 font-mono">$60,000</div>
                      <span className="text-[11px] text-[#38BDF8] font-semibold">50% Probability</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TIMELINE */}
              {activeC360Tab === 'timeline' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Timeline Filter Pills */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-semibold font-mono">Filter:</span>
                    <button
                      onClick={() => setTimelineFilter('all')}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                        timelineFilter === 'all'
                          ? 'bg-[#38BDF8] text-[#06070A] border-[#38BDF8] font-bold'
                          : 'bg-[#06070A] text-slate-300 border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTimelineFilter('meetings')}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                        timelineFilter === 'meetings'
                          ? 'bg-[#38BDF8] text-[#06070A] border-[#38BDF8] font-bold'
                          : 'bg-[#06070A] text-slate-300 border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      Meetings
                    </button>
                    <button
                      onClick={() => setTimelineFilter('proposals')}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                        timelineFilter === 'proposals'
                          ? 'bg-[#38BDF8] text-[#06070A] border-[#38BDF8] font-bold'
                          : 'bg-[#06070A] text-slate-300 border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      Proposals
                    </button>
                    <button
                      onClick={() => setTimelineFilter('contracts')}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                        timelineFilter === 'contracts'
                          ? 'bg-[#38BDF8] text-[#06070A] border-[#38BDF8] font-bold'
                          : 'bg-[#06070A] text-slate-300 border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      Contracts
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {(timelineFilter === 'all' || timelineFilter === 'meetings') && (
                      <div className="p-3 bg-[#06070A]/80 border border-white/[0.08] rounded-xl flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center font-bold shrink-0 mt-0.5">
                          <Calendar size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-[#F8FAFC]">Quarterly Business & Technical Roadmap Review</div>
                          <div className="text-[#94A3B8] text-[11px]">Attended by Sarah Chen and Arjun Mehta · 45 minutes</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">3 Days Ago · Meeting</div>
                        </div>
                      </div>
                    )}

                    {(timelineFilter === 'all' || timelineFilter === 'proposals') && (
                      <div className="p-3 bg-[#06070A]/80 border border-white/[0.08] rounded-xl flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center font-bold shrink-0 mt-0.5">
                          <FileText size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-[#F8FAFC]">Formal Commercial Quote Delivered (#Q-2026-088)</div>
                          <div className="text-[#94A3B8] text-[11px]">Sent to David Miller for procurement review · $185,000 ARR</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">5 Days Ago · Proposal</div>
                        </div>
                      </div>
                    )}

                    {(timelineFilter === 'all' || timelineFilter === 'contracts') && (
                      <div className="p-3 bg-[#06070A]/80 border border-white/[0.08] rounded-xl flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                          <CheckCheck size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-[#F8FAFC]">Annual Master Services Agreement Executed</div>
                          <div className="text-[#94A3B8] text-[11px]">Sign-off completed by Elena Rostova · 2-year commitment</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">2 Weeks Ago · Contract</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: HEALTH */}
              {activeC360Tab === 'health' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200 text-xs">
                  <div className="p-4 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Product Adoption</span>
                    <div className="text-xl font-extrabold text-[#38BDF8]">94%</div>
                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#38BDF8] h-full w-[94%]" />
                    </div>
                    <span className="text-[10px] text-slate-500">120 active daily seats</span>
                  </div>

                  <div className="p-4 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Stakeholder Sentiment</span>
                    <div className="text-xl font-extrabold text-emerald-400">98 / 100</div>
                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[98%]" />
                    </div>
                    <span className="text-[10px] text-slate-500">Positive QBR feedback</span>
                  </div>

                  <div className="p-4 bg-[#06070A]/80 border border-white/[0.08] rounded-xl space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Service SLA Adherence</span>
                    <div className="text-xl font-extrabold text-[#F8FAFC]">100%</div>
                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#38BDF8] h-full w-full" />
                    </div>
                    <span className="text-[10px] text-slate-500">Zero critical incident tickets</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. SCROLL-DRIVEN PRODUCT STORYTELLING (5-Stage Sales Lifecycle)
          Story sequence: Capture → Understand → Engage → Convert → Grow.
          Clean horizontal step flow with hairline dividers and crisp numeric indices.
          ========================================================================= */}
      <section id="sales-workflow" className="py-24 lg:py-32 bg-[#06070A] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono tracking-[0.2em] text-[#38BDF8] uppercase block">
              03 // STORYTELLING WORKFLOW
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-[-0.03em] font-display">
              From first interaction to lasting customer relationships.
            </h2>
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed">
              Explore how SYVORIS Ai connects each phase of customer engagement, from initial lead capture to recurring expansion.
            </p>

            {/* Play/Pause Auto-Play Toggle */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsAutoPlayingWorkflow(!isAutoPlayingWorkflow)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D1017] border border-white/[0.08] hover:border-white/20 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                {isAutoPlayingWorkflow ? <Pause size={12} /> : <Play size={12} />}
                <span>{isAutoPlayingWorkflow ? 'Pause Story' : 'Auto-Play Story'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkflowStep(0)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-slate-400 hover:text-white transition cursor-pointer"
                title="Reset to Stage 1"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Interactive 5-Stage Step Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
            {workflowSteps.map((step, idx) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setActiveWorkflowStep(idx)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  activeWorkflowStep === idx
                    ? 'bg-[#38BDF8]/10 text-white border-[#38BDF8] shadow-md shadow-[#38BDF8]/10 -translate-y-0.5'
                    : 'bg-[#0D1017] border-white/[0.08] text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-mono font-bold ${activeWorkflowStep === idx ? 'text-[#38BDF8]' : 'text-slate-500'}`}>
                    {step.num}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${activeWorkflowStep === idx ? 'bg-[#38BDF8]' : 'bg-white/10'}`} />
                </div>
                <div className="font-bold text-sm text-[#F8FAFC]">{step.title}</div>
                <div className={`text-[11px] truncate mt-0.5 ${activeWorkflowStep === idx ? 'text-slate-300' : 'text-slate-500'}`}>
                  {step.tagline}
                </div>
              </button>
            ))}
          </div>

          {/* Synchronized Visual Story Display */}
          <div className="bg-[#0D1017] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Side: Stage Narrative */}
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#38BDF8] text-xs font-mono uppercase tracking-wider">
                  <span>Stage {workflowSteps[activeWorkflowStep].num} — {workflowSteps[activeWorkflowStep].title}</span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight font-display">
                  {workflowSteps[activeWorkflowStep].tagline}
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  {workflowSteps[activeWorkflowStep].desc}
                </p>
                <div className="p-4 bg-[#06070A]/80 border border-white/[0.08] rounded-xl text-xs text-slate-200 font-medium">
                  {workflowSteps[activeWorkflowStep].detail}
                </div>
              </div>

              {/* Right Side: Interactive Visual Frame */}
              <div className="lg:col-span-7 bg-[#06070A]/90 border border-white/[0.08] rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs">
                  <span className="font-bold text-[#F8FAFC] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                    <span>{workflowSteps[activeWorkflowStep].mockup.title}</span>
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2 py-0.5 rounded">
                    {workflowSteps[activeWorkflowStep].mockup.badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {workflowSteps[activeWorkflowStep].mockup.fields.map((field) => (
                    <div key={field.label} className="p-3 bg-[#0D1017] border border-white/[0.08] rounded-lg">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">{field.label}</span>
                      <span className="font-bold text-[#F8FAFC] block mt-0.5">{field.val}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">Source: {workflowSteps[activeWorkflowStep].mockup.source}</span>
                  <button
                    onClick={() => setActiveWorkflowStep((prev) => (prev + 1) % 5)}
                    className="font-bold text-[#38BDF8] hover:text-[#7dd3fc] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next Stage</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. MOTION-ENABLED SALES PIPELINE SIMULATOR
          Interactive opportunity progression with weighted pipeline math.
          ========================================================================= */}
      <section id="sales-pipeline-simulator" className="py-24 lg:py-32 bg-[#06070A] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono tracking-[0.2em] text-[#38BDF8] uppercase block">
              04 // PIPELINE VELOCITY
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-[-0.03em] font-display">
              Move opportunities with complete clarity.
            </h2>
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed">
              Experience how commercial deals advance through governed pipeline stages with automatic probability calculation.
            </p>
          </div>

          <div className="bg-[#0D1017] border border-white/[0.08] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Simulator Header & Metric Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
              <div>
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider block">Sample Deal</span>
                <h3 className="font-extrabold text-xl text-[#F8FAFC]">Global Cloud Infrastructure Migration</h3>
                <p className="text-xs text-slate-400">Nexus Global Technologies · Commercial Quote #Q-2026-088</p>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-mono">Deal Size</span>
                  <span className="text-xl font-extrabold text-[#F8FAFC]">${simulatedDealAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-mono">Weighted Forecast</span>
                  <span className="text-xl font-extrabold text-[#38BDF8]">
                    ${weightedPipelineValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Progression Track */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#F8FAFC]">Current Stage: <span className="text-[#38BDF8]">{currentStage.name} ({currentStage.prob}%)</span></span>
                <span className="text-slate-400 font-mono">Target Close: Dec 15, 2026</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/[0.06] h-3 rounded-full overflow-hidden p-0.5 border border-white/[0.08]">
                <div
                  style={{ width: `${currentStage.prob}%` }}
                  className="bg-gradient-to-r from-[#1769D2] to-[#38BDF8] h-full rounded-full transition-all duration-500"
                />
              </div>

              {/* Stage Buttons */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {pipelineStages.map((stg, idx) => (
                  <button
                    key={stg.name}
                    type="button"
                    onClick={() => setPipelineDealStage(idx)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pipelineDealStage === idx
                        ? 'bg-[#38BDF8] text-[#06070A] border-[#38BDF8] shadow-md shadow-[#38BDF8]/20'
                        : 'bg-[#06070A] text-slate-400 border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <span>{stg.name}</span>
                    <span className="block text-[10px] font-normal opacity-80">{stg.prob}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Action & Controls */}
            <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>
                  {pipelineDealStage === 4
                    ? 'Deal successfully won! Account provisioning initiated.'
                    : `Advancing to ${pipelineStages[Math.min(4, pipelineDealStage + 1)].name} increases weighted revenue by +$${((simulatedDealAmount * 20) / 100).toLocaleString()}.`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPipelineDealStage(0)}
                  className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-semibold text-xs rounded-xl border border-white/10 transition cursor-pointer"
                >
                  Reset Simulator
                </button>
                <button
                  type="button"
                  onClick={() => setPipelineDealStage((prev) => Math.min(4, prev + 1))}
                  disabled={pipelineDealStage === 4}
                  className={`px-5 py-2 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                    pipelineDealStage === 4
                      ? 'bg-emerald-500 text-[#06070A] cursor-default font-extrabold'
                      : 'bg-[#38BDF8] hover:bg-[#7dd3fc] text-[#06070A] shadow-md shadow-[#38BDF8]/20'
                  }`}
                >
                  <span>{pipelineDealStage === 4 ? 'Deal Won!' : 'Advance Deal Stage →'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. ENTERPRISE SECURITY AND GOVERNANCE
          SpotlightCard hover cards for platform governance pillars.
          ========================================================================= */}
      <section id="governance" className="py-24 lg:py-32 bg-[#06070A] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono tracking-[0.2em] text-[#38BDF8] uppercase block">
              05 // PLATFORM GOVERNANCE
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-[-0.03em] font-display">
              Built with enterprise governance in mind.
            </h2>
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed">
              Designed from the foundation for organization-wide reliability, strict data partitioning, and controlled workspace access.
            </p>
          </div>

          {/* 4 Security & Governance Pillars with React Bits SpotlightCard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SpotlightCard
              spotlightColor="rgba(56, 189, 248, 0.15)"
              theme="dark"
              className="p-6 bg-[#0D1017] border border-white/[0.08] rounded-2xl space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20">
                <Building2 size={20} />
              </div>
              <h3 className="font-bold text-base text-[#F8FAFC]">Multi-Tenant Architecture</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Logical data separation ensuring each organization's records, contacts, and opportunities remain strictly partitioned in a private workspace.
              </p>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(56, 189, 248, 0.15)"
              theme="dark"
              className="p-6 bg-[#0D1017] border border-white/[0.08] rounded-2xl space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20">
                <Shield size={20} />
              </div>
              <h3 className="font-bold text-base text-[#F8FAFC]">Role-Based Access Control</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Granular permission profiles ensuring team members access only authorized accounts, pipeline stages, and commercial actions.
              </p>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(56, 189, 248, 0.15)"
              theme="dark"
              className="p-6 bg-[#0D1017] border border-white/[0.08] rounded-2xl space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-base text-[#F8FAFC]">Secure Authentication</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Modern credential security, session validation, and support for enterprise identity federation to keep workspaces safe.
              </p>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(56, 189, 248, 0.15)"
              theme="dark"
              className="p-6 bg-[#0D1017] border border-white/[0.08] rounded-2xl space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20">
                <Activity size={20} />
              </div>
              <h3 className="font-bold text-base text-[#F8FAFC]">Controlled Workspace Access</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Comprehensive activity tracking and audit logs to monitor platform usage, prevent unauthorized access, and ensure organizational compliance.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. MINIMAL HIGH-CONTRAST FINAL CALL TO ACTION
          Framed obsidian container with radial border highlight.
          ========================================================================= */}
      <section className="py-24 lg:py-32 bg-[#06070A] text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-[#0D1017] border border-white/[0.08] rounded-3xl p-10 sm:p-16 text-center overflow-hidden shadow-2xl">
            {/* Ambient radial highlight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#38BDF8]/10 blur-[120px] pointer-events-none" />

            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#38BDF8] text-xs font-mono uppercase tracking-wider">
                06 // CONNECTED BUSINESS INTELLIGENCE
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-[-0.03em] font-display">
                Bring your business relationships together.
              </h2>

              <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed">
                Discover a more connected way to manage customers, sales and engagement across your enterprise.
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="px-7 py-3.5 bg-[#38BDF8] hover:bg-[#7dd3fc] text-[#06070A] font-bold text-sm rounded-xl shadow-lg shadow-[#38BDF8]/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span>Request a Demo</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onLaunchDemo}
                  className="px-7 py-3.5 bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold text-sm rounded-xl border border-white/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer backdrop-blur-md"
                >
                  Explore SYVORIS Ai
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. MINIMAL HIGH-CONTRAST FOOTER
          Obsidian footer with hairline border, high contrast copy and full navigation routes.
          ========================================================================= */}
      <footer className="bg-[#06070A] text-slate-400 text-xs border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand Column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#38BDF8] flex items-center justify-center p-1">
                  <img
                    src="/assets/syvoris-mark-transparent.svg"
                    alt="SYVORIS Ai"
                    className="w-full h-full object-contain brightness-0"
                  />
                </div>
                <span className="font-extrabold text-lg text-white font-display">
                  SYVORIS <span className="text-[#38BDF8]">Ai</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Intelligent enterprise CRM, sales operations, and marketing platform for connected businesses.
              </p>
              <div className="text-[11px] font-mono tracking-wider text-slate-400">
                ENGAGE · CONVERT · GROW
              </div>
            </div>

            {/* Platform Links */}
            <div className="space-y-3">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] font-mono">Platform</span>
              <ul className="space-y-2">
                <li><a href="#customer-360" className="hover:text-[#38BDF8] transition">Customer 360</a></li>
                <li><a href="#sales-workflow" className="hover:text-[#38BDF8] transition">Sales Pipeline</a></li>
                <li><a href="#sales-pipeline-simulator" className="hover:text-[#38BDF8] transition">Interactive Pipeline</a></li>
                <li><a href="#platform" className="hover:text-[#38BDF8] transition">Capability Hub</a></li>
              </ul>
            </div>

            {/* Governance & Resources */}
            <div className="space-y-3">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] font-mono">Governance</span>
              <ul className="space-y-2">
                <li><a href="#governance" className="hover:text-[#38BDF8] transition">Multi-Tenancy</a></li>
                <li><a href="#governance" className="hover:text-[#38BDF8] transition">Role-Based Access</a></li>
                <li><a href="#governance" className="hover:text-[#38BDF8] transition">Workspace Security</a></li>
                <li><a href="#governance" className="hover:text-[#38BDF8] transition">Audit Logging</a></li>
              </ul>
            </div>

            {/* Company & Access */}
            <div className="space-y-3">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] font-mono">Access</span>
              <ul className="space-y-2">
                <li>
                  <button onClick={onNavigateLogin} className="hover:text-[#38BDF8] transition text-left cursor-pointer">
                    Sign In
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowDemoModal(true)} className="hover:text-[#38BDF8] transition text-left cursor-pointer">
                    Request a Demo
                  </button>
                </li>
                <li>
                  <button onClick={onLaunchDemo} className="hover:text-[#38BDF8] transition text-left font-semibold cursor-pointer">
                    Explore Sandbox
                  </button>
                </li>
                <li>
                  <button onClick={onNavigateRegister} className="hover:text-[#38BDF8] transition text-left cursor-pointer">
                    Create Tenant Account
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="mt-12 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
            <div>© 2026 SYVORIS Ai. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Enterprise CRM & Operations</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          10. DEMO REQUEST MODAL
          Dark architectural card with frosted backdrop.
          ========================================================================= */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0D1017] rounded-2xl border border-white/[0.08] shadow-2xl max-w-lg w-full p-6 sm:p-8 relative text-[#F8FAFC]">
            <button
              onClick={() => {
                setShowDemoModal(false);
                setDemoSubmitted(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {demoSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check size={28} />
                </div>
                <h3 className="font-extrabold text-2xl text-[#F8FAFC]">Thank you for your interest.</h3>
                <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
                  Our enterprise solutions team has received your request and will reach out to schedule your personalized platform walkthrough.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setShowDemoModal(false);
                      setDemoSubmitted(false);
                    }}
                    className="px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold text-xs rounded-xl border border-white/10 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDemoModal(false);
                      setDemoSubmitted(false);
                      onLaunchDemo();
                    }}
                    className="px-5 py-2.5 bg-[#38BDF8] hover:bg-[#7dd3fc] text-[#06070A] font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Explore Sandbox Now
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-xl text-[#F8FAFC]">Request a Platform Demo</h3>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Connect with our product specialists for a tailored walkthrough of SYVORIS Ai.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={demoForm.fullName}
                      onChange={(e) => setDemoForm({ ...demoForm, fullName: e.target.value })}
                      className="w-full bg-[#06070A] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Corporate Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="jane@company.com"
                        value={demoForm.workEmail}
                        onChange={(e) => setDemoForm({ ...demoForm, workEmail: e.target.value })}
                        className="w-full bg-[#06070A] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Acme Corporation"
                        value={demoForm.company}
                        onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                        className="w-full bg-[#06070A] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Your Role</label>
                      <select
                        value={demoForm.role}
                        onChange={(e) => setDemoForm({ ...demoForm, role: e.target.value })}
                        className="w-full bg-[#06070A] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#38BDF8]"
                      >
                        <option className="bg-[#0D1017]">Executive / Decision Maker</option>
                        <option className="bg-[#0D1017]">VP of Sales / Commercial Lead</option>
                        <option className="bg-[#0D1017]">Revenue Operations Manager</option>
                        <option className="bg-[#0D1017]">Customer Success Leader</option>
                        <option className="bg-[#0D1017]">Technical / IT Architecture</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Team Size</label>
                      <select
                        value={demoForm.teamSize}
                        onChange={(e) => setDemoForm({ ...demoForm, teamSize: e.target.value })}
                        className="w-full bg-[#06070A] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#38BDF8]"
                      >
                        <option className="bg-[#0D1017]">1-20 employees</option>
                        <option className="bg-[#0D1017]">21-50 employees</option>
                        <option className="bg-[#0D1017]">51-200 employees</option>
                        <option className="bg-[#0D1017]">201-1,000 employees</option>
                        <option className="bg-[#0D1017]">1,000+ enterprise</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Notes or Primary Interest</label>
                    <textarea
                      rows={2}
                      placeholder="Tell us about your team's CRM and sales workflow objectives..."
                      value={demoForm.notes}
                      onChange={(e) => setDemoForm({ ...demoForm, notes: e.target.value })}
                      className="w-full bg-[#06070A] border border-white/[0.1] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#38BDF8] hover:bg-[#7dd3fc] text-[#06070A] font-bold text-xs rounded-xl shadow-lg shadow-[#38BDF8]/20 transition cursor-pointer"
                  >
                    Submit Demo Request
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    We respect your privacy. No marketing spam.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
