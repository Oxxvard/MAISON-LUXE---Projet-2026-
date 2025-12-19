import logger from '@/lib/logger';
import { captureException } from '@/lib/sentry';

type EventLevel = 'info' | 'warn' | 'error' | 'debug';

type EventPayload = Record<string, unknown> | Array<unknown> | string | number | null;

export interface StandardPayload {
  resource?: string; // e.g. 'cj', 'payment', 'email', 'order'
  action?: string; // e.g. 'order.created', 'webhook.received'
  id?: string | number | null; // primary id related to event (orderId, cjOrderId...)
  user?: string | null; // user email or id
  meta?: Record<string, unknown>; // freeform extra data
  raw?: unknown; // original payload for debug
}

export interface AppEvent {
  name: string; // canonical name e.g. "cj.order.created"
  category?: string; // top-level category, derived from name
  level?: EventLevel;
  timestamp?: string;
  payload: StandardPayload;
}

function pickId(obj: any): string | number | null {
  if (!obj || typeof obj !== 'object') return null;
  return (
    obj.orderId || obj.localOrderId || obj.cjOrderId || obj.id || obj.sessionId || obj.userId || null
  );
}

function pickUser(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;
  return (obj.user as any)?.email || obj.user || obj.to || null;
}

function buildStandardPayload(name: string, payload?: any, opts?: Partial<StandardPayload>): StandardPayload {
  const parts = name.split('.');
  const category = parts[0] || 'app';
  const action = parts.slice(1).join('.') || 'event';

  const id = pickId(payload) ?? opts?.id ?? null;
  const user = pickUser(payload) ?? opts?.user ?? null;

  // Build meta by excluding common keys
  const meta: Record<string, unknown> = {};
  if (payload && typeof payload === 'object') {
    for (const [k, v] of Object.entries(payload)) {
      if (['orderId', 'localOrderId', 'cjOrderId', 'id', 'sessionId', 'userId', 'user', 'to'].includes(k)) continue;
      meta[k] = v as unknown;
    }
  }

  return {
    resource: opts?.resource || category,
    action: opts?.action || action,
    id,
    user,
    meta: { ...(opts?.meta || {}), ...meta },
    raw: payload ?? null,
  };
}

function buildEvent(name: string, payload?: EventPayload, opts?: Partial<StandardPayload> & { level?: EventLevel }): AppEvent {
  return {
    name,
    category: opts?.resource || name.split('.')[0] || 'app',
    level: (opts && (opts as any).level) || 'info',
    timestamp: new Date().toISOString(),
    payload: buildStandardPayload(name, payload, opts),
  };
}

export function logEvent(name: string, payload?: EventPayload, opts?: Partial<StandardPayload> & { level?: EventLevel }) {
  try {
    const ev = buildEvent(name, payload, opts);
    logger.info('event', ev);
  } catch (err) {
    logger.warn('Failed to log event locally', { name, err });
  }
}

export function logErrorEvent(name: string, error: unknown, context?: Record<string, unknown>, opts?: Partial<StandardPayload> & { level?: EventLevel }) {
  try {
    const payload = { message: (error as any)?.message || String(error), ...(context || {}) };
    const ev = buildEvent(name, payload, { ...(opts || {}), level: 'error' });
    logger.error('event', ev);
    try {
      captureException(error as Error, { event: name, ...(context || {}) });
    } catch (_) {}
  } catch (err) {
    logger.warn('Failed to log error event', { name, err });
  }
}

export default {
  logEvent,
  logErrorEvent,
};
