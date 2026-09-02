import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@/lib/feature-flags';

export const PUBLIC_CRAWL_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop/clothing', label: 'Clothing' },
  { href: '/shop/beauty', label: 'Beauty' },
  { href: '/shop/wellness', label: 'Wellness' },
  { href: '/shop/accessories', label: 'Accessories' },
  { href: '/packages', label: 'Packages' },
  { href: '/services', label: 'Beauty services' },
  { href: '/wholesale', label: 'Wholesale' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
] as const;

const CRAWL_FEATURE_BY_HREF: Record<string, keyof FeatureFlags | undefined> = {
  '/packages': 'packages',
  '/services': 'services',
  '/wholesale': 'wholesale',
};

export function getPublicCrawlLinks(flags: FeatureFlags = DEFAULT_FEATURE_FLAGS) {
  return PUBLIC_CRAWL_LINKS.filter((link) => {
    const key = CRAWL_FEATURE_BY_HREF[link.href];
    return !key || flags[key];
  });
}
