'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryInitializer() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
      // Sentry is already initialized via sentry.client.config.ts
      // This component ensures client-side context is set up
      Sentry.setTag('app', 'rore-stats-2.0');
    }
  }, []);

  return null;
}
