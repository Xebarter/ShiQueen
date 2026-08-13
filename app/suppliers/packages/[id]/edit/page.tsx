'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { PartnerPage, PartnerPageHeader } from '@/components/partner/partner-page';
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
        <PartnerPage>
          <PartnerPageHeader
            title="Package not found"
            description="This package may have been removed or does not belong to your account."
          />
          <Link href="/suppliers/packages">
            <Button>Back to packages</Button>
          </Link>
        </PartnerPage>
      </SupplierShell>
    );
  }

  const handleSubmit = async (
    data: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await updatePackage(id, { ...data, supplierId: supplierId! });
      toast.success('Package saved');
      router.push('/suppliers/packages');
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
        backHref="/suppliers/packages"
      />
    </SupplierShell>
  );
}
