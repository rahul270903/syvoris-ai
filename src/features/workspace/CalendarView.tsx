import { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, Plus,
  Users, Check, X, Building2, MapPin, Video, Copy, ExternalLink,
  ShieldCheck, RefreshCw
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { api, AccountItem } from '../../services/api';

export interface CalEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  type: 'Meeting' | 'Demo' | 'Milestone' | 'SLA' | 'Review' | 'Task' | 'Deadline';
  account: string;
  attendees: string[];
  location: string;
  description: string;
}

const defaultEvents: CalEvent[] = [
  {
    id: 'cal-1',
    title: 'Enterprise Architecture & SLA Alignment',
    date: '2026-11-09',
    time: '10:00 AM - 11:00 AM',
    type: 'Meeting',
    account: 'NovaTech Solutions',
    attendees: ['Marcus Vance', 'Arjun Mehta', 'Principal Architect'],
    location: 'Microsoft Teams (Virtual)',
    description: 'Review failover clustering, multi-region database latency, and 99.99% uptime guarantees.'
  },
  {
    id: 'cal-2',
    title: 'Executive Contract Sign-off Sync',
    date: '2026-11-09',
    time: '02:30 PM - 03:15 PM',
    type: 'Review',
    account: 'Horizon Healthtech',
    attendees: ['Devon Wright', 'VP Sales'],
    location: 'Zoom Conference',
    description: 'Finalize HIPAA BAA rider and review purchase order PO-2026-992 release schedule.'
  },
  {
    id: 'cal-3',
    title: 'Logistics Fleet Telematics Solution Walkthrough',
    date: '2026-11-10',
    time: '11:00 AM - 12:00 PM',
    type: 'Demo',
    account: 'Apex Global Logistics',
    attendees: ['Elena Rostova', 'Fleet Ops Director', 'Solutions Engineer'],
    location: 'Google Meet',
    description: 'Technical review of real-time route optimization engine and ERP inventory bridge.'
  },
  {
    id: 'cal-4',
    title: 'Security Compliance & SOC2 Type II Audit Check',
    date: '2026-11-11',
    time: '09:00 AM - 10:30 AM',
    type: 'Milestone',
    account: 'QuantumCore Systems',
    attendees: ['Vikram Mehta', 'Chief Information Security Officer'],
    location: 'HQ Conference Room A',
    description: 'Review external penetration testing results and encryption key custody architecture.'
  },
  {
    id: 'cal-5',
    title: 'Quarterly Business Review (QBR)',
    date: '2026-11-12',
    time: '01:00 PM - 02:30 PM',
    type: 'Review',
    account: 'AeroDynamics Ltd',
    attendees: ['Sarah Jenkins', 'Customer Success Director'],
    location: 'Virtual Conference',
    description: 'Review product adoption metrics, license utilization, and planned 2027 seat expansion.'
  },
  {
    id: 'cal-6',
    title: 'Tier-1 Service Escalation SLA Deadline',
    date: '2026-11-13',
    time: '05:00 PM',
    type: 'SLA',
    account: 'Apex Global Logistics',
    attendees: ['Support Team Lead', 'Integration Specialist'],
    location: 'Support Queue',
    description: 'Mandatory resolution deadline for webhook payload timeout issue (CAS-2026-104).'
  },
  {
    id: 'cal-7',
    title: 'Telematics Gateway API Sign-off',
    date: '2026-11-18',
    time: '03:00 PM - 04:00 PM',
    type: 'Milestone',
    account: 'Apex Global Logistics',
    attendees: ['Arjun Mehta', 'Engineering Lead'],
    location: 'Virtual Conference',
    description: 'Verification of MQTT payload throughput and latency benchmarks.'
  },
  {
    id: 'cal-8',
    title: 'Data Migration Dual-Run Cutover',
    date: '2026-11-20',
    time: '09:00 AM - 10:30 AM',
    type: 'Milestone',
    account: 'NovaTech Solutions',
    attendees: ['Elena Rostova', 'DevOps Team'],
    location: 'Cloud Operations Center',
    description: 'Continuous zero-loss replication pipeline check with latency below 100ms.'
  }
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CalendarView() {
  const { addEvent, addAudit } = useCRM();

  // Active view date: year & month index (0-11)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10); // 10 = November
  const [events, setEvents] = useState<CalEvent[]>(defaultEvents);
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(defaultEvents[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [toast, setToast] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  // Load backend calendar events and accounts
  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const [liveList, accList] = await Promise.all([
        api.listProjectCalendarEvents().catch(() => []),
        api.listAccounts({ limit: 50 }).then(r => r?.items || []).catch(() => [])
      ]);

      if (accList && accList.length > 0) {
        setAccounts(accList);
      }

      if (liveList && liveList.length > 0) {
        const mapped: CalEvent[] = liveList.map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
          time: e.time || '10:00 AM - 11:00 AM',
          type: (['Milestone', 'Task', 'Deadline', 'Meeting', 'Demo', 'SLA', 'Review'].includes(e.type)
            ? e.type
            : 'Milestone') as any,
          account: e.account_name || e.project_name || 'Enterprise Project',
          attendees: [e.owner || 'Arjun Mehta', 'Project Team'],
          location: `${e.project_ref || 'PRJ'} Workspace`,
          description: e.description || `Delivery milestone / event for ${e.project_name}`,
        }));

        setEvents(prev => {
          const ids = new Set(mapped.map(m => m.id));
          return [...mapped, ...prev.filter(p => !ids.has(p.id))];
        });

        if (mapped.length > 0 && !selectedEvent) {
          setSelectedEvent(mapped[0]);
        }
      }
    } catch (err) {
      console.warn('Calendar sync:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  // Form State for Scheduling New Event
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '2026-11-20',
    time: '02:00 PM - 03:00 PM',
    type: 'Meeting' as CalEvent['type'],
    account: 'NovaTech Solutions',
    attendees: 'Arjun Mehta, Client Lead',
    location: 'Google Meet (Virtual)',
    description: '',
  });

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(10); // November 2026
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (filterType === 'All') return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  // Compute Days for the active month grid
  const daysInGrid = useMemo(() => {
    // Total days in current month
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    // First day of month (0 = Sun, 1 = Mon, ... 6 = Sat)
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const result = [];
    // Leading days from previous month
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      result.push({
        day: dayNum,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      // Today is Nov 20, 2026 in app context
      const isToday = currentYear === 2026 && currentMonth === 10 && d === 20;
      result.push({
        day: d,
        date: dateStr,
        isCurrentMonth: true,
        isToday,
      });
    }

    // Trailing days from next month to complete row of 7
    const remaining = (7 - (result.length % 7)) % 7;
    for (let j = 1; j <= remaining; j++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
      result.push({
        day: j,
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return result;
  }, [currentYear, currentMonth]);

  // Handle Save New Appointment
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) {
      notify('Event title is required.');
      return;
    }

    const created: CalEvent = {
      id: `cal-${Date.now()}`,
      title: newEvent.title.trim(),
      date: newEvent.date,
      time: newEvent.time,
      type: newEvent.type,
      account: newEvent.account,
      attendees: newEvent.attendees.split(',').map(s => s.trim()),
      location: newEvent.location,
      description: newEvent.description || 'Enterprise consultation and roadmap review.',
    };

    setEvents(prev => [created, ...prev]);
    setSelectedEvent(created);
    setShowAddModal(false);

    // Sync to PostgreSQL backend activities
    try {
      const targetAcc = accounts.find(a => a.name.toLowerCase().includes(newEvent.account.toLowerCase())) || accounts[0];
      if (targetAcc) {
        await api.createAccountActivity(targetAcc.id, {
          activity_type: created.type === 'Meeting' ? 'Meeting' : 'Call',
          subject: `${created.type}: ${created.title}`,
          description: `${created.description} Location: ${created.location}. Attendees: ${created.attendees.join(', ')}`,
        });
      }
    } catch (err) {
      console.warn('Sync to backend:', err);
    }

    addEvent('calendar.event_created', { ref: created.id }, `Scheduled ${created.type}: ${created.title}`);
    addAudit('Calendar Event Created', 'Arjun Mehta', `${created.title} on ${created.date}`);
    notify(`Appointment "${created.title}" scheduled & synced to Customer Timeline.`);

    setNewEvent({
      title: '',
      date: '2026-11-20',
      time: '02:00 PM - 03:00 PM',
      type: 'Meeting',
      account: accounts.length > 0 ? accounts[0].name : 'NovaTech Solutions',
      attendees: 'Arjun Mehta, Client Stakeholder',
      location: 'Google Meet (Virtual)',
      description: '',
    });
  };

  const badgeColor = (t: CalEvent['type']) => {
    switch (t) {
      case 'Meeting': return 'bg-sky-500/15 text-sky-300 border-sky-500/40';
      case 'Demo': return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
      case 'Milestone': return 'bg-purple-500/15 text-purple-300 border-purple-500/40';
      case 'Task': return 'bg-blue-500/15 text-blue-300 border-blue-500/40';
      case 'Deadline': return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case 'SLA': return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      case 'Review': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-200 text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <ShieldCheck size={16} className="text-cyan-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <SectionHeading
        eyebrow="COLLABORATION & PRODUCTIVITY / CALENDAR"
        title="Enterprise CRM Calendar"
        subtitle="Manage customer discovery calls, executive reviews, project delivery milestones, and SLA targets."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadCalendarData}
              className="btn secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Refresh Calendar"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                if (accounts.length > 0 && !newEvent.account) {
                  setNewEvent(prev => ({ ...prev, account: accounts[0].name }));
                }
                setShowAddModal(true);
              }}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>Schedule Event</span>
            </button>
          </div>
        }
      />

      {/* Filter and Month Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-sm font-bold text-slate-100 flex items-center gap-2 px-2">
            <CalendarDays size={16} className="text-cyan-400" />
            <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={handleToday}
            className="ml-2 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 rounded-md transition-colors"
          >
            Current Date
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 text-xs bg-slate-950/70 p-1 rounded-lg border border-slate-800/80">
          {['All', 'Milestone', 'Task', 'Deadline', 'Meeting', 'Demo', 'SLA', 'Review'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterType === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Calendar Month Grid */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 mb-2">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {daysInGrid.map((d, index) => {
              const dayEvents = filteredEvents.filter(e => e.date === d.date);
              const isSelected = selectedEvent?.date === d.date;

              return (
                <div
                  key={`${d.date}-${index}`}
                  onClick={() => {
                    if (dayEvents.length > 0) setSelectedEvent(dayEvents[0]);
                  }}
                  className={`min-h-[102px] p-2 rounded-lg border transition-all text-left flex flex-col justify-between cursor-pointer ${
                    d.isToday
                      ? 'border-cyan-500/80 bg-cyan-950/20 shadow-xs'
                      : isSelected
                      ? 'border-indigo-500/70 bg-indigo-950/25'
                      : d.isCurrentMonth
                      ? 'border-slate-800/80 hover:border-slate-700 bg-slate-950/50'
                      : 'border-slate-800/40 bg-slate-950/20 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${d.isToday ? 'text-cyan-400 font-bold' : d.isCurrentMonth ? 'text-slate-300' : 'text-slate-500'}`}>
                      {d.day}
                    </span>
                    {d.isToday && (
                      <span className="text-[9px] bg-cyan-500 text-slate-950 px-1 py-0.2 rounded font-black tracking-wide">
                        TODAY
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.map(e => (
                      <div
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedEvent(e);
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded border truncate font-medium ${badgeColor(e.type)}`}
                        title={`${e.time}: ${e.title}`}
                      >
                        {e.title}
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-500 text-right">
                    {dayEvents.length > 0 ? `${dayEvents.length} scheduled` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Event Details Panel */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${badgeColor(selectedEvent.type)}`}>
                    {selectedEvent.type}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-2 leading-snug">
                    {selectedEvent.title}
                  </h3>
                </div>
                <StatusPill status="Scheduled" />
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-cyan-400" />
                  <span className="font-semibold text-slate-100">{selectedEvent.date}</span>
                  <span className="text-slate-600">·</span>
                  <span>{selectedEvent.time}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-slate-200 font-semibold">{selectedEvent.account}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="text-slate-300">{selectedEvent.location}</span>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <Users size={14} className="text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-400">Attendees:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEvent.attendees.map(a => (
                        <span key={a} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] border border-slate-700/60 font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs text-slate-300 leading-relaxed">
                <div className="font-semibold text-slate-200 mb-1">Meeting Agenda & Notes</div>
                {selectedEvent.description}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="w-full sm:flex-1 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-colors shadow-sm"
                >
                  <Video size={14} />
                  <span>Join Video Conference</span>
                </button>
                <button
                  onClick={() => {
                    notify(`Calendar invite & ICS file forwarded to ${selectedEvent.attendees.join(', ')}.`);
                    addAudit('Calendar Invite Resent', 'Arjun Mehta', `Invite dispatched for ${selectedEvent.title}`);
                  }}
                  className="w-full sm:w-auto btn secondary text-xs py-2 px-3 flex items-center justify-center gap-1"
                >
                  <Clock size={13} />
                  <span>Resend Invite</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs py-16">
              Select an appointment or date on the calendar to inspect details.
            </div>
          )}

          <div className="mt-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-400">
            <strong className="text-cyan-400">Enterprise CRM Sync:</strong> All scheduled events automatically synchronize with the Customer Activity Timeline, Milestones, and PostgreSQL audit stream.
          </div>
        </div>
      </div>

      {/* Video Conference Launcher Modal */}
      {showVideoModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Video Conference Room</h3>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Session:</span>
                <div className="text-sm font-bold text-slate-100 mt-0.5">{selectedEvent.title}</div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">Meeting Link</span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-cyan-300 truncate">https://meet.google.com/syv-{selectedEvent.id.slice(0, 8)}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(`https://meet.google.com/syv-${selectedEvent.id.slice(0, 8)}`);
                        notify('Meeting URL copied to clipboard.');
                      }}
                      className="text-slate-400 hover:text-slate-200 p-1"
                      title="Copy Meeting URL"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-sans">Meeting ID</span>
                    <span className="text-slate-200">syv-{selectedEvent.id.slice(0, 8)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-sans">Passcode</span>
                    <span className="text-slate-200">2026-HQ</span>
                  </div>
                </div>
              </div>

              <div className="text-slate-400 text-[11px]">
                Attendees: <strong className="text-slate-200">{selectedEvent.attendees.join(', ')}</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="btn secondary py-1.5 px-3 text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const roomUrl = `https://meet.google.com/syv-${selectedEvent.id.slice(0, 8)}`;
                    window.open(roomUrl, '_blank', 'noopener,noreferrer');
                    notify(`Joined video conference: ${selectedEvent.title}`);
                    addEvent('meeting.joined', { ref: selectedEvent.id }, `Joined video conference: ${selectedEvent.title}`);
                    setShowVideoModal(false);
                  }}
                  className="btn primary py-1.5 px-4 text-xs flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold"
                >
                  <ExternalLink size={13} />
                  <span>Launch Video Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Schedule Calendar Event</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Solution Architecture & CPQ Proposal Review"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Time Slot *</label>
                  <input
                    type="text"
                    placeholder="e.g. 02:00 PM - 03:00 PM"
                    value={newEvent.time}
                    onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Event Type</label>
                  <select
                    value={newEvent.type}
                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Demo">Solution Demo</option>
                    <option value="Milestone">Milestone Review</option>
                    <option value="SLA">SLA Critical Deadline</option>
                    <option value="Review">Executive Review</option>
                    <option value="Task">Task Checkpoint</option>
                    <option value="Deadline">Commercial Deadline</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Customer / Organization *</label>
                  {accounts.length > 0 ? (
                    <select
                      value={newEvent.account}
                      onChange={e => setNewEvent({ ...newEvent, account: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.name}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. NovaTech Solutions"
                      value={newEvent.account}
                      onChange={e => setNewEvent({ ...newEvent, account: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Attendees (comma separated)</label>
                <input
                  type="text"
                  placeholder="Arjun Mehta, Marcus Vance, Elena Rostova"
                  value={newEvent.attendees}
                  onChange={e => setNewEvent({ ...newEvent, attendees: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Location or Virtual Channel</label>
                <input
                  type="text"
                  placeholder="e.g. Google Meet, Microsoft Teams, HQ Boardroom"
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Meeting Agenda & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Meeting agenda items, deliverables to inspect, and decisions to ratify..."
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn secondary py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary py-1.5 px-4 text-xs flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
