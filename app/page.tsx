import type { Metadata } from 'next';
import { HomePage } from '@/components/home/home-page';
import { HOME_FAQS } from '@/lib/seo/home-faqs';
import { faqJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata: Metadata = PAGE_SEO.home;

export default function Home() {
  return (
    <>
      <JsonLd data={faqJsonLd([...HOME_FAQS])} />
      <HomePage />
    </>
  );
}
