'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SupplierAuthPage } from '@/components/supplier/supplier-auth-page';

export default function SupplierSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SupplierAuthPage intent="signin" />
    </Suspense>
  );
}
