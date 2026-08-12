'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { ProductForm } from '@/components/admin/product-form';
import { useAuth } from '@/lib/auth-context';
import { generateProductId } from '@/lib/firebase/products';

export default function SupplierNewProductPage() {
  const router = useRouter();
  const { supplierId } = useAuth();
  const [productId] = useState(() => {
    try {
      return generateProductId();
    } catch {
      return `prod-${Date.now()}`;
    }
  });

  if (!supplierId) return null;

  return (
    <SupplierShell>
      <ProductForm
        mode="create"
        productId={productId}
        portal="supplier"
        forcedSupplierId={supplierId}
        backHref="/supplier/products"
        onSaved={() => router.push('/supplier/products')}
      />
    </SupplierShell>
  );
}
