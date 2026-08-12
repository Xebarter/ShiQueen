import { COLLECTIONS } from '@/lib/firebase/collections';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { stripUndefined } from '@/lib/firebase/sanitize';
import { resolveSharedBookingStatus } from '@/lib/shared-booking-utils';
import type { SharedBooking, SharedBookingSnapshot } from '@/lib/types/shared-booking';

export type CreateSharedBookingInput = {
  id: string;
  bookingId: string;
  snapshot: SharedBookingSnapshot;
  senderUserId?: string | null;
  senderMessage?: string;
  expiresAt: Date;
};

function mapSharedBookingDoc(
  id: string,
  data: FirebaseFirestore.DocumentData
): SharedBooking {
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const expiresAt = data.expiresAt?.toDate?.() ?? createdAt;
  const paidAt = data.paidAt?.toDate?.();

  return {
    id,
    status: (data.status as SharedBooking['status']) ?? 'pending',
    bookingId: String(data.bookingId ?? ''),
    snapshot: data.snapshot as SharedBookingSnapshot,
    senderUserId: data.senderUserId ? String(data.senderUserId) : null,
    senderMessage: data.senderMessage ? String(data.senderMessage) : undefined,
    expiresAt,
    createdAt,
    paidAt,
  };
}

export async function createSharedBookingServer(
  input: CreateSharedBookingInput
): Promise<SharedBooking> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Shared booking requires FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const [{ FieldValue }, { getAdminDb }] = await Promise.all([
    import('firebase-admin/firestore'),
    import('@/lib/firebase/admin'),
  ]);

  const db = await getAdminDb();
  const { id, expiresAt, ...data } = input;

  await db.collection(COLLECTIONS.sharedBookings).doc(id).set({
    ...stripUndefined(data),
    status: 'pending' as const,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    id,
    status: 'pending',
    bookingId: input.bookingId,
    snapshot: input.snapshot,
    senderUserId: input.senderUserId ?? null,
    senderMessage: input.senderMessage,
    expiresAt: input.expiresAt,
    createdAt: new Date(),
  };
}

export async function getSharedBookingByIdServer(token: string): Promise<SharedBooking | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const { getAdminDb } = await import('@/lib/firebase/admin');
  const snap = await (await getAdminDb())
    .collection(COLLECTIONS.sharedBookings)
    .doc(token)
    .get();

  if (!snap.exists) return null;

  const shared = mapSharedBookingDoc(snap.id, snap.data()!);
  const resolvedStatus = resolveSharedBookingStatus(shared);

  if (resolvedStatus === 'expired' && shared.status === 'pending') {
    return { ...shared, status: 'expired' };
  }

  return { ...shared, status: resolvedStatus };
}

export async function markSharedBookingPaidByBookingId(bookingId: string): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;

  const { getAdminDb } = await import('@/lib/firebase/admin');
  const db = await getAdminDb();

  const snap = await db
    .collection(COLLECTIONS.sharedBookings)
    .where('bookingId', '==', bookingId)
    .limit(1)
    .get();

  if (snap.empty) return;

  const doc = snap.docs[0]!;
  await markSharedBookingPaidServer(doc.id, bookingId);
}

export async function markSharedBookingPaidServer(
  token: string,
  bookingId: string
): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Shared booking updates require FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const [{ FieldValue }, { getAdminDb }] = await Promise.all([
    import('firebase-admin/firestore'),
    import('@/lib/firebase/admin'),
  ]);

  await (await getAdminDb()).collection(COLLECTIONS.sharedBookings).doc(token).update({
    status: 'paid',
    bookingId,
    paidAt: FieldValue.serverTimestamp(),
  });
}
