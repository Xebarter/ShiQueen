import type { Product } from '@/lib/types/database';

export type ProductSalesChannel = 'both' | 'retail' | 'wholesale';

type ProductChannelFields = Pick<Product, 'isRetailEnabled' | 'isWholesaleEnabled'>;

export function isRetailCatalogProduct(product: Pick<Product, 'isRetailEnabled'>): boolean {
  return product.isRetailEnabled !== false;
}

export function isWholesaleCatalogProduct(product: Pick<Product, 'isWholesaleEnabled'>): boolean {
  return Boolean(product.isWholesaleEnabled);
}

export function isWholesaleOnlyProduct(product: ProductChannelFields): boolean {
  return isWholesaleCatalogProduct(product) && !isRetailCatalogProduct(product);
}

export function getProductSalesChannel(product: ProductChannelFields): ProductSalesChannel {
  const retail = isRetailCatalogProduct(product);
  const wholesale = isWholesaleCatalogProduct(product);
  if (retail && wholesale) return 'both';
  if (wholesale) return 'wholesale';
  return 'retail';
}

export function salesChannelToFlags(channel: ProductSalesChannel): ProductChannelFields {
  return {
    isRetailEnabled: channel !== 'wholesale',
    isWholesaleEnabled: channel !== 'retail',
  };
}

export function productSalesChannelLabel(channel: ProductSalesChannel): string {
  if (channel === 'wholesale') return 'Wholesale only';
  if (channel === 'retail') return 'Shop only';
  return 'Shop & wholesale';
}
