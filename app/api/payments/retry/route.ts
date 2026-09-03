import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { getOrderServer, updateOrderPaymentServer } from '@/lib/firebase/orders-server';
import {
  createPaytotaPurchase,
  executePaytotaStkPush,
  normalizeUgandaPhone,
} from '@/lib/paytota/client';
import { getPaytotaConfig, getAppBaseUrl } from '@/lib/paytota/config';
import { cardCheckoutRedirectUrl, isCardGatewayConfigured } from '@/lib/card-gateway/config';
import { createCardPaymentToken } from '@/lib/card-gateway/client';
import { gatewayProductLines } from '@/lib/commerce-settings';
import { quoteEnabledCheckout } from '@/lib/supabase/commerce-settings-server';
import { getOrderPayState } from '@/lib/payments/order-payment';
import type { Order, PaymentMethod } from '@/lib/types/database';

export const runtime = 'nodejs';

type RetryBody = {
  orderId?: string;
  paymentMethod?: PaymentMethod;
};

function orderQuote(order: Order) {
  const shipping = Math.max(0, order.total - order.subtotal - order.tax);
  return {
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    shipping,
    delivery: {
      fee: shipping,
      estimatedDays: '',
      free: shipping === 0,
    },
    taxQuote: {
      amount: order.tax,
      rate: 0,
      enabled: order.tax > 0,
      label: 'Tax',
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ error: 'Payment retry is unavailable.' }, { status: 503 });
    }

    const body = (await request.json()) as RetryBody;
    const orderId = body.orderId?.trim();
    if (!orderId) {
      return NextResponse.json({ error: 'Missing order.' }, { status: 400 });
    }

    const order = await getOrderServer(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const pay = getOrderPayState(order);
    if (pay.kind === 'paid' || pay.kind === 'cod') {
      return NextResponse.json({ error: 'Already paid.', alreadyPaid: true }, { status: 409 });
    }
    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order cancelled.' }, { status: 400 });
    }

    const method: PaymentMethod =
      body.paymentMethod === 'card' || body.paymentMethod === 'mobile_money'
        ? body.paymentMethod
        : order.paymentMethod === 'card'
          ? 'card'
          : 'mobile_money';

    const quoted = await quoteEnabledCheckout(order.items, method);
    if (!quoted.ok) {
      return NextResponse.json({ error: quoted.error }, { status: quoted.status });
    }

    const quote = orderQuote(order);
    const giftQuery = order.giftPayment ? '&gift=1' : '';
    const redirectQuery = `orderId=${encodeURIComponent(order.id)}${giftQuery}`;
    const appBaseUrl = getAppBaseUrl();
    const phone = order.shippingAddress?.phone || '';

    if (method === 'card') {
      if (!isCardGatewayConfigured()) {
        return NextResponse.json({ error: 'Card payments are unavailable.' }, { status: 503 });
      }

      const created = await createCardPaymentToken({
        amount: quote.total,
        companyRef: order.id,
        description: order.items[0]?.name
          ? `ShiQueen · ${order.items[0].name}`.slice(0, 120)
          : 'ShiQueen order',
        customerName: order.customerName,
        customerEmail: order.email,
        customerPhone: phone,
        customerCity: order.shippingAddress?.city,
        customerAddress: order.shippingAddress?.address,
      });

      await updateOrderPaymentServer(order.id, {
        paymentMethod: 'card',
        paymentStatus: 'awaiting_payment',
        cardTransToken: created.transToken,
        cardTransRef: created.transRef,
      });

      return NextResponse.json({
        orderId: order.id,
        checkoutUrl: cardCheckoutRedirectUrl(created.transToken),
        returnUrl: `${appBaseUrl}/order-confirmation?${redirectQuery}`,
      });
    }

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone.' }, { status: 400 });
    }

    const config = getPaytotaConfig();
    const purchase = await createPaytotaPurchase({
      client: {
        email: order.email,
        phone: normalizeUgandaPhone(phone),
        country: 'UG',
        full_name: order.customerName,
        city: order.shippingAddress?.city,
        street_address: order.shippingAddress?.address,
        zip_code: order.shippingAddress?.zipCode,
        state: order.shippingAddress?.state,
      },
      purchase: {
        currency: 'UGX',
        products: gatewayProductLines(order.items, quote),
      },
      reference: order.id,
      success_redirect: `${config.successRedirect}?${redirectQuery}`,
      failure_redirect: `${config.failureRedirect}?${redirectQuery}`,
      cancel_redirect: `${config.cancelRedirect}?${redirectQuery}`,
    });

    await updateOrderPaymentServer(order.id, {
      paymentMethod: 'mobile_money',
      paymentStatus: 'awaiting_payment',
      paytotaPurchaseId: purchase.id,
      paytotaReference: purchase.reference ?? order.id,
    });

    let stk = null;
    if (!order.giftPayment) {
      try {
        stk = await executePaytotaStkPush(purchase.id);
      } catch (stkError) {
        console.warn('[ShiQueen] retry STK failed, using checkout URL:', stkError);
      }
    }

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: purchase.checkout_url,
      stk,
      returnUrl: `${appBaseUrl}/order-confirmation?orderId=${encodeURIComponent(order.id)}${giftQuery}&payment=pending`,
    });
  } catch (error) {
    console.error('[ShiQueen] payment retry:', error);
    const message = error instanceof Error ? error.message : 'Could not retry payment.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
