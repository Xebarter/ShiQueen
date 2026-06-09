'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 767px), (prefers-reduced-motion: reduce)';

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/** True on phones and when the user prefers reduced motion — skip heavy scroll animations. */
export function useLightScroll() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
