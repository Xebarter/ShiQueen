import type { Metadata } from 'next';
import { HomeAppPurpose } from '@/components/home/home-app-purpose';
import { HomePage } from '@/components/home/home-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { BRAND_PURPOSE, BRAND_PURPOSE_HEADING } from '@/lib/brand';
import { HOME_FAQS } from '@/lib/seo/home-faqs';
import { faqJsonLd, itemListJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata: Metadata = PAGE_SEO.home;

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd([...HOME_FAQS]),
          itemListJsonLd('Shop ShiQueen', [
            { name: 'Shop', path: '/shop' },
            { name: 'Packages', path: '/packages' },
            { name: 'Beauty services', path: '/services' },
            { name: 'Wholesale', path: '/wholesale' },
          ]),
        ]}
      />
      <HomePage>
        <HomeAppPurpose />
      </HomePage>
      <NoscriptPageSummary title={BRAND_PURPOSE_HEADING} description={BRAND_PURPOSE} />
    </>
  );
}
