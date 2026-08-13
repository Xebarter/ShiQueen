'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { PartnerPage } from '@/components/partner/partner-page';
import { PackageForm } from '@/components/admin/package-form';
import { useAuth } from '@/lib/auth-context';
import { useWholesale } from '@/lib/wholesale-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { canListCatalog } from '@/lib/partner-status';
import type { Package } from '@/lib/types/wholesale';

export default function SupplierNewPackagePage() {
  const { addPackage } = useWholesale();
  const { supplierId } = useAuth();
  const { getSupplierById } = useSuppliers();
  const router = useRouter();
  const [packageId] = useState(() => `pkg-${Date.now()}`);
  const supplier = supplierId ? getSupplierById(supplierId) : undefined;
  const allowed = canListCatalog(supplier?.approvalStatus, supplier?.isActive);

  useEffect(() => {
    if (supplier && !allowed) router.replace('/suppliers/packages');
  }, [supplier, allowed, router]);

  if (!supplierId || !allowed) {
    return (
      <SupplierShell>
        <PartnerPage>
          <p className="text-sm text-muted-foreground">Listing unlocks after approval.</p>
        </PartnerPage>
      </SupplierShell>
    );
  }

  const handleSubmit = async (
    data: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await addPackage({
        ...data,
        id: packageId,
        supplierId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success('Package created');
      router.push('/suppliers/packages');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create package');
      throw error;
    }
  };

  return (
    <SupplierShell>
      <PackageForm
        mode="create"
        packageId={packageId}
        onSubmit={handleSubmit}
        portal="supplier"
        forcedSupplierId={supplierId}
        backHref="/suppliers/packages"
      />
    </SupplierShell>
  );
}
