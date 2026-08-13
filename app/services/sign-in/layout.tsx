import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Provider sign in',
  'Sign in to the ShiQueen services dashboard.',
  '/services/sign-in'
);

export default function ServicesSignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
