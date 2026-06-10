'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type ShopPriceRange = 'all' | 'under-500k' | 'luxury';
export type ShopViewMode = 'discover' | 'grid';

export type ShopFiltersContextValue = {
  priceRange: ShopPriceRange;
  setPriceRange: (value: ShopPriceRange) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  viewMode: ShopViewMode;
  setViewMode: (value: ShopViewMode) => void;
  clearFilters: () => void;
  hasSecondaryFilters: boolean;
};

const ShopFiltersContext = createContext<ShopFiltersContextValue | null>(null);

export function ShopFiltersProvider({
  value,
  children,
}: {
  value: ShopFiltersContextValue;
  children: ReactNode;
}) {
  return <ShopFiltersContext.Provider value={value}>{children}</ShopFiltersContext.Provider>;
}

export function useShopFilters() {
  return useContext(ShopFiltersContext);
}
