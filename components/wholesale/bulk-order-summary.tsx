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
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
        <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted">
      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function SummaryLineItem({ item }: { item: CartItem }) {
  const lineTotal = item.quantity * item.price;
  const discountPercent = getWholesaleDiscountForItem(item);

  return (
    <div className="flex gap-3 py-3">
      <SummaryItemThumb item={item} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
          <p className="shrink-0 text-sm font-semibold tabular-nums">{formatUGX(lineTotal)}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatUGX(item.price)} × {item.quantity}
          {discountPercent > 0 ? (
            <span className="text-primary"> · −{discountPercent}%</span>
          ) : null}
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
    <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
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
        'overflow-hidden rounded-xl border border-border/70 bg-card',
        className
      )}
    >
      <div className="border-b border-border/60 px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold tracking-tight">Order summary</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Wholesale checkout</p>
        {hasItems ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SummaryStat icon={Package} label="Lines" value={String(items.length)} />
            <SummaryStat icon={ShoppingBag} label="Units" value={String(totalUnits)} />
          </div>
        ) : null}
      </div>

      {!hasItems ? (
        <div className="px-4 py-12 text-center sm:px-5">
          <p className="text-sm font-medium">No items yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add products from the catalog to build your order.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-72 divide-y divide-border/50 overflow-y-auto px-4 sm:px-5">
            {items.map((item) => (
              <SummaryLineItem key={cartLineKey(item)} item={item} />
            ))}
          </div>

          <div className="space-y-2 border-t border-border/60 px-4 py-4 text-sm sm:px-5">
            <div className="flex justify-between gap-3 text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatUGX(subtotal)}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                Shipping
              </span>
              <span className="font-medium text-emerald-700">Free</span>
            </div>
            {totalSavings > 0 ? (
              <div className="flex justify-between gap-3 rounded-lg bg-primary/5 px-3 py-2.5">
                <span className="text-xs font-medium text-primary">Wholesale savings</span>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {formatUGX(totalSavings)}
                </span>
              </div>
            ) : null}
            <div className="flex items-end justify-between gap-3 border-t border-border/60 pt-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalUnits} units · {items.length} lines
                </p>
              </div>
              <p className="text-xl font-semibold tabular-nums tracking-tight">
                {formatUGX(subtotal)}
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-border/60 px-4 py-4 sm:px-5">
            <Button
              className="h-11 w-full rounded-lg text-sm font-semibold"
              disabled={checkoutLoading}
              onClick={onCheckout}
            >
              {checkoutLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Proceed to checkout
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/cart" className="block">
                <Button variant="outline" className="h-10 w-full rounded-lg text-xs font-medium">
                  Full cart
                </Button>
              </Link>
              <Link href="/packages" className="block">
                <Button variant="outline" className="h-10 w-full rounded-lg text-xs font-medium">
                  Packages
                </Button>
              </Link>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground transition hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear order
            </button>
            <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Secure checkout · Free shipping
            </p>
          </div>
        </>
      )}
    </div>
  );
}
