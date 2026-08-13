import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Account',
  'Manage your ShiQueen orders, bookings, and profile.',
  '/account'
);

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
