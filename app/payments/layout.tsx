import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Payment',
  'ShiQueen payment status.',
  '/payments'
);

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
