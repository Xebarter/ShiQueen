import type { Metadata } from 'next';

/** Private app surfaces — keep these out of search and AI training crawls. */
export const ROBOTS_DISALLOW_PATHS = [
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
] as const;

/**
 * Search + generative crawlers that should explicitly be allowed.
 * Named rules override `*` for that user-agent, so they share the same disallows.
 */
export const AI_AND_SEARCH_CRAWLERS = [
  'Googlebot',
  'Google-Extended',
  'GoogleOther',
  'Google-CloudVertexBot',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'DuckAssistBot',
  'Applebot',
  'Applebot-Extended',
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'Anthropic-AI',
  'PerplexityBot',
  'Perplexity-User',
  'Amazonbot',
  'meta-externalagent',
  'FacebookBot',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'YouBot',
  'TikTokSpider',
] as const;

export const SOCIAL_PREVIEW_CRAWLERS = [
  'facebookexternalhit',
  'Twitterbot',
  'WhatsApp',
  'TelegramBot',
  'LinkedInBot',
] as const;

/** Image crawlers must reach favicons or Google Search will not show the site icon. */
export const IMAGE_CRAWLERS = ['Googlebot-Image', 'Googlebot-Video'] as const;

export const INDEXABLE_ROBOTS: NonNullable<Metadata['robots']> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
};

export const NOINDEX_ROBOTS: NonNullable<Metadata['robots']> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    'max-image-preview': 'none',
    'max-snippet': 0,
    'max-video-preview': 0,
  },
};
