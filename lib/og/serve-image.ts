import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

export const CACHE_CONTROL =
  'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400';

export async function serveRemoteImage(url: string): Promise<NextResponse | null> {
  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif,image/*' },
      next: { revalidate: 86400 },
    });
    if (!upstream.ok || !upstream.body) return null;

    const contentType = (upstream.headers.get('content-type') ?? 'image/jpeg')
      .split(';')[0]
      .trim();
    if (contentType.includes('avif') || (contentType && !contentType.startsWith('image/'))) {
      return null;
    }

    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': CACHE_CONTROL,
      },
    });
  } catch {
    return null;
  }
}

export async function serveDefaultOgImage(): Promise<NextResponse> {
  const buf = await readFile(join(process.cwd(), 'public/web-app-manifest-512x512.png'));
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': CACHE_CONTROL,
    },
  });
}
