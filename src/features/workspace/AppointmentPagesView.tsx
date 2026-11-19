import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, RefreshCw, CheckCircle2, Clock,
  User, Mail, ShieldCheck, X, Check, Calendar, ArrowRight
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, AppointmentTypeItem, CustomerAppointmentItem } from '../../services/api';

export function AppointmentPagesView() {
  const [types, setTypes] = useState<AppointmentTypeItem[]>([]);
  const [appointments, setAppointments] = useState<CustomerAppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Appointment Type Modal
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeSlug, setTypeSlug] = useState('');
  const [typeDuration, setTypeDuration] = useState('45');
  const [typeBuffer, setTypeBuffer] = useState('15');
  const [typeHost, setTypeHost] = useState('Senior Solutions Architect');
  const [typeDescription, setTypeDescription] = useState('');
  const [creatingType, setCreatingType] = useState(false);

  // Book Appointment Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookTypeId, setBookTypeId] = useState('');
  const [bookCustomerName, setBookCustomerName] = useState('Elena Rostova');
  const [bookCustomerEmail, setBookCustomerEmail] = useState('elena.rostova@novatech.example');
  const [bookDate, setBookDate] = useState('2026-11-25');
  const [bookTime, setBookTime] = useState('14:00');
  const [bookNotes, setBookNotes] = useState('Review architecture and SLA requirements.');
  const [booking, setBooking] = useState(false);

  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesRes, apptsRes] = await Promise.all([
        api.listAppointmentTypes(),
        api.listCustomerAppointments({ limit: 50 })
      ]);
      setTypes(typesRes || []);
      setAppointments(apptsRes || []);
      if (typesRes && typesRes.length > 0 && !bookTypeId) {
        setBookTypeId(typesRes[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load appointment configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) return;
    setCreatingType(true);
    try {
      const newType = await api.createAppointmentType({
        name: typeName.trim(),
        slug: typeSlug.trim().toLowerCase().replace(/\s+/g, '-') || typeName.trim().toLowerCase().replace(/\s+/g, '-'),
        duration_minutes: Number(typeDuration) || 45,
        buffer_minutes: Number(typeBuffer) || 15,
        assigned_user_name: typeHost,
        description: typeDescription.trim(),
        is_active: true
      });
      setTypes(prev => [...prev, newType]);
      setShowTypeModal(false);
      setTypeName('');
      setTypeSlug('');
      setTypeDescription('');
      notify(`Appointment type ${newType.name} created.`);
    } catch (err: any) {
      notify(`Failed to create: ${err?.message || 'Error'}`);
    } finally {
      setCreatingType(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTypeId || !bookCustomerName.trim() || !bookCustomerEmail.trim()) return;
    setBooking(true);
    try {
      const startTime = new Date(`${bookDate}T${bookTime}:00Z`).toISOString();
      const endTime = new Date(new Date(startTime).getTime() + 45 * 60000).toISOString();
      const booked = await api.bookCustomerAppointment({
        appointment_type_id: bookTypeId,
        customer_name: bookCustomerName.trim(),
        customer_email: bookCustomerEmail.trim(),
        start_time: startTime,
        end_time: endTime,
        notes: bookNotes.trim() || undefined,
        assigned_user_name: 'Senior Solutions Architect',
        status: 'Scheduled'
      });
      setAppointments(prev => [booked, ...prev]);
      setShowBookModal(false);
      notify(`Appointment ${booked.ref} confirmed for ${bookCustomerName}!`);
    } catch (err: any) {
      notify(`Booking error: ${err?.message || 'Error booking appointment'}`);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <SectionHeading
        eyebrow="SERVICE ADMINISTRATION / CLIENT CONSULTATION"
        title="Appointment Pages & Scheduling"
        subtitle="Manage customer consultation types, duration windows, specialist calendars, and scheduled client booking records."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="btn secondary flex items-center gap-1.5 text-xs py-2 px-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowBookModal(true)}
              className="btn secondary flex items-center gap-1.5 text-xs py-2 px-3 text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 font-bold rounded-lg"
            >
              <Calendar size={13} />
              <span>Book Consultation</span>
            </button>
            <button
              onClick={() => setShowTypeModal(true)}
              className="btn primary bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm rounded-lg"
            >
              <Plus size={14} />
              <span>New Appointment Type</span>
            </button>
          </div>
        }
      />

      {/* Appointment Types Cards */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Configured Consultation Types ({types.length})
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {types.map(t => (
            <div
              key={t.id}
              className="panel p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-3 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  {t.ref}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  AVAILABLE
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{t.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock size={12} />
                    <span>Duration:</span>
                  </span>
                  <span className="font-bold text-slate-800">{t.duration_minutes} mins</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <User size={12} />
                    <span>Host:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{t.assigned_user_name || 'Assigned Lead'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Bookings Ledger */}
      <div className="panel bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden space-y-3">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Scheduled Client Consultations Ledger</h3>
            <p className="text-xs text-slate-500">Live roster of confirmed and upcoming client appointments.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {appointments.length} scheduled bookings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Customer Name & Email</th>
                <th className="py-3 px-4">Consultation Topic / Notes</th>
                <th className="py-3 px-4">Scheduled Date & Time</th>
                <th className="py-3 px-4">Assigned Host Lead</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length > 0 ? (
                appointments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600">{a.ref}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{a.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{a.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 font-medium">
                      {a.notes || 'Technical Consultation'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">
                      {a.start_time ? a.start_time.slice(0, 16).replace('T', ' ') : 'Upcoming'} UTC
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {a.assigned_user_name || 'Senior Solutions Architect'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {a.status || 'Scheduled'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No appointments booked yet. Click &quot;Book Consultation&quot; above to schedule a session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Consultation Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">Book Client Consultation</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Consultation Service</label>
                <select
                  value={bookTypeId}
                  onChange={e => setBookTypeId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes} min)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={bookCustomerName}
                    onChange={e => setBookCustomerName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    required
                    value={bookCustomerEmail}
                    onChange={e => setBookCustomerEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Booking Date</label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={e => setBookDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time (UTC)</label>
                  <input
                    type="time"
                    required
                    value={bookTime}
                    onChange={e => setBookTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Agenda / Meeting Notes</label>
                <textarea
                  rows={2}
                  value={bookNotes}
                  onChange={e => setBookNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="btn secondary py-1.5 px-3 text-slate-700 bg-white border border-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="btn primary py-1.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded"
                >
                  {booking ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Appointment Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">New Consultation Type</h3>
              <button onClick={() => setShowTypeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateType} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Consultation Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Go-Live Readiness Review"
                  value={typeName}
                  onChange={e => setTypeName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    step="15"
                    min="15"
                    required
                    value={typeDuration}
                    onChange={e => setTypeDuration(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Buffer Time (Mins)</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    required
                    value={typeBuffer}
                    onChange={e => setTypeBuffer(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Host Specialist Title</label>
                <input
                  type="text"
                  required
                  value={typeHost}
                  onChange={e => setTypeHost(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scope & Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe consultation objectives and prerequisites..."
                  value={typeDescription}
                  onChange={e => setTypeDescription(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="btn secondary py-1.5 px-3 text-slate-700 bg-white border border-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingType}
                  className="btn primary py-1.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded"
                >
                  {creatingType ? 'Creating...' : 'Create Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}