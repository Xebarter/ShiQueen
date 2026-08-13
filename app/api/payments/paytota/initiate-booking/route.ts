import { NextRequest, NextResponse } from 'next/server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import {
  createPaytotaPurchase,
  executePaytotaStkPush,
  isPaytotaNetworkError,
  normalizeUgandaPhone,
} from '@/lib/paytota/client';
import { getPaytotaConfig, getAppBaseUrl } from '@/lib/paytota/config';
import { generateBookingId } from '@/lib/shared-booking-utils';
import type { ServiceLocationType } from '@/lib/types/services';

export const runtime = 'nodejs';

type InitiateBookingBody = {
  bookingId?: string;
  userId?: string | null;
  serviceId: string;
  providerId: string;
  serviceName: string;
  providerName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  timeSlot: string;
  locationType: ServiceLocationType;
  customerAddress?: string;
  notes?: string;
  amount: number;
  travelFee?: number;
  total: number;
  useStkPush?: boolean;
  allowOfflineFallback?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InitiateBookingBody;

    if (
      !body.serviceId ||
      !body.providerId ||
      !body.serviceName ||
      !body.customerName?.trim() ||
      !body.customerPhone?.trim() ||
      !body.customerEmail?.trim() ||
      !body.date ||
      !body.timeSlot ||
      !body.total
    ) {
      return NextResponse.json({ error: 'Missing required booking fields.' }, { status: 400 });
    }

    const bookingId = body.bookingId?.trim() || generateBookingId();
    const travelFee = Math.max(0, Math.round(body.travelFee ?? 0));
    const amount = Math.max(0, Math.round(body.amount));
    const total = Math.max(0, Math.round(body.total));
    const appBaseUrl = getAppBaseUrl();
    const config = getPaytotaConfig();
    const phone = normalizeUgandaPhone(body.customerPhone);
    const redirectQuery = `bookingId=${encodeURIComponent(bookingId)}`;
    const requiresClientBooking = !isFirebaseAdminConfigured();

    const products = [
      {
        name: body.serviceName.slice(0, 120),
        price: String(amount),
      },
      ...(travelFee > 0
        ? [{ name: 'Travel fee', price: String(travelFee) }]
        : []),
    ];

    let purchase: Awaited<ReturnType<typeof createPaytotaPurchase>>;
    try {
      purchase = await createPaytotaPurchase({
        client: {
          email: body.customerEmail.trim(),
          phone,
          country: 'UG',
          full_name: body.customerName.trim(),
          street_address: body.customerAddress,
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
      if (body.allowOfflineFallback && isPaytotaNetworkError(purchaseError)) {
        const bookingPayload = {
          id: bookingId,
          serviceId: body.serviceId,
          providerId: body.providerId,
          userId: body.userId ?? null,
          customerName: body.customerName.trim(),
          customerPhone: body.customerPhone.trim(),
          customerEmail: body.customerEmail.trim(),
          date: body.date,
          timeSlot: body.timeSlot,
          locationType: body.locationType,
          customerAddress: body.customerAddress,
          notes: body.notes,
          status: 'pending' as const,
          amount,
          travelFee,
          total,
          serviceName: body.serviceName,
          providerName: body.providerName,
          paymentMethod: 'mobile_money' as const,
          paymentStatus: 'awaiting_payment' as const,
        };

        if (!requiresClientBooking) {
          const { createServiceBookingServer } = await import(
            '@/lib/firebase/service-bookings-server'
          );
          await createServiceBookingServer(bookingPayload);
        }

        return NextResponse.json({
          bookingId,
          offlineFallback: true,
          requiresClientBooking,
          message:
            'Paytota is unreachable right now. Your booking was saved — our team will contact you for mobile money payment.',
          returnUrl: `${appBaseUrl}/services/booking-confirmation?bookingId=${encodeURIComponent(bookingId)}&payment=offline`,
          booking: requiresClientBooking ? bookingPayload : undefined,
        });
      }
      throw purchaseError;
    }

    const bookingPayload = {
      id: bookingId,
      serviceId: body.serviceId,
      providerId: body.providerId,
      userId: body.userId ?? null,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerEmail: body.customerEmail.trim(),
      date: body.date,
      timeSlot: body.timeSlot,
      locationType: body.locationType,
      customerAddress: body.customerAddress,
      notes: body.notes,
      status: 'pending' as const,
      amount,
      travelFee,
      total,
      serviceName: body.serviceName,
      providerName: body.providerName,
      paymentMethod: 'mobile_money' as const,
      paymentStatus: 'awaiting_payment' as const,
      paytotaPurchaseId: purchase.id,
      paytotaReference: purchase.reference ?? bookingId,
    };

    if (!requiresClientBooking) {
      const { createServiceBookingServer, getServiceBookingServer } = await import(
        '@/lib/firebase/service-bookings-server'
      );
      const existing = await getServiceBookingServer(bookingId);
      if (existing) {
        const { updateServiceBookingPaymentServer } = await import(
          '@/lib/firebase/service-bookings-server'
        );
        await updateServiceBookingPaymentServer(bookingId, {
          paymentStatus: 'awaiting_payment',
          paytotaPurchaseId: purchase.id,
          paytotaReference: purchase.reference ?? bookingId,
        });
      } else {
        await createServiceBookingServer(bookingPayload);
      }
    }

    let stkResult = null;
    if (body.useStkPush !== false) {
      try {
        stkResult = await executePaytotaStkPush(purchase.id);
      } catch (stkError) {
        console.warn(
          '[ShiQueen] booking STK push failed, falling back to checkout URL:',
          stkError
        );
      }
    }

    return NextResponse.json({
      bookingId,
      purchaseId: purchase.id,
      checkoutUrl: purchase.checkout_url,
      status: purchase.status,
      stk: stkResult,
      requiresClientBooking,
      returnUrl: `${appBaseUrl}/services/booking-confirmation?bookingId=${encodeURIComponent(bookingId)}`,
      booking: requiresClientBooking ? bookingPayload : undefined,
    });
  } catch (error) {
    console.error('[ShiQueen] paytota initiate-booking:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate booking payment.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
