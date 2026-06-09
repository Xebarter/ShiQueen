'use client';

import { useCallback, useMemo } from 'react';
import { createProductSearchIndex } from '@/lib/product-search';
import { createPackageSearchIndex } from '@/lib/package-search';
import { mergeCatalogSearchHits, type CatalogSearchHit } from '@/lib/catalog-search';
import { useProducts } from '@/lib/products-context';
import { useWholesale } from '@/lib/wholesale-context';
import {
  getProductNameMap,
  productsToCatalog,
} from '@/lib/wholesale-data';
import { mergePackageItemMaps } from '@/lib/package-utils';

export function useCatalogSearch() {
  const { products, loading: productsLoading } = useProducts();
  const { packages, loading: packagesLoading } = useWholesale();

  const catalog = useMemo(() => productsToCatalog(products), [products]);
  const activePackages = useMemo(() => packages.filter((pkg) => pkg.isActive), [packages]);

  const { productNames } = useMemo(
    () => mergePackageItemMaps(activePackages, getProductNameMap(catalog), {}),
    [activePackages, catalog]
  );

  const productIndex = useMemo(() => createProductSearchIndex(products), [products]);
  const packageIndex = useMemo(
    () => createPackageSearchIndex(activePackages, productNames),
    [activePackages, productNames]
  );

  const search = useCallback(
    (query: string, limit = 8): CatalogSearchHit[] => {
      const productHits = productIndex.search(query, limit);
      const packageHits = packageIndex.search(query, limit);
      return mergeCatalogSearchHits(productHits, packageHits, limit);
    },
    [packageIndex, productIndex]
  );

  return {
    search,
    loading: productsLoading || packagesLoading,
    catalogCount: productIndex.count + packageIndex.count,
    productCount: productIndex.count,
    packageCount: packageIndex.count,
  };
}
