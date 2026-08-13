'use client';

import { useParams, useRouter } from 'next/navigation';
import { ProviderShell } from '@/components/provider/provider-shell';
import { ProviderListingForm } from '@/components/provider/provider-listing-form';
import { PartnerPage, PartnerPageHeader } from '@/components/partner/partner-page';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';

export default function ProviderEditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { providerId } = useAuth();
  const { listings } = useServices();
  const listing = listings.find((l) => l.id === params.id && l.providerId === providerId);

  if (!providerId) return null;

  if (!listing) {
    return (
      <ProviderShell>
        <PartnerPage>
          <p className="text-sm text-muted-foreground">Listing not found.</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push('/services/dashboard/listings')}
          >
            Back
          </Button>
        </PartnerPage>
      </ProviderShell>
    );
  }

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Studio"
          title="Edit listing"
          description="Update this service and how customers book it."
        />
        <ProviderListingForm mode="edit" providerId={providerId} initial={listing} />
      </PartnerPage>
    </ProviderShell>
  );
}
