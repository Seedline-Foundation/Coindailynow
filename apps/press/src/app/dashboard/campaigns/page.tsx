'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Search,
  Plus,
  Eye,
  MousePointer,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchPublisherProfile, fetchPublisherDistributions } from '@/lib/api';

const FALLBACK_CAMPAIGNS = [
  { id: 'camp-1', title: 'Token Launch Announcement', status: 'active', sites: 8, spent: 2400, impressions: '450K', ctr: '4.8%', date: '2026-02-12' },
  { id: 'camp-2', title: 'Partnership Press Release', status: 'active', sites: 5, spent: 1600, impressions: '320K', ctr: '3.9%', date: '2026-02-11' },
  { id: 'camp-3', title: 'Product Update Article', status: 'completed', sites: 3, spent: 750, impressions: '180K', ctr: '3.2%', date: '2026-02-09' },
  { id: 'camp-4', title: 'Market Analysis Piece', status: 'pending', sites: 6, spent: 1800, impressions: '—', ctr: '—', date: '2026-02-08' },
  { id: 'camp-5', title: 'DeFi Integration Story', status: 'completed', sites: 10, spent: 3200, impressions: '920K', ctr: '5.1%', date: '2026-02-05' },
  { id: 'camp-6', title: 'Q4 Earnings Report', status: 'rejected', sites: 0, spent: 0, impressions: '—', ctr: '—', date: '2026-02-03' },
];

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  active: { color: 'bg-blue-500/20 text-blue-500', icon: Zap },
  completed: { color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
  pending: { color: 'bg-yellow-500/20 text-yellow-500', icon: Clock },
  rejected: { color: 'bg-red-500/20 text-red-500', icon: XCircle },
};

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState(FALLBACK_CAMPAIGNS);

  const loadCampaigns = useCallback(async () => {
    if (!user?.id) return;
    try {
      const profile = await fetchPublisherProfile(user.id);
      if (!profile) return;
      const dists = await fetchPublisherDistributions(profile.id);
      if (dists.length > 0) {
        setCampaigns(dists.map((d: any) => ({
          id: d.id,
          title: d.press_releases?.title || 'Untitled',
          status: d.status === 'processing' ? 'active' : d.status,
          sites: d.target_sites?.length || 0,
          spent: Number(d.credits_locked) || 0,
          impressions: '—',
          ctr: '—',
          date: d.created_at?.split('T')[0] || '',
        })));
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    }
  }, [user?.id]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const CAMPAIGNS = campaigns;
  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-dark-600">/</span>
          <span className="text-white font-semibold text-sm flex items-center gap-1.5"><FileText className="w-4 h-4 text-primary-500" /> Campaigns</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Your Campaigns</h1>
          <Link href="/dashboard/distribute" className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors text-sm">
            <Plus className="w-4 h-4" /> New Campaign
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input type="text" placeholder="Search campaigns..." className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none" />
          </div>
          <select className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Campaign Table */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700 text-dark-400">
                <th className="text-left py-3 px-4 font-medium">Campaign</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-center py-3 px-4 font-medium">Sites</th>
                <th className="text-right py-3 px-4 font-medium">Spent</th>
                <th className="text-right py-3 px-4 font-medium hidden md:table-cell">Impressions</th>
                <th className="text-right py-3 px-4 font-medium hidden md:table-cell">CTR</th>
                <th className="text-right py-3 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {CAMPAIGNS.map(c => {
                const sc = statusConfig[c.status] || statusConfig.pending;
                const Icon = sc.icon;
                return (
                  <tr key={c.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-white font-medium">{c.title}</p>
                      <p className="text-dark-500 text-xs mt-0.5">{c.date}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sc.color}`}>
                        <Icon className="w-3 h-3" /> {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-dark-300">{c.sites}</td>
                    <td className="py-3 px-4 text-right text-white font-medium">{c.spent.toLocaleString()} JOY</td>
                    <td className="py-3 px-4 text-right text-dark-300 hidden md:table-cell">{c.impressions}</td>
                    <td className="py-3 px-4 text-right text-dark-300 hidden md:table-cell">{c.ctr}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-primary-500 hover:text-primary-400 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total Campaigns', value: `${CAMPAIGNS.length}`, icon: FileText },
            { label: 'Active Now', value: `${CAMPAIGNS.filter(c => c.status === 'active' || c.status === 'pending').length}`, icon: Zap },
            { label: 'Total Spent', value: `${CAMPAIGNS.reduce((s, c) => s + c.spent, 0).toLocaleString()} JOY`, icon: Eye },
            { label: 'Total Sites', value: `${CAMPAIGNS.reduce((s, c) => s + c.sites, 0)}`, icon: MousePointer },
          ].map(stat => (
            <div key={stat.label} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
              <stat.icon className="w-5 h-5 text-primary-500 mb-2" />
              <p className="text-dark-400 text-xs">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
