import { Product } from '@/lib/types/database';
import { getProductWholesaleUnitPrice, getTieredPrice } from '@/lib/wholesale-data';
import { filterByCategory } from '@/lib/hooks/use-product-merchandising';

export type WholesaleSortOption =
  | 'newest'
  | 'popular'
  | 'price-low'
  | 'price-high'
  | 'discount'
  | 'stock';

export function getWholesaleCatalogProducts(products: Product[]): Product[] {
  return products.filter((p) => p.isWholesaleEnabled);
}

export function getWholesaleDiscountPercent(basePrice: number, quantity: number): number {
  const tiers = createDefaultPricingTiers(basePrice);
  const applicable = tiers.find(
    (tier) =>
      quantity >= tier.minQuantity &&
      (tier.maxQuantity === null || quantity <= tier.maxQuantity)
  );
  return applicable?.discount ?? 0;
}

export function getMaxWholesaleDiscountPercent(basePrice: number): number {
  const tiers = createDefaultPricingTiers(basePrice);
  return Math.max(...tiers.map((t) => t.discount), 0);
}

export function getWholesaleUnitPrice(product: Product, quantity: number): number {
  return getProductWholesaleUnitPrice(product, quantity);
}

export function sortWholesaleProducts(products: Product[], sortBy: WholesaleSortOption): Product[] {
  return [...products].sort((a, b) => {
    if (sortBy === 'price-low') {
      return (
        getWholesaleUnitPrice(a, a.minOrderQuantity) - getWholesaleUnitPrice(b, b.minOrderQuantity)
      );
    }
    if (sortBy === 'price-high') {
      return (
        getWholesaleUnitPrice(b, b.minOrderQuantity) - getWholesaleUnitPrice(a, a.minOrderQuantity)
      );
    }
    if (sortBy === 'popular') return b.reviews - a.reviews;
    if (sortBy === 'stock') return b.stock - a.stock;
    if (sortBy === 'discount') {
      return getMaxWholesaleDiscountPercent(b.price) - getMaxWholesaleDiscountPercent(a.price);
    }
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export function filterWholesaleByCategory(products: Product[], category: string): Product[] {
  return filterByCategory(products, category);
}

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export function getStockStatus(product: Product): StockStatus {
  if (product.stock <= 0 || product.status === 'Out of Stock') return 'out-of-stock';
  if (product.status === 'Low Stock' || product.stock <= 10) return 'low-stock';
  return 'in-stock';
}

export const WHOLESALE_CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'home', label: 'Home' },
] as const;

export const WHOLESALE_SORT_OPTIONS: { value: WholesaleSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Best Discount' },
  { value: 'stock', label: 'Stock Availability' },
];
