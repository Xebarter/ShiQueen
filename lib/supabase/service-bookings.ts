import { getSupabaseClient } from '@/lib/supabase/client';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import {
  resolveServiceBookingStatus,
  withResolvedServiceBookingStatus,
} from '@/lib/service-booking-utils';
import type { ServiceBooking, ServiceBookingStatus } from '@/lib/types/services';
import type { PaymentMethod, PaymentStatus } from '@/lib/types/database';

function mapBooking(row: Record<string, unknown>): ServiceBooking {
  const booking: ServiceBooking = {
    id: String(row.id),
    serviceId: String(row.service_id ?? ''),
    providerId: String(row.provider_id ?? ''),
    userId: row.user_id ? String(row.user_id) : null,
    customerName: String(row.customer_name ?? ''),
    customerPhone: String(row.customer_phone ?? ''),
    customerEmail: row.customer_email ? String(row.customer_email) : undefined,
    date: String(row.date ?? ''),
    timeSlot: String(row.time_slot ?? ''),
    locationType: (row.location_type as ServiceBooking['locationType']) ?? 'studio',
    customerAddress: row.customer_address ? String(row.customer_address) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    status: (row.status as ServiceBookingStatus) ?? 'pending',
    amount: Number(row.amount ?? 0),
    travelFee: Number(row.travel_fee ?? 0),
    total: Number(row.total ?? row.amount ?? 0),
    serviceName: String(row.service_name ?? ''),
    providerName: String(row.provider_name ?? ''),
    paymentMethod: row.payment_method as PaymentMethod | undefined,
    paymentStatus: row.payment_status as PaymentStatus | undefined,
    paytotaPurchaseId: row.paytota_purchase_id ? String(row.paytota_purchase_id) : undefined,
    paytotaReference: row.paytota_reference ? String(row.paytota_reference) : undefined,
    sharedBookingToken: row.shared_booking_token
      ? String(row.shared_booking_token)
      : undefined,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
  return withResolvedServiceBookingStatus(booking);
}

async function persistExpiredIfNeeded(booking: ServiceBooking): Promise<ServiceBooking> {
  if (booking.status !== 'expired') return booking;
  const supabase = getSupabaseClient();
  if (!supabase) return booking;

  // Soft-expire on read; ignore write errors (e.g. offline / RLS).
  void supabase
    .from(TABLES.serviceBookings)
    .update({ status: 'expired' })
    .eq('id', booking.id)
    .eq('status', 'pending');

  return booking;
}

function bookingToRow(data: Partial<ServiceBooking> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    service_id: data.serviceId,
    provider_id: data.providerId,
    user_id: data.userId,
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    customer_email: data.customerEmail,
    date: data.date,
    time_slot: data.timeSlot,
    location_type: data.locationType,
    customer_address: data.customerAddress,
    notes: data.notes,
    status: data.status,
    amount: data.amount,
    travel_fee: data.travelFee,
    total: data.total,
    service_name: data.serviceName,
    provider_name: data.providerName,
    payment_method: data.paymentMethod,
    payment_status: data.paymentStatus,
    paytota_purchase_id: data.paytotaPurchaseId,
    paytota_reference: data.paytotaReference,
    shared_booking_token: data.sharedBookingToken,
  });
}

async function fetchServiceBookings(): Promise<ServiceBooking[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.serviceBookings)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapBooking(row as Record<string, unknown>));
}

async function fetchServiceBookingsForProvider(providerId: string): Promise<ServiceBooking[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !providerId) return [];

  const { data, error } = await supabase
    .from(TABLES.serviceBookings)
    .select('*')
    .eq('provider_id', providerId)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapBooking(row as Record<string, unknown>));
}

export function subscribeServiceBookings(
  onData: (bookings: ServiceBooking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.serviceBookings, fetchServiceBookings, onData, onError);
}

export function subscribeServiceBookingsForProvider(
  providerId: string,
  onData: (bookings: ServiceBooking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(
    `${TABLES.serviceBookings}:provider:${providerId}`,
    () => fetchServiceBookingsForProvider(providerId),
    onData,
    onError
  );
}

/** Public slot conflict query — only returns time slots, not customer PII. */
export async function getBookedTimeSlotsForProviderDate(
  providerId: string,
  date: string
): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.serviceBookings)
    .select('*')
    .eq('provider_id', providerId)
    .eq('date', date);

  if (error) throw error;

  return (data ?? [])
    .map((row) => mapBooking(row as Record<string, unknown>))
    .filter((b) => {
      if (b.status === 'cancelled' || b.status === 'expired') return false;
      if (b.paymentStatus === 'failed' || b.paymentStatus === 'cancelled') return false;
      return (
        b.status === 'pending' ||
        b.status === 'confirmed' ||
        b.status === 'in_progress' ||
        b.paymentStatus === 'awaiting_payment' ||
        b.paymentStatus === 'paid'
      );
    })
    .map((b) => b.timeSlot)
    .filter(Boolean);
}

export async function createServiceBooking(
  booking: Omit<ServiceBooking, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { id, ...rest } = booking;
  const { error } = await supabase.from(TABLES.serviceBookings).insert(bookingToRow({ ...rest, id }));
  if (error) throw error;

  void import('@/lib/pwa/notify-client').then(
    ({ notifyPartnerClients, notifyAdminBookingClients }) => {
      if (booking.paymentStatus === 'paid') {
        void notifyPartnerClients('booking', id);
      }
      void notifyAdminBookingClients(id);
    }
  );
}

export async function updateServiceBookingStatus(
  id: string,
  status: ServiceBookingStatus
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const existing = await getServiceBookingByIdRaw(id);
  if (!existing) throw new Error('Booking not found');

  const resolved = resolveServiceBookingStatus(existing);

  if (status === 'cancelled') {
    if (existing.paymentStatus === 'paid') {
      throw new Error('Paid bookings cannot be cancelled');
    }
    if (resolved === 'expired' || existing.status === 'expired') {
      throw new Error('Expired bookings cannot be cancelled');
    }
  }

  if (status === 'confirmed') {
    if (resolved === 'expired' || existing.status === 'expired') {
      throw new Error('This request expired. Ask the customer to book again.');
    }
    if (existing.status !== 'pending') {
      throw new Error('Only pending bookings can be accepted');
    }
  }

  let query = supabase.from(TABLES.serviceBookings).update({ status }).eq('id', id);

  // Accept / expire only while still pending to avoid racing a late Accept.
  if (status === 'confirmed' || status === 'expired') {
    query = query.eq('status', 'pending');
  }

  const { error, data } = await query.select('id');
  if (error) throw error;

  if ((status === 'confirmed' || status === 'expired') && (!data || data.length === 0)) {
    const latest = await getServiceBookingByIdRaw(id);
    if (latest?.status === status) return;
    if (status === 'confirmed') {
      throw new Error('This request expired. Ask the customer to book again.');
    }
  }
}

export async function updateServiceBooking(
  id: string,
  data: Partial<Omit<ServiceBooking, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase
    .from(TABLES.serviceBookings)
    .update(bookingToRow(data))
    .eq('id', id);

  if (error) throw error;
}

async function getServiceBookingByIdRaw(id: string): Promise<ServiceBooking | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLES.serviceBookings)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    serviceId: String(row.service_id ?? ''),
    providerId: String(row.provider_id ?? ''),
    userId: row.user_id ? String(row.user_id) : null,
    customerName: String(row.customer_name ?? ''),
    customerPhone: String(row.customer_phone ?? ''),
    customerEmail: row.customer_email ? String(row.customer_email) : undefined,
    date: String(row.date ?? ''),
    timeSlot: String(row.time_slot ?? ''),
    locationType: (row.location_type as ServiceBooking['locationType']) ?? 'studio',
    customerAddress: row.customer_address ? String(row.customer_address) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    status: (row.status as ServiceBookingStatus) ?? 'pending',
    amount: Number(row.amount ?? 0),
    travelFee: Number(row.travel_fee ?? 0),
    total: Number(row.total ?? row.amount ?? 0),
    serviceName: String(row.service_name ?? ''),
    providerName: String(row.provider_name ?? ''),
    paymentMethod: row.payment_method as PaymentMethod | undefined,
    paymentStatus: row.payment_status as PaymentStatus | undefined,
    paytotaPurchaseId: row.paytota_purchase_id ? String(row.paytota_purchase_id) : undefined,
    paytotaReference: row.paytota_reference ? String(row.paytota_reference) : undefined,
    sharedBookingToken: row.shared_booking_token
      ? String(row.shared_booking_token)
      : undefined,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export async function getServiceBookingById(id: string): Promise<ServiceBooking | null> {
  const raw = await getServiceBookingByIdRaw(id);
  if (!raw) return null;
  const booking = withResolvedServiceBookingStatus(raw);
  return persistExpiredIfNeeded(booking);
}
