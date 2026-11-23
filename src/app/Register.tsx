import React, { useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface RegisterProps {
  onSuccess: (email: string) => void;
  onNavigateLogin: () => void;
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

export function Register({ onSuccess, onNavigateLogin }: RegisterProps) {
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
        password,
      });
      localStorage.setItem('syvoris:authenticated', 'true');
      localStorage.setItem('syvoris:active_tenant_slug', slug.trim());
      localStorage.setItem('syvoris:active_tenant_name', orgName.trim());
      onSuccess(email.trim());
    } catch (err: any) {
      setError(err?.message || 'Tenant registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
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
          <h1>Deploy your multi-tenant enterprise CRM workspace in seconds.</h1>
          <p>
            Isolated PostgreSQL schema protection, enterprise RBAC governance, and an intelligent AI workforce
            tailored for your organization.
          </p>
        </div>
        <div className="login-pillar-row">
          <div>
            <Building2 size={20} className="text-cyan-400" />
            <b>Dedicated Tenancy</b>
            <small>Kernel-isolated data boundary</small>
          </div>
          <div>
            <Sparkles size={20} className="text-cyan-400" />
            <b>Governed AI Models</b>
            <small>Private to your business</small>
          </div>
          <div>
            <ShieldCheck size={20} className="text-cyan-400" />
            <b>Role-Based Security</b>
            <small>Immutable audit ledger</small>
          </div>
        </div>
        <div className="login-art-footer">SYVORIS Ai™ · Enterprise CRM, Sales & Marketing</div>
      </div>

      <div className="login-side">
        <div className="login-card max-w-lg">
          <div className="login-mark">
            <img src="/assets/syvoris-mark-transparent.svg" alt="" />
            <span>
              SYVORIS <b>Ai</b>
            </span>
          </div>
          <span className="eyebrow">ENTERPRISE ONBOARDING</span>
          <h2>Register your Organization</h2>
          <p>Create your enterprise tenant and provision your administrative credentials.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label>
                Organization Name
                <input
                  type="text"
                  placeholder="e.g. Acme Global Industries"
                  value={orgName}
                  onChange={e => handleOrgNameChange(e.target.value)}
                  required
                />
              </label>

              <label>
                Workspace URL Slug
                <input
                  type="text"
                  placeholder="acme-global"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label>
                First Name
                <input
                  type="text"
                  placeholder="Jane"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
              </label>
            </div>

            <label>
              Corporate Email Address
              <input
                type="email"
                placeholder="jane.doe@acme.com"
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
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrengthBar password={password} />
            </label>

            <label>
              Confirm Password
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="login-error flex items-center gap-2 text-xs bg-rose-950/60 border border-rose-500/50 p-2.5 rounded-lg text-rose-200">
                <AlertTriangle size={15} className="text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button className="login-submit w-full mt-4" type="submit" disabled={loading}>
              {loading ? 'Provisioning Tenant Workspace...' : 'Create Workspace & Launch'} <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-400">
            Already have an organization workspace?{' '}
            <button
              type="button"
              className="text-cyan-400 hover:underline font-semibold"
              onClick={onNavigateLogin}
            >
              Sign in here
            </button>
          </div>

          <div className="login-legal mt-4">
            By creating a tenant, you agree to the enterprise terms of service and acceptable use policies.
          </div>
        </div>
        <div className="login-copyright">© 2026 SYVORIS Ai · Multi-Tenant Platform</div>
      </div>
    </div>
  );
}
