'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Plus, Scissors } from 'lucide-react';
import { ProviderShell } from '@/components/provider/provider-shell';
import { ApprovedActionLink } from '@/components/partner/approved-action-link';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
  PartnerStatusPill,
} from '@/components/partner/partner-page';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';
import { canListCatalog } from '@/lib/partner-status';
import { formatUGX } from '@/lib/wholesale-data';

export default function ProviderListingsPage() {
  const { providerId } = useAuth();
  const { listings, providers } = useServices();
  const provider = providers.find((p) => p.id === providerId);
  const allowed = canListCatalog(provider?.approvalStatus, provider?.isActive);

  const mine = useMemo(
    () => listings.filter((l) => l.providerId === providerId && !l.isArchived),
    [listings, providerId]
  );

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Studio"
          title="Listings"
          description={`${mine.length} bookable service${mine.length === 1 ? '' : 's'} on the marketplace.`}
          action={
            <ApprovedActionLink allowed={allowed} href="/services/dashboard/listings/new">
              <Plus className="h-4 w-4" />
              Add listing
            </ApprovedActionLink>
          }
        />

        {mine.length === 0 ? (
          <PartnerEmptyState
            icon={Scissors}
            title="No listings yet"
            description={
              allowed
                ? 'Add your first bookable service and it will appear on the marketplace.'
                : 'Listing unlocks after an admin approves your account.'
            }
          />
        ) : (
          <PartnerCard>
            {mine.map((listing) => (
              <Link
                key={listing.id}
                href={`/services/dashboard/listings/${listing.id}/edit`}
                className="flex items-center gap-4 border-b border-[var(--partner-line)] px-5 py-4 last:border-0 transition hover:bg-[#FBF6F7]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8E8EE] text-primary">
                  <Scissors className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{listing.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {listing.durationMinutes} minutes
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <PartnerStatusPill tone={listing.isActive ? 'active' : 'hidden'}>
                    {listing.isActive ? 'Active' : 'Hidden'}
                  </PartnerStatusPill>
                  <p className="min-w-[5.5rem] text-right font-semibold tabular-nums">
                    {formatUGX(listing.basePrice)}
                  </p>
                </div>
              </Link>
            ))}
          </PartnerCard>
        )}
      </PartnerPage>
    </ProviderShell>
  );
}
