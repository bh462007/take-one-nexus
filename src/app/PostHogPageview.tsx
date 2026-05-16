'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { trackEvent } from '@/lib/posthog';
import { getConsent } from '@/lib/cookie-consent';

function PostHogPageviewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track if analytics consent is granted
    const consent = getConsent();
    if (!consent?.analytics) return;

    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      
      // Wait for PostHog to be ready
      const capture = () => {
        if (typeof window !== 'undefined' && (window as any).posthog) {
          trackEvent('$pageview', {
            $current_url: url,
            pathname: pathname,
          });
        } else {
          // Retry in 100ms
          setTimeout(capture, 100);
        }
      };
      
      capture();
    }
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogPageview() {
  return (
    <Suspense fallback={null}>
      <PostHogPageviewInner />
    </Suspense>
  );
}
