import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/stats - Platform statistics for super admin
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const sb = getServiceClient();

    const [
      { count: totalPublishers },
      { count: totalPartnerSites },
      { count: pendingSites },
      { count: activeDistributions },
      { count: moderationQueue },
    ] = await Promise.all([
      sb.from('press_publishers').select('*', { count: 'exact', head: true }),
      sb.from('press_sites').select('*', { count: 'exact', head: true }),
      sb.from('press_sites').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      sb.from('press_distributions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
      sb.from('press_releases').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    // Escrow totals
    const { data: escrowData } = await sb
      .from('press_distributions')
      .select('credits_locked, credits_released')
      .in('status', ['pending', 'processing', 'verified']);

    const totalEscrow = (escrowData || []).reduce((s, d) => s + (Number(d.credits_locked) || 0), 0);

    // Revenue from released distributions (platform fee = 5%)
    const { data: releasedData } = await sb
      .from('press_distributions')
      .select('credits_released')
      .eq('status', 'released')
      .gte('completed_at', new Date(Date.now() - 30 * 86400000).toISOString());

    const revenue30d = (releasedData || []).reduce((s, d) => s + (Number(d.credits_released) || 0) * 0.05, 0);

    return NextResponse.json({
      totalUsers: (totalPublishers || 0) + (totalPartnerSites || 0),
      publishers: totalPublishers || 0,
      partners: totalPartnerSites || 0,
      activeSites: totalPartnerSites || 0,
      pendingSites: pendingSites || 0,
      activeDistributions: activeDistributions || 0,
      totalEscrow: Math.round(totalEscrow),
      revenue30d: Math.round(revenue30d),
      moderationQueue: moderationQueue || 0,
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
