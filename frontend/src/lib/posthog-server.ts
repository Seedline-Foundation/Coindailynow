/**
 * PostHog Server — Server-side event capture for API routes & server actions.
 * Uses posthog-node to capture backend events without client cookies.
 *
 * Usage in an App Router API route:
 *   import { captureServerEvent, shutdownPostHog } from '@/lib/posthog-server';
 *   captureServerEvent(userId, 'article_published', { articleId });
 *   await shutdownPostHog();
 */
import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    flushAt: 20,
    flushInterval: 10000,
  });
  return client;
}

/**
 * Capture a server-side event.
 * Safe to call even if PostHog is not configured (no-op).
 */
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const ph = getClient();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
}

/**
 * Identify a user server-side (set traits).
 */
export function identifyUser(
  distinctId: string,
  properties?: Record<string, unknown>
) {
  const ph = getClient();
  if (!ph) return;
  ph.identify({ distinctId, properties });
}

/**
 * Flush and shutdown — call at end of short-lived request handlers.
 */
export async function shutdownPostHog() {
  if (!client) return;
  await client.shutdown();
  client = null;
}
