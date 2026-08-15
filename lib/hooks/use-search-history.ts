'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  SEARCH_HISTORY_UPDATED_EVENT,
  clearSearchHistory,
  readSearchHistory,
  recordSearchHistory,
  removeSearchHistoryEntry,
  type SearchHistoryEntry,
  type SearchHistorySource,
} from '@/lib/search-history';

export function useSearchHistory() {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => {
    setEntries(readSearchHistory());
    setReady(true);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(SEARCH_HISTORY_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SEARCH_HISTORY_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  const record = useCallback((query: string, source?: SearchHistorySource) => {
    setEntries(recordSearchHistory(query, source));
  }, []);

  const remove = useCallback((query: string) => {
    setEntries(removeSearchHistoryEntry(query));
  }, []);

  const clear = useCallback(() => {
    clearSearchHistory();
    setEntries([]);
  }, []);

  return { entries, ready, record, remove, clear, refresh: sync };
}
