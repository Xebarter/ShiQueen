'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlagKey, type FeatureFlags } from '@/lib/feature-flags';
import { subscribeFeatureFlags } from '@/lib/supabase/feature-flags';

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  loading: boolean;
  error: string | null;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>({ ...DEFAULT_FEATURE_FLAGS });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeFeatureFlags(
      (nextFlags) => {
        setFlags(nextFlags);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Feature flags subscription error:', err);
        setError(err.message);
        setFlags({ ...DEFAULT_FEATURE_FLAGS });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, error }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
}

export function useFeature(key: FeatureFlagKey): boolean {
  return useFeatureFlags().flags[key];
}
