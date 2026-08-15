import { getSupabaseClient } from '@/lib/supabase/client';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import type { ServiceReview } from '@/lib/types/services';

function mapReview(row: Record<string, unknown>): ServiceReview {
  return {
    id: String(row.id),
    serviceId: String(row.service_id ?? ''),
    providerId: String(row.provider_id ?? ''),
    bookingId: row.booking_id ? String(row.booking_id) : undefined,
    rating: Number(row.rating ?? 0),
    comment: String(row.comment ?? ''),
    customerName: String(row.customer_name ?? ''),
    isVisible: Boolean(row.is_visible ?? true),
    createdAt: toDate(row.created_at),
  };
}

function reviewToRow(data: Partial<ServiceReview> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    service_id: data.serviceId,
    provider_id: data.providerId,
    booking_id: data.bookingId,
    rating: data.rating,
    comment: data.comment,
    customer_name: data.customerName,
    is_visible: data.isVisible,
  });
}

async function fetchServiceReviews(): Promise<ServiceReview[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.serviceReviews)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapReview(row as Record<string, unknown>));
}

export function subscribeServiceReviews(
  onData: (reviews: ServiceReview[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.serviceReviews, fetchServiceReviews, onData, onError);
}

export async function createServiceReview(
  review: Omit<ServiceReview, 'createdAt'>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.serviceReviews).insert(reviewToRow(review));
  if (error) throw error;
}

export async function updateServiceReviewVisibility(
  id: string,
  isVisible: boolean
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase
    .from(TABLES.serviceReviews)
    .update({ is_visible: isVisible })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteServiceReview(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.serviceReviews).delete().eq('id', id);
  if (error) throw error;
}
