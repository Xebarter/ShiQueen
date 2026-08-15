import { FaqPage } from '@/components/faq/faq-page';
import { allFaqPairs } from '@/lib/faq-content';
import { breadcrumbJsonLd, faqJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata = PAGE_SEO.faq;

export default function Faq() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(allFaqPairs()),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
        ]}
      />
      <FaqPage />
    </>
  );
}
