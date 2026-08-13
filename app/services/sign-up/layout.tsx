import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'List your services',
  'Apply to list beauty services on ShiQueen.',
  '/services/sign-up'
);

export default function ServicesSignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
