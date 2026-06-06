import { PricingTier } from '@/lib/types/wholesale';

interface PricingTiersProps {
  tiers: PricingTier[];
  basePrice: number;
}

export function PricingTiers({ tiers, basePrice }: PricingTiersProps) {
  return (
    <div className="space-y-2">
      {tiers.map((tier, idx) => {
        const discount = tier.discount;
        const discountedPrice = basePrice - (basePrice * discount) / 100;
        const maxLabel = tier.maxQuantity ? `${tier.maxQuantity}` : '+';
        
        return (
          <div
            key={idx}
            className="flex flex-col gap-1 rounded-lg p-2 text-sm transition hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-muted-foreground">
              {tier.minQuantity} – {maxLabel} units
            </span>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="font-medium tabular-nums sm:min-w-[120px] sm:text-right">
                USh {tier.pricePerUnit.toLocaleString('en-UG', { maximumFractionDigits: 0 })}
              </span>
              {discount > 0 && (
                <span className="text-xs font-semibold whitespace-nowrap text-accent">
                  -{discount.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
