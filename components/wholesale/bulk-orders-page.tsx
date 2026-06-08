'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { WholesaleBenefitsBanner } from '@/components/wholesale/wholesale-benefits-banner';
import {
  WholesaleProductCard,
  WholesaleProductCardSkeleton,
} from '@/components/wholesale/wholesale-product-card';
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
  sortWholesaleProducts,
  WHOLESALE_CATEGORIES,
  WHOLESALE_SORT_OPTIONS,
  WholesaleSortOption,
} from '@/lib/wholesale-catalog';
import {
  getWholesaleSavings,
  getWholesaleSubtotal,
  validateWholesaleCartItems,
} from '@/lib/wholesale-cart';
import { Product } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { Search, SlidersHorizontal, ShoppingCart, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const SUMMARY_SECTION_ID = 'bulk-order-summary';

export function BulkOrdersPage() {
  const router = useRouter();
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
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<WholesaleSortOption>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const wholesaleProducts = useMemo(() => getWholesaleCatalogProducts(products), [products]);

  const searchIndex = useMemo(
    () => createProductSearchIndex(wholesaleProducts),
    [wholesaleProducts]
  );

  const filteredProducts = useMemo(() => {
    let result = wholesaleProducts;

    if (searchTerm.trim()) {
      result = searchIndex.search(searchTerm.trim(), 200).map((hit) => hit.product);
    }

    result = filterWholesaleByCategory(result, category);
    return sortWholesaleProducts(result, sortBy);
  }, [wholesaleProducts, searchTerm, searchIndex, category, sortBy]);

  const isFiltered = searchTerm.trim() !== '' || category !== 'all';
  const totalSavings = useMemo(() => getWholesaleSavings(items), [items]);
  const totalUnits = itemCount;

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

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('all');
    setSortBy('newest');
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="pb-28 lg:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-8 sm:py-10">
            <WholesaleBenefitsBanner catalogSize={wholesaleProducts.length} />
          </div>

          <div className="sticky top-16 z-30 -mx-4 border-b border-border/60 bg-background/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search wholesale products…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-11 shrink-0 gap-2 rounded-xl lg:hidden"
                  onClick={() => setFiltersOpen((o) => !o)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </div>

              <div
                className={cn(
                  'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between',
                  !filtersOpen && 'hidden lg:flex'
                )}
              >
                <div className="flex flex-wrap gap-2">
                  {WHOLESALE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        'rounded-full px-3.5 py-1.5 text-xs font-medium transition sm:text-sm',
                        category === cat.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as WholesaleSortOption)}
                  aria-label="Sort products"
                  className="h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {WHOLESALE_SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {filteredProducts.length} of {wholesaleProducts.length} products
                </span>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/80"
                  >
                    <X className="h-3 w-3" />
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-8 py-8 lg:grid-cols-[1fr_380px] lg:gap-10 lg:py-10">
            <div>
              {loading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <WholesaleProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 py-16 text-center">
                  <p className="text-muted-foreground">No wholesale products match your filters.</p>
                  {isFiltered && (
                    <Button variant="outline" className="mt-4" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-2">
                  {filteredProducts.map((product) => (
                    <WholesaleProductCard
                      key={product.id}
                      product={product}
                      cartItem={getWholesaleCartItem(product.id)}
                      onAdd={handleAddProduct}
                    />
                  ))}
                </div>
              )}
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24">
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
              </div>
            </aside>
          </div>

          <div className="lg:hidden" id={SUMMARY_SECTION_ID}>
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

      {items.length > 0 && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={`Open cart with ${items.length} items`}
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 active:scale-95 sm:bottom-8 lg:bottom-8"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        </button>
      )}

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 py-4 backdrop-blur-md lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {totalUnits} units · {items.length} lines
              </p>
              <p className="text-xl font-semibold text-primary">{formatUGX(total)}</p>
            </div>
            {totalSavings > 0 && (
              <p className="text-xs font-semibold text-accent">
                Saving {formatUGX(totalSavings)}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-11 rounded-xl" onClick={() => setDrawerOpen(true)}>
              View cart
            </Button>
            <Button
              className="h-11 rounded-xl font-semibold"
              disabled={checkoutLoading}
              onClick={handleCheckout}
            >
              Checkout
            </Button>
          </div>
        </div>
      )}

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
  );
}
