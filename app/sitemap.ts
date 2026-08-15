import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';
import { SHOP_SEO_CATEGORIES } from '@/lib/seo/shop-categories';
import {
  listPackagesForSitemap,
  listProductsForSitemap,
  listServiceCategoriesForSitemap,
  listServicesForSitemap,
} from '@/lib/seo/catalog-server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: origin, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${origin}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${origin}/packages`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${origin}/services`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${origin}/wholesale`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${origin}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${origin}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${origin}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${origin}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${origin}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${origin}/refunds`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${origin}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    ...SHOP_SEO_CATEGORIES.map((category) => ({
      url: `${origin}/shop/${category}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),
  ];

  const [products, packages, services, serviceCategories] = await Promise.all([
    listProductsForSitemap().catch(() => []),
    listPackagesForSitemap().catch(() => []),
    listServicesForSitemap().catch(() => []),
    listServiceCategoriesForSitemap().catch(() => []),
  ]);

  return [
    ...staticRoutes,
    ...products.map((item) => ({
      url: `${origin}/products/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...packages.map((item) => ({
      url: `${origin}/packages/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...services.map((item) => ({
      url: `${origin}/services/${item.slug ?? item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
    ...serviceCategories.map((item) => ({
      url: `${origin}/services/category/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
