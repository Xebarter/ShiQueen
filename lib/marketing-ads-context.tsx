'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { MarketingAd, MarketingAdPlacement } from '@/lib/types/database';
import { pickActiveMarketingAd, subscribeMarketingAds } from '@/lib/firebase/marketing-ads';

interface MarketingAdsContextType {
  ads: MarketingAd[];
  loading: boolean;
  error: string | null;
  getActiveAd: (placement: MarketingAdPlacement) => MarketingAd | null;
}

const MarketingAdsContext = createContext<MarketingAdsContextType | undefined>(undefined);

export function MarketingAdsProvider({ children }: { children: ReactNode }) {
  const [ads, setAds] = useState<MarketingAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeMarketingAds(
      (nextAds) => {
        setAds(nextAds);
        setLoading(false);
      },
      (err) => {
        if (err.message.includes('permission') || err.message.includes('Permission')) {
          console.warn('[SheQueen] Marketing ads unavailable — check Firestore settings/marketing access.');
        } else {
          console.error('Marketing ads subscription error:', err);
        }
        setError(err.message);
        setAds([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getActiveAd = useCallback(
    (placement: MarketingAdPlacement) => pickActiveMarketingAd(ads, placement),
    [ads]
  );

  return (
    <MarketingAdsContext.Provider value={{ ads, loading, error, getActiveAd }}>
      {children}
    </MarketingAdsContext.Provider>
  );
}

export function useMarketingAds() {
  const context = useContext(MarketingAdsContext);
  if (context === undefined) {
    throw new Error('useMarketingAds must be used within MarketingAdsProvider');
  }
  return context;
}
