'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ServiceProviderForm } from '@/components/admin/service-provider-form';
import {
  getServiceProvider,
  getProviderListingCounts,
  type ProviderCatalogCounts,
} from '@/lib/firebase/service-providers';
import type { ServiceProvider } from '@/lib/types/services';

export default function EditServiceProviderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const providerId = params.id;
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [counts, setCounts] = useState<ProviderCatalogCounts | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [next, nextCounts] = await Promise.all([
          getServiceProvider(providerId),
          getProviderListingCounts(providerId),
        ]);
        if (cancelled) return;
        if (!next) {
          router.replace('/admin/services?tab=providers');
          return;
        }
        setProvider(next);
        setCounts(nextCounts);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [providerId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!provider) return null;

  return (
    <ServiceProviderForm
      mode="edit"
      providerId={provider.id}
      initialProvider={provider}
      catalogCounts={counts}
      onSaved={() => router.push(`/admin/services/providers/${provider.id}`)}
    />
  );
}
