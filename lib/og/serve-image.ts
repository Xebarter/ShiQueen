import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { composeShareJpeg } from '@/lib/og/compose';

export const CACHE_CONTROL =
  'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400';

export function sniffImageType(bytes: Uint8Array, fallbackUrl: string): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif';
  }

  const lower = fallbackUrl.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
  return null;
}

export async function serveRemoteImage(url: string): Promise<NextResponse | null> {
  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: 'image/jpeg,image/png,image/webp,image/gif,image/*,*/*',
        'User-Agent': 'ShiQueenOG/1.0',
      },
      redirect: 'follow',
      cache: 'no-store',
    });
    if (!upstream.ok) return null;

    const buffer = new Uint8Array(await upstream.arrayBuffer());
    if (buffer.byteLength === 0) return null;

    const headerType = (upstream.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    const sniffed = sniffImageType(buffer, url);
    const contentType =
      sniffed ??
      (headerType.startsWith('image/') && !headerType.includes('avif') ? headerType : null) ??
      'image/jpeg';

    if (contentType.includes('avif')) return null;

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': CACHE_CONTROL,
        'CDN-Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch {
    return null;
  }
}

export async function serveDefaultOgImage(): Promise<NextResponse> {
  try {
    const buf = await readFile(join(process.cwd(), 'public/web-app-manifest-512x512.png'));
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': CACHE_CONTROL,
        'CDN-Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch {
    const fallback = await composeShareJpeg({});
    return new NextResponse(new Uint8Array(fallback), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': CACHE_CONTROL,
        'CDN-Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  }
}
