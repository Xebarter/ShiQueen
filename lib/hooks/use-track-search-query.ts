'use client';

import { useEffect, useRef } from 'react';
import { recordSearchHistory, type SearchHistorySource } from '@/lib/search-history';

/**
 * Records a search query after it stays unchanged for `debounceMs`.
 * Flushes the latest query on unmount so navigating to a result still saves history.
 */
export function useTrackSearchQuery(
  query: string | null | undefined,
  source: SearchHistorySource,
  debounceMs = 900
) {
  const lastRecorded = useRef('');
  const queryRef = useRef(query);
  const sourceRef = useRef(source);
  queryRef.current = query;
  sourceRef.current = source;

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

  useEffect(() => {
    return () => {
      const trimmed = queryRef.current?.trim() ?? '';
      if (!trimmed || trimmed === lastRecorded.current) return;
      lastRecorded.current = trimmed;
      recordSearchHistory(trimmed, sourceRef.current);
    };
  }, []);
}
