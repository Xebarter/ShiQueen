'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { PackageForm } from '@/components/admin/package-form';
import { useAuth } from '@/lib/auth-context';
import { useWholesale } from '@/lib/wholesale-context';
import type { Package } from '@/lib/types/wholesale';

export default function SupplierNewPackagePage() {
  const { addPackage } = useWholesale();
  const { supplierId } = useAuth();
  const router = useRouter();
  const [packageId] = useState(() => `pkg-${Date.now()}`);

  if (!supplierId) return null;

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
      router.push('/supplier/packages');
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
        backHref="/supplier/packages"
      />
    </SupplierShell>
  );
}
