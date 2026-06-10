import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { GoogleOneTap } from '@/components/auth/google-one-tap'
import { CartProvider } from '@/lib/cart-context'
import { ProductsProvider } from '@/lib/products-context'
import { MarketingAdsProvider } from '@/lib/marketing-ads-context'
import { WholesaleProvider } from '@/lib/wholesale-context'
import { ServicesProvider } from '@/lib/services-context'
import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE, BRAND_THEME } from '@/lib/brand'
import { getDefaultOgImageUrl } from '@/lib/metadata/resolve-og-image'
import { getSiteUrl } from '@/lib/site-url'
import { Toaster } from 'react-hot-toast'

const defaultOgImage = getDefaultOgImageUrl()

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const brandDisplay = Playfair_Display({
  variable: '--font-brand-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    'Shop premium products, packages, and book trusted beauty, wellness, and lifestyle services.',
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
    description:
      'Shop premium products, packages, and book trusted beauty, wellness, and lifestyle services.',
    type: 'website',
    images: [{ url: defaultOgImage, alt: BRAND_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
    description:
      'Shop premium products, packages, and book trusted beauty, wellness, and lifestyle services.',
    images: [defaultOgImage],
  },
}

export const viewport: Viewport = {
  themeColor: BRAND_THEME.themeColor,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${brandDisplay.variable} bg-background`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ProductsProvider>
            <MarketingAdsProvider>
            <CartProvider>
              <WholesaleProvider>
                <ServicesProvider>
                  {children}
                  <GoogleOneTap />
                  <Toaster />
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
