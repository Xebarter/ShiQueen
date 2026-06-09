'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, MapPin, X } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { CategoryCard } from '@/components/services/category-card';
import { ServiceBookingSheet } from '@/components/services/service-booking-sheet';
import { ServicesHero } from '@/components/services/discovery/services-hero';
import { ServicesSearchBar } from '@/components/services/discovery/services-search-bar';
import { ServicesCategoryNav } from '@/components/services/discovery/services-category-nav';
import { ServicesFilterPanel } from '@/components/services/discovery/services-filter-panel';
import { ServicesResultsGrid } from '@/components/services/discovery/services-results-grid';
import { ServicesFeaturedRow } from '@/components/services/discovery/services-featured-row';
import { ServicesTrustStrip } from '@/components/services/discovery/services-trust-strip';
import { useServices } from '@/lib/services-context';
import { useServicesSearch } from '@/lib/hooks/use-services-search';
import {
  getFeaturedServices,
  getNewProviders,
  getPopularServices,
  getProviderById,
} from '@/lib/services-utils';
import type { ServiceListing } from '@/lib/types/services';

export function ServicesPage() {
  const { activeCategories, activeListings, activeProviders, loading } = useServices();
  const search = useServicesSearch();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bookingListing, setBookingListing] = useState<ServiceListing | null>(null);

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

  const newProviders = getNewProviders(activeProviders, 4);

  const showCategoryGrid = !search.hasActiveFilters && !loading;

  return (
    <main className="min-h-screen bg-gradient-to-b from-muted/20 via-background to-background overflow-x-clip mobile-scroll-optimize">
      <Header />

      <ServicesHero
        totalServices={activeListings.length}
        totalProviders={activeProviders.filter((p) => p.isActive).length}
      />

      <ServicesSearchBar
        query={search.query}
        city={search.city}
        totalServices={activeListings.length}
        resultCount={search.results.length}
        activeFilterCount={search.activeFilterCount}
        onQueryChange={search.setQuery}
        onCityChange={search.setCity}
        onClearQuery={() => search.setQuery('')}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      <ServicesCategoryNav
        categories={activeCategories}
        selectedCategoryId={search.categoryId}
        onSelectCategory={search.setCategoryId}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section
          id="services-browse"
          className="scroll-mt-36 rounded-3xl border border-border/60 bg-card/50 p-5 shadow-sm ring-1 ring-black/[0.02] backdrop-blur-sm sm:p-6 lg:scroll-mt-32 lg:p-8"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border/50 pb-5">
            <div>
              <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
                {search.hasActiveFilters ? (
                  <>Results</>
                ) : (
                  <>
                    All <span className="font-semibold text-primary">services</span>
                  </>
                )}
              </h2>
              {search.categoryId && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeCategories.find((c) => c.id === search.categoryId)?.name}
                  {' · '}
                  <span className="font-medium text-foreground">{search.results.length} listed</span>
                </p>
              )}
            </div>
            {!loading && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tabular-nums text-primary">
                {search.results.length} available
              </span>
            )}
          </div>

          <div className="flex gap-8 lg:items-start">
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-28 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-md ring-1 ring-black/[0.03]">
                <div className="border-b border-border/50 bg-muted/30 px-5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Refine
                  </p>
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
                </div>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <ServicesResultsGrid
                loading={loading}
                listings={search.results}
                providers={activeProviders}
                categories={activeCategories}
                onBook={setBookingListing}
                onClearFilters={search.clearAllFilters}
              />
            </div>
          </div>
        </section>

        {!loading && featuredListings.length > 0 && (
          <ServicesFeaturedRow
            listings={featuredListings}
            providers={activeProviders}
            onBook={setBookingListing}
          />
        )}

        {!loading && newProviders.length > 0 && (
          <section className="mb-12 mt-12">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">New providers</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {newProviders.map((provider) => {
                const providerListings = activeListings.filter(
                  (l) => l.providerId === provider.id && l.isActive && !l.isArchived
                );
                const preview = providerListings.slice(0, 2);
                const initials = provider.businessName
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase();
                return (
                  <div
                    key={provider.id}
                    className="group rounded-2xl border border-border/60 bg-card p-4 shadow-sm ring-1 ring-black/[0.02] transition hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-sm font-bold text-primary">
                        {initials || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-semibold">{provider.businessName}</p>
                          {provider.isVerified && (
                            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                          )}
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {provider.city}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-medium text-muted-foreground">
                      {providerListings.length} service{providerListings.length === 1 ? '' : 's'}
                    </p>
                    {preview.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
                        {preview.map((listing) => (
                          <Link
                            key={listing.id}
                            href={`/services/${listing.slug}`}
                            className="block truncate text-sm text-primary transition group-hover:underline"
                          >
                            {listing.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {showCategoryGrid && (
          <section className="border-t border-border/50 pt-10">
            <h2 className="text-2xl font-light tracking-tight">
              Browse by <span className="font-semibold text-primary">category</span>
            </h2>
            <p className="mt-1 mb-8 text-sm text-muted-foreground">
              16 categories · beauty, wellness &amp; lifestyle
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  listings={activeListings}
                  compact
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <ServicesTrustStrip />

      <section className="relative overflow-hidden border-t border-border/50 bg-primary py-16 text-primary-foreground">
        <div
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_50%,white_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
            Are you a <span className="font-semibold">service provider</span>?
          </h2>
          <p className="mt-3 text-sm opacity-90 sm:text-base">
            List on SheQueen and reach customers across Uganda.
          </p>
          <Link href="/contact" className="mt-8 inline-block">
            <Button
              variant="secondary"
              size="lg"
              className="h-12 rounded-2xl px-8 font-semibold shadow-lg"
            >
              Get listed
            </Button>
          </Link>
        </div>
      </section>

      <Footer />

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
                Show {search.results.length} result{search.results.length === 1 ? '' : 's'}
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
    </main>
  );
}
