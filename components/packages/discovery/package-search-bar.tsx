'use client';

import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { isRemoteProductImage } from '@/components/product-image';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

export type PackageSearchSuggestion = {
  id: string;
  name: string;
  tagline?: string;
  price: number;
  image?: string;
};

interface PackageSearchBarProps {
  search: string;
  totalPackages: number;
  resultCount: number;
  suggestions: PackageSearchSuggestion[];
  onSearchChange: (value: string) => void;
  onClear: () => void;
  onViewAllResults?: () => void;
  onSelectSuggestion?: (id: string) => void;
  className?: string;
}

export const PackageSearchBar = forwardRef<HTMLInputElement, PackageSearchBarProps>(
  function PackageSearchBar(
    {
      search,
      totalPackages,
      resultCount,
      suggestions,
      onSearchChange,
      onClear,
      onViewAllResults,
      onSelectSuggestion,
      className,
    },
    ref
  ) {
    const listId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const hasQuery = search.trim().length > 0;
    const showPanel = open && hasQuery;

    const helperText = useMemo(() => {
      if (!hasQuery) {
        return `Search ${totalPackages} curated collection${totalPackages === 1 ? '' : 's'}`;
      }
      if (resultCount === 0) return 'No collections match — try another word or browse below';
      return `${resultCount} collection${resultCount === 1 ? '' : 's'} updating as you type`;
    }, [hasQuery, totalPackages, resultCount]);

    useEffect(() => {
      setActiveIndex(0);
      if (hasQuery) setOpen(true);
    }, [search, hasQuery]);

    useEffect(() => {
      const onPointerDown = (event: MouseEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', onPointerDown);
      return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showPanel) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, suggestions.length));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === 'Escape') {
        setOpen(false);
      } else if (event.key === 'Enter') {
        if (activeIndex < suggestions.length) {
          const selected = suggestions[activeIndex];
          if (selected) {
            event.preventDefault();
            setOpen(false);
            onSelectSuggestion?.(selected.id);
          }
          return;
        }
        event.preventDefault();
        setOpen(false);
        onViewAllResults?.();
      }
    };

    return (
      <section
        id="package-search"
        className={cn(
          'sticky top-[var(--mobile-header-offset,4rem)] z-40 border-b border-border/50 bg-background/90 shadow-[0_8px_30px_-18px_rgba(80,20,50,0.35)] backdrop-blur-xl lg:top-16',
          className
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div ref={rootRef} className="relative">
            <div className="relative flex items-center overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-sm ring-1 ring-black/[0.03] transition-all focus-within:border-primary/35 focus-within:shadow-lg focus-within:ring-primary/10">
              <span className="pointer-events-none absolute left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:left-4">
                <Search className="h-4 w-4" />
              </span>
              <input
                ref={ref}
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => hasQuery && setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search collections, occasions, or what you need…"
                aria-label="Search packages"
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded={showPanel}
                className="h-12 w-full bg-transparent py-3 pl-[3.75rem] pr-12 text-base placeholder:text-muted-foreground focus:outline-none sm:h-14 sm:pl-[4.25rem] sm:text-[15px]"
                autoComplete="off"
              />
              {hasQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showPanel && (
              <div
                id={listId}
                role="listbox"
                className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-border/70 bg-card/98 shadow-2xl shadow-primary/10 ring-1 ring-black/[0.04] backdrop-blur-xl"
              >
                {suggestions.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No live matches yet. Keep typing, or browse the full atelier below.
                  </p>
                ) : (
                  <ul className="max-h-[min(24rem,55vh)] overflow-y-auto py-2">
                    {suggestions.map((item, index) => {
                      const active = index === activeIndex;
                      return (
                        <li key={item.id} role="option" aria-selected={active}>
                          <Link
                            href={`/packages/${item.id}`}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 transition sm:px-4',
                              active ? 'bg-primary/[0.07]' : 'hover:bg-muted/50'
                            )}
                          >
                            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                              {item.image && isRemoteProductImage(item.image) ? (
                                <Image
                                  src={item.image}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center text-primary/40">
                                  <Sparkles className="h-4 w-4" />
                                </span>
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{item.name}</span>
                              {item.tagline && (
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {item.tagline}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                              {formatUGX(item.price)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(suggestions.length)}
                  onClick={() => {
                    setOpen(false);
                    onViewAllResults?.();
                  }}
                  className={cn(
                    'flex w-full items-center justify-between border-t border-border/60 px-4 py-3 text-sm font-semibold text-primary transition',
                    activeIndex === suggestions.length ? 'bg-primary/[0.07]' : 'hover:bg-muted/40'
                  )}
                >
                  View all {resultCount} result{resultCount === 1 ? '' : 's'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 px-1 text-center text-xs text-muted-foreground sm:text-left" aria-live="polite">
            {helperText}
          </p>
        </div>
      </section>
    );
  }
);
