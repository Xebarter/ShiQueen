import type { Metadata } from 'next';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { getSiteUrl, toAbsoluteUrl } from '@/lib/site-url';
import { getDefaultOgImageUrl } from '@/lib/metadata/resolve-og-image';

export const SEO_LOCALE = 'en_UG';
export const SEO_COUNTRY = 'Uganda';
export const SEO_CITY = 'Kampala';
export const SEO_EMAIL = 'hello@shequeen.com';

export const BRAND_ALTERNATE_NAMES = [
  'Shi Queen',
  'SheQueen',
  'She Queen',
  'ShiQueen Uganda',
  'ShiQueen Kampala',
] as const;

export const SEO_HOME_TITLE = `${BRAND_NAME} | Fashion, Beauty & Lifestyle for Women`;

export const SEO_HOME_DESCRIPTION =
  'ShiQueen is a women\'s online shop in Uganda for fashion, beauty, cosmetics, curated packages, and lifestyle bookings in Kampala. Shop dresses, makeup, skincare, handbags, and book beauty services. Formerly SheQueen.';

export const CORE_KEYWORDS = [
  'ShiQueen',
  'Shi Queen',
  'SheQueen',
  'She Queen',
  'ShiQueen Uganda',
  'ShiQueen Kampala',
  'women\'s online shop Uganda',
  'ladies online shop Uganda',
  'women\'s fashion Uganda',
  'ladies fashion Kampala',
  'makeup Uganda',
  'cosmetics Kampala',
  'beauty packages Uganda',
  'beauty services Kampala',
  'ladies boutique Uganda',
  'online boutique Kampala',
  'ShiQueen packages',
  'ShiQueen wholesale',
];

export function pageMetadata(options: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  noIndex?: boolean;
  absoluteTitle?: boolean;
}): Metadata {
  const url = toAbsoluteUrl(options.path);
  const image = options.image ?? getDefaultOgImageUrl();
  const ogTitle = options.absoluteTitle
    ? options.title
    : options.title.includes(BRAND_NAME)
      ? options.title
      : `${options.title} | ${BRAND_NAME}`;
  const ogImage = {
    url: image,
    alt: ogTitle,
    ...(options.imageWidth && options.imageHeight
      ? {
          width: options.imageWidth,
          height: options.imageHeight,
        }
      : {}),
  };

  return {
    title: options.absoluteTitle ? { absolute: options.title } : options.title,
    description: options.description,
    keywords: options.keywords,
    alternates: { canonical: url },
    robots: options.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      title: ogTitle,
      description: options.description,
      url,
      siteName: BRAND_NAME,
      locale: SEO_LOCALE,
      type: 'website',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: options.description,
      images: [image],
    },
  };
}

export function noIndexMetadata(title: string, description?: string, path = '/'): Metadata {
  return pageMetadata({
    title,
    description: description ?? `${title} on ${BRAND_NAME}.`,
    path,
    noIndex: true,
  });
}

export const PAGE_SEO = {
  home: pageMetadata({
    title: SEO_HOME_TITLE,
    description: SEO_HOME_DESCRIPTION,
    path: '/',
    keywords: CORE_KEYWORDS,
    absoluteTitle: true,
  }),
  shop: pageMetadata({
    title: `Shop Women's Fashion & Beauty Online Uganda`,
    description:
      'Buy women\'s clothes, dresses, makeup, skincare, handbags, and shoes online in Uganda. ShiQueen is a ladies boutique in Kampala with delivery nationwide. Formerly SheQueen.',
    path: '/shop',
    keywords: [
      'women\'s online shop Uganda',
      'ladies clothes Uganda',
      'buy dresses online Uganda',
      'makeup online Uganda',
      'handbags Uganda',
      'ladies shoes Kampala',
      'ShiQueen shop',
      'SheQueen shop',
    ],
  }),
  packages: pageMetadata({
    title: `Beauty Packages & Women's Bundles Uganda`,
    description:
      'Shop ShiQueen beauty packages, product bundles, and product-plus-service collections in Kampala. Curated ladies packages with real savings versus buying separately.',
    path: '/packages',
    keywords: [
      'beauty packages Uganda',
      'beauty bundles Kampala',
      'women\'s packages Uganda',
      'product and service packages Uganda',
      'ShiQueen packages',
      'SheQueen packages',
      'beauty deals Kampala',
    ],
  }),
  services: pageMetadata({
    title: `Book Beauty, Hair & Nail Services Kampala`,
    description:
      'Book beauty services in Kampala — makeup artists, hair salon, nails, bridal makeup, and styling. ShiQueen beauty bookings for women across Uganda.',
    path: '/services',
    keywords: [
      'beauty services Kampala',
      'makeup artist Kampala',
      'hair salon Kampala',
      'nail salon Kampala',
      'bridal makeup Kampala',
      'book beauty services Uganda',
      'ShiQueen beauty services',
      'SheQueen salon',
    ],
  }),
  wholesale: pageMetadata({
    title: `Wholesale Women's Fashion & Beauty Uganda`,
    description:
      'ShiQueen wholesale for bulk women\'s clothing, beauty products, and packages in Uganda. Affordable ladies wholesale from Kampala with delivery.',
    path: '/wholesale',
    keywords: [
      'wholesale women\'s clothes Uganda',
      'beauty wholesale Uganda',
      'ladies wholesale Kampala',
      'bulk beauty products Uganda',
      'ShiQueen wholesale',
      'SheQueen wholesale',
    ],
  }),
  about: pageMetadata({
    title: `About ShiQueen — Formerly SheQueen`,
    description:
      'ShiQueen is a women\'s online shop and booking platform in Kampala, Uganda. Formerly known as SheQueen, we curate fashion, beauty, packages, and lifestyle services.',
    path: '/about',
    keywords: [
      'ShiQueen formerly SheQueen',
      'SheQueen now ShiQueen',
      'ShiQueen Uganda',
      'about ShiQueen',
      'She Queen new name',
    ],
  }),
  contact: pageMetadata({
    title: `Contact ShiQueen Kampala`,
    description:
      'Contact ShiQueen in Kampala, Uganda for orders, beauty bookings, wholesale, and support. WhatsApp, phone, and email — nationwide delivery.',
    path: '/contact',
    keywords: ['ShiQueen contact', 'ShiQueen Kampala', 'ladies shop Kampala', 'SheQueen contact'],
  }),
  terms: pageMetadata({
    title: 'Terms of Service',
    description:
      'Read the ShiQueen Terms of Service covering orders, payments, shipping, returns, and your use of our online store in Uganda.',
    path: '/terms',
  }),
  privacy: pageMetadata({
    title: 'Privacy Policy',
    description:
      'Learn how ShiQueen collects, uses, shares, and protects your personal information when you shop or book services in Uganda.',
    path: '/privacy',
  }),
  refunds: pageMetadata({
    title: 'Refund Policy',
    description:
      'Learn how ShiQueen handles returns, refunds, exchanges, and order cancellations for purchases in Uganda.',
    path: '/refunds',
  }),
  cookies: pageMetadata({
    title: 'Cookie Policy',
    description:
      'Learn how ShiQueen uses cookies and similar technologies on shiqueen.com, and how you can manage your preferences.',
    path: '/cookies',
  }),
} as const;

export function shopCategorySeo(category: string): { title: string; description: string; keywords: string[] } {
  const map: Record<string, { title: string; description: string; keywords: string[] }> = {
    clothing: {
      title: `Women's Clothes & Fashion Online Uganda`,
      description:
        'Shop women\'s clothing in Uganda — dresses, tops, jeans, two-piece sets, and office wear. Ladies fashion online in Kampala with delivery. ShiQueen, formerly SheQueen.',
      keywords: [
        'women\'s clothes Uganda',
        'ladies dresses Kampala',
        'buy women\'s clothes online Uganda',
        'two piece outfits Kampala',
        'ShiQueen dresses',
      ],
    },
    beauty: {
      title: `Makeup & Cosmetics Online Uganda`,
      description:
        'Buy makeup and cosmetics in Uganda — foundation, lipstick, eye makeup, and beauty products for women. ShiQueen beauty shop in Kampala.',
      keywords: [
        'makeup Uganda',
        'cosmetics Kampala',
        'buy makeup online Uganda',
        'ShiQueen makeup',
        'beauty products Uganda',
      ],
    },
    wellness: {
      title: `Skincare & Wellness for Women Uganda`,
      description:
        'Shop skincare and wellness products for women in Uganda. Routines and essentials for African skin, delivered from Kampala.',
      keywords: [
        'skincare Uganda',
        'skincare for African skin',
        'wellness products Kampala',
        'ShiQueen skincare',
      ],
    },
    accessories: {
      title: `Handbags, Jewelry & Accessories Uganda`,
      description:
        'Shop ladies handbags, jewelry, earrings, and accessories online in Uganda. Affordable and luxury bags in Kampala at ShiQueen.',
      keywords: [
        'handbags Uganda',
        'ladies bags Kampala',
        'jewelry Uganda',
        'ShiQueen handbags',
      ],
    },
    home: {
      title: `Home & Lifestyle for Women Uganda`,
      description:
        'Discover home and lifestyle pieces for women at ShiQueen, Kampala. Shop online with delivery across Uganda.',
      keywords: ['women\'s lifestyle store Uganda', 'ShiQueen home'],
    },
  };

  return (
    map[category] ?? {
      title: `Shop ${BRAND_TAGLINE} Online`,
      description: SEO_HOME_DESCRIPTION,
      keywords: CORE_KEYWORDS,
    }
  );
}

export function getSeoOrigin(): string {
  return getSiteUrl();
}
