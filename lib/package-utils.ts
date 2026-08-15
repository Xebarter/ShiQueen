import type { CartItem } from '@/lib/cart-context';
import type { OrderItem, Product } from '@/lib/types/database';
import type { ServiceListing, ServiceProvider } from '@/lib/types/services';
import {
  Package,
  PackageItem,
  PackageItemKind,
  PricingTier,
} from '@/lib/types/wholesale';
import { resolveListingImage } from '@/lib/services-utils';

export function getPackageItemKind(item: PackageItem): PackageItemKind {
  if (item.isCustom === true || item.itemType === 'custom') return 'custom';
  if (item.itemType === 'service' || Boolean(item.serviceId)) return 'service';
  return 'product';
}

export function isCustomPackageItem(item: PackageItem): boolean {
  return getPackageItemKind(item) === 'custom';
}

export function isServicePackageItem(item: PackageItem): boolean {
  return getPackageItemKind(item) === 'service';
}

export function getPackageItemRefId(item: PackageItem): string {
  if (isServicePackageItem(item)) {
    return item.serviceId || item.productId;
  }
  return item.productId;
}

export function createCustomPackageItemId(): string {
  return `pkgitem-${crypto.randomUUID()}`;
}

export function getPackageItemName(
  item: PackageItem,
  catalogNames: Record<string, string>
): string {
  if (isCustomPackageItem(item)) {
    return item.customName?.trim() || 'Custom item';
  }
  const refId = getPackageItemRefId(item);
  return catalogNames[refId] ?? (isServicePackageItem(item) ? 'Service' : 'Product');
}

export function getPackageItemRetailUnit(
  item: PackageItem,
  catalogPrices: Record<string, number>
): number {
  if (isCustomPackageItem(item)) {
    return item.customRetailPrice ?? 0;
  }
  return catalogPrices[getPackageItemRefId(item)] ?? 0;
}

export function getPackageItemImage(
  item: PackageItem,
  products: Product[],
  services: ServiceListing[] = [],
  providers: ServiceProvider[] = []
): string | undefined {
  if (isCustomPackageItem(item)) {
    return item.customImage;
  }
  if (isServicePackageItem(item)) {
    const service = services.find((s) => s.id === getPackageItemRefId(item));
    if (!service) return undefined;
    const provider = providers.find((p) => p.id === service.providerId);
    return resolveListingImage(service, provider) ?? undefined;
  }
  return products.find((p) => p.id === item.productId)?.image;
}

export function buildPackageCatalogMaps(
  products: Product[],
  services: ServiceListing[] = [],
  packages: Package[] = []
): { productNames: Record<string, string>; retailPrices: Record<string, number> } {
  const names: Record<string, string> = {};
  const prices: Record<string, number> = {};

  for (const product of products) {
    names[product.id] = product.name;
    prices[product.id] = product.price;
  }
  for (const service of services) {
    names[service.id] = service.name;
    prices[service.id] = service.basePrice;
  }

  return mergePackageItemMaps(packages, names, prices);
}

export function mergePackageItemMaps(
  packages: Package[],
  catalogNames: Record<string, string>,
  catalogPrices: Record<string, number>
): { productNames: Record<string, string>; retailPrices: Record<string, number> } {
  const productNames = { ...catalogNames };
  const retailPrices = { ...catalogPrices };

  for (const pkg of packages) {
    for (const item of pkg.items) {
      if (!isCustomPackageItem(item)) continue;
      const refId = getPackageItemRefId(item);
      productNames[refId] = item.customName?.trim() || 'Custom item';
      retailPrices[refId] = item.customRetailPrice ?? 0;
    }
  }

  return { productNames, retailPrices };
}

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
    return sum + getPackageItemRetailUnit(item, retailPrices) * item.quantity;
  }, 0);

  const packagePrice = items.reduce((sum, item) => {
    const unitPrice = item.price ?? getPackageItemRetailUnit(item, retailPrices);
    return sum + unitPrice * item.quantity;
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

export function computePackageRetailTotal(
  items: PackageItem[],
  retailPrices: Record<string, number>
): number {
  return items.reduce((sum, item) => {
    return sum + getPackageItemRetailUnit(item, retailPrices) * item.quantity;
  }, 0);
}

export function computePackageItemTotal(
  items: PackageItem[],
  retailPrices: Record<string, number>
): number {
  return items.reduce((sum, item) => {
    const unitPrice = item.price ?? getPackageItemRetailUnit(item, retailPrices);
    return sum + unitPrice * item.quantity;
  }, 0);
}

export function resolvePackagePrice(
  pkg: Package,
  retailPrices: Record<string, number>
): number {
  if (pkg.pricingMode === 'auto') {
    return computePackageItemTotal(pkg.items, retailPrices);
  }
  return pkg.discountedPrice;
}

export function resolvePackageRetailValue(
  pkg: Package,
  retailPrices: Record<string, number>
): number {
  return computePackageRetailTotal(pkg.items, retailPrices);
}

export function resolvePackageSavings(
  pkg: Package,
  retailPrices: Record<string, number>
): { retailTotal: number; packagePrice: number; savingsAmount: number; savingsPercentage: number } {
  const retailTotal = resolvePackageRetailValue(pkg, retailPrices);
  const packagePrice = resolvePackagePrice(pkg, retailPrices);
  const savingsAmount = Math.max(0, retailTotal - packagePrice);
  const savingsPercentage = retailTotal > 0 ? (savingsAmount / retailTotal) * 100 : 0;

  return { retailTotal, packagePrice, savingsAmount, savingsPercentage };
}

export function resolvePackageCoverMode(pkg: Package): 'upload' | 'products' {
  if (pkg.coverMode) return pkg.coverMode;
  if (pkg.image) return 'upload';
  if (pkg.coverProductIds && pkg.coverProductIds.length > 0) return 'products';
  return 'products';
}

export function getUniquePackageProductIds(items: PackageItem[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of items) {
    const refId = getPackageItemRefId(item);
    if (!seen.has(refId)) {
      seen.add(refId);
      ids.push(refId);
    }
  }
  return ids;
}

/** Up to 4 catalog IDs for a collage — explicit picks first, then fills from package items. */
export function resolveCoverProductIds(
  pkg: Pick<Package, 'items' | 'coverProductIds' | 'coverMode'>
): string[] {
  const fromItems = getUniquePackageProductIds(pkg.items);
  const limit = Math.min(4, fromItems.length);

  if (pkg.coverMode === 'upload') return [];

  const explicit = (pkg.coverProductIds ?? []).filter((id) => fromItems.includes(id));
  const merged: string[] = [];

  for (const id of explicit) {
    if (merged.length >= limit) break;
    if (!merged.includes(id)) merged.push(id);
  }

  for (const id of fromItems) {
    if (merged.length >= limit) break;
    if (!merged.includes(id)) merged.push(id);
  }

  return merged.slice(0, 4);
}

export function getPackageCoverImages(
  pkg: Package,
  products: Product[],
  services: ServiceListing[] = [],
  providers: ServiceProvider[] = []
): string[] {
  const mode = resolvePackageCoverMode(pkg);

  if (mode === 'upload' && pkg.image) {
    return [pkg.image];
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const providerById = new Map(providers.map((p) => [p.id, p]));
  const itemByRefId = new Map(
    pkg.items.map((item) => [getPackageItemRefId(item), item])
  );
  const priorityIds = resolveCoverProductIds(pkg);
  const allItemIds = getUniquePackageProductIds(pkg.items);
  const idQueue = [...priorityIds];
  for (const id of allItemIds) {
    if (!idQueue.includes(id)) idQueue.push(id);
  }

  const images: string[] = [];
  for (const refId of idQueue) {
    if (images.length >= 4) break;
    const item = itemByRefId.get(refId);
    const image = item
      ? getPackageItemImage(item, products, services, providers)
      : productMap.get(refId)?.image ||
        (() => {
          const service = serviceMap.get(refId);
          return service
            ? resolveListingImage(service, providerById.get(service.providerId)) ?? undefined
            : undefined;
        })();
    if (image) images.push(image);
  }

  if (images.length > 0) return images;

  if (pkg.image) return [pkg.image];

  return images;
}

export function getPackageImage(
  pkg: Package,
  products: Product[],
  services: ServiceListing[] = []
): string {
  return getPackageCoverImages(pkg, products, services)[0] ?? '';
}

export function isPackageCartItem(item: { id: string }): boolean {
  return item.id.startsWith('pkg-');
}

export function getPackageTypeLabel(type: string): string {
  if (type === 'fixed') return 'Fixed Package';
  if (type === 'customizable') return 'Customizable';
  return 'Mix & Match';
}

export function expandPackageCartItems(
  cartItems: CartItem[],
  packages: Package[],
  products: Product[],
  services: ServiceListing[] = []
): OrderItem[] {
  const result: OrderItem[] = [];

  for (const cartItem of cartItems) {
    if (!isPackageCartItem(cartItem)) {
      result.push({
        productId: cartItem.id,
        name: cartItem.name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        size: cartItem.size,
        color: cartItem.color,
        image: cartItem.image,
        itemType: 'product',
      });
      continue;
    }

    const pkg = packages.find((p) => p.id === cartItem.id);
    if (!pkg) {
      result.push({
        productId: cartItem.id,
        name: cartItem.name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        image: cartItem.image,
        packageId: cartItem.id,
      });
      continue;
    }

    const { productNames, retailPrices } = buildPackageCatalogMaps(
      products,
      services,
      [pkg]
    );

    const packageUnitPrice = resolvePackagePrice(pkg, retailPrices);
    const totalPackageValue = packageUnitPrice * cartItem.quantity;
    const weights = pkg.items.map((item) => {
      const retail = getPackageItemRetailUnit(item, retailPrices);
      return retail * item.quantity;
    });
    const weightSum = weights.reduce((a, b) => a + b, 0) || 1;

    pkg.items.forEach((pkgItem, index) => {
      const lineRetailWeight = weights[index];
      const allocatedTotal =
        Math.round((lineRetailWeight / weightSum) * totalPackageValue) || 0;
      const lineQty = pkgItem.quantity * cartItem.quantity;
      const unitPrice = lineQty > 0 ? Math.round(allocatedTotal / lineQty) : 0;
      const kind = getPackageItemKind(pkgItem);
      const refId = getPackageItemRefId(pkgItem);

      result.push({
        productId: refId,
        name: getPackageItemName(pkgItem, productNames),
        price: unitPrice,
        quantity: lineQty,
        image: getPackageItemImage(pkgItem, products, services),
        packageId: index === 0 ? pkg.id : undefined,
        itemType: kind,
        serviceId: kind === 'service' ? refId : undefined,
      });
    });
  }

  return result;
}
