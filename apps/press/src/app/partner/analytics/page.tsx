'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchPartnerSite, fetchSitePositions, fetchSiteVerifications } from '@/lib/api';
import { BarChart3, TrendingUp, Users, Eye, MousePointer, Clock, DollarSign, FileText } from 'lucide-react';

/**
 * Partner Analytics Page - press.coindaily.online/partner/analytics
 *
 * Shows real metrics from site positions and verifications.
 */

export default function PartnerAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([
    { icon: FileText, title: 'Total Verifications', value: '0', period: '' },
    { icon: DollarSign, title: 'Total Earned', value: '0 JOY', period: '' },
    { icon: Eye, title: 'Active Positions', value: '0', period: '' },
    { icon: Clock, title: 'DH Score', value: '—', period: '' },
  ]);
  const [positions, setPositions] = useState<{ slug: string; isActive: boolean; price: number }[]>([]);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    (async () => {
      try {
        const site = await fetchPartnerSite(user.email!);
        if (!site) { setLoading(false); return; }
        const [pos, vers] = await Promise.all([
          fetchSitePositions(site.id),
          fetchSiteVerifications(site.id),
        ]);
        const active = pos.filter((p: any) => p.is_active).length;
        const totalEarned = vers.filter((v: any) => v.result === 'passed').reduce((s: number, v: any) => s + (Number(v.amount_joy) || 0), 0);

        setMetrics([
          { icon: FileText, title: 'Total Verifications', value: `${vers.length}`, period: 'all time' },
          { icon: DollarSign, title: 'Total Earned', value: `${totalEarned.toLocaleString()} JOY`, period: 'all time' },
          { icon: Eye, title: 'Active Positions', value: `${active} / ${pos.length}`, period: '' },
          { icon: Clock, title: 'DH Score', value: `${site.dh_score || 0} / 100`, period: `${site.tier} tier` },
        ]);

        setPositions(pos.map((p: any) => ({ slug: p.position_slug || p.id, isActive: p.is_active, price: Number(p.price_joy) || 0 })));
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email]);
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white mb-1">Analytics</h1>
        <p className="text-dark-400">Performance metrics for press releases on your site.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.title} className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <m.icon className="w-7 h-7 text-primary-500 mb-3" />
            <p className="text-dark-400 text-sm mb-0.5">{m.title}</p>
            <p className="text-xl font-bold text-white mb-1">{loading ? '…' : m.value}</p>
            {m.period && <p className="text-dark-500 text-xs capitalize">{m.period}</p>}
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Earnings Over Time</h2>
        <div className="h-64 flex items-center justify-center border border-dashed border-dark-600 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-dark-500 mx-auto mb-2" />
            <p className="text-dark-400">Chart visualization coming soon</p>
            <p className="text-dark-500 text-sm">Earnings trend data will render here</p>
          </div>
        </div>
      </div>

      {/* Position Breakdown */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">Your Positions</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-dark-400">Loading…</div>
        ) : positions.length === 0 ? (
          <div className="p-8 text-center text-dark-500">No positions configured yet.</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Position</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">Price</th>
                <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((row) => (
                <tr key={row.slug} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <code className="text-sm text-primary-400 bg-dark-700 px-1.5 py-0.5 rounded">{row.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-white text-sm text-right">{row.price} JOY</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {row.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </>
  );
}
