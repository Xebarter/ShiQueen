import type { Product } from '@/lib/types/database';

const RETAIL_FACTOR = 1.065;
const RETAIL_ROUND_TO = 100;

/** Public catalog unit price from the stored supplier list price. */
export function toRetailPrice(listPrice: number): number {
  if (!Number.isFinite(listPrice) || listPrice <= 0) return 0;
  return Math.round((listPrice * RETAIL_FACTOR) / RETAIL_ROUND_TO) * RETAIL_ROUND_TO;
}

/** Shallow product copy with public `price` / `originalPrice` for storefront use. */
export function withRetailPricing<T extends Pick<Product, 'price' | 'originalPrice'>>(
  product: T
): T {
  return {
    ...product,
    price: toRetailPrice(product.price),
    originalPrice:
      product.originalPrice != null && product.originalPrice > 0
        ? toRetailPrice(product.originalPrice)
        : product.originalPrice,
  };
}
