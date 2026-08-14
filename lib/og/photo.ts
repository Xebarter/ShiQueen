import { sniffImageType } from '@/lib/og/serve-image';

export async function fetchOgPhotoSrc(url: string): Promise<string | null> {
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

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength === 0) return null;

    const headerType = (upstream.headers.get('content-type') ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    const sniffed = sniffImageType(new Uint8Array(buffer), url);
    const contentType =
      sniffed ??
      (headerType.startsWith('image/') && !headerType.includes('avif') ? headerType : null) ??
      'image/jpeg';

    if (contentType.includes('avif')) return null;

    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}
