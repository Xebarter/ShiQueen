import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ShopPage } from '@/components/shop/shop-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { isShopSeoCategory } from '@/lib/seo/shop-categories';
import { breadcrumbJsonLd, itemListJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata: Metadata = PAGE_SEO.shop;

type Props = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function Shop({ searchParams }: Props) {
  const params = await searchParams;
  const category = params.category?.trim().toLowerCase();
  if (category && isShopSeoCategory(category)) {
    const query = params.q?.trim() ? `?q=${encodeURIComponent(params.q.trim())}` : '';
    redirect(`/shop/${category}${query}`);
  }

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
          ]),
          itemListJsonLd("Women's shop categories", [
            { name: 'Clothing', path: '/shop/clothing' },
            { name: 'Beauty', path: '/shop/beauty' },
            { name: 'Wellness', path: '/shop/wellness' },
            { name: 'Accessories', path: '/shop/accessories' },
            { name: 'Home', path: '/shop/home' },
          ]),
        ]}
      />
      <Suspense
        fallback={
          <main className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Loading shop...</p>
          </main>
        }
      >
        <ShopPage />
      </Suspense>
      <NoscriptPageSummary
        title="Shop Women's Fashion & Beauty Online Uganda"
        description="Buy women's clothes, dresses, makeup, skincare, handbags, and shoes online in Uganda. ShiQueen is a ladies boutique in Kampala with delivery nationwide."
      />
    </>
  );
}
