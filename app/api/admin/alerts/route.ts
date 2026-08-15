import { NextRequest, NextResponse } from 'next/server';
import {
  notifyAdminApprovalRequest,
  notifyAdminBooking,
  notifyAdminBulkOrder,
  notifyAdminContactMessage,
  notifyAdminFlaggedReview,
  notifyAdminOrder,
  notifyAdminWholesaleAccount,
} from '@/lib/firebase/partner-alerts-server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { type?: string; id?: string };
    const type = body.type;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (type === 'supplier' || type === 'provider') {
      await notifyAdminApprovalRequest(type, id);
      return NextResponse.json({ ok: true });
    }

    if (type === 'contact') {
      await notifyAdminContactMessage(id);
      return NextResponse.json({ ok: true });
    }

    if (type === 'flagged_review') {
      await notifyAdminFlaggedReview(id);
      return NextResponse.json({ ok: true });
    }

    if (type === 'order') {
      await notifyAdminOrder(id);
      return NextResponse.json({ ok: true });
    }

    if (type === 'booking') {
      await notifyAdminBooking(id);
      return NextResponse.json({ ok: true });
    }

    if (type === 'bulk_order') {
      await notifyAdminBulkOrder(id);
      return NextResponse.json({ ok: true });
    }

    if (type === 'wholesale_account') {
      await notifyAdminWholesaleAccount(id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error) {
    console.warn('[ShiQueen] admin alerts API:', error);
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
  }
}
