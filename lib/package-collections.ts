import type { Package } from '@/lib/types/wholesale';
import type { PackageCategoryId } from '@/lib/package-catalog';
import { resolvePackageSavings } from '@/lib/package-utils';

export type PackageCollectionGroup = 'need' | 'occasion' | 'budget';

export interface PackageCollection {
  id: string;
  title: string;
  subtitle: string;
  group: PackageCollectionGroup;
  emoji?: string;
  filter: (pkg: Package, retailPrices: Record<string, number>) => boolean;
}

function matchesKeywords(pkg: Package, keywords: string[]): boolean {
  const haystack = `${pkg.name} ${pkg.tagline ?? ''} ${pkg.description}`.toLowerCase();
  return keywords.some((k) => haystack.includes(k.toLowerCase()));
}

function hasCategory(pkg: Package, category: PackageCategoryId): boolean {
  return pkg.category === category;
}

export const PACKAGE_COLLECTIONS: PackageCollection[] = [
  // Need-based
  {
    id: 'glow-up',
    title: 'Glow Up Collection',
    subtitle: 'Everything for your transformation moment',
    group: 'need',
    emoji: '✨',
    filter: (pkg) =>
      hasCategory(pkg, 'self-care') ||
      hasCategory(pkg, 'beauty') ||
      matchesKeywords(pkg, ['glow', 'transformation', 'confidence']),
  },
  {
    id: 'weekend-self-care',
    title: 'Weekend Self-Care',
    subtitle: 'Pamper and recharge at home',
    group: 'need',
    emoji: '🛁',
    filter: (pkg) =>
      hasCategory(pkg, 'self-care') ||
      matchesKeywords(pkg, ['weekend', 'spa', 'self-care', 'relax']),
  },
  {
    id: 'beauty-transformation',
    title: 'Complete Beauty Transformation',
    subtitle: 'A full beauty reset in one bundle',
    group: 'need',
    emoji: '💄',
    filter: (pkg) =>
      hasCategory(pkg, 'beauty') ||
      matchesKeywords(pkg, ['makeup', 'glam', 'beauty', 'starter']),
  },
  {
    id: 'work-week',
    title: 'Work Week Essentials',
    subtitle: 'Polished from desk to dinner',
    group: 'need',
    emoji: '💼',
    filter: (pkg) =>
      hasCategory(pkg, 'corporate-woman') ||
      matchesKeywords(pkg, ['office', 'work', 'corporate', 'boss']),
  },
  {
    id: 'new-mom',
    title: 'New Mom Essentials',
    subtitle: 'Care for every stage of motherhood',
    group: 'need',
    emoji: '👶',
    filter: (pkg) => hasCategory(pkg, 'motherhood'),
  },
  {
    id: 'university-survival',
    title: 'University Survival',
    subtitle: 'Campus-ready on a smart budget',
    group: 'need',
    emoji: '🎓',
    filter: (pkg) => hasCategory(pkg, 'student'),
  },
  // Occasion-based
  {
    id: 'birthday-surprise',
    title: 'Birthday Surprise',
    subtitle: 'Gift-ready bundles she will adore',
    group: 'occasion',
    emoji: '🎂',
    filter: (pkg) =>
      hasCategory(pkg, 'birthday') || matchesKeywords(pkg, ['birthday']),
  },
  {
    id: 'valentines',
    title: "Valentine's Packages",
    subtitle: 'Romantic gifts that feel personal',
    group: 'occasion',
    emoji: '💝',
    filter: (pkg) =>
      matchesKeywords(pkg, ['valentine', 'romantic', 'date night', 'couples']),
  },
  {
    id: 'anniversary',
    title: 'Anniversary Gifts',
    subtitle: 'Celebrate love with a curated bundle',
    group: 'occasion',
    emoji: '💍',
    filter: (pkg) => matchesKeywords(pkg, ['anniversary', 'romantic']),
  },
  {
    id: 'bridal',
    title: 'Bridal Collections',
    subtitle: 'For the bride and her inner circle',
    group: 'occasion',
    emoji: '👰',
    filter: (pkg) => hasCategory(pkg, 'bridal'),
  },
  {
    id: 'graduation',
    title: 'Graduation Packages',
    subtitle: 'Mark the milestone in style',
    group: 'occasion',
    emoji: '🎓',
    filter: (pkg) => matchesKeywords(pkg, ['graduation', 'graduate']),
  },
  // Budget-based
  {
    id: 'under-50k',
    title: 'Under UGX 50,000',
    subtitle: 'Smart bundles that deliver value',
    group: 'budget',
    emoji: '💫',
    filter: (pkg, prices) =>
      resolvePackageSavings(pkg, prices).packagePrice <= 50000,
  },
  {
    id: 'under-100k',
    title: 'Under UGX 100,000',
    subtitle: 'Premium picks without the premium price',
    group: 'budget',
    emoji: '🌸',
    filter: (pkg, prices) =>
      resolvePackageSavings(pkg, prices).packagePrice <= 100000,
  },
  {
    id: 'luxury',
    title: 'Luxury Packages',
    subtitle: 'Our most indulgent collections',
    group: 'budget',
    emoji: '👑',
    filter: (pkg) =>
      hasCategory(pkg, 'luxury') || Boolean(pkg.tier) || pkg.isSignature,
  },
  {
    id: 'premium',
    title: 'Premium Collections',
    subtitle: 'Elevated bundles for the discerning queen',
    group: 'budget',
    emoji: '💎',
    filter: (pkg, prices) =>
      resolvePackageSavings(pkg, prices).packagePrice >= 150000 ||
      Boolean(pkg.tier),
  },
];

export function getPackageCollection(id: string): PackageCollection | undefined {
  return PACKAGE_COLLECTIONS.find((c) => c.id === id);
}

export function getCollectionsByGroup(
  group: PackageCollectionGroup
): PackageCollection[] {
  return PACKAGE_COLLECTIONS.filter((c) => c.group === group);
}

export function filterPackagesByCollection(
  packages: Package[],
  collectionId: string,
  retailPrices: Record<string, number>
): Package[] {
  const collection = getPackageCollection(collectionId);
  if (!collection) return packages;
  return packages.filter(
    (p) => p.isActive && collection.filter(p, retailPrices)
  );
}
