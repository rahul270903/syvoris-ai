import { useState, useMemo } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, Plus,
  Users, Check, X, Building2, MapPin
} from 'lucide-react';
import { useCRM } from '../../store/CRMStore';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';

interface CalEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'Meeting' | 'Demo' | 'Milestone' | 'SLA' | 'Review';
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
    attendees: ['Marcus Vance', 'Demo User', 'Principal Architect'],
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
    title: 'Logistics Fleet Telematics Solution Demo',
    date: '2026-11-10',
    time: '11:00 AM - 12:00 PM',
    type: 'Demo',
    account: 'Apex Global Logistics',
    attendees: ['Elena Rostova', 'Fleet Ops Director', 'Solutions Engineer'],
    location: 'Google Meet',
    description: 'Interactive demonstration of real-time route optimization engine and ERP inventory bridge.'
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
  }
];

export function CalendarView() {
  const { addEvent, addAudit } = useCRM();

  const [currentDate, setCurrentDate] = useState('November 2026');
  const [events, setEvents] = useState<CalEvent[]>(defaultEvents);
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(defaultEvents[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState('');

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '2026-11-10',
    time: '02:00 PM - 03:00 PM',
    type: 'Meeting' as CalEvent['type'],
    account: 'NovaTech Solutions',
    attendees: 'Demo User, Client Stakeholder',
    location: 'Virtual Conference (Teams)',
    description: '',
  });

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const filteredEvents = useMemo(() => {
    if (filterType === 'All') return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  const handleSaveEvent = () => {
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
      description: newEvent.description || 'Calendar appointment scheduled.',
    };
    setEvents(prev => [...prev, created]);
    setSelectedEvent(created);
    setShowAddModal(false);
    addEvent('calendar.event_created', { ref: created.id }, `Scheduled ${created.type}: ${created.title}`);
    addAudit('Calendar Event Created', 'Demo User', `${created.title} on ${created.date}`);
    notify(`Appointment "${created.title}" scheduled successfully.`);
    setNewEvent({
      title: '',
      date: '2026-11-10',
      time: '02:00 PM - 03:00 PM',
      type: 'Meeting',
      account: 'NovaTech Solutions',
      attendees: 'Demo User, Client Stakeholder',
      location: 'Virtual Conference (Teams)',
      description: '',
    });
  };

  const daysInGrid = [
    { day: 1, date: '2026-11-01' }, { day: 2, date: '2026-11-02' }, { day: 3, date: '2026-11-03' },
    { day: 4, date: '2026-11-04' }, { day: 5, date: '2026-11-05' }, { day: 6, date: '2026-11-06' },
    { day: 7, date: '2026-11-07' }, { day: 8, date: '2026-11-08' }, { day: 9, date: '2026-11-09', isToday: true },
    { day: 10, date: '2026-11-10' }, { day: 11, date: '2026-11-11' }, { day: 12, date: '2026-11-12' },
    { day: 13, date: '2026-11-13' }, { day: 14, date: '2026-11-14' }, { day: 15, date: '2026-11-15' },
    { day: 16, date: '2026-11-16' }, { day: 17, date: '2026-11-17' }, { day: 18, date: '2026-11-18' },
    { day: 19, date: '2026-11-19' }, { day: 20, date: '2026-11-20' }, { day: 21, date: '2026-11-21' },
    { day: 22, date: '2026-11-22' }, { day: 23, date: '2026-11-23' }, { day: 24, date: '2026-11-24' },
    { day: 25, date: '2026-11-25' }, { day: 26, date: '2026-11-26' }, { day: 27, date: '2026-11-27' },
    { day: 28, date: '2026-11-28' }, { day: 29, date: '2026-11-29' }, { day: 30, date: '2026-11-30' },
  ];

  const badgeColor = (t: CalEvent['type']) => {
    switch (t) {
      case 'Meeting': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Demo': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Milestone': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SLA': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Review': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="COLLABORATION & PRODUCTIVITY / CALENDAR"
        title="Enterprise CRM Calendar"
        subtitle="Manage customer discovery calls, executive reviews, project delivery milestones and SLA targets."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              <span>Schedule Event</span>
            </button>
          </div>
        }
      />

      {/* Filter and Month Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2 px-2">
            <CalendarDays size={16} className="text-sky-600" />
            <span>{currentDate}</span>
          </div>
          <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1 text-xs">
          {['All', 'Meeting', 'Demo', 'Milestone', 'SLA', 'Review'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === cat
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Calendar Month Grid */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-500 mb-2">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {daysInGrid.map(d => {
              const dayEvents = filteredEvents.filter(e => e.date === d.date);
              const isSelected = selectedEvent?.date === d.date;

              return (
                <div
                  key={d.date}
                  onClick={() => {
                    if (dayEvents.length) setSelectedEvent(dayEvents[0]);
                  }}
                  className={`min-h-[96px] p-2 rounded-lg border transition-all text-left flex flex-col justify-between cursor-pointer ${
                    d.isToday
                      ? 'border-sky-500 bg-sky-50/30'
                      : isSelected
                      ? 'border-indigo-400 bg-indigo-50/20 shadow-xs'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${d.isToday ? 'text-sky-600 font-bold' : 'text-slate-700'}`}>
                      {d.day}
                    </span>
                    {d.isToday && (
                      <span className="text-[9px] bg-sky-600 text-white px-1 rounded font-medium">TODAY</span>
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

                  <div className="text-[10px] text-slate-400 text-right">
                    {dayEvents.length > 0 ? `${dayEvents.length} event` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Event Details Panel */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider border ${badgeColor(selectedEvent.type)}`}>
                    {selectedEvent.type}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2 leading-snug">
                    {selectedEvent.title}
                  </h3>
                </div>
                <StatusPill status="Scheduled" />
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-sky-600" />
                  <span className="font-semibold text-slate-800">{selectedEvent.date}</span>
                  <span>·</span>
                  <span>{selectedEvent.time}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-slate-700 font-medium">{selectedEvent.account}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{selectedEvent.location}</span>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <Users size={14} className="text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-700">Attendees:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEvent.attendees.map(a => (
                        <span key={a} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 leading-relaxed">
                <div className="font-semibold text-slate-800 mb-1">Meeting Agenda & Notes</div>
                {selectedEvent.description}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => notify(`Launch simulation: Joined ${selectedEvent.title}.`)}
                  className="btn primary flex-1 text-xs py-2 text-center"
                >
                  Join Meeting (Simulated)
                </button>
                <button
                  onClick={() => notify('Calendar invite forwarded to attendees.')}
                  className="btn secondary text-xs py-2 px-3"
                >
                  Resend Invite
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs py-12">
              Select an event or date in the calendar to inspect details.
            </div>
          )}

          <div className="mt-4 p-3 bg-sky-50/50 rounded-lg border border-sky-100 text-[11px] text-sky-800">
            <b>Calendar Sync:</b> Connected to local customer records. Events automatically sync with the Customer Activity Timeline.
          </div>
        </div>
      </div>

      {/* Schedule Event Modal */}
      {showAddModal && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal-card wide">
            <div className="modal-header">
              <div>
                <span className="eyebrow">NEW APPOINTMENT</span>
                <h2>Schedule Calendar Event</h2>
              </div>
              <button className="icon-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Solution Architecture Review with C-Level"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Time Range</label>
                  <input
                    type="text"
                    value={newEvent.time}
                    onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Event Type</label>
                  <select
                    value={newEvent.type}
                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value as CalEvent['type'] })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  >
                    <option>Meeting</option>
                    <option>Demo</option>
                    <option>Milestone</option>
                    <option>SLA</option>
                    <option>Review</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Account</label>
                  <input
                    type="text"
                    value={newEvent.account}
                    onChange={e => setNewEvent({ ...newEvent, account: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Attendees (Comma separated)</label>
                <input
                  type="text"
                  value={newEvent.attendees}
                  onChange={e => setNewEvent({ ...newEvent, attendees: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Agenda & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key discussion points, presentation links, deliverables..."
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="modal-footer flex items-center justify-end gap-2">
              <button className="btn secondary text-xs" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn primary text-xs" onClick={handleSaveEvent}>
                Confirm & Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="inline-toast">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
