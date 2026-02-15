import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/users - List publishers and partner site owners
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const sb = getServiceClient();

    const [{ data: publishers }, { data: sites }] = await Promise.all([
      sb.from('press_publishers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      sb.from('press_sites')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    return NextResponse.json({ publishers: publishers || [], sites: sites || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/users - Suspend/activate a publisher
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const { publisherId, action } = body as { publisherId: string; action: 'suspend' | 'activate' };

    const sb = getServiceClient();
    const status = action === 'suspend' ? 'suspended' : 'active';

    const { data, error } = await sb
      .from('press_publishers')
      .update({ status })
      .eq('id', publisherId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ publisher: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
