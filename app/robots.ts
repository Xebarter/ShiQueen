import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';
import {
  AI_AND_SEARCH_CRAWLERS,
  ROBOTS_DISALLOW_PATHS,
  SOCIAL_PREVIEW_CRAWLERS,
} from '@/lib/seo/robots-policy';

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();
  const disallow = [...ROBOTS_DISALLOW_PATHS];

  return {
    rules: [
      {
        userAgent: [...SOCIAL_PREVIEW_CRAWLERS],
        allow: '/',
      },
      {
        userAgent: [...AI_AND_SEARCH_CRAWLERS],
        allow: ['/', '/llms.txt', '/llms-full.txt', '/sitemap.xml'],
        disallow,
      },
      {
        userAgent: '*',
        allow: ['/', '/llms.txt', '/llms-full.txt', '/sitemap.xml'],
        disallow,
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
