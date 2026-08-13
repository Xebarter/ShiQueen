import { NextRequest, NextResponse } from 'next/server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const providerId = request.nextUrl.searchParams.get('providerId')?.trim();
    const date = request.nextUrl.searchParams.get('date')?.trim();

    if (!providerId || !date) {
      return NextResponse.json(
        { error: 'providerId and date are required.' },
        { status: 400 }
      );
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ slots: [], requiresClientRead: true });
    }

    const { getBookedSlotsForProviderDateServer } = await import(
      '@/lib/firebase/service-bookings-server'
    );
    const slots = await getBookedSlotsForProviderDateServer(providerId, date);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error('[ShiQueen] booking availability:', error);
    return NextResponse.json({ error: 'Failed to load availability.' }, { status: 500 });
  }
}
