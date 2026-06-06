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
          <div key={idx} className="flex justify-between items-center text-sm p-2 rounded hover:bg-secondary/50 transition">
            <span className="text-muted-foreground">
              {tier.minQuantity} - {maxLabel} units
            </span>
            <div className="flex items-center gap-3">
              <span className="text-right min-w-[140px]">
                USh {tier.pricePerUnit.toLocaleString('en-UG', { maximumFractionDigits: 0 })}
              </span>
              {discount > 0 && (
                <span className="text-accent font-semibold text-xs whitespace-nowrap">
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
