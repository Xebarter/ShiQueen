import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Cart',
  'Your ShiQueen shopping cart. Review items before checkout.',
  '/cart'
);

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
