import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Reset password',
  'Reset your ShiQueen account password.',
  '/forgot-password'
);

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
