'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ArrowLeft,
  Eye,
  MousePointer,
  TrendingUp,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Coins,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchPublisherProfile, fetchPublisherDistributions, fetchPublisherReleases } from '@/lib/api';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalDistributions: 0, totalSites: 0, totalSpent: 0, totalReleases: 0 });
  const [releases, setReleases] = useState<{ title: string; sites: number; spent: number; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      try {
        const profile = await fetchPublisherProfile(user.id);
        if (!profile) { setLoading(false); return; }
        const [dists, rels] = await Promise.all([
          fetchPublisherDistributions(profile.id),
          fetchPublisherReleases(profile.id),
        ]);

        const totalSites = dists.reduce((s, d) => s + (d.target_sites?.length || 0), 0);
        const totalSpent = dists.reduce((s, d) => s + (Number(d.credits_locked) || 0), 0);

        setStats({
          totalDistributions: dists.length,
          totalSites,
          totalSpent,
          totalReleases: rels.length,
        });

        setReleases(rels.slice(0, 5).map(r => {
          const dist = dists.find(d => d.pr_id === r.id);
          return {
            title: r.title,
            sites: dist?.target_sites?.length || 0,
            spent: Number(dist?.credits_locked) || 0,
            status: dist?.status || r.status,
          };
        }));
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);
  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-dark-600">/</span>
          <span className="text-white font-semibold text-sm flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-primary-500" /> Analytics</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Analytics Overview</h1>
          <select className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
            <option>All time</option>
          </select>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Distributions', value: loading ? '…' : `${stats.totalDistributions}`, icon: FileText },
            { label: 'Sites Targeted', value: loading ? '…' : `${stats.totalSites}`, icon: Globe },
            { label: 'Total Spent', value: loading ? '…' : `${stats.totalSpent.toLocaleString()} JOY`, icon: Coins },
            { label: 'Press Releases', value: loading ? '…' : `${stats.totalReleases}`, icon: TrendingUp },
          ].map(stat => (
            <div key={stat.label} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
              <stat.icon className="w-5 h-5 text-primary-500 mb-3" />
              <p className="text-dark-400 text-xs">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Articles */}
          <div className="lg:col-span-2 bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-white">Recent Releases</h2>
            </div>
            {loading ? (
              <div className="p-6 text-center text-dark-400">Loading…</div>
            ) : releases.length === 0 ? (
              <div className="p-8 text-center text-dark-500">
                <p>No press releases yet.</p>
                <Link href="/dashboard/distribute" className="text-primary-500 text-sm mt-2 inline-block">Create your first distribution →</Link>
              </div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800 text-dark-400">
                  <th className="text-left py-2 px-4 font-medium">Title</th>
                  <th className="text-right py-2 px-4 font-medium">Sites</th>
                  <th className="text-right py-2 px-4 font-medium hidden sm:table-cell">Spent</th>
                  <th className="text-right py-2 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {releases.map(a => (
                  <tr key={a.title} className="border-b border-dark-800 last:border-0">
                    <td className="py-2.5 px-4 text-white truncate max-w-[200px]">{a.title}</td>
                    <td className="py-2.5 px-4 text-right text-dark-300">{a.sites}</td>
                    <td className="py-2.5 px-4 text-right text-dark-300 hidden sm:table-cell">{a.spent} JOY</td>
                    <td className="py-2.5 px-4 text-right text-primary-500 font-semibold capitalize">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>

          {/* Quick Summary */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Platform Insights</h2>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-dark-800 rounded-lg">
                <p className="text-dark-400 mb-1">Avg Cost per Site</p>
                <p className="text-white font-bold text-lg">
                  {stats.totalSites > 0 ? `${Math.round(stats.totalSpent / stats.totalSites)} JOY` : '—'}
                </p>
              </div>
              <div className="p-3 bg-dark-800 rounded-lg">
                <p className="text-dark-400 mb-1">Avg Sites per Campaign</p>
                <p className="text-white font-bold text-lg">
                  {stats.totalDistributions > 0 ? `${Math.round(stats.totalSites / stats.totalDistributions)}` : '—'}
                </p>
              </div>
              <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                <p className="text-primary-400 mb-1">Tip</p>
                <p className="text-dark-300 text-xs">Distribute to Gold-tier+ sites for maximum visibility and credibility in the African crypto market.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
