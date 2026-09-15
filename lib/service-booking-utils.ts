import type { ServiceBooking, ServiceBookingStatus } from '@/lib/types/services';

/** Provider must accept a paid booking within this window. */
export const BOOKING_ACCEPT_TTL_MS = 2.5 * 60 * 1000;

/**
 * Acceptance clock starts when payment lands (`updatedAt` refreshes on pay).
 * Unpaid bookings are not acceptance-expired — they wait on payment separately.
 */
export function getServiceBookingAcceptDeadline(
  booking: Pick<ServiceBooking, 'updatedAt' | 'paymentStatus'>,
): Date | null {
  if (booking.paymentStatus !== 'paid') return null;
  return new Date(booking.updatedAt.getTime() + BOOKING_ACCEPT_TTL_MS);
}

export function resolveServiceBookingStatus(
  booking: Pick<
    ServiceBooking,
    'status' | 'updatedAt' | 'paymentStatus'
  >,
  now = new Date(),
): ServiceBookingStatus {
  if (booking.status !== 'pending') return booking.status;
  if (booking.paymentStatus !== 'paid') return booking.status;

  const deadline = getServiceBookingAcceptDeadline(booking);
  if (deadline && deadline.getTime() <= now.getTime()) {
    return 'expired';
  }

  return 'pending';
}

export function withResolvedServiceBookingStatus<T extends ServiceBooking>(
  booking: T,
  now = new Date(),
): T {
  const status = resolveServiceBookingStatus(booking, now);
  if (status === booking.status) return booking;
  return { ...booking, status };
}
