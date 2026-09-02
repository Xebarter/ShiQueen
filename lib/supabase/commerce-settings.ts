import {
  COMMERCE_SETTINGS_KEY,
  DEFAULT_COMMERCE_SETTINGS,
  hasEnabledPaymentMethod,
  mergeCommerceSettings,
  parseCommerceSettings,
  type CommerceSettings,
} from '@/lib/commerce-settings';
import { getSupabaseClient } from '@/lib/supabase/client';
import { type Unsubscribe } from '@/lib/supabase/realtime';
import { TABLES } from '@/lib/supabase/tables';

async function fetchCommerceSettings(): Promise<CommerceSettings> {
  const supabase = getSupabaseClient();
  if (!supabase) return parseCommerceSettings(DEFAULT_COMMERCE_SETTINGS);

  const { data, error } = await supabase
    .from(TABLES.settings)
    .select('value')
    .eq('key', COMMERCE_SETTINGS_KEY)
    .maybeSingle();

  if (error) throw error;
  return parseCommerceSettings(data?.value);
}

export function subscribeCommerceSettings(
  onData: (settings: CommerceSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const supabase = getSupabaseClient();
  if (!supabase) {
    onData(parseCommerceSettings(DEFAULT_COMMERCE_SETTINGS));
    return () => {};
  }

  let active = true;

  const refresh = () => {
    if (!active) return;
    void fetchCommerceSettings()
      .then((settings) => {
        if (active) onData(settings);
      })
      .catch((error) => onError?.(error as Error));
  };

  refresh();

  const channel = supabase
    .channel(`settings:commerce:${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.settings,
        filter: `key=eq.${COMMERCE_SETTINGS_KEY}`,
      },
      refresh
    )
    .subscribe();

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export async function saveCommerceSettings(
  patch: Partial<CommerceSettings>
): Promise<CommerceSettings> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Database not available');

  const { data: existing, error: readError } = await supabase
    .from(TABLES.settings)
    .select('value')
    .eq('key', COMMERCE_SETTINGS_KEY)
    .maybeSingle();

  if (readError) throw readError;

  const merged = mergeCommerceSettings(existing?.value, patch);

  if (!hasEnabledPaymentMethod(merged)) {
    throw new Error('Keep at least one payment method on');
  }

  const { error } = await supabase.from(TABLES.settings).upsert(
    {
      key: COMMERCE_SETTINGS_KEY,
      value: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) throw error;
  return merged;
}
