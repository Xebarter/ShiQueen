export const SHOP_SEO_CATEGORIES = [
  'clothing',
  'beauty',
  'wellness',
  'accessories',
  'home',
] as const;

export type ShopSeoCategory = (typeof SHOP_SEO_CATEGORIES)[number];

export function isShopSeoCategory(value: string): value is ShopSeoCategory {
  return (SHOP_SEO_CATEGORIES as readonly string[]).includes(value);
}

export function shopCategoryPath(category: string): string {
  const slug = category.trim().toLowerCase();
  if (slug === 'all' || !isShopSeoCategory(slug)) return '/shop';
  return `/shop/${slug}`;
}
