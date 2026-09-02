import type { Metadata } from 'next';
import { AdminAppLayout } from '@/components/admin/admin-app-layout';
import { BRAND_ASSETS, BRAND_NAME, BRAND_THEME } from '@/lib/brand';

export const metadata: Metadata = {
  applicationName: `${BRAND_NAME} Admin`,
  robots: { index: false, follow: false },
  manifest: BRAND_ASSETS.adminManifest,
  icons: {
    apple: BRAND_ASSETS.appleTouchIcon,
  },
  appleWebApp: {
    capable: true,
    title: `${BRAND_NAME} Admin`,
    statusBarStyle: 'default',
  },
  other: {
    'theme-color': BRAND_THEME.themeColor,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAppLayout>{children}</AdminAppLayout>;
}
