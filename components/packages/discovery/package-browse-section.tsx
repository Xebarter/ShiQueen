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

type SortOption = 'name' | 'price-low' | 'price-high' | 'savings';
type CategoryFilter = 'all' | PackageCategoryId;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'savings', label: 'Best savings' },
  { value: 'price-low', label: 'Price: Low to high' },
  { value: 'price-high', label: 'Price: High to low' },
  { value: 'name', label: 'Name A–Z' },
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
  filtersExpanded: boolean;
  onSearchChange: (v: string) => void;
  onSortChange: (v: SortOption) => void;
  onCategoryChange: (v: CategoryFilter) => void;
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
  filtersExpanded,
  onSearchChange,
  onSortChange,
  onCategoryChange,
  onFiltersExpandedChange,
  onClearFilters,
  onQuickView,
  onAddToCart,
}: PackageBrowseSectionProps) {
  const selectedCategory =
    categoryFilter !== 'all' ? getPackageCategory(categoryFilter) : undefined;
  const hasActiveFilters =
    search.trim().length > 0 || categoryFilter !== 'all' || Boolean(collectionTitle);

  return (
    <section id="browse" className="scroll-mt-24 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
            {collectionTitle || 'All curated bundles'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {packages.length} complete solution{packages.length === 1 ? '' : 's'} ready to shop
          </p>
        </div>

        {(selectedCategory || collectionTitle) && selectedCategory && (
          <div className="mb-6 rounded-2xl border border-border/70 bg-muted/20 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <PackageCategoryIcon categoryId={selectedCategory.id} />
              </span>
              <div>
                <h3 className="text-lg font-semibold">{selectedCategory.discoveryLabel}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedCategory.shortDescription}
                </p>
              </div>
            </div>
          </div>
        )}

        {search.trim() && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm">
              Showing results for{' '}
              <span className="font-semibold text-primary">&ldquo;{search.trim()}&rdquo;</span>
            </p>
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        <div className="mb-6">
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

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading…' : (
                <>
                  <span className="font-medium text-foreground">{packages.length}</span> matched
                </>
              )}
            </p>
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
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="hidden h-9 text-xs sm:inline-flex"
                >
                  Clear
                </Button>
              )}
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
          <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
            <p className="text-muted-foreground">No bundles match your filters.</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={onClearFilters}>
              Clear filters
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
