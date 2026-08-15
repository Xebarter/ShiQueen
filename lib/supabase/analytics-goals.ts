import { getSupabaseClient } from '@/lib/supabase/client';
import { type Unsubscribe } from '@/lib/supabase/realtime';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';

const ANALYTICS_SETTINGS_KEY = 'analytics';

export interface AnalyticsGoals {
  monthlyRevenueTarget?: number;
  monthlyOrdersTarget?: number;
  averageOrderValueTarget?: number;
  updatedAt?: Date;
}

function mapAnalyticsGoals(
  value: Record<string, unknown> | null | undefined,
  updatedAt?: unknown
): AnalyticsGoals {
  if (!value) {
    return updatedAt ? { updatedAt: toDate(updatedAt) } : {};
  }

  return {
    monthlyRevenueTarget:
      value.monthlyRevenueTarget !== undefined ? Number(value.monthlyRevenueTarget) : undefined,
    monthlyOrdersTarget:
      value.monthlyOrdersTarget !== undefined ? Number(value.monthlyOrdersTarget) : undefined,
    averageOrderValueTarget:
      value.averageOrderValueTarget !== undefined
        ? Number(value.averageOrderValueTarget)
        : undefined,
    updatedAt: updatedAt ? toDate(updatedAt) : value.updatedAt ? toDate(value.updatedAt) : undefined,
  };
}

async function fetchAnalyticsGoals(): Promise<AnalyticsGoals> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from(TABLES.settings)
    .select('value, updated_at')
    .eq('key', ANALYTICS_SETTINGS_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data) return {};
  return mapAnalyticsGoals(data.value as Record<string, unknown>, data.updated_at);
}

export function subscribeAnalyticsGoals(
  onData: (goals: AnalyticsGoals) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const supabase = getSupabaseClient();
  if (!supabase) {
    onData({});
    return () => {};
  }

  let active = true;

  const refresh = () => {
    if (!active) return;
    void fetchAnalyticsGoals()
      .then((goals) => {
        if (active) onData(goals);
      })
      .catch((error) => onError?.(error as Error));
  };

  refresh();

  const channel = supabase
    .channel(`settings:analytics:${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.settings,
        filter: `key=eq.${ANALYTICS_SETTINGS_KEY}`,
      },
      refresh
    )
    .subscribe();

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export async function saveAnalyticsGoals(goals: AnalyticsGoals): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Database not available');

  const value: Record<string, unknown> = {};

  if (goals.monthlyRevenueTarget !== undefined) {
    value.monthlyRevenueTarget = goals.monthlyRevenueTarget;
  }
  if (goals.monthlyOrdersTarget !== undefined) {
    value.monthlyOrdersTarget = goals.monthlyOrdersTarget;
  }
  if (goals.averageOrderValueTarget !== undefined) {
    value.averageOrderValueTarget = goals.averageOrderValueTarget;
  }

  const { data: existing, error: readError } = await supabase
    .from(TABLES.settings)
    .select('value')
    .eq('key', ANALYTICS_SETTINGS_KEY)
    .maybeSingle();

  if (readError) throw readError;

  const merged = {
    ...((existing?.value as Record<string, unknown> | null) ?? {}),
    ...value,
  };

  const { error } = await supabase.from(TABLES.settings).upsert(
    {
      key: ANALYTICS_SETTINGS_KEY,
      value: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) throw error;
}

export async function clearAnalyticsGoals(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Database not available');

  const { error } = await supabase.from(TABLES.settings).upsert(
    {
      key: ANALYTICS_SETTINGS_KEY,
      value: {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) throw error;
}
