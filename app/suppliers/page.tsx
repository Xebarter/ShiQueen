import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SupplierAuthPage } from '@/components/supplier/supplier-auth-page';
import { assertPublicFeature } from '@/lib/supabase/feature-flags-server';

export const dynamic = 'force-dynamic';

export default async function SuppliersLanding() {
  await assertPublicFeature('supplierApplications');
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SupplierAuthPage intent="welcome" />
    </Suspense>
  );
}
