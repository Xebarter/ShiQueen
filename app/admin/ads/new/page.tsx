'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useProducts } from '@/lib/products-context';
import { AdForm } from '@/components/admin/ad-form';
import { createMarketingAdId } from '@/lib/firebase/marketing-ads';

export default function NewAdPage() {
  const router = useRouter();
  const { products } = useProducts();
  const [adId] = useState(() => {
    try {
      return createMarketingAdId();
    } catch {
      return '';
    }
  });

  if (!adId) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="mb-2 text-2xl font-bold">Firebase not configured</h1>
        <p className="text-muted-foreground">
          Add your Firebase environment variables before creating ads.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Marketing Ad</h1>
        <p className="mt-1 text-muted-foreground">
          Upload a banner and choose the product to feature on the storefront
        </p>
      </div>
      <AdForm
        mode="create"
        adId={adId}
        products={products}
        onSaved={() => router.push('/admin/ads')}
      />
    </div>
  );
}
