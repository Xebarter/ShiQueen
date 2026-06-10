'use client';

import { useMemo } from 'react';
import { isRemoteProductImage } from '@/components/product-image';
import { getPackageCoverImages } from '@/lib/package-utils';
import { getTrending } from '@/lib/home-merchandising';
import { resolveListingImage } from '@/lib/services-utils';
import { useProducts } from '@/lib/products-context';
import { useWholesale } from '@/lib/wholesale-context';
import { useServices } from '@/lib/services-context';
import type { Product } from '@/lib/types/database';

export type MobileMenuCategory = {
  id: string;
  label: string;
  href: string;
  image: string | null;
  productName?: string;
};

export type MobileMenuDestination = {
  href: string;
  label: string;
  subtitle: string;
  image: string | null;
};

function pickBestProduct(
  products: Product[],
  predicate: (product: Product) => boolean
): Product | undefined {
  return products
    .filter((p) => predicate(p) && isRemoteProductImage(p.image))
    .sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)[0];
}

const SHOP_CATEGORY_DEFS = [
  { id: 'all', label: 'All', href: '/shop' },
  { id: 'clothing', label: 'Clothing', href: '/shop?category=clothing' },
  { id: 'beauty', label: 'Beauty', href: '/shop?category=beauty' },
  { id: 'wellness', label: 'Wellness', href: '/shop?category=wellness' },
  { id: 'accessories', label: 'Accessories', href: '/shop?category=accessories' },
  { id: 'home', label: 'Home', href: '/shop?category=home' },
] as const;

export function useMobileMenuCatalog() {
  const { products } = useProducts();
  const { packages } = useWholesale();
  const { activeListings } = useServices();

  return useMemo(() => {
    const shopCategories: MobileMenuCategory[] = SHOP_CATEGORY_DEFS.map((cat) => {
      const product =
        cat.id === 'all'
          ? getTrending(products, 1)[0]
          : pickBestProduct(products, (p) => p.category.toLowerCase() === cat.id);

      return {
        id: cat.id,
        label: cat.label,
        href: cat.href,
        image: product && isRemoteProductImage(product.image) ? product.image : null,
        productName: product?.name,
      };
    });

    const shopHero = getTrending(products, 1)[0];
    const shopDestination: MobileMenuDestination = {
      href: '/shop',
      label: 'Shop',
      subtitle:
        products.length > 0
          ? `${products.length}+ curated products`
          : 'Discover our collection',
      image:
        shopHero && isRemoteProductImage(shopHero.image) ? shopHero.image : shopCategories[1]?.image,
    };

    const featuredPackage = [...packages]
      .filter((pkg) => pkg.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    const packageCovers = featuredPackage
      ? getPackageCoverImages(featuredPackage, products).filter(isRemoteProductImage)
      : [];

    const packagesDestination: MobileMenuDestination = {
      href: '/packages',
      label: 'Packages',
      subtitle: 'Curated bundles & gift sets',
      image: packageCovers[0] ?? null,
    };

    const featuredListing = [...activeListings]
      .filter((l) => resolveListingImage(l))
      .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)[0];

    const servicesDestination: MobileMenuDestination = {
      href: '/services',
      label: 'Services',
      subtitle: 'Beauty, wellness & lifestyle',
      image: featuredListing ? resolveListingImage(featuredListing) : null,
    };

    const wholesaleProduct = pickBestProduct(products, (p) => p.isWholesaleEnabled);

    const wholesaleDestination: MobileMenuDestination = {
      href: '/wholesale',
      label: 'Wholesale',
      subtitle: 'Bulk pricing for resellers',
      image: wholesaleProduct?.image && isRemoteProductImage(wholesaleProduct.image)
        ? wholesaleProduct.image
        : null,
    };

    return {
      shopCategories,
      destinations: [shopDestination, packagesDestination, servicesDestination, wholesaleDestination],
      productCount: products.length,
    };
  }, [products, packages, activeListings]);
}
