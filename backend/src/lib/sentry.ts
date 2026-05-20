import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('[Sentry] No SENTRY_DSN set — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: `coindaily-backend@${process.env.npm_package_version || '1.0.0'}`,

    // Performance: sample 20% of transactions in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Don't send PII by default
    sendDefaultPii: false,

    // Filter noisy errors
    ignoreErrors: [
      // Redis connection failures (handled gracefully)
      'ECONNREFUSED',
      'AggregateError',
      // Rate limit hits
      'Too Many Requests',
      // Bot probes
      'Route /wp-admin not found',
      'Route /wp-login.php not found',
      'Route /.env not found',
    ],

    beforeSend(event) {
      // Strip sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      return event;
    },
  });

  console.log(`[Sentry] Initialized (env: ${process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV})`);
}

export { Sentry };
