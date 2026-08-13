import { NextRequest, NextResponse } from 'next/server';
import { createSharedCheckout } from '@/lib/firebase/shared-checkouts-server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import {
  buildShippingAddressFromForm,
  generateShareCheckoutToken,
  getShareCheckoutExpiryDate,
  inferOrderTypeFromCart,
} from '@/lib/shared-checkout-utils';
import { toAbsoluteUrl } from '@/lib/site-url';
import type { CartItem } from '@/lib/cart-context';
import type { OrderItem, ShippingAddress } from '@/lib/types/database';

export const runtime = 'nodejs';

type ShareCheckoutBody = {
  cartItems: CartItem[];
  orderItems?: OrderItem[];
  subtotal: number;
  total: number;
  orderType?: 'retail' | 'wholesale' | 'package';
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  senderUserId?: string | null;
  senderMessage?: string;
};

function isValidShareBody(body: ShareCheckoutBody): body is ShareCheckoutBody & {
  orderItems: OrderItem[];
} {
  return (
    Array.isArray(body.cartItems) &&
    body.cartItems.length > 0 &&
    Array.isArray(body.orderItems) &&
    body.orderItems.length > 0 &&
    Boolean(body.fullName?.trim()) &&
    Boolean(body.email?.trim()) &&
    Boolean(body.phone?.trim()) &&
    Boolean(body.address?.trim()) &&
    typeof body.total === 'number' &&
    body.total > 0
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ShareCheckoutBody;

    if (!isValidShareBody(body)) {
      return NextResponse.json(
        { error: 'Please complete your delivery details and ensure your cart is not empty.' },
        { status: 400 }
      );
    }

    const shippingAddress: ShippingAddress = buildShippingAddressFromForm({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city ?? 'Kampala',
    });

    const token = generateShareCheckoutToken();
    const expiresAt = getShareCheckoutExpiryDate();
    const senderMessage = body.senderMessage?.trim().slice(0, 200);
    const sharePath = `/checkout/pay/${token}`;
    const orderType = body.orderType ?? inferOrderTypeFromCart(body.cartItems);

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({
        requiresClientStorage: true,
        token,
        shareUrl: toAbsoluteUrl(sharePath),
        sharePath,
        expiresAt: expiresAt.toISOString(),
        checkout: {
          cartItems: body.cartItems,
          orderItems: body.orderItems,
          subtotal: body.subtotal,
          total: body.total,
          orderType,
          recipientName: body.fullName.trim(),
          shippingAddress,
          senderUserId: body.senderUserId ?? null,
          senderMessage: senderMessage || undefined,
          expiresAt: expiresAt.toISOString(),
        },
      });
    }

    await createSharedCheckout({
      id: token,
      cartItems: body.cartItems,
      orderItems: body.orderItems,
      subtotal: body.subtotal,
      total: body.total,
      orderType,
      recipientName: body.fullName.trim(),
      shippingAddress,
      senderUserId: body.senderUserId ?? null,
      senderMessage: senderMessage || undefined,
      expiresAt,
    });

    return NextResponse.json({
      token,
      shareUrl: toAbsoluteUrl(sharePath),
      sharePath,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[ShiQueen] checkout share create:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create payment link.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
