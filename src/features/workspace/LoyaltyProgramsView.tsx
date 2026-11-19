import { useState, useMemo } from 'react';
import {
  Award, Gift, Star, Plus, CheckCircle2,
  Check, X, Sparkles, Building, ArrowRight,
  TrendingUp, ShieldCheck
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { StatusPill } from '../../components/StatusPill';
import { money } from '../../data/models';
import { useCRM } from '../../store/CRMStore';

interface LoyaltyTier {
  name: string;
  minPoints: number;
  badgeColor: string;
  perks: string[];
}

const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'Bronze Partner',
    minPoints: 0,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    perks: ['Standard 99.9% Platform SLA', 'Community Knowledge Base Access', 'Quarterly Product Updates'],
  },
  {
    name: 'Silver Partner',
    minPoints: 5000,
    badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
    perks: ['5% Renewal Discount', 'Priority Queue Support (4hr SLA)', 'Beta Feature Early Access'],
  },
  {
    name: 'Gold Enterprise',
    minPoints: 25000,
    badgeColor: 'bg-amber-200 text-amber-900 border-amber-400',
    perks: ['10% Catalog Discount', 'Dedicated Customer Success Manager', '99.99% Availability Guarantee'],
  },
  {
    name: 'Platinum Executive',
    minPoints: 75000,
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    perks: ['15% Commercial Discount', '24/7 Dedicated Engineering Bridge', 'Annual Executive Strategy Summit'],
  },
];

interface MemberAccount {
  id: string;
  name: string;
  ref: string;
  tier: 'Bronze Partner' | 'Silver Partner' | 'Gold Enterprise' | 'Platinum Executive';
  pointsBalance: number;
  pointsEarnedYTD: number;
  contractValue: number;
  memberSince: string;
}

const DEFAULT_MEMBERS: MemberAccount[] = [
  {
    id: 'mem-1',
    name: 'Fujikura Optical Technologies Inc',
    ref: 'ACC-VND-0003',
    tier: 'Platinum Executive',
    pointsBalance: 88500,
    pointsEarnedYTD: 115000,
    contractValue: 245000,
    memberSince: '2024-03-15',
  },
  {
    id: 'mem-2',
    name: 'Cisco Systems Caribbean & Latin America',
    ref: 'ACC-VND-0002',
    tier: 'Platinum Executive',
    pointsBalance: 79200,
    pointsEarnedYTD: 95000,
    contractValue: 180000,
    memberSince: '2024-06-20',
  },
  {
    id: 'mem-3',
    name: 'Vertex Global Solutions',
    ref: 'ACC-2026-00001',
    tier: 'Gold Enterprise',
    pointsBalance: 42000,
    pointsEarnedYTD: 52000,
    contractValue: 120000,
    memberSince: '2025-01-10',
  },
  {
    id: 'mem-4',
    name: 'Corning Optical Communications Ltd',
    ref: 'ACC-VND-0001',
    tier: 'Silver Partner',
    pointsBalance: 16500,
    pointsEarnedYTD: 22000,
    contractValue: 65000,
    memberSince: '2025-04-18',
  },
  {
    id: 'mem-5',
    name: 'Apex Global Logistics',
    ref: 'ACC-2026-00002',
    tier: 'Bronze Partner',
    pointsBalance: 3500,
    pointsEarnedYTD: 3500,
    contractValue: 25000,
    memberSince: '2026-02-14',
  },
];

interface RewardCatalogItem {
  id: string;
  title: string;
  pointsCost: number;
  category: string;
  description: string;
}

const REWARDS_CATALOG: RewardCatalogItem[] = [
  { id: 'rew-1', title: '$5,000 Cloud Infrastructure Credit', pointsCost: 15000, category: 'Billing Concession', description: 'Direct credit applied to subsequent platform renewal billing invoice.' },
  { id: 'rew-2', title: 'Priority 24/7 SLA Engineering Pass', pointsCost: 20000, category: 'Support Tier', description: '12-month upgrade to 15-minute critical response SLA with dedicated lead.' },
  { id: 'rew-3', title: 'Hardware Transceiver Evaluation Pack', pointsCost: 25000, category: 'Hardware Equipment', description: 'Pack of 5 high-density QSFP28 transceivers for network expansion lab.' },
  { id: 'rew-4', title: 'Executive Architecture Review Summit', pointsCost: 35000, category: 'Advisory Session', description: 'Full-day on-site or digital session with Principal Cloud Solution Architect.' },
];

export function LoyaltyProgramsView() {
  const { addEvent, addAudit } = useCRM();
  const [members, setMembers] = useState<MemberAccount[]>(DEFAULT_MEMBERS);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  // Form State
  const [targetMemberId, setTargetMemberId] = useState<string>(DEFAULT_MEMBERS[0].id);
  const [awardPointsAmount, setAwardPointsAmount] = useState<number>(5000);
  const [awardReason, setAwardReason] = useState<string>('Contract Renewal');

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const totals = useMemo(() => {
    const totalPoints = members.reduce((s, m) => s + m.pointsBalance, 0);
    const totalEarned = members.reduce((s, m) => s + m.pointsEarnedYTD, 0);
    const totalContractValue = members.reduce((s, m) => s + m.contractValue, 0);
    return { totalPoints, totalEarned, totalContractValue };
  }, [members]);

  const handleAwardPoints = (e: React.FormEvent) => {
    e.preventDefault();
    const target = members.find(m => m.id === targetMemberId);
    if (!target) return;

    const newBalance = target.pointsBalance + Number(awardPointsAmount);
    let newTier = target.tier;
    if (newBalance >= 75000) newTier = 'Platinum Executive';
    else if (newBalance >= 25000) newTier = 'Gold Enterprise';
    else if (newBalance >= 5000) newTier = 'Silver Partner';

    setMembers(prev =>
      prev.map(m =>
        m.id === targetMemberId
          ? {
              ...m,
              pointsBalance: newBalance,
              pointsEarnedYTD: m.pointsEarnedYTD + Number(awardPointsAmount),
              tier: newTier,
            }
          : m
      )
    );

    addEvent('loyalty.awarded', { ref: target.ref }, `Awarded ${awardPointsAmount.toLocaleString()} loyalty points to ${target.name} for ${awardReason}`);
    addAudit('Loyalty Points Awarded', 'Arjun Mehta', `${target.name}: +${awardPointsAmount} pts (${awardReason})`);
    notify(`Awarded ${awardPointsAmount.toLocaleString()} points to ${target.name}! New tier: ${newTier}`);
    setIsDrawerOpen(false);
  };

  const handleRedeemReward = (reward: RewardCatalogItem) => {
    const eligibleMember = members.find(m => m.pointsBalance >= reward.pointsCost);
    if (!eligibleMember) {
      notify(`No account currently has ${reward.pointsCost.toLocaleString()} points required.`);
      return;
    }

    setMembers(prev =>
      prev.map(m =>
        m.id === eligibleMember.id
          ? { ...m, pointsBalance: m.pointsBalance - reward.pointsCost }
          : m
      )
    );

    addEvent('loyalty.redeemed', { ref: eligibleMember.ref }, `Redeemed "${reward.title}" for ${eligibleMember.name}`);
    addAudit('Loyalty Reward Redeemed', 'Arjun Mehta', `${reward.title} for ${eligibleMember.name}`);
    notify(`Redeemed "${reward.title}" for ${eligibleMember.name}! Points deducted.`);
  };

  return (
    <div className="workspace-page space-y-4">
      {/* Header */}
      <SectionHeading
        eyebrow="MARKETING & CUSTOMER EXPERIENCE / CUSTOMER RETENTION"
        title="Enterprise Customer Loyalty & Tier Rewards Engine"
        subtitle="Manage corporate loyalty tiers, track member points balances, configure rewards catalog, and process benefit redemptions."
        action={
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="btn primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Plus size={14} />
            <span>Award Loyalty Points</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Enrolled Enterprise Accounts</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {members.length} Members
          </strong>
          <small className="text-xs text-blue-700 font-semibold block mt-1">Tiered retention program</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Available Balance</span>
          <strong className="text-xl font-bold text-purple-700 font-manrope block mt-1">
            {totals.totalPoints.toLocaleString()} Pts
          </strong>
          <small className="text-xs text-purple-700 font-semibold block mt-1">Available for perks</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Points Earned (YTD)</span>
          <strong className="text-xl font-bold text-emerald-600 font-manrope block mt-1">
            {totals.totalEarned.toLocaleString()} Pts
          </strong>
          <small className="text-xs text-emerald-700 font-semibold block mt-1">Commercial milestones</small>
        </div>

        <div className="panel p-4 bg-white border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Protected ARR Value</span>
          <strong className="text-xl font-bold text-slate-800 font-manrope block mt-1">
            {money(totals.totalContractValue)}
          </strong>
          <small className="text-xs text-blue-700 font-semibold block mt-1">Annual recurring contract sum</small>
        </div>
      </div>

      {/* 4 Loyalty Tiers Grid */}
      <div className="panel p-5 bg-white border border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Enterprise Loyalty Tiers & Associated Benefits
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {LOYALTY_TIERS.map(tier => (
            <div
              key={tier.name}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between"
            >
              <div>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mb-2 ${tier.badgeColor}`}>
                  {tier.name}
                </span>
                <strong className="text-xs font-extrabold text-slate-900 block font-mono mb-2">
                  {tier.minPoints.toLocaleString()}+ Pts
                </strong>
                <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                  {tier.perks.map(perk => (
                    <li key={perk} className="leading-snug">{perk}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Members Roster Table */}
      <section className="panel p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 font-manrope">
              Active Enterprise Loyalty Member Accounts
            </h2>
            <p className="text-xs text-slate-500">
              Corporate member standing, points ledger, tier levels, and commercial engagement history.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="crm-table w-full">
            <thead>
              <tr>
                <th>ACCOUNT / CLIENT</th>
                <th>TIER STATUS</th>
                <th>POINTS BALANCE</th>
                <th>POINTS EARNED (YTD)</th>
                <th>CONTRACT VALUE</th>
                <th>MEMBER SINCE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <strong className="text-xs text-slate-800 block">{m.name}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">{m.ref}</span>
                  </td>
                  <td>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        m.tier === 'Platinum Executive'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : m.tier === 'Gold Enterprise'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : m.tier === 'Silver Partner'
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {m.tier}
                    </span>
                  </td>
                  <td>
                    <strong className="text-xs font-mono font-bold text-purple-700">
                      {m.pointsBalance.toLocaleString()} Pts
                    </strong>
                  </td>
                  <td>
                    <span className="text-xs font-mono text-slate-600">
                      +{m.pointsEarnedYTD.toLocaleString()} Pts
                    </span>
                  </td>
                  <td>
                    <strong className="text-xs font-manrope text-slate-900">
                      {money(m.contractValue)}
                    </strong>
                  </td>
                  <td>
                    <span className="text-xs font-mono text-slate-500">{m.memberSince}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setTargetMemberId(m.id);
                        setIsDrawerOpen(true);
                      }}
                      className="btn secondary text-[11px] py-1 px-2.5 text-blue-700 hover:bg-blue-50 border-blue-200 flex items-center gap-1 font-semibold"
                    >
                      <Plus size={11} /> Award Points
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rewards Catalog */}
      <div className="panel p-5 bg-white border border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Redeemable Corporate Rewards Catalog
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {REWARDS_CATALOG.map(rew => (
            <div
              key={rew.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-blue-600 block uppercase mb-1">
                  {rew.category}
                </span>
                <strong className="text-xs font-bold text-slate-900 block mb-1">
                  {rew.title}
                </strong>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  {rew.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-700">
                  {rew.pointsCost.toLocaleString()} Pts
                </span>
                <button
                  onClick={() => handleRedeemReward(rew)}
                  className="btn primary text-[11px] py-1 px-2.5 flex items-center gap-1"
                >
                  <Gift size={11} /> Redeem
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Award Points Drawer */}
      {isDrawerOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setIsDrawerOpen(false)}>
          <div className="form-modal">
            <div className="form-modal-head">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  CUSTOMER RETENTION
                </span>
                <h2 className="text-base font-bold text-slate-800">Award Loyalty Points</h2>
                <p className="text-xs text-slate-500">
                  Grant loyalty rewards points to enterprise clients for commercial achievements and renewals.
                </p>
              </div>
              <button
                type="button"
                className="icon-close"
                onClick={() => setIsDrawerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAwardPoints} className="flex flex-col flex-1 overflow-hidden">
              <div className="form-modal-body space-y-4">
                <div className="form-grid">
                  <label className="wide">
                    <span>Target Client Member Account *</span>
                    <select
                      value={targetMemberId}
                      onChange={e => setTargetMemberId(e.target.value)}
                      required
                    >
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.tier} · {m.pointsBalance.toLocaleString()} pts)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Points to Award *</span>
                    <input
                      type="number"
                      step="500"
                      min="500"
                      value={awardPointsAmount}
                      onChange={e => setAwardPointsAmount(Number(e.target.value))}
                      required
                    />
                  </label>

                  <label>
                    <span>Commercial Activity Reason *</span>
                    <select
                      value={awardReason}
                      onChange={e => setAwardReason(e.target.value)}
                      required
                    >
                      <option value="Contract Renewal">Annual Contract Renewal</option>
                      <option value="Multi-Year Expansion">Multi-Year License Expansion</option>
                      <option value="Prompt Invoice Settlement">Prompt Invoice Settlement</option>
                      <option value="Customer Reference Study">Customer Case Study Participation</option>
                      <option value="Executive Advisory Board">Executive Advisory Participation</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="form-modal-footer">
                <button
                  type="button"
                  className="btn secondary text-xs"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary text-xs">
                  Grant Loyalty Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="inline-toast">
          <CheckCircle2 size={14} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
