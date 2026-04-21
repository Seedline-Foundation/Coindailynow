/**
 * PostHog Analytics — Backend event capture
 *
 * Captures server-side product events (article published, user signed up,
 * market alert triggered, etc.) and sends them to PostHog for behavioral
 * analytics separate from the transactional Postgres database.
 *
 * Architecture:
 *   Postgres → transactional data (users, articles, trades)
 *   PostHog  → behavioral/event data (pageviews, feature usage, funnels)
 *   TimescaleDB → time-series market data (OHLC, ticks)
 */
import { PostHog } from 'posthog-node';
import { logger } from '../utils/logger';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;

  const key = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    logger.warn('[PostHog] No API key configured — analytics disabled');
    return null;
  }

  client = new PostHog(key, {
    host: process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    flushAt: 30,
    flushInterval: 10000,
  });

  logger.info('[PostHog] Server analytics client initialized');
  return client;
}

/* ─── Public API ─────────────────────────────────────────────────── */

/** Capture a product event. No-op if PostHog is not configured. */
export function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const ph = getClient();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
}

/** Identify / update user traits. */
export function identifyUser(
  distinctId: string,
  properties?: Record<string, unknown>
) {
  const ph = getClient();
  if (!ph) return;
  ph.identify({ distinctId, properties });
}

/** Group a user into an organization / team. */
export function groupUser(
  _distinctId: string,
  groupType: string,
  groupKey: string,
  properties?: Record<string, unknown>
) {
  const ph = getClient();
  if (!ph) return;
  ph.groupIdentify({ groupType, groupKey, properties });
}

/** Flush pending events — call on graceful shutdown. */
export async function shutdownPostHogAnalytics() {
  if (!client) return;
  await client.shutdown();
  client = null;
  logger.info('[PostHog] Analytics client shut down');
}
