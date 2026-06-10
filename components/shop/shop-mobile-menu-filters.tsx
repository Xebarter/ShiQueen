'use client';

import { Grid3X3, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShopFilters, type ShopPriceRange } from '@/lib/shop-filters-context';

const PRICE_FILTERS: { id: ShopPriceRange; label: string }[] = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-500k', label: 'Under UGX 500K' },
  { id: 'luxury', label: 'Luxury' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

type ShopMobileMenuFiltersProps = {
  onClose?: () => void;
  embedded?: boolean;
};

export function ShopMobileMenuFilters({
  onClose,
  embedded = false,
}: ShopMobileMenuFiltersProps) {
  const filters = useShopFilters();
  if (!filters) return null;

  const {
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    clearFilters,
    hasSecondaryFilters,
  } = filters;

  return (
    <div className={cn(!embedded && 'border-t border-border/50 px-5 py-5', embedded && 'px-4 py-4')}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Shop filters</p>
          <p className="text-[11px] text-muted-foreground">Price, sort & layout</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Price range
          </p>
          <div className="flex flex-wrap gap-2">
            {PRICE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setPriceRange(filter.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  priceRange === filter.id
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-background text-foreground hover:border-primary/40'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="shop-menu-sort"
            className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            Sort by
          </label>
          <select
            id="shop-menu-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            View
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setViewMode('discover');
                onClose?.();
              }}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                viewMode === 'discover'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background hover:border-primary/40'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Discover
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                onClose?.();
              }}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                viewMode === 'grid'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background hover:border-primary/40'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
              Grid
            </button>
          </div>
        </div>

        {hasSecondaryFilters && (
          <button
            type="button"
            onClick={() => {
              clearFilters();
              onClose?.();
            }}
            className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            Clear price & sort filters
          </button>
        )}
      </div>
    </div>
  );
}
