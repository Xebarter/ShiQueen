import { NextRequest, NextResponse } from 'next/server';
import { generateOrderId } from '@/lib/order-utils';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import {
  createPaytotaPurchase,
  executePaytotaStkPush,
  isPaytotaNetworkError,
  normalizeUgandaPhone,
} from '@/lib/paytota/client';
import { getPaytotaConfig, getAppBaseUrl } from '@/lib/paytota/config';
import {
  getSharedCheckoutById,
  markSharedCheckoutPaid,
  reserveSharedCheckoutForPayment,
} from '@/lib/firebase/shared-checkouts-server';
import { createOrderServer } from '@/lib/firebase/orders-server';
import { resolveSharedCheckoutStatus } from '@/lib/shared-checkout-utils';
import type { OrderItem, ShippingAddress } from '@/lib/types/database';
import type { SharedCheckout } from '@/lib/types/shared-checkout';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ token: string }>;
};

type ClientCheckoutSnapshot = {
  recipientName: string;
  shippingAddress: ShippingAddress;
  orderItems: OrderItem[];
  subtotal: number;
  total: number;
  orderType: SharedCheckout['orderType'];
  senderUserId?: string | null;
};

type PayBody = {
  fullName: string;
  email: string;
  phone: string;
  orderId?: string;
  clientCheckout?: ClientCheckoutSnapshot;
};

async function initiateGiftPayment(params: {
  orderId: string;
  payer: { fullName: string; email: string; phone: string };
  checkout: ClientCheckoutSnapshot;
}) {
  const appBaseUrl = getAppBaseUrl();
  const config = getPaytotaConfig();
  const payerPhone = normalizeUgandaPhone(params.payer.phone);
  const redirectQuery = `orderId=${encodeURIComponent(params.orderId)}&gift=1`;

  const purchase = await createPaytotaPurchase({
    client: {
      email: params.payer.email.trim(),
      phone: payerPhone,
      country: 'UG',
      full_name: params.payer.fullName.trim(),
      city: params.checkout.shippingAddress.city,
      street_address: params.checkout.shippingAddress.address,
      zip_code: params.checkout.shippingAddress.zipCode,
      state: params.checkout.shippingAddress.state,
    },
    purchase: {
      currency: 'UGX',
      products: params.checkout.orderItems.map((item) => ({
        name: item.name.slice(0, 120),
        price: String(Math.round(item.price * item.quantity)),
      })),
    },
    reference: params.orderId,
    success_redirect: `${config.successRedirect}?${redirectQuery}`,
    failure_redirect: `${config.failureRedirect}?${redirectQuery}`,
    cancel_redirect: `${config.cancelRedirect}?${redirectQuery}`,
  });

  let stkResult = null;
  try {
    stkResult = await executePaytotaStkPush(purchase.id);
  } catch (stkError) {
    console.warn('[SheQueen] gift pay STK failed, checkout URL fallback:', stkError);
  }

  return {
    purchase,
    stkResult,
    returnUrl: `${appBaseUrl}/order-confirmation?orderId=${encodeURIComponent(params.orderId)}&gift=1`,
  };
}

function isValidClientCheckout(
  snapshot: ClientCheckoutSnapshot | undefined
): snapshot is ClientCheckoutSnapshot {
  return Boolean(
    snapshot &&
      snapshot.recipientName?.trim() &&
      snapshot.shippingAddress &&
      Array.isArray(snapshot.orderItems) &&
      snapshot.orderItems.length > 0 &&
      typeof snapshot.total === 'number' &&
      snapshot.total > 0
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const body = (await request.json()) as PayBody;
    const requiresClientOrder = !isFirebaseAdminConfigured();

    if (!token?.trim()) {
      return NextResponse.json({ error: 'Invalid payment link.' }, { status: 400 });
    }

    if (!body.fullName?.trim() || !body.email?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { error: 'Please enter your name, email, and phone number.' },
        { status: 400 }
      );
    }

    let checkout: ClientCheckoutSnapshot;
    const orderId = body.orderId?.trim() || generateOrderId();

    if (requiresClientOrder) {
      if (!isValidClientCheckout(body.clientCheckout)) {
        return NextResponse.json(
          { error: 'Payment link data is incomplete. Refresh the page and try again.' },
          { status: 400 }
        );
      }
      checkout = body.clientCheckout;
    } else {
      const stored = await getSharedCheckoutById(token.trim());

      if (!stored) {
        return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 });
      }

      const status = resolveSharedCheckoutStatus(stored);

      if (status === 'paid') {
        return NextResponse.json(
          {
            error: 'This order has already been paid.',
            orderId: stored.orderId,
            alreadyPaid: true,
          },
          { status: 409 }
        );
      }

      if (status === 'expired') {
        return NextResponse.json(
          { error: 'This payment link has expired. Ask the sender to create a new one.' },
          { status: 410 }
        );
      }

      const reservation = await reserveSharedCheckoutForPayment(token.trim(), orderId);

      if (reservation === 'not_found') {
        return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 });
      }
      if (reservation === 'paid') {
        return NextResponse.json(
          { error: 'This order has already been paid.', alreadyPaid: true },
          { status: 409 }
        );
      }
      if (reservation === 'expired') {
        return NextResponse.json(
          { error: 'This payment link has expired. Ask the sender to create a new one.' },
          { status: 410 }
        );
      }
      if (reservation === 'in_progress') {
        return NextResponse.json(
          { error: 'A payment is already in progress for this link.' },
          { status: 409 }
        );
      }

      checkout = {
        recipientName: stored.recipientName,
        shippingAddress: stored.shippingAddress,
        orderItems: stored.orderItems,
        subtotal: stored.subtotal,
        total: stored.total,
        orderType: stored.orderType,
        senderUserId: stored.senderUserId ?? null,
      };
    }

    let paymentResult: Awaited<ReturnType<typeof initiateGiftPayment>>;
    try {
      paymentResult = await initiateGiftPayment({
        orderId,
        payer: {
          fullName: body.fullName,
          email: body.email,
          phone: body.phone,
        },
        checkout,
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

    const { purchase, stkResult, returnUrl } = paymentResult;
    const markPaidOnServer = stkResult?.status === 'success';

    if (!requiresClientOrder) {
      await createOrderServer({
        id: orderId,
        userId: checkout.senderUserId ?? null,
        customerName: checkout.recipientName,
        email: checkout.shippingAddress.email,
        items: checkout.orderItems,
        subtotal: checkout.subtotal,
        tax: 0,
        total: checkout.total,
        shippingAddress: checkout.shippingAddress,
        orderType: checkout.orderType,
        paymentMethod: 'mobile_money',
        paymentStatus: markPaidOnServer ? 'paid' : 'awaiting_payment',
        paytotaPurchaseId: purchase.id,
        paytotaReference: purchase.reference ?? orderId,
      });

      if (markPaidOnServer) {
        await markSharedCheckoutPaid(token.trim(), orderId);
      }
    }

    return NextResponse.json({
      orderId,
      purchaseId: purchase.id,
      checkoutUrl: purchase.checkout_url,
      status: purchase.status,
      stk: stkResult,
      requiresClientOrder,
      requiresClientCheckoutUpdate: requiresClientOrder,
      markSharedCheckoutPaid: markPaidOnServer,
      returnUrl,
      order: requiresClientOrder
        ? {
            id: orderId,
            userId: checkout.senderUserId ?? null,
            customerName: checkout.recipientName,
            email: checkout.shippingAddress.email,
            items: checkout.orderItems,
            subtotal: checkout.subtotal,
            tax: 0,
            total: checkout.total,
            shippingAddress: checkout.shippingAddress,
            status: markPaidOnServer ? ('processing' as const) : ('pending' as const),
            orderType: checkout.orderType,
            paymentMethod: 'mobile_money' as const,
            paymentStatus: markPaidOnServer ? ('paid' as const) : ('awaiting_payment' as const),
            paytotaPurchaseId: purchase.id,
            paytotaReference: purchase.reference ?? orderId,
          }
        : undefined,
    });
  } catch (error) {
    console.error('[SheQueen] checkout share pay:', error);
    const message = error instanceof Error ? error.message : 'Failed to start payment.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
