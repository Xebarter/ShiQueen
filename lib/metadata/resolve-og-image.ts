import type { Product } from '@/lib/types/database';
import { isRemoteProductImage } from '@/components/product-image';
import { toAbsoluteUrl } from '@/lib/site-url';

export function toOgImageUrl(src?: string): string | undefined {
  if (!isRemoteProductImage(src)) return undefined;
  return src;
}

export function resolveProductOgImage(product: Product): string | undefined {
  const gallery = Array.isArray(product.images) ? product.images : [];
  const candidates = [product.image, ...gallery];
  return candidates.map(toOgImageUrl).find(Boolean);
}

export function getDefaultOgImageUrl(): string {
  return toAbsoluteUrl('/web-app-manifest-512x512.png');
}
