import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Wholesale account',
  'Apply for a ShiQueen wholesale account.',
  '/wholesale/account'
);

export default function WholesaleAccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
