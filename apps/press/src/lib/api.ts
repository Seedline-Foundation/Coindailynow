/**
 * API helper functions for fetching data from Supabase.
 * Used by dashboard pages to replace hardcoded mock data.
 * Falls back gracefully to empty arrays on error.
 */

import { supabase } from './supabase';
import type {
  PressSite,
  PressPublisher,
  PressRelease,
  PressDistribution,
  PressVerification,
  PressPosition,
} from './supabase';

// ─── Admin APIs ──────────────────────────────────────────────

export async function fetchPlatformStats() {
  const [
    { count: totalPublishers },
    { count: totalSites },
    { count: pendingSites },
    { count: activeDistributions },
    { count: totalVerifications },
  ] = await Promise.all([
    supabase.from('press_publishers').select('*', { count: 'exact', head: true }),
    supabase.from('press_sites').select('*', { count: 'exact', head: true }),
    supabase.from('press_sites').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('press_distributions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
    supabase.from('press_verifications').select('*', { count: 'exact', head: true }),
  ]);

  // Sum escrow amounts
  const { data: escrowData } = await supabase
    .from('press_distributions')
    .select('credits_locked')
    .in('status', ['pending', 'processing', 'verified']);

  const totalEscrow = (escrowData || []).reduce((sum, d) => sum + (Number(d.credits_locked) || 0), 0);

  return {
    totalUsers: (totalPublishers || 0) + (totalSites || 0),
    publishers: totalPublishers || 0,
    partners: totalSites || 0,
    activeSites: totalSites || 0,
    pendingSites: pendingSites || 0,
    activeDistributions: activeDistributions || 0,
    totalEscrow,
    revenue30d: 0, // Calculate from onchain_events
    aiTasksToday: 0,
    moderationQueue: 0,
    totalVerifications: totalVerifications || 0,
  };
}

export async function fetchPendingSites(): Promise<PressSite[]> {
  const { data, error } = await supabase
    .from('press_sites')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) { console.error('fetchPendingSites:', error); return []; }
  return data || [];
}

export async function fetchAllSites(): Promise<PressSite[]> {
  const { data, error } = await supabase
    .from('press_sites')
    .select('*')
    .order('dh_score', { ascending: false })
    .limit(100);
  if (error) { console.error('fetchAllSites:', error); return []; }
  return data || [];
}

export async function fetchRecentUsers() {
  // Fetch publishers and sites (partner owners) ordered by recent
  const [{ data: pubs }, { data: sites }] = await Promise.all([
    supabase.from('press_publishers').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('press_sites').select('*').order('created_at', { ascending: false }).limit(10),
  ]);
  return {
    publishers: pubs || [],
    sites: sites || [],
  };
}

export async function approveSite(siteId: string) {
  const { error } = await supabase
    .from('press_sites')
    .update({ status: 'verified', verified_at: new Date().toISOString() })
    .eq('id', siteId);
  if (error) throw new Error(error.message);
}

export async function rejectSite(siteId: string) {
  const { error } = await supabase
    .from('press_sites')
    .update({ status: 'rejected' })
    .eq('id', siteId);
  if (error) throw new Error(error.message);
}

export async function suspendSite(siteId: string) {
  const { error } = await supabase
    .from('press_sites')
    .update({ status: 'suspended' })
    .eq('id', siteId);
  if (error) throw new Error(error.message);
}

// ─── Publisher (Buyer) APIs ──────────────────────────────────

export async function fetchPublisherProfile(userId: string): Promise<PressPublisher | null> {
  const { data, error } = await supabase
    .from('press_publishers')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) { console.error('fetchPublisherProfile:', error); return null; }
  return data;
}

export async function fetchPublisherDistributions(publisherId: string): Promise<(PressDistribution & { press_release?: PressRelease })[]> {
  const { data, error } = await supabase
    .from('press_distributions')
    .select('*, press_releases(*)')
    .eq('publisher_id', publisherId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) { console.error('fetchPublisherDistributions:', error); return []; }
  return data || [];
}

export async function fetchPublisherReleases(publisherId: string): Promise<PressRelease[]> {
  const { data, error } = await supabase
    .from('press_releases')
    .select('*')
    .eq('publisher_id', publisherId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error('fetchPublisherReleases:', error); return []; }
  return data || [];
}

export async function createPressRelease(release: Partial<PressRelease>) {
  const { data, error } = await supabase
    .from('press_releases')
    .insert(release)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createDistribution(dist: Partial<PressDistribution>) {
  const { data, error } = await supabase
    .from('press_distributions')
    .insert(dist)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ─── Partner (Seller/Site Owner) APIs ────────────────────────

export async function fetchPartnerSite(ownerEmail: string): Promise<PressSite | null> {
  const { data, error } = await supabase
    .from('press_sites')
    .select('*')
    .eq('owner_email', ownerEmail)
    .single();
  if (error) { console.error('fetchPartnerSite:', error); return null; }
  return data;
}

export async function fetchPartnerSiteById(siteId: string): Promise<PressSite | null> {
  const { data, error } = await supabase
    .from('press_sites')
    .select('*')
    .eq('id', siteId)
    .single();
  if (error) { console.error('fetchPartnerSiteById:', error); return null; }
  return data;
}

export async function fetchSitePositions(siteId: string): Promise<PressPosition[]> {
  const { data, error } = await supabase
    .from('press_positions')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchSitePositions:', error); return []; }
  return data || [];
}

export async function fetchSiteVerifications(siteId: string): Promise<PressVerification[]> {
  const { data, error } = await supabase
    .from('press_verifications')
    .select('*')
    .eq('site_id', siteId)
    .order('verified_at', { ascending: false })
    .limit(20);
  if (error) { console.error('fetchSiteVerifications:', error); return []; }
  return data || [];
}

export async function registerPartnerSite(site: {
  domain: string;
  owner_email: string;
  owner_name: string;
  wallet_address?: string;
}) {
  const { data, error } = await supabase
    .from('press_sites')
    .insert({ ...site, status: 'pending' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createPublisherProfile(profile: {
  user_id: string;
  wallet_address: string;
  company_name?: string;
  contact_email?: string;
}) {
  const { data, error } = await supabase
    .from('press_publishers')
    .insert(profile)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ─── Network (Available Partner Sites for Publishers) ────────

export async function fetchAvailablePartnerSites(): Promise<PressSite[]> {
  const { data, error } = await supabase
    .from('press_sites')
    .select('*')
    .eq('status', 'verified')
    .order('dh_score', { ascending: false })
    .limit(100);
  if (error) { console.error('fetchAvailablePartnerSites:', error); return []; }
  return data || [];
}

// ─── Escrow & Onchain ────────────────────────────────────────

export async function fetchEscrowTransactions(limit = 20) {
  const { data, error } = await supabase
    .from('press_distributions')
    .select('*, press_releases(title), press_publishers(company_name)')
    .in('status', ['pending', 'processing', 'verified', 'released'])
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchEscrowTransactions:', error); return []; }
  return data || [];
}

export async function fetchOnchainEvents(limit = 20) {
  const { data, error } = await supabase
    .from('press_onchain_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchOnchainEvents:', error); return []; }
  return data || [];
}
