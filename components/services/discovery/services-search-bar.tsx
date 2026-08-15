'use client';

import { forwardRef } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ServicesSearchBarProps {
  query: string;
  activeFilterCount: number;
  onQueryChange: (value: string) => void;
  onClearQuery: () => void;
  onOpenFilters: () => void;
  className?: string;
}

export const ServicesSearchBar = forwardRef<HTMLInputElement, ServicesSearchBarProps>(
  function ServicesSearchBar(
    {
      query,
      activeFilterCount,
      onQueryChange,
      onClearQuery,
      onOpenFilters,
      className,
    },
    ref
  ) {
    const hasQuery = query.trim().length > 0;

    return (
      <div className={cn('border-b border-border/40 bg-background', className)}>
        <div className="mx-auto flex max-w-[90rem] items-center gap-2 px-3 py-2.5 sm:px-4 lg:px-5">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={ref}
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search"
              aria-label="Search services"
              className="h-10 w-full rounded-full border border-border/60 bg-secondary/60 py-2 pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            {hasQuery ? (
              <button
                type="button"
                onClick={onClearQuery}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 shrink-0 gap-1.5 rounded-full px-3 lg:hidden"
            onClick={onOpenFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 ? (
              <span className="tabular-nums">{activeFilterCount}</span>
            ) : null}
          </Button>
        </div>
      </div>
    );
  }
);
