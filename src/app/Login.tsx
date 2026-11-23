import React, { useState, useEffect } from 'react';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Building2, KeyRound, CheckCircle2, AlertTriangle, Lock, RefreshCw, Mail } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: string) => void;
  onNavigateRegister?: () => void;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const score = [hasMinLength, (hasUpper && hasLower), hasNumber, hasSymbol].filter(Boolean).length;

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const barColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-400', 'bg-cyan-400'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5 text-left">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">Password strength:</span>
        <span className={`font-semibold ${score >= 3 ? 'text-emerald-400' : score === 2 ? 'text-amber-400' : 'text-rose-400'}`}>
          {strengthLabels[score]}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
        {[0, 1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              score > step ? barColors[score] : 'bg-slate-700/50'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-400">
        <span className={hasMinLength ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
          {hasMinLength ? '✓' : '○'} 8+ characters
        </span>
        <span className={(hasUpper && hasLower) ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
          {(hasUpper && hasLower) ? '✓' : '○'} Upper & lowercase
        </span>
        <span className={hasNumber ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
          {hasNumber ? '✓' : '○'} Includes number
        </span>
        <span className={hasSymbol ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
          {hasSymbol ? '✓' : '○'} Special symbol
        </span>
      </div>
    </div>
  );
}

export function Login({ onLogin, onNavigateRegister }: LoginProps) {
  const [email, setEmail] = useState('arjun.mehta@example.com');
  const [password, setPassword] = useState('Password123!');
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
  const [dispatchedTokenHint, setDispatchedTokenHint] = useState<string | null>(null);

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

      // Check if message indicates lockout
      if (msg.toLowerCase().includes('locked')) {
        setLockoutSeconds(300); // 5 minutes default
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

      // Auto close after 2.5s and prompt user to sign in
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
            <span className="login-pillar-icon">♙</span>
            <b>CRM & Customer 360</b>
            <small>Know every relationship</small>
          </div>
          <div>
            <Sparkles />
            <b>AI Agent Workforce</b>
            <small>Work with intelligence</small>
          </div>
          <div>
            <span className="login-pillar-icon">↗</span>
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

          <div className="flex items-center gap-2 my-3">
            <span className="text-[11px] text-slate-400 font-medium">Quick switch:</span>
            <button
              type="button"
              className={`text-[11px] px-2.5 py-1 rounded border transition font-medium ${email === 'arjun.mehta@example.com' ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200' : 'bg-slate-850 border-slate-700 text-slate-300 hover:border-slate-500'}`}
              onClick={() => {
                setEmail('arjun.mehta@example.com');
                setPassword('Password123!');
                setTenantSlug('bluepeak-innovations');
                setError('');
              }}
            >
              Arjun Mehta (Owner)
            </button>
            <button
              type="button"
              className={`text-[11px] px-2.5 py-1 rounded border transition font-medium ${email === 'demo@syvoris.example' ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200' : 'bg-slate-850 border-slate-700 text-slate-300 hover:border-slate-500'}`}
              onClick={() => {
                setEmail('demo@syvoris.example');
                setPassword('SYVORIS-DEMO');
                setTenantSlug('bluepeak-innovations');
                setError('');
              }}
            >
              Demo Operator
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="name@company.com"
                required
              />
            </label>

            <label>
              Password
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {showTenantField ? (
              <label>
                Organization Slug (optional)
                <input
                  type="text"
                  placeholder="e.g. bluepeak-innovations"
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
                  setForgotStep('request');
                  setResetSuccessMessage('');
                  setResetError('');
                  setDispatchedTokenHint(null);
                }}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="login-error flex items-start gap-2 text-xs bg-rose-950/60 border border-rose-500/50 p-2.5 rounded-lg text-rose-200 my-2">
                <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                <span>
                  {error}
                  {lockoutSeconds !== null && lockoutSeconds > 0 && (
                    <b className="block mt-1 font-mono text-cyan-300">
                      Cooldown timer: {Math.floor(lockoutSeconds / 60)}m {lockoutSeconds % 60}s remaining
                    </b>
                  )}
                </span>
              </div>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={loading || (lockoutSeconds !== null && lockoutSeconds > 0)}
            >
              {loading ? 'Authenticating...' : 'Continue to workspace'} <ArrowRight size={16} />
            </button>
          </form>

          {onNavigateRegister && (
            <div className="mt-3.5 text-center text-xs text-slate-300 bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg">
              New to SYVORIS Ai?{' '}
              <button
                type="button"
                className="text-cyan-400 font-bold hover:underline"
                onClick={onNavigateRegister}
              >
                Create a new account & workspace →
              </button>
            </div>
          )}

          <div className="demo-login-info">
            <ShieldCheck size={16} />
            <span>
              <b>Enterprise Authentication & RBAC Governance</b>
              <small>Database RLS tenancy, bcrypt/SHA-256 token hashing, and brute-force lockout protection active.</small>
            </span>
          </div>

          <div className="login-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="sso-button"
            onClick={async () => {
              setLoading(true);
              try {
                await api.login({
                  email: 'arjun.mehta@example.com',
                  password: 'Password123!',
                  tenant_slug: 'bluepeak-innovations',
                });
                localStorage.setItem('syvoris:authenticated', 'true');
                onLogin('arjun.mehta@example.com');
              } catch (err: any) {
                setError(err?.message || 'SSO Handshake failed.');
              } finally {
                setLoading(false);
              }
            }}
          >
            Continue with Corporate SSO
          </button>

          <div className="login-legal">By continuing, you agree to your enterprise access security and data-use governance policies.</div>
        </div>

        <div className="login-copyright">© 2026 SYVORIS Ai · Enterprise Multi-Tenant Platform</div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <KeyRound size={22} />
              <h3 className="text-lg font-bold">Enterprise Password Recovery</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Governed self-service password recovery with cryptographic token verification.
            </p>

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <label className="block text-left text-xs text-slate-300 font-medium">
                  Registered Corporate Email
                  <div className="relative mt-1">
                    <input
                      type="email"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 pl-9"
                      placeholder="name@company.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                    />
                    <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                  </div>
                </label>

                {resetSuccessMessage && (
                  <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-xl p-3.5 text-xs text-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-emerald-300">
                      <CheckCircle2 size={16} /> Password Recovery Email Dispatched
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-200/90">
                      {resetSuccessMessage}
                    </p>
                    {dispatchedTokenHint && (
                      <div className="bg-emerald-900/40 border border-emerald-600/40 rounded-lg p-2.5 mt-2">
                        <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                          Recovery Token (Simulated Email Inbox):
                        </span>
                        <code className="text-cyan-300 font-mono text-xs font-bold select-all bg-slate-950/80 px-2 py-0.5 rounded">
                          {dispatchedTokenHint}
                        </code>
                      </div>
                    )}
                    <button
                      type="button"
                      className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow"
                      onClick={() => {
                        setForgotStep('confirm');
                        setResetSuccessMessage('');
                        setResetError('');
                      }}
                    >
                      Enter Recovery Token & Set New Password <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {resetError && (
                  <div className="bg-rose-950/70 border border-rose-500/50 rounded-lg p-3 text-xs text-rose-200 flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0 text-rose-400" />
                    <span>{resetError}</span>
                  </div>
                )}

                {!resetSuccessMessage && (
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Dispatching Reset Link...
                      </>
                    ) : (
                      'Send Password Reset Link'
                    )}
                  </button>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('confirm');
                      setResetError('');
                    }}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Already have a recovery token? Enter it here →
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordReset} className="space-y-3.5">
                <label className="block text-left text-xs text-slate-300 font-medium">
                  Security Recovery Token
                  <input
                    type="text"
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. RST-XXXX-XXXX"
                    value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    required
                  />
                </label>

                <label className="block text-left text-xs text-slate-300 font-medium">
                  New Password
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 pr-9"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={newPassword} />
                </label>

                <label className="block text-left text-xs text-slate-300 font-medium">
                  Confirm New Password
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </label>

                {resetSuccessMessage && (
                  <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-lg p-3 text-xs text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>{resetSuccessMessage}</span>
                  </div>
                )}

                {resetError && (
                  <div className="bg-rose-950/70 border border-rose-500/50 rounded-lg p-3 text-xs text-rose-200 flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0 text-rose-400" />
                    <span>{resetError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading || !resetToken || !newPassword || newPassword !== confirmNewPassword}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow"
                >
                  {resetLoading ? 'Updating Password...' : 'Update Password & Return to Login'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('request');
                      setResetError('');
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back to request reset link
                  </button>
                </div>
              </form>
            )}

            <button
              onClick={() => {
                setShowForgotModal(false);
                setResetError('');
                setResetSuccessMessage('');
                setDispatchedTokenHint(null);
              }}
              className="mt-4 w-full text-center text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
