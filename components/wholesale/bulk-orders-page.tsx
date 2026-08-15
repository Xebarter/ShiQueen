'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { WholesaleHero } from '@/components/wholesale/wholesale-benefits-banner';
import {
  WholesaleProductCard,
  WholesaleProductCardSkeleton,
} from '@/components/wholesale/wholesale-product-card';
import { WholesaleSearchBar } from '@/components/wholesale/wholesale-search-bar';
import { BulkCartDrawer } from '@/components/wholesale/bulk-cart-drawer';
import { BulkOrderSummary } from '@/components/wholesale/bulk-order-summary';
import { useProducts } from '@/lib/products-context';
import { useCart, type CartItem } from '@/lib/cart-context';
import { useWholesale } from '@/lib/wholesale-context';
import { useAuth } from '@/lib/auth-context';
import { createProductSearchIndex } from '@/lib/product-search';
import {
  getWholesaleCatalogProducts,
  filterWholesaleByCategory,
  getWholesaleUnitPrice,
  sortWholesaleProducts,
  WHOLESALE_SORT_OPTIONS,
  WholesaleSortOption,
} from '@/lib/wholesale-catalog';
import {
  getWholesaleSavings,
  getWholesaleSubtotal,
  validateWholesaleCartItems,
} from '@/lib/wholesale-cart';
import { Product } from '@/lib/types/database';
import { ShoppingCart, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useTrackSearchQuery } from '@/lib/hooks/use-track-search-query';
import { recordSearchHistory } from '@/lib/search-history';
import { ShopCategoryStrip } from '@/components/shop/shop-category-strip';

const SUMMARY_SECTION_ID = 'bulk-order-summary';
const RESULTS_SECTION_ID = 'wholesale-results';

function BulkOrdersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, loading } = useProducts();
  const {
    items,
    total,
    itemCount,
    addWholesaleProduct,
    updateWholesaleQuantity,
    updateQuantity,
    removeItem,
    clearCart,
    getWholesaleCartItem,
  } = useCart();
  const { createBulkOrder } = useWholesale();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  useTrackSearchQuery(searchTerm, 'wholesale');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<WholesaleSortOption>('newest');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showJumpSearch, setShowJumpSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hydratedQuery = useRef(false);

  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const wholesaleProducts = useMemo(() => getWholesaleCatalogProducts(products), [products]);

  const featuredProducts = useMemo(
    () => sortWholesaleProducts(wholesaleProducts, 'popular').slice(0, 4),
    [wholesaleProducts]
  );

  const searchIndex = useMemo(
    () => createProductSearchIndex(wholesaleProducts),
    [wholesaleProducts]
  );

  useEffect(() => {
    if (hydratedQuery.current) return;
    hydratedQuery.current = true;
    const q = searchParams.get('q');
    if (q) setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const next = searchTerm.trim();
      if (next) params.set('q', next);
      else params.delete('q');
      const qs = params.toString();
      const href = qs ? `/wholesale?${qs}` : '/wholesale';
      if (`${window.location.pathname}${window.location.search}` !== href) {
        router.replace(href, { scroll: false });
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm, router, searchParams]);

  const filteredProducts = useMemo(() => {
    let result = wholesaleProducts;

    if (searchTerm.trim()) {
      result = searchIndex.search(searchTerm.trim(), 200).map((hit) => hit.product);
    }

    result = filterWholesaleByCategory(result, category);
    return sortWholesaleProducts(result, sortBy);
  }, [wholesaleProducts, searchTerm, searchIndex, category, sortBy]);

  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return searchIndex.search(searchTerm.trim(), 6).map((hit) => ({
      id: hit.product.id,
      name: hit.product.name,
      category: hit.product.category,
      price: getWholesaleUnitPrice(hit.product, hit.product.minOrderQuantity),
      image: hit.product.image || hit.product.images[0],
    }));
  }, [searchIndex, searchTerm]);

  const isFiltered = searchTerm.trim() !== '' || category !== 'all';
  const totalSavings = useMemo(() => getWholesaleSavings(items), [items]);
  const totalUnits = itemCount;

  const scrollToResults = useCallback(() => {
    document.getElementById(RESULTS_SECTION_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  const handleSelectSuggestion = useCallback(
    (id: string) => {
      if (searchTerm.trim()) recordSearchHistory(searchTerm.trim(), 'wholesale');
      const el = document.getElementById(`wholesale-product-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary');
        window.setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 1600);
        return;
      }
      scrollToResults();
    },
    [scrollToResults, searchTerm]
  );

  const handleAddProduct = useCallback(
    (product: Product, quantity: number) => {
      const added = addWholesaleProduct(product, quantity);
      if (!added) {
        toast.error('Unable to add product — check stock availability');
        return;
      }
      toast.success(`Added ${quantity} units of ${product.name}`);
      setDrawerOpen(true);
    },
    [addWholesaleProduct]
  );

  const handleCartItemUpdate = useCallback(
    (item: CartItem, quantity: number) => {
      const product = productsById.get(item.id);
      if (item.wholesale && product) {
        updateWholesaleQuantity(item.id, quantity, product);
        return;
      }
      updateQuantity(item.id, quantity, undefined, { wholesale: false });
    },
    [productsById, updateWholesaleQuantity, updateQuantity]
  );

  const handleCartItemRemove = useCallback(
    (item: CartItem) => {
      removeItem(item.id, { wholesale: !!item.wholesale });
    },
    [removeItem]
  );

  const handleCheckout = useCallback(async () => {
    const validation = validateWholesaleCartItems(items, productsById);
    if (!validation.valid) {
      toast.error(validation.error ?? 'Please fix your cart before checkout');
      return;
    }

    const wholesaleLines = items.filter((item) => item.wholesale);
    if (wholesaleLines.length === 0) {
      toast.error('Add wholesale products to proceed');
      return;
    }

    const wholesaleSubtotal = getWholesaleSubtotal(items);

    setCheckoutLoading(true);
    try {
      await createBulkOrder({
        id: `bulk-${Date.now()}`,
        customerId: user?.uid || user?.email || 'guest',
        items: wholesaleLines.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.quantity * item.price,
        })),
        totalAmount: wholesaleSubtotal,
        orderType: 'wholesale',
        status: 'pending',
        requestedAt: new Date(),
      });

      setDrawerOpen(false);
      router.push('/checkout');
    } catch {
      toast.error('Failed to prepare checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  }, [items, productsById, createBulkOrder, user, router]);

  const handleViewSummary = useCallback(() => {
    setDrawerOpen(false);
    const el = document.getElementById(SUMMARY_SECTION_ID);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const el = document.getElementById('wholesale-search');
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowJumpSearch(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const jumpToSearch = useCallback(() => {
    document.getElementById('wholesale-search')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    window.setTimeout(() => searchInputRef.current?.focus(), 350);
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('all');
    setSortBy('newest');
  };

  return (
    <>
      <Header />
      <main className="min-h-screen overflow-x-clip bg-background mobile-scroll-optimize">
        <WholesaleHero
          catalogSize={wholesaleProducts.length}
          featured={featuredProducts}
          loading={loading && wholesaleProducts.length === 0}
          onSelectProduct={handleSelectSuggestion}
          search={
            <WholesaleSearchBar
              ref={searchInputRef}
              search={searchTerm}
              totalProducts={wholesaleProducts.length}
              resultCount={filteredProducts.length}
              suggestions={suggestions}
              onSearchChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              onSelectSuggestion={handleSelectSuggestion}
              onViewAllResults={scrollToResults}
              hideHelper
            />
          }
        />

        <ShopCategoryStrip
          category={category}
          onSelect={setCategory}
          className="border-border/50"
        />

        <section className="pb-16">
          <div className="mx-auto max-w-[90rem] px-3 sm:px-4 lg:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2 py-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="tabular-nums">
                  {filteredProducts.length}
                  <span className="text-muted-foreground/70"> / {wholesaleProducts.length}</span>
                </span>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/80"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
                {searchTerm.trim() ? (
                  <span className="truncate text-xs">“{searchTerm.trim()}”</span>
                ) : null}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as WholesaleSortOption)}
                aria-label="Sort products"
                className="h-9 rounded-full border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {WHOLESALE_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              id={RESULTS_SECTION_ID}
              className="grid scroll-mt-28 gap-6 lg:grid-cols-[1fr_340px] lg:gap-8 lg:scroll-mt-24"
            >
              <div>
                {loading ? (
                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <WholesaleProductCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 py-16 text-center">
                    <p className="text-muted-foreground">No matches</p>
                    {isFiltered && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-3 text-sm font-medium text-primary hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        id={`wholesale-product-${product.id}`}
                        className="rounded-2xl transition ring-offset-2 ring-offset-background"
                      >
                        <WholesaleProductCard
                          product={product}
                          cartItem={getWholesaleCartItem(product.id)}
                          onAdd={handleAddProduct}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <aside className="hidden lg:block lg:self-start lg:sticky lg:top-28">
                <BulkOrderSummary
                  id={SUMMARY_SECTION_ID}
                  items={items}
                  subtotal={total}
                  totalSavings={totalSavings}
                  totalUnits={totalUnits}
                  onCheckout={handleCheckout}
                  onClear={() => {
                    if (confirm('Clear your entire cart?')) clearCart();
                  }}
                  checkoutLoading={checkoutLoading}
                />
              </aside>
            </div>

            <div className="border-t border-border/60 pt-8 lg:hidden" id={SUMMARY_SECTION_ID}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold tracking-tight">Your order</h2>
              </div>
              <BulkOrderSummary
                items={items}
                subtotal={total}
                totalSavings={totalSavings}
                totalUnits={totalUnits}
                onCheckout={handleCheckout}
                onClear={() => {
                  if (confirm('Clear your entire cart?')) clearCart();
                }}
                checkoutLoading={checkoutLoading}
              />
            </div>
          </div>
        </section>

        {showJumpSearch ? (
          <button
            type="button"
            onClick={jumpToSearch}
            aria-label="Search wholesale products"
            className={cn(
              'fixed bottom-6 left-4 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-border/80',
              'bg-card/95 px-3.5 text-sm font-semibold shadow-lg backdrop-blur-md transition hover:bg-card',
              'active:scale-[0.98] lg:bottom-8 lg:left-6',
              items.length > 0 && 'bottom-20 lg:bottom-8'
            )}
          >
            <Search className="h-4 w-4 text-primary" />
            Search
          </button>
        ) : null}

        {items.length > 0 ? (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={`Open order with ${items.length} items`}
            className="fixed bottom-6 right-4 z-40 flex h-12 items-center gap-2.5 rounded-full border border-border/80 bg-foreground px-4 text-background shadow-lg transition hover:bg-foreground/90 active:scale-[0.98] lg:bottom-8"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm font-semibold tabular-nums">{itemCount}</span>
          </button>
        ) : null}

        <BulkCartDrawer
          open={drawerOpen}
          items={items}
          subtotal={total}
          totalSavings={totalSavings}
          totalUnits={totalUnits}
          productsById={productsById}
          checkoutLoading={checkoutLoading}
          onClose={() => setDrawerOpen(false)}
          onContinue={() => setDrawerOpen(false)}
          onViewSummary={handleViewSummary}
          onCheckout={handleCheckout}
          onUpdateQuantity={handleCartItemUpdate}
          onRemove={handleCartItemRemove}
        />

        <Footer />
      </main>
    </>
  );
}

export function BulkOrdersPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="min-h-screen bg-background">
            <div className="mx-auto max-w-[90rem] px-3 py-10 sm:px-4 lg:px-5">
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <WholesaleProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </main>
        </>
      }
    >
      <BulkOrdersPageInner />
    </Suspense>
  );
}
