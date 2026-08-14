import { NextResponse } from 'next/server';
import { getCachedOg, setCachedOg } from '@/lib/og/cache';
import { composeShareJpeg } from '@/lib/og/compose';
import { fetchOgPhotoBuffer } from '@/lib/og/photo';
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

export async function renderShareOgImage(options: {
  cacheKey: string;
  imageUrl?: string;
  title?: string;
  eyebrow?: string;
}): Promise<NextResponse> {
  const cached = getCachedOg(options.cacheKey);
  if (cached) return ogJpegResponse(cached);

  const photo = options.imageUrl ? await fetchOgPhotoBuffer(options.imageUrl) : null;

  try {
    const jpeg = await composeShareJpeg({
      photo,
      title: options.title,
      eyebrow: options.eyebrow,
    });
    setCachedOg(options.cacheKey, jpeg);
    return ogJpegResponse(jpeg);
  } catch {
    try {
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
