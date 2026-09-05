export const FEATURE_SETTINGS_KEY = 'features';

export const FEATURE_FLAG_KEYS = [
  'packages',
  'services',
  'wholesale',
  'supplierApplications',
  'providerApplications',
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  packages: true,
  services: true,
  wholesale: true,
  supplierApplications: true,
  providerApplications: true,
};

export const FEATURE_FLAG_META: Record<
  FeatureFlagKey,
  { title: string; description: string }
> = {
  packages: {
    title: 'Packages',
    description: 'Public packages catalog, navigation links, search results, and homepage bundles.',
  },
  services: {
    title: 'Services',
    description: 'Public beauty services marketplace, navigation links, and search results.',
  },
  wholesale: {
    title: 'Wholesale',
    description: 'Public wholesale storefront and bulk-order links.',
  },
  supplierApplications: {
    title: 'Supplier applications',
    description: '“Sell with us” portal and new supplier sign-up.',
  },
  providerApplications: {
    title: 'Provider applications',
    description: '“List services” sign-up for new beauty providers. Requires Services to be public.',
  },
};

export function parseFeatureFlags(value: unknown): FeatureFlags {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return FEATURE_FLAG_KEYS.reduce((flags, key) => {
    flags[key] = record[key] === undefined ? DEFAULT_FEATURE_FLAGS[key] : Boolean(record[key]);
    return flags;
  }, { ...DEFAULT_FEATURE_FLAGS });
}

export function isFeatureEnabled(flags: FeatureFlags, key: FeatureFlagKey): boolean {
  return flags[key] !== false;
}

export function canShowProviderApplications(flags: FeatureFlags): boolean {
  return flags.services && flags.providerApplications;
}
