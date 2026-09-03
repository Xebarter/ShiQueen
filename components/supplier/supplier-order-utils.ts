import type { Order, OrderItem, Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import { isRemoteProductImage } from '@/components/product-image';

export const FULFILL_STEPS: Order['status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
];

export const ORDER_STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'New',
  processing: 'Pack',
  shipped: 'Out',
  delivered: 'Done',
  cancelled: 'Off',
};

export const ORDER_STATUS_TONE: Record<Order['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
  processing: 'bg-sky-500/15 text-sky-800 ring-sky-500/25',
  shipped: 'bg-violet-500/15 text-violet-800 ring-violet-500/25',
  delivered: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  cancelled: 'bg-rose-500/15 text-rose-800 ring-rose-500/25',
};

export function formatOrderRef(orderId: string): string {
  if (orderId.length <= 10) return orderId.toUpperCase();
  return `#${orderId.slice(-8).toUpperCase()}`;
}

export function formatOrderDay(date: Date): string {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function isSupplierLine(
  item: OrderItem,
  supplierId: string,
  productsById: Map<string, Product>,
  packages: Package[]
): boolean {
  if (item.itemType === 'service') return false;
  if (item.supplierId === supplierId) return true;
  if (productsById.get(item.productId)?.supplierId === supplierId) return true;
  if (item.packageId) {
    const pkg = packages.find((entry) => entry.id === item.packageId);
    if (pkg?.supplierId === supplierId) return true;
  }
  return false;
}

export function supplierOrderItems(
  order: Order,
  supplierId: string,
  productsById: Map<string, Product>,
  packages: Package[]
): OrderItem[] {
  const mine = order.items.filter((item) =>
    isSupplierLine(item, supplierId, productsById, packages)
  );
  if (mine.length > 0) return mine;
  return order.items.filter((item) => item.itemType !== 'service');
}

export function lineTotal(item: OrderItem): number {
  return item.price * item.quantity;
}

export function itemsTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function resolveOrderItemImage(
  item: OrderItem,
  productsById: Map<string, Product>,
  packages: Package[]
): string | undefined {
  if (isRemoteProductImage(item.image)) return item.image;
  const product = productsById.get(item.productId);
  if (product) {
    if (isRemoteProductImage(product.image)) return product.image;
    const extra = product.images.find((url) => isRemoteProductImage(url));
    if (extra) return extra;
  }
  if (item.packageId) {
    const pkg = packages.find((entry) => entry.id === item.packageId);
    if (isRemoteProductImage(pkg?.image)) return pkg?.image;
  }
  return undefined;
}

export function nextFulfillStatus(status: Order['status']): Order['status'] | null {
  if (status === 'pending') return 'processing';
  if (status === 'processing') return 'shipped';
  if (status === 'shipped') return 'delivered';
  return null;
}

export function nextFulfillLabel(status: Order['status']): string | null {
  if (status === 'pending') return 'Pack';
  if (status === 'processing') return 'Ship';
  if (status === 'shipped') return 'Done';
  return null;
}

export function isFulfillLocked(status: Order['status']): boolean {
  return status === 'delivered' || status === 'cancelled';
}

export function canAdvanceFulfillStep(
  current: Order['status'],
  target: Order['status']
): boolean {
  if (isFulfillLocked(current)) return false;
  return nextFulfillStatus(current) === target;
}
