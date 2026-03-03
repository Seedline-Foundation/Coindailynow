'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

/* ── Types ─────────────────────────────────────────────────────────── */
type Badge = { type: number; name: string; description: string; icon: string; earnedAt?: string };
type Reputation = {
  walletAddress: string;
  score: number;
  tier: string;
  totalTrades: number;
  disputeRate: number;
  avgResponseTime: number;
  badges: Badge[];
  lastActive: string;
};
type LeaderEntry = { walletAddress: string; score: number; tier: string; totalTrades: number; badges: number };

/* ── Badge visuals ────────────────────────────────────────────────── */
const badgeMeta: Record<string, { color: string; icon: string }> = {
  VERIFIED_MERCHANT: { color: 'bg-blue-500', icon: '✓' },
  TRUSTED_TRADER:    { color: 'bg-green-500', icon: '🤝' },
  HIGH_VOLUME:       { color: 'bg-purple-500', icon: '📊' },
  COMMUNITY_LEADER:  { color: 'bg-yellow-500', icon: '⭐' },
  EARLY_ADOPTER:     { color: 'bg-orange-500', icon: '🚀' },
};

const tierColors: Record<string, string> = {
  Bronze:   'text-amber-600',
  Silver:   'text-gray-400',
  Gold:     'text-yellow-400',
  Platinum: 'text-cyan-300',
  Diamond:  'text-purple-300',
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

function shortAddr(a: string) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function ReputationPage() {
  const [wallet, setWallet] = useState('');
  const [search, setSearch] = useState('');
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  /* ── Connect Wallet (MetaMask / injected) ──────────────────────── */
  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No wallet detected. Install MetaMask or another Web3 wallet.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts?.[0]) {
        setWallet(accounts[0].toLowerCase());
        setSearch(accounts[0].toLowerCase());
        setConnected(true);
        setError('');
      }
    } catch (e: any) {
      setError(e.message || 'Wallet connection failed');
    }
  }, []);

  /* ── Lookup reputation ──────────────────────────────────────────── */
  const lookupReputation = useCallback(async (addr: string) => {
    if (!addr || !addr.startsWith('0x') || addr.length !== 42) {
      setError('Enter a valid 0x... wallet address (42 chars)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase()}/api/v1/reputation/${addr}`);
      if (res.status === 404) { setReputation(null); setError('No reputation record found for this wallet.'); return; }
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setReputation(json.data);
    } catch { setError('Could not fetch reputation. Backend may be offline.'); }
    finally { setLoading(false); }
  }, []);

  /* ── Fetch leaderboard ──────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/api/v1/reputation/leaderboard?limit=20`);
        if (res.ok) { const json = await res.json(); setLeaderboard(json.data || []); }
      } catch { /* keep empty */ }
    })();
  }, []);

  /* ── Auto-lookup when wallet changes ───────────────────────────── */
  useEffect(() => { if (wallet) lookupReputation(wallet); }, [wallet, lookupReputation]);

  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb + title */}
        <nav className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Link href="/" className="hover:text-yellow-500">Home</Link> <span className="mx-1">/</span>
          <Link href="/tools" className="hover:text-yellow-500">Tools</Link> <span className="mx-1">/</span>
          <span className="text-gray-900 dark:text-white">Reputation SBT</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">On-Chain Merchant Reputation</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Soulbound Token (SBT) based reputation system for P2P traders across Africa.</p>

        {/* ── Wallet connect + search ────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <button onClick={connectWallet}
              className={`px-5 py-3 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
                connected ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30' : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}>
              {connected ? (
                <><span className="w-2 h-2 rounded-full bg-green-500" />{shortAddr(wallet)}</>
              ) : (
                <>🦊 Connect Wallet</>
              )}
            </button>
            <div className="flex-1 flex gap-2">
              <input type="text" placeholder="Or enter any 0x... wallet address" value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white" />
              <button onClick={() => { setWallet(search.toLowerCase()); lookupReputation(search.toLowerCase()); }}
                className="px-5 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600">
                Lookup
              </button>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        {loading && <div className="text-center py-12 text-gray-500">Loading reputation data...</div>}

        {/* ── Reputation Card ─────────────────────────────────────────── */}
        {reputation && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Score */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Reputation Score</p>
              <p className={`text-6xl font-bold ${scoreColor(reputation.score)}`}>{reputation.score}</p>
              <p className={`text-lg font-semibold mt-1 ${tierColors[reputation.tier] || 'text-gray-400'}`}>{reputation.tier} Tier</p>
              <p className="text-xs text-gray-500 mt-3">Wallet: {shortAddr(reputation.walletAddress)}</p>
              <p className="text-xs text-gray-400">Last active: {new Date(reputation.lastActive).toLocaleDateString()}</p>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-4">Trading Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between"><span className="text-gray-500">Total Trades</span><span className="text-lg font-bold text-gray-900 dark:text-white">{reputation.totalTrades.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Dispute Rate</span>
                  <span className={`text-lg font-bold ${reputation.disputeRate < 2 ? 'text-green-500' : reputation.disputeRate < 5 ? 'text-yellow-500' : 'text-red-500'}`}>{reputation.disputeRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Avg Response</span><span className="text-lg font-bold text-gray-900 dark:text-white">{reputation.avgResponseTime}s</span></div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-4">Badges ({reputation.badges.length})</h3>
              {reputation.badges.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">No badges earned yet.</p>
              ) : (
                <div className="space-y-3">
                  {reputation.badges.map((b, i) => {
                    const meta = badgeMeta[b.name] || { color: 'bg-gray-500', icon: '🏅' };
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${meta.color} flex items-center justify-center text-white text-lg`}>{meta.icon}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{b.name.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-500">{b.description || 'Earned through trading activity'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SBT Explainer ───────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-2">🔗 What is a Reputation SBT?</h3>
              <p className="text-sm text-purple-100">A Soulbound Token is a non-transferable NFT bound to your wallet. It stores your merchant reputation on-chain, making it verifiable and tamper-proof.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">🏅 How Badges Work</h3>
              <p className="text-sm text-purple-100">Badges are awarded automatically when you hit milestones: verified identity, trade volume thresholds, low dispute rates, and community contributions.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">📈 Tier System</h3>
              <p className="text-sm text-purple-100">Bronze → Silver → Gold → Platinum → Diamond. Higher tiers unlock lower fees, priority matching, and premium marketplace features.</p>
            </div>
          </div>
        </div>

        {/* ── Leaderboard ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">🏆 Reputation Leaderboard</h2>
            <p className="text-sm text-gray-500">Top merchants across African P2P markets</p>
          </div>
          {leaderboard.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 text-sm">
              Leaderboard data will populate as merchants build reputation through trades.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-xs uppercase">
                    <th className="px-6 py-3 text-left">Rank</th>
                    <th className="px-6 py-3 text-left">Wallet</th>
                    <th className="px-6 py-3 text-right">Score</th>
                    <th className="px-6 py-3 text-left">Tier</th>
                    <th className="px-6 py-3 text-right">Trades</th>
                    <th className="px-6 py-3 text-right">Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaderboard.map((e, i) => (
                    <tr key={e.walletAddress} onClick={() => { setWallet(e.walletAddress); setSearch(e.walletAddress); }}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-3 font-bold text-gray-900 dark:text-white">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td className="px-6 py-3 font-mono text-gray-700 dark:text-gray-300">{shortAddr(e.walletAddress)}</td>
                      <td className={`px-6 py-3 text-right font-bold ${scoreColor(e.score)}`}>{e.score}</td>
                      <td className={`px-6 py-3 font-medium ${tierColors[e.tier] || ''}`}>{e.tier}</td>
                      <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-400">{e.totalTrades.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-400">{e.badges}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
