import { SupplierLandingPage } from '@/components/supplier/supplier-landing-page';
import { assertPublicFeature } from '@/lib/supabase/feature-flags-server';

export const dynamic = 'force-dynamic';

export default async function SuppliersLanding() {
  await assertPublicFeature('supplierApplications');
  return <SupplierLandingPage />;
}
