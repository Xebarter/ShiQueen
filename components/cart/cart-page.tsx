'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Boxes,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { BulkQuantityStepper } from '@/components/wholesale/bulk-quantity-stepper';
import { isRemoteProductImage } from '@/components/product-image';
import { useCart, type CartItem } from '@/lib/cart-context';
import { useProducts } from '@/lib/products-context';
import { useWholesale } from '@/lib/wholesale-context';
import { getWholesaleDiscountForItem, getWholesaleSavings } from '@/lib/wholesale-cart';
import { formatUGX, getRetailPricesMap, productsToCatalog } from '@/lib/wholesale-data';
import {
  getPackageImage,
  isPackageCartItem,
  resolvePackageSavings,
} from '@/lib/package-utils';
import { ShareButton } from '@/components/shared/share-button';
import { cn } from '@/lib/utils';

function cartItemKey(item: CartItem): string {
  return [item.id, item.size, item.color, item.wholesale ? 'wholesale' : 'retail']
    .filter(Boolean)
    .join('-');
}

function CartItemImage({ item, imageSrc }: { item: CartItem; imageSrc?: string }) {
  const src = imageSrc ?? item.image;
  if (isRemoteProductImage(src)) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={src}
          alt={item.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary/5 via-muted to-accent/10">
      {isPackageCartItem(item) ? (
        <Boxes className="h-7 w-7 text-primary/30" />
      ) : (
        <ShoppingBag className="h-7 w-7 text-primary/30" />
      )}
    </div>
  );
}

function QuantityStepper({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-border/80 bg-background shadow-sm">
      <button
        type="button"
        onClick={onDecrease}
        aria-label="Decrease quantity"
        className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[2.5rem] px-2 text-center text-base font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label="Increase quantity"
        className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function CartItemCard({
  item,
  onRemove,
  onUpdateQuantity,
  packageItemCount,
  packageRetailValue,
  imageSrc,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
  packageItemCount?: number;
  packageRetailValue?: number;
  imageSrc?: string;
}) {
  const lineTotal = item.price * item.quantity;
  const isWholesale = Boolean(item.wholesale);
  const isPackage = isPackageCartItem(item);
  const savingsPerUnit = isWholesale
    ? item.wholesale!.basePrice - item.price
    : 0;
  const packageSavings =
    isPackage && packageRetailValue
      ? Math.max(0, packageRetailValue - item.price) * item.quantity
      : 0;
  const discountPercent = getWholesaleDiscountForItem(item);

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-sm',
        isWholesale
          ? 'border-primary/35 shadow-primary/10 ring-1 ring-primary/10'
          : 'border-border/60 shadow-primary/5'
      )}
    >
      {isPackage && (
        <div className="flex items-center gap-2 border-b border-accent/20 bg-accent/[0.07] px-4 py-2.5 sm:px-5">
          <Boxes className="h-4 w-4 shrink-0 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Package
          </span>
          {packageItemCount !== undefined && (
            <span className="ml-auto text-[11px] font-medium text-muted-foreground">
              Includes {packageItemCount} products
            </span>
          )}
        </div>
      )}

      {isWholesale && (
        <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/[0.07] px-4 py-2.5 sm:px-5">
          <Package className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Wholesale item
          </span>
          {discountPercent > 0 && (
            <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {discountPercent}% volume discount
            </span>
          )}
        </div>
      )}

      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
          <CartItemImage item={item} imageSrc={imageSrc} />
          {isWholesale && (
            <span className="absolute -left-1 -top-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
              B2B
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight sm:text-lg">
                {item.name}
              </h3>
              {isWholesale && (
                <p className="mt-1 text-xs font-medium text-primary">
                  Wholesale pricing · min. {item.wholesale!.minOrderQuantity} units
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-2">
                {item.size && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Size {item.size}
                  </span>
                )}
                {item.color && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {item.color}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ShareButton
                title={item.name}
                path={isPackage ? `/packages/${item.id}` : `/products/${item.id}`}
              />
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${item.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
            <div>
              {isWholesale ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Wholesale unit price
                  </p>
                  <p className="text-sm text-muted-foreground line-through">
                    {formatUGX(item.wholesale!.basePrice)} retail
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatUGX(item.price)} / unit
                  </p>
                </>
              ) : isPackage ? (
                <>
                  {packageRetailValue !== undefined && packageRetailValue > item.price && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatUGX(packageRetailValue)} retail value
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{formatUGX(item.price)} per package</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{formatUGX(item.price)} each</p>
              )}
              {packageSavings > 0 && (
                <p className="text-xs font-medium text-accent">
                  Save {formatUGX(packageSavings)} on this package
                </p>
              )}
              {savingsPerUnit > 0 && (
                <p className="text-xs font-medium text-accent">
                  Save {formatUGX(savingsPerUnit)} per unit
                </p>
              )}
              <p className="text-base font-semibold text-foreground sm:text-lg">
                {formatUGX(lineTotal)}
              </p>
            </div>
            {isWholesale ? (
              <BulkQuantityStepper
                quantity={item.quantity}
                min={item.wholesale!.minOrderQuantity}
                max={Math.min(
                  item.wholesale!.stock,
                  item.wholesale!.maxOrderQuantity ?? item.wholesale!.stock
                )}
                onChange={onUpdateQuantity}
              />
            ) : (
              <QuantityStepper
                quantity={item.quantity}
                onDecrease={() => onUpdateQuantity(item.quantity - 1)}
                onIncrease={() => onUpdateQuantity(item.quantity + 1)}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function OrderSummaryCard({
  total,
  itemCount,
  wholesaleSavings,
  className,
}: {
  total: number;
  itemCount: number;
  wholesaleSavings: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm shadow-primary/5',
        className
      )}
    >
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/[0.06] to-transparent px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-medium tracking-tight">Order summary</h2>
            <p className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · Free shipping
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 py-5 text-base sm:px-6">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-medium text-foreground">{formatUGX(total)}</span>
        </div>
        {wholesaleSavings > 0 && (
          <div className="flex justify-between text-accent">
            <span>Wholesale savings</span>
            <span className="font-medium">{formatUGX(wholesaleSavings)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span className="font-medium text-emerald-600">Free</span>
        </div>
      </div>

      <div className="mx-5 mb-5 rounded-2xl bg-primary px-5 py-4 text-primary-foreground sm:mx-6 sm:mb-6">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium opacity-90">Total</span>
          <span className="text-2xl font-semibold tracking-tight">{formatUGX(total)}</span>
        </div>
      </div>

      <div className="hidden space-y-3 px-5 pb-6 sm:block sm:px-6">
        <Link href="/checkout" className="block">
          <Button
            className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
            size="lg"
          >
            Proceed to checkout
          </Button>
        </Link>
        <Link href="/shop" className="block">
          <Button variant="outline" className="h-11 w-full rounded-xl">
            Continue shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

function CartItemsSection({
  title,
  description,
  icon: Icon,
  items,
  onRemove,
  onUpdateQuantity,
  getPackageMeta,
}: {
  title: string;
  description: string;
  icon: typeof Package;
  items: CartItem[];
  onRemove: (item: CartItem) => void;
  onUpdateQuantity: (item: CartItem, quantity: number) => void;
  getPackageMeta?: (item: CartItem) => {
    itemCount?: number;
    retailValue?: number;
    imageSrc?: string;
  };
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((item) => {
          const meta = getPackageMeta?.(item) ?? {};
          return (
            <CartItemCard
              key={cartItemKey(item)}
              item={item}
              onRemove={() => onRemove(item)}
              onUpdateQuantity={(quantity) => onUpdateQuantity(item, quantity)}
              packageItemCount={meta.itemCount}
              packageRetailValue={meta.retailValue}
              imageSrc={meta.imageSrc}
            />
          );
        })}
      </div>
    </section>
  );
}

function EmptyCart() {
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShoppingBag className="h-9 w-9" />
        </span>
        <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Discover our collections and add something you love.
        </p>
        <Link href="/shop" className="mt-8 inline-block">
          <Button className="h-12 gap-2 rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/20">
            <ArrowLeft className="h-4 w-4" />
            Browse the shop
          </Button>
        </Link>
      </div>
    </section>
  );
}

export function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart, itemCount } = useCart();
  const { getProductById, products } = useProducts();
  const { packages } = useWholesale();
  const retailPrices = useMemo(
    () => getRetailPricesMap(productsToCatalog(products)),
    [products]
  );
  const wholesaleSavings = getWholesaleSavings(items);
  const packageItems = useMemo(
    () => items.filter((item) => isPackageCartItem(item)),
    [items]
  );
  const wholesaleItems = useMemo(
    () => items.filter((item) => item.wholesale),
    [items]
  );
  const retailItems = useMemo(
    () => items.filter((item) => !item.wholesale && !isPackageCartItem(item)),
    [items]
  );

  const getPackageMeta = (item: CartItem) => {
    const pkg = packages.find((p) => p.id === item.id);
    if (!pkg) {
      return { imageSrc: item.image || undefined };
    }
    const { retailTotal } = resolvePackageSavings(pkg, retailPrices);
    return {
      itemCount: pkg.items.length,
      retailValue: retailTotal,
      imageSrc: item.image || getPackageImage(pkg, products),
    };
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <EmptyCart />
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="pb-36 sm:pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="border-b border-border/60 py-8 sm:py-10">
            <Link
              href="/shop"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </Link>
            <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Shopping cart</h1>
            <p className="mt-2 text-base text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} ready for checkout
              {wholesaleItems.length > 0 && retailItems.length > 0 && (
                <>
                  {' '}
                  · {wholesaleItems.length} wholesale, {retailItems.length} retail
                </>
              )}
              {wholesaleItems.length > 0 && retailItems.length === 0 && (
                <> · wholesale order</>
              )}
            </p>
          </div>

          <div className="grid gap-8 py-8 lg:grid-cols-[1fr_380px] lg:gap-10 lg:py-10">
            <div className="space-y-8">
              <CartItemsSection
                title="Packages"
                description="Curated bundles from /packages"
                icon={Boxes}
                items={packageItems}
                onRemove={(item) => removeItem(item.id, { wholesale: false })}
                onUpdateQuantity={(item, quantity) =>
                  updateQuantity(item.id, quantity, undefined, { wholesale: false })
                }
                getPackageMeta={getPackageMeta}
              />

              <CartItemsSection
                title="Wholesale items"
                description="Bulk order lines with volume-tier pricing from /wholesale"
                icon={Package}
                items={wholesaleItems}
                onRemove={(item) => removeItem(item.id, { wholesale: true })}
                onUpdateQuantity={(item, quantity) =>
                  updateQuantity(
                    item.id,
                    quantity,
                    getProductById(item.id) ?? undefined,
                    { wholesale: true }
                  )
                }
              />

              <CartItemsSection
                title="Retail items"
                description="Standard shop purchases"
                icon={Store}
                items={retailItems}
                onRemove={(item) => removeItem(item.id, { wholesale: false })}
                onUpdateQuantity={(item, quantity) =>
                  updateQuantity(
                    item.id,
                    quantity,
                    getProductById(item.id) ?? undefined,
                    { wholesale: false }
                  )
                }
              />

              <button
                type="button"
                onClick={() => {
                  if (confirm('Remove all items from your cart?')) clearCart();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Clear cart
              </button>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <OrderSummaryCard
                total={total}
                itemCount={itemCount}
                wholesaleSavings={wholesaleSavings}
              />
            </aside>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 py-4 backdrop-blur-md sm:hidden">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total · {itemCount} items</p>
            <p className="text-xl font-semibold tracking-tight text-primary">{formatUGX(total)}</p>
          </div>
          <p className="text-xs font-medium text-emerald-600">Free shipping</p>
        </div>
        <Link href="/checkout" className="block">
          <Button className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20">
            Proceed to checkout
          </Button>
        </Link>
      </div>

      <Footer />
    </main>
  );
}
