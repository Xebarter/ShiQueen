import type { Product } from '@/lib/types/database';
import { isRemoteProductImage } from '@/components/product-image';
import { toAbsoluteUrl } from '@/lib/site-url';

export function toOgImageUrl(src?: string): string | undefined {
  if (!src) return undefined;
  const trimmed = src.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return toAbsoluteUrl(trimmed);
  if (isRemoteProductImage(trimmed)) return trimmed;
  return undefined;
}

export function resolveProductOgImage(product: Product): string | undefined {
  const gallery = Array.isArray(product.images) ? product.images : [];
  const candidates = [product.image, ...gallery];
  return candidates.map(toOgImageUrl).find(Boolean);
}

export function getDefaultOgImageUrl(): string {
  return toAbsoluteUrl('/web-app-manifest-512x512.png');
}
