import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/account',
          '/cart',
          '/checkout',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/payments',
          '/order-confirmation',
          '/suppliers',
          '/services/dashboard',
          '/services/sign-in',
          '/services/sign-up',
          '/services/book',
          '/services/booking-confirmation',
          '/wholesale/account',
          '/api/',
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
