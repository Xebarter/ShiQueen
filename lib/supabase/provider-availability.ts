import { getSupabaseClient } from '@/lib/supabase/client';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import type { ProviderAvailability } from '@/lib/types/services';

function mapAvailability(row: Record<string, unknown>): ProviderAvailability {
  return {
    id: String(row.id),
    providerId: String(row.provider_id ?? row.id),
    weeklySlots: (row.weekly_slots as ProviderAvailability['weeklySlots']) ?? {},
    blackoutDates: Array.isArray(row.blackout_dates) ? (row.blackout_dates as string[]) : [],
    slotDurationMinutes: Number(row.slot_duration_minutes ?? 60),
    updatedAt: toDate(row.updated_at),
  };
}

function availabilityToRow(
  data: Partial<ProviderAvailability> & { id?: string }
): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    provider_id: data.providerId,
    weekly_slots: data.weeklySlots,
    blackout_dates: data.blackoutDates,
    slot_duration_minutes: data.slotDurationMinutes,
  });
}

async function fetchProviderAvailability(): Promise<ProviderAvailability[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from(TABLES.providerAvailability).select('*');
  if (error) throw error;
  return (data ?? []).map((row) => mapAvailability(row as Record<string, unknown>));
}

export function subscribeProviderAvailability(
  onData: (items: ProviderAvailability[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.providerAvailability, fetchProviderAvailability, onData, onError);
}

export async function getProviderAvailability(
  providerId: string
): Promise<ProviderAvailability | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLES.providerAvailability)
    .select('*')
    .eq('id', providerId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapAvailability(data as Record<string, unknown>);
}

export async function upsertProviderAvailability(
  availability: Omit<ProviderAvailability, 'updatedAt'>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase
    .from(TABLES.providerAvailability)
    .upsert(availabilityToRow(availability), { onConflict: 'id' });

  if (error) throw error;
}
