import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PackagesPage } from '@/components/packages/packages-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata: Metadata = PAGE_SEO.packages;

export default function Packages() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Packages', path: '/packages' },
        ])}
      />
      <Suspense fallback={null}>
        <PackagesPage />
      </Suspense>
      <NoscriptPageSummary
        title="Beauty Packages & Women's Bundles Uganda"
        description="Shop ShiQueen beauty packages, product bundles, and product-plus-service collections in Kampala. Curated ladies packages with real savings versus buying separately."
      />
    </>
  );
}
