'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  ArrowDownLeft,
  Clock,
  Wallet,
  Download,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchPartnerSite, fetchSiteVerifications } from '@/lib/api';

/**
 * Partner Earnings Page - press.coindaily.online/partner/earnings
 *
 * Detailed breakdown of JOY earnings from hosting press releases.
 * Shows monthly totals, per-release earnings, and withdrawal options.
 */

interface EarningRecord {
  id: string;
  prTitle: string;
  publisher: string;
  position: string;
  amount: number;
  status: 'released' | 'pending' | 'locked';
  date: string;
}

const MOCK_EARNINGS: EarningRecord[] = [
  { id: 'e-1', prTitle: 'Bitcoin Hits New ATH in African Markets', publisher: 'CoinDaily', position: '/sponsored', amount: 75, status: 'released', date: '2026-02-12' },
  { id: 'e-2', prTitle: 'M-Pesa Crypto Integration Launch', publisher: 'FinTechAfrica', position: '#sidebar-widget', amount: 25, status: 'released', date: '2026-02-11' },
  { id: 'e-3', prTitle: 'JOY Token Staking Goes Live', publisher: 'CoinDaily', position: '/sponsored', amount: 75, status: 'locked', date: '2026-02-10' },
  { id: 'e-4', prTitle: 'DeFi Yield Farming Guide', publisher: 'Web3Weekly', position: '#sidebar-widget', amount: 25, status: 'released', date: '2026-02-09' },
  { id: 'e-5', prTitle: 'Nigeria SEC Token Framework', publisher: 'CoinDaily', position: '/sponsored', amount: 75, status: 'released', date: '2026-02-07' },
  { id: 'e-6', prTitle: 'Luno Partners with Orange Money', publisher: 'AfricaTech', position: '/press/feed', amount: 15, status: 'pending', date: '2026-02-06' },
];

const SUMMARY = {
  totalEarned: 8450,
  thisMonth: 1240,
  pending: 320,
  walletBalance: 7130,
};

const statusStyles: Record<string, { label: string; className: string }> = {
  released: { label: 'Released', className: 'text-green-500 bg-green-500/10' },
  pending: { label: 'Pending Verification', className: 'text-yellow-500 bg-yellow-500/10' },
  locked: { label: 'In Escrow', className: 'text-blue-500 bg-blue-500/10' },
};

export default function PartnerEarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(MOCK_EARNINGS);
  const [summary, setSummary] = useState(SUMMARY);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      try {
        const site = await fetchPartnerSite(user.email!);
        if (!site) return;
        const verifications = await fetchSiteVerifications(site.id);
        if (verifications.length === 0) return;

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        let totalEarned = 0, thisMonth = 0, pendingAmt = 0;
        const records: EarningRecord[] = [];

        verifications.forEach((v: any) => {
          const amount = Number(v.amount_joy) || 0;
          const date = v.verified_at || v.created_at || '';
          let status: 'released' | 'pending' | 'locked' = 'pending';
          if (v.result === 'passed') { status = 'released'; totalEarned += amount; if (date >= thisMonthStart) thisMonth += amount; }
          else if (v.result === 'pending') { status = 'locked'; pendingAmt += amount; }

          records.push({
            id: v.id,
            prTitle: v.snapshot_url || `Verification #${v.id.slice(0, 8)}`,
            publisher: v.verification_type || 'placement',
            position: v.verification_type === 'site' ? '#sidebar-widget' : '/sponsored',
            amount,
            status,
            date: (date || '').slice(0, 10),
          });
        });

        if (records.length > 0) setEarnings(records);
        setSummary({ totalEarned, thisMonth, pending: pendingAmt, walletBalance: totalEarned - pendingAmt });
      } catch (err) {
        console.error('Failed to load earnings:', err);
      }
    })();
  }, [user?.email]);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Earnings</h1>
          <p className="text-dark-400">Track your JOY token earnings from press release placements.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors">
          <Wallet className="w-4 h-4" />
          Withdraw JOY
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard icon={DollarSign} title="All-Time Earnings" value={`${summary.totalEarned.toLocaleString()} JOY`} color="text-green-500" />
        <SummaryCard icon={TrendingUp} title="This Month" value={`${summary.thisMonth.toLocaleString()} JOY`} color="text-blue-500" />
        <SummaryCard icon={Clock} title="Pending / Escrow" value={`${summary.pending.toLocaleString()} JOY`} color="text-yellow-500" />
        <SummaryCard icon={Wallet} title="Wallet Balance" value={`${summary.walletBalance.toLocaleString()} JOY`} color="text-primary-500" />
      </div>

      {/* Buy / Swap JOY Widget */}
      <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 border border-primary-500/30 rounded-xl p-5 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-500" /> Buy or Swap JOY Tokens
            </h3>
            <p className="text-dark-400 text-sm mt-1">
              Use ImaSwap DEX on Polygon to buy JOY or swap from other tokens. Low gas fees.
            </p>
          </div>
          <a
            href="https://imaswap.online"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors shrink-0"
          >
            Open DEX Widget
          </a>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">Earnings History</h2>
          <button className="flex items-center gap-1.5 text-sm text-dark-400 hover:text-white transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Press Release</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Publisher</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Position</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">Amount</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e) => {
                const st = statusStyles[e.status];
                return (
                  <tr key={e.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-white font-medium truncate max-w-[240px] block">{e.prTitle}</span>
                    </td>
                    <td className="px-4 py-3 text-dark-300 text-sm">{e.publisher}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-primary-400 bg-dark-700 px-1.5 py-0.5 rounded">{e.position}</code>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-green-500 font-semibold text-sm">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        +{e.amount} JOY
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${st.className}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-sm whitespace-nowrap">{e.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SummaryCard({ icon: Icon, title, value, color }: { icon: any; title: string; value: string; color: string }) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
      <Icon className={`w-7 h-7 ${color} mb-3`} />
      <p className="text-dark-400 text-sm mb-0.5">{title}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
