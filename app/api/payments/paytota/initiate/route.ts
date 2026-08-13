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
  useStkPush?: boolean;
  allowOfflineFallback?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InitiateBody;

    if (!body.email || !body.phone || !body.items?.length || !body.total) {
      return NextResponse.json({ error: 'Missing required checkout fields.' }, { status: 400 });
    }

    const orderId = body.orderId ?? generateOrderId();
    const appBaseUrl = getAppBaseUrl();
    const config = getPaytotaConfig();
    const phone = normalizeUgandaPhone(body.phone);

    const redirectQuery = `orderId=${encodeURIComponent(orderId)}`;
    const requiresClientOrder = !isFirebaseAdminConfigured();

    let purchase: Awaited<ReturnType<typeof createPaytotaPurchase>>;
    try {
      purchase = await createPaytotaPurchase({
        client: {
          email: body.email,
          phone,
          country: 'UG',
          full_name: body.customerName,
          city: body.shippingAddress?.city,
          street_address: body.shippingAddress?.address,
          zip_code: body.shippingAddress?.zipCode,
          state: body.shippingAddress?.state,
        },
        purchase: {
          currency: 'UGX',
          products: [
            ...body.items.map((item) => ({
              name: item.name.slice(0, 120),
              price: String(Math.round(item.price * item.quantity)),
            })),
            ...(body.tax > 0 ? [{ name: 'Tax', price: String(Math.round(body.tax)) }] : []),
          ],
        },
        reference: orderId,
        success_redirect: `${config.successRedirect}?${redirectQuery}`,
        failure_redirect: `${config.failureRedirect}?${redirectQuery}`,
        cancel_redirect: `${config.cancelRedirect}?${redirectQuery}`,
      });
    } catch (purchaseError) {
      if (body.allowOfflineFallback && isPaytotaNetworkError(purchaseError)) {
        const orderPayload = {
          id: orderId,
          userId: body.userId ?? null,
          customerName: body.customerName,
          email: body.email,
          items: body.items,
          subtotal: body.subtotal,
          tax: body.tax,
          total: body.total,
          shippingAddress: body.shippingAddress,
          orderType: body.orderType,
          paymentMethod: 'mobile_money' as const,
          paymentStatus: 'awaiting_payment' as const,
        };

        if (!requiresClientOrder) {
          const { createOrderServer } = await import('@/lib/firebase/orders-server');
          await createOrderServer(orderPayload);
        }

        return NextResponse.json({
          orderId,
          offlineFallback: true,
          requiresClientOrder,
          message:
            'Paytota is unreachable right now. Your order was saved — our team will contact you for mobile money payment.',
          returnUrl: `${appBaseUrl}/order-confirmation?orderId=${encodeURIComponent(orderId)}&payment=offline`,
        });
      }
      throw purchaseError;
    }

    if (!requiresClientOrder) {
      const { createOrderServer } = await import('@/lib/firebase/orders-server');
      await createOrderServer({
        id: orderId,
        userId: body.userId ?? null,
        customerName: body.customerName,
        email: body.email,
        items: body.items,
        subtotal: body.subtotal,
        tax: body.tax,
        total: body.total,
        shippingAddress: body.shippingAddress,
        orderType: body.orderType,
        paymentMethod: 'mobile_money',
        paymentStatus: 'awaiting_payment',
        paytotaPurchaseId: purchase.id,
        paytotaReference: purchase.reference ?? orderId,
      });
    }

    let stkResult = null;
    if (body.useStkPush) {
      try {
        stkResult = await executePaytotaStkPush(purchase.id);
      } catch (stkError) {
        console.warn('[ShiQueen] paytota STK push failed, falling back to checkout URL:', stkError);
      }
    }

    return NextResponse.json({
      orderId,
      purchaseId: purchase.id,
      checkoutUrl: purchase.checkout_url,
      status: purchase.status,
      stk: stkResult,
      requiresClientOrder,
      returnUrl: `${appBaseUrl}/order-confirmation?orderId=${encodeURIComponent(orderId)}`,
    });
  } catch (error) {
    console.error('[ShiQueen] paytota initiate:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate payment.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
