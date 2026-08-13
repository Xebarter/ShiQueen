'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceProviderForm } from '@/components/admin/service-provider-form';
import { generateServiceProviderId } from '@/lib/firebase/service-providers';

export default function NewServiceProviderPage() {
  const router = useRouter();
  const [providerId] = useState(() => {
    try {
      return generateServiceProviderId();
    } catch {
      return '';
    }
  });

  if (!providerId) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="mb-2 text-2xl font-bold">Firebase not configured</h1>
        <p className="text-muted-foreground">
          Add your Firebase environment variables before creating providers.
        </p>
      </div>
    );
  }

  return (
    <ServiceProviderForm
      mode="create"
      providerId={providerId}
      onSaved={() => router.push(`/admin/services/providers/${providerId}`)}
    />
  );
}
