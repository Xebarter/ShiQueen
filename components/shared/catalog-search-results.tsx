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
import { ServiceCard } from '@/components/services/service-card';
import { usePublicProducts, usePublicPackages } from '@/lib/hooks/use-public-catalog';
import { useWholesale } from '@/lib/wholesale-context';
import { useCart } from '@/lib/cart-context';
import { useServices } from '@/lib/services-context';
import {
  buildPackageCatalogMaps,
  getPackageImage,
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
  const { products } = usePublicProducts();
  const { packages } = usePublicPackages();
  const { activeListings, activeProviders } = useServices();
  const { setSelectedPackage } = useWholesale();
  const { addItem } = useCart();
  const [quickViewPkg, setQuickViewPkg] = useState<Package | null>(null);

  const activePackages = useMemo(() => packages, [packages]);
  const { productNames, retailPrices } = useMemo(
    () => buildPackageCatalogMaps(products, activeListings, activePackages),
    [activePackages, products, activeListings]
  );

  const providerById = useMemo(
    () => new Map(activeProviders.map((p) => [p.id, p])),
    [activeProviders]
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
        image: getPackageImage(pkg, products, activeListings),
        quantity: 1,
      });
      trackPackageView(pkg.id);
      toast.success('Bundle added to cart!');
    },
    [addItem, activeListings, products, retailPrices, setSelectedPackage]
  );

  const handlePackageQuickView = useCallback((pkg: Package) => {
    trackPackageView(pkg.id);
    setQuickViewPkg(pkg);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
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
          <p className="text-muted-foreground">
            No products, bundles, or services match your search
          </p>
        </div>
      )
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
        {hits.map((hit, index) => {
          if (hit.type === 'product') {
            return (
              <HomeProductCard
                key={`product-${hit.product.id}`}
                product={hit.product}
                variant="default"
                index={index}
                onQuickView={onQuickView}
                wishlistIds={wishlistIds}
                onWishlistChange={onWishlistChange}
              />
            );
          }

          if (hit.type === 'service') {
            return (
              <ServiceCard
                key={`service-${hit.listing.id}`}
                listing={hit.listing}
                provider={providerById.get(hit.listing.providerId)}
                variant="compact"
                index={index}
              />
            );
          }

          return (
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
          );
        })}
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
