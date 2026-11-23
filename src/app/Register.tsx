import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ArrowLeft, Building2, CheckCircle2, Eye, EyeOff,
  Lock, Mail, ShieldCheck, Sparkles, User, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

interface RegisterProps {
  onSuccess: (email: string) => void;
  onNavigateLogin: () => void;
  onNavigateLanding?: () => void;
}

function EnterpriseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = Math.min(22, Math.floor(width / 55));
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 2 + 1.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.08;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(23, 105, 210, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(50, 199, 233, 0.4)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
      aria-hidden="true"
    />
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const score = [hasMinLength, (hasUpper && hasLower), hasNumber, hasSymbol].filter(Boolean).length;
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const barColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-500', 'bg-[#1769D2]'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5 text-left">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#65758B] font-medium">Password strength:</span>
        <span className={`font-semibold ${score >= 3 ? 'text-emerald-600' : score === 2 ? 'text-amber-600' : 'text-rose-600'}`}>
          {strengthLabels[score]}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
        {[0, 1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              score > step ? barColors[score] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function Register({ onSuccess, onNavigateLogin, onNavigateLanding }: RegisterProps) {
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!orgName.trim() || !slug.trim() || !firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    setLoading(true);

    try {
      await api.registerTenant({
        organization_name: orgName.trim(),
        tenant_slug: slug.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password: password,
      });

      localStorage.setItem('syvoris:authenticated', 'true');
      onSuccess(email.trim());
    } catch (err: any) {
      setError(err?.message || 'Tenant workspace provisioning failed. Please try a different organization name or slug.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#12243A] font-sans selection:bg-[#32C7E9]/30 selection:text-[#08264D] flex flex-col justify-between relative overflow-hidden">
      <EnterpriseCanvas />

      {/* Subtle light ambient glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-gradient-to-b from-[#1769D2]/8 via-[#32C7E9]/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {onNavigateLanding && (
            <button
              onClick={onNavigateLanding}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#12243A] hover:text-[#1769D2] px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            >
              <ArrowLeft size={14} className="text-[#65758B]" />
              <span>Back to Public Website</span>
            </button>
          )}

          <div
            onClick={onNavigateLanding}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-full bg-[#1769D2] flex items-center justify-center p-1 shadow-sm group-hover:scale-105 transition-transform">
              <img src="/assets/syvoris-mark-transparent.svg" alt="" className="w-4 h-4 object-contain" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#08264D] font-display">
              syvoris<span className="text-[#1769D2]">.ai</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#65758B] hidden sm:inline">Already have an account?</span>
          <button
            onClick={onNavigateLogin}
            className="font-bold text-[#1769D2] hover:text-[#103B70] transition cursor-pointer"
          >
            Sign In →
          </button>
        </div>
      </header>

      {/* Main Registration Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 py-8">
        <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-7 sm:p-10 backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#1769D2] text-[11px] font-bold tracking-wider uppercase mb-1">
              <Sparkles size={13} />
              <span>Provision Organization Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#08264D] tracking-tight font-display">
              Create your SYVORIS Ai Organization
            </h2>
            <p className="text-xs text-[#65758B]">
              Deploy a logically isolated enterprise workspace for your team in seconds.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[#12243A] font-semibold mb-1">Organization Name *</label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={orgName}
                    onChange={e => handleOrgNameChange(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-[#12243A] placeholder-slate-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/15 text-xs transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#12243A] font-semibold mb-1">Workspace Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme-corporation"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-[#12243A] font-mono placeholder-slate-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/15 text-xs transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[#12243A] font-semibold mb-1">First Name *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Jane"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-[#12243A] placeholder-slate-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/15 text-xs transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#12243A] font-semibold mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-[#12243A] placeholder-slate-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/15 text-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#12243A] font-semibold mb-1">Corporate Email Address *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-[#12243A] placeholder-slate-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/15 text-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#12243A] font-semibold mb-1">Master Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-10 pr-10 py-2.5 text-[#12243A] placeholder-slate-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/15 text-xs transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PasswordStrengthBar password={password} />
            </div>

            <div>
              <label className="block text-[#12243A] font-semibold mb-1">Confirm Master Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter master password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-10 pr-10 py-2.5 text-[#12243A] placeholder-slate-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/15 text-xs transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1769D2] hover:bg-[#103B70] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Provisioning Workspace...</span>
                ) : (
                  <>
                    <span>Create Organization Workspace</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-[#65758B] leading-relaxed">
            By creating a workspace, you agree to your enterprise access security and data governance policies.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 py-4 text-center text-[11px] text-[#65758B] relative z-10">
        © 2026 SYVORIS Ai · Enterprise CRM & Revenue Platform. All rights reserved.
      </footer>
    </div>
  );
}
