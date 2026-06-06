'use client';

import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/lib/types/database';
import {
  getTrending,
  getNewArrivals,
  getBestSellers,
  getFlashDeals,
  getUnderPrice,
  getLuxuryCollection,
  getLimitedStock,
  getWholesaleProducts,
  getStaffPicks,
  getRecommended,
  getCompleteTheLook,
  getFrequentlyBoughtTogether,
  getRecentlyViewed,
  getMostWishlisted,
  getStoredWishlist,
  getStoredRecentlyViewed,
} from '@/lib/home-merchandising';

export interface MerchandisingSections {
  trending: Product[];
  heroProducts: Product[];
  flashDeals: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  under50k: Product[];
  luxury: Product[];
  limited: Product[];
  wholesale: Product[];
  staffPicks: Product[];
  recommended: Product[];
  completeLook: Product[];
  boughtTogether: Product[];
  recentlyViewed: Product[];
  wishlisted: Product[];
  buyingNow: Product[];
}

export function useProductMerchandising(products: Product[]) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    setWishlistIds(getStoredWishlist());
    setViewedIds(getStoredRecentlyViewed());
  }, []);

  const sections = useMemo((): MerchandisingSections | null => {
    if (products.length === 0) return null;
    return {
      trending: getTrending(products, 10),
      heroProducts: getTrending(products, 4),
      flashDeals: getFlashDeals(products, 8),
      newArrivals: getNewArrivals(products, 8),
      bestSellers: getBestSellers(products, 8),
      under50k: getUnderPrice(products, 500000, 8),
      luxury: getLuxuryCollection(products, 500000, 6),
      limited: getLimitedStock(products, 15, 6),
      wholesale: getWholesaleProducts(products, 6),
      staffPicks: getStaffPicks(products, 4),
      recommended: getRecommended(products, viewedIds, 8),
      completeLook: getCompleteTheLook(products, 4),
      boughtTogether: getFrequentlyBoughtTogether(products, 3),
      recentlyViewed: getRecentlyViewed(products, viewedIds),
      wishlisted: getMostWishlisted(products, wishlistIds, 6),
      buyingNow: getBestSellers(products, 6),
    };
  }, [products, viewedIds, wishlistIds]);

  return {
    sections,
    wishlistIds,
    setWishlistIds,
    viewedIds,
    quickViewProduct,
    setQuickViewProduct,
  };
}

export type ProductCardVariant = 'default' | 'compact' | 'editorial';

export function sortProducts(products: Product[], sortBy: string): Product[] {
  return [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'popular') return b.reviews - a.reviews;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export function filterByCategory(products: Product[], category: string): Product[] {
  if (category === 'all') return products;
  return products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
}

export function filterByPriceRange(
  products: Product[],
  range: 'all' | 'under-500k' | 'luxury'
): Product[] {
  if (range === 'under-500k') return products.filter((p) => p.price <= 500000);
  if (range === 'luxury') return products.filter((p) => p.price >= 500000);
  return products;
}
