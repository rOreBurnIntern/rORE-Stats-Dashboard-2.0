import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of the transactions for tracing.
  tracesSampleRate: 1.0,

  debug: false,
});
