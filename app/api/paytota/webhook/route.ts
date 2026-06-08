import { NextRequest, NextResponse } from 'next/server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';

export const runtime = 'nodejs';
import { getPaytotaConfig } from '@/lib/paytota/config';

async function resolveWebhookPublicKey(): Promise<string> {
  const { webhookPublicKey, publicKeyUrl, secretKey } = getPaytotaConfig();
  if (webhookPublicKey.includes('BEGIN')) {
    return webhookPublicKey;
  }

  try {
    const response = await fetch(publicKeyUrl, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) return webhookPublicKey;
    const data = (await response.json()) as { public_key?: string };
    return data.public_key?.replace(/\\n/g, '\n').trim() ?? webhookPublicKey;
  } catch {
    return webhookPublicKey;
  }
}
import type { PaytotaWebhookPayload } from '@/lib/paytota/types';
import { verifyPaytotaWebhookSignature } from '@/lib/paytota/verify-signature';

function mapPaymentStatus(status: string): {
  paymentStatus: 'paid' | 'failed' | 'cancelled' | 'awaiting_payment';
  orderStatus?: 'processing' | 'cancelled' | 'pending';
} {
  switch (status) {
    case 'paid':
      return { paymentStatus: 'paid', orderStatus: 'processing' };
    case 'error':
      return { paymentStatus: 'failed', orderStatus: 'pending' };
    case 'cancelled':
      return { paymentStatus: 'cancelled', orderStatus: 'cancelled' };
    case 'pending':
    case 'pending_execute':
    case 'created':
    default:
      return { paymentStatus: 'awaiting_payment' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature');
    const webhookPublicKey = await resolveWebhookPublicKey();

    if (webhookPublicKey) {
      const valid = verifyPaytotaWebhookSignature(rawBody, signature, webhookPublicKey);
      if (!valid) {
        console.warn('[SheQueen] paytota webhook: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody) as PaytotaWebhookPayload;
    const reference = payload.reference;

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    if (!isFirebaseAdminConfigured()) {
      console.warn('[SheQueen] paytota webhook received but Firebase Admin is not configured.');
      return NextResponse.json({ received: true, updated: false });
    }

    const { getOrderByPaytotaReference, updateOrderPaymentServer } = await import(
      '@/lib/firebase/orders-server'
    );

    const order = await getOrderByPaytotaReference(reference);
    if (!order) {
      console.warn('[SheQueen] paytota webhook: order not found for reference', reference);
      return NextResponse.json({ received: true, updated: false });
    }

    const mapped = mapPaymentStatus(payload.status);

    await updateOrderPaymentServer(order.id, {
      paymentStatus: mapped.paymentStatus,
      paytotaPurchaseId: payload.id,
      paytotaReference: reference,
      ...(mapped.orderStatus ? { status: mapped.orderStatus } : {}),
    });

    return NextResponse.json({ received: true, updated: true, orderId: order.id });
  } catch (error) {
    console.error('[SheQueen] paytota webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
