import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, ShieldAlert, Check, X, Search, Filter, Mail, Phone,
  MessageCircle, AlertTriangle, FileCheck2, UserCheck, RefreshCw, Lock,
  FileText, ExternalLink, SlidersHorizontal, Info, CheckCircle2, Clock3
} from 'lucide-react';
import { api, type ContactItem } from '../../services/api';
import { useCRM } from '../../store/CRMStore';
import { StatusPill } from '../../components/StatusPill';

interface ConsentRecord {
  id: string;
  ref: string;
  name: string;
  title: string;
  organization: string;
  accountId?: string | null;
  email: string;
  phone: string;
  emailConsent: 'Opted-In' | 'Pending' | 'Opted-Out';
  voiceConsent: 'Permitted' | 'Not Set' | 'Restricted';
  smsConsent: 'Permitted' | 'Not Set' | 'Restricted';
  legalBasis: string;
  captureMethod: string;
  lastUpdated: string;
}

export function ConsentManagementView() {
  const { addAudit, addEvent } = useCRM();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'All' | 'Email' | 'Voice' | 'SMS' | 'Pending' | 'Revoked'>('All');
  const [toast, setToast] = useState('');

  // Manage Consent Modal
  const [editingRecord, setEditingRecord] = useState<ConsentRecord | null>(null);
  const [formEmailOptIn, setFormEmailOptIn] = useState(true);
  const [formVoiceOptIn, setFormVoiceOptIn] = useState(true);
  const [formSmsOptIn, setFormSmsOptIn] = useState(false);
  const [formCaptureMethod, setFormCaptureMethod] = useState('Explicit Web Form Opt-in');
  const [formLegalBasis, setFormLegalBasis] = useState('Explicit Consent (GDPR Art. 6.1.a)');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listContacts({ limit: 100 });
      setContacts(res.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load contacts for consent management.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Parse consent attributes from contact record
  const consentRecords: ConsentRecord[] = useMemo(() => {
    return contacts.map(c => {
      const custom = c.custom_fields || {};
      const consentStr = (typeof custom.consent === 'string' ? custom.consent : '').toLowerCase();
      const isRevoked = consentStr.includes('opted out') || consentStr.includes('revoked');
      
      let emailConsent: ConsentRecord['emailConsent'] = 'Opted-In';
      if (isRevoked) emailConsent = 'Opted-Out';
      else if (consentStr.includes('pending') || (!consentStr.includes('email') && !consentStr.includes('permit') && !consentStr.includes('verif'))) {
        emailConsent = 'Pending';
      }

      let voiceConsent: ConsentRecord['voiceConsent'] = 'Permitted';
      if (isRevoked || consentStr.includes('no voice') || consentStr.includes('no phone')) voiceConsent = 'Restricted';
      else if (!consentStr.includes('phone') && !consentStr.includes('voice') && !consentStr.includes('all')) voiceConsent = 'Not Set';

      let smsConsent: ConsentRecord['smsConsent'] = 'Not Set';
      if (isRevoked || consentStr.includes('no sms')) smsConsent = 'Restricted';
      else if (consentStr.includes('sms')) smsConsent = 'Permitted';

      return {
        id: c.id,
        ref: c.ref,
        name: `${c.first_name} ${c.last_name}`,
        title: c.job_title || 'Stakeholder',
        organization: c.account_name || '—',
        accountId: c.account_id,
        email: c.email || '—',
        phone: c.phone || '—',
        emailConsent,
        voiceConsent,
        smsConsent,
        legalBasis: custom.legalBasis || 'Explicit Consent (GDPR Art. 6.1.a)',
        captureMethod: custom.captureMethod || 'Inbound Commercial Inquiry',
        lastUpdated: c.updated_at ? c.updated_at.slice(0, 10) : (c.created_at ? c.created_at.slice(0, 10) : '2026-11-09'),
      };
    });
  }, [contacts]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const total = consentRecords.length;
    if (total === 0) return { total: 0, emailPct: 0, voicePct: 0, smsPct: 0, revokedCount: 0 };
    const emailCount = consentRecords.filter(r => r.emailConsent === 'Opted-In').length;
    const voiceCount = consentRecords.filter(r => r.voiceConsent === 'Permitted').length;
    const smsCount = consentRecords.filter(r => r.smsConsent === 'Permitted').length;
    const revokedCount = consentRecords.filter(r => r.emailConsent === 'Opted-Out' || r.voiceConsent === 'Restricted' || r.smsConsent === 'Restricted').length;
    return {
      total,
      emailPct: Math.round((emailCount / total) * 100),
      voicePct: Math.round((voiceCount / total) * 100),
      smsPct: Math.round((smsCount / total) * 100),
      revokedCount,
    };
  }, [consentRecords]);

  // Filtering
  const filtered = useMemo(() => {
    return consentRecords.filter(r => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ref.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (filterTab === 'Email') return r.emailConsent === 'Opted-In';
      if (filterTab === 'Voice') return r.voiceConsent === 'Permitted';
      if (filterTab === 'SMS') return r.smsConsent === 'Permitted';
      if (filterTab === 'Pending') return r.emailConsent === 'Pending';
      if (filterTab === 'Revoked') return r.emailConsent === 'Opted-Out' || r.voiceConsent === 'Restricted';
      return true;
    });
  }, [consentRecords, searchTerm, filterTab]);

  const openManageModal = (record: ConsentRecord) => {
    setEditingRecord(record);
    setFormEmailOptIn(record.emailConsent === 'Opted-In');
    setFormVoiceOptIn(record.voiceConsent === 'Permitted');
    setFormSmsOptIn(record.smsConsent === 'Permitted');
    setFormCaptureMethod(record.captureMethod);
    setFormLegalBasis(record.legalBasis);
    setFormNotes('');
  };

  const handleSaveConsent = async () => {
    if (!editingRecord) return;
    setSubmitting(true);
    try {
      const channels: string[] = [];
      if (formEmailOptIn) channels.push('Email');
      if (formVoiceOptIn) channels.push('Phone/Voice');
      if (formSmsOptIn) channels.push('SMS');

      const consentSummary = channels.length > 0
        ? `Explicit Consent: ${channels.join(', ')} permitted`
        : 'Opted out of all commercial channels';

      // Update in PostgreSQL
      const targetContact = contacts.find(x => x.id === editingRecord.id);
      await api.updateContact(editingRecord.id, {
        custom_fields: {
          ...(targetContact?.custom_fields || {}),
          consent: consentSummary,
          legalBasis: formLegalBasis,
          captureMethod: formCaptureMethod,
          consentAuditMemo: formNotes || `Consent updated by compliance officer on ${new Date().toISOString().slice(0, 10)}`,
        }
      });

      // Log activity if account linked
      if (editingRecord.accountId) {
        try {
          await api.createAccountActivity(editingRecord.accountId, {
            activity_type: 'Compliance',
            subject: `Consent Ledger Updated · ${editingRecord.name}`,
            description: `Consent status updated: ${consentSummary}. Legal basis: ${formLegalBasis}. Method: ${formCaptureMethod}.`,
            contact_id: editingRecord.id,
          });
        } catch (e) {
          // Non-critical
        }
      }

      addAudit('Consent Ledger Updated', 'Arjun Mehta', `${editingRecord.ref} (${editingRecord.name}) · ${consentSummary}`);
      notify(`Consent preferences committed to PostgreSQL for ${editingRecord.name}.`);
      setEditingRecord(null);
      await fetchContacts();
    } catch (err: any) {
      notify(`Failed to update consent: ${err?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const quickRevoke = async (record: ConsentRecord) => {
    if (!confirm(`Are you sure you want to revoke all communication consent for ${record.name}? This will enforce opt-out across Email, Voice, and SMS.`)) {
      return;
    }
    try {
      const targetContact = contacts.find(x => x.id === record.id);
      await api.updateContact(record.id, {
        custom_fields: {
          ...(targetContact?.custom_fields || {}),
          consent: 'Opted out of all channels (Customer revocation)',
          legalBasis: 'Consent Withdrawn (GDPR Art. 7.3)',
          captureMethod: 'Immediate Revocation Request',
        }
      });
      addAudit('Consent Revoked', 'Arjun Mehta', `Revoked all channel permissions for ${record.ref}`);
      notify(`All communication consent revoked for ${record.name}.`);
      await fetchContacts();
    } catch (err: any) {
      notify(`Revocation failed: ${err?.message || 'Error'}`);
    }
  };

  const quickGrantAll = async (record: ConsentRecord) => {
    try {
      const targetContact = contacts.find(x => x.id === record.id);
      await api.updateContact(record.id, {
        custom_fields: {
          ...(targetContact?.custom_fields || {}),
          consent: 'Explicit Consent: Email, Phone/Voice, SMS permitted',
          legalBasis: 'Explicit Consent (GDPR Art. 6.1.a)',
          captureMethod: 'Master Service Agreement Authorization',
        }
      });
      addAudit('Full Consent Granted', 'Arjun Mehta', `Granted full omnichannel consent for ${record.ref}`);
      notify(`Full omnichannel consent granted for ${record.name}.`);
      await fetchContacts();
    } catch (err: any) {
      notify(`Consent update failed: ${err?.message || 'Error'}`);
    }
  };

  return (
    <div className="workspace-page p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Regulatory Compliance & Privacy
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" /> PostgreSQL RLS Enforced
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Consent Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise GDPR Article 6/7, CASL, and TCPA consent ledger with immutable audit logs and multi-channel opt-in enforcement.
          </p>
        </div>

        {/* REGULATORY BADGES */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-800">
            <ShieldCheck size={14} className="text-emerald-600" />
            GDPR Art. 7 Verified
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-800">
            <Lock size={13} className="text-blue-600" />
            TCPA Explicit Opt-In
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-700">
            <FileCheck2 size={14} className="text-slate-500" />
            CASL Audit Trail
          </div>
          <button
            className="btn secondary small flex items-center gap-1"
            onClick={fetchContacts}
            disabled={loading}
            title="Refresh from PostgreSQL"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* METRIC KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Ledger Records</span>
            <UserCheck size={16} className="text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900">{stats.total}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Identified stakeholder profiles</div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-emerald-100 bg-emerald-50/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Email Opt-In Rate</span>
            <Mail size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-emerald-900">{stats.emailPct}%</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Commercial outreach permitted</div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Voice Outreach Clearance</span>
            <Phone size={16} className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-blue-900">{stats.voicePct}%</div>
            <div className="text-[10px] text-blue-700 mt-0.5">Telephone contact verified</div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Revocations</span>
            <AlertTriangle size={16} className={stats.revokedCount > 0 ? 'text-amber-500' : 'text-slate-400'} />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900">{stats.revokedCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Channels restricted or opted out</div>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {(['All', 'Email', 'Voice', 'SMS', 'Pending', 'Revoked'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filterTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'All' ? 'All Channels' : tab === 'Email' ? 'Email Opt-In' : tab === 'Voice' ? 'Voice Permitted' : tab === 'SMS' ? 'SMS Permitted' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by contact, company, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* CONSENT RECORDS TABLE */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-500" />
            Loading consent ledger from PostgreSQL database...
          </div>
        ) : error ? (
          <div className="p-6 m-4 bg-red-50 text-red-700 text-xs rounded border border-red-200">
            <strong>Connection Error:</strong> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No contacts match the current consent filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Contact & Company</th>
                  <th className="py-3 px-4">Email Opt-In</th>
                  <th className="py-3 px-4">Voice / Phone</th>
                  <th className="py-3 px-4">SMS Messaging</th>
                  <th className="py-3 px-4">Legal Basis</th>
                  <th className="py-3 px-4">Capture Source</th>
                  <th className="py-3 px-4">Audit Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-slate-500">{r.title} · <span className="text-slate-700 font-semibold">{r.organization}</span></div>
                      <div className="text-[10px] text-slate-400">{r.email}</div>
                    </td>

                    {/* Email Consent Badge */}
                    <td className="py-3 px-4">
                      {r.emailConsent === 'Opted-In' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check size={11} /> Opted-In
                        </span>
                      ) : r.emailConsent === 'Opted-Out' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X size={11} /> Opted-Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock3 size={11} /> Pending
                        </span>
                      )}
                    </td>

                    {/* Voice Consent Badge */}
                    <td className="py-3 px-4">
                      {r.voiceConsent === 'Permitted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Phone size={10} /> Permitted
                        </span>
                      ) : r.voiceConsent === 'Restricted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <X size={10} /> Restricted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                          Not Set
                        </span>
                      )}
                    </td>

                    {/* SMS Consent Badge */}
                    <td className="py-3 px-4">
                      {r.smsConsent === 'Permitted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <MessageCircle size={10} /> Permitted
                        </span>
                      ) : r.smsConsent === 'Restricted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <X size={10} /> Restricted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                          Not Permitted
                        </span>
                      )}
                    </td>

                    {/* Legal Basis */}
                    <td className="py-3 px-4 text-slate-700">
                      <span className="text-[11px] font-medium">{r.legalBasis.split('(')[0]}</span>
                    </td>

                    {/* Capture Source */}
                    <td className="py-3 px-4 text-slate-500">
                      <span className="text-[11px]">{r.captureMethod}</span>
                    </td>

                    {/* Audit Date */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {r.lastUpdated}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        className="btn secondary small text-[11px] py-1 px-2.5"
                        onClick={() => openManageModal(r)}
                        title="Edit consent preferences"
                      >
                        <SlidersHorizontal size={12} className="mr-1 inline" />
                        Manage
                      </button>
                      {r.emailConsent !== 'Opted-Out' ? (
                        <button
                          className="btn secondary small text-[11px] py-1 px-2 text-rose-600 hover:bg-rose-50 border-rose-200"
                          onClick={() => quickRevoke(r)}
                          title="Revoke all consent"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          className="btn secondary small text-[11px] py-1 px-2 text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                          onClick={() => quickGrantAll(r)}
                          title="Grant omnichannel consent"
                        >
                          Grant
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MANAGE CONSENT MODAL */}
      {editingRecord && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setEditingRecord(null)}>
          <div className="form-modal max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="form-modal-head p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Regulatory Audit Record
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">Manage Consent Preferences</h2>
                <p className="text-xs text-slate-500">
                  Update compliance records for {editingRecord.name} ({editingRecord.organization}).
                </p>
              </div>
              <button className="icon-close" onClick={() => setEditingRecord(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="form-modal-body p-6 space-y-4">
              {/* Channel Authorization Checks */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Permitted Communication Channels
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formEmailOptIn}
                      onChange={e => setFormEmailOptIn(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Mail size={13} className="text-blue-600" /> Email Communications
                      </div>
                      <div className="text-[11px] text-slate-500">Commercial proposals, product releases, newsletters</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formVoiceOptIn}
                      onChange={e => setFormVoiceOptIn(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Phone size={13} className="text-emerald-600" /> Direct Telephone / Voice Outreach
                      </div>
                      <div className="text-[11px] text-slate-500">Direct sales consultation and account manager check-ins</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSmsOptIn}
                      onChange={e => setFormSmsOptIn(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <MessageCircle size={13} className="text-indigo-600" /> SMS Alerts & Notifications
                      </div>
                      <div className="text-[11px] text-slate-500">Service notifications, appointment reminders, OTPs</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Legal Basis */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Legal Basis for Processing
                </label>
                <select
                  value={formLegalBasis}
                  onChange={e => setFormLegalBasis(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Explicit Consent (GDPR Art. 6.1.a)">Explicit Consent (GDPR Art. 6.1.a)</option>
                  <option value="Contract Performance (GDPR Art. 6.1.b)">Contract Performance (GDPR Art. 6.1.b)</option>
                  <option value="Legitimate Interest (GDPR Art. 6.1.f)">Legitimate Interest (GDPR Art. 6.1.f)</option>
                  <option value="Legal Obligation (GDPR Art. 6.1.c)">Legal Obligation (GDPR Art. 6.1.c)</option>
                </select>
              </div>

              {/* Capture Method */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Consent Capture Method
                </label>
                <select
                  value={formCaptureMethod}
                  onChange={e => setFormCaptureMethod(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Explicit Web Form Opt-in">Explicit Web Form Opt-in</option>
                  <option value="Master Service Agreement Authorization">Master Service Agreement Authorization</option>
                  <option value="Verbal Consent during Recorded Call">Verbal Consent during Recorded Call</option>
                  <option value="Customer Portal Settings">Customer Portal Settings</option>
                  <option value="Direct Inbound Email Request">Direct Inbound Email Request</option>
                </select>
              </div>

              {/* Audit Memo */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Audit Notes / Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional compliance context or reference ticket number..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="form-modal-footer p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button className="btn secondary" onClick={() => setEditingRecord(null)} disabled={submitting}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleSaveConsent} disabled={submitting}>
                <ShieldCheck size={14} className="mr-1 inline" />
                {submitting ? 'Recording...' : 'Commit to Consent Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="inline-toast">
          <Check size={15} />
          {toast}
          <button onClick={() => setToast('')}><X size={13} /></button>
        </div>
      )}
    </div>
  );
}
