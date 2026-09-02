import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ServicesPage } from '@/components/services/services-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO } from '@/lib/seo/site';
import { assertPublicFeature } from '@/lib/supabase/feature-flags-server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = PAGE_SEO.services;

export default async function ServicesRoute() {
  await assertPublicFeature('services');
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
      <NoscriptPageSummary
        title="Book Beauty, Hair & Nail Services Kampala"
        description="Book beauty services in Kampala — makeup artists, hair salon, nails, bridal makeup, and styling. ShiQueen beauty bookings for women across Uganda."
      />
    </>
  );
}
