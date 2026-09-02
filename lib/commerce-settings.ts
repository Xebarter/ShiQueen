import type { PaymentMethod } from '@/lib/types/database';

export const COMMERCE_SETTINGS_KEY = 'commerce';
export const STORE_CURRENCY_CODE = 'UGX';
export const CHECKOUT_COUNTRY = 'Uganda';

export interface StoreCurrency {
  code: string;
  symbol: string;
  name: string;
  enabled: boolean;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  baseCost: number;
  freeThreshold: number;
  estimatedDays: string;
  enabled: boolean;
}

export interface TaxRegion {
  id: string;
  region: string;
  country: string;
  type: string;
  rate: number;
  enabled: boolean;
}

export type PaymentMethodKey = PaymentMethod;

export interface PaymentMethodSetting {
  enabled: boolean;
}

export interface CommercePayments {
  mobile_money: PaymentMethodSetting;
  card: PaymentMethodSetting;
  cash_on_delivery: PaymentMethodSetting;
}

export interface CommerceSettings {
  currencies: StoreCurrency[];
  shipping: { zones: ShippingZone[] };
  taxes: { regions: TaxRegion[] };
  payments: CommercePayments;
}

export interface DeliveryQuote {
  fee: number;
  estimatedDays: string;
  free: boolean;
  zoneName?: string;
}

export interface TaxQuote {
  amount: number;
  rate: number;
  enabled: boolean;
  label: string;
}

export interface OrderQuote {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  delivery: DeliveryQuote;
  taxQuote: TaxQuote;
}

export const PAYMENT_METHOD_KEYS: PaymentMethodKey[] = [
  'mobile_money',
  'card',
  'cash_on_delivery',
];

export const DEFAULT_COMMERCE_SETTINGS: CommerceSettings = {
  currencies: [
    {
      code: STORE_CURRENCY_CODE,
      symbol: 'USh',
      name: 'Ugandan Shilling',
      enabled: true,
    },
  ],
  shipping: {
    zones: [
      {
        id: 'zone-uganda',
        name: 'Uganda',
        countries: ['Uganda'],
        baseCost: 0,
        freeThreshold: 500000,
        estimatedDays: '2–3 days',
        enabled: true,
      },
      {
        id: 'zone-east-africa',
        name: 'East Africa',
        countries: ['Kenya', 'Tanzania', 'Rwanda', 'Burundi'],
        baseCost: 75000,
        freeThreshold: 750000,
        estimatedDays: '4–6 days',
        enabled: true,
      },
      {
        id: 'zone-africa',
        name: 'Africa',
        countries: ['South Africa', 'Nigeria', 'Ghana', 'Ethiopia', 'Others'],
        baseCost: 100000,
        freeThreshold: 1000000,
        estimatedDays: '7–10 days',
        enabled: true,
      },
      {
        id: 'zone-international',
        name: 'International',
        countries: ['All other countries'],
        baseCost: 150000,
        freeThreshold: 1500000,
        estimatedDays: '10–15 days',
        enabled: true,
      },
    ],
  },
  taxes: {
    regions: [
      {
        id: 'tax-uganda',
        region: 'Uganda',
        country: 'Uganda',
        type: 'VAT',
        rate: 0.18,
        enabled: false,
      },
      {
        id: 'tax-kenya',
        region: 'Kenya',
        country: 'Kenya',
        type: 'VAT',
        rate: 0.16,
        enabled: false,
      },
      {
        id: 'tax-tanzania',
        region: 'Tanzania',
        country: 'Tanzania',
        type: 'VAT',
        rate: 0.18,
        enabled: false,
      },
      {
        id: 'tax-rwanda',
        region: 'Rwanda',
        country: 'Rwanda',
        type: 'VAT',
        rate: 0.18,
        enabled: false,
      },
      {
        id: 'tax-south-africa',
        region: 'South Africa',
        country: 'South Africa',
        type: 'VAT',
        rate: 0.15,
        enabled: false,
      },
    ],
  },
  payments: {
    mobile_money: { enabled: true },
    card: { enabled: true },
    cash_on_delivery: { enabled: true },
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function num(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function parseCurrencies(value: unknown): StoreCurrency[] {
  const rows = asArray(value);
  const parsed = rows.map((row) => {
    const r = asRecord(row);
    return {
      code: str(r.code, STORE_CURRENCY_CODE).toUpperCase(),
      symbol: str(r.symbol, 'USh'),
      name: str(r.name, 'Ugandan Shilling'),
      enabled: r.enabled !== false,
    };
  });

  const ugx = parsed.find((c) => c.code === STORE_CURRENCY_CODE);
  if (!ugx) {
    return [...DEFAULT_COMMERCE_SETTINGS.currencies, ...parsed.filter((c) => c.code !== STORE_CURRENCY_CODE)];
  }

  return [
    { ...ugx, enabled: true, code: STORE_CURRENCY_CODE },
    ...parsed.filter((c) => c.code !== STORE_CURRENCY_CODE),
  ];
}

function parseZones(value: unknown): ShippingZone[] {
  const source = asRecord(value);
  const rows = asArray(source.zones ?? value);
  if (rows.length === 0) return DEFAULT_COMMERCE_SETTINGS.shipping.zones.map((z) => ({ ...z }));

  return rows.map((row, index) => {
    const r = asRecord(row);
    const fallback = DEFAULT_COMMERCE_SETTINGS.shipping.zones[index];
    return {
      id: str(r.id, fallback?.id ?? `zone-${index + 1}`),
      name: str(r.name, fallback?.name ?? `Zone ${index + 1}`),
      countries: asArray(r.countries).map((c) => String(c)).filter(Boolean),
      baseCost: Math.max(0, Math.round(num(r.baseCost, fallback?.baseCost ?? 0))),
      freeThreshold: Math.max(0, Math.round(num(r.freeThreshold, fallback?.freeThreshold ?? 0))),
      estimatedDays: str(r.estimatedDays, fallback?.estimatedDays ?? ''),
      enabled: r.enabled !== false,
    };
  }).map((zone) => ({
    ...zone,
    countries: zone.countries.length > 0 ? zone.countries : ['Uganda'],
  }));
}

function parseTaxRegions(value: unknown): TaxRegion[] {
  const source = asRecord(value);
  const rows = asArray(source.regions ?? value);
  if (rows.length === 0) return DEFAULT_COMMERCE_SETTINGS.taxes.regions.map((r) => ({ ...r }));

  return rows.map((row, index) => {
    const r = asRecord(row);
    const fallback = DEFAULT_COMMERCE_SETTINGS.taxes.regions[index];
    const rawRate = num(r.rate, fallback?.rate ?? 0.18);
    const rate = rawRate > 1 ? rawRate / 100 : rawRate;
    return {
      id: str(r.id, fallback?.id ?? `tax-${index + 1}`),
      region: str(r.region, fallback?.region ?? 'Uganda'),
      country: str(r.country, fallback?.country ?? str(r.region, 'Uganda')),
      type: str(r.type, fallback?.type ?? 'VAT'),
      rate: Math.min(1, Math.max(0, rate)),
      enabled: r.enabled === true,
    };
  });
}

function parsePayments(value: unknown): CommercePayments {
  const r = asRecord(value);
  const method = (key: PaymentMethodKey): PaymentMethodSetting => {
    const row = asRecord(r[key]);
    const fallback = DEFAULT_COMMERCE_SETTINGS.payments[key];
    return { enabled: row.enabled === undefined ? fallback.enabled : Boolean(row.enabled) };
  };
  return {
    mobile_money: method('mobile_money'),
    card: method('card'),
    cash_on_delivery: method('cash_on_delivery'),
  };
}

export function parseCommerceSettings(value: unknown): CommerceSettings {
  const record = asRecord(value);
  return {
    currencies: parseCurrencies(record.currencies),
    shipping: { zones: parseZones(record.shipping) },
    taxes: { regions: parseTaxRegions(record.taxes) },
    payments: parsePayments(record.payments),
  };
}

export function mergeCommerceSettings(
  existing: unknown,
  patch: Partial<CommerceSettings>
): CommerceSettings {
  const current = parseCommerceSettings(existing);
  return parseCommerceSettings({
    currencies: patch.currencies ?? current.currencies,
    shipping: patch.shipping ?? current.shipping,
    taxes: patch.taxes ?? current.taxes,
    payments: patch.payments ?? current.payments,
  });
}

function normalizeCountry(value: string): string {
  return value.trim().toLowerCase();
}

function isCatchAllCountry(name: string): boolean {
  const n = normalizeCountry(name);
  return n === 'all other countries' || n === 'others' || n === '*';
}

export function matchShippingZone(
  settings: CommerceSettings,
  country: string = CHECKOUT_COUNTRY
): ShippingZone | undefined {
  const target = normalizeCountry(country);
  const enabled = settings.shipping.zones.filter((zone) => zone.enabled);
  const exact = enabled.find((zone) =>
    zone.countries.some((name) => normalizeCountry(name) === target)
  );
  if (exact) return exact;
  return enabled.find((zone) => zone.countries.some(isCatchAllCountry));
}

export function quoteDelivery(
  settings: CommerceSettings,
  subtotal: number,
  country: string = CHECKOUT_COUNTRY
): DeliveryQuote {
  const zone = matchShippingZone(settings, country);
  if (!zone) {
    return { fee: 0, estimatedDays: '', free: true };
  }
  const qualifiesFree = zone.freeThreshold > 0 && subtotal >= zone.freeThreshold;
  const fee = qualifiesFree ? 0 : Math.max(0, Math.round(zone.baseCost));
  return {
    fee,
    estimatedDays: zone.estimatedDays,
    free: fee === 0,
    zoneName: zone.name,
  };
}

export function quoteTax(
  settings: CommerceSettings,
  subtotal: number,
  country: string = CHECKOUT_COUNTRY
): TaxQuote {
  const target = normalizeCountry(country);
  const region = settings.taxes.regions.find(
    (row) =>
      row.enabled &&
      (normalizeCountry(row.country) === target || normalizeCountry(row.region) === target)
  );
  if (!region) {
    return { amount: 0, rate: 0, enabled: false, label: 'Tax' };
  }
  const percent = Math.round(region.rate * 100);
  return {
    amount: Math.round(subtotal * region.rate),
    rate: region.rate,
    enabled: true,
    label: `${region.type} (${percent}%)`,
  };
}

export function quoteOrderTotals(
  settings: CommerceSettings,
  subtotal: number,
  country: string = CHECKOUT_COUNTRY
): OrderQuote {
  const safeSubtotal = Math.max(0, Math.round(subtotal));
  const delivery = quoteDelivery(settings, safeSubtotal, country);
  const taxQuote = quoteTax(settings, safeSubtotal, country);
  return {
    subtotal: safeSubtotal,
    shipping: delivery.fee,
    tax: taxQuote.amount,
    total: safeSubtotal + delivery.fee + taxQuote.amount,
    delivery,
    taxQuote,
  };
}

export function subtotalFromItems(items: { price: number; quantity: number }[]): number {
  return Math.round(
    items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  );
}

export function isPaymentEnabled(settings: CommerceSettings, method: PaymentMethodKey): boolean {
  return settings.payments[method]?.enabled !== false;
}

export function enabledPaymentMethods(settings: CommerceSettings): PaymentMethodKey[] {
  return PAYMENT_METHOD_KEYS.filter((key) => isPaymentEnabled(settings, key));
}

export function hasEnabledPaymentMethod(settings: CommerceSettings): boolean {
  return enabledPaymentMethods(settings).length > 0;
}

export function getStoreCurrency(settings: CommerceSettings): StoreCurrency {
  return (
    settings.currencies.find((c) => c.code === STORE_CURRENCY_CODE) ??
    DEFAULT_COMMERCE_SETTINGS.currencies[0]
  );
}

export function newCommerceId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const ONLINE_PAYMENT_METHODS: Array<'mobile_money' | 'card'> = ['mobile_money', 'card'];

export function enabledOnlinePaymentMethods(
  settings: CommerceSettings
): Array<'mobile_money' | 'card'> {
  return ONLINE_PAYMENT_METHODS.filter((key) => isPaymentEnabled(settings, key));
}

export function gatewayProductLines(
  items: { name: string; price: number; quantity: number }[],
  quote: OrderQuote
): { name: string; price: string }[] {
  const lines = items.map((item) => ({
    name: item.name.slice(0, 120),
    price: String(Math.round(Number(item.price || 0) * Number(item.quantity || 0))),
  }));
  if (quote.tax > 0) {
    lines.push({ name: quote.taxQuote.label || 'Tax', price: String(quote.tax) });
  }
  if (quote.shipping > 0) {
    lines.push({ name: 'Delivery', price: String(quote.shipping) });
  }
  return lines;
}
