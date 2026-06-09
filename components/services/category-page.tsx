'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ServiceCard } from '@/components/services/service-card';
import { ServiceBookingSheet } from '@/components/services/service-booking-sheet';
import { useServices } from '@/lib/services-context';
import { getProviderById } from '@/lib/services-utils';
import type { ServiceListing } from '@/lib/types/services';

interface CategoryPageProps {
  slug: string;
}

export function CategoryPage({ slug }: CategoryPageProps) {
  const { activeCategories, activeListings, activeProviders, loading } = useServices();
  const [bookingListing, setBookingListing] = useState<ServiceListing | null>(null);

  const category = activeCategories.find((c) => c.id === slug);
  const listings = activeListings.filter((l) => l.categoryId === slug);
  const bookingProvider = bookingListing
    ? getProviderById(activeProviders, bookingListing.providerId)
    : undefined;

  return (
    <main className="min-h-screen bg-background pb-8">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/services"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          All services
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !category ? (
          <div className="py-20 text-center">
            <h1 className="text-2xl font-light">Category not found</h1>
            <Link href="/services" className="mt-4 inline-block text-primary hover:underline">
              Back to services
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-light tracking-tight sm:text-4xl">{category.name}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {listings.length} service{listings.length !== 1 ? 's' : ''} available
            </p>

            {category.serviceTypes.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {category.serviceTypes.slice(0, 12).map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {type}
                  </span>
                ))}
                {category.serviceTypes.length > 12 && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    +{category.serviceTypes.length - 12} more
                  </span>
                )}
              </div>
            )}

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ServiceCard
                  key={listing.id}
                  listing={listing}
                  provider={getProviderById(activeProviders, listing.providerId)}
                  onBook={() => setBookingListing(listing)}
                />
              ))}
            </div>

            {listings.length === 0 && (
              <p className="py-16 text-center text-muted-foreground">
                No listings in this category yet. Check back soon!
              </p>
            )}
          </>
        )}
      </div>

      <Footer />

      {bookingListing && bookingProvider && (
        <ServiceBookingSheet
          open
          onClose={() => setBookingListing(null)}
          listing={bookingListing}
          provider={bookingProvider}
        />
      )}
    </main>
  );
}
