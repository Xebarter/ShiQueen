'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product } from '@/lib/types/database';
import { subscribeProducts } from '@/lib/firebase/products';
import { ensureDatabaseSeeded } from '@/lib/firebase/seed';
import { SEED_PRODUCTS } from '@/lib/firebase/seed-data';
import { uniqueByProductId } from '@/lib/home-merchandising';

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  getProductById: (id: string) => Product | undefined;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

const FALLBACK_PRODUCTS: Product[] = SEED_PRODUCTS.map((product) => ({
  ...product,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    async function init() {
      try {
        await ensureDatabaseSeeded();
        unsubscribe = subscribeProducts(
          (nextProducts) => {
            const source = nextProducts.length > 0 ? nextProducts : FALLBACK_PRODUCTS;
            setProducts(uniqueByProductId(source));
            setLoading(false);
          },
          (err) => {
            console.error('Products subscription error:', err);
            setProducts(FALLBACK_PRODUCTS);
            setError(err.message);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Products init error:', err);
        setProducts(FALLBACK_PRODUCTS);
        setError(err instanceof Error ? err.message : 'Failed to load products');
        setLoading(false);
      }
    }

    init();
    return () => unsubscribe();
  }, []);

  const getProductById = (id: string) => products.find((product) => product.id === id);

  return (
    <ProductsContext.Provider value={{ products, loading, error, getProductById }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within ProductsProvider');
  }
  return context;
}
