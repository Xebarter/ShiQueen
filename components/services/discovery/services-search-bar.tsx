'use client';

import { forwardRef } from 'react';
import { MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ServicesSearchBarProps {
  query: string;
  city: string;
  totalServices: number;
  resultCount: number;
  activeFilterCount: number;
  onQueryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onClearQuery: () => void;
  onOpenFilters: () => void;
  className?: string;
}

export const ServicesSearchBar = forwardRef<HTMLInputElement, ServicesSearchBarProps>(
  function ServicesSearchBar(
    {
      query,
      city,
      totalServices,
      resultCount,
      activeFilterCount,
      onQueryChange,
      onCityChange,
      onClearQuery,
      onOpenFilters,
      className,
    },
    ref
  ) {
    const hasQuery = query.trim().length > 0;
    const helperText =
      hasQuery || activeFilterCount > 0
        ? `${resultCount} result${resultCount === 1 ? '' : 's'}`
        : `${totalServices} service${totalServices === 1 ? '' : 's'}`;

    return (
      <section
        id="services-search"
        className={cn(
          'sticky top-[var(--mobile-header-offset,4rem)] z-40 border-b border-border/60 bg-background/90 shadow-sm max-md:bg-background lg:top-16',
          className
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="rounded-2xl border border-border/70 bg-card/95 p-2 shadow-md shadow-black/[0.04] ring-1 ring-black/[0.02]">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex flex-1 items-center overflow-hidden rounded-xl bg-muted/30 transition focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/15">
                <span className="pointer-events-none absolute left-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  ref={ref}
                  type="search"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Search services…"
                  aria-label="Search services"
                  className="h-12 w-full bg-transparent py-3 pl-14 pr-10 text-base placeholder:text-muted-foreground focus:outline-none sm:text-sm"
                />
                {hasQuery && (
                  <button
                    type="button"
                    onClick={onClearQuery}
                    className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="relative sm:w-48">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => onCityChange(e.target.value)}
                  placeholder="City / area"
                  aria-label="Filter by location"
                  className="h-12 w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-3 pl-10 text-sm transition placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-12 gap-2 rounded-xl border-border/70 bg-muted/30 lg:hidden"
                onClick={onOpenFilters}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
          {(hasQuery || activeFilterCount > 0 || totalServices > 0) && (
            <p className="mt-2 px-1 text-center text-xs font-medium text-muted-foreground sm:text-left">
              {helperText}
            </p>
          )}
        </div>
      </section>
    );
  }
);
