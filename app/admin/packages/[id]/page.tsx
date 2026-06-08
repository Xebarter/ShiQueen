'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { AdminPage } from '@/components/admin/admin-page';
import { Button } from '@/components/ui/button';
import { useWholesale } from '@/lib/wholesale-context';
import { PackageForm } from '@/components/admin/package-form';
import toast from 'react-hot-toast';

export default function EditPackagePage() {
  const { packages, updatePackage } = useWholesale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const pkg = packages.find((p) => p.id === id);

  if (!pkg) {
    return (
      <AdminPage>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            📦
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Package not found</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            This package may have been removed or the link is incorrect.
          </p>
          <Link href="/admin/packages" className="mt-6">
            <Button>Back to packages</Button>
          </Link>
        </div>
      </AdminPage>
    );
  }

  const handleSubmit = async (data: Parameters<typeof updatePackage>[1]) => {
    try {
      await updatePackage(id, data);
      toast.success('Package updated successfully');
      router.push('/admin/packages');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update package';
      toast.error(message);
      throw error;
    }
  };

  return (
    <PackageForm
      mode="edit"
      packageId={pkg.id}
      initialData={pkg}
      onSubmit={handleSubmit}
    />
  );
}
