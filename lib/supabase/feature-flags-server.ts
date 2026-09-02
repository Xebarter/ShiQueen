import { cache } from 'react';
import { notFound } from 'next/navigation';
import {
  canShowProviderApplications,
  DEFAULT_FEATURE_FLAGS,
  FEATURE_SETTINGS_KEY,
  parseFeatureFlags,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@/lib/feature-flags';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/supabase/tables';

export const getFeatureFlags = cache(async function getFeatureFlags(): Promise<FeatureFlags> {
  if (!isSupabaseAdminConfigured()) return { ...DEFAULT_FEATURE_FLAGS };

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(TABLES.settings)
    .select('value')
    .eq('key', FEATURE_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    console.error('[ShiQueen] Failed to load feature flags', error);
    return { ...DEFAULT_FEATURE_FLAGS };
  }

  return parseFeatureFlags(data?.value);
});

export async function assertPublicFeatures(
  keys: FeatureFlagKey | FeatureFlagKey[]
): Promise<FeatureFlags> {
  const flags = await getFeatureFlags();
  const required = Array.isArray(keys) ? keys : [keys];
  if (required.some((key) => !flags[key])) notFound();
  return flags;
}

export async function assertPublicFeature(key: FeatureFlagKey): Promise<FeatureFlags> {
  return assertPublicFeatures(key);
}

export async function assertProviderApplications(): Promise<FeatureFlags> {
  const flags = await getFeatureFlags();
  if (!canShowProviderApplications(flags)) notFound();
  return flags;
}
