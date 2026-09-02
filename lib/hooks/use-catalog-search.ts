'use client';

import { useCallback, useMemo } from 'react';
import { createProductSearchIndex } from '@/lib/product-search';
import { createPackageSearchIndex } from '@/lib/package-search';
import { createServiceSearchIndex } from '@/lib/service-search';
import { mergeCatalogSearchHits, type CatalogSearchHit } from '@/lib/catalog-search';
import { usePublicProducts, usePublicPackages } from '@/lib/hooks/use-public-catalog';
import { useServices } from '@/lib/services-context';
import { useFeatureFlags } from '@/lib/feature-flags-context';
import { buildPackageCatalogMaps } from '@/lib/package-utils';

export function useCatalogSearch() {
  const { products, loading: productsLoading } = usePublicProducts();
  const { packages, loading: packagesLoading } = usePublicPackages();
  const {
    activeListings,
    activeProviders,
    activeCategories,
    loading: servicesLoading,
  } = useServices();
  const { flags } = useFeatureFlags();

  const activePackages = useMemo(
    () => (flags.packages ? packages : []),
    [flags.packages, packages]
  );
  const searchableListings = useMemo(
    () => (flags.services ? activeListings : []),
    [flags.services, activeListings]
  );

  const { productNames } = useMemo(
    () => buildPackageCatalogMaps(products, searchableListings, activePackages),
    [activePackages, products, searchableListings]
  );

  const productIndex = useMemo(() => createProductSearchIndex(products), [products]);
  const packageIndex = useMemo(
    () => createPackageSearchIndex(activePackages, productNames),
    [activePackages, productNames]
  );
  const serviceIndex = useMemo(
    () => createServiceSearchIndex(searchableListings, activeProviders, activeCategories),
    [searchableListings, activeProviders, activeCategories]
  );

  const search = useCallback(
    (query: string, limit = 8): CatalogSearchHit[] => {
      const productHits = productIndex.search(query, limit);
      const packageHits = packageIndex.search(query, limit);
      const serviceHits = serviceIndex.search(query, limit);
      return mergeCatalogSearchHits(productHits, packageHits, serviceHits, limit);
    },
    [packageIndex, productIndex, serviceIndex]
  );

  return {
    search,
    loading: productsLoading || packagesLoading || servicesLoading,
    catalogCount: productIndex.count + packageIndex.count + serviceIndex.count,
    productCount: productIndex.count,
    packageCount: packageIndex.count,
    serviceCount: serviceIndex.count,
  };
}
