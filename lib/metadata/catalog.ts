import type { Metadata } from 'next';
import type { Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import type { ServiceCategory, ServiceListing } from '@/lib/types/services';
import { BRAND_NAME } from '@/lib/brand';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';
import { resolvePackageOgImage } from '@/lib/metadata/resolve-package-og-image';
import { SEO_CITY, SEO_COUNTRY, pageMetadata } from '@/lib/seo/site';
import { toAbsoluteUrl } from '@/lib/site-url';

function shareDescription(text: string, fallback: string): string {
  const trimmed = (text.replace(/\s+/g, ' ').trim() || fallback).replace(/[.;]+$/, '');
  const words = trimmed.split(/\s+/).filter(Boolean);
  const short = words.length > 8 ? `${words.slice(0, 8).join(' ')}…` : trimmed;
  return short.length > 72 ? `${short.slice(0, 69).trimEnd()}…` : short;
}

export function productOgImagePath(productId: string): string {
  return `/og/product/${encodeURIComponent(productId)}.jpg`;
}

export function packageOgImagePath(packageId: string): string {
  return `/og/package/${encodeURIComponent(packageId)}.jpg`;
}

function shareImageOptions(primary?: string, composedPath?: string) {
  if (primary) {
    return { image: primary };
  }
  if (composedPath) {
    return {
      image: toAbsoluteUrl(composedPath),
      imageWidth: 1200,
      imageHeight: 1200,
    };
  }
  return {};
}

export function buildProductMetadata(product: Product): Metadata {
  const path = `/products/${product.id}`;
  const categoryLabel = product.category?.trim() || 'fashion';
  const description = shareDescription(
    product.description,
    `Shop ${categoryLabel.toLowerCase()} at ${BRAND_NAME}.`
  );
  const productImage = resolveProductOgImage(product);

  return pageMetadata({
    title: product.name,
    description,
    path,
    ...shareImageOptions(productImage, productOgImagePath(product.id)),
    keywords: [
      product.name,
      `${product.name} Uganda`,
      `buy ${categoryLabel.toLowerCase()} Uganda`,
      `${BRAND_NAME} ${categoryLabel.toLowerCase()}`,
      'women\'s online shop Uganda',
    ],
  });
}

export async function buildPackageMetadata(pkg: Package): Promise<Metadata> {
  const path = `/packages/${pkg.id}`;
  const description = shareDescription(
    pkg.tagline || pkg.description,
    `Shop this package at ${BRAND_NAME}.`
  );
  const packageImage = await resolvePackageOgImage(pkg);

  return pageMetadata({
    title: `${pkg.name} Package`,
    description,
    path,
    ...shareImageOptions(packageImage, packageOgImagePath(pkg.id)),
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
  const description = shareDescription(
    listing.description,
    `Book ${listing.name} in ${area}.`
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
    description: shareDescription(
      category.description,
      `Book ${category.name.toLowerCase()} in ${SEO_CITY}.`
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
