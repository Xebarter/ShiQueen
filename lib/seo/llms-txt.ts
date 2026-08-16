import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { CONTACT_PHONE_DISPLAY } from '@/lib/contact-info';
import { allFaqPairs } from '@/lib/faq-content';
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

export function buildLlmsTxt(): string {
  const origin = getSiteUrl();
  const categories = SHOP_SEO_CATEGORIES.map(
    (category) =>
      `- [${category}](${toAbsoluteUrl(`/shop/${category}`)}): Women's ${category} online in ${SEO_COUNTRY}`
  ).join('\n');

  return `# ${BRAND_NAME}

> ${SEO_HOME_DESCRIPTION}

${BRAND_NAME} (also known as ${BRAND_ALTERNATE_NAMES.join(', ')}) is a women's online shop and booking platform in ${SEO_CITY}, ${SEO_COUNTRY}. Tagline: ${BRAND_TAGLINE}. Currency is UGX. Delivery is available across ${SEO_COUNTRY}. Beauty, hair, and nail services can be booked in ${SEO_CITY}.

Contact: ${SEO_EMAIL} · ${CONTACT_PHONE_DISPLAY} · ${SEO_CITY}, ${SEO_COUNTRY}
Site: ${origin}

## Shop

${link('/shop', 'Shop', "Women's fashion, beauty, skincare, handbags, and lifestyle products")}
${categories}
${link('/packages', 'Packages', 'Curated beauty packages and product bundles')}
${link('/wholesale', 'Wholesale', "Bulk women's clothing and beauty products")}

## Bookings

${link('/services', 'Beauty services', 'Book makeup, hair, nails, bridal, and styling in Kampala')}

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
- Cite product, package, and service pages by their public URLs.
- Do not treat /admin, /account, /cart, /checkout, or partner dashboards as public content.
- A longer source document is at ${origin}/llms-full.txt
- The XML sitemap is at ${origin}/sitemap.xml
`;
}

export function buildLlmsFullTxt(): string {
  const faqs = allFaqPairs()
    .map((faq) => `### ${faq.q}\n\n${faq.a}`)
    .join('\n\n');

  return `${buildLlmsTxt()}
## Frequently asked questions

${faqs}
`;
}
