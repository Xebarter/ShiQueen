import type { Metadata } from 'next';
import { HomeAppPurpose } from '@/components/home/home-app-purpose';
import { HomePage } from '@/components/home/home-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { BRAND_NAME, BRAND_PURPOSE } from '@/lib/brand';
import { HOME_FAQS } from '@/lib/seo/home-faqs';
import { faqJsonLd, itemListJsonLd, JsonLd, softwareApplicationJsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata: Metadata = PAGE_SEO.home;

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          softwareApplicationJsonLd(),
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
      <NoscriptPageSummary title={BRAND_NAME} description={BRAND_PURPOSE} />
    </>
  );
}
