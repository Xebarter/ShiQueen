import { NextRequest, NextResponse } from 'next/server';
import { generateOrderId } from '@/lib/order-utils';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { quoteEnabledCheckout } from '@/lib/supabase/commerce-settings-server';
import type { OrderItem, ShippingAddress } from '@/lib/types/database';

export const runtime = 'nodejs';

type CodBody = {
  userId?: string | null;
  customerName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  orderType: 'retail' | 'wholesale' | 'package';
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CodBody;

    if (!body.email || !body.phone || !body.items?.length || !body.shippingAddress) {
      return NextResponse.json({ error: 'Missing required checkout fields.' }, { status: 400 });
    }

    const quoted = await quoteEnabledCheckout(body.items, 'cash_on_delivery');
    if (!quoted.ok) {
      return NextResponse.json({ error: quoted.error }, { status: quoted.status });
    }
    const { quote } = quoted;
    if (quote.total <= 0) {
      return NextResponse.json({ error: 'Order total must be greater than zero.' }, { status: 400 });
    }

    const orderId = generateOrderId();
    const requiresClientOrder = !isFirebaseAdminConfigured();
    const order = {
      id: orderId,
      userId: body.userId ?? null,
      customerName: body.customerName,
      email: body.email,
      items: body.items,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      shippingAddress: body.shippingAddress,
      status: 'pending' as const,
      orderType: body.orderType,
      paymentMethod: 'cash_on_delivery' as const,
      paymentStatus: 'cod_pending' as const,
    };

    if (!requiresClientOrder) {
      const { createOrderServer } = await import('@/lib/firebase/orders-server');
      await createOrderServer(order);
    }

    return NextResponse.json({
      orderId,
      requiresClientOrder,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      order: requiresClientOrder ? order : undefined,
    });
  } catch (error) {
    console.error('[ShiQueen] COD checkout:', error);
    const message = error instanceof Error ? error.message : 'Failed to place order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
