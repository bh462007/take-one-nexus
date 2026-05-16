'use client';

import { useEffect, useCallback } from 'react';
import { getConsent, hasConsented } from '@/lib/cookie-consent';
import { initPostHog, optOutPostHog } from '@/lib/posthog';
import PostHogPageview from '@/app/PostHogPageview';

interface PostHogProviderProps {
  children: React.ReactNode;
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
  const applyConsent = useCallback(async () => {
    if (!hasConsented()) return;
    const consent = getConsent();
    if (!consent) return;

    if (consent.analytics || consent.sessionReplay || consent.featureFlags) {
      await initPostHog(consent);
      
      // Also identify if user is logged in
      const userData = localStorage.getItem('take_one_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.id) {
            const { identifyUser } = await import('@/lib/posthog');
            identifyUser(user.id, {
              email: user.email,
              name: user.name,
              role: user.role,
              college: user.college
            });
          }
        } catch (e) {}
      }
    } else {
      await optOutPostHog();
    }
  }, []);

  useEffect(() => {
    // Apply consent on initial load
    applyConsent();

    // Listen for consent changes
    const handleConsentUpdate = () => applyConsent();
    window.addEventListener('consentUpdated', handleConsentUpdate);
    return () => window.removeEventListener('consentUpdated', handleConsentUpdate);
  }, [applyConsent]);

  return (
    <>
      <PostHogPageview />
      {children}
    </>
  );
}
