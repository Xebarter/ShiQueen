'use client';

import Link from 'next/link';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/lib/cart-context';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

function cartLineKey(item: CartItem): string {
  return [item.id, item.size, item.color, item.wholesale ? 'wholesale' : 'retail']
    .filter(Boolean)
    .join('-');
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
  return (
    <div
      id={id}
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
              {items.length} {items.length === 1 ? 'item' : 'items'} · {totalUnits} units
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          Add products to build your order.
        </p>
      ) : (
        <>
          <div className="max-h-48 space-y-2 overflow-y-auto px-5 py-4 sm:px-6">
            {items.map((item) => (
              <div
                key={cartLineKey(item)}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.name}
                  {item.wholesale && (
                    <span className="ml-1 text-[10px] font-semibold uppercase text-primary">
                      (wholesale)
                    </span>
                  )}{' '}
                  <span className="text-foreground">× {item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatUGX(item.quantity * item.price)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-border/50 px-5 py-4 text-base sm:px-6">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">{formatUGX(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-medium text-emerald-600">Free</span>
            </div>
            {totalSavings > 0 && (
              <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Wholesale savings
                </p>
                <p className="text-lg font-bold text-accent">{formatUGX(totalSavings)}</p>
              </div>
            )}
          </div>

          <div className="mx-5 mb-4 rounded-2xl bg-primary px-5 py-4 text-primary-foreground sm:mx-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium opacity-90">Total</span>
              <span className="text-2xl font-semibold tracking-tight">{formatUGX(subtotal)}</span>
            </div>
          </div>

          <div className="space-y-2 px-5 pb-6 sm:px-6">
            <Button
              className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
              size="lg"
              disabled={items.length === 0 || checkoutLoading}
              onClick={onCheckout}
            >
              {checkoutLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Proceed to checkout
            </Button>
            <Link href="/cart" className="block">
              <Button variant="outline" className="h-11 w-full rounded-xl">
                View full cart
              </Button>
            </Link>
            <Link href="/wholesale/bundles" className="block">
              <Button variant="outline" className="h-11 w-full rounded-xl">
                View bundle deals
              </Button>
            </Link>
            <button
              type="button"
              onClick={onClear}
              className="flex w-full items-center justify-center gap-2 py-2 text-sm text-muted-foreground transition hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Clear cart
            </button>
          </div>
        </>
      )}
    </div>
  );
}
