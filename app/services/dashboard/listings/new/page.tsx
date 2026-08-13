'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProviderShell } from '@/components/provider/provider-shell';
import { ProviderListingForm } from '@/components/provider/provider-listing-form';
import { PartnerPage, PartnerPageHeader } from '@/components/partner/partner-page';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';
import { canListCatalog } from '@/lib/partner-status';

export default function ProviderNewListingPage() {
  const router = useRouter();
  const { providerId } = useAuth();
  const { providers } = useServices();
  const provider = providers.find((p) => p.id === providerId);
  const allowed = canListCatalog(provider?.approvalStatus, provider?.isActive);

  useEffect(() => {
    if (provider && !allowed) router.replace('/services/dashboard/listings');
  }, [provider, allowed, router]);

  if (!providerId || !allowed) {
    return (
      <ProviderShell>
        <PartnerPage>
          <p className="text-sm text-muted-foreground">Listing unlocks after approval.</p>
        </PartnerPage>
      </ProviderShell>
    );
  }

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Studio"
          title="New listing"
          description="Create a bookable service for the marketplace."
        />
        <ProviderListingForm mode="create" providerId={providerId} />
      </PartnerPage>
    </ProviderShell>
  );
}
