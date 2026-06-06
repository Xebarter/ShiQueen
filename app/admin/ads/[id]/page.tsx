'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProducts } from '@/lib/products-context';
import { AdForm } from '@/components/admin/ad-form';
import { getMarketingAd } from '@/lib/firebase/marketing-ads';
import { MarketingAd } from '@/lib/types/database';
import { Loader2 } from 'lucide-react';

export default function EditAdPage() {
  const params = useParams();
  const router = useRouter();
  const { products } = useProducts();
  const adId = String(params.id);
  const [ad, setAd] = useState<MarketingAd | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketingAd(adId)
      .then(setAd)
      .finally(() => setLoading(false));
  }, [adId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Ad not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Marketing Ad</h1>
        <p className="mt-1 text-muted-foreground">Update banner, copy, schedule, or featured product</p>
      </div>
      <AdForm
        mode="edit"
        adId={adId}
        initialAd={ad}
        products={products}
        onSaved={() => router.push('/admin/ads')}
      />
    </div>
  );
}
