'use client';

export const SEARCH_HISTORY_KEY = 'shequeen-recent-searches';
export const SEARCH_HISTORY_UPDATED_EVENT = 'search-history-updated';
export const MAX_SEARCH_HISTORY = 40;

export type SearchHistorySource =
  | 'catalog'
  | 'shop'
  | 'packages'
  | 'services'
  | 'wholesale';

export type SearchHistoryEntry = {
  query: string;
  searchedAt: string;
  source?: SearchHistorySource;
};

function isEntry(value: unknown): value is SearchHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as SearchHistoryEntry;
  return typeof entry.query === 'string' && typeof entry.searchedAt === 'string';
}

function normalizeLegacy(value: unknown): SearchHistoryEntry | null {
  if (typeof value === 'string' && value.trim()) {
    return {
      query: value.trim(),
      searchedAt: new Date(0).toISOString(),
    };
  }
  if (isEntry(value) && value.query.trim()) {
    return {
      query: value.query.trim(),
      searchedAt: value.searchedAt || new Date().toISOString(),
      source: value.source,
    };
  }
  return null;
}

function notify() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SEARCH_HISTORY_UPDATED_EVENT));
}

export function readSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const entries: SearchHistoryEntry[] = [];
    for (const item of raw) {
      const entry = normalizeLegacy(item);
      if (!entry) continue;
      const key = entry.query.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(entry);
      if (entries.length >= MAX_SEARCH_HISTORY) break;
    }
    return entries;
  } catch {
    return [];
  }
}

export function readRecentSearchQueries(limit = 5): string[] {
  return readSearchHistory()
    .slice(0, limit)
    .map((entry) => entry.query);
}

export function recordSearchHistory(
  query: string,
  source: SearchHistorySource = 'catalog'
): SearchHistoryEntry[] {
  const trimmed = query.trim();
  if (!trimmed || typeof window === 'undefined') return readSearchHistory();

  const next: SearchHistoryEntry[] = [
    {
      query: trimmed,
      searchedAt: new Date().toISOString(),
      source,
    },
    ...readSearchHistory().filter(
      (entry) => entry.query.toLowerCase() !== trimmed.toLowerCase()
    ),
  ].slice(0, MAX_SEARCH_HISTORY);

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    notify();
  } catch (error) {
    console.warn('[ShiQueen] Could not save search history:', error);
  }
  return next;
}

export function removeSearchHistoryEntry(query: string): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const next = readSearchHistory().filter(
    (entry) => entry.query.toLowerCase() !== query.trim().toLowerCase()
  );
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    notify();
  } catch (error) {
    console.warn('[ShiQueen] Could not update search history:', error);
  }
  return next;
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    notify();
  } catch (error) {
    console.warn('[ShiQueen] Could not clear search history:', error);
  }
}

export function formatSearchHistoryDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return 'Earlier';
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function searchHistoryHref(entry: SearchHistoryEntry): string {
  const q = encodeURIComponent(entry.query);
  switch (entry.source) {
    case 'packages':
      return `/packages?q=${q}`;
    case 'services':
      return `/services?q=${q}`;
    case 'wholesale':
      return `/wholesale?q=${q}`;
    case 'shop':
    case 'catalog':
    default:
      return `/shop?q=${q}`;
  }
}
