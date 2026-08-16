import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFcmAdminApp, isFcmAdminConfigured } from '@/lib/fcm/admin';
import { isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { relinkProfileByEmail } from '@/lib/supabase/relink-profile-server';

export async function POST(request: Request) {
  if (!isFcmAdminConfigured() || !isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Server auth is not configured.' }, { status: 503 });
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
    const decoded = await getAuth(getFcmAdminApp()).verifyIdToken(idToken);
    const email = decoded.email?.trim();
    if (!email) {
      return NextResponse.json({ error: 'Token has no email.' }, { status: 400 });
    }

    const result = await relinkProfileByEmail(
      decoded.uid,
      email,
      typeof decoded.name === 'string' ? decoded.name : undefined,
      typeof decoded.picture === 'string' ? decoded.picture : undefined
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[relink-profile]', error);
    return NextResponse.json({ error: 'Could not restore profile.' }, { status: 500 });
  }
}
