import { NextResponse } from 'next/server';
import { getCachedOg, setCachedOg } from '@/lib/og/cache';
import { CACHE_CONTROL, serveDefaultOgImage } from '@/lib/og/serve-image';

export function ogJpegResponse(jpeg: Buffer): NextResponse {
  return new NextResponse(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': CACHE_CONTROL,
      'CDN-Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
      'Content-Length': String(jpeg.byteLength),
    },
  });
}

export function ogRouteId(raw: string): string {
  return decodeURIComponent(raw).replace(/\.jpe?g$/i, '');
}

export function ogHeadResponse(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': CACHE_CONTROL,
      'CDN-Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
}

export async function renderShareOgImage(options: {
  cacheKey: string;
  imageUrl?: string;
  title?: string;
  eyebrow?: string;
}): Promise<NextResponse> {
  const cached = getCachedOg(options.cacheKey);
  if (cached) return ogJpegResponse(cached);

  try {
    const { fetchOgPhotoBuffer } = await import('@/lib/og/photo');
    const { composeShareJpeg } = await import('@/lib/og/compose');
    const photo = options.imageUrl ? await fetchOgPhotoBuffer(options.imageUrl) : null;
    const jpeg = await composeShareJpeg({
      photo,
      title: options.title,
      eyebrow: options.eyebrow,
    });
    setCachedOg(options.cacheKey, jpeg);
    return ogJpegResponse(jpeg);
  } catch {
    try {
      const { composeShareJpeg } = await import('@/lib/og/compose');
      const jpeg = await composeShareJpeg({
        title: options.title,
        eyebrow: options.eyebrow,
      });
      return ogJpegResponse(jpeg);
    } catch {
      return serveDefaultOgImage();
    }
  }
}
