import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Order confirmation',
  'Your ShiQueen order confirmation.',
  '/order-confirmation'
);

export default function OrderConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
