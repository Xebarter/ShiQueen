import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Sign in',
  'Sign in to your ShiQueen account.',
  '/sign-in'
);

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
