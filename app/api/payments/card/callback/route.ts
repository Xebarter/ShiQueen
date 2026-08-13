import { NextRequest, NextResponse } from 'next/server';
import { parseCardGatewayRequest } from '@/lib/card-gateway/request';
import { settleCardPayment } from '@/lib/card-gateway/settle';

export const runtime = 'nodejs';

async function handleCallback(request: NextRequest) {
  try {
    const fields = await parseCardGatewayRequest(request);
    await settleCardPayment({ ...fields, retries: 1 });
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[SheQueen] card callback:', error);
    return new NextResponse('OK', { status: 200 });
  }
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}
