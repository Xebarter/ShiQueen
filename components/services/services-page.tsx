'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { ServiceBookingSheet } from '@/components/services/service-booking-sheet';
import { ServicesHero } from '@/components/services/discovery/services-hero';
import { ServicesSearchBar } from '@/components/services/discovery/services-search-bar';
import { ServicesCategoryNav } from '@/components/services/discovery/services-category-nav';
import { ServicesFilterPanel } from '@/components/services/discovery/services-filter-panel';
import { ServicesResultsGrid } from '@/components/services/discovery/services-results-grid';
import { ServicesFeaturedRow } from '@/components/services/discovery/services-featured-row';
import { useServices } from '@/lib/services-context';
import { useServicesSearch } from '@/lib/hooks/use-services-search';
import { useTrackSearchQuery } from '@/lib/hooks/use-track-search-query';
import { useHistoryOverlay } from '@/lib/hooks/use-history-overlay';
import { useFeatureFlags } from '@/lib/feature-flags-context';
import { canShowProviderApplications } from '@/lib/feature-flags';
import {
  getFeaturedServices,
  getPopularServices,
  getProviderById,
} from '@/lib/services-utils';
import type { ServiceListing } from '@/lib/types/services';

export function ServicesPage() {
  const { activeCategories, activeListings, activeProviders, loading } = useServices();
  const { flags } = useFeatureFlags();
  const search = useServicesSearch();
  useTrackSearchQuery(search.query, 'services');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bookingListing, setBookingListing] = useState<ServiceListing | null>(null);

  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  useHistoryOverlay(filtersOpen, closeFilters);

  const bookingProvider = bookingListing
    ? getProviderById(activeProviders, bookingListing.providerId)
    : undefined;

  const featuredListings = useMemo(() => {
    const featured = getFeaturedServices(activeListings, 8);
    if (featured.length >= 8) return featured;
    const popular = getPopularServices(activeListings, 8);
    const seen = new Set(featured.map((l) => l.id));
    for (const listing of popular) {
      if (featured.length >= 8) break;
      if (!seen.has(listing.id)) {
        featured.push(listing);
        seen.add(listing.id);
      }
    }
    return featured;
  }, [activeListings]);

  const heroListings = featuredListings.length > 0 ? featuredListings : activeListings;

  return (
    <>
      <Header />
      <main className="overflow-x-clip mobile-scroll-optimize">
        <ServicesHero
          listings={heroListings}
          providers={activeProviders}
          loading={loading}
          onBook={setBookingListing}
        />

        <ServicesCategoryNav
          categories={activeCategories}
          selectedCategoryId={search.categoryId}
          onSelectCategory={search.setCategoryId}
        />

        <ServicesSearchBar
          query={search.query}
          activeFilterCount={search.activeFilterCount}
          onQueryChange={search.setQuery}
          onClearQuery={() => search.setQuery('')}
          onOpenFilters={() => setFiltersOpen(true)}
        />

        <div
          id="services-browse"
          className="mx-auto max-w-[90rem] scroll-mt-36 px-3 py-8 sm:px-4 sm:py-10 lg:scroll-mt-32 lg:px-5"
        >
          {!search.hasActiveFilters && !loading && featuredListings.length > 0 ? (
            <ServicesFeaturedRow
              listings={featuredListings}
              providers={activeProviders}
              onBook={setBookingListing}
            />
          ) : null}

          <div className="flex gap-8 lg:items-start">
            <aside className="hidden w-56 shrink-0 lg:block">
              <div className="sticky top-28">
                <ServicesFilterPanel
                  categories={activeCategories}
                  filters={search.filterState}
                  onChange={search.patchFilters}
                  onClearAll={search.clearAllFilters}
                  activeFilterCount={search.activeFilterCount}
                  showHeader={false}
                />
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {search.hasActiveFilters || search.query.trim() ? (
                <p className="mb-4 text-sm text-muted-foreground tabular-nums">
                  {search.results.length}
                </p>
              ) : (
                <h2 className="mb-4 font-[family-name:var(--font-brand)] text-xl font-medium tracking-tight sm:text-2xl">
                  All
                </h2>
              )}
              <ServicesResultsGrid
                loading={loading}
                listings={search.results}
                providers={activeProviders}
                onBook={setBookingListing}
                onClearFilters={search.clearAllFilters}
                className="sm:grid-cols-2 xl:grid-cols-3"
              />
            </div>
          </div>
        </div>

        <section className="border-t border-border bg-secondary/30 py-8 md:py-10">
          <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-3 sm:flex-row sm:px-4 lg:px-5">
            {canShowProviderApplications(flags) ? (
              <Link href="/services/sign-up" className="flex-1">
                <Button size="lg" className="w-full gap-2">
                  List services
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
            <Link href="/shop" className="flex-1">
              <Button size="lg" variant="outline" className="w-full gap-2">
                Shop
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <Footer />
      </main>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background shadow-2xl ring-1 ring-border/50">
            <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <ServicesFilterPanel
                categories={activeCategories}
                filters={search.filterState}
                onChange={search.patchFilters}
                onClearAll={search.clearAllFilters}
                activeFilterCount={search.activeFilterCount}
                showHeader={false}
              />
              <Button
                type="button"
                className="mt-6 h-12 w-full rounded-xl"
                onClick={() => setFiltersOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {bookingListing && bookingProvider && (
        <ServiceBookingSheet
          open
          onClose={() => setBookingListing(null)}
          listing={bookingListing}
          provider={bookingProvider}
        />
      )}
    </>
  );
}
