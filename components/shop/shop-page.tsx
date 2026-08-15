'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, X, Grid3X3, LayoutGrid } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { usePublicProducts } from '@/lib/hooks/use-public-catalog';
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
import { ShopCategoryStrip, SHOP_CATEGORY_TABS } from '@/components/shop/shop-category-strip';
import { CatalogBottomCta } from '@/components/shop/catalog-bottom-cta';
import { cn } from '@/lib/utils';
import { shopCategorySeo } from '@/lib/seo/site';
import { isShopSeoCategory, shopCategoryPath } from '@/lib/seo/shop-categories';
import { useTrackSearchQuery } from '@/lib/hooks/use-track-search-query';

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

export function ShopPage({ initialCategory = 'all' }: { initialCategory?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { products, loading } = usePublicProducts();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q')?.trim() ?? '';
  useTrackSearchQuery(searchQuery, 'shop');

  const categoryFromUrl = useMemo(() => {
    const match = pathname.match(/^\/shop\/([^/]+)/);
    const fromPath = match?.[1]?.toLowerCase();
    if (fromPath && isShopSeoCategory(fromPath)) return fromPath;
    const fromQuery = searchParams.get('category')?.toLowerCase();
    if (fromQuery && (fromQuery === 'all' || isShopSeoCategory(fromQuery))) return fromQuery;
    return initialCategory;
  }, [pathname, searchParams, initialCategory]);

  const [category, setCategoryState] = useState(categoryFromUrl);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<ShopPriceRange>('all');
  const [viewMode, setViewMode] = useState<ShopViewMode>('discover');

  const { search: searchCatalog } = useCatalogSearch();

  useEffect(() => {
    setCategoryState(categoryFromUrl);
  }, [categoryFromUrl]);

  const setCategory = useCallback(
    (next: string) => {
      setCategoryState(next);
      const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const path = shopCategoryPath(next);
      router.push(`${path}${query}`, { scroll: false });
    },
    [router, searchQuery]
  );

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
    SHOP_CATEGORY_TABS.find((c) => c.id === category)?.label ?? 'All Products';
  const categoryHeading =
    category !== 'all' && isShopSeoCategory(category)
      ? shopCategorySeo(category).title
      : activeCategoryLabel;

  const clearFilters = useCallback(() => {
    setCategoryState('all');
    setPriceRange('all');
    setSortBy('newest');
    router.push('/shop');
  }, [router]);

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

  const heroProducts = sections?.heroProducts ?? sections?.trending.slice(0, 4) ?? [];

  return (
    <ShopFiltersProvider value={shopFiltersContext}>
      <Header />
      <main className="overflow-x-clip mobile-scroll-optimize">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="pointer-events-none absolute top-20 right-0 hidden h-96 w-96 rounded-full bg-accent/10 blur-3xl md:block" />
          <div className="relative mx-auto max-w-[90rem] px-3 pt-6 pb-6 sm:px-4 md:pt-10 md:pb-8 lg:px-5">
            <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="order-1 grid grid-cols-2 gap-2 sm:gap-2.5 lg:order-2"
              >
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                  : heroProducts.map((product, i) => (
                      <HomeProductCard
                        key={product.id}
                        product={product}
                        variant={i === 0 ? 'editorial' : 'compact'}
                        index={i}
                        priority={i < 2}
                        badges={i === 0 ? ['trending'] : undefined}
                        onQuickView={setQuickViewProduct}
                        wishlistIds={wishlistIds}
                        onWishlistChange={setWishlistIds}
                      />
                    ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
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
                          categoryHeading
                        )}
                      </h1>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isSearchMode
                          ? [
                              searchResultCounts.products > 0
                                ? `${searchResultCounts.products} product${searchResultCounts.products === 1 ? '' : 's'}`
                                : null,
                              searchResultCounts.packages > 0
                                ? `${searchResultCounts.packages} bundle${searchResultCounts.packages === 1 ? '' : 's'}`
                                : null,
                              searchResultCounts.services > 0
                                ? `${searchResultCounts.services} service${searchResultCounts.services === 1 ? '' : 's'}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || '0 items'
                          : `${filteredProducts.length} items`}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={clearFilters} className="shrink-0 gap-1.5">
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  </div>
                ) : (
                  <>
                    <HeroMarketingSlot
                      placement="shop-hero"
                      fallbackPlacements={['home-hero']}
                      compact
                    />
                    <h1 className="mt-4 font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                      Shop women&apos;s fashion &amp; beauty in Uganda
                    </h1>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <Link href="/packages" className="font-medium text-primary hover:underline">
                        Bundles
                      </Link>
                      <span aria-hidden>·</span>
                      <Link href="/" className="hover:text-foreground">
                        Home
                      </Link>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        <ShopCategoryStrip category={category} onSelect={setCategory} showDesktop={false} />

        {/* Desktop filter controls */}
        <div className="sticky top-16 z-40 hidden border-b border-border/60 bg-background/90 backdrop-blur-md md:block">
          <div className="mx-auto max-w-[90rem] px-3 py-3 sm:px-4 lg:px-5">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                {SHOP_CATEGORY_TABS.map((cat) => (
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

        {loading ? (
          <div className="mx-auto flex max-w-[90rem] justify-center px-3 py-20 sm:px-4 lg:px-5">
            <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
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
              <div className="mx-auto max-w-[90rem] px-3 sm:px-4 lg:px-5">
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
                      <div className="col-span-full py-16 text-center">
                        <p className="mb-4 text-muted-foreground">
                          {`No products, bundles, or services found for "${searchQuery}"`}
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
                      <div className="col-span-full py-16 text-center">
                        <p className="mb-4 text-muted-foreground">No products match your filters</p>
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

        <CatalogBottomCta />
        <Footer />
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      </main>
    </ShopFiltersProvider>
  );
}
