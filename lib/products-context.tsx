'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product } from '@/lib/types/database';
import { subscribeProducts } from '@/lib/firebase/products';
import { ensureDatabaseSeeded } from '@/lib/firebase/seed';
import { SEED_PRODUCTS } from '@/lib/firebase/seed-data';
import { uniqueByProductId } from '@/lib/home-merchandising';
import { readCatalogCache, writeCatalogCache } from '@/lib/catalog-cache';

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
    const cached = readCatalogCache<Product>('products');
    if (cached?.length) {
      setProducts(uniqueByProductId(cached));
      setLoading(false);
    }

    const unsubscribe = subscribeProducts(
      (nextProducts) => {
        const source = nextProducts.length > 0 ? nextProducts : FALLBACK_PRODUCTS;
        const unique = uniqueByProductId(source);
        setProducts(unique);
        writeCatalogCache('products', unique);
        setLoading(false);
      },
      (err) => {
        console.error('Products subscription error:', err);
        setProducts((prev) => (prev.length > 0 ? prev : FALLBACK_PRODUCTS));
        setError(err.message);
        setLoading(false);
      }
    );

    void ensureDatabaseSeeded();
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
