'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import type { Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import type { CatalogSearchHit } from '@/lib/catalog-search';
import { HomeProductCard } from '@/components/home/home-product-card';
import {
  PackageDiscoveryCard,
  PackageDiscoveryCardSkeleton,
} from '@/components/packages/package-discovery-card';
import { PackageQuickViewModal } from '@/components/packages/package-quick-view-modal';
import { useProducts } from '@/lib/products-context';
import { useWholesale } from '@/lib/wholesale-context';
import { useCart } from '@/lib/cart-context';
import {
  getProductNameMap,
  getRetailPricesMap,
  productsToCatalog,
} from '@/lib/wholesale-data';
import {
  getPackageImage,
  mergePackageItemMaps,
  resolvePackageSavings,
} from '@/lib/package-utils';
import { trackPackageView } from '@/lib/package-merchandising';

interface CatalogSearchResultsProps {
  hits: CatalogSearchHit[];
  wishlistIds: string[];
  onWishlistChange: (ids: string[]) => void;
  onQuickView: (product: Product) => void;
  loading?: boolean;
  emptyMessage?: ReactNode;
}

export function CatalogSearchResults({
  hits,
  wishlistIds,
  onWishlistChange,
  onQuickView,
  loading = false,
  emptyMessage,
}: CatalogSearchResultsProps) {
  const { products } = useProducts();
  const { packages, setSelectedPackage } = useWholesale();
  const { addItem } = useCart();
  const [quickViewPkg, setQuickViewPkg] = useState<Package | null>(null);

  const catalog = useMemo(() => productsToCatalog(products), [products]);
  const activePackages = useMemo(() => packages.filter((pkg) => pkg.isActive), [packages]);
  const { productNames, retailPrices } = useMemo(
    () =>
      mergePackageItemMaps(
        activePackages,
        getProductNameMap(catalog),
        getRetailPricesMap(catalog)
      ),
    [activePackages, catalog]
  );

  const handleAddPackageToCart = useCallback(
    (pkg: Package, e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      setSelectedPackage(pkg);
      addItem({
        id: pkg.id,
        name: pkg.name,
        price: resolvePackageSavings(pkg, retailPrices).packagePrice,
        image: getPackageImage(pkg, products),
        quantity: 1,
      });
      trackPackageView(pkg.id);
      toast.success('Bundle added to cart!');
    },
    [addItem, products, retailPrices, setSelectedPackage]
  );

  const handlePackageQuickView = useCallback((pkg: Package) => {
    trackPackageView(pkg.id);
    setQuickViewPkg(pkg);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <PackageDiscoveryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      emptyMessage ?? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No products or bundles match your search</p>
        </div>
      )
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {hits.map((hit, index) =>
          hit.type === 'product' ? (
            <HomeProductCard
              key={`product-${hit.product.id}`}
              product={hit.product}
              variant="default"
              index={index}
              onQuickView={onQuickView}
              wishlistIds={wishlistIds}
              onWishlistChange={onWishlistChange}
            />
          ) : (
            <PackageDiscoveryCard
              key={`package-${hit.pkg.id}`}
              pkg={hit.pkg}
              products={products}
              retailPrices={retailPrices}
              variant="compact"
              index={index}
              onQuickView={handlePackageQuickView}
              onAddToCart={handleAddPackageToCart}
            />
          )
        )}
      </div>

      <PackageQuickViewModal
        pkg={quickViewPkg}
        products={products}
        productNames={productNames}
        retailPrices={retailPrices}
        onClose={() => setQuickViewPkg(null)}
        onAddToCart={(pkg) => handleAddPackageToCart(pkg)}
      />
    </>
  );
}
