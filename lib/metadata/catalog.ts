import type { Metadata } from 'next';
import type { Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import type { ServiceCategory, ServiceListing } from '@/lib/types/services';
import { BRAND_NAME } from '@/lib/brand';
import { SEO_CITY, SEO_COUNTRY, pageMetadata } from '@/lib/seo/site';
import { toAbsoluteUrl } from '@/lib/site-url';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';

function firstSentence(text: string, fallback: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return fallback;
  if (trimmed.length <= 170) return trimmed;
  return `${trimmed.slice(0, 167).trimEnd()}…`;
}

export function productOgImagePath(productId: string): string {
  return `/og/product/${encodeURIComponent(productId)}.jpg`;
}

export function packageOgImagePath(packageId: string): string {
  return `/og/package/${encodeURIComponent(packageId)}.jpg`;
}

export function buildProductMetadata(product: Product): Metadata {
  const path = `/products/${product.id}`;
  const categoryLabel = product.category?.trim() || 'fashion';
  const description = firstSentence(
    product.description,
    `Buy ${product.name} online in ${SEO_CITY}, ${SEO_COUNTRY}. Shop ${categoryLabel.toLowerCase()} at ${BRAND_NAME}, formerly SheQueen.`
  );

  const cacheBust = product.updatedAt?.getTime?.() || 0;
  const productPhoto = resolveProductOgImage(product);
  const composed = toAbsoluteUrl(`${productOgImagePath(product.id)}?v=${cacheBust}`);

  return pageMetadata({
    title: product.name,
    description,
    path,
    image: productPhoto || composed,
    imageWidth: 1200,
    imageHeight: 630,
    keywords: [
      product.name,
      `${product.name} Uganda`,
      `buy ${categoryLabel.toLowerCase()} Uganda`,
      `${BRAND_NAME} ${categoryLabel.toLowerCase()}`,
      'women\'s online shop Uganda',
    ],
  });
}

export function buildPackageMetadata(pkg: Package): Metadata {
  const path = `/packages/${pkg.id}`;
  const description = firstSentence(
    pkg.tagline || pkg.description,
    `Shop the ${pkg.name} beauty package at ${BRAND_NAME} in ${SEO_CITY}. Curated women's bundle with delivery across ${SEO_COUNTRY}.`
  );

  return pageMetadata({
    title: `${pkg.name} Package`,
    description,
    path,
    image: toAbsoluteUrl(
      `${packageOgImagePath(pkg.id)}?v=${pkg.updatedAt?.getTime?.() || 0}`
    ),
    imageWidth: 1200,
    imageHeight: 630,
    keywords: [
      pkg.name,
      'beauty packages Uganda',
      'women\'s bundles Kampala',
      `${BRAND_NAME} packages`,
    ],
  });
}

export function buildServiceMetadata(listing: ServiceListing, imageUrl?: string): Metadata {
  const slug = listing.slug || listing.id;
  const path = `/services/${slug}`;
  const area = listing.location?.trim() || `${SEO_CITY}, ${SEO_COUNTRY}`;
  const description = firstSentence(
    listing.description,
    `Book ${listing.name} in ${area} with ${BRAND_NAME}. Beauty and lifestyle bookings for women in Uganda.`
  );

  return pageMetadata({
    title: `Book ${listing.name}`,
    description,
    path,
    image: imageUrl,
    keywords: [
      listing.name,
      `book ${listing.name} Kampala`,
      'beauty services Kampala',
      `${BRAND_NAME} bookings`,
    ],
  });
}

export function buildServiceCategoryMetadata(category: ServiceCategory): Metadata {
  return pageMetadata({
    title: `${category.name} in Kampala`,
    description: firstSentence(
      category.description,
      `Book ${category.name.toLowerCase()} in ${SEO_CITY} with ${BRAND_NAME}. Trusted beauty and wellness services for women in ${SEO_COUNTRY}.`
    ),
    path: `/services/category/${category.id}`,
    keywords: [category.name, `${category.name} Kampala`, 'beauty services Uganda'],
  });
}

export function buildFallbackMetadata(title = 'Not found'): Metadata {
  return {
    title,
    description: `This item is no longer available on ${BRAND_NAME}.`,
    robots: { index: false, follow: false },
  };
}

export function productCanonicalUrl(productId: string): string {
  return toAbsoluteUrl(`/products/${productId}`);
}

export function packageCanonicalUrl(packageId: string): string {
  return toAbsoluteUrl(`/packages/${packageId}`);
}

export function serviceCanonicalUrl(slug: string): string {
  return toAbsoluteUrl(`/services/${slug}`);
}
