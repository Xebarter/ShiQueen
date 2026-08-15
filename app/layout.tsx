import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { GoogleOneTap } from '@/components/auth/google-one-tap'
import { CartProvider } from '@/lib/cart-context'
import { ProductsProvider } from '@/lib/products-context'
import { MarketingAdsProvider } from '@/lib/marketing-ads-context'
import { WholesaleProvider } from '@/lib/wholesale-context'
import { ServicesProvider } from '@/lib/services-context'
import { SuppliersProvider } from '@/lib/suppliers-context'
import { BRAND_ASSETS, BRAND_NAME, BRAND_THEME } from '@/lib/brand'
import { figtree, montserrat, playfair } from '@/lib/fonts'
import { getDefaultOgImageUrl } from '@/lib/metadata/resolve-og-image'
import { CORE_KEYWORDS, SEO_HOME_DESCRIPTION, SEO_HOME_TITLE, SEO_LOCALE } from '@/lib/seo/site'
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo/json-ld'
import { getSiteUrl } from '@/lib/site-url'
import { Toaster } from 'react-hot-toast'

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
  manifest: BRAND_ASSETS.manifest,
  icons: {
    icon: [
      { url: BRAND_ASSETS.faviconIco, sizes: 'any' },
      { url: BRAND_ASSETS.faviconSvg, type: 'image/svg+xml' },
      {
        url: BRAND_ASSETS.icon192,
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: BRAND_ASSETS.appleTouchIcon,
    shortcut: BRAND_ASSETS.faviconIco,
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
    <html lang="en-UG" className={`${figtree.variable} ${montserrat.variable} ${playfair.variable} bg-background`}>
      <body className="font-sans antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <AuthProvider>
          <ProductsProvider>
            <MarketingAdsProvider>
            <CartProvider>
              <WholesaleProvider>
                <ServicesProvider>
                  <SuppliersProvider>
                  {children}
                  <GoogleOneTap />
                  <Toaster />
                  </SuppliersProvider>
                </ServicesProvider>
              </WholesaleProvider>
            </CartProvider>
            </MarketingAdsProvider>
          </ProductsProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
