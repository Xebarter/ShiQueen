import { NextResponse } from 'next/server';
import { checkPaytotaConnectivity } from '@/lib/paytota/client';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await checkPaytotaConnectivity();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Health check failed.';
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
