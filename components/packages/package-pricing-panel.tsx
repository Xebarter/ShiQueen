'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package } from '@/lib/types/wholesale';
import {
  formatUGX,
  calculateTax,
  calculateTotalWithTax,
} from '@/lib/wholesale-data';
import { resolvePackageSavings } from '@/lib/package-utils';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackagePricingPanelProps {
  pkg: Package;
  retailPrices: Record<string, number>;
  onAddToCart: (quantity: number) => void;
  quantity?: number;
  onQuantityChange?: (quantity: number) => void;
  showPrimaryAction?: boolean;
  className?: string;
}

export function PackagePricingPanel({
  pkg,
  retailPrices,
  onAddToCart,
  quantity: controlledQuantity,
  onQuantityChange,
  showPrimaryAction = true,
  className,
}: PackagePricingPanelProps) {
  const [internalQuantity, setInternalQuantity] = useState(1);
  const quantity = controlledQuantity ?? internalQuantity;
  const setQuantity = onQuantityChange ?? setInternalQuantity;

  const { retailTotal, packagePrice, savingsAmount, savingsPercentage } =
    resolvePackageSavings(pkg, retailPrices);

  const subtotal = packagePrice * quantity;
  const totalSavings = savingsAmount * quantity;
  const tax = calculateTax(subtotal);
  const total = calculateTotalWithTax(subtotal);

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-6 lg:sticky lg:top-4 lg:p-8',
        className
      )}
    >
      <div className="mb-6 space-y-3 border-b border-border pb-6 sm:mb-8 sm:space-y-4 sm:pb-8">
        {savingsAmount > 0 && (
          <div className="flex items-baseline justify-between gap-3 text-sm sm:text-base">
            <span className="text-muted-foreground">Retail value (per package)</span>
            <span className="shrink-0 text-base tabular-nums line-through sm:text-lg">
              {formatUGX(retailTotal)}
            </span>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground sm:text-base">Package price</span>
          <span className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
            {formatUGX(packagePrice)}
          </span>
        </div>
        {savingsAmount > 0 && (
          <div className="rounded-lg bg-accent/20 p-3 text-center sm:p-4">
            <p className="mb-1 text-xs text-muted-foreground sm:text-sm">Your savings per package</p>
            <p className="text-xl font-bold tabular-nums text-accent sm:text-2xl">
              {formatUGX(savingsAmount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {savingsPercentage.toFixed(1)}% off
            </p>
          </div>
        )}
      </div>

      <div className="mb-6 border-b border-border pb-6 sm:mb-8 sm:pb-8">
        <label className="mb-3 block text-sm font-semibold">Quantity</label>
        <div className="inline-flex items-center rounded-lg border border-border bg-background">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-11 w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] px-2 text-center text-base font-semibold tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="flex h-11 w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-3 rounded-lg bg-secondary/50 p-3 sm:mb-8 sm:p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatUGX(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (18%)</span>
          <span className="tabular-nums">{formatUGX(tax)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatUGX(total)}</span>
        </div>
      </div>

      {totalSavings > 0 && (
        <div className="mb-6 rounded-lg border border-accent bg-accent/10 p-3 text-center sm:mb-8 sm:p-4">
          <p className="mb-1 text-xs text-muted-foreground sm:text-sm">Total savings</p>
          <p className="text-lg font-bold tabular-nums text-accent sm:text-xl">
            {formatUGX(totalSavings)}
          </p>
        </div>
      )}

      {showPrimaryAction && (
        <>
          <Button
            onClick={() => onAddToCart(quantity)}
            className="mb-3 hidden min-h-11 w-full text-base sm:inline-flex sm:py-6 sm:text-lg"
          >
            Add to Cart
          </Button>
          <Link href="/shop" className="hidden sm:block">
            <Button variant="outline" className="min-h-11 w-full">
              Shop Individual Items
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
