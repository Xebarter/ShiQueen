import { NextRequest, NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/site-url';
import { parseCardGatewayRequest } from '@/lib/card-gateway/request';
import { settleCardPayment } from '@/lib/card-gateway/settle';

export const runtime = 'nodejs';

function redirectForOutcome(
  outcome: 'paid' | 'failed' | 'cancelled' | 'pending',
  orderId?: string
) {
  const base = getSiteUrl();
  const query = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
  const status = 303;
  if (outcome === 'paid') return NextResponse.redirect(`${base}/payments/success${query}`, status);
  if (outcome === 'pending') return NextResponse.redirect(`${base}/payments/pending${query}`, status);
  if (outcome === 'cancelled') return NextResponse.redirect(`${base}/payments/cancel${query}`, status);
  return NextResponse.redirect(`${base}/payments/failure${query}`, status);
}

async function handleReturn(request: NextRequest) {
  try {
    const fields = await parseCardGatewayRequest(request);
    const settled = await settleCardPayment({ ...fields, retries: 4 });
    return redirectForOutcome(settled.outcome, settled.orderId ?? fields.companyRef);
  } catch (error) {
    console.error('[ShiQueen] card return:', error);
    const orderId =
      request.nextUrl.searchParams.get('orderId') ??
      request.nextUrl.searchParams.get('CompanyRef') ??
      undefined;
    return redirectForOutcome('failed', orderId);
  }
}

export async function GET(request: NextRequest) {
  return handleReturn(request);
}

export async function POST(request: NextRequest) {
  return handleReturn(request);
}
