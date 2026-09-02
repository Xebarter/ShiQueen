import { NextRequest, NextResponse } from 'next/server';
import { generateOrderId } from '@/lib/order-utils';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { cardCheckoutRedirectUrl, isCardGatewayConfigured } from '@/lib/card-gateway/config';
import { createCardPaymentToken } from '@/lib/card-gateway/client';
import { quoteEnabledCheckout } from '@/lib/supabase/commerce-settings-server';
import type { OrderItem, ShippingAddress } from '@/lib/types/database';

export const runtime = 'nodejs';

type InitiateBody = {
  userId?: string | null;
  customerName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: ShippingAddress;
  orderType: 'retail' | 'wholesale' | 'package';
  orderId?: string;
};

export async function POST(request: NextRequest) {
  try {
    if (!isCardGatewayConfigured()) {
      return NextResponse.json(
        {
          error:
            'Card payments are not available right now. Please use mobile money or cash on delivery.',
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as InitiateBody;

    if (!body.email || !body.phone || !body.items?.length) {
      return NextResponse.json({ error: 'Missing required checkout fields.' }, { status: 400 });
    }

    const quoted = await quoteEnabledCheckout(body.items, 'card');
    if (!quoted.ok) {
      return NextResponse.json({ error: quoted.error }, { status: quoted.status });
    }
    const { quote } = quoted;
    if (quote.total <= 0) {
      return NextResponse.json({ error: 'Order total must be greater than zero.' }, { status: 400 });
    }

    const orderId = body.orderId ?? generateOrderId();
    const requiresClientOrder = !isFirebaseAdminConfigured();
    const description = body.items[0]?.name
      ? `ShiQueen · ${body.items[0].name}`.slice(0, 120)
      : 'ShiQueen order';

    const created = await createCardPaymentToken({
      amount: quote.total,
      companyRef: orderId,
      description,
      customerName: body.customerName,
      customerEmail: body.email,
      customerPhone: body.phone,
      customerCity: body.shippingAddress?.city,
      customerAddress: body.shippingAddress?.address,
    });

    const checkoutUrl = cardCheckoutRedirectUrl(created.transToken);

    if (!requiresClientOrder) {
      const { createOrderServer } = await import('@/lib/firebase/orders-server');
      await createOrderServer({
        id: orderId,
        userId: body.userId ?? null,
        customerName: body.customerName,
        email: body.email,
        items: body.items,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        shippingAddress: body.shippingAddress,
        orderType: body.orderType,
        paymentMethod: 'card',
        paymentStatus: 'awaiting_payment',
        cardTransToken: created.transToken,
        cardTransRef: created.transRef,
      });
    }

    return NextResponse.json({
      orderId,
      checkoutUrl,
      transToken: created.transToken,
      transRef: created.transRef,
      requiresClientOrder,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
    });
  } catch (error) {
    console.error('[ShiQueen] card initiate:', error);
    const message = error instanceof Error ? error.message : 'Failed to start card payment.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
