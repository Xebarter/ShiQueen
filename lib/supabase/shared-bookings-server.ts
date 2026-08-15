import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate, toIso } from '@/lib/supabase/timestamp';
import { resolveSharedBookingStatus } from '@/lib/shared-booking-utils';
import type { SharedBooking, SharedBookingSnapshot } from '@/lib/types/shared-booking';

export type CreateSharedBookingInput = {
  id: string;
  bookingId: string;
  snapshot: SharedBookingSnapshot;
  senderUserId?: string | null;
  senderMessage?: string;
  expiresAt: Date;
};

function mapSharedBooking(row: Record<string, unknown>): SharedBooking {
  return {
    id: String(row.id),
    status: (row.status as SharedBooking['status']) ?? 'pending',
    bookingId: String(row.booking_id ?? ''),
    snapshot: row.snapshot as SharedBookingSnapshot,
    senderUserId: row.sender_user_id ? String(row.sender_user_id) : null,
    senderMessage: row.sender_message ? String(row.sender_message) : undefined,
    expiresAt: toDate(row.expires_at),
    createdAt: toDate(row.created_at),
    paidAt: row.paid_at ? toDate(row.paid_at) : undefined,
  };
}

function createSharedBookingInputToRow(input: CreateSharedBookingInput): Record<string, unknown> {
  const { id, bookingId, snapshot, senderUserId, senderMessage, expiresAt } = input;

  return stripUndefined({
    id,
    status: 'pending',
    booking_id: bookingId,
    snapshot,
    sender_user_id: senderUserId,
    sender_message: senderMessage,
    expires_at: toIso(expiresAt),
  });
}

export async function createSharedBookingServer(
  input: CreateSharedBookingInput
): Promise<SharedBooking> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Shared booking requires SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = getSupabaseAdmin();
  const { id } = input;

  const { error } = await supabase
    .from(TABLES.sharedBookings)
    .insert(createSharedBookingInputToRow(input));

  if (error) throw error;

  return {
    id,
    status: 'pending',
    bookingId: input.bookingId,
    snapshot: input.snapshot,
    senderUserId: input.senderUserId ?? null,
    senderMessage: input.senderMessage,
    expiresAt: input.expiresAt,
    createdAt: new Date(),
  };
}

export async function getSharedBookingByIdServer(token: string): Promise<SharedBooking | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.sharedBookings)
    .select('*')
    .eq('id', token)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const shared = mapSharedBooking(data as Record<string, unknown>);
  const resolvedStatus = resolveSharedBookingStatus(shared);

  if (resolvedStatus === 'expired' && shared.status === 'pending') {
    return { ...shared, status: 'expired' };
  }

  return { ...shared, status: resolvedStatus };
}

export async function markSharedBookingPaidByBookingId(bookingId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.sharedBookings)
    .select('id')
    .eq('booking_id', bookingId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  await markSharedBookingPaidServer(String(data.id), bookingId);
}

export async function markSharedBookingPaidServer(
  token: string,
  bookingId: string
): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Shared booking updates require SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(TABLES.sharedBookings)
    .update({
      status: 'paid',
      booking_id: bookingId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', token);

  if (error) throw error;
}
