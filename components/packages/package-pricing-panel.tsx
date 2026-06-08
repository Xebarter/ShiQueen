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

interface PackagePricingPanelProps {
  pkg: Package;
  retailPrices: Record<string, number>;
  onAddToCart: (quantity: number) => void;
}

export function PackagePricingPanel({
  pkg,
  retailPrices,
  onAddToCart,
}: PackagePricingPanelProps) {
  const [quantity, setQuantity] = useState(1);
  const { retailTotal, packagePrice, savingsAmount, savingsPercentage } =
    resolvePackageSavings(pkg, retailPrices);

  const subtotal = packagePrice * quantity;
  const totalRetailValue = retailTotal * quantity;
  const totalSavings = savingsAmount * quantity;
  const tax = calculateTax(subtotal);
  const total = calculateTotalWithTax(subtotal);

  return (
    <div className="bg-card border border-border rounded-lg p-8 sticky top-4">
      <div className="space-y-4 mb-8 pb-8 border-b border-border">
        {savingsAmount > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground">Retail value (per package)</span>
            <span className="line-through text-lg tabular-nums">{formatUGX(retailTotal)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">Package price</span>
          <span className="text-3xl font-bold text-primary tabular-nums">
            {formatUGX(packagePrice)}
          </span>
        </div>
        {savingsAmount > 0 && (
          <div className="bg-accent/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Your savings per package</p>
            <p className="text-2xl font-bold text-accent tabular-nums">
              {formatUGX(savingsAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {savingsPercentage.toFixed(1)}% off
            </p>
          </div>
        )}
      </div>

      <div className="mb-8 pb-8 border-b border-border">
        <label className="block text-sm font-semibold mb-3">Quantity</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-2 hover:bg-secondary rounded border border-border"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="flex-1 text-center border border-border rounded px-3 py-2 font-semibold text-lg"
            min={1}
          />
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="p-2 hover:bg-secondary rounded border border-border"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-8 p-4 bg-secondary/50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatUGX(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (18%)</span>
          <span className="tabular-nums">{formatUGX(tax)}</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatUGX(total)}</span>
        </div>
      </div>

      {totalSavings > 0 && (
        <div className="mb-8 p-4 bg-accent/10 rounded-lg border border-accent text-center">
          <p className="text-sm text-muted-foreground mb-1">Total savings</p>
          <p className="text-xl font-bold text-accent tabular-nums">{formatUGX(totalSavings)}</p>
        </div>
      )}

      <Button onClick={() => onAddToCart(quantity)} className="w-full mb-3 py-6 text-lg">
        Add to Cart
      </Button>
      <Link href="/shop">
        <Button variant="outline" className="w-full">
          Shop Individual Items
        </Button>
      </Link>
    </div>
  );
}
