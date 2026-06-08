'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWholesale } from '@/lib/wholesale-context';
import { PackageForm } from '@/components/admin/package-form';
import toast from 'react-hot-toast';

export default function NewPackagePage() {
  const { addPackage } = useWholesale();
  const router = useRouter();
  const [packageId] = useState(() => `pkg-${Date.now()}`);

  const handleSubmit = async (data: Parameters<typeof addPackage>[0]) => {
    const pkg = {
      ...data,
      id: packageId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      await addPackage(pkg);
      toast.success('Package created successfully');
      router.push('/admin/packages');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create package';
      toast.error(message);
      throw error;
    }
  };

  return <PackageForm mode="create" packageId={packageId} onSubmit={handleSubmit} />;
}
