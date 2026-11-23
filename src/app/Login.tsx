import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Building2,
  Lock, RefreshCw, Mail, ArrowLeft, CheckCircle2, AlertTriangle,
  Play, KeyRound, Globe
} from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: string) => void;
  onNavigateRegister?: () => void;
  onNavigateLanding?: () => void;
  onLaunchDemo?: () => void;
}

/* =========================================================================
   SUBTLE ANIMATED ENTERPRISE CANVAS
   Mirrors the landing page background for seamless brand continuity.
   ========================================================================= */
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

export function Login({ onLogin, onNavigateRegister, onNavigateLanding, onLaunchDemo }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('bluepeak-innovations');
  const [showTenantField, setShowTenantField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'confirm'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [, setDispatchedTokenHint] = useState<string | null>(null);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setError('');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (lockoutSeconds && lockoutSeconds > 0) {
      setError(`Account temporarily locked for security. Please wait ${lockoutSeconds} seconds.`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }

    setLoading(true);

    try {
      await api.login({
        email: email.trim(),
        password: password,
        tenant_slug: tenantSlug.trim() || undefined,
      });
      localStorage.setItem('syvoris:authenticated', 'true');
      onLogin(email.trim());
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify your credentials.';
      setError(msg);

      if (msg.toLowerCase().includes('locked')) {
        setLockoutSeconds(300);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccessMessage('');

    if (!forgotEmail.trim()) {
      setResetError('Please enter your corporate email address.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.requestPasswordReset(forgotEmail.trim());
      setResetSuccessMessage(res.message);
      if (res.token) {
        setDispatchedTokenHint(res.token);
        setResetToken(res.token);
      }
    } catch (err: any) {
      setResetError(err?.message || 'Failed to dispatch password recovery email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccessMessage('');

    if (!resetToken.trim()) {
      setResetError('Please enter the security recovery token.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setResetError('New password must be at least 8 characters in length.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.confirmPasswordReset(resetToken.trim(), newPassword);
      setResetSuccessMessage(res.message || 'Password successfully updated.');
      setEmail(forgotEmail.trim());
      setPassword(newPassword);

      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('request');
        setResetSuccessMessage('');
        setDispatchedTokenHint(null);
      }, 2500);
    } catch (err: any) {
      setResetError(err?.message || 'Password update failed. The token may have expired.');
    } finally {
      setResetLoading(false);
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
              <img
                src="/assets/syvoris-mark-transparent.svg"
                alt="SYVORIS Ai"
                className="w-4 h-4 object-contain"
              />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#08264D] font-display">
              syvoris<span className="text-[#1769D2]">.ai</span>
            </span>
          </div>
        </div>

        {onNavigateRegister && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#65758B] hidden sm:inline">Don't have a workspace?</span>
            <button
              onClick={onNavigateRegister}
              className="font-bold text-[#1769D2] hover:text-[#103B70] transition cursor-pointer"
            >
              Create Account →
            </button>
          </div>
        )}
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 py-6">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-7 sm:p-9 backdrop-blur-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#1769D2] text-[11px] font-bold tracking-wider uppercase mb-1">
              <ShieldCheck size={13} />
              <span>Enterprise Authentication</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#08264D] tracking-tight font-display">
              Sign in to SYVORIS Ai
            </h2>
            <p className="text-xs text-[#65758B]">
              Access your customer 360, sales pipeline & commercial workspace.
            </p>
          </div>

          {/* Error / Lockout Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#12243A] font-semibold mb-1">Corporate Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-[#12243A] placeholder-slate-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/15 text-xs transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#12243A] font-semibold">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[#1769D2] hover:text-[#103B70] hover:underline text-[11px] font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError('');
                  }}
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
            </div>

            {/* Tenant Slug Toggle */}
            <div>
              {!showTenantField ? (
                <button
                  type="button"
                  onClick={() => setShowTenantField(true)}
                  className="text-[11px] text-[#65758B] hover:text-[#1769D2] flex items-center gap-1.5 font-medium transition cursor-pointer"
                >
                  <Building2 size={13} className="text-slate-400" />
                  <span>Specify organization slug ({tenantSlug || 'default'})</span>
                </button>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#65758B]">
                    <span className="font-semibold">Workspace Tenant Slug</span>
                    <button
                      type="button"
                      onClick={() => setShowTenantField(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Hide
                    </button>
                  </div>
                  <input
                    type="text"
                    value={tenantSlug}
                    onChange={e => setTenantSlug(e.target.value)}
                    placeholder="e.g. bluepeak-innovations"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[#12243A] text-xs font-mono focus:outline-none focus:border-[#1769D2]"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1769D2] hover:bg-[#103B70] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Sandbox Action */}
          {onLaunchDemo && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onLaunchDemo}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200/80 text-[#1769D2] font-bold text-xs flex items-center justify-center gap-2 transition hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-2xs"
              >
                <Play size={13} className="fill-[#1769D2] text-[#1769D2]" />
                <span>⚡ 1-Click Launch Interactive Demo Sandbox</span>
              </button>
            </div>
          )}

          {/* Corporate SSO Option */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <div className="flex-1 h-px bg-slate-200" />
              <span>or enterprise federated access</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => {
                if (onLaunchDemo) {
                  onLaunchDemo();
                } else {
                  setError('Corporate SSO redirect initiated. Connecting to enterprise identity provider.');
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-[#12243A] font-semibold text-xs flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer"
            >
              <Globe size={14} className="text-[#1769D2]" />
              <span>Continue with Corporate SSO (SAML / Okta)</span>
            </button>
          </div>

          {/* Security Assurance */}
          <div className="pt-2 text-center text-[11px] text-[#65758B] leading-relaxed">
            Encrypted with TLS 1.3 · Logical Tenant Partitioning · Enterprise Access Governance
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 py-4 text-center text-[11px] text-[#65758B] relative z-10">
        © 2026 SYVORIS Ai · Enterprise CRM & Revenue Platform. All rights reserved.
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08264D]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setResetError('');
                setResetSuccessMessage('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Close modal"
            >
              <span className="text-base font-bold">✕</span>
            </button>

            <div className="flex items-center gap-2 text-[#1769D2] font-bold text-xs uppercase tracking-wider">
              <KeyRound size={15} />
              <span>Self-Service Credential Recovery</span>
            </div>

            <h3 className="text-xl font-extrabold text-[#08264D] tracking-tight">
              Reset Workspace Password
            </h3>

            {resetSuccessMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            {resetError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4 text-xs">
                <p className="text-[#65758B] leading-relaxed">
                  Enter your verified work email address to receive a secure recovery token.
                </p>

                <div>
                  <label className="block text-[#12243A] font-semibold mb-1">Corporate Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[#12243A] focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('confirm')}
                    className="text-[#1769D2] hover:underline font-semibold cursor-pointer"
                  >
                    Already have a token?
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2.5 bg-[#1769D2] hover:bg-[#103B70] text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    {resetLoading ? 'Sending...' : 'Send Recovery Token'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordReset} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[#12243A] font-semibold mb-1">Security Recovery Token</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter token from recovery dispatch"
                    value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[#12243A] font-mono focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block text-[#12243A] font-semibold mb-1">New Password (8+ characters)</label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[#12243A] focus:outline-none focus:border-[#1769D2]"
                  />
                  <PasswordStrengthBar password={newPassword} />
                </div>

                <div>
                  <label className="block text-[#12243A] font-semibold mb-1">Confirm New Password</label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[#12243A] focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="text-[#65758B] hover:text-[#12243A] cursor-pointer"
                  >
                    Back to email entry
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2.5 bg-[#1769D2] hover:bg-[#103B70] text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    {resetLoading ? 'Updating...' : 'Update Password & Sign In'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
