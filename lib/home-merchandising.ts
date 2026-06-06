import { Product } from '@/lib/types/database';

export interface CategoryGroup {
  slug: string;
  title: string;
  subtitle: string;
  categories: string[];
  href: string;
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    slug: 'beauty',
    title: 'Beauty Collection',
    subtitle: 'Skincare, glow essentials & daily rituals',
    categories: ['Beauty'],
    href: '/shop?category=beauty',
  },
  {
    slug: 'fashion',
    title: 'Fashion & Accessories',
    subtitle: 'Statement pieces & timeless wardrobe staples',
    categories: ['Clothing', 'Accessories'],
    href: '/shop?category=clothing',
  },
  {
    slug: 'wellness',
    title: 'Wellness & Home',
    subtitle: 'Self-care, comfort & everyday luxury',
    categories: ['Wellness', 'Home'],
    href: '/shop?category=wellness',
  },
];

/** Preserve order; drop duplicate product ids (common in merged / localStorage lists). */
export function uniqueByProductId(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

export function getDiscountPercent(product: Product): number {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

export function getTrending(products: Product[], limit = 8): Product[] {
  return [...products]
    .sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)
    .slice(0, limit);
}

export function getNewArrivals(products: Product[], limit = 8): Product[] {
  return [...products]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function getBestSellers(products: Product[], limit = 8): Product[] {
  return [...products].sort((a, b) => b.reviews - a.reviews).slice(0, limit);
}

export function getFlashDeals(products: Product[], limit = 6): Product[] {
  return [...products]
    .filter((p) => getDiscountPercent(p) >= 10)
    .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
    .slice(0, limit);
}

export function getUnderPrice(products: Product[], maxPrice: number, limit = 8): Product[] {
  return products.filter((p) => p.price <= maxPrice).slice(0, limit);
}

export function getLuxuryCollection(products: Product[], minPrice = 500000, limit = 6): Product[] {
  return products.filter((p) => p.price >= minPrice).slice(0, limit);
}

export function getLimitedStock(products: Product[], maxStock = 15, limit = 6): Product[] {
  return products
    .filter((p) => p.stock > 0 && p.stock <= maxStock)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, limit);
}

export function getWholesaleProducts(products: Product[], limit = 6): Product[] {
  return products.filter((p) => p.isWholesaleEnabled).slice(0, limit);
}

export function getStaffPicks(products: Product[], limit = 4): Product[] {
  return [...products]
    .sort((a, b) => {
      const scoreA = a.rating * 2 + (a.originalPrice ? 1 : 0);
      const scoreB = b.rating * 2 + (b.originalPrice ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

export function getByCategories(products: Product[], categories: string[], limit = 4): Product[] {
  const normalized = categories.map((c) => c.toLowerCase());
  return products
    .filter((p) => normalized.includes(p.category.toLowerCase()))
    .slice(0, limit);
}

export function getRecommended(
  products: Product[],
  viewedIds: string[],
  limit = 8
): Product[] {
  if (viewedIds.length === 0) return getTrending(products, limit);

  const viewed = products.filter((p) => viewedIds.includes(p.id));
  const categories = [...new Set(viewed.map((p) => p.category))];

  const recommended = products.filter(
    (p) => !viewedIds.includes(p.id) && categories.includes(p.category)
  );

  if (recommended.length >= limit) return uniqueByProductId(recommended).slice(0, limit);

  const recommendedIds = new Set(recommended.map((p) => p.id));
  const filler = getTrending(
    products.filter((p) => !viewedIds.includes(p.id) && !recommendedIds.has(p.id)),
    limit - recommended.length
  );
  return uniqueByProductId([...recommended, ...filler]).slice(0, limit);
}

export function getCompleteTheLook(products: Product[], limit = 4): Product[] {
  const categories = [...new Set(products.map((p) => p.category))];
  const picks: Product[] = [];

  for (const category of categories) {
    const item = products.find((p) => p.category === category && !picks.includes(p));
    if (item) picks.push(item);
    if (picks.length >= limit) break;
  }

  return picks.length >= limit ? picks.slice(0, limit) : getStaffPicks(products, limit);
}

export function getFrequentlyBoughtTogether(products: Product[], limit = 3): Product[] {
  if (products.length < 2) return products.slice(0, limit);
  const anchor = getBestSellers(products, 1)[0];
  if (!anchor) return products.slice(0, limit);

  const companions = products
    .filter((p) => p.id !== anchor.id && p.category !== anchor.category)
    .slice(0, limit - 1);

  return [anchor, ...companions].slice(0, limit);
}

export function getRecentlyViewed(products: Product[], viewedIds: string[]): Product[] {
  const seen = new Set<string>();
  const result: Product[] = [];

  for (const id of viewedIds) {
    if (seen.has(id)) continue;
    const product = products.find((p) => p.id === id);
    if (product) {
      seen.add(id);
      result.push(product);
    }
  }

  return result;
}

export function isSellingFast(product: Product): boolean {
  return product.reviews > 80 || product.stock <= 20;
}

export function isNewArrival(product: Product): boolean {
  const daysSinceCreated =
    (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreated <= 30;
}

const WISHLIST_KEY = 'wishlist';
const RECENTLY_VIEWED_KEY = 'recently_viewed';

export function getStoredWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

export function toggleStoredWishlist(productId: string): string[] {
  const current = getStoredWishlist();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wishlist-updated'));
  }
  return next;
}

export function removeFromStoredWishlist(productId: string): string[] {
  const next = getStoredWishlist().filter((id) => id !== productId);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wishlist-updated'));
  }
  return next;
}

export function getStoredRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getMostWishlisted(products: Product[], wishlistIds: string[], limit = 6): Product[] {
  if (wishlistIds.length === 0) {
    return getBestSellers(products, limit);
  }
  const wishlisted = wishlistIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
  if (wishlisted.length >= limit) return uniqueByProductId(wishlisted).slice(0, limit);
  const filler = getTrending(
    products.filter((p) => !wishlistIds.includes(p.id)),
    limit - wishlisted.length
  );
  return uniqueByProductId([...wishlisted, ...filler]).slice(0, limit);
}
