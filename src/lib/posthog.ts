/**
 * PostHog client for Take One Nexus.
 * 
 * Used ONLY for:
 * - Analytics (page views, custom events)
 * - Session Replay (with input masking)
 * - Feature Flags
 * 
 * NOT used for: error tracking, API monitoring (that's Sentry).
 * All tracking respects cookie consent preferences.
 */

import { ConsentPreferences } from './cookie-consent';

let posthogInstance: any = null;

/**
 * Initialize PostHog with consent-aware settings.
 * Call this after the user has granted consent.
 */
export async function initPostHog(consent: ConsentPreferences): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!key || typeof window === 'undefined') return;

  try {
    const posthog = (await import('posthog-js')).default;

    if (!posthogInstance) {
      console.log('[PostHog] Initializing with key:', key.slice(0, 8) + '...');
      posthog.init(key, {
        api_host: host,
        capture_pageview: false,
        capture_pageleave: true,
        session_recording: {
          maskAllInputs: true,
          maskInputOptions: { password: true },
        },
        persistence: consent.analytics ? 'localStorage+cookie' : 'memory',
        autocapture: consent.analytics,
        disable_session_recording: !consent.sessionReplay,
        bootstrap: consent.featureFlags ? {} : undefined,
        loaded: (ph: any) => {
          posthogInstance = ph;
          // Make accessible to legacy scripts
          (window as any).posthog = ph;
          console.log('[PostHog] Initialized successfully');
          
          // Send a bootstrap event
          ph.capture('posthog_initialized', {
            analytics: consent.analytics,
            replay: consent.sessionReplay,
            flags: consent.featureFlags
          });
        },
      });
    } else {
      // Update state
      if (consent.analytics) posthog.opt_in_capturing();
      else posthog.opt_out_capturing();

      if (!consent.sessionReplay) posthog.stopSessionRecording();
      else posthog.startSessionRecording();
    }
  } catch (err) {
    console.warn('[PostHog] Initialization failed:', err);
  }
}

/**
 * Opt out of all PostHog capturing.
 */
export async function optOutPostHog(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const posthog = (await import('posthog-js')).default;
    posthog.opt_out_capturing();
    posthog.stopSessionRecording();
  } catch {
    // silent fail
  }
}

/**
 * Track a custom event with IST timestamp.
 */
export async function trackEvent(event: string, properties?: Record<string, unknown>): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const posthog = (await import('posthog-js')).default;
    posthog.capture(event, {
      ...properties,
      $set_once: {
        first_visited_ist: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      },
      event_timestamp_ist: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });
  } catch {
    // silent fail
  }
}

/**
 * Identify a user after login/signup.
 */
export async function identifyUser(userId: string | number, traits?: Record<string, unknown>): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const posthog = (await import('posthog-js')).default;
    // Scrub sensitive traits
    const safe = Object.fromEntries(
      Object.entries(traits || {}).filter(
        ([k]) => !/(password|token|secret|key|hash)/i.test(k)
      )
    );
    posthog.identify(String(userId), safe);
  } catch {
    // silent fail
  }
}

/**
 * Reset identity on logout.
 */
export async function resetPostHog(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const posthog = (await import('posthog-js')).default;
    posthog.reset();
  } catch {
    // silent fail
  }
}

/**
 * Check if a feature flag is enabled.
 */
export function isFeatureEnabled(flag: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // We use the sync version here for quick checks
    const posthog = require('posthog-js').default;
    return posthog.isFeatureEnabled(flag) === true;
  } catch {
    return false;
  }
}
