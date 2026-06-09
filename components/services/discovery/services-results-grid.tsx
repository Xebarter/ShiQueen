'use client';

import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceCard } from '@/components/services/service-card';
import { getProviderById } from '@/lib/services-utils';
import type { ServiceCategory, ServiceListing, ServiceProvider } from '@/lib/types/services';
import { cn } from '@/lib/utils';

function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.03] animate-pulse">
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
  categories: ServiceCategory[];
  onBook: (listing: ServiceListing) => void;
  onClearFilters: () => void;
  className?: string;
}

export function ServicesResultsGrid({
  loading,
  listings,
  providers,
  categories,
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
    const suggestions = categories.slice(0, 3);
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/[0.04] to-muted/30 px-6 py-16 text-center shadow-inner">
        <SearchX className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No services found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Try a different category, location, or clear your filters.
        </p>
        <Button type="button" variant="outline" className="mt-6 rounded-xl" onClick={onClearFilters}>
          Clear all filters
        </Button>
        {suggestions.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Popular categories
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/services/category/${cat.id}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/30 hover:text-primary"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {listings.map((listing) => (
        <ServiceCard
          key={listing.id}
          listing={listing}
          provider={getProviderById(providers, listing.providerId)}
          onBook={() => onBook(listing)}
        />
      ))}
    </div>
  );
}
