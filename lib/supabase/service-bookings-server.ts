import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import type { ServiceBooking, ServiceBookingStatus, ServiceLocationType } from '@/lib/types/services';
import type { PaymentMethod, PaymentStatus } from '@/lib/types/database';

export type CreateServerBookingInput = {
  id: string;
  serviceId: string;
  providerId: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  timeSlot: string;
  locationType: ServiceLocationType;
  customerAddress?: string;
  notes?: string;
  status: ServiceBookingStatus;
  amount: number;
  travelFee: number;
  total: number;
  serviceName: string;
  providerName: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paytotaPurchaseId?: string;
  paytotaReference?: string;
  sharedBookingToken?: string;
};

export type BookingPaymentUpdateInput = {
  paymentStatus?: PaymentStatus;
  paytotaPurchaseId?: string;
  paytotaReference?: string;
  status?: ServiceBookingStatus;
};

function mapBooking(row: Record<string, unknown>): ServiceBooking {
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
    locationType: (row.location_type as ServiceLocationType) ?? 'studio',
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

function createBookingInputToRow(booking: CreateServerBookingInput): Record<string, unknown> {
  const {
    id,
    serviceId,
    providerId,
    userId,
    customerName,
    customerPhone,
    customerEmail,
    date,
    timeSlot,
    locationType,
    customerAddress,
    notes,
    status,
    amount,
    travelFee,
    total,
    serviceName,
    providerName,
    paymentMethod,
    paymentStatus,
    paytotaPurchaseId,
    paytotaReference,
    sharedBookingToken,
  } = booking;

  return stripUndefined({
    id,
    service_id: serviceId,
    provider_id: providerId,
    user_id: userId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    date,
    time_slot: timeSlot,
    location_type: locationType,
    customer_address: customerAddress,
    notes,
    status,
    amount,
    travel_fee: travelFee,
    total,
    service_name: serviceName,
    provider_name: providerName,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    paytota_purchase_id: paytotaPurchaseId,
    paytota_reference: paytotaReference,
    shared_booking_token: sharedBookingToken,
  });
}

function bookingPaymentUpdateToRow(updates: BookingPaymentUpdateInput): Record<string, unknown> {
  return stripUndefined({
    payment_status: updates.paymentStatus,
    paytota_purchase_id: updates.paytotaPurchaseId,
    paytota_reference: updates.paytotaReference,
    status: updates.status,
    updated_at: new Date().toISOString(),
  });
}

export async function createServiceBookingServer(
  booking: CreateServerBookingInput
): Promise<string> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Server booking creation requires SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = getSupabaseAdmin();
  const { id } = booking;

  const { error } = await supabase
    .from(TABLES.serviceBookings)
    .insert(createBookingInputToRow(booking));

  if (error) throw error;

  void import('@/lib/fcm/partner-alerts-server').then(({ notifyPartnerBooking }) =>
    notifyPartnerBooking(id)
  );

  return id;
}

export async function getServiceBookingServer(id: string): Promise<ServiceBooking | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.serviceBookings)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapBooking(data as Record<string, unknown>);
}

export async function getServiceBookingByPaytotaReference(
  reference: string
): Promise<ServiceBooking | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();

  const { data: byRef, error: refError } = await supabase
    .from(TABLES.serviceBookings)
    .select('*')
    .eq('paytota_reference', reference)
    .limit(1)
    .maybeSingle();

  if (refError) throw refError;
  if (byRef) return mapBooking(byRef as Record<string, unknown>);

  const { data: byId, error: idError } = await supabase
    .from(TABLES.serviceBookings)
    .select('*')
    .eq('id', reference)
    .maybeSingle();

  if (idError) throw idError;
  if (!byId) return null;
  return mapBooking(byId as Record<string, unknown>);
}

export async function updateServiceBookingPaymentServer(
  bookingId: string,
  updates: BookingPaymentUpdateInput
): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Server booking updates require SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(TABLES.serviceBookings)
    .update(bookingPaymentUpdateToRow(updates))
    .eq('id', bookingId);

  if (error) throw error;
}

export async function getBookedSlotsForProviderDateServer(
  providerId: string,
  date: string
): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.serviceBookings)
    .select('status, payment_status, time_slot')
    .eq('provider_id', providerId)
    .eq('date', date);

  if (error) throw error;

  const blocking = new Set(['pending', 'confirmed', 'in_progress', 'awaiting_payment']);

  return (data ?? [])
    .filter((row) => {
      const status = String(row.status ?? '');
      const paymentStatus = String(row.payment_status ?? '');
      if (status === 'cancelled') return false;
      if (paymentStatus === 'failed' || paymentStatus === 'cancelled') return false;
      return (
        blocking.has(status) ||
        paymentStatus === 'awaiting_payment' ||
        paymentStatus === 'paid'
      );
    })
    .map((row) => String(row.time_slot ?? ''))
    .filter(Boolean);
}
