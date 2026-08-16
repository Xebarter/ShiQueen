import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ShopPage } from '@/components/shop/shop-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { isShopSeoCategory, SHOP_SEO_CATEGORIES, shopCategoryPath } from '@/lib/seo/shop-categories';
import { pageMetadata, shopCategorySeo } from '@/lib/seo/site';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/json-ld';

type Props = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return SHOP_SEO_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const slug = category.toLowerCase();
  if (!isShopSeoCategory(slug)) {
    return pageMetadata({
      title: 'Shop',
      description: 'Shop women\'s fashion and beauty online in Uganda.',
      path: '/shop',
    });
  }
  const seo = shopCategorySeo(slug);
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: `/shop/${slug}`,
    keywords: seo.keywords,
  });
}

export default async function ShopCategoryPage({ params }: Props) {
  const { category } = await params;
  const slug = category.toLowerCase();
  if (!isShopSeoCategory(slug)) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
          { name: slug.charAt(0).toUpperCase() + slug.slice(1), path: shopCategoryPath(slug) },
        ])}
      />
      <Suspense
        fallback={
          <main className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Loading shop...</p>
          </main>
        }
      >
        <ShopPage initialCategory={slug} />
      </Suspense>
      <NoscriptPageSummary
        title={shopCategorySeo(slug).title}
        description={shopCategorySeo(slug).description}
      />
    </>
  );
}
