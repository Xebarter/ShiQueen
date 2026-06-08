'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Loader2,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isRemoteProductImage } from '@/components/product-image';
import { CartItem } from '@/lib/cart-context';
import { getWholesaleDiscountForItem } from '@/lib/wholesale-cart';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

function cartLineKey(item: CartItem): string {
  return [item.id, item.size, item.color, item.wholesale ? 'wholesale' : 'retail']
    .filter(Boolean)
    .join('-');
}

function SummaryItemThumb({ item }: { item: CartItem }) {
  if (isRemoteProductImage(item.image)) {
    return (
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted sm:h-16 sm:w-16">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 via-muted to-accent/10 sm:h-16 sm:w-16">
      <ShoppingBag className="h-5 w-5 text-primary/35 sm:h-6 sm:w-6" />
    </div>
  );
}

function SummaryLineItem({ item }: { item: CartItem }) {
  const lineTotal = item.quantity * item.price;
  const isWholesale = Boolean(item.wholesale);
  const discountPercent = getWholesaleDiscountForItem(item);

  return (
    <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 sm:gap-3.5 sm:p-3.5">
      <SummaryItemThumb item={item} />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight sm:text-[0.9375rem]">
              {item.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {isWholesale && (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Wholesale
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-[11px] font-medium text-accent">
                  {discountPercent}% off
                </span>
              )}
            </div>
          </div>
          <p className="shrink-0 text-sm font-bold tabular-nums sm:text-base">
            {formatUGX(lineTotal)}
          </p>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-[13px]">
          {formatUGX(item.price)} / unit ·{' '}
          <span className="font-medium text-foreground">{item.quantity} units</span>
        </p>
      </div>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

type BulkOrderSummaryProps = {
  items: CartItem[];
  subtotal: number;
  totalSavings: number;
  totalUnits: number;
  onCheckout: () => void;
  onClear: () => void;
  checkoutLoading?: boolean;
  id?: string;
  className?: string;
};

export function BulkOrderSummary({
  items,
  subtotal,
  totalSavings,
  totalUnits,
  onCheckout,
  onClear,
  checkoutLoading,
  id,
  className,
}: BulkOrderSummaryProps) {
  const hasItems = items.length > 0;

  return (
    <div
      id={id}
      className={cn(
        'rounded-2xl border border-border/60 bg-card shadow-sm shadow-primary/5',
        className
      )}
    >
      <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent px-4 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/10">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Order summary</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Review your wholesale order before checkout
            </p>
          </div>
        </div>

        {hasItems && (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <SummaryStat icon={Package} label="Line items" value={String(items.length)} />
            <SummaryStat icon={ShoppingBag} label="Total units" value={String(totalUnits)} />
          </div>
        )}
      </div>

      {!hasItems ? (
        <div className="px-4 py-12 text-center sm:px-6 sm:py-14">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <p className="text-base font-medium">Your order is empty</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Add wholesale products from the catalog to build your order.
          </p>
        </div>
      ) : (
        <>
          <div className="border-b border-border/40 px-4 py-4 sm:px-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Items in order
            </p>
            <div className="space-y-2.5">
              {items.map((item) => (
                <SummaryLineItem key={cartLineKey(item)} item={item} />
              ))}
            </div>
          </div>

          <div className="space-y-2.5 px-4 py-4 text-sm sm:px-6 sm:py-5 sm:text-base">
            <div className="flex items-center justify-between gap-3 text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatUGX(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4 shrink-0 text-emerald-600" />
                Shipping
              </span>
              <span className="font-semibold text-emerald-600">Free</span>
            </div>
            {totalSavings > 0 && (
              <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/15 via-accent/10 to-transparent px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Wholesale savings
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Volume tier pricing applied
                    </p>
                  </div>
                  <p className="text-lg font-bold tabular-nums text-accent sm:text-xl">
                    {formatUGX(totalSavings)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mx-4 mb-4 rounded-2xl bg-primary px-4 py-4 text-primary-foreground shadow-lg shadow-primary/20 sm:mx-6 sm:px-5 sm:py-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest opacity-80">
                  Order total
                </p>
                <p className="mt-1 text-sm opacity-90">
                  {totalUnits} units · {items.length} {items.length === 1 ? 'line' : 'lines'}
                </p>
              </div>
              <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                {formatUGX(subtotal)}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 px-4 pb-5 sm:px-6 sm:pb-6">
            <Button
              className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
              size="lg"
              disabled={checkoutLoading}
              onClick={onCheckout}
            >
              {checkoutLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-5 w-5" />
              )}
              Proceed to checkout
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Link href="/cart" className="block">
                <Button variant="outline" className="h-11 w-full rounded-xl text-sm font-medium">
                  View full cart
                </Button>
              </Link>
              <Link href="/packages" className="block">
                <Button variant="outline" className="h-11 w-full rounded-xl text-sm font-medium">
                  Bundle deals
                </Button>
              </Link>
            </div>

            <button
              type="button"
              onClick={onClear}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-600 active:scale-[0.99]"
            >
              <Trash2 className="h-4 w-4" />
              Clear cart
            </button>

            <div className="flex items-center justify-center gap-2 pt-1 text-center text-[11px] text-muted-foreground sm:text-xs">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>Secure checkout · Free shipping on wholesale orders</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
