'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SupplierForm } from '@/components/admin/supplier-form';
import { getSupplier, getSupplierCatalogCounts } from '@/lib/firebase/suppliers';
import type { Supplier } from '@/lib/types/suppliers';
import type { SupplierCatalogCounts } from '@/lib/firebase/suppliers';

export default function EditSupplierPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supplierId = params.id;
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [counts, setCounts] = useState<SupplierCatalogCounts | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [next, nextCounts] = await Promise.all([
          getSupplier(supplierId),
          getSupplierCatalogCounts(supplierId),
        ]);
        if (cancelled) return;
        if (!next) {
          router.replace('/admin/suppliers');
          return;
        }
        setSupplier(next);
        setCounts(nextCounts);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supplierId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <SupplierForm
      mode="edit"
      supplierId={supplier.id}
      initialSupplier={supplier}
      catalogCounts={counts}
      onSaved={() => router.push(`/admin/suppliers/${supplier.id}`)}
    />
  );
}
