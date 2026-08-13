import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Create account',
  'Create a ShiQueen account to shop and book beauty services.',
  '/sign-up'
);

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
