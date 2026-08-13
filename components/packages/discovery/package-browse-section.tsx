'use client';

import { Package as PackageType } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import {
  PackageDiscoveryCard,
  PackageDiscoveryCardSkeleton,
} from '@/components/packages/package-discovery-card';
import {
  PACKAGE_CATEGORIES,
  getPackageCategory,
  getPackageCategoryDiscoveryLabel,
  type PackageCategoryId,
} from '@/lib/package-catalog';
import { PackageCategoryIcon } from '@/components/packages/package-category-icon';
import { cn } from '@/lib/utils';
import { SlidersHorizontal } from 'lucide-react';

type SortOption = 'relevance' | 'name' | 'price-low' | 'price-high' | 'savings';
type CategoryFilter = 'all' | PackageCategoryId;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Best match' },
  { value: 'savings', label: 'Best savings' },
  { value: 'price-low', label: 'Price: Low to high' },
  { value: 'price-high', label: 'Price: High to low' },
  { value: 'name', label: 'Name A–Z' },
];

const PRICE_FILTERS: { label: string; value?: number }[] = [
  { label: 'Any price' },
  { label: 'Under 200K', value: 200_000 },
  { label: 'Under 500K', value: 500_000 },
  { label: 'Under 1M', value: 1_000_000 },
];

interface PackageBrowseSectionProps {
  loading: boolean;
  packages: PackageType[];
  products: Product[];
  retailPrices: Record<string, number>;
  search: string;
  sort: SortOption;
  categoryFilter: CategoryFilter;
  collectionTitle?: string;
  maxPriceFilter?: number;
  filtersExpanded: boolean;
  onSortChange: (v: SortOption) => void;
  onCategoryChange: (v: CategoryFilter) => void;
  onMaxPriceChange: (v: number | undefined) => void;
  onFiltersExpandedChange: (v: boolean) => void;
  onClearFilters: () => void;
  onQuickView: (pkg: PackageType) => void;
  onAddToCart: (pkg: PackageType, e: React.MouseEvent) => void;
}

export function PackageBrowseSection({
  loading,
  packages,
  products,
  retailPrices,
  search,
  sort,
  categoryFilter,
  collectionTitle,
  maxPriceFilter,
  filtersExpanded,
  onSortChange,
  onCategoryChange,
  onMaxPriceChange,
  onFiltersExpandedChange,
  onClearFilters,
  onQuickView,
  onAddToCart,
}: PackageBrowseSectionProps) {
  const selectedCategory =
    categoryFilter !== 'all' ? getPackageCategory(categoryFilter) : undefined;
  const isSearch = search.trim().length > 0;
  const hasActiveFilters =
    isSearch || categoryFilter !== 'all' || Boolean(collectionTitle) || Boolean(maxPriceFilter);

  const heading = isSearch
    ? `Results for “${search.trim()}”`
    : collectionTitle || (selectedCategory ? selectedCategory.discoveryLabel : 'The full atelier');

  return (
    <section id="browse" className="scroll-mt-28 py-10 sm:scroll-mt-32 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              {isSearch ? 'Live results' : 'Catalog'}
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight">
              {heading}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {loading
                ? 'Gathering collections…'
                : `${packages.length} complete collection${packages.length === 1 ? '' : 's'}`}
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters} className="rounded-full">
              Reset filters
            </Button>
          )}
        </div>

        {selectedCategory && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackageCategoryIcon categoryId={selectedCategory.id} />
            </span>
            <p className="text-sm text-muted-foreground">{selectedCategory.shortDescription}</p>
          </div>
        )}

        <div className="mb-6 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => onCategoryChange('all')}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
                categoryFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              All
            </button>
            {PACKAGE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
                  categoryFilter === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                )}
              >
                {getPackageCategoryDiscoveryLabel(cat.id)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {PRICE_FILTERS.map((filter) => {
                const selected = maxPriceFilter === filter.value;
                return (
                  <button
                    key={filter.label}
                    type="button"
                    onClick={() => onMaxPriceChange(filter.value)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      selected
                        ? 'border-accent bg-accent/15 text-accent-foreground'
                        : 'border-border/70 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onFiltersExpandedChange(!filtersExpanded)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium sm:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Sort
              </button>
              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className={cn(
                  'h-9 rounded-lg border border-border bg-background px-3 text-xs',
                  filtersExpanded ? 'block w-full sm:w-auto' : 'hidden sm:block'
                )}
              >
                {SORT_OPTIONS.filter((opt) => isSearch || opt.value !== 'relevance').map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PackageDiscoveryCardSkeleton key={i} />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
            <p className="font-[family-name:var(--font-brand)] text-2xl">Nothing in this edit yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Clear filters or try a broader search — collections update as you type.
            </p>
            <Button variant="outline" className="mt-5 rounded-full" onClick={onClearFilters}>
              Show all collections
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, index) => (
              <PackageDiscoveryCard
                key={pkg.id}
                pkg={pkg}
                products={products}
                retailPrices={retailPrices}
                index={index}
                onQuickView={onQuickView}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export type { SortOption, CategoryFilter };
