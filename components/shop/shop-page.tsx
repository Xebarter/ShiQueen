'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, SlidersHorizontal, X, Grid3X3, LayoutGrid } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/lib/products-context';
import { HomeProductCard, ProductCardSkeleton } from '@/components/home/home-product-card';
import { QuickViewModal } from '@/components/home/quick-view-modal';
import { MerchandisingBlocks, AllProductsGrid } from '@/components/shared/merchandising-blocks';
import {
  useProductMerchandising,
  sortProducts,
  filterByCategory,
  filterByPriceRange,
} from '@/lib/hooks/use-product-merchandising';
import { createProductSearchIndex } from '@/lib/product-search';
import { HeroMarketingSlot } from '@/components/home/hero-marketing-slot';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'home', label: 'Home' },
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

type ViewMode = 'discover' | 'grid';

export function ShopPage() {
  const router = useRouter();
  const { products, loading } = useProducts();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q')?.trim() ?? '';

  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<'all' | 'under-500k' | 'luxury'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('discover');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const searchIndex = useMemo(() => createProductSearchIndex(products), [products]);

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

  const searchedProducts = useMemo(() => {
    if (!searchQuery) return products;
    return searchIndex.search(searchQuery, 200).map((hit) => hit.product);
  }, [products, searchQuery, searchIndex]);

  const filteredProducts = useMemo(() => {
    let result = searchQuery ? searchedProducts : products;
    result = filterByCategory(result, category);
    result = filterByPriceRange(result, priceRange);
    return sortProducts(result, sortBy);
  }, [products, searchQuery, searchedProducts, category, priceRange, sortBy]);

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

  const clearFilters = () => {
    setCategory('all');
    setPriceRange('all');
    setSortBy('newest');
    if (isSearchMode) {
      router.push('/shop');
    }
  };

  return (
    <>
      <Header />
      <main className="overflow-x-hidden">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 md:pt-10 md:pb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {isSearchMode || isFiltered ? (
                <>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-widest mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isSearchMode ? 'Search' : activeCategoryLabel}
                  </span>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-3">
                    {isSearchMode ? (
                      <>
                        Results for{' '}
                        <span className="font-semibold text-primary">&ldquo;{searchQuery}&rdquo;</span>
                      </>
                    ) : (
                      <>
                        Shop <span className="font-semibold text-primary">{activeCategoryLabel}</span>
                      </>
                    )}
                  </h1>
                  <p className="text-muted-foreground max-w-lg mb-4">
                    {isSearchMode
                      ? `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} matched your search`
                      : `${filteredProducts.length} curated products matching your selection`}
                  </p>
                  <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                    <X className="w-3.5 h-3.5" />
                    {isSearchMode ? 'Clear search' : 'Clear filters'}
                  </Button>
                </>
              ) : (
                <HeroMarketingSlot placement="shop-hero" compact />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hidden sm:grid grid-cols-4 gap-2"
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
          </div>
        </div>
      </section>

      {/* Sticky filter bar */}
      <div className="sticky top-[var(--mobile-header-offset,4rem)] z-40 bg-background/90 backdrop-blur-md border-b border-border/60 lg:top-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3">
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                    category === cat.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
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
                    onClick={() => setPriceRange(filter.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      priceRange === filter.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm px-3 py-2 rounded-lg border border-border bg-background"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <div className="hidden sm:flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setViewMode('discover')}
                    className={`p-2 ${viewMode === 'discover' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                    title="Discovery view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                    title="Grid view"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="md:hidden pt-2 border-t border-border"
              >
                <p className="text-xs text-muted-foreground mb-2">Price range</p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setPriceRange(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs border ${
                        priceRange === filter.id ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
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
        <section className="py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-semibold text-foreground">{filteredProducts.length}</span>{' '}
                products
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('discover')}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Discovery view
              </Button>
            </div>
            <AllProductsGrid
              products={filteredProducts}
              wishlistIds={wishlistIds}
              onWishlistChange={setWishlistIds}
              onQuickView={setQuickViewProduct}
              emptyMessage={
                <div className="text-center py-16 col-span-full">
                  <p className="text-muted-foreground mb-4">
                    {isSearchMode
                      ? `No products found for "${searchQuery}"`
                      : 'No products match your filters'}
                  </p>
                  <Button onClick={clearFilters}>
                    {isSearchMode ? 'Clear search' : 'Clear all filters'}
                  </Button>
                </div>
              }
            />
          </div>
        </section>
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
        />
      ) : (
        <section className="py-20 text-center">
          <p className="text-muted-foreground">No products available</p>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-12 md:py-16 bg-secondary/40 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-light mb-3">Looking for bulk pricing?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Save up to 25% with our wholesale program — perfect for retailers and resellers.
          </p>
          <Link href="/wholesale">
            <Button size="lg" className="gap-2">
              Explore Wholesale
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </main>
    </>
  );
}
