const MAX_ENTRIES = 48;
const TTL_MS = 6 * 60 * 60 * 1000;

type CacheEntry = {
  bytes: Buffer;
  expiresAt: number;
};

const store = new Map<string, CacheEntry>();

export function getCachedOg(key: string): Buffer | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  store.delete(key);
  store.set(key, hit);
  return hit.bytes;
}

export function setCachedOg(key: string, bytes: Buffer): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { bytes, expiresAt: Date.now() + TTL_MS });
}
