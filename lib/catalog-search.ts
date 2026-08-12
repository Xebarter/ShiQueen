import type { Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import type { ServiceListing } from '@/lib/types/services';
import type { ProductSearchHit } from '@/lib/product-search';
import type { PackageSearchHit } from '@/lib/package-search';
import type { ServiceSearchHit } from '@/lib/service-search';
import { filterByCategory, filterByPriceRange } from '@/lib/hooks/use-product-merchandising';
import { filterPackagesByProductCategory } from '@/lib/package-merchandising';

export type CatalogSearchHit =
  | { type: 'product'; product: Product; score: number; matchType: ProductSearchHit['matchType'] }
  | { type: 'package'; pkg: Package; score: number; matchType: PackageSearchHit['matchType'] }
  | {
      type: 'service';
      listing: ServiceListing;
      score: number;
      matchType: ServiceSearchHit['matchType'];
    };

function hitName(hit: CatalogSearchHit): string {
  if (hit.type === 'product') return hit.product.name;
  if (hit.type === 'package') return hit.pkg.name;
  return hit.listing.name;
}

export function mergeCatalogSearchHits(
  productHits: ProductSearchHit[],
  packageHits: PackageSearchHit[],
  serviceHits: ServiceSearchHit[] = [],
  limit = 8
): CatalogSearchHit[] {
  const merged: CatalogSearchHit[] = [
    ...productHits.map((hit) => ({
      type: 'product' as const,
      product: hit.product,
      score: hit.score,
      matchType: hit.matchType,
    })),
    ...packageHits.map((hit) => ({
      type: 'package' as const,
      pkg: hit.pkg,
      score: hit.score,
      matchType: hit.matchType,
    })),
    ...serviceHits.map((hit) => ({
      type: 'service' as const,
      listing: hit.listing,
      score: hit.score,
      matchType: hit.matchType,
    })),
  ];

  merged.sort(
    (a, b) => b.score - a.score || hitName(a).localeCompare(hitName(b))
  );

  return merged.slice(0, limit);
}

function packageMatchesPriceRange(
  pkg: Package,
  priceRange: 'all' | 'under-500k' | 'luxury'
): boolean {
  if (priceRange === 'all') return true;
  if (priceRange === 'under-500k') return pkg.discountedPrice < 500_000;
  return pkg.discountedPrice >= 500_000;
}

function serviceMatchesPriceRange(
  listing: ServiceListing,
  priceRange: 'all' | 'under-500k' | 'luxury'
): boolean {
  if (priceRange === 'all') return true;
  if (priceRange === 'under-500k') return listing.basePrice < 500_000;
  return listing.basePrice >= 500_000;
}

export function filterCatalogSearchHits(
  hits: CatalogSearchHit[],
  options: {
    category: string;
    priceRange: 'all' | 'under-500k' | 'luxury';
    products: Product[];
  }
): CatalogSearchHit[] {
  const { category, priceRange, products } = options;

  return hits.filter((hit) => {
    if (hit.type === 'product') {
      const categoryMatches = filterByCategory([hit.product], category);
      if (categoryMatches.length === 0) return false;
      return filterByPriceRange(categoryMatches, priceRange).length > 0;
    }

    if (hit.type === 'service') {
      // Service taxonomy is separate from shop product categories.
      if (category !== 'all') return false;
      return serviceMatchesPriceRange(hit.listing, priceRange);
    }

    if (category !== 'all') {
      const categoryMatches = filterPackagesByProductCategory([hit.pkg], products, category);
      if (categoryMatches.length === 0) return false;
    }

    return packageMatchesPriceRange(hit.pkg, priceRange);
  });
}

export function countCatalogSearchHits(hits: CatalogSearchHit[]) {
  const products = hits.filter((hit) => hit.type === 'product').length;
  const packages = hits.filter((hit) => hit.type === 'package').length;
  const services = hits.filter((hit) => hit.type === 'service').length;
  return { products, packages, services, total: hits.length };
}
