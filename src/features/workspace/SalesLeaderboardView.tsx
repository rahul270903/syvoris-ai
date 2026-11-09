import { useState, useMemo } from 'react';
import {
  Award, TrendingUp, Target, Users, Zap,
  Check, ArrowUpRight, Flame, BarChart3
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { money } from '../../data/models';

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

const defaultReps: RepPerformance[] = [
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
  }
];

export function SalesLeaderboardView() {
  const [period, setPeriod] = useState<'Month' | 'Quarter' | 'YTD'>('Quarter');
  const [reps, setReps] = useState<RepPerformance[]>(defaultReps);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const totals = useMemo(() => {
    const totalWon = reps.reduce((s, r) => s + r.closedWon, 0);
    const totalQuota = reps.reduce((s, r) => s + r.quota, 0);
    const teamAttainment = Math.round((totalWon / totalQuota) * 100);
    const totalPipeline = reps.reduce((s, r) => s + r.openPipeline, 0);
    return { totalWon, totalQuota, teamAttainment, totalPipeline };
  }, [reps]);

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
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p === 'Month' ? 'This Month' : p === 'Quarter' ? 'Q4 2026' : 'Full Year 2026'}
              </button>
            ))}
          </div>
        }
      />

      {/* Team Quota Attainment Banner */}
      <div className="panel p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white border-0 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <Flame size={15} />
              <span>Team Quota Tracker · {period === 'Quarter' ? 'Q4 2026' : period}</span>
            </div>
            <div className="text-3xl font-black">
              {money(totals.totalWon)} <span className="text-sm font-normal text-slate-400">/ {money(totals.totalQuota)} Quota</span>
            </div>
            <p className="text-xs text-slate-300">
              The enterprise sales organization is at <b className="text-emerald-400">{totals.teamAttainment}%</b> of target with active pipeline of <b>{money(totals.totalPipeline)}</b>.
            </p>
          </div>

          <div className="min-w-[220px] space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Attainment</span>
              <span className="text-emerald-400">{totals.teamAttainment}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totals.teamAttainment, 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 text-right">
              Pacing ahead of target (+12% vs prior quarter)
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
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
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
                <span className="font-bold text-slate-800">{money(rep.closedWon)}</span>
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
                <span key={b} className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200/60 font-semibold px-1.5 py-0.5 rounded">
                  {b}
                </span>
              ))}
            </div>

            <button
              onClick={() => notify(`Sent peer recognition to ${rep.name}!`)}
              className="mt-3 btn secondary w-full text-xs py-1.5 flex items-center justify-center gap-1"
            >
              <Award size={13} />
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
            <p className="text-xs text-slate-500">Comprehensive rep scorecards, pacing and quota attainment.</p>
          </div>
          <button
            onClick={() => notify('Leaderboard refreshed with real-time deal events.')}
            className="btn secondary text-xs py-1.5 px-3 flex items-center gap-1"
          >
            <BarChart3 size={13} />
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
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                        {rep.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{rep.name}</div>
                        <div className="text-[10px] text-slate-400">{rep.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{rep.territory}</td>
                  <td className="py-3 px-4 text-right font-medium">{money(rep.quota)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{money(rep.closedWon)}</td>
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
                      <span className={`font-bold ${rep.attainment >= 100 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {rep.attainment}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600">{money(rep.openPipeline)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">{rep.winRate}%</td>
                  <td className="py-3 px-4 text-center text-slate-500">{rep.avgCycleDays} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="inline-toast">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
