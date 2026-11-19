import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Clock, Globe2, Plus, RefreshCw, CheckCircle2,
  AlertCircle, ShieldCheck, X, Check, Save, Calendar
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { api, BusinessHoursItem, BusinessHolidayItem } from '../../services/api';

interface DayConfig {
  active: boolean;
  open: string;
  close: string;
}

export function BusinessHoursView() {
  const [businessHours, setBusinessHours] = useState<BusinessHoursItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timezone, setTimezone] = useState('UTC');
  const [name, setName] = useState('Standard Enterprise Support (UTC)');
  const [schedule, setSchedule] = useState<Record<string, DayConfig>>({
    monday: { active: true, open: '09:00', close: '17:00' },
    tuesday: { active: true, open: '09:00', close: '17:00' },
    wednesday: { active: true, open: '09:00', close: '17:00' },
    thursday: { active: true, open: '09:00', close: '17:00' },
    friday: { active: true, open: '09:00', close: '17:00' },
    saturday: { active: false, open: '00:00', close: '00:00' },
    sunday: { active: false, open: '00:00', close: '00:00' },
  });

  const [holidays, setHolidays] = useState<BusinessHolidayItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Add Holiday Modal
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('2027-01-01');
  const [addingHoliday, setAddingHoliday] = useState(false);

  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listBusinessHours();
      if (res && res.length > 0) {
        const bh = res[0];
        setBusinessHours(bh);
        setName(bh.name);
        setTimezone(bh.timezone || 'UTC');
        if (bh.schedule_config) {
          setSchedule(bh.schedule_config as any);
        }
        setHolidays(bh.holidays || []);
      } else {
        // Initialize default enterprise business hours in PostgreSQL
        const created = await api.createBusinessHours({
          name: 'Standard Enterprise Support (UTC)',
          timezone: 'UTC',
          is_default: true,
          schedule_config: schedule,
        });
        setBusinessHours(created);
        setHolidays(created.holidays || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load business hours calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDayToggle = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        active: !prev[day].active,
      }
    }));
  };

  const handleTimeChange = (day: string, field: 'open' | 'close', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const res = await api.createBusinessHours({
        name,
        timezone,
        is_default: true,
        schedule_config: schedule,
      });
      setBusinessHours(res);
      notify('Operating schedule saved to database.');
    } catch (err: any) {
      notify(`Save failed: ${err?.message || 'Error saving schedule'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessHours || !holidayName.trim()) return;
    setAddingHoliday(true);
    try {
      const newHol = await api.addBusinessHoliday(businessHours.id, {
        name: holidayName.trim(),
        holiday_date: holidayDate,
      });
      setHolidays(prev => [...prev, newHol]);
      setShowHolidayModal(false);
      setHolidayName('');
      notify(`Holiday ${newHol.name} added to calendar.`);
    } catch (err: any) {
      notify(`Failed to add holiday: ${err?.message || 'Error'}`);
    } finally {
      setAddingHoliday(false);
    }
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <SectionHeading
        eyebrow="SERVICE ADMINISTRATION / OPERATIONAL SCHEDULE"
        title="Business Hours & SLA Calendars"
        subtitle="Define global support availability windows, working days, timezones, and official company holidays that pause SLA resolution clocks."
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
              onClick={handleSaveSchedule}
              disabled={saving}
              className="btn primary bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm rounded-lg"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Schedule'}</span>
            </button>
          </div>
        }
      />

      {/* Overview Configuration Banner */}
      <div className="panel p-5 bg-white border border-slate-200 shadow-sm rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Calendar Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Operational Timezone
            </label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="UTC">UTC (Universal Coordinated Time)</option>
              <option value="America/New_York">US Eastern (EST / EDT)</option>
              <option value="America/Los_Angeles">US Pacific (PST / PDT)</option>
              <option value="Europe/London">London (GMT / BST)</option>
              <option value="Europe/Berlin">Central Europe (CET / CEST)</option>
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-sky-50 text-sky-700 flex items-center gap-2 border border-sky-200 w-full">
              <ShieldCheck size={20} className="shrink-0 text-sky-600" />
              <div className="text-xs">
                <span className="font-bold block">Active SLA Governance</span>
                <span className="text-slate-600">SLA timers pause automatically outside these operating hours.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Operating Hours Schedule */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm rounded-xl lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Working Hours</h3>
              <p className="text-xs text-slate-500">Enable active shifts and configure support open/close hours.</p>
            </div>
            <Clock size={16} className="text-slate-400" />
          </div>

          <div className="space-y-2.5">
            {daysOfWeek.map(day => {
              const cfg = schedule[day] || { active: false, open: '09:00', close: '17:00' };
              const capDay = day.charAt(0).toUpperCase() + day.slice(1);
              return (
                <div
                  key={day}
                  className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                    cfg.active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 w-36">
                    <input
                      type="checkbox"
                      checked={cfg.active}
                      onChange={() => handleDayToggle(day)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">{capDay}</span>
                  </div>

                  {cfg.active ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Opens:</span>
                      <input
                        type="time"
                        value={cfg.open}
                        onChange={e => handleTimeChange(day, 'open', e.target.value)}
                        className="p-1 rounded border border-slate-300 text-slate-800 font-medium"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={cfg.close}
                        onChange={e => handleTimeChange(day, 'close', e.target.value)}
                        className="p-1 rounded border border-slate-300 text-slate-800 font-medium"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 italic">Closed (SLA Paused)</span>
                  )}

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    cfg.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cfg.active ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Company Holidays & Paused Windows */}
        <div className="panel p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">SLA Holiday Calendar</h3>
              <p className="text-xs text-slate-500">Official holidays where SLA commitments are paused.</p>
            </div>
            <button
              onClick={() => setShowHolidayModal(true)}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Add Holiday</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {holidays.length > 0 ? (
              holidays.map(h => (
                <div key={h.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{h.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{h.holiday_date}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    SLA PAUSED
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                <CalendarDays size={24} className="mx-auto mb-2 text-slate-300" />
                <p>No holidays registered yet.</p>
                <p className="text-[11px] mt-0.5">Click &quot;Add Holiday&quot; to configure observance dates.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">Add Service Holiday</h3>
              <button onClick={() => setShowHolidayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Christmas Day"
                  value={holidayName}
                  onChange={e => setHolidayName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observance Date</label>
                <input
                  type="date"
                  required
                  value={holidayDate}
                  onChange={e => setHolidayDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="btn secondary py-1.5 px-3 text-slate-700 bg-white border border-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingHoliday}
                  className="btn primary py-1.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded"
                >
                  {addingHoliday ? 'Adding...' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}