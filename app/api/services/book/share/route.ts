import { NextRequest, NextResponse } from 'next/server';
import { createSharedBookingServer } from '@/lib/firebase/shared-bookings-server';
import { createServiceBookingServer } from '@/lib/firebase/service-bookings-server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import {
  generateBookingId,
  generateShareBookingToken,
  getShareBookingExpiryDate,
} from '@/lib/shared-booking-utils';
import { toAbsoluteUrl } from '@/lib/site-url';
import type { SharedBookingSnapshot } from '@/lib/types/shared-booking';
import type { ServiceLocationType } from '@/lib/types/services';

export const runtime = 'nodejs';

type ShareBookingBody = {
  bookingId?: string;
  serviceId: string;
  providerId: string;
  serviceName: string;
  providerName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  timeSlot: string;
  locationType: ServiceLocationType;
  customerAddress?: string;
  notes?: string;
  amount: number;
  travelFee?: number;
  total: number;
  durationMinutes?: number;
  galleryImage?: string;
  senderUserId?: string | null;
  senderMessage?: string;
};

function isValidBody(body: ShareBookingBody): boolean {
  return Boolean(
    body.serviceId &&
      body.providerId &&
      body.serviceName?.trim() &&
      body.providerName?.trim() &&
      body.customerName?.trim() &&
      body.customerPhone?.trim() &&
      body.date &&
      body.timeSlot &&
      typeof body.total === 'number' &&
      body.total > 0
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ShareBookingBody;

    if (!isValidBody(body)) {
      return NextResponse.json(
        { error: 'Please complete booking details before creating a payment link.' },
        { status: 400 }
      );
    }

    if (body.locationType === 'mobile' && !body.customerAddress?.trim()) {
      return NextResponse.json(
        { error: 'Please enter an address for home service.' },
        { status: 400 }
      );
    }

    const bookingId = body.bookingId?.trim() || generateBookingId();
    const token = generateShareBookingToken();
    const expiresAt = getShareBookingExpiryDate();
    const travelFee = Math.max(0, Math.round(body.travelFee ?? 0));
    const amount = Math.max(0, Math.round(body.amount));
    const total = Math.max(0, Math.round(body.total));
    const senderMessage = body.senderMessage?.trim().slice(0, 200);
    const sharePath = `/services/book/pay/${token}`;

    const snapshot: SharedBookingSnapshot = {
      serviceId: body.serviceId,
      providerId: body.providerId,
      serviceName: body.serviceName.trim(),
      providerName: body.providerName.trim(),
      date: body.date,
      timeSlot: body.timeSlot,
      locationType: body.locationType,
      customerAddress: body.customerAddress?.trim() || undefined,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerEmail: body.customerEmail?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
      amount,
      travelFee,
      total,
      durationMinutes: body.durationMinutes,
      galleryImage: body.galleryImage,
    };

    const bookingPayload = {
      id: bookingId,
      serviceId: snapshot.serviceId,
      providerId: snapshot.providerId,
      userId: body.senderUserId ?? null,
      customerName: snapshot.customerName,
      customerPhone: snapshot.customerPhone,
      customerEmail: snapshot.customerEmail,
      date: snapshot.date,
      timeSlot: snapshot.timeSlot,
      locationType: snapshot.locationType,
      customerAddress: snapshot.customerAddress,
      notes: snapshot.notes,
      status: 'pending' as const,
      amount,
      travelFee,
      total,
      serviceName: snapshot.serviceName,
      providerName: snapshot.providerName,
      paymentMethod: 'mobile_money' as const,
      paymentStatus: 'awaiting_payment' as const,
      sharedBookingToken: token,
    };

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({
        requiresClientStorage: true,
        token,
        bookingId,
        shareUrl: toAbsoluteUrl(sharePath),
        sharePath,
        expiresAt: expiresAt.toISOString(),
        booking: bookingPayload,
        sharedBooking: {
          bookingId,
          snapshot,
          senderUserId: body.senderUserId ?? null,
          senderMessage: senderMessage || undefined,
          expiresAt: expiresAt.toISOString(),
        },
      });
    }

    await createServiceBookingServer(bookingPayload);
    await createSharedBookingServer({
      id: token,
      bookingId,
      snapshot,
      senderUserId: body.senderUserId ?? null,
      senderMessage: senderMessage || undefined,
      expiresAt,
    });

    return NextResponse.json({
      token,
      bookingId,
      shareUrl: toAbsoluteUrl(sharePath),
      sharePath,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[ShiQueen] booking share create:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create payment link.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
