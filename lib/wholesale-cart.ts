import { CartItem } from '@/lib/cart-context';
import { Product } from '@/lib/types/database';
import { validateWholesaleQuantity } from '@/lib/package-utils';
import { getProductWholesaleUnitPrice, getTieredPrice } from '@/lib/wholesale-data';
import { getWholesaleDiscountPercent } from '@/lib/wholesale-catalog';

const BULK_CART_STORAGE_KEY = 'bulk-cart';

export type WholesaleCartValidation = {
  valid: boolean;
  error?: string;
  productId?: string;
};

type LegacyBulkCartItem = {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  basePrice: number;
  unitPrice: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number | null;
  stock?: number;
};

function isSameCartLine(a: CartItem, b: CartItem): boolean {
  return (
    a.id === b.id &&
    a.size === b.size &&
    a.color === b.color &&
    Boolean(a.wholesale) === Boolean(b.wholesale)
  );
}

export function clampWholesaleQuantity(product: Product, quantity: number): number {
  let qty = Math.max(quantity, 0);
  if (product.maxOrderQuantity) {
    qty = Math.min(qty, product.maxOrderQuantity);
  }
  qty = Math.min(qty, product.stock);
  return qty;
}

export function productToWholesaleCartItem(product: Product, quantity: number): CartItem {
  const qty = clampWholesaleQuantity(product, quantity);
  const unitPrice = getProductWholesaleUnitPrice(product, qty);

  return {
    id: product.id,
    name: product.name,
    price: unitPrice,
    image: product.image,
    quantity: qty,
    wholesale: {
      basePrice: product.price,
      fixedWholesalePrice: product.wholesalePrice,
      minOrderQuantity: product.minOrderQuantity,
      maxOrderQuantity: product.maxOrderQuantity,
      stock: product.stock,
    },
  };
}

export function recalcWholesaleItem(item: CartItem, quantity: number): CartItem {
  if (!item.wholesale) return item;

  const unitPrice =
    item.wholesale.fixedWholesalePrice != null && item.wholesale.fixedWholesalePrice > 0
      ? item.wholesale.fixedWholesalePrice
      : getTieredPrice(item.wholesale.basePrice, quantity).unitPrice;

  return {
    ...item,
    quantity,
    price: unitPrice,
  };
}

export function getWholesaleSavings(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    if (!item.wholesale) return sum;
    return sum + item.quantity * (item.wholesale.basePrice - item.price);
  }, 0);
}

export function getWholesaleSubtotal(items: CartItem[]): number {
  return items
    .filter((item) => item.wholesale)
    .reduce((sum, item) => sum + item.quantity * item.price, 0);
}

export function validateWholesaleCartItems(
  items: CartItem[],
  productsById: Map<string, Product>
): WholesaleCartValidation {
  const wholesaleItems = items.filter((item) => item.wholesale);

  if (wholesaleItems.length === 0) {
    return { valid: false, error: 'Add wholesale products to your cart first' };
  }

  for (const item of wholesaleItems) {
    const product = productsById.get(item.id);
    const minOrderQuantity = item.wholesale?.minOrderQuantity ?? product?.minOrderQuantity ?? 1;
    const maxOrderQuantity = item.wholesale?.maxOrderQuantity ?? product?.maxOrderQuantity ?? null;
    const stock = product?.stock ?? item.wholesale?.stock ?? item.quantity;

    const moqCheck = validateWholesaleQuantity(item.quantity, minOrderQuantity, maxOrderQuantity);
    if (!moqCheck.valid) {
      return { valid: false, error: moqCheck.error, productId: item.id };
    }

    if (item.quantity > stock) {
      return {
        valid: false,
        error: `Only ${stock} units available for ${item.name}`,
        productId: item.id,
      };
    }
  }

  return { valid: true };
}

export function getWholesaleDiscountForItem(item: CartItem): number {
  if (!item.wholesale) return 0;
  return getWholesaleDiscountPercent(item.wholesale.basePrice, item.quantity);
}

function legacyBulkItemToCartItem(legacy: LegacyBulkCartItem): CartItem {
  return {
    id: legacy.productId,
    name: legacy.name,
    price: legacy.unitPrice,
    image: legacy.image,
    quantity: legacy.quantity,
    wholesale: {
      basePrice: legacy.basePrice,
      minOrderQuantity: legacy.minOrderQuantity ?? 1,
      maxOrderQuantity: legacy.maxOrderQuantity ?? null,
      stock: legacy.stock ?? legacy.quantity,
    },
  };
}

export function migrateBulkCartToSharedCart(existingItems: CartItem[]): CartItem[] {
  if (typeof window === 'undefined') return existingItems;

  try {
    const raw = localStorage.getItem(BULK_CART_STORAGE_KEY);
    if (!raw) return existingItems;

    const legacyItems = JSON.parse(raw) as LegacyBulkCartItem[];
    if (!Array.isArray(legacyItems) || legacyItems.length === 0) {
      localStorage.removeItem(BULK_CART_STORAGE_KEY);
      return existingItems;
    }

    let merged = [...existingItems];

    for (const legacy of legacyItems) {
      const cartItem = legacyBulkItemToCartItem(legacy);
      const match = merged.find((item) => isSameCartLine(item, cartItem));

      if (match) {
        merged = merged.map((item) =>
          isSameCartLine(item, cartItem)
            ? recalcWholesaleItem(item, item.quantity + cartItem.quantity)
            : item
        );
      } else {
        merged.push(cartItem);
      }
    }

    localStorage.removeItem(BULK_CART_STORAGE_KEY);
    return merged;
  } catch {
    localStorage.removeItem(BULK_CART_STORAGE_KEY);
    return existingItems;
  }
}

export { isSameCartLine };
