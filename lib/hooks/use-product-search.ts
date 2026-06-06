'use client';

import { useCallback, useMemo } from 'react';
import { createProductSearchIndex, ProductSearchHit } from '@/lib/product-search';
import { useProducts } from '@/lib/products-context';

export function useProductSearch() {
  const { products, loading } = useProducts();

  const index = useMemo(() => createProductSearchIndex(products), [products]);

  const search = useCallback(
    (query: string, limit?: number): ProductSearchHit[] => index.search(query, limit),
    [index]
  );

  return {
    search,
    loading,
    productCount: index.count,
  };
}
