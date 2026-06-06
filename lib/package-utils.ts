import { Package, PackageItem, PricingTier } from '@/lib/types/wholesale';

/**
 * Calculate the effective price for a given quantity based on pricing tiers
 */
export function calculateTieredPrice(
  basePrice: number,
  quantity: number,
  tiers: PricingTier[]
): { unitPrice: number; totalPrice: number; discount: number } {
  // Find the applicable tier
  const applicableTier = tiers.find(
    (tier) =>
      quantity >= tier.minQuantity &&
      (tier.maxQuantity === null || quantity <= tier.maxQuantity)
  );

  if (!applicableTier) {
    // If no tier applies, use retail price
    return {
      unitPrice: basePrice,
      totalPrice: basePrice * quantity,
      discount: 0,
    };
  }

  const unitPrice = applicableTier.pricePerUnit;
  const totalPrice = unitPrice * quantity;
  const discount = basePrice - unitPrice;

  return {
    unitPrice,
    totalPrice,
    discount,
  };
}

/**
 * Calculate savings from a package deal
 */
export function calculatePackageSavings(
  items: PackageItem[],
  retailPrices: Record<string, number>
): {
  retailTotal: number;
  packagePrice: number;
  savingsAmount: number;
  savingsPercentage: number;
} {
  const retailTotal = items.reduce((sum, item) => {
    return sum + (retailPrices[item.productId] || 0) * item.quantity;
  }, 0);

  const packagePrice = items.reduce((sum, item) => {
    return sum + (item.price || retailPrices[item.productId] || 0) * item.quantity;
  }, 0);

  const savingsAmount = retailTotal - packagePrice;
  const savingsPercentage = retailTotal > 0 ? (savingsAmount / retailTotal) * 100 : 0;

  return {
    retailTotal,
    packagePrice,
    savingsAmount,
    savingsPercentage,
  };
}

/**
 * Format a large quantity number for display (e.g., 1000 -> "1K")
 */
export function formatQuantity(quantity: number): string {
  if (quantity >= 1000000) {
    return `${(quantity / 1000000).toFixed(1)}M`;
  }
  if (quantity >= 1000) {
    return `${(quantity / 1000).toFixed(1)}K`;
  }
  return quantity.toString();
}

/**
 * Validate if a quantity meets wholesale requirements
 */
export function validateWholesaleQuantity(
  quantity: number,
  minOrderQuantity: number,
  maxOrderQuantity: number | null
): { valid: boolean; error?: string } {
  if (quantity < minOrderQuantity) {
    return {
      valid: false,
      error: `Minimum order quantity is ${minOrderQuantity} units`,
    };
  }

  if (maxOrderQuantity && quantity > maxOrderQuantity) {
    return {
      valid: false,
      error: `Maximum order quantity is ${maxOrderQuantity} units`,
    };
  }

  return { valid: true };
}
