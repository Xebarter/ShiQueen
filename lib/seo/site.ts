import type { Metadata } from 'next';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { getSiteUrl, toAbsoluteUrl } from '@/lib/site-url';
import { getDefaultOgImageUrl } from '@/lib/metadata/resolve-og-image';
import { INDEXABLE_ROBOTS, NOINDEX_ROBOTS } from '@/lib/seo/robots-policy';

export const SEO_LOCALE = 'en_UG';
export const SEO_COUNTRY = 'Uganda';
export const SEO_CITY = 'Kampala';
export const SEO_EMAIL = 'hello@shiqueen.com';

export const BRAND_ALTERNATE_NAMES = [
  'ShiQueen Uganda',
  'ShiQueen Kampala',
] as const;

export const SEO_HOME_TITLE = BRAND_NAME;

export const SEO_HOME_DESCRIPTION =
  'ShiQueen is an online shopping and booking application for women. Shop fashion, beauty, and wellness products, buy curated packages, and book lifestyle services. Sign in with Google to create an account, save favorites, place orders, and manage bookings.';

export const CORE_KEYWORDS = [
  'ShiQueen',
  'Shi Queen',
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
  const isOgJpeg =
    image.includes('/og/product/') ||
    image.includes('/og/package/') ||
    image.includes('/api/og/');
  const isJpeg = isOgJpeg || /\.jpe?g(\?|#|$)/i.test(image);
  const imageWidth = options.imageWidth ?? (isOgJpeg ? 1200 : undefined);
  const imageHeight = options.imageHeight ?? (isOgJpeg ? 1200 : undefined);
  const ogImage = {
    url: image,
    secureUrl: image.startsWith('https://') ? image : undefined,
    alt: ogTitle,
    type: isJpeg ? 'image/jpeg' : /\.png(\?|#|$)/i.test(image) ? 'image/png' : undefined,
    ...(imageWidth && imageHeight
      ? {
          width: imageWidth,
          height: imageHeight,
        }
      : {}),
  };

  return {
    title: options.absoluteTitle ? { absolute: options.title } : options.title,
    description: options.description,
    keywords: options.keywords,
    alternates: {
      canonical: url,
      languages: { 'en-UG': url, 'x-default': url },
    },
    robots: options.noIndex ? NOINDEX_ROBOTS : INDEXABLE_ROBOTS,
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
      images: imageWidth && imageHeight
        ? [{ url: image, width: imageWidth, height: imageHeight }]
        : [image],
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
      'Buy women\'s clothes, dresses, makeup, skincare, handbags, and shoes online in Uganda. ShiQueen is a ladies boutique in Kampala with delivery nationwide.',
    path: '/shop',
    keywords: [
      'women\'s online shop Uganda',
      'ladies clothes Uganda',
      'buy dresses online Uganda',
      'makeup online Uganda',
      'handbags Uganda',
      'ladies shoes Kampala',
      'ShiQueen shop',
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
      'ShiQueen salon',
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
    ],
  }),
  about: pageMetadata({
    title: `About ShiQueen`,
    description:
      'ShiQueen is a women\'s online shop and booking platform in Kampala, Uganda. We curate fashion, beauty, packages, and lifestyle services.',
    path: '/about',
    keywords: [
      'ShiQueen Uganda',
      'about ShiQueen',
      'ShiQueen Kampala',
      'women\'s shop Kampala',
    ],
  }),
  contact: pageMetadata({
    title: `Contact ShiQueen Kampala`,
    description:
      'Contact ShiQueen in Kampala, Uganda for orders, beauty bookings, wholesale, and support. WhatsApp, phone, and email — nationwide delivery.',
    path: '/contact',
    keywords: ['ShiQueen contact', 'ShiQueen Kampala', 'ladies shop Kampala'],
  }),
  faq: pageMetadata({
    title: `FAQ — Shopping, Delivery, Returns & Payments`,
    description:
      'Frequently asked questions about shopping on ShiQueen: orders, payments, delivery in Uganda, returns, refunds, beauty products, gifts, and customer support.',
    path: '/faq',
    keywords: [
      'ShiQueen FAQ',
      'ShiQueen delivery Uganda',
      'ShiQueen returns',
      'ShiQueen payment',
      'ladies online shop FAQ Uganda',
    ],
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
        'Shop women\'s clothing in Uganda — dresses, tops, jeans, two-piece sets, and office wear. Ladies fashion online in Kampala with delivery from ShiQueen.',
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
