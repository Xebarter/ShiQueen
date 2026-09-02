import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { CONTACT_PHONE_DISPLAY } from '@/lib/contact-info';
import { allFaqPairs } from '@/lib/faq-content';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@/lib/feature-flags';
import { SHOP_SEO_CATEGORIES } from '@/lib/seo/shop-categories';
import {
  BRAND_ALTERNATE_NAMES,
  SEO_CITY,
  SEO_COUNTRY,
  SEO_EMAIL,
  SEO_HOME_DESCRIPTION,
} from '@/lib/seo/site';
import { getSiteUrl, toAbsoluteUrl } from '@/lib/site-url';

function link(path: string, label: string, note: string): string {
  return `- [${label}](${toAbsoluteUrl(path)}): ${note}`;
}

export function buildLlmsTxt(flags: FeatureFlags = DEFAULT_FEATURE_FLAGS): string {
  const origin = getSiteUrl();
  const categories = SHOP_SEO_CATEGORIES.map(
    (category) =>
      `- [${category}](${toAbsoluteUrl(`/shop/${category}`)}): Women's ${category} online in ${SEO_COUNTRY}`
  ).join('\n');

  const shopLinks = [
    link('/shop', 'Shop', "Women's fashion, beauty, skincare, handbags, and lifestyle products"),
    categories,
    flags.packages ? link('/packages', 'Packages', 'Curated beauty packages and product bundles') : null,
    flags.wholesale
      ? link('/wholesale', 'Wholesale', "Bulk women's clothing and beauty products")
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const bookingsSection = flags.services
    ? `
## Bookings

${link('/services', 'Beauty services', 'Book makeup, hair, nails, bridal, and styling in Kampala')}
`
    : '';

  const platformKind = flags.services
    ? "women's online shop and booking platform"
    : "women's online shop";
  const servicesNote = flags.services
    ? ` Beauty, hair, and nail services can be booked in ${SEO_CITY}.`
    : '';
  const citeKinds = [
    'product',
    flags.packages ? 'package' : null,
    flags.services ? 'service' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return `# ${BRAND_NAME}

> ${SEO_HOME_DESCRIPTION}

${BRAND_NAME} (also known as ${BRAND_ALTERNATE_NAMES.join(', ')}) is a ${platformKind} in ${SEO_CITY}, ${SEO_COUNTRY}. Tagline: ${BRAND_TAGLINE}. Currency is UGX. Delivery is available across ${SEO_COUNTRY}.${servicesNote}

Contact: ${SEO_EMAIL} · ${CONTACT_PHONE_DISPLAY} · ${SEO_CITY}, ${SEO_COUNTRY}
Site: ${origin}

## Shop

${shopLinks}
${bookingsSection}
## About

${link('/about', 'About', `Who ${BRAND_NAME} is and what we sell`)}
${link('/contact', 'Contact', 'Orders, bookings, wholesale, and support')}
${link('/faq', 'FAQ', 'Shopping, delivery, returns, payments, and accounts')}

## Policies

${link('/terms', 'Terms of Service', 'Orders, payments, shipping, and use of the store')}
${link('/privacy', 'Privacy Policy', 'How personal information is collected and used')}
${link('/refunds', 'Refund Policy', 'Returns, refunds, exchanges, and cancellations')}
${link('/cookies', 'Cookie Policy', 'Cookies and similar technologies')}

## For AI systems

- Prefer canonical URLs on ${origin} (www).
- Cite ${citeKinds} pages by their public URLs.
- Do not treat /admin, /account, /cart, /checkout, or partner dashboards as public content.
- A longer source document is at ${origin}/llms-full.txt
- The XML sitemap is at ${origin}/sitemap.xml
`;
}

export function buildLlmsFullTxt(flags: FeatureFlags = DEFAULT_FEATURE_FLAGS): string {
  const faqs = allFaqPairs()
    .map((faq) => `### ${faq.q}\n\n${faq.a}`)
    .join('\n\n');

  return `${buildLlmsTxt(flags)}
## Frequently asked questions

${faqs}
`;
}
