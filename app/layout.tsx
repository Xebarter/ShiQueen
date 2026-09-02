import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { CompletePhoneDialog } from '@/components/auth/complete-phone-dialog'
import { GoogleOneTap } from '@/components/auth/google-one-tap'
import { CartProvider } from '@/lib/cart-context'
import { ProductsProvider } from '@/lib/products-context'
import { MarketingAdsProvider } from '@/lib/marketing-ads-context'
import { FeatureFlagsProvider } from '@/lib/feature-flags-context'
import { CommerceSettingsProvider } from '@/lib/commerce-settings-context'
import { WholesaleProvider } from '@/lib/wholesale-context'
import { ServicesProvider } from '@/lib/services-context'
import { SuppliersProvider } from '@/lib/suppliers-context'
import { BRAND_ASSETS, BRAND_NAME, BRAND_THEME } from '@/lib/brand'
import { montserrat, playfair } from '@/lib/fonts'
import { getDefaultOgImageUrl } from '@/lib/metadata/resolve-og-image'
import { CORE_KEYWORDS, SEO_HOME_DESCRIPTION, SEO_HOME_TITLE, SEO_LOCALE } from '@/lib/seo/site'
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo/json-ld'
import { INDEXABLE_ROBOTS } from '@/lib/seo/robots-policy'
import { getSiteUrl } from '@/lib/site-url'
import { Toaster } from 'react-hot-toast'
import { SignedInAlertsRuntime } from '@/components/pwa/signed-in-alerts-runtime'

const defaultOgImage = getDefaultOgImageUrl()

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SEO_HOME_TITLE,
    template: `%s | ${BRAND_NAME}`,
  },
  description: SEO_HOME_DESCRIPTION,
  keywords: [...CORE_KEYWORDS],
  applicationName: BRAND_NAME,
  authors: [{ name: BRAND_NAME, url: getSiteUrl() }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  category: 'shopping',
  referrer: 'origin-when-cross-origin',
  robots: INDEXABLE_ROBOTS,
  alternates: {
    canonical: getSiteUrl(),
    languages: {
      'en-UG': getSiteUrl(),
      'x-default': getSiteUrl(),
    },
    types: {
      'text/plain': [
        { url: '/llms.txt', title: 'llms.txt' },
        { url: '/llms-full.txt', title: 'llms-full.txt' },
      ],
    },
  },
  manifest: BRAND_ASSETS.manifest,
  icons: {
    icon: [
      {
        url: BRAND_ASSETS.faviconPng96,
        sizes: '96x96',
        type: 'image/png',
      },
      {
        url: BRAND_ASSETS.icon192,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: BRAND_ASSETS.icon512,
        sizes: '512x512',
        type: 'image/png',
      },
      {
        url: BRAND_ASSETS.faviconIco,
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
    apple: [
      {
        url: BRAND_ASSETS.appleTouchIcon,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcut: BRAND_ASSETS.faviconPng96,
  },
  appleWebApp: {
    capable: true,
    title: BRAND_NAME,
    statusBarStyle: 'default',
  },
  openGraph: {
    title: SEO_HOME_TITLE,
    siteName: BRAND_NAME,
    description: SEO_HOME_DESCRIPTION,
    type: 'website',
    locale: SEO_LOCALE,
    url: getSiteUrl(),
    images: [{
      url: defaultOgImage,
      width: 512,
      height: 512,
      alt: `${BRAND_NAME} — women's online shop Uganda`,
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_HOME_TITLE,
    description: SEO_HOME_DESCRIPTION,
    images: [defaultOgImage],
  },
}

export const viewport: Viewport = {
  themeColor: BRAND_THEME.themeColor,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-UG" className={`${montserrat.variable} ${playfair.variable} bg-background`}>
      <body className="font-sans antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <AuthProvider>
          <FeatureFlagsProvider>
          <CommerceSettingsProvider>
          <ProductsProvider>
            <MarketingAdsProvider>
            <CartProvider>
              <WholesaleProvider>
                <ServicesProvider>
                  <SuppliersProvider>
                  {children}
                  <GoogleOneTap />
                  <CompletePhoneDialog />
                  <Toaster />
                  <SignedInAlertsRuntime />
                  </SuppliersProvider>
                </ServicesProvider>
              </WholesaleProvider>
            </CartProvider>
            </MarketingAdsProvider>
          </ProductsProvider>
          </CommerceSettingsProvider>
          </FeatureFlagsProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
