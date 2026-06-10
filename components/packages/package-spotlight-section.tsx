'use client';

import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ProductSection,
  ProductCarousel,
  CarouselItem,
} from '@/components/home/product-sections';
import {
  PackageDiscoveryCard,
  PackageDiscoveryCardSkeleton,
} from '@/components/packages/package-discovery-card';
import { PackageQuickViewModal } from '@/components/packages/package-quick-view-modal';
import { useWholesale } from '@/lib/wholesale-context';
import { useProducts } from '@/lib/products-context';
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
import {
  filterPackagesByProductCategory,
  getSpotlightPackages,
  searchPackages,
  trackPackageView,
} from '@/lib/package-merchandising';
import type { Package } from '@/lib/types/wholesale';

export type PackageSpotlightContext = 'home' | 'shop' | 'shop-search';

const SHOP_CATEGORY_LABELS: Record<string, string> = {
  clothing: 'Clothing',
  beauty: 'Beauty',
  wellness: 'Wellness',
  accessories: 'Accessories',
  home: 'Home',
};

interface PackageSpotlightSectionProps {
  context?: PackageSpotlightContext;
  shopCategory?: string;
  searchQuery?: string;
  limit?: number;
  className?: string;
}

function getSectionCopy(
  context: PackageSpotlightContext,
  shopCategory: string,
  searchQuery?: string
) {
  if (context === 'shop-search' && searchQuery) {
    return {
      title: 'Bundles',
      linkLabel: 'All',
    };
  }

  if (context === 'shop' && shopCategory !== 'all') {
    const label = SHOP_CATEGORY_LABELS[shopCategory] ?? shopCategory;
    return {
      title: `${label} bundles`,
      linkLabel: 'All',
    };
  }

  if (context === 'shop') {
    return {
      title: 'Bundles',
      linkLabel: 'All',
    };
  }

  return {
    title: 'Bundles',
    urgency: 'Save',
    linkLabel: 'All',
  };
}

export function PackageSpotlightSection({
  context = 'home',
  shopCategory = 'all',
  searchQuery,
  limit = 6,
  className = 'bg-primary/5',
}: PackageSpotlightSectionProps) {
  const { packages, setSelectedPackage, loading: wholesaleLoading } = useWholesale();
  const { products, loading: productsLoading } = useProducts();
  const { addItem } = useCart();
  const [quickViewPkg, setQuickViewPkg] = useState<Package | null>(null);

  const catalog = useMemo(() => productsToCatalog(products), [products]);
  const activePackages = useMemo(() => packages.filter((p) => p.isActive), [packages]);

  const { productNames, retailPrices } = useMemo(
    () =>
      mergePackageItemMaps(
        activePackages,
        getProductNameMap(catalog),
        getRetailPricesMap(catalog)
      ),
    [activePackages, catalog]
  );

  const spotlightPackages = useMemo(() => {
    let pool = activePackages;

    if (context === 'shop-search' && searchQuery?.trim()) {
      pool = searchPackages(pool, searchQuery, productNames);
    } else if (context === 'shop' && shopCategory !== 'all') {
      pool = filterPackagesByProductCategory(pool, products, shopCategory);
    }

    if (context === 'shop-search') {
      return pool.slice(0, limit);
    }

    return getSpotlightPackages(pool, retailPrices, limit);
  }, [
    activePackages,
    context,
    limit,
    productNames,
    products,
    retailPrices,
    searchQuery,
    shopCategory,
  ]);

  const copy = getSectionCopy(context, shopCategory, searchQuery);
  const loading = wholesaleLoading || productsLoading;

  const handleAddToCart = useCallback(
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

  const handleQuickView = useCallback((pkg: Package) => {
    trackPackageView(pkg.id);
    setQuickViewPkg(pkg);
  }, []);

  if (!loading && spotlightPackages.length === 0) {
    return null;
  }

  return (
    <>
      <ProductSection
        title={copy.title}
        href="/packages"
        linkLabel={copy.linkLabel}
        urgency={'urgency' in copy ? copy.urgency : undefined}
        className={className}
      >
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[min(280px,75vw)] shrink-0">
                <PackageDiscoveryCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <ProductCarousel>
            {spotlightPackages.map((pkg, i) => (
              <CarouselItem key={pkg.id} className="w-[min(280px,75vw)] sm:w-[300px]">
                <PackageDiscoveryCard
                  pkg={pkg}
                  products={products}
                  retailPrices={retailPrices}
                  variant="compact"
                  index={i}
                  minimal
                  onQuickView={handleQuickView}
                  onAddToCart={handleAddToCart}
                />
              </CarouselItem>
            ))}
          </ProductCarousel>
        )}
      </ProductSection>

      <PackageQuickViewModal
        pkg={quickViewPkg}
        products={products}
        productNames={productNames}
        retailPrices={retailPrices}
        onClose={() => setQuickViewPkg(null)}
        onAddToCart={(pkg) => handleAddToCart(pkg)}
      />
    </>
  );
}
