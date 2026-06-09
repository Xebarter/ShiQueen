'use client';

import { Sparkles } from 'lucide-react';
import { ServiceCard } from '@/components/services/service-card';
import { getProviderById } from '@/lib/services-utils';
import type { ServiceListing, ServiceProvider } from '@/lib/types/services';

interface ServicesFeaturedRowProps {
  title?: string;
  listings: ServiceListing[];
  providers: ServiceProvider[];
  onBook: (listing: ServiceListing) => void;
}

export function ServicesFeaturedRow({
  title = 'Featured',
  listings,
  providers,
  onBook,
}: ServicesFeaturedRowProps) {
  if (listings.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.06] via-card to-accent/5 p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory touch-pan-x">
          {listings.map((listing) => (
            <div key={listing.id} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
              <ServiceCard
                listing={listing}
                provider={getProviderById(providers, listing.providerId)}
                onBook={() => onBook(listing)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
