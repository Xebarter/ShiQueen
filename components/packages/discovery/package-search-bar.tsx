'use client';

import { forwardRef, useMemo } from 'react';
import { Search, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PackageSearchBarProps {
  search: string;
  totalPackages: number;
  resultCount: number;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  className?: string;
}

export const PackageSearchBar = forwardRef<HTMLInputElement, PackageSearchBarProps>(
  function PackageSearchBar(
    { search, totalPackages, resultCount, onSearchChange, onClear, onSubmit, className },
    ref
  ) {
    const hasQuery = search.trim().length > 0;

    const helperText = useMemo(() => {
      if (!hasQuery) {
        return `Search ${totalPackages} curated bundle${totalPackages === 1 ? '' : 's'}`;
      }
      return `${resultCount} bundle${resultCount === 1 ? '' : 's'} match your search`;
    }, [hasQuery, totalPackages, resultCount]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit?.();
    };

    return (
      <section
        id="package-search"
        className={cn(
          'sticky top-[var(--mobile-header-offset,4rem)] z-40 border-b border-border/60 bg-background/95 backdrop-blur-md lg:top-16',
          className
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-md">
              <span className="pointer-events-none absolute left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </span>
              <input
                ref={ref}
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search bundles by name, occasion, category, or need…"
                aria-label="Search packages"
                className="h-12 w-full bg-transparent py-3 pl-[4.25rem] pr-24 text-base placeholder:text-muted-foreground focus:outline-none sm:h-14 sm:text-sm"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {hasQuery && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 rounded-xl px-4 font-semibold sm:h-10"
                >
                  <Search className="mr-1.5 h-4 w-4 sm:mr-0 sm:hidden" />
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Go</span>
                </Button>
              </div>
            </div>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground sm:text-left">
            {helperText}
            {hasQuery && resultCount === 0 && (
              <span className="text-foreground"> — try a different keyword or browse all bundles below</span>
            )}
          </p>
        </div>
      </section>
    );
  }
);
