import type { Metadata } from 'next';
import { HomePage } from '@/components/home/home-page';
import { BRAND_NAME, BRAND_PURPOSE, BRAND_TAGLINE } from '@/lib/brand';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: {
    absolute: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
  },
  description: BRAND_PURPOSE,
};

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: BRAND_NAME,
    url: getSiteUrl(),
    description: BRAND_PURPOSE,
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'Web',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePage />
    </>
  );
}
