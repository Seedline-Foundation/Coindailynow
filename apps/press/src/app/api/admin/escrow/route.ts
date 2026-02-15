import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/escrow - Fetch escrow/distribution data for monitoring
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const sb = getServiceClient();

    const { data, error } = await sb
      .from('press_distributions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Try to enrich with release/publisher data  
    const enriched = await Promise.all((data || []).map(async (dist: any) => {
      try {
        const [rel, pub] = await Promise.all([
          dist.release_id ? sb.from('press_releases').select('title').eq('id', dist.release_id).single() : null,
          dist.publisher_id ? sb.from('press_publishers').select('company_name, wallet_address').eq('id', dist.publisher_id).single() : null,
        ]);
        return { ...dist, press_releases: rel?.data, press_publishers: pub?.data };
      } catch { return dist; }
    }));

    return NextResponse.json({ distributions: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/escrow - Release or refund a distribution
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const { distributionId, action } = body as { distributionId: string; action: 'release' | 'refund' };

    const sb = getServiceClient();
    const updates: Record<string, any> = {
      completed_at: new Date().toISOString(),
    };

    if (action === 'release') {
      updates.status = 'released';
    } else if (action === 'refund') {
      updates.status = 'refunded';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('press_distributions')
      .update(updates)
      .eq('id', distributionId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ distribution: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
