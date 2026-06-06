import { PricingTier } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { calculateTieredPrice } from '@/lib/package-utils';
import { SEED_PRODUCTS } from '@/lib/firebase/seed-data';

export const WHOLESALE_TAX_RATE = 0.18;

export interface WholesaleCatalogProduct {
  id: string;
  name: string;
  basePrice: number;
  category: string;
  isWholesaleEnabled: boolean;
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
}

export function productToCatalog(
  product: Pick<
    Product,
    | 'id'
    | 'name'
    | 'price'
    | 'category'
    | 'isWholesaleEnabled'
    | 'minOrderQuantity'
    | 'maxOrderQuantity'
  >
): WholesaleCatalogProduct {
  return {
    id: product.id,
    name: product.name,
    basePrice: product.price,
    category: product.category,
    isWholesaleEnabled: product.isWholesaleEnabled,
    minOrderQuantity: product.minOrderQuantity,
    maxOrderQuantity: product.maxOrderQuantity,
  };
}

export function productsToCatalog(products: Product[]): WholesaleCatalogProduct[] {
  return products.filter((p) => p.isWholesaleEnabled).map(productToCatalog);
}

/** @deprecated Use products from ProductsProvider */
export const WHOLESALE_CATALOG: WholesaleCatalogProduct[] = SEED_PRODUCTS.map(productToCatalog);

export const VOLUME_TIER_LABELS = [
  { label: '1-9 units', discount: 'Retail', discountPercent: 0 },
  { label: '10-49 units', discount: '12%', discountPercent: 12 },
  { label: '50-99 units', discount: '18%', discountPercent: 18 },
  { label: '100+ units', discount: '25%', discountPercent: 25 },
];

export function createDefaultPricingTiers(basePrice: number): PricingTier[] {
  return [
    { minQuantity: 1, maxQuantity: 9, pricePerUnit: basePrice, discount: 0 },
    { minQuantity: 10, maxQuantity: 49, pricePerUnit: Math.round(basePrice * 0.88), discount: 12 },
    { minQuantity: 50, maxQuantity: 99, pricePerUnit: Math.round(basePrice * 0.82), discount: 18 },
    { minQuantity: 100, maxQuantity: null, pricePerUnit: Math.round(basePrice * 0.75), discount: 25 },
  ];
}

export function getProductById(
  id: string,
  catalog: WholesaleCatalogProduct[] = WHOLESALE_CATALOG
): WholesaleCatalogProduct | undefined {
  return catalog.find((p) => p.id === id);
}

export function getProductNameMap(
  catalog: WholesaleCatalogProduct[] = WHOLESALE_CATALOG
): Record<string, string> {
  return catalog.reduce(
    (map, product) => {
      map[product.id] = product.name;
      return map;
    },
    {} as Record<string, string>
  );
}

export function getRetailPricesMap(
  catalog: WholesaleCatalogProduct[] = WHOLESALE_CATALOG
): Record<string, number> {
  return catalog.reduce(
    (map, product) => {
      map[product.id] = product.basePrice;
      return map;
    },
    {} as Record<string, number>
  );
}

export function getTieredPrice(basePrice: number, quantity: number) {
  return calculateTieredPrice(basePrice, quantity, createDefaultPricingTiers(basePrice));
}

export function formatUGX(amount: number): string {
  return `USh ${amount.toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
}

export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * WHOLESALE_TAX_RATE);
}

export function calculateTotalWithTax(subtotal: number): number {
  return subtotal + calculateTax(subtotal);
}
