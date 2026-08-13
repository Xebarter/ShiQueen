'use client';

const SW_URL = '/sw.js';

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function registerPartnerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register(SW_URL, { scope: '/' })
      .catch((error) => {
        console.warn('[ShiQueen] Service worker registration failed:', error);
        registrationPromise = null;
        return null;
      });
  }

  return registrationPromise;
}
