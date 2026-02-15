'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchPartnerSite, fetchSiteVerifications } from '@/lib/api';

/**
 * Partner Press Releases Page - press.coindaily.online/partner/releases
 *
 * Lists all press releases distributed to this partner site.
 * Shows verification status, earnings, and publisher info.
 */

type ReleaseStatus = 'verified' | 'pending' | 'failed' | 'expired';

interface Release {
  id: string;
  title: string;
  publisher: string;
  positionSlug: string;
  status: ReleaseStatus;
  earned: number;
  distributedAt: string;
  verifiedAt?: string;
}

const MOCK_RELEASES: Release[] = [
  { id: 'pr-001', title: 'Bitcoin Hits New ATH in African Markets', publisher: 'CoinDaily', positionSlug: '/sponsored', status: 'verified', earned: 75, distributedAt: '2026-02-12T10:30:00Z', verifiedAt: '2026-02-12T10:31:00Z' },
  { id: 'pr-002', title: 'M-Pesa Crypto Integration Launch', publisher: 'FinTechAfrica', positionSlug: '#sidebar-widget', status: 'verified', earned: 25, distributedAt: '2026-02-11T14:00:00Z', verifiedAt: '2026-02-11T14:02:00Z' },
  { id: 'pr-003', title: 'JOY Token Staking Goes Live', publisher: 'CoinDaily', positionSlug: '/sponsored', status: 'pending', earned: 0, distributedAt: '2026-02-10T09:00:00Z' },
  { id: 'pr-004', title: 'DeFi Yield Farming Guide for Beginners', publisher: 'Web3Weekly', positionSlug: '#sidebar-widget', status: 'verified', earned: 25, distributedAt: '2026-02-09T16:45:00Z', verifiedAt: '2026-02-09T16:47:00Z' },
  { id: 'pr-005', title: 'Luno Partners with Orange Money', publisher: 'AfricaTech', positionSlug: '/press/feed', status: 'failed', earned: 0, distributedAt: '2026-02-08T11:20:00Z' },
  { id: 'pr-006', title: 'Nigeria SEC Approves Token Framework', publisher: 'CoinDaily', positionSlug: '/sponsored', status: 'verified', earned: 75, distributedAt: '2026-02-07T08:00:00Z', verifiedAt: '2026-02-07T08:01:30Z' },
];

const statusConfig: Record<ReleaseStatus, { icon: any; label: string; className: string }> = {
  verified: { icon: CheckCircle, label: 'Verified', className: 'text-green-500 bg-green-500/10' },
  pending: { icon: Clock, label: 'Pending', className: 'text-yellow-500 bg-yellow-500/10' },
  failed: { icon: XCircle, label: 'Failed', className: 'text-red-500 bg-red-500/10' },
  expired: { icon: AlertTriangle, label: 'Expired', className: 'text-dark-500 bg-dark-500/10' },
};

export default function PartnerReleasesPage() {
  const { user } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReleaseStatus | 'all'>('all');

  useEffect(() => {
    if (!user?.email) return;
    fetchPartnerSite(user.email).then(async site => {
      if (!site) return;
      const verifications = await fetchSiteVerifications(site.id);
      setReleases(verifications.map((v: any) => ({
        id: v.id,
        title: v.press_distributions?.press_releases?.title || 'Untitled',
        publisher: 'Publisher',
        positionSlug: v.position_selector || '/sponsored',
        status: v.status === 'verified' ? 'verified' : v.status === 'failed' ? 'failed' : 'pending',
        earned: v.status === 'verified' ? Number(v.press_distributions?.credits_locked) || 0 : 0,
        distributedAt: v.created_at,
        verifiedAt: v.verified_at,
      })));
    }).catch(console.error).finally(() => setLoading(false));
  }, [user?.email]);

  const filtered = filter === 'all' ? releases : releases.filter((r) => r.status === filter);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Press Releases</h1>
          <p className="text-dark-400">All press releases distributed to your site.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-dark-500 mr-1" />
        {(['all', 'verified', 'pending', 'failed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f ? 'bg-primary-500 text-dark-950 font-semibold' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Publisher</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Position</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">Earned</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pr) => {
                const cfg = statusConfig[pr.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={pr.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-dark-500 shrink-0" />
                        <span className="text-white font-medium truncate max-w-[260px]">{pr.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-300 text-sm">{pr.publisher}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-primary-400 bg-dark-700 px-1.5 py-0.5 rounded">{pr.positionSlug}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.className}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium text-sm ${pr.earned > 0 ? 'text-green-500' : 'text-dark-500'}`}>
                        {pr.earned > 0 ? `+${pr.earned} JOY` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-sm whitespace-nowrap">
                      {new Date(pr.distributedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <FileText className="w-12 h-12 mb-3" />
            <p>No press releases found for this filter.</p>
          </div>
        )}
      </div>
    </>
  );
}
