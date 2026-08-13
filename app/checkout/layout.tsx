import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Checkout',
  'Complete your ShiQueen order.',
  '/checkout'
);

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
