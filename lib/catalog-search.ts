import type { Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import type { ProductSearchHit } from '@/lib/product-search';
import type { PackageSearchHit } from '@/lib/package-search';
import { filterByCategory, filterByPriceRange } from '@/lib/hooks/use-product-merchandising';
import { filterPackagesByProductCategory } from '@/lib/package-merchandising';

export type CatalogSearchHit =
  | { type: 'product'; product: Product; score: number; matchType: ProductSearchHit['matchType'] }
  | { type: 'package'; pkg: Package; score: number; matchType: PackageSearchHit['matchType'] };

export function mergeCatalogSearchHits(
  productHits: ProductSearchHit[],
  packageHits: PackageSearchHit[],
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
  ];

  merged.sort(
    (a, b) =>
      b.score - a.score ||
      (a.type === 'product' ? a.product.name : a.pkg.name).localeCompare(
        b.type === 'product' ? b.product.name : b.pkg.name
      )
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
  return { products, packages, total: hits.length };
}
