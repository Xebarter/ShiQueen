import { sniffImageType } from '@/lib/og/serve-image';

const FETCH_TIMEOUT_MS = 3500;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_TTL_MS = 10 * 60 * 1000;

type PhotoCacheEntry = {
  buffer: Buffer | null;
  expiresAt: number;
};

const photoCache = new Map<string, PhotoCacheEntry>();

function getCachedPhoto(url: string): Buffer | null | undefined {
  const hit = photoCache.get(url);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    photoCache.delete(url);
    return undefined;
  }
  return hit.buffer;
}

function setCachedPhoto(url: string, buffer: Buffer | null): void {
  if (photoCache.size >= 32) {
    const oldest = photoCache.keys().next().value;
    if (oldest) photoCache.delete(oldest);
  }
  photoCache.set(url, { buffer, expiresAt: Date.now() + PHOTO_TTL_MS });
}

export async function fetchOgPhotoBuffer(url: string): Promise<Buffer | null> {
  const cached = getCachedPhoto(url);
  if (cached !== undefined) return cached;

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: 'image/jpeg,image/png,image/webp,image/gif,image/*,*/*',
        'User-Agent': 'ShiQueenOG/1.0',
      },
      redirect: 'follow',
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!upstream.ok) {
      if (upstream.status === 404 || upstream.status === 410) setCachedPhoto(url, null);
      return null;
    }

    const declaredLength = Number(upstream.headers.get('content-length') || 0);
    if (declaredLength > MAX_PHOTO_BYTES) {
      setCachedPhoto(url, null);
      return null;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_PHOTO_BYTES) {
      setCachedPhoto(url, null);
      return null;
    }

    const sniffed = sniffImageType(new Uint8Array(buffer), url);
    if (sniffed?.includes('avif')) {
      setCachedPhoto(url, null);
      return null;
    }

    setCachedPhoto(url, buffer);
    return buffer;
  } catch {
    return null;
  }
}
