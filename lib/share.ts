import { toAbsoluteUrl } from '@/lib/site-url';

export function buildShareUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalizedPath}`;
  }

  return toAbsoluteUrl(normalizedPath);
}

export async function shareOrCopy({
  title,
  text,
  url,
}: {
  title: string;
  text?: string;
  url: string;
}): Promise<'shared' | 'copied' | 'cancelled'> {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });
      return 'shared';
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return 'copied';
    }

    return 'cancelled';
  } catch {
    return 'cancelled';
  }
}
