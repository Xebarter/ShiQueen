import type { Metadata } from 'next';
import { montserrat } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { BRAND_ASSETS, BRAND_NAME, BRAND_THEME } from '@/lib/brand';

export const metadata: Metadata = {
  applicationName: `${BRAND_NAME} Supplier`,
  robots: { index: false, follow: false },
  manifest: BRAND_ASSETS.supplierManifest,
  icons: {
    apple: BRAND_ASSETS.appleTouchIcon,
  },
  appleWebApp: {
    capable: true,
    title: `${BRAND_NAME} Supplier`,
    statusBarStyle: 'default',
  },
  other: {
    'theme-color': BRAND_THEME.themeColor,
  },
};

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={cn(montserrat.className, 'min-h-[100dvh]')}>{children}</div>;
}
