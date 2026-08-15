'use client';

import { Button } from '@/components/ui/button';
import { ServiceCard } from '@/components/services/service-card';
import { getProviderById } from '@/lib/services-utils';
import type { ServiceListing, ServiceProvider } from '@/lib/types/services';
import { cn } from '@/lib/utils';

function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50" />
      <div className="space-y-3 border-t border-border/40 p-4">
        <div className="h-4 w-3/4 rounded-md bg-muted" />
        <div className="h-3 w-1/2 rounded-md bg-muted" />
        <div className="h-8 w-full rounded-xl bg-muted/80" />
      </div>
    </div>
  );
}

interface ServicesResultsGridProps {
  loading: boolean;
  listings: ServiceListing[];
  providers: ServiceProvider[];
  onBook: (listing: ServiceListing) => void;
  onClearFilters: () => void;
  className?: string;
}

export function ServicesResultsGrid({
  loading,
  listings,
  providers,
  onBook,
  onClearFilters,
  className,
}: ServicesResultsGridProps) {
  if (loading) {
    return (
      <div className={cn('grid gap-6 sm:grid-cols-2 xl:grid-cols-3', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">No services</p>
        <Button type="button" variant="outline" className="mt-5 rounded-full" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {listings.map((listing, index) => (
        <ServiceCard
          key={listing.id}
          listing={listing}
          provider={getProviderById(providers, listing.providerId)}
          onBook={() => onBook(listing)}
          index={index}
        />
      ))}
    </div>
  );
}
