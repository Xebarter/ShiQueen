const TTL_MS = 5 * 60 * 1000;
const PREFIX = 'sq-catalog-v1:';

type CacheEnvelope<T> = {
  savedAt: number;
  data: T;
};

function reviveDates<T extends { createdAt?: unknown; updatedAt?: unknown }>(item: T): T {
  return {
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt as string | number | Date) : item.createdAt,
    updatedAt: item.updatedAt ? new Date(item.updatedAt as string | number | Date) : item.updatedAt,
  };
}

export function readCatalogCache<T>(key: string): T[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T[]>;
    if (!parsed?.data || !Array.isArray(parsed.data)) return null;
    if (Date.now() - parsed.savedAt > TTL_MS) return null;
    return parsed.data.map((item) => reviveDates(item as { createdAt?: unknown; updatedAt?: unknown }) as T);
  } catch {
    return null;
  }
}

export function writeCatalogCache<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    const envelope: CacheEnvelope<T[]> = { savedAt: Date.now(), data };
    sessionStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // Quota or private mode — ignore.
  }
}
