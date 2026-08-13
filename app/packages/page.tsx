import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PackagesPage } from '@/components/packages/packages-page';
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
    </>
  );
}
