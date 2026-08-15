import { NextRequest, NextResponse } from 'next/server';
import {
  notifyPartnerBooking,
  notifyPartnerOrder,
} from '@/lib/firebase/partner-alerts-server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { type?: string; id?: string };
    const type = body.type;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id || (type !== 'order' && type !== 'booking')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (type === 'order') {
      await notifyPartnerOrder(id);
    } else {
      const { getServiceBookingServer } = await import(
        '@/lib/firebase/service-bookings-server'
      );
      const booking = await getServiceBookingServer(id);
      if (booking?.paymentStatus !== 'paid') {
        return NextResponse.json(
          { error: 'Booking alerts are only sent after payment.' },
          { status: 409 }
        );
      }
      await notifyPartnerBooking(id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn('[ShiQueen] partner alerts API:', error);
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
  }
}
