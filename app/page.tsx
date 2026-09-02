import type { Metadata } from 'next';
import { HomePage } from '@/components/home/home-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { HOME_FAQS } from '@/lib/seo/home-faqs';
import { faqJsonLd, itemListJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO, SEO_HOME_DESCRIPTION, SEO_HOME_TITLE } from '@/lib/seo/site';
import { getFeatureFlags } from '@/lib/supabase/feature-flags-server';

export const metadata: Metadata = PAGE_SEO.home;

export default async function Home() {
  const flags = await getFeatureFlags();
  const catalogItems = [
    { name: 'Shop', path: '/shop' },
    ...(flags.packages ? [{ name: 'Packages', path: '/packages' }] : []),
    ...(flags.services ? [{ name: 'Beauty services', path: '/services' }] : []),
    ...(flags.wholesale ? [{ name: 'Wholesale', path: '/wholesale' }] : []),
  ];

  return (
    <>
      <JsonLd
        data={[
          faqJsonLd([...HOME_FAQS]),
          itemListJsonLd('Shop ShiQueen', catalogItems),
        ]}
      />
      <HomePage />
      <NoscriptPageSummary title={SEO_HOME_TITLE} description={SEO_HOME_DESCRIPTION} />
    </>
  );
}
