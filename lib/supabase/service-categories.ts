import { getSupabaseClient } from '@/lib/supabase/client';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import type { ServiceCategory } from '@/lib/types/services';

function mapCategory(row: Record<string, unknown>): ServiceCategory {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    serviceTypes: Array.isArray(row.service_types) ? (row.service_types as string[]) : [],
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active ?? true),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function categoryToRow(data: Partial<ServiceCategory> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    name: data.name,
    description: data.description,
    service_types: data.serviceTypes,
    sort_order: data.sortOrder,
    is_active: data.isActive,
  });
}

async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.serviceCategories)
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapCategory(row as Record<string, unknown>));
}

export function subscribeServiceCategories(
  onData: (categories: ServiceCategory[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.serviceCategories, fetchServiceCategories, onData, onError);
}

export async function getServiceCategory(id: string): Promise<ServiceCategory | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLES.serviceCategories)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapCategory(data as Record<string, unknown>);
}

export async function createServiceCategory(
  category: Omit<ServiceCategory, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.serviceCategories).insert(categoryToRow(category));
  if (error) throw error;
}

export async function updateServiceCategory(
  id: string,
  data: Partial<Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase
    .from(TABLES.serviceCategories)
    .update(categoryToRow(data))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteServiceCategory(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.serviceCategories).delete().eq('id', id);
  if (error) throw error;
}
