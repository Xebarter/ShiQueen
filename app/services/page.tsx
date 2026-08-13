import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ServicesPage } from '@/components/services/services-page';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata: Metadata = PAGE_SEO.services;

export default function ServicesRoute() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
        ])}
      />
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center">
            <p className="text-muted-foreground">Loading services...</p>
          </main>
        }
      >
        <ServicesPage />
      </Suspense>
    </>
  );
}
