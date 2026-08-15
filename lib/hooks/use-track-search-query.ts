'use client';

import { useEffect, useRef } from 'react';
import { recordSearchHistory, type SearchHistorySource } from '@/lib/search-history';

/**
 * Records a search query after it stays unchanged for `debounceMs`.
 * Use for URL-synced or live search fields so partial typing is not stored.
 */
export function useTrackSearchQuery(
  query: string | null | undefined,
  source: SearchHistorySource,
  debounceMs = 900
) {
  const lastRecorded = useRef('');

  useEffect(() => {
    const trimmed = query?.trim() ?? '';
    if (!trimmed) return;

    const timer = window.setTimeout(() => {
      if (trimmed === lastRecorded.current) return;
      lastRecorded.current = trimmed;
      recordSearchHistory(trimmed, source);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [query, source, debounceMs]);
}
