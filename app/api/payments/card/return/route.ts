import { NextRequest, NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/site-url';
import { parseCardGatewayRequest } from '@/lib/card-gateway/request';
import { settleCardPayment } from '@/lib/card-gateway/settle';

export const runtime = 'nodejs';

function redirectForOutcome(
  outcome: 'paid' | 'failed' | 'cancelled' | 'pending',
  orderId?: string,
  gift?: boolean
) {
  const base = getSiteUrl();
  const params = new URLSearchParams();
  if (orderId) params.set('orderId', orderId);
  if (gift) params.set('gift', '1');
  const query = params.toString() ? `?${params.toString()}` : '';
  const status = 303;
  if (outcome === 'paid') return NextResponse.redirect(`${base}/payments/success${query}`, status);
  if (outcome === 'pending') return NextResponse.redirect(`${base}/payments/pending${query}`, status);
  if (outcome === 'cancelled') return NextResponse.redirect(`${base}/payments/cancel${query}`, status);
  return NextResponse.redirect(`${base}/payments/failure${query}`, status);
}

async function resolveGiftFlag(orderId?: string, alreadyGift?: boolean): Promise<boolean> {
  if (alreadyGift) return true;
  if (!orderId) return false;
  try {
    const { getOrderServer } = await import('@/lib/firebase/orders-server');
    const order = await getOrderServer(orderId);
    return order?.giftPayment === true;
  } catch {
    return false;
  }
}

async function handleReturn(request: NextRequest) {
  try {
    const fields = await parseCardGatewayRequest(request);
    const settled = await settleCardPayment({ ...fields, retries: 4 });
    const gift = await resolveGiftFlag(settled.orderId ?? fields.companyRef, settled.giftPayment);
    return redirectForOutcome(settled.outcome, settled.orderId ?? fields.companyRef, gift);
  } catch (error) {
    console.error('[ShiQueen] card return:', error);
    const orderId =
      request.nextUrl.searchParams.get('orderId') ??
      request.nextUrl.searchParams.get('CompanyRef') ??
      undefined;
    const gift = await resolveGiftFlag(orderId);
    return redirectForOutcome('failed', orderId, gift);
  }
}

export async function GET(request: NextRequest) {
  return handleReturn(request);
}

export async function POST(request: NextRequest) {
  return handleReturn(request);
}
