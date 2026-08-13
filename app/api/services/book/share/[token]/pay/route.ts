import { NextRequest, NextResponse } from 'next/server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import {
  createPaytotaPurchase,
  executePaytotaStkPush,
  isPaytotaNetworkError,
  normalizeUgandaPhone,
} from '@/lib/paytota/client';
import { getPaytotaConfig, getAppBaseUrl } from '@/lib/paytota/config';
import {
  getSharedBookingByIdServer,
  markSharedBookingPaidServer,
} from '@/lib/firebase/shared-bookings-server';
import {
  createServiceBookingServer,
  getServiceBookingServer,
  updateServiceBookingPaymentServer,
} from '@/lib/firebase/service-bookings-server';
import { resolveSharedBookingStatus } from '@/lib/shared-booking-utils';
import type { SharedBookingSnapshot } from '@/lib/types/shared-booking';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ token: string }>;
};

type ClientSharedSnapshot = {
  bookingId: string;
  snapshot: SharedBookingSnapshot;
  senderUserId?: string | null;
};

type PayBody = {
  fullName: string;
  email: string;
  phone: string;
  clientShared?: ClientSharedSnapshot;
};

function isValidClientShared(
  snapshot: ClientSharedSnapshot | undefined
): snapshot is ClientSharedSnapshot {
  return Boolean(
    snapshot &&
      snapshot.bookingId &&
      snapshot.snapshot?.serviceName &&
      snapshot.snapshot?.customerName &&
      typeof snapshot.snapshot.total === 'number' &&
      snapshot.snapshot.total > 0
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const body = (await request.json()) as PayBody;
    const requiresClientBooking = !isFirebaseAdminConfigured();

    if (!token?.trim()) {
      return NextResponse.json({ error: 'Invalid payment link.' }, { status: 400 });
    }

    if (!body.fullName?.trim() || !body.email?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { error: 'Please enter your name, email, and phone number.' },
        { status: 400 }
      );
    }

    let bookingId: string;
    let snapshot: SharedBookingSnapshot;
    let senderUserId: string | null = null;

    if (requiresClientBooking) {
      if (!isValidClientShared(body.clientShared)) {
        return NextResponse.json(
          { error: 'Payment link data is incomplete. Refresh the page and try again.' },
          { status: 400 }
        );
      }
      bookingId = body.clientShared.bookingId;
      snapshot = body.clientShared.snapshot;
      senderUserId = body.clientShared.senderUserId ?? null;
    } else {
      const stored = await getSharedBookingByIdServer(token.trim());
      if (!stored) {
        return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 });
      }

      const status = resolveSharedBookingStatus(stored);
      if (status === 'paid') {
        return NextResponse.json(
          {
            error: 'This booking has already been paid.',
            bookingId: stored.bookingId,
            alreadyPaid: true,
          },
          { status: 409 }
        );
      }
      if (status === 'expired') {
        return NextResponse.json(
          { error: 'This payment link has expired. Ask them to create a new one.' },
          { status: 410 }
        );
      }

      bookingId = stored.bookingId;
      snapshot = stored.snapshot;
      senderUserId = stored.senderUserId ?? null;
    }

    const appBaseUrl = getAppBaseUrl();
    const config = getPaytotaConfig();
    const payerPhone = normalizeUgandaPhone(body.phone);
    const redirectQuery = `bookingId=${encodeURIComponent(bookingId)}&gift=1`;

    const products = [
      {
        name: snapshot.serviceName.slice(0, 120),
        price: String(Math.round(snapshot.amount)),
      },
      ...(snapshot.travelFee > 0
        ? [{ name: 'Travel fee', price: String(Math.round(snapshot.travelFee)) }]
        : []),
    ];

    let purchase: Awaited<ReturnType<typeof createPaytotaPurchase>>;
    try {
      purchase = await createPaytotaPurchase({
        client: {
          email: body.email.trim(),
          phone: payerPhone,
          country: 'UG',
          full_name: body.fullName.trim(),
        },
        purchase: {
          currency: 'UGX',
          products,
        },
        reference: bookingId,
        success_redirect: `${config.successRedirect}?${redirectQuery}`,
        failure_redirect: `${config.failureRedirect}?${redirectQuery}`,
        cancel_redirect: `${config.cancelRedirect}?${redirectQuery}`,
      });
    } catch (purchaseError) {
      if (isPaytotaNetworkError(purchaseError)) {
        return NextResponse.json(
          {
            error:
              'Could not reach the payment provider. Please check your connection and try again.',
          },
          { status: 502 }
        );
      }
      throw purchaseError;
    }

    let stkResult = null;
    try {
      stkResult = await executePaytotaStkPush(purchase.id);
    } catch (stkError) {
      console.warn('[ShiQueen] booking gift STK failed, checkout URL fallback:', stkError);
    }

    const markPaidOnServer = stkResult?.status === 'success';
    const bookingPayload = {
      id: bookingId,
      serviceId: snapshot.serviceId,
      providerId: snapshot.providerId,
      userId: senderUserId,
      customerName: snapshot.customerName,
      customerPhone: snapshot.customerPhone,
      customerEmail: snapshot.customerEmail,
      date: snapshot.date,
      timeSlot: snapshot.timeSlot,
      locationType: snapshot.locationType,
      customerAddress: snapshot.customerAddress,
      notes: snapshot.notes,
      status: markPaidOnServer ? ('confirmed' as const) : ('pending' as const),
      amount: snapshot.amount,
      travelFee: snapshot.travelFee,
      total: snapshot.total,
      serviceName: snapshot.serviceName,
      providerName: snapshot.providerName,
      paymentMethod: 'mobile_money' as const,
      paymentStatus: markPaidOnServer
        ? ('paid' as const)
        : ('awaiting_payment' as const),
      paytotaPurchaseId: purchase.id,
      paytotaReference: purchase.reference ?? bookingId,
      sharedBookingToken: token.trim(),
    };

    if (!requiresClientBooking) {
      const existing = await getServiceBookingServer(bookingId);
      if (existing) {
        await updateServiceBookingPaymentServer(bookingId, {
          paymentStatus: bookingPayload.paymentStatus,
          paytotaPurchaseId: purchase.id,
          paytotaReference: purchase.reference ?? bookingId,
          status: bookingPayload.status,
        });
      } else {
        await createServiceBookingServer(bookingPayload);
      }

      if (markPaidOnServer) {
        await markSharedBookingPaidServer(token.trim(), bookingId);
      }
    }

    return NextResponse.json({
      bookingId,
      purchaseId: purchase.id,
      checkoutUrl: purchase.checkout_url,
      status: purchase.status,
      stk: stkResult,
      requiresClientBooking,
      requiresClientSharedUpdate: requiresClientBooking,
      markSharedBookingPaid: markPaidOnServer,
      returnUrl: `${appBaseUrl}/services/booking-confirmation?bookingId=${encodeURIComponent(bookingId)}&gift=1`,
      booking: requiresClientBooking ? bookingPayload : undefined,
    });
  } catch (error) {
    console.error('[ShiQueen] booking share pay:', error);
    const message = error instanceof Error ? error.message : 'Failed to start payment.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
