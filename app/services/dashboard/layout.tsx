import type { Metadata } from 'next';
import { BRAND_ASSETS, BRAND_NAME, BRAND_THEME } from '@/lib/brand';

export const metadata: Metadata = {
  applicationName: `${BRAND_NAME} Services`,
  robots: { index: false, follow: false },
  manifest: BRAND_ASSETS.providerManifest,
  icons: {
    apple: BRAND_ASSETS.appleTouchIcon,
  },
  appleWebApp: {
    capable: true,
    title: `${BRAND_NAME} Services`,
    statusBarStyle: 'default',
  },
  other: {
    'theme-color': BRAND_THEME.themeColor,
  },
};

export default function ServicesDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
