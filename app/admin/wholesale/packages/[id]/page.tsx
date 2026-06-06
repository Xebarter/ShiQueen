'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
      <div className="p-6 md:p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Package Not Found</h1>
        <Link href="/admin/wholesale/packages" className="text-primary hover:underline">
          Back to Packages
        </Link>
      </div>
    );
  }

  const handleSubmit = async (data: Parameters<typeof updatePackage>[1]) => {
    try {
      await updatePackage(id, data);
      toast.success('Package updated successfully');
      router.push('/admin/wholesale/packages');
    } catch {
      toast.error('Failed to update package');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <Link
        href="/admin/wholesale/packages"
        className="flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Packages
      </Link>
      <h1 className="text-3xl font-bold mb-2">Edit Package</h1>
      <p className="text-muted-foreground mb-8">{pkg.name}</p>
      <PackageForm initialData={pkg} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  );
}
