import type { Metadata } from 'next';
import type { Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import { BRAND_NAME } from '@/lib/brand';
import { toAbsoluteUrl } from '@/lib/site-url';

function buildImageMetadata(imageUrl?: string) {
  if (!imageUrl) return undefined;
  return [{ url: imageUrl, alt: BRAND_NAME }];
}

export function buildProductMetadata(product: Product, imageUrl?: string): Metadata {
  const url = toAbsoluteUrl(`/products/${product.id}`);
  const description =
    product.description?.trim() ||
    `Shop ${product.name} at ${BRAND_NAME}. Premium quality, curated for you.`;
  const images = buildImageMetadata(imageUrl);

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      url,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function buildPackageMetadata(
  pkg: Package,
  imageUrl?: string
): Metadata {
  const url = toAbsoluteUrl(`/packages/${pkg.id}`);
  const description =
    pkg.tagline?.trim() ||
    pkg.description?.trim() ||
    `Shop the ${pkg.name} bundle at ${BRAND_NAME}. Curated and ready to buy.`;
  const images = buildImageMetadata(imageUrl);

  return {
    title: pkg.name,
    description,
    openGraph: {
      title: pkg.name,
      description,
      url,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: pkg.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function buildFallbackMetadata(title = 'Not found'): Metadata {
  return {
    title,
    description: `This item is no longer available on ${BRAND_NAME}.`,
  };
}
