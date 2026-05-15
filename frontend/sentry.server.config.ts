import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: `coindaily-frontend@${process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}`,

    // Performance: sample 20% of server-side requests
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Don't send PII
    sendDefaultPii: false,
  });
}
