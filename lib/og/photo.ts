import { sniffImageType } from '@/lib/og/serve-image';

export async function fetchOgPhotoBuffer(url: string): Promise<Buffer | null> {
  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: 'image/jpeg,image/png,image/webp,image/gif,image/*,*/*',
        'User-Agent': 'ShiQueenOG/1.0',
      },
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) return null;

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength === 0) return null;

    const sniffed = sniffImageType(new Uint8Array(buffer), url);
    if (sniffed?.includes('avif')) return null;

    return buffer;
  } catch {
    return null;
  }
}

