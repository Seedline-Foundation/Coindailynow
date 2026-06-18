import { supabase } from './supabase';

export interface WireItem {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  publishedAt: string;
  url: string | null;
  tags: string[];
  industry: string;
  country: string;
  assetClass: string;
  status: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api.sygn.live';

function mapSupabaseRow(r: Record<string, unknown>): WireItem {
  const publisher = r.publisher as { company_name?: string } | null | undefined;
  const mediaMeta = (r.media_meta as Record<string, unknown>) || {};

  return {
    id: String(r.id),
    title: String(r.title),
    summary: r.summary ? String(r.summary) : null,
    source: publisher?.company_name || 'SENDPRESS',
    publishedAt: String(r.created_at),
    url: r.url ? String(r.url) : null,
    tags: Array.isArray(mediaMeta.tags) ? (mediaMeta.tags as string[]) : [],
    industry: String(mediaMeta.industry || 'DeFi'),
    country: String(mediaMeta.country || 'NG'),
    assetClass: String(mediaMeta.assetClass || 'Token'),
    status: String(r.status || 'distributed'),
  };
}

async function fetchFromBackend(): Promise<WireItem[]> {
  const res = await fetch(`${API_URL}/api/v1/press/wire?limit=50`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (!Array.isArray(json.data) || json.data.length === 0) return [];
  return json.data as WireItem[];
}

async function fetchFromSupabase(): Promise<WireItem[]> {
  const { data, error } = await supabase
    .from('press_releases')
    .select('*, publisher:press_publishers(company_name)')
    .in('status', ['approved', 'distributed'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data?.length) return [];
  return data.map((row) => mapSupabaseRow(row as Record<string, unknown>));
}

/** Production wire feed: backend API first, then Supabase. No mock fallback. */
export async function fetchWireReleases(): Promise<{
  items: WireItem[];
  source: 'database' | 'supabase' | 'empty';
}> {
  try {
    const backendItems = await fetchFromBackend();
    if (backendItems.length > 0) {
      return { items: backendItems, source: 'database' };
    }
  } catch {
    // try Supabase
  }

  try {
    const supabaseItems = await fetchFromSupabase();
    if (supabaseItems.length > 0) {
      return { items: supabaseItems, source: 'supabase' };
    }
  } catch {
    // empty
  }

  return { items: [], source: 'empty' };
}
