import { FaqPage } from '@/components/faq/faq-page';
import { allFaqPairs } from '@/lib/faq-content';
import { breadcrumbJsonLd, faqJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata = PAGE_SEO.faq;

export default function Faq() {
  const faqs = allFaqPairs();

  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(faqs),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
        ]}
      />
      <FaqPage />
      <noscript>
        <article>
          <h1>FAQ — Shopping, Delivery, Returns & Payments</h1>
          <p>
            Frequently asked questions about shopping on ShiQueen: orders, payments, delivery in
            Uganda, returns, refunds, beauty products, gifts, and customer support.
          </p>
          {faqs.map((faq) => (
            <section key={faq.q}>
              <h2>{faq.q}</h2>
              <p>{faq.a}</p>
            </section>
          ))}
        </article>
      </noscript>
    </>
  );
}
