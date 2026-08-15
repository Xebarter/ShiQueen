'use client';

import Link from 'next/link';
import { ArrowRight, Clock, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchHistory } from '@/lib/hooks/use-search-history';
import {
  formatSearchHistoryDate,
  searchHistoryHref,
  type SearchHistorySource,
} from '@/lib/search-history';

function sourceLabel(source?: SearchHistorySource): string {
  switch (source) {
    case 'packages':
      return 'Packages';
    case 'services':
      return 'Services';
    case 'wholesale':
      return 'Wholesale';
    case 'shop':
      return 'Shop';
    case 'catalog':
    default:
      return 'Catalog';
  }
}

export function AccountSearchHistory() {
  const { entries, ready, remove, clear } = useSearchHistory();

  if (!ready) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-6 py-14 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Search className="h-5 w-5" />
        </span>
        <p className="text-base font-medium">No searches yet</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Searches from the header, shop, packages, and services will appear here.
        </p>
        <Link href="/shop" className="mt-5 inline-flex">
          <Button className="rounded-xl gap-2">
            Start searching
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{entries.length}</span>{' '}
          {entries.length === 1 ? 'search' : 'searches'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg"
          onClick={() => {
            if (confirm('Clear all search history?')) clear();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </Button>
      </div>

      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70">
        {entries.map((entry) => (
          <li
            key={`${entry.query}-${entry.searchedAt}`}
            className="flex items-center gap-2 bg-card px-3 py-3 sm:px-4"
          >
            <Link
              href={searchHistoryHref(entry)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-muted/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Clock className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.query}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {sourceLabel(entry.source)} · {formatSearchHistoryDate(entry.searchedAt)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
            <button
              type="button"
              onClick={() => remove(entry.query)}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={`Remove “${entry.query}” from history`}
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
