import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: `coindaily-frontend@${process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}`,

    // Performance: sample 10% of page loads in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay: capture 1% of sessions, 100% on error
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        // Don't record user input by default (privacy)
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter noisy client-side errors
    ignoreErrors: [
      // Browser extensions
      'ResizeObserver loop',
      'Non-Error promise rejection',
      // Network glitches
      'Failed to fetch',
      'NetworkError',
      'Load failed',
      // Next.js chunk loading (handled by retry)
      'Loading chunk',
      'ChunkLoadError',
    ],

    beforeSend(event) {
      // Don't send errors from bots
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      if (/bot|crawler|spider|headless/i.test(ua)) {
        return null;
      }
      return event;
    },
  });
}
