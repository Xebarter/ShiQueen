import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ShopPage } from '@/components/shop/shop-page';
import { isShopSeoCategory } from '@/lib/seo/shop-categories';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/json-ld';
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
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
        ])}
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
    </>
  );
}
