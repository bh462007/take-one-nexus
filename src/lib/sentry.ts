/**
 * Sentry server-side configuration for Take One Nexus.
 * 
 * Used ONLY for:
 * - API route failures
 * - Database errors
 * - Server exceptions
 * - Authentication failures
 */

import * as Sentry from '@sentry/nextjs';

let initialized = false;

/**
 * Initialize Sentry for server-side error monitoring.
 */
export function initSentry(): void {
  if (initialized || !process.env.SENTRY_DSN) return;
  initialized = true;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    beforeSend(event, hint) {
      // 1. Scrub request data
      if (event.request?.data) {
        try {
          const data = typeof event.request.data === 'string' 
            ? JSON.parse(event.request.data) 
            : event.request.data;
          
          const sensitive = /(password|token|secret|key|hash|otp|cvv|credit_card)/i;
          const scrub = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            for (const k in obj) {
              if (sensitive.test(k)) {
                obj[k] = '[REDACTED]';
              } else if (typeof obj[k] === 'object') {
                scrub(obj[k]);
              }
            }
          };
          scrub(data);
          event.request.data = data;
        } catch {
          // If we can't parse it, just keep as is or redact everything if preferred
        }
      }

      // 2. Scrub cookies
      if (event.request?.headers?.['cookie']) {
        event.request.headers['cookie'] = '[REDACTED]';
      }

      // 3. Normalize the error message if needed
      return event;
    },

    ignoreErrors: [
      'AbortError',
      'Network request failed',
      'Failed to fetch',
      'User unauthenticated',
    ],
  });
}

/**
 * Normalize an unknown error into a proper Error object.
 * Fixes "Object [object Object] has no method 'updateFrom'" in Sentry.
 */
function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  
  if (typeof error === 'string') return new Error(error);
  
  if (error && typeof error === 'object') {
    try {
      const message = (error as any).message || (error as any).error || JSON.stringify(error);
      const err = new Error(message);
      // Copy over useful properties
      if ((error as any).status) (err as any).status = (error as any).status;
      if ((error as any).code) (err as any).code = (error as any).code;
      return err;
    } catch {
      return new Error('Unknown object error');
    }
  }
  
  return new Error(String(error) || 'Unknown error');
}

/**
 * Capture an exception with optional context.
 */
export function captureError(
  error: unknown,
  context?: {
    endpoint?: string;
    userId?: number | string;
    action?: string;
    extra?: Record<string, unknown>;
  }
): void {
  if (!process.env.SENTRY_DSN) return;

  try {
    const normalized = normalizeError(error);
    
    Sentry.withScope(scope => {
      if (context?.endpoint) scope.setTag('endpoint', context.endpoint);
      if (context?.action) scope.setTag('action', context.action);
      if (context?.userId) scope.setUser({ id: String(context.userId) });
      if (context?.extra) scope.setExtras(context.extra);
      
      Sentry.captureException(normalized);
    });
  } catch (err) {
    console.error('[Sentry] Capture failed:', err);
  }
}

/**
 * Wrap an async route handler with Sentry error capturing.
 */
export function withSentry<T>(
  fn: (...args: any[]) => Promise<T>,
  context?: { endpoint?: string; action?: string }
) {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error, context);
      throw error;
    }
  };
}
