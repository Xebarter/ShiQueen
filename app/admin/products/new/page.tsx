'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { generateProductId } from '@/lib/firebase/products';

export default function NewProductPage() {
  const router = useRouter();
  const [productId] = useState(() => {
    try {
      return generateProductId();
    } catch {
      return '';
    }
  });

  if (!productId) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-2">Firebase not configured</h1>
        <p className="text-muted-foreground">
          Add your Firebase environment variables before creating products.
        </p>
      </div>
    );
  }

  return (
    <ProductForm
      mode="create"
      productId={productId}
      onSaved={() => router.push('/admin/products')}
    />
  );
}
