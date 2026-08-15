'use client';

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
    <section className="mb-8">
      <h2 className="mb-4 font-[family-name:var(--font-brand)] text-xl font-medium tracking-tight sm:text-2xl">
        {title}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory touch-pan-x sm:gap-4">
        {listings.map((listing, index) => (
          <div key={listing.id} className="w-[260px] shrink-0 snap-start sm:w-[280px]">
            <ServiceCard
              listing={listing}
              provider={getProviderById(providers, listing.providerId)}
              onBook={() => onBook(listing)}
              index={index}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
