import { noIndexMetadata } from '@/lib/seo/site';
import { assertProviderApplications } from '@/lib/supabase/feature-flags-server';

export const dynamic = 'force-dynamic';

export const metadata = noIndexMetadata(
  'List your services',
  'Apply to list beauty services on ShiQueen.',
  '/services/sign-up'
);

export default async function ServicesSignUpLayout({ children }: { children: React.ReactNode }) {
  await assertProviderApplications();
  return children;
}
