'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { PartnerPage } from '@/components/partner/partner-page';
import { ProductForm } from '@/components/admin/product-form';
import { useAuth } from '@/lib/auth-context';
import { getProduct } from '@/lib/firebase/products';
import type { Product } from '@/lib/types/database';

export default function SupplierEditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { supplierId } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await getProduct(params.id);
        if (cancelled) return;
        if (!next || (supplierId && next.supplierId !== supplierId)) {
          router.replace('/suppliers/products');
          return;
        }
        setProduct(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, supplierId, router]);

  if (loading || !supplierId) {
    return (
      <SupplierShell>
        <PartnerPage>
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </PartnerPage>
      </SupplierShell>
    );
  }

  if (!product) return null;

  return (
    <SupplierShell>
      <ProductForm
        mode="edit"
        productId={product.id}
        initialProduct={product}
        portal="supplier"
        forcedSupplierId={supplierId}
        backHref="/suppliers/products"
        onSaved={() => router.push('/suppliers/products')}
      />
    </SupplierShell>
  );
}
