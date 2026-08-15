'use client';

import { forwardRef, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { ArrowRight, Search, X } from 'lucide-react';
import { isRemoteProductImage } from '@/components/product-image';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

export type WholesaleSearchSuggestion = {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
};

type WholesaleSearchBarProps = {
  search: string;
  totalProducts: number;
  resultCount: number;
  suggestions: WholesaleSearchSuggestion[];
  onSearchChange: (value: string) => void;
  onClear: () => void;
  onSelectSuggestion: (id: string) => void;
  onViewAllResults?: () => void;
  hideHelper?: boolean;
  className?: string;
};

export const WholesaleSearchBar = forwardRef<HTMLInputElement, WholesaleSearchBarProps>(
  function WholesaleSearchBar(
    {
      search,
      totalProducts,
      resultCount,
      suggestions,
      onSearchChange,
      onClear,
      onSelectSuggestion,
      onViewAllResults,
      hideHelper = false,
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
      if (!hasQuery) return `${totalProducts} products`;
      if (resultCount === 0) return 'No matches';
      return `${resultCount} results`;
    }, [hasQuery, resultCount, totalProducts]);

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

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (!showPanel) {
        if (event.key === 'Escape' && hasQuery) {
          onClear();
        }
        return;
      }

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
            onSelectSuggestion(selected.id);
          }
          return;
        }
        event.preventDefault();
        setOpen(false);
        onViewAllResults?.();
      }
    };

    return (
      <div ref={rootRef} className={cn('relative min-w-0 flex-1', className)}>
        <div className="relative flex items-center overflow-hidden rounded-xl border border-border bg-background transition-shadow focus-within:ring-2 focus-within:ring-primary">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            ref={ref}
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => hasQuery && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search wholesale products…"
            aria-label="Search wholesale products"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={showPanel}
            autoComplete="off"
            className="h-11 w-full bg-transparent py-2 pl-10 pr-11 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
            className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-primary/10"
          >
            {suggestions.length === 0 ? (
              <p className="px-4 py-5 text-center text-sm text-muted-foreground">
                No live matches yet. Keep typing, or browse the catalog below.
              </p>
            ) : (
              <ul className="max-h-[min(22rem,50vh)] overflow-y-auto py-1.5">
                {suggestions.map((item, index) => {
                  const active = index === activeIndex;
                  return (
                    <li key={item.id} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          setOpen(false);
                          onSelectSuggestion(item.id);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-2.5 text-left transition',
                          active ? 'bg-primary/[0.07]' : 'hover:bg-muted/50'
                        )}
                      >
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {item.image && isRemoteProductImage(item.image) ? (
                            <Image
                              src={item.image}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{item.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {item.category}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                          {formatUGX(item.price)}
                        </span>
                      </button>
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
                'flex w-full items-center justify-between border-t border-border px-4 py-3 text-sm font-semibold text-primary transition',
                activeIndex === suggestions.length ? 'bg-primary/[0.07]' : 'hover:bg-muted/40'
              )}
            >
              View all {resultCount} result{resultCount === 1 ? '' : 's'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {!hideHelper ? (
          <p className="mt-2 px-0.5 text-xs text-muted-foreground" aria-live="polite">
            {helperText}
          </p>
        ) : (
          <span className="sr-only" aria-live="polite">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
