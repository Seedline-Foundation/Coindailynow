import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/sites - List all sites for admin
 * POST /api/admin/sites - Approve/reject/suspend a site
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const sb = getServiceClient();

    const [{ data: pending }, { data: allSites }] = await Promise.all([
      sb.from('press_sites')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      sb.from('press_sites')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    return NextResponse.json({ pending: pending || [], all: allSites || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const { siteId, action } = body as { siteId: string; action: 'approve' | 'reject' | 'suspend' };

    if (!siteId || !action) {
      return NextResponse.json({ error: 'siteId and action required' }, { status: 400 });
    }

    const sb = getServiceClient();
    const updates: Record<string, any> = {};

    switch (action) {
      case 'approve':
        updates.status = 'verified';
        updates.verified_at = new Date().toISOString();
        break;
      case 'reject':
        updates.status = 'rejected';
        break;
      case 'suspend':
        updates.status = 'suspended';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('press_sites')
      .update(updates)
      .eq('id', siteId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ site: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
