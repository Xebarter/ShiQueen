import type { Package } from '@/lib/types/wholesale';
import type { Product } from '@/lib/types/database';
import type { PackageTierId } from '@/lib/package-catalog';
import { getPackageItemName, resolvePackageSavings } from '@/lib/package-utils';

const VIEWED_PACKAGES_KEY = 'shequeen_viewed_packages';
const MAX_VIEWED = 20;

const PREMIUM_TIERS: PackageTierId[] = ['gold', 'platinum', 'diamond', 'vip'];

export type PackageSocialBadge =
  | 'signature'
  | 'premium'
  | 'new-arrival'
  | 'best-savings'
  | 'trending'
  | 'complete-solution';

export interface PackageSocialBadgeInfo {
  badge: PackageSocialBadge;
  label: string;
}

export function getPackageItemCount(pkg: Package): number {
  return pkg.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function scorePackage(pkg: Package, retailPrices: Record<string, number>): number {
  const { savingsPercentage } = resolvePackageSavings(pkg, retailPrices);
  let score = savingsPercentage * 2;

  if (pkg.isSignature) score += 25;
  if (pkg.tier && PREMIUM_TIERS.includes(pkg.tier)) score += 15;
  if (pkg.tier) score += 5;

  const daysSinceCreated =
    (Date.now() - new Date(pkg.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated <= 30) score += 12;
  if (daysSinceCreated <= 7) score += 8;

  score += Math.min(getPackageItemCount(pkg) * 2, 10);

  return score;
}

function sortByScore(
  packages: Package[],
  retailPrices: Record<string, number>
): Package[] {
  return [...packages].sort(
    (a, b) => scorePackage(b, retailPrices) - scorePackage(a, retailPrices)
  );
}

export function getFeaturedHeroPackages(
  packages: Package[],
  retailPrices: Record<string, number>,
  limit = 5
): Package[] {
  const active = packages.filter((p) => p.isActive);
  if (active.length === 0) return [];

  const picked: Package[] = [];
  const usedCategories = new Set<string>();
  const usedIds = new Set<string>();

  const signature = active.filter((p) => p.isSignature);
  for (const pkg of sortByScore(signature, retailPrices)) {
    if (picked.length >= limit) break;
    picked.push(pkg);
    usedIds.add(pkg.id);
    if (pkg.category) usedCategories.add(pkg.category);
  }

  const bySavings = [...active].sort((a, b) => {
    const sA = resolvePackageSavings(a, retailPrices).savingsPercentage;
    const sB = resolvePackageSavings(b, retailPrices).savingsPercentage;
    return sB - sA;
  });

  for (const pkg of bySavings) {
    if (picked.length >= limit) break;
    if (usedIds.has(pkg.id)) continue;
    picked.push(pkg);
    usedIds.add(pkg.id);
    if (pkg.category) usedCategories.add(pkg.category);
  }

  for (const pkg of sortByScore(active, retailPrices)) {
    if (picked.length >= limit) break;
    if (usedIds.has(pkg.id)) continue;
    if (pkg.category && usedCategories.has(pkg.category)) continue;
    picked.push(pkg);
    usedIds.add(pkg.id);
    if (pkg.category) usedCategories.add(pkg.category);
  }

  for (const pkg of sortByScore(active, retailPrices)) {
    if (picked.length >= limit) break;
    if (!usedIds.has(pkg.id)) {
      picked.push(pkg);
      usedIds.add(pkg.id);
    }
  }

  return picked.slice(0, limit);
}

export function getTrendingPackages(
  packages: Package[],
  retailPrices: Record<string, number>,
  limit = 8
): Package[] {
  return sortByScore(
    packages.filter((p) => p.isActive),
    retailPrices
  ).slice(0, limit);
}

export function getBestDealsToday(
  packages: Package[],
  retailPrices: Record<string, number>,
  limit = 8
): Package[] {
  return [...packages]
    .filter((p) => p.isActive)
    .sort((a, b) => {
      const sA = resolvePackageSavings(a, retailPrices);
      const sB = resolvePackageSavings(b, retailPrices);
      if (sB.savingsAmount !== sA.savingsAmount) {
        return sB.savingsAmount - sA.savingsAmount;
      }
      return sB.savingsPercentage - sA.savingsPercentage;
    })
    .slice(0, limit);
}

export function getMostLovedPackages(
  packages: Package[],
  retailPrices: Record<string, number>,
  limit = 8
): Package[] {
  return sortByScore(
    packages.filter((p) => p.isActive),
    retailPrices
  ).slice(0, limit);
}

export function getLuxuryPackages(
  packages: Package[],
  retailPrices: Record<string, number>,
  limit = 8
): Package[] {
  return [...packages]
    .filter(
      (p) =>
        p.isActive &&
        (p.category === 'luxury' || p.tier || p.isSignature)
    )
    .sort((a, b) => {
      return (
        resolvePackageSavings(b, retailPrices).packagePrice -
        resolvePackageSavings(a, retailPrices).packagePrice
      );
    })
    .slice(0, limit);
}

export function getUnderPricePackages(
  packages: Package[],
  retailPrices: Record<string, number>,
  maxPrice: number,
  limit = 8
): Package[] {
  return [...packages]
    .filter((p) => {
      if (!p.isActive) return false;
      return resolvePackageSavings(p, retailPrices).packagePrice <= maxPrice;
    })
    .sort(
      (a, b) =>
        resolvePackageSavings(b, retailPrices).savingsPercentage -
        resolvePackageSavings(a, retailPrices).savingsPercentage
    )
    .slice(0, limit);
}

export function getNewArrivals(packages: Package[], limit = 8): Package[] {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return [...packages]
    .filter(
      (p) => p.isActive && new Date(p.createdAt).getTime() >= thirtyDaysAgo
    )
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
}

export function getSignaturePackages(packages: Package[], limit = 8): Package[] {
  return packages.filter((p) => p.isActive && p.isSignature).slice(0, limit);
}

/** Diverse hero-quality picks for home/shop spotlights. */
export function getSpotlightPackages(
  packages: Package[],
  retailPrices: Record<string, number>,
  limit = 6
): Package[] {
  return getFeaturedHeroPackages(packages, retailPrices, limit);
}

export function filterPackagesByProductCategory(
  packages: Package[],
  products: Product[],
  category: string
): Package[] {
  const normalized = category.toLowerCase();
  if (normalized === 'all') {
    return packages.filter((p) => p.isActive);
  }

  const productCategories = new Map(
    products.map((product) => [product.id, product.category.toLowerCase()])
  );

  return packages.filter((pkg) => {
    if (!pkg.isActive) return false;
    return pkg.items.some((item) => productCategories.get(item.productId) === normalized);
  });
}

export function searchPackages(
  packages: Package[],
  term: string,
  productNames: Record<string, string>
): Package[] {
  const query = term.toLowerCase().trim();
  if (!query) return packages.filter((p) => p.isActive);

  return packages.filter((pkg) => {
    if (!pkg.isActive) return false;
    return (
      pkg.name.toLowerCase().includes(query) ||
      pkg.description.toLowerCase().includes(query) ||
      (pkg.tagline ?? '').toLowerCase().includes(query) ||
      (pkg.highlights ?? []).some((highlight) => highlight.toLowerCase().includes(query)) ||
      pkg.items.some((item) =>
        getPackageItemName(item, productNames).toLowerCase().includes(query)
      )
    );
  });
}

export function getSimilarPackages(
  pkg: Package,
  all: Package[],
  limit = 4
): Package[] {
  if (!pkg.category) return [];
  return all
    .filter(
      (p) => p.isActive && p.id !== pkg.id && p.category === pkg.category
    )
    .slice(0, limit);
}

export function getUpgradePackages(
  pkg: Package,
  all: Package[],
  retailPrices: Record<string, number>,
  limit = 4
): Package[] {
  const currentPrice = resolvePackageSavings(pkg, retailPrices).packagePrice;
  return all
    .filter((p) => {
      if (!p.isActive || p.id === pkg.id) return false;
      if (pkg.category && p.category !== pkg.category) return false;
      return resolvePackageSavings(p, retailPrices).packagePrice > currentPrice;
    })
    .sort(
      (a, b) =>
        resolvePackageSavings(a, retailPrices).packagePrice -
        resolvePackageSavings(b, retailPrices).packagePrice
    )
    .slice(0, limit);
}

export function getLuxuryTierLadder(
  packages: Package[],
  retailPrices: Record<string, number>
): Package[] {
  const tierOrder: PackageTierId[] = [
    'bronze',
    'silver',
    'gold',
    'platinum',
    'diamond',
    'vip',
  ];

  const luxury = packages.filter(
    (p) => p.isActive && (p.category === 'luxury' || p.tier)
  );

  return [...luxury].sort((a, b) => {
    const tierA = a.tier ? tierOrder.indexOf(a.tier) : -1;
    const tierB = b.tier ? tierOrder.indexOf(b.tier) : -1;
    if (tierA !== tierB) return tierA - tierB;
    return (
      resolvePackageSavings(a, retailPrices).packagePrice -
      resolvePackageSavings(b, retailPrices).packagePrice
    );
  });
}

export function getStoredViewedPackageIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VIEWED_PACKAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function trackPackageView(pkgId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredViewedPackageIds().filter((id) => id !== pkgId);
    const next = [pkgId, ...existing].slice(0, MAX_VIEWED);
    localStorage.setItem(VIEWED_PACKAGES_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function getRecommendedPackages(
  packages: Package[],
  viewedIds: string[],
  retailPrices: Record<string, number>,
  limit = 8
): Package[] {
  const active = packages.filter((p) => p.isActive);
  if (active.length === 0) return [];

  const viewedCategories = new Set(
    viewedIds
      .map((id) => active.find((p) => p.id === id)?.category)
      .filter(Boolean) as string[]
  );

  const fromViewed = active.filter(
    (p) => !viewedIds.includes(p.id) && p.category && viewedCategories.has(p.category)
  );

  const merged = [...fromViewed, ...sortByScore(active, retailPrices)];
  const seen = new Set<string>();
  const result: Package[] = [];

  for (const pkg of merged) {
    if (viewedIds.includes(pkg.id) || seen.has(pkg.id)) continue;
    seen.add(pkg.id);
    result.push(pkg);
    if (result.length >= limit) break;
  }

  return result;
}

export function getPackageSocialBadge(
  pkg: Package,
  context: {
    isTopSavings?: boolean;
    isTrending?: boolean;
  } = {}
): PackageSocialBadgeInfo | null {
  if (pkg.isSignature) {
    return { badge: 'signature', label: 'SheQueen Signature' };
  }
  if (pkg.tier && PREMIUM_TIERS.includes(pkg.tier)) {
    return { badge: 'premium', label: 'Premium pick' };
  }
  if (context.isTopSavings) {
    return { badge: 'best-savings', label: 'Best savings' };
  }
  if (context.isTrending) {
    return { badge: 'trending', label: 'Trending now' };
  }
  const daysSinceCreated =
    (Date.now() - new Date(pkg.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated <= 30) {
    return { badge: 'new-arrival', label: 'New arrival' };
  }
  if (getPackageItemCount(pkg) >= 5) {
    return { badge: 'complete-solution', label: 'Complete solution' };
  }
  return null;
}
