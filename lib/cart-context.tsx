'use client';

import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { Product } from '@/lib/types/database';
import {
  clampWholesaleQuantity,
  isSameCartLine,
  migrateBulkCartToSharedCart,
  productToWholesaleCartItem,
  recalcWholesaleItem,
} from '@/lib/wholesale-cart';

export type CartItemWholesale = {
  basePrice: number;
  /** Set when the product has an explicit wholesale unit price. */
  fixedWholesalePrice?: number;
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  stock: number;
};

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  wholesale?: CartItemWholesale;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  addWholesaleProduct: (product: Product, quantity?: number) => boolean;
  removeItem: (id: string, options?: { wholesale?: boolean }) => void;
  updateQuantity: (
    id: string,
    quantity: number,
    product?: Product,
    options?: { wholesale?: boolean }
  ) => void;
  updateWholesaleQuantity: (id: string, quantity: number, product: Product) => void;
  getWholesaleCartItem: (productId: string) => CartItem | undefined;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      const parsed = saved ? (JSON.parse(saved) as CartItem[]) : [];
      setItems(migrateBulkCartToSharedCart(parsed));
    } catch {
      setItems([]);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => isSameCartLine(item, newItem));

      if (existing) {
        const nextQuantity = existing.quantity + newItem.quantity;
        return prev.map((item) => {
          if (!isSameCartLine(item, newItem)) return item;
          if (item.wholesale) {
            return recalcWholesaleItem(item, nextQuantity);
          }
          return { ...item, quantity: nextQuantity, price: newItem.price };
        });
      }

      return [...prev, newItem];
    });
  }, []);

  const addWholesaleProduct = useCallback((product: Product, quantity?: number) => {
    const qty = clampWholesaleQuantity(product, quantity ?? product.minOrderQuantity);
    if (qty <= 0) return false;

    const cartItem = productToWholesaleCartItem(product, qty);
    addItem(cartItem);
    return true;
  }, [addItem]);

  const removeItem = useCallback((id: string, options?: { wholesale?: boolean }) => {
    setItems((prev) =>
      prev.filter((item) => {
        if (item.id !== id) return true;
        if (options?.wholesale !== undefined) {
          return Boolean(item.wholesale) !== options.wholesale;
        }
        return false;
      })
    );
  }, []);

  const matchesLine = useCallback(
    (item: CartItem, id: string, options?: { wholesale?: boolean }) => {
      if (item.id !== id) return false;
      if (options?.wholesale !== undefined) {
        return Boolean(item.wholesale) === options.wholesale;
      }
      return true;
    },
    []
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number, product?: Product, options?: { wholesale?: boolean }) => {
      if (quantity <= 0) {
        removeItem(id, options);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (!matchesLine(item, id, options)) return item;

          if (item.wholesale) {
            const resolvedProduct =
              product ??
              ({
                id: item.id,
                minOrderQuantity: item.wholesale.minOrderQuantity,
                maxOrderQuantity: item.wholesale.maxOrderQuantity,
                stock: item.wholesale.stock,
                price: item.wholesale.basePrice,
              } as Product);

            const qty = clampWholesaleQuantity(resolvedProduct, quantity);
            return recalcWholesaleItem(
              {
                ...item,
                wholesale: {
                  ...item.wholesale,
                  stock: product?.stock ?? item.wholesale.stock,
                },
              },
              qty
            );
          }

          return { ...item, quantity };
        })
      );
    },
    [matchesLine, removeItem]
  );

  const updateWholesaleQuantity = useCallback(
    (id: string, quantity: number, product: Product) => {
      if (quantity <= 0) {
        removeItem(id, { wholesale: true });
        return;
      }

      const qty = clampWholesaleQuantity(product, quantity);
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id || !item.wholesale) return item;
          return productToWholesaleCartItem(product, qty);
        })
      );
    },
    [removeItem]
  );

  const getWholesaleCartItem = useCallback(
    (productId: string) => items.find((item) => item.id === productId && item.wholesale),
    [items]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addWholesaleProduct,
        removeItem,
        updateQuantity,
        updateWholesaleQuantity,
        getWholesaleCartItem,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
