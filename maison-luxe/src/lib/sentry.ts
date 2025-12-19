import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '';

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

export function captureException(err: unknown, ctx?: Record<string, unknown>) {
  if (!dsn) return;
  try {
    Sentry.withScope((scope) => {
      if (ctx) {
        Object.keys(ctx).forEach((k) => scope.setExtra(k, (ctx as any)[k]));
      }
      Sentry.captureException(err as any);
    });
  } catch (e) {
    // swallow
    // eslint-disable-next-line no-console
    console.error('Sentry capture failed', e);
  }
}

export default Sentry;
