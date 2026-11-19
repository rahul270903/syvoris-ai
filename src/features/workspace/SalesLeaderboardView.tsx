import { useState, useMemo } from 'react';
import {
  Award, TrendingUp, Target, Users, Zap,
  Check, ArrowUpRight, Flame, BarChart3, Download, Sparkles, X, Heart
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { money } from '../../data/models';
import { useCRM } from '../../store/CRMStore';

interface RepPerformance {
  rank: number;
  name: string;
  avatar: string;
  title: string;
  territory: string;
  quota: number;
  attainment: number; // e.g. 118%
  closedWon: number;
  openPipeline: number;
  dealsWon: number;
  winRate: number; // percentage
  avgCycleDays: number;
  badges: string[];
}

const PERIOD_DATA: Record<'Month' | 'Quarter' | 'YTD', RepPerformance[]> = {
  Month: [
    {
      rank: 1,
      name: 'Sarah Jenkins',
      avatar: 'SJ',
      title: 'Senior Enterprise AE',
      territory: 'North America Enterprise',
      quota: 250000,
      attainment: 124,
      closedWon: 310000,
      openPipeline: 480000,
      dealsWon: 3,
      winRate: 46,
      avgCycleDays: 35,
      badges: ['Top Performer', 'Deal Closer'],
    },
    {
      rank: 2,
      name: 'Marcus Vance',
      avatar: 'MV',
      title: 'Enterprise Account Director',
      territory: 'Strategic Accounts',
      quota: 280000,
      attainment: 114,
      closedWon: 320000,
      openPipeline: 620000,
      dealsWon: 2,
      winRate: 43,
      avgCycleDays: 41,
      badges: ['Whale Hunter'],
    },
    {
      rank: 3,
      name: 'Devon Wright',
      avatar: 'DW',
      title: 'Healthcare & Life Sciences Lead',
      territory: 'East Coast & Healthcare',
      quota: 200000,
      attainment: 98,
      closedWon: 196000,
      openPipeline: 310000,
      dealsWon: 2,
      winRate: 38,
      avgCycleDays: 39,
      badges: ['Pipeline Builder'],
    },
    {
      rank: 4,
      name: 'Elena Rostova',
      avatar: 'ER',
      title: 'Industrial & Supply Chain AE',
      territory: 'EMEA / Logistics',
      quota: 220000,
      attainment: 93,
      closedWon: 204000,
      openPipeline: 390000,
      dealsWon: 2,
      winRate: 35,
      avgCycleDays: 45,
      badges: ['Velocity Star'],
    },
    {
      rank: 5,
      name: 'Vikram Mehta',
      avatar: 'VM',
      title: 'Fintech & Cloud Solutions AE',
      territory: 'West Coast / Tech',
      quota: 180000,
      attainment: 83,
      closedWon: 150000,
      openPipeline: 270000,
      dealsWon: 1,
      winRate: 31,
      avgCycleDays: 50,
      badges: ['Rising Star'],
    },
  ],
  Quarter: [
    {
      rank: 1,
      name: 'Sarah Jenkins',
      avatar: 'SJ',
      title: 'Senior Enterprise AE',
      territory: 'North America Enterprise',
      quota: 750000,
      attainment: 124,
      closedWon: 930000,
      openPipeline: 1420000,
      dealsWon: 8,
      winRate: 46,
      avgCycleDays: 38,
      badges: ['Top Performer', "President's Club", 'Deal Closer'],
    },
    {
      rank: 2,
      name: 'Marcus Vance',
      avatar: 'MV',
      title: 'Enterprise Account Director',
      territory: 'Strategic Accounts',
      quota: 850000,
      attainment: 112,
      closedWon: 952000,
      openPipeline: 1850000,
      dealsWon: 6,
      winRate: 42,
      avgCycleDays: 44,
      badges: ['Whale Hunter', 'Consistent Closer'],
    },
    {
      rank: 3,
      name: 'Devon Wright',
      avatar: 'DW',
      title: 'Healthcare & Life Sciences Lead',
      territory: 'East Coast & Healthcare',
      quota: 600000,
      attainment: 98,
      closedWon: 588000,
      openPipeline: 920000,
      dealsWon: 7,
      winRate: 38,
      avgCycleDays: 41,
      badges: ['Pipeline Builder'],
    },
    {
      rank: 4,
      name: 'Elena Rostova',
      avatar: 'ER',
      title: 'Industrial & Supply Chain AE',
      territory: 'EMEA / Logistics',
      quota: 650000,
      attainment: 94,
      closedWon: 611000,
      openPipeline: 1150000,
      dealsWon: 5,
      winRate: 35,
      avgCycleDays: 48,
      badges: ['Velocity Star'],
    },
    {
      rank: 5,
      name: 'Vikram Mehta',
      avatar: 'VM',
      title: 'Fintech & Cloud Solutions AE',
      territory: 'West Coast / Tech',
      quota: 550000,
      attainment: 88,
      closedWon: 484000,
      openPipeline: 790000,
      dealsWon: 4,
      winRate: 32,
      avgCycleDays: 52,
      badges: ['Rising Star'],
    },
  ],
  YTD: [
    {
      rank: 1,
      name: 'Sarah Jenkins',
      avatar: 'SJ',
      title: 'Senior Enterprise AE',
      territory: 'North America Enterprise',
      quota: 3000000,
      attainment: 124,
      closedWon: 3720000,
      openPipeline: 4200000,
      dealsWon: 32,
      winRate: 48,
      avgCycleDays: 36,
      badges: ['Top Performer', "President's Club", 'Legendary Closer'],
    },
    {
      rank: 2,
      name: 'Marcus Vance',
      avatar: 'MV',
      title: 'Enterprise Account Director',
      territory: 'Strategic Accounts',
      quota: 3400000,
      attainment: 112,
      closedWon: 3810000,
      openPipeline: 5100000,
      dealsWon: 26,
      winRate: 44,
      avgCycleDays: 42,
      badges: ['Whale Hunter', 'Consistent Closer'],
    },
    {
      rank: 3,
      name: 'Devon Wright',
      avatar: 'DW',
      title: 'Healthcare & Life Sciences Lead',
      territory: 'East Coast & Healthcare',
      quota: 2400000,
      attainment: 98,
      closedWon: 2350000,
      openPipeline: 2800000,
      dealsWon: 28,
      winRate: 40,
      avgCycleDays: 40,
      badges: ['Pipeline Builder'],
    },
    {
      rank: 4,
      name: 'Elena Rostova',
      avatar: 'ER',
      title: 'Industrial & Supply Chain AE',
      territory: 'EMEA / Logistics',
      quota: 2600000,
      attainment: 94,
      closedWon: 2440000,
      openPipeline: 3400000,
      dealsWon: 21,
      winRate: 36,
      avgCycleDays: 46,
      badges: ['Velocity Star'],
    },
    {
      rank: 5,
      name: 'Vikram Mehta',
      avatar: 'VM',
      title: 'Fintech & Cloud Solutions AE',
      territory: 'West Coast / Tech',
      quota: 2200000,
      attainment: 89,
      closedWon: 1960000,
      openPipeline: 2900000,
      dealsWon: 18,
      winRate: 33,
      avgCycleDays: 51,
      badges: ['Rising Star'],
    },
  ]
};

export function SalesLeaderboardView() {
  const { addEvent, addAudit } = useCRM();

  const [period, setPeriod] = useState<'Month' | 'Quarter' | 'YTD'>('Quarter');
  const [toast, setToast] = useState('');

  // Peer Recognition Modal State
  const [recognizeRep, setRecognizeRep] = useState<RepPerformance | null>(null);
  const [selectedBadge, setSelectedBadge] = useState("President's Club");
  const [kudosMessage, setKudosMessage] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  const reps = useMemo(() => PERIOD_DATA[period], [period]);

  const totals = useMemo(() => {
    const totalWon = reps.reduce((s, r) => s + r.closedWon, 0);
    const totalQuota = reps.reduce((s, r) => s + r.quota, 0);
    const teamAttainment = Math.round((totalWon / totalQuota) * 100);
    const totalPipeline = reps.reduce((s, r) => s + r.openPipeline, 0);
    return { totalWon, totalQuota, teamAttainment, totalPipeline };
  }, [reps]);

  const handleExportScorecard = () => {
    const periodLabel = period === 'Month' ? 'This Month (Nov 2026)' : period === 'Quarter' ? 'Q4 2026' : 'Full Year 2026';
    const csvRows = [
      ['Rank', 'Sales Representative', 'Title', 'Territory', 'Quota', 'Closed Won', 'Attainment %', 'Active Pipeline', 'Win Rate %', 'Avg Cycle Days'],
      ...reps.map(r => [
        r.rank,
        `"${r.name}"`,
        `"${r.title}"`,
        `"${r.territory}"`,
        r.quota,
        r.closedWon,
        `${r.attainment}%`,
        r.openPipeline,
        `${r.winRate}%`,
        r.avgCycleDays
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SYVORIS_Sales_Scorecard_${period}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addEvent('sales.scorecard_exported', { ref: `SCORECARD-${period}` }, `Exported sales leaderboard scorecard for ${periodLabel}`);
    addAudit('Sales Scorecard Exported', 'Arjun Mehta', `CSV scorecard generated for ${periodLabel}`);
    notify(`Sales scorecard for ${periodLabel} exported successfully (CSV).`);
  };

  const handleSendRecognition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recognizeRep) return;

    addEvent('rep.recognized', { ref: recognizeRep.name }, `Awarded ${selectedBadge} to ${recognizeRep.name}`);
    addAudit('Peer Sales Recognition', 'Arjun Mehta', `${selectedBadge} awarded to ${recognizeRep.name}: "${kudosMessage || 'Outstanding revenue performance'}"`);
    notify(`Recognition "${selectedBadge}" dispatched to ${recognizeRep.name} with peer kudos!`);
    setRecognizeRep(null);
    setKudosMessage('');
  };

  const medalBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">1</span>;
      case 2:
        return <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs">2</span>;
      case 3:
        return <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">3</span>;
      default:
        return <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">{rank}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="SALES & PIPELINE / PERFORMANCE LEADERBOARD"
        title="Sales Quota & Rep Leaderboard"
        subtitle="Track team quota attainment, deal velocity, win rates and commercial rankings in real-time."
        action={
          <div className="flex items-center gap-2">
            {(['Month', 'Quarter', 'YTD'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all shadow-xs ${
                  period === p
                    ? 'bg-blue-600 text-white border border-blue-700'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p === 'Month' ? 'This Month' : p === 'Quarter' ? 'Q4 2026' : 'Full Year 2026'}
              </button>
            ))}
          </div>
        }
      />

      {/* Team Quota Attainment Banner - Vivid Dark Theme with Guaranteed Visible Numbers */}
      <div
        className="p-6 rounded-xl text-white shadow-lg border border-slate-800"
        style={{ background: '#0a192f' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Flame size={16} />
              <span>Team Quota Tracker · {period === 'Month' ? 'November 2026' : period === 'Quarter' ? 'Q4 2026' : 'Full Year 2026'}</span>
            </div>
            <div className="text-3xl font-black mt-1" style={{ color: '#ffffff' }}>
              <span className="font-extrabold text-3xl" style={{ color: '#34d399' }}>{money(totals.totalWon)}</span>
              <span className="text-base font-normal" style={{ color: '#94a3b8' }}> / {money(totals.totalQuota)} Quota</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              The enterprise sales organization is at <b className="text-emerald-400 font-bold">{totals.teamAttainment}%</b> of target with active pipeline of <b className="text-cyan-300 font-bold">{money(totals.totalPipeline)}</b>.
            </p>
          </div>

          <div className="min-w-[240px] space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">Target Attainment</span>
              <span className="text-emerald-400 font-bold text-sm">{totals.teamAttainment}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totals.teamAttainment, 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 text-right">
              Pacing ahead of target (+12% vs prior benchmark)
            </div>
          </div>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reps.slice(0, 3).map((rep) => (
          <div
            key={rep.name}
            className={`panel p-4 border relative overflow-hidden flex flex-col justify-between ${
              rep.rank === 1
                ? 'border-amber-300 bg-amber-50/20 shadow-sm'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs font-mono">
                      {rep.avatar}
                    </div>
                    <div className="absolute -top-1.5 -left-1.5">
                      {medalBadge(rep.rank)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{rep.name}</h4>
                    <div className="text-[11px] text-slate-500">{rep.title}</div>
                    <div className="text-[10px] text-slate-400">{rep.territory}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {rep.attainment}%
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Closed Won</span>
                  <span className="font-bold text-slate-800 font-mono">{money(rep.closedWon)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Win Rate</span>
                  <span className="font-bold text-slate-800">{rep.winRate}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Deals Closed</span>
                  <span className="font-bold text-slate-800">{rep.dealsWon} Deals</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg Sales Cycle</span>
                  <span className="font-bold text-slate-800">{rep.avgCycleDays} Days</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {rep.badges.map(b => (
                  <span key={b} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setRecognizeRep(rep)}
              className="mt-4 btn secondary w-full text-xs py-2 flex items-center justify-center gap-1.5 font-semibold text-slate-700 hover:text-blue-700 hover:border-blue-300"
            >
              <Award size={14} className="text-amber-500" />
              <span>Recognize Rep</span>
            </button>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="panel overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Enterprise Sales Rankings</h3>
            <p className="text-xs text-slate-500">Comprehensive rep scorecards, pacing and quota attainment for {period === 'Month' ? 'This Month' : period === 'Quarter' ? 'Q4 2026' : 'Full Year 2026'}.</p>
          </div>
          <button
            onClick={handleExportScorecard}
            className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Download size={13} />
            <span>Export Scorecard</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Rank</th>
                <th className="py-2.5 px-4">Sales Representative</th>
                <th className="py-2.5 px-4">Territory</th>
                <th className="py-2.5 px-4 text-right">Quota</th>
                <th className="py-2.5 px-4 text-right">Closed Won</th>
                <th className="py-2.5 px-4">Attainment %</th>
                <th className="py-2.5 px-4 text-right">Active Pipeline</th>
                <th className="py-2.5 px-4 text-right">Win Rate</th>
                <th className="py-2.5 px-4 text-center">Avg Cycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reps.map(rep => (
                <tr key={rep.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold">{medalBadge(rep.rank)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs font-mono">
                        {rep.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{rep.name}</div>
                        <div className="text-[10px] text-slate-400">{rep.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{rep.territory}</td>
                  <td className="py-3 px-4 text-right font-medium font-mono">{money(rep.quota)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">{money(rep.closedWon)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rep.attainment >= 100 ? 'bg-emerald-500' : 'bg-sky-500'
                          }`}
                          style={{ width: `${Math.min(rep.attainment, 100)}%` }}
                        />
                      </div>
                      <span className={`font-bold font-mono ${rep.attainment >= 100 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {rep.attainment}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600 font-mono">{money(rep.openPipeline)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">{rep.winRate}%</td>
                  <td className="py-3 px-4 text-center text-slate-500">{rep.avgCycleDays} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECOGNIZE REP MODAL */}
      {recognizeRep && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setRecognizeRep(null)}>
          <div className="modal-card">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Award size={18} />
                </span>
                <div>
                  <span className="eyebrow text-amber-600">PEER RECOGNITION</span>
                  <h2>Recognize {recognizeRep.name}</h2>
                </div>
              </div>
              <button className="icon-close" onClick={() => setRecognizeRep(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSendRecognition}>
              <div className="modal-body space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <strong className="block text-xs text-slate-900">{recognizeRep.name}</strong>
                    <span className="text-[11px] text-slate-500">{recognizeRep.title} · {recognizeRep.territory}</span>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {recognizeRep.attainment}% Quota Attainment
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Award Badge *</label>
                  <select
                    value={selectedBadge}
                    onChange={e => setSelectedBadge(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  >
                    <option value="President's Club">President's Club Award</option>
                    <option value="Top Performer">Top Performer Medal</option>
                    <option value="Deal Closer">Deal Closer Honors</option>
                    <option value="Whale Hunter">Enterprise Whale Hunter</option>
                    <option value="Team MVP">Quarterly Team MVP</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Personal Kudos & Recognition Note *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Incredible work closing the multi-year cloud contract ahead of target!"
                    value={kudosMessage}
                    onChange={e => setKudosMessage(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="modal-footer flex items-center justify-end gap-2">
                <button type="button" className="btn secondary text-xs" onClick={() => setRecognizeRep(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  <Award size={14} /> Dispatch Recognition Award
                </button>
              </div>
            </form>
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
