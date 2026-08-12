import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { stripUndefined } from '@/lib/firebase/sanitize';
import { resolveSharedBookingStatus } from '@/lib/shared-booking-utils';
import type { SharedBooking, SharedBookingSnapshot } from '@/lib/types/shared-booking';

export type CreateClientSharedBookingInput = {
  id: string;
  bookingId: string;
  snapshot: SharedBookingSnapshot;
  senderUserId?: string | null;
  senderMessage?: string;
  expiresAt: Date;
};

function toDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as Timestamp).toDate();
  }
  if (typeof value === 'string') return new Date(value);
  if (value instanceof Date) return value;
  return new Date();
}

function mapSharedBookingDoc(id: string, data: Record<string, unknown>): SharedBooking {
  const createdAt = toDate(data.createdAt);
  const expiresAt = toDate(data.expiresAt);
  const paidAt = data.paidAt ? toDate(data.paidAt) : undefined;

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

export async function createSharedBooking(
  input: CreateClientSharedBookingInput
): Promise<SharedBooking> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not initialized.');

  const { id, expiresAt, ...data } = input;

  await setDoc(doc(db, COLLECTIONS.sharedBookings, id), {
    ...stripUndefined(data),
    status: 'pending',
    expiresAt,
    createdAt: serverTimestamp(),
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

export async function getSharedBookingById(token: string): Promise<SharedBooking | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const snap = await getDoc(doc(db, COLLECTIONS.sharedBookings, token));
  if (!snap.exists()) return null;

  const shared = mapSharedBookingDoc(snap.id, snap.data());
  const resolvedStatus = resolveSharedBookingStatus(shared);

  if (resolvedStatus === 'expired' && shared.status === 'pending') {
    return { ...shared, status: 'expired' };
  }

  return { ...shared, status: resolvedStatus };
}

export async function markSharedBookingPaid(token: string, bookingId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not initialized.');

  const ref = doc(db, COLLECTIONS.sharedBookings, token);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    transaction.update(ref, {
      status: 'paid',
      bookingId,
      paidAt: serverTimestamp(),
    });
  });
}
