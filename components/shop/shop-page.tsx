'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, X, Grid3X3, LayoutGrid } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/lib/products-context';
import { HomeProductCard, ProductCardSkeleton } from '@/components/home/home-product-card';
import { QuickViewModal } from '@/components/home/quick-view-modal';
import { MerchandisingBlocks, AllProductsGrid } from '@/components/shared/merchandising-blocks';
import { CatalogSearchResults } from '@/components/shared/catalog-search-results';
import {
  useProductMerchandising,
  sortProducts,
  filterByCategory,
  filterByPriceRange,
} from '@/lib/hooks/use-product-merchandising';
import { useCatalogSearch } from '@/lib/hooks/use-catalog-search';
import {
  countCatalogSearchHits,
  filterCatalogSearchHits,
} from '@/lib/catalog-search';
import { HeroMarketingSlot } from '@/components/home/hero-marketing-slot';
import { PackageSpotlightSection } from '@/components/packages/package-spotlight-section';
import {
  ShopFiltersProvider,
  type ShopPriceRange,
  type ShopViewMode,
} from '@/lib/shop-filters-context';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'all', label: 'All Products', shortLabel: 'All' },
  { id: 'clothing', label: 'Clothing', shortLabel: 'Clothes' },
  { id: 'beauty', label: 'Beauty', shortLabel: 'Beauty' },
  { id: 'wellness', label: 'Wellness', shortLabel: 'Wellness' },
  { id: 'accessories', label: 'Accessories', shortLabel: 'Access.' },
  { id: 'home', label: 'Home', shortLabel: 'Home' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

const PRICE_FILTERS = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-500k', label: 'Under UGX 500K' },
  { id: 'luxury', label: 'Luxury' },
] as const;

export function ShopPage() {
  const router = useRouter();
  const { products, loading } = useProducts();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q')?.trim() ?? '';

  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<ShopPriceRange>('all');
  const [viewMode, setViewMode] = useState<ShopViewMode>('discover');

  const { search: searchCatalog } = useCatalogSearch();

  useEffect(() => {
    const paramCategory = searchParams.get('category');
    if (paramCategory) {
      setCategory(paramCategory.toLowerCase());
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchQuery) {
      setViewMode('grid');
    }
  }, [searchQuery]);

  const searchHits = useMemo(() => {
    if (!searchQuery) return [];
    return searchCatalog(searchQuery, 200);
  }, [searchQuery, searchCatalog]);

  const filteredSearchHits = useMemo(() => {
    if (!searchQuery) return [];
    return filterCatalogSearchHits(searchHits, {
      category,
      priceRange,
      products,
    });
  }, [searchHits, category, priceRange, products, searchQuery]);

  const searchResultCounts = useMemo(
    () => countCatalogSearchHits(filteredSearchHits),
    [filteredSearchHits]
  );

  const filteredProducts = useMemo(() => {
    let result = products;
    result = filterByCategory(result, category);
    result = filterByPriceRange(result, priceRange);
    return sortProducts(result, sortBy);
  }, [products, category, priceRange, sortBy]);

  const isSearchMode = Boolean(searchQuery);
  const isFiltered = isSearchMode || category !== 'all' || priceRange !== 'all';
  const displayProducts = isFiltered ? filteredProducts : products;

  const {
    sections,
    wishlistIds,
    setWishlistIds,
    viewedIds,
    quickViewProduct,
    setQuickViewProduct,
  } = useProductMerchandising(displayProducts);
  const activeCategoryLabel =
    CATEGORIES.find((c) => c.id === category)?.label ?? 'All Products';

  const clearFilters = useCallback(() => {
    setCategory('all');
    setPriceRange('all');
    setSortBy('newest');
    if (isSearchMode) {
      router.push('/shop');
    }
  }, [isSearchMode, router]);

  const shopFiltersContext = useMemo(
    () => ({
      priceRange,
      setPriceRange,
      sortBy,
      setSortBy,
      viewMode,
      setViewMode,
      clearFilters,
      hasSecondaryFilters: priceRange !== 'all' || sortBy !== 'newest',
    }),
    [priceRange, sortBy, viewMode, clearFilters]
  );

  return (
    <ShopFiltersProvider value={shopFiltersContext}>
      <Header />
      <main className="overflow-x-clip mobile-scroll-optimize">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-6 sm:px-6 md:pb-6 md:pt-8 lg:px-8">
          <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="order-1 grid grid-cols-4 gap-2 lg:order-2"
            >
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} variant="compact" />)
                : (sections?.trending.slice(0, 4) ?? []).map((product, i) => (
                    <HomeProductCard
                      key={product.id}
                      product={product}
                      variant="compact"
                      index={i}
                      onQuickView={setQuickViewProduct}
                      wishlistIds={wishlistIds}
                      onWishlistChange={setWishlistIds}
                    />
                  ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="order-2 lg:order-1"
            >
              {isSearchMode || isFiltered ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                      <Sparkles className="h-3 w-3" />
                      {isSearchMode ? 'Search' : activeCategoryLabel}
                    </p>
                    <h1 className="truncate text-2xl font-light tracking-tight md:text-3xl">
                      {isSearchMode ? (
                        <span className="font-medium text-primary">&ldquo;{searchQuery}&rdquo;</span>
                      ) : (
                        activeCategoryLabel
                      )}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isSearchMode ? searchResultCounts.total : filteredProducts.length} items
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearFilters} className="shrink-0 gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
              ) : (
                <HeroMarketingSlot
                  placement="shop-hero"
                  fallbackPlacements={['home-hero']}
                  compact
                />
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sticky filter bar — mobile: categories only (one row); desktop: full controls */}
      <div className="sticky top-[var(--mobile-header-offset,4rem)] z-40 border-b border-border/60 bg-background/90 backdrop-blur-md lg:top-16">
        <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 sm:py-3 lg:px-8">
          {/* Mobile: single-line category strip */}
          <div className="grid grid-cols-6 gap-0.5 md:hidden">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'min-w-0 rounded-full px-0.5 py-2 text-center text-[10px] font-medium leading-tight transition',
                  category === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                )}
              >
                <span className="block truncate">{cat.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Desktop: categories + price / sort / view */}
          <div className="hidden flex-col gap-3 md:flex">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
                    category === cat.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {PRICE_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setPriceRange(filter.id)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                      priceRange === filter.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <div className="hidden overflow-hidden rounded-lg border border-border sm:flex">
                  <button
                    type="button"
                    onClick={() => setViewMode('discover')}
                    className={cn(
                      'p-2',
                      viewMode === 'discover'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    )}
                    title="Discovery view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2',
                      viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    )}
                    title="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : isSearchMode || viewMode === 'grid' ? (
        <>
          {!isSearchMode && category !== 'all' ? (
            <PackageSpotlightSection
              context="shop"
              shopCategory={category}
              className="border-b border-border/50 bg-primary/5"
            />
          ) : null}
          <section className="py-7 md:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {isSearchMode ? searchResultCounts.total : filteredProducts.length}
                </span>{' '}
                items
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('discover')}
                className="gap-1.5"
                aria-label="Discovery view"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Discover</span>
              </Button>
            </div>
            {isSearchMode ? (
              <CatalogSearchResults
                hits={filteredSearchHits}
                wishlistIds={wishlistIds}
                onWishlistChange={setWishlistIds}
                onQuickView={setQuickViewProduct}
                emptyMessage={
                  <div className="text-center py-16 col-span-full">
                    <p className="text-muted-foreground mb-4">
                      {`No products or bundles found for "${searchQuery}"`}
                    </p>
                    <Button onClick={clearFilters}>Clear search</Button>
                  </div>
                }
              />
            ) : (
              <AllProductsGrid
                products={filteredProducts}
                wishlistIds={wishlistIds}
                onWishlistChange={setWishlistIds}
                onQuickView={setQuickViewProduct}
                emptyMessage={
                  <div className="text-center py-16 col-span-full">
                    <p className="text-muted-foreground mb-4">No products match your filters</p>
                    <Button onClick={clearFilters}>Clear all filters</Button>
                  </div>
                }
              />
            )}
          </div>
        </section>
        </>
      ) : sections ? (
        <MerchandisingBlocks
          products={displayProducts}
          sections={sections}
          loading={false}
          wishlistIds={wishlistIds}
          onWishlistChange={setWishlistIds}
          onQuickView={setQuickViewProduct}
          viewedIds={viewedIds}
          showCategoryShowcases={!isFiltered}
          afterFlashDeals={
            <PackageSpotlightSection
              context="shop"
              shopCategory={category}
              className="bg-gradient-to-r from-primary/5 via-background to-accent/5"
            />
          }
        />
      ) : (
        <section className="py-20 text-center">
          <p className="text-muted-foreground">No products available</p>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="border-t border-border bg-secondary/30 py-8 md:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <Link href="/packages" className="flex-1">
            <Button size="lg" variant="default" className="w-full gap-2">
              Bundles
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/wholesale" className="flex-1">
            <Button size="lg" variant="outline" className="w-full gap-2">
              Wholesale
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </main>
    </ShopFiltersProvider>
  );
}
