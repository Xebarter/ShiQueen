'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SupplierForm } from '@/components/admin/supplier-form';
import { generateSupplierId } from '@/lib/firebase/suppliers';

export default function NewSupplierPage() {
  const router = useRouter();
  const [supplierId] = useState(() => {
    try {
      return generateSupplierId();
    } catch {
      return '';
    }
  });

  if (!supplierId) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="mb-2 text-2xl font-bold">Firebase not configured</h1>
        <p className="text-muted-foreground">
          Add your Firebase environment variables before creating suppliers.
        </p>
      </div>
    );
  }

  return (
    <SupplierForm
      mode="create"
      supplierId={supplierId}
      onSaved={() => router.push('/admin/suppliers')}
    />
  );
}
