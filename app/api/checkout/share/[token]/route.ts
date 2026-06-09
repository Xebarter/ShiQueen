import { NextRequest, NextResponse } from 'next/server';
import { getSharedCheckoutById } from '@/lib/firebase/shared-checkouts-server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { toSharedCheckoutPublicView } from '@/lib/shared-checkout-utils';

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
      return NextResponse.json({ requiresClientRead: true });
    }

    const checkout = await getSharedCheckoutById(token.trim());

    if (!checkout) {
      return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 });
    }

    return NextResponse.json(toSharedCheckoutPublicView(checkout));
  } catch (error) {
    console.error('[SheQueen] checkout share get:', error);
    return NextResponse.json({ error: 'Failed to load payment link.' }, { status: 500 });
  }
}
