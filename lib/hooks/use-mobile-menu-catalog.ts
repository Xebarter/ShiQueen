'use client';

import { useMemo } from 'react';
import { isRemoteProductImage } from '@/components/product-image';
import { getPackageCoverImages } from '@/lib/package-utils';
import { getTrending } from '@/lib/home-merchandising';
import {
  countCategoryServices,
  getProviderById,
  resolveListingImage,
} from '@/lib/services-utils';
import { usePublicProducts, usePublicPackages } from '@/lib/hooks/use-public-catalog';
import { useServices } from '@/lib/services-context';
import type { Product } from '@/lib/types/database';
import type { ServiceListing, ServiceProvider } from '@/lib/types/services';

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

function pickBestListing(
  listings: ServiceListing[],
  providers: ServiceProvider[],
  predicate: (listing: ServiceListing) => boolean
): ServiceListing | undefined {
  const providerById = new Map(providers.map((p) => [p.id, p]));
  return listings
    .filter(
      (l) =>
        predicate(l) && resolveListingImage(l, providerById.get(l.providerId))
    )
    .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)[0];
}

const SHOP_CATEGORY_DEFS = [
  { id: 'all', label: 'All', href: '/shop' },
  { id: 'clothing', label: 'Clothing', href: '/shop/clothing' },
  { id: 'beauty', label: 'Beauty', href: '/shop/beauty' },
  { id: 'wellness', label: 'Wellness', href: '/shop/wellness' },
  { id: 'accessories', label: 'Accessories', href: '/shop/accessories' },
  { id: 'home', label: 'Home', href: '/shop/home' },
] as const;

export function useMobileMenuCatalog() {
  const { products } = usePublicProducts();
  const { packages } = usePublicPackages();
  const { activeListings, activeCategories, activeProviders } = useServices();

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

    const serviceCategories: MobileMenuCategory[] = [...activeCategories]
      .filter((cat) => cat.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .filter((cat) => countCategoryServices(cat.id, activeListings) > 0)
      .map((cat) => {
        const listing = pickBestListing(
          activeListings,
          activeProviders,
          (l) => l.categoryId === cat.id
        );
        const image = listing
          ? resolveListingImage(listing, getProviderById(activeProviders, listing.providerId))
          : null;

        return {
          id: cat.id,
          label: cat.name,
          href: `/services/category/${cat.id}`,
          image: image && isRemoteProductImage(image) ? image : null,
          productName: listing?.name,
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
      ? getPackageCoverImages(
          featuredPackage,
          products,
          activeListings,
          activeProviders
        ).filter(isRemoteProductImage)
      : [];

    const packagesDestination: MobileMenuDestination = {
      href: '/packages',
      label: 'Packages',
      subtitle: 'Curated bundles & gift sets',
      image: packageCovers[0] ?? null,
    };

    const featuredListing = pickBestListing(activeListings, activeProviders, () => true);

    const servicesDestination: MobileMenuDestination = {
      href: '/services',
      label: 'Services',
      subtitle: 'Beauty, wellness & lifestyle',
      image: featuredListing
        ? resolveListingImage(
            featuredListing,
            getProviderById(activeProviders, featuredListing.providerId)
          )
        : null,
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
      serviceCategories,
      destinations: [shopDestination, packagesDestination, servicesDestination, wholesaleDestination],
      productCount: products.length,
    };
  }, [products, packages, activeListings, activeCategories, activeProviders]);
}
