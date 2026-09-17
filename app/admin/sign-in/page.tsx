import { AdminSignInPage } from '@/components/admin/admin-sign-in-page';
import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Admin sign in',
  'Sign in to the ShiQueen admin dashboard.',
  '/admin/sign-in'
);

export default function AdminSignInRoute() {
  return <AdminSignInPage />;
}
