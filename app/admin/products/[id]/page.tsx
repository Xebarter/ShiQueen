'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/admin/product-form';
import { useProducts } from '@/lib/products-context';

export default function ProductEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getProductById, loading } = useProducts();
  const product = getProductById(id);

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 md:p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link href="/admin/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <ProductForm
      mode="edit"
      productId={id}
      initialProduct={product}
      onSaved={() => router.push('/admin/products')}
    />
  );
}
