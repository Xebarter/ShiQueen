'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProductForm } from '@/components/admin/product-form';
import { getProduct } from '@/lib/firebase/products';
import { useProducts } from '@/lib/products-context';
import { Product } from '@/lib/types/database';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { getProductById } = useProducts();
  const getProductByIdRef = useRef(getProductById);
  getProductByIdRef.current = getProductById;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      try {
        const fromFirestore = await getProduct(productId);
        const resolved = fromStore ?? getProductByIdRef.current(productId) ?? null;
        if (!cancelled) setProduct(resolved);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
    // Load once per product id. Do not re-run when the products catalog
    // refreshes — that remounts ProductForm and wipes in-progress image edits.
  }, [productId]);

  if (loading) {
    return (
      <div className="flex justify-center p-6 md:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="mb-2 text-2xl font-bold">Product not found</h1>
        <p className="mb-4 text-muted-foreground">
          This product may have been deleted or the link is invalid.
        </p>
        <Link href="/admin/products" className="text-primary hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <ProductForm
      key={product.id}
      mode="edit"
      productId={product.id}
      initialProduct={product}
      onSaved={() => router.push('/admin/products')}
    />
  );
}
