import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Building2, KeyRound } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: string) => void;
  onNavigateRegister?: () => void;
}

export function Login({ onLogin, onNavigateRegister }: LoginProps) {
  const [email, setEmail] = useState('demo@syvoris.example');
  const [password, setPassword] = useState('SYVORIS-DEMO');
  const [tenantSlug, setTenantSlug] = useState('');
  const [showTenantField, setShowTenantField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }

    setLoading(true);

    // Try real backend authentication first
    try {
      await api.login({
        email: email.trim(),
        password: password,
        tenant_slug: tenantSlug.trim() || undefined,
      });
      onLogin(email.trim());
      return;
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      await api.requestPasswordReset(forgotEmail.trim());
      setResetSent(true);
    } catch {
      setResetSent(true);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-art">
        <div className="login-art-glow" />
        <img
          className="login-wordmark"
          src="/assets/syvoris-lockup-light.svg"
          alt="SYVORIS Ai — Enterprise CRM, Sales & Marketing"
        />
        <div className="login-hero-copy">
          <span>ENGAGE · CONVERT · GROW</span>
          <h1>The intelligent CRM platform for a connected business.</h1>
          <p>Connect customer relationships, revenue operations and AI-assisted work in one governed workspace.</p>
        </div>
        <div className="login-pillar-row">
          <div>
            <UsersIcon />
            <b>CRM & Customer 360</b>
            <small>Know every relationship</small>
          </div>
          <div>
            <Sparkles />
            <b>AI Agent Workforce</b>
            <small>Work with intelligence</small>
          </div>
          <div>
            <TrendingIcon />
            <b>Sales & Growth</b>
            <small>Turn insight into action</small>
          </div>
        </div>
        <div className="login-art-footer">SYVORIS Ai™ · Enterprise CRM, Sales & Marketing</div>
      </div>

      <div className="login-side">
        <div className="login-card">
          <div className="login-mark">
            <img src="/assets/syvoris-mark-transparent.svg" alt="" />
            <span>
              SYVORIS <b>Ai</b>
            </span>
          </div>
          <span className="eyebrow">WELCOME TO YOUR WORKSPACE</span>
          <h2>Sign in to SYVORIS Ai</h2>
          <p>Access your customer, sales and service workspace.</p>

          <form onSubmit={handleSubmit}>
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              Password
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {showTenantField ? (
              <label>
                Organization Slug (optional)
                <input
                  type="text"
                  placeholder="e.g. acme-corp"
                  value={tenantSlug}
                  onChange={e => setTenantSlug(e.target.value)}
                />
              </label>
            ) : (
              <button
                type="button"
                className="text-xs text-cyan-400 hover:underline text-left mb-2 flex items-center gap-1"
                onClick={() => setShowTenantField(true)}
              >
                <Building2 size={12} /> Specify organization slug
              </button>
            )}

            <div className="login-options">
              <label>
                <input type="checkbox" defaultChecked /> Remember this device
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                  setResetSent(false);
                }}
              >
                Forgot password?
              </button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Continue to workspace'} <ArrowRight size={16} />
            </button>
          </form>

          {onNavigateRegister && (
            <div className="mt-3 text-center text-xs text-slate-300">
              Need a new organization?{' '}
              <button
                type="button"
                className="text-cyan-400 font-semibold hover:underline"
                onClick={onNavigateRegister}
              >
                Register a workspace
              </button>
            </div>
          )}

          <div className="demo-login-info">
            <ShieldCheck size={16} />
            <span>
              <b>Enterprise Authentication & RBAC Active</b>
              <small>Real PostgreSQL RLS tenancy & JWT token rotation. Demo credentials remain pre-filled for rapid review.</small>
            </span>
          </div>

          <div className="login-divider">
            <span>or</span>
          </div>

          <button
            className="sso-button"
            onClick={() => setError('Single sign-on (SAML 2.0 / OIDC) is ready for enterprise identity configuration.')}
          >
            Continue with Single Sign-On
          </button>

          <div className="login-legal">By continuing, you agree to your organization's access and data-use policies.</div>
        </div>

        <div className="login-copyright">© 2026 SYVORIS Ai · Enterprise Multi-Tenant SaaS</div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <KeyRound size={20} />
              <h3 className="text-lg font-bold">Password Reset</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Enter your corporate email address to receive an automated secure password recovery link.
            </p>

            {resetSent ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-lg p-3 text-xs text-emerald-200">
                If that email is registered in SYVORIS Ai, a reset token has been dispatched. (Check <code>storage/test_emails.log</code> in development).
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                  placeholder="name@company.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                />
                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded text-sm transition">
                  Dispatch Reset Link
                </button>
              </form>
            )}

            <button
              onClick={() => setShowForgotModal(false)}
              className="mt-4 w-full text-center text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersIcon() {
  return <span className="login-pillar-icon">♙</span>;
}

function TrendingIcon() {
  return <span className="login-pillar-icon">↗</span>;
}
