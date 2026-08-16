import type { Metadata } from 'next';
import { HomePage } from '@/components/home/home-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { HOME_FAQS } from '@/lib/seo/home-faqs';
import { faqJsonLd, itemListJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO, SEO_HOME_DESCRIPTION, SEO_HOME_TITLE } from '@/lib/seo/site';

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
        <p
          data-speakable
          className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base"
        >
          {SEO_HOME_DESCRIPTION}
        </p>
      </HomePage>
      <NoscriptPageSummary title={SEO_HOME_TITLE} description={SEO_HOME_DESCRIPTION} />
    </>
  );
}
