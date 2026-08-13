'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { PartnerPage } from '@/components/partner/partner-page';
import { ProductForm } from '@/components/admin/product-form';
import { useAuth } from '@/lib/auth-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { generateProductId } from '@/lib/firebase/products';
import { canListCatalog } from '@/lib/partner-status';

export default function SupplierNewProductPage() {
  const router = useRouter();
  const { supplierId } = useAuth();
  const { getSupplierById } = useSuppliers();
  const supplier = supplierId ? getSupplierById(supplierId) : undefined;
  const allowed = canListCatalog(supplier?.approvalStatus, supplier?.isActive);
  const [productId] = useState(() => {
    try {
      return generateProductId();
    } catch {
      return `prod-${Date.now()}`;
    }
  });

  useEffect(() => {
    if (supplier && !allowed) router.replace('/suppliers/products');
  }, [supplier, allowed, router]);

  if (!supplierId || !allowed) return (
    <SupplierShell>
      <PartnerPage>
        <p className="text-sm text-muted-foreground">Listing unlocks after approval.</p>
      </PartnerPage>
    </SupplierShell>
  );

  return (
    <SupplierShell>
      <ProductForm
        mode="create"
        productId={productId}
        portal="supplier"
        forcedSupplierId={supplierId}
        backHref="/suppliers/products"
        onSaved={() => router.push('/suppliers/products')}
      />
    </SupplierShell>
  );
}
