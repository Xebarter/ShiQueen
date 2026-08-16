export const BRAND_NAME = 'ShiQueen';

export const BRAND_TAGLINE = "Ladies' Lifestyle";

/** Visible homepage H1 — must state what the application is (Google OAuth branding). */
export const BRAND_PURPOSE_HEADING =
  'ShiQueen is an online shopping and booking app for women';

/**
 * Public purpose copy shown on the home page (Google OAuth branding).
 * Reviewers require the homepage itself to outline what the app does and why Sign in with Google is used.
 */
export const BRAND_PURPOSE =
  'ShiQueen is an application for shopping ladies\' fashion, beauty, and wellness products, buying curated packages, and booking trusted lifestyle services in Uganda. Customers sign in with Google only to create or access a ShiQueen account so they can save favorites, place orders, and manage bookings.';

export const BRAND_PURPOSE_POINTS = [
  {
    title: 'Shop products',
    text: 'Browse and buy fashion, beauty, and wellness items with delivery across Uganda.',
  },
  {
    title: 'Buy packages',
    text: 'Purchase curated bundles that combine products and beauty services.',
  },
  {
    title: 'Book services',
    text: 'Book makeup, hair, nails, and other lifestyle appointments.',
  },
  {
    title: 'Sign in with Google',
    text: 'Create or open your ShiQueen account to save favorites, check out, and manage orders and bookings. We only receive your name, email, and profile photo.',
  },
] as const;

export const BRAND_ASSETS = {
  faviconIco: '/favicon.ico',
  faviconSvg: '/favicon.svg',
  appleTouchIcon: '/apple-touch-icon.png',
  icon192: '/web-app-manifest-192x192.png',
  icon512: '/web-app-manifest-512x512.png',
  manifest: '/site.webmanifest',
  supplierManifest: '/suppliers.webmanifest',
  providerManifest: '/services-dashboard.webmanifest',
} as const;

export const BRAND_THEME = {
  themeColor: '#5B2850',
  backgroundColor: '#FAF5F4',
} as const;
