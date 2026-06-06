import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { CartProvider } from '@/lib/cart-context'
import { ProductsProvider } from '@/lib/products-context'
import { WholesaleProvider } from '@/lib/wholesale-context'
import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE, BRAND_THEME } from '@/lib/brand'
import { Toaster } from 'react-hot-toast'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    'Discover curated collections of premium fashion, wellness, and lifestyle products.',
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
    title: BRAND_NAME,
    statusBarStyle: 'default',
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <WholesaleProvider>
                {children}
                <Toaster />
              </WholesaleProvider>
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
