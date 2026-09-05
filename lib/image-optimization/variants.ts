import {
  IMAGE_OPTIMIZATION,
  IMAGE_VARIANT_NAMES,
  type ImageVariantName,
} from '@/lib/image-optimization/config';

const HASH_LEN = IMAGE_OPTIMIZATION.hashLength;
const VARIANT_RE = new RegExp(
  `/(?:[0-9a-f]{${HASH_LEN}})/(src|card|thumb|zoom)\\.(webp|jpeg|jpg)(?:\\?.*)?$`,
  'i'
);

export function productImageVariant(url: string, variant: ImageVariantName): string {
  if (!url) return url;
  const match = url.match(VARIANT_RE);
  if (!match) return url;
  return url.replace(/\/(src|card|thumb|zoom)\.(webp|jpeg|jpg)/i, `/${variant}.${match[2]}`);
}

export function isOptimizedProductImageUrl(url: string): boolean {
  return VARIANT_RE.test(url);
}

export function productImageVariantName(url: string): ImageVariantName | null {
  const match = url.match(VARIANT_RE);
  if (!match) return null;
  const name = match[1].toLowerCase() as ImageVariantName;
  return IMAGE_VARIANT_NAMES.includes(name) ? name : null;
}
