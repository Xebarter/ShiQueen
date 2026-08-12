'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { PackageForm } from '@/components/admin/package-form';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useWholesale } from '@/lib/wholesale-context';
import type { Package } from '@/lib/types/wholesale';

export default function SupplierEditPackagePage() {
  const { packages, updatePackage } = useWholesale();
  const { supplierId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const pkg = packages.find((p) => p.id === id && p.supplierId === supplierId);

  if (!pkg) {
    return (
      <SupplierShell>
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-semibold">Package not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This package may have been removed or does not belong to your account.
          </p>
          <Link href="/supplier/packages" className="mt-6">
            <Button>Back to packages</Button>
          </Link>
        </div>
      </SupplierShell>
    );
  }

  const handleSubmit = async (
    data: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await updatePackage(id, { ...data, supplierId: supplierId! });
      toast.success('Package saved');
      router.push('/supplier/packages');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save package');
      throw error;
    }
  };

  return (
    <SupplierShell>
      <PackageForm
        mode="edit"
        packageId={pkg.id}
        initialData={pkg}
        onSubmit={handleSubmit}
        portal="supplier"
        forcedSupplierId={supplierId!}
        backHref="/supplier/packages"
      />
    </SupplierShell>
  );
}
