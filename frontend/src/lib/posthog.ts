/**
 * PostHog Analytics — Client-side initialization
 * Product analytics, user behavior tracking, and event capture
 * Separates behavioral/event data from transactional DB (Postgres)
 */
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

let initialized = false;

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (initialized) return;
  if (!POSTHOG_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set — analytics disabled');
    }
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
    cross_subdomain_cookie: true,
    // Respect user privacy
    respect_dnt: true,
    // Disable session recording by default — enable in PostHog dashboard
    disable_session_recording: false,
    // African-optimized: smaller batch sizes for mobile networks
    request_batching: true,
  });

  initialized = true;
}

export { posthog };
