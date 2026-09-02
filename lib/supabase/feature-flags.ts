import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_SETTINGS_KEY,
  parseFeatureFlags,
  type FeatureFlags,
} from '@/lib/feature-flags';
import { getSupabaseClient } from '@/lib/supabase/client';
import { type Unsubscribe } from '@/lib/supabase/realtime';
import { TABLES } from '@/lib/supabase/tables';

async function fetchFeatureFlags(): Promise<FeatureFlags> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ...DEFAULT_FEATURE_FLAGS };

  const { data, error } = await supabase
    .from(TABLES.settings)
    .select('value')
    .eq('key', FEATURE_SETTINGS_KEY)
    .maybeSingle();

  if (error) throw error;
  return parseFeatureFlags(data?.value);
}

export function subscribeFeatureFlags(
  onData: (flags: FeatureFlags) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const supabase = getSupabaseClient();
  if (!supabase) {
    onData({ ...DEFAULT_FEATURE_FLAGS });
    return () => {};
  }

  let active = true;

  const refresh = () => {
    if (!active) return;
    void fetchFeatureFlags()
      .then((flags) => {
        if (active) onData(flags);
      })
      .catch((error) => onError?.(error as Error));
  };

  refresh();

  const channel = supabase
    .channel(`settings:features:${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.settings,
        filter: `key=eq.${FEATURE_SETTINGS_KEY}`,
      },
      refresh
    )
    .subscribe();

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export async function saveFeatureFlags(flags: FeatureFlags): Promise<FeatureFlags> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Database not available');

  const { data: existing, error: readError } = await supabase
    .from(TABLES.settings)
    .select('value')
    .eq('key', FEATURE_SETTINGS_KEY)
    .maybeSingle();

  if (readError) throw readError;

  const merged = parseFeatureFlags({
    ...((existing?.value as Record<string, unknown> | null) ?? {}),
    ...flags,
  });

  const { error } = await supabase.from(TABLES.settings).upsert(
    {
      key: FEATURE_SETTINGS_KEY,
      value: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) throw error;
  return merged;
}
