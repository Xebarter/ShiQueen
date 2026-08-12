'use client';

import { useMemo } from 'react';
import { useProducts } from '@/lib/products-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { useWholesale } from '@/lib/wholesale-context';
import {
  buildSuppliersById,
  isCatalogSupplierVisible,
} from '@/lib/supplier-visibility';

/** Storefront products from approved + active suppliers only. */
export function usePublicProducts() {
  const { products, loading, error, getProductById } = useProducts();
  const { suppliers, loading: suppliersLoading } = useSuppliers();

  const byId = useMemo(() => buildSuppliersById(suppliers), [suppliers]);

  const publicProducts = useMemo(
    () =>
      products.filter((product) =>
        isCatalogSupplierVisible(product.supplierId, byId)
      ),
    [products, byId]
  );

  const getPublicProductById = (id: string) => {
    const product = getProductById(id);
    if (!product) return undefined;
    return isCatalogSupplierVisible(product.supplierId, byId) ? product : undefined;
  };

  return {
    products: publicProducts,
    loading: loading || suppliersLoading,
    error,
    getProductById: getPublicProductById,
  };
}

/** Storefront packages from approved + active suppliers only. */
export function usePublicPackages() {
  const { packages, loading } = useWholesale();
  const { suppliers, loading: suppliersLoading } = useSuppliers();

  const byId = useMemo(() => buildSuppliersById(suppliers), [suppliers]);

  const publicPackages = useMemo(
    () =>
      packages.filter(
        (pkg) => pkg.isActive && isCatalogSupplierVisible(pkg.supplierId, byId)
      ),
    [packages, byId]
  );

  return {
    packages: publicPackages,
    loading: loading || suppliersLoading,
    error: null as string | null,
  };
}
