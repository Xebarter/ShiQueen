import { NextRequest, NextResponse } from 'next/server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { getSharedBookingByIdServer } from '@/lib/firebase/shared-bookings-server';
import { toSharedBookingPublicView } from '@/lib/shared-booking-utils';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    if (!token?.trim()) {
      return NextResponse.json({ error: 'Invalid payment link.' }, { status: 400 });
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ requiresClientRead: true, token: token.trim() });
    }

    const shared = await getSharedBookingByIdServer(token.trim());
    if (!shared) {
      return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 });
    }

    return NextResponse.json(toSharedBookingPublicView(shared));
  } catch (error) {
    console.error('[ShiQueen] booking share get:', error);
    return NextResponse.json({ error: 'Failed to load payment link.' }, { status: 500 });
  }
}
