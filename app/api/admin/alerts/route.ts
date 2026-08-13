import { NextRequest, NextResponse } from 'next/server';
import { notifyAdminApprovalRequest } from '@/lib/firebase/partner-alerts-server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { type?: string; id?: string };
    const type = body.type;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id || (type !== 'supplier' && type !== 'provider')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await notifyAdminApprovalRequest(type, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn('[SheQueen] admin alerts API:', error);
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
  }
}
