import { randomBytes } from 'crypto';
import type { SharedBooking, SharedBookingPublicView } from '@/lib/types/shared-booking';
import { getRecipientFirstName } from '@/lib/shared-checkout-utils';

const SHARE_BOOKING_TTL_MS = 48 * 60 * 60 * 1000;

export function generateShareBookingToken(): string {
  return randomBytes(16).toString('base64url');
}

export function getShareBookingExpiryDate(from = new Date()): Date {
  return new Date(from.getTime() + SHARE_BOOKING_TTL_MS);
}

export function resolveSharedBookingStatus(
  booking: SharedBooking,
  now = new Date()
): SharedBooking['status'] {
  if (booking.status === 'paid') return 'paid';
  if (booking.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'pending';
}

export function locationLabelForBooking(
  locationType: SharedBooking['snapshot']['locationType'],
  address?: string
): string {
  if (locationType === 'mobile') {
    return address?.trim() ? `Home service · ${address.trim()}` : 'Home service';
  }
  return 'In studio';
}

export function toSharedBookingPublicView(shared: SharedBooking): SharedBookingPublicView {
  const status = resolveSharedBookingStatus(shared);
  const { snapshot } = shared;

  return {
    token: shared.id,
    status,
    bookingId: shared.bookingId,
    recipientFirstName: getRecipientFirstName(snapshot.customerName),
    serviceName: snapshot.serviceName,
    providerName: snapshot.providerName,
    date: snapshot.date,
    timeSlot: snapshot.timeSlot,
    locationType: snapshot.locationType,
    locationLabel: locationLabelForBooking(snapshot.locationType, snapshot.customerAddress),
    amount: snapshot.amount,
    travelFee: snapshot.travelFee,
    total: snapshot.total,
    durationMinutes: snapshot.durationMinutes,
    galleryImage: snapshot.galleryImage,
    senderMessage: shared.senderMessage,
    expiresAt: shared.expiresAt.toISOString(),
  };
}

export function generateBookingId(): string {
  return `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
