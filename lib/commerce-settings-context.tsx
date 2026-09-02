'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CHECKOUT_COUNTRY,
  DEFAULT_COMMERCE_SETTINGS,
  enabledPaymentMethods,
  parseCommerceSettings,
  quoteOrderTotals,
  type CommerceSettings,
  type OrderQuote,
  type PaymentMethodKey,
} from '@/lib/commerce-settings';
import { subscribeCommerceSettings } from '@/lib/supabase/commerce-settings';

interface CommerceSettingsContextType {
  settings: CommerceSettings;
  loading: boolean;
  error: string | null;
  quoteTotals: (subtotal: number, country?: string) => OrderQuote;
  enabledMethods: PaymentMethodKey[];
}

const CommerceSettingsContext = createContext<CommerceSettingsContextType | undefined>(undefined);

export function CommerceSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CommerceSettings>(
    parseCommerceSettings(DEFAULT_COMMERCE_SETTINGS)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeCommerceSettings(
      (next) => {
        setSettings(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Commerce settings subscription error:', err);
        setError(err.message);
        setSettings(parseCommerceSettings(DEFAULT_COMMERCE_SETTINGS));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const value = useMemo<CommerceSettingsContextType>(
    () => ({
      settings,
      loading,
      error,
      quoteTotals: (subtotal, country = CHECKOUT_COUNTRY) =>
        quoteOrderTotals(settings, subtotal, country),
      enabledMethods: enabledPaymentMethods(settings),
    }),
    [error, loading, settings]
  );

  return (
    <CommerceSettingsContext.Provider value={value}>{children}</CommerceSettingsContext.Provider>
  );
}

export function useCommerceSettings() {
  const context = useContext(CommerceSettingsContext);
  if (context === undefined) {
    throw new Error('useCommerceSettings must be used within CommerceSettingsProvider');
  }
  return context;
}
