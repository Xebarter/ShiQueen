'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Navigates to the previous in-app page when possible, otherwise uses fallback.
 */
export function useSmartBack(fallbackHref: string) {
  const router = useRouter();

  return useCallback(() => {
    if (typeof window === 'undefined') {
      router.push(fallbackHref);
      return;
    }

    const referrer = document.referrer;
    const sameOrigin = referrer.startsWith(window.location.origin);

    if (sameOrigin && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }, [router, fallbackHref]);
}
