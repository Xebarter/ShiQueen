import { assertPublicFeature } from '@/lib/supabase/feature-flags-server';

export const dynamic = 'force-dynamic';

export default async function SupplierSignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertPublicFeature('supplierApplications');
  return children;
}
