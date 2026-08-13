import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { CONTACT_PHONE_E164 } from '@/lib/contact-info';
import {
  BRAND_ALTERNATE_NAMES,
  SEO_CITY,
  SEO_COUNTRY,
  SEO_EMAIL,
  SEO_HOME_DESCRIPTION,
  getSeoOrigin,
} from '@/lib/seo/site';
import { toAbsoluteUrl } from '@/lib/site-url';

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd(): Record<string, unknown> {
  const origin = getSeoOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'OnlineStore'],
    name: BRAND_NAME,
    alternateName: [...BRAND_ALTERNATE_NAMES],
    url: origin,
    logo: toAbsoluteUrl(BRAND_ASSETS.icon512),
    image: toAbsoluteUrl(BRAND_ASSETS.icon512),
    description: SEO_HOME_DESCRIPTION,
    email: SEO_EMAIL,
    telephone: CONTACT_PHONE_E164,
    slogan: BRAND_TAGLINE,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SEO_CITY,
      addressCountry: 'UG',
    },
    areaServed: [
      { '@type': 'Country', name: SEO_COUNTRY },
      { '@type': 'City', name: SEO_CITY },
    ],
    priceRange: '$$',
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  const origin = getSeoOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_NAME,
    alternateName: [...BRAND_ALTERNATE_NAMES],
    url: origin,
    inLanguage: 'en-UG',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(input: {
  name: string;
  description: string;
  url: string;
  image?: string;
  sku?: string;
  brand?: string;
  price: number;
  currency?: string;
  availability: boolean;
  rating?: number;
  reviewCount?: number;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image ? [input.image] : undefined,
    sku: input.sku,
    brand: { '@type': 'Brand', name: input.brand ?? BRAND_NAME },
    offers: {
      '@type': 'Offer',
      url: input.url,
      priceCurrency: input.currency ?? 'UGX',
      price: input.price,
      availability: input.availability
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: BRAND_NAME },
    },
    ...(input.rating && input.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.rating,
            reviewCount: input.reviewCount,
          },
        }
      : {}),
  };
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  url: string;
  image?: string;
  price: number;
  area?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    provider: { '@type': 'Organization', name: BRAND_NAME },
    areaServed: input.area ?? `${SEO_CITY}, ${SEO_COUNTRY}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'UGX',
      price: input.price,
      url: input.url,
    },
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}
