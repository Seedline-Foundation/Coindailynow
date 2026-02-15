import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = [
  'admin@coindaily.online',
  'super@coindaily.online',
  'ndifree@coindaily.online',
];

/**
 * Verify the request is from an authenticated admin user.
 * Extracts the Supabase access token from the Authorization header
 * and checks the user's email against the admin whitelist.
 *
 * Returns null if authorized, or a NextResponse 401/403 if not.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return null; // authorized
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
