import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isRemoteProductImage } from '@/components/product-image';

function sniffMime(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif';
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return 'image/webp';
  return 'image/jpeg';
}

export function toImageDataUri(buf: ArrayBuffer, mime?: string): string {
  const bytes = new Uint8Array(buf);
  const type = mime || sniffMime(bytes);
  return `data:${type};base64,${Buffer.from(bytes).toString('base64')}`;
}

let logoPromise: Promise<string | null> | null = null;

export async function loadBrandMark(): Promise<string | null> {
  if (!logoPromise) {
    logoPromise = readFile(join(process.cwd(), 'public/web-app-manifest-192x192.png'))
      .then((buf) => `data:image/png;base64,${buf.toString('base64')}`)
      .catch(() => null);
  }
  return logoPromise;
}

export async function fetchOgPhoto(url?: string): Promise<string | null> {
  if (!isRemoteProductImage(url) || !url) return null;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif,*/*' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('avif') || (contentType && !contentType.startsWith('image/'))) {
      return null;
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength < 64 || buf.byteLength > 8_000_000) return null;
    return toImageDataUri(buf, contentType.split(';')[0]?.trim());
  } catch {
    return null;
  }
}
