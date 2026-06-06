'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useWholesale } from '@/lib/wholesale-context';
import { PackageForm } from '@/components/admin/package-form';
import toast from 'react-hot-toast';

export default function NewPackagePage() {
  const { addPackage } = useWholesale();
  const router = useRouter();

  const handleSubmit = async (data: Parameters<typeof addPackage>[0]) => {
    const pkg = {
      ...data,
      id: `pkg-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      await addPackage(pkg);
      toast.success('Package created successfully');
      router.push('/admin/wholesale/packages');
    } catch {
      toast.error('Failed to create package');
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
      <h1 className="text-3xl font-bold mb-2">Create Package</h1>
      <p className="text-muted-foreground mb-8">
        Configure a new wholesale bundle with pricing and items
      </p>
      <PackageForm onSubmit={handleSubmit} submitLabel="Create Package" />
    </div>
  );
}
