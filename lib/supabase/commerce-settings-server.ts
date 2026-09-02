import { cache } from 'react';
import {
  COMMERCE_SETTINGS_KEY,
  DEFAULT_COMMERCE_SETTINGS,
  CHECKOUT_COUNTRY,
  isPaymentEnabled,
  parseCommerceSettings,
  quoteOrderTotals,
  subtotalFromItems,
  type CommerceSettings,
  type OrderQuote,
  type PaymentMethodKey,
} from '@/lib/commerce-settings';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/supabase/tables';

export const getCommerceSettings = cache(async function getCommerceSettings(): Promise<CommerceSettings> {
  if (!isSupabaseAdminConfigured()) return parseCommerceSettings(DEFAULT_COMMERCE_SETTINGS);

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(TABLES.settings)
    .select('value')
    .eq('key', COMMERCE_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    console.error('[ShiQueen] Failed to load commerce settings', error);
    return parseCommerceSettings(DEFAULT_COMMERCE_SETTINGS);
  }

  return parseCommerceSettings(data?.value);
});

export async function quoteServerOrderTotals(
  items: { price: number; quantity: number }[],
  country: string = CHECKOUT_COUNTRY
): Promise<{ settings: CommerceSettings; quote: OrderQuote }> {
  const settings = await getCommerceSettings();
  return {
    settings,
    quote: quoteOrderTotals(settings, subtotalFromItems(items), country),
  };
}

export async function assertPaymentMethodAvailable(method: PaymentMethodKey): Promise<CommerceSettings> {
  const settings = await getCommerceSettings();
  if (!isPaymentEnabled(settings, method)) {
    throw new Error('This payment method is not available.');
  }
  return settings;
}

export async function quoteEnabledCheckout(
  items: { price: number; quantity: number }[],
  method: PaymentMethodKey,
  country: string = CHECKOUT_COUNTRY
): Promise<
  | { ok: true; settings: CommerceSettings; quote: OrderQuote }
  | { ok: false; error: string; status: 403 }
> {
  const settings = await getCommerceSettings();
  if (!isPaymentEnabled(settings, method)) {
    return { ok: false, error: 'This payment method is not available.', status: 403 };
  }
  return {
    ok: true,
    settings,
    quote: quoteOrderTotals(settings, subtotalFromItems(items), country),
  };
}
