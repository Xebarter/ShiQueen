import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Book a service',
  'Complete your ShiQueen beauty booking.',
  '/services/book'
);

export default function ServiceBookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
