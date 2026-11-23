import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  onSuccess?: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  userEmail = 'rrborkar09@gmail.com',
  userName = 'Rahul Borkar',
  onSuccess
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const score = [hasMinLength, (hasUpper && hasLower), hasNumber, hasSymbol].filter(Boolean).length;
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const barColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-400', 'bg-cyan-400'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword(newPassword, currentPassword);
      setSuccess(res.message || 'Password successfully updated.');
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-2 text-cyan-400">
          <KeyRound size={22} />
          <h3 className="text-lg font-bold">Change Master Password</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Updating credentials for <b className="text-cyan-300 font-mono">{userEmail}</b>. A security confirmation notice will be dispatched to your inbox.
        </p>

        {success && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-200 flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-left text-xs text-slate-300 font-medium">
            Current Password
            <div className="relative mt-1">
              <input
                type={showCurrent ? 'text' : 'password'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 pr-9"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="block text-left text-xs text-slate-300 font-medium">
            New Password
            <div className="relative mt-1">
              <input
                type={showNew ? 'text' : 'password'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 pr-9"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {newPassword && (
            <div className="space-y-1.5 text-left bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
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
            </div>
          )}

          <label className="block text-left text-xs text-slate-300 font-medium">
            Confirm New Password
            <input
              type="password"
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Updating Credentials...
                </>
              ) : (
                'Save New Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
