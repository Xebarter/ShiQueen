import type { FeatureFlagKey, FeatureFlags } from '@/lib/feature-flags';

/** Primary storefront header navigation — order is intentional. */
export const MAIN_NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/packages', label: 'Packages' },
  { href: '/services', label: 'Services' },
  { href: '/wholesale', label: 'Wholesale' },
] as const;

const NAV_FEATURE_BY_HREF: Record<string, FeatureFlagKey | undefined> = {
  '/packages': 'packages',
  '/services': 'services',
  '/wholesale': 'wholesale',
};

export function getMainNavLinks(flags: FeatureFlags) {
  return MAIN_NAV_LINKS.filter((link) => {
    const key = NAV_FEATURE_BY_HREF[link.href];
    return !key || flags[key];
  });
}
