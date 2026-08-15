'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Car, Clock, Plus, Scissors, Star } from 'lucide-react';
import { ProviderShell } from '@/components/provider/provider-shell';
import { ApprovedActionLink } from '@/components/partner/approved-action-link';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
  PartnerStatusPill,
} from '@/components/partner/partner-page';
import { isRemoteProductImage } from '@/components/product-image';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';
import { canListCatalog } from '@/lib/partner-status';
import { resolveListingImage } from '@/lib/services-utils';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

type ListingFilter = 'all' | 'active' | 'hidden';

export default function ProviderListingsPage() {
  const { providerId } = useAuth();
  const { listings, providers, categories, loading } = useServices();
  const provider = providers.find((p) => p.id === providerId);
  const allowed = canListCatalog(provider?.approvalStatus, provider?.isActive);
  const [filter, setFilter] = useState<ListingFilter>('all');

  const mine = useMemo(
    () =>
      listings
        .filter((l) => l.providerId === providerId && !l.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [listings, providerId]
  );

  const activeCount = mine.filter((l) => l.isActive).length;
  const hiddenCount = mine.length - activeCount;

  const filtered = useMemo(() => {
    if (filter === 'active') return mine.filter((l) => l.isActive);
    if (filter === 'hidden') return mine.filter((l) => !l.isActive);
    return mine;
  }, [filter, mine]);

  const categoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? 'Service';

  const filters: { id: ListingFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: mine.length },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'hidden', label: 'Hidden', count: hiddenCount },
  ];

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          title="Listings"
          description={
            loading
              ? 'Loading…'
              : `${mine.length} service${mine.length === 1 ? '' : 's'}`
          }
          action={
            <ApprovedActionLink allowed={allowed} href="/services/dashboard/listings/new">
              <Plus className="h-4 w-4" />
              Add
            </ApprovedActionLink>
          }
        />

        {mine.length === 0 && !loading ? (
          <PartnerEmptyState
            icon={Scissors}
            title="No listings yet"
            description={
              allowed
                ? 'Add your first bookable service.'
                : 'Listing unlocks after admin approval.'
            }
          />
        ) : mine.length > 0 ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ring-1 ring-inset',
                    filter === item.id
                      ? 'bg-primary text-primary-foreground ring-primary'
                      : 'bg-background text-muted-foreground ring-border hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  {item.label}
                  <span className="tabular-nums opacity-80">{item.count}</span>
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <PartnerCard className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No {filter} listings</p>
                <p className="mt-1 text-xs text-muted-foreground">Try another filter.</p>
              </PartnerCard>
            ) : (
              <PartnerCard className="divide-y divide-border">
                {filtered.map((listing) => {
                  const image = resolveListingImage(listing, provider);
                  return (
                    <Link
                      key={listing.id}
                      href={`/services/dashboard/listings/${listing.id}/edit`}
                      className="flex items-center gap-3 p-3 transition hover:bg-muted/40 sm:gap-4 sm:p-4"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/60 sm:h-[4.5rem] sm:w-[4.5rem]">
                        {image && isRemoteProductImage(image) ? (
                          <Image
                            src={image}
                            alt={listing.name}
                            fill
                            className="object-cover"
                            sizes="72px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-primary">
                            <Scissors className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold leading-snug text-foreground">
                              {listing.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {categoryName(listing.categoryId)}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground sm:text-base">
                            {formatUGX(listing.basePrice)}
                          </p>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                          <PartnerStatusPill tone={listing.isActive ? 'active' : 'hidden'}>
                            {listing.isActive ? 'Active' : 'Hidden'}
                          </PartnerStatusPill>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {listing.durationMinutes} min
                          </span>
                          {listing.supportsMobile ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Car className="h-3.5 w-3.5 shrink-0" />
                              Mobile
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                            {listing.rating > 0 ? listing.rating.toFixed(1) : '—'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </PartnerCard>
            )}
          </>
        ) : (
          <PartnerCard className="flex items-center justify-center py-16">
            <Scissors className="h-6 w-6 animate-pulse text-muted-foreground" />
          </PartnerCard>
        )}
      </PartnerPage>
    </ProviderShell>
  );
}
