import { createClient } from '@supabase/supabase-js';

// ─── Browser Client (uses anon key, respects RLS) ───
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ─── Server Client (uses service role key, bypasses RLS) ───
// Only use in API routes (server-side)
export function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

// ─── Type Definitions matching supabase-schema.sql ───
export interface PressSite {
  id: string;
  domain: string;
  wallet_address: string | null;
  owner_email: string | null;
  owner_name: string | null;
  site_secret: string;
  status: 'pitched' | 'pending' | 'verified' | 'suspended' | 'rejected';
  dh_score: number;
  dr_score: number;
  da_score: number;
  ur_score: number;
  relevance_score: number;
  traffic_score: number;
  tier: 'reject' | 'bronze' | 'silver' | 'gold' | 'platinum';
  threat_level: 'no_threat' | 'moderate' | 'high' | 'very_high';
  pitch_sent_at: string | null;
  verified_at: string | null;
  last_crawl_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PressPublisher {
  id: string;
  user_id: string | null;
  wallet_address: string;
  company_name: string | null;
  contact_email: string | null;
  joy_balance: number;
  total_distributions: number;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface PressRelease {
  id: string;
  publisher_id: string;
  origin_site_id: string | null;
  title: string;
  summary: string | null;
  content: string;
  url: string | null;
  canonical_hash: string | null;
  word_count: number;
  media_meta: Record<string, any>;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'distributed';
  created_at: string;
  updated_at: string;
}

export interface PressDistribution {
  id: string;
  pr_id: string;
  publisher_id: string;
  target_sites: string[];
  target_tiers: string[];
  credits_locked: number;
  credits_released: number;
  credits_refunded: number;
  status: 'pending' | 'processing' | 'verified' | 'released' | 'refunded' | 'failed';
  escrow_tx_hash: string | null;
  release_tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PressVerification {
  id: string;
  distribution_id: string | null;
  site_id: string;
  verification_type: 'placement' | 'site' | 'security';
  result: 'pending' | 'passed' | 'failed' | 'warning';
  confidence: number | null;
  snapshot_url: string | null;
  screenshot_url: string | null;
  dom_hash: string | null;
  logs: Record<string, any>;
  verified_at: string;
}

export interface PressPosition {
  id: string;
  site_id: string;
  selector_or_slug: string;
  display_type: 'card' | 'full';
  max_words: number;
  media_types: string[];
  price_joy: number | null;
  available: boolean;
  created_at: string;
  updated_at: string;
}
