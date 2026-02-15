'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowLeft,
  Coins,
  Lock,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchPublisherProfile, fetchPublisherDistributions } from '@/lib/api';

const FALLBACK_WALLET = {
  balance: 15200,
  locked: 3800,
  available: 11400,
  pendingVerification: 1200,
  totalSpent: 24600,
};

const FALLBACK_TX = [
  { id: 'tx-1', type: 'escrow_lock', amount: -2400, description: 'Escrow for "Token Launch Announcement"', date: '2026-02-12', status: 'locked' },
  { id: 'tx-2', type: 'escrow_release', amount: -1600, description: 'Released to partners — Partnership PR', date: '2026-02-11', status: 'completed' },
  { id: 'tx-3', type: 'deposit', amount: 5000, description: 'Wallet top-up from ImaSwap DEX', date: '2026-02-10', status: 'completed' },
  { id: 'tx-4', type: 'escrow_lock', amount: -750, description: 'Escrow for "Product Update Article"', date: '2026-02-09', status: 'completed' },
  { id: 'tx-5', type: 'deposit', amount: 10000, description: 'Wallet top-up from ImaSwap DEX', date: '2026-02-05', status: 'completed' },
  { id: 'tx-6', type: 'escrow_refund', amount: 300, description: 'Refund — Undelivered site for Market Analysis', date: '2026-02-04', status: 'completed' },
];

export default function PaymentsPage() {
  const { user } = useAuth();
  const [walletInfo, setWalletInfo] = useState({ balance: 0, locked: 0, available: 0, pendingVerification: 0, totalSpent: 0 });
  const [transactions, setTransactions] = useState<typeof FALLBACK_TX>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    if (!user?.id) return;
    try {
      const profile = await fetchPublisherProfile(user.id);
      if (profile) {
        const bal = Number(profile.joy_balance) || 0;
        const dists = await fetchPublisherDistributions(profile.id);
        const locked = dists.filter((d: any) => ['pending', 'processing'].includes(d.status)).reduce((s: number, d: any) => s + (Number(d.credits_locked) || 0), 0);
        const totalSpent = dists.reduce((s: number, d: any) => s + (Number(d.credits_locked) || 0), 0);
        setWalletInfo({ balance: bal, locked, available: bal - locked, pendingVerification: 0, totalSpent });

        if (dists.length > 0) {
          setTransactions(dists.slice(0, 10).map((d: any) => ({
            id: d.id,
            type: d.status === 'completed' ? 'escrow_release' : 'escrow_lock',
            amount: -(Number(d.credits_locked) || 0),
            description: `Distribution: ${d.press_releases?.title || 'Untitled'}`,
            date: d.created_at?.split('T')[0] || '',
            status: d.status,
          })));
        }
      }
    } catch (err) {
      console.error('Failed to load payment data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const WALLET_INFO = walletInfo;
  const TRANSACTIONS = transactions;
  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-dark-600">/</span>
          <span className="text-white font-semibold text-sm flex items-center gap-1.5"><Wallet className="w-4 h-4 text-primary-500" /> Payments</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Payments & JOY Wallet</h1>

        {/* Wallet Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <Coins className="w-5 h-5 text-primary-500 mb-2" />
            <p className="text-dark-400 text-xs">Total Balance</p>
            <p className="text-2xl font-bold text-white">{WALLET_INFO.balance.toLocaleString()} <span className="text-sm text-primary-500">JOY</span></p>
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <Lock className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-dark-400 text-xs">Locked in Escrow</p>
            <p className="text-2xl font-bold text-white">{WALLET_INFO.locked.toLocaleString()} <span className="text-sm text-blue-500">JOY</span></p>
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-dark-400 text-xs">Available</p>
            <p className="text-2xl font-bold text-white">{WALLET_INFO.available.toLocaleString()} <span className="text-sm text-green-500">JOY</span></p>
          </div>
          <div className="bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/30 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <Coins className="w-5 h-5 text-primary-500 mb-2" />
              <p className="text-white font-semibold text-sm">Need more JOY?</p>
            </div>
            <a
              href="https://imaswap.online"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary-500 hover:text-primary-400 text-sm font-semibold mt-2"
            >
              Buy on ImaSwap <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-dark-700">
            <h2 className="text-lg font-semibold text-white">Transaction History</h2>
            <button className="flex items-center gap-1.5 text-sm text-dark-400 hover:text-white transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-800 text-dark-400">
                <th className="text-left py-3 px-4 font-medium">Transaction</th>
                <th className="text-right py-3 px-4 font-medium">Amount</th>
                <th className="text-center py-3 px-4 font-medium hidden md:table-cell">Status</th>
                <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map(tx => (
                <tr key={tx.id} className="border-b border-dark-800 last:border-0 hover:bg-dark-800/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {tx.amount > 0
                        ? <ArrowDownRight className="w-4 h-4 text-green-500 shrink-0" />
                        : <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0" />}
                      <span className="text-white truncate max-w-[260px]">{tx.description}</span>
                    </div>
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} JOY
                  </td>
                  <td className="py-3 px-4 text-center hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      tx.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {tx.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-dark-400 hidden sm:table-cell">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
