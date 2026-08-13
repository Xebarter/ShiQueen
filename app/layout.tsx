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
import { BRAND_ASSETS, BRAND_NAME, BRAND_PURPOSE, BRAND_TAGLINE, BRAND_THEME } from '@/lib/brand'
import { figtree, playfair, workSans } from '@/lib/fonts'
import { getDefaultOgImageUrl } from '@/lib/metadata/resolve-og-image'
import { getSiteUrl } from '@/lib/site-url'
import { Toaster } from 'react-hot-toast'

const defaultOgImage = getDefaultOgImageUrl()

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: BRAND_PURPOSE,
  applicationName: BRAND_NAME,
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
    title: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
    statusBarStyle: 'default',
  },
  openGraph: {
    title: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
    siteName: BRAND_NAME,
    description: BRAND_PURPOSE,
    type: 'website',
    images: [{ url: defaultOgImage, alt: BRAND_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
    description: BRAND_PURPOSE,
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
    <html lang="en" className={`${figtree.variable} ${playfair.variable} ${workSans.variable} bg-background`}>
      <body className="font-sans antialiased">
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
