import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFcmAdminApp, isFcmAdminConfigured } from '@/lib/fcm/admin';

export async function POST(request: Request) {
  if (!isFcmAdminConfigured()) {
    return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
  }

  try {
    const auth = getAuth(getFcmAdminApp());
    const decoded = await auth.verifyIdToken(idToken);
    const existing = decoded as { role?: string };
    if (existing.role === 'authenticated') {
      return NextResponse.json({ ok: true, updated: false });
    }

    const user = await auth.getUser(decoded.uid);
    await auth.setCustomUserClaims(decoded.uid, {
      ...(user.customClaims ?? {}),
      role: 'authenticated',
    });

    return NextResponse.json({ ok: true, updated: true });
  } catch (error) {
    console.error('[ensure-claims]', error);
    return NextResponse.json({ error: 'Could not verify Firebase token.' }, { status: 401 });
  }
}
